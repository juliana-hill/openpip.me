"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MapPin, Flag, Calendar, Route, History, BookMarked } from "lucide-react";
import Link from "next/link";
import { RouteAddressPickerSheet } from "./RouteAddressPickerSheet";
import { RouteCard } from "./RouteCard";
import type { RouteOption } from "@/types/routes";
import { deriveJobId } from "@/lib/jobId";
import { idbReadRoutes, idbReadSearchMeta, idbWriteSearchMeta } from "@/lib/idb";
import { postToSW } from "@/lib/sw";
import styles from "./RouteSearchPanel.module.css";

type RouteSearchPanelProps = Readonly<{
  initialOrigin?: string;
  initialDestination?: string;
}>;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function RouteSearchPanel({
  initialOrigin = "Incline Village, NV",
  initialDestination = "Palo Alto, CA",
}: RouteSearchPanelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [origin, setOrigin] = useState(searchParams.get("sdest") ?? initialOrigin);
  const [destination, setDestination] = useState(searchParams.get("edest") ?? initialDestination);
  const [date, setDate] = useState(searchParams.get("sdate") ?? "");
  const [routes, setRoutes] = useState<RouteOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pickerField, setPickerField] = useState<"origin" | "destination" | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    channelRef.current = new BroadcastChannel("route-jobs");
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.onmessage = async (event) => {
      const { type, jobId, hash, status, statusMessage: msg, routes: newRoutes, origin: o, destination: d, date: dt } = event.data as {
        type: string;
        jobId: string;
        hash?: string;
        status?: string;
        statusMessage?: string;
        routes?: RouteOption[];
        origin?: string;
        destination?: string;
        date?: string;
      };

      if (jobId !== currentJobIdRef.current) return;

      if (type === "JOB_UPDATE") {
        if (msg) setStatusMessage(msg);

        if (newRoutes && newRoutes.length > 0) {
          setRoutes(newRoutes);
        }

        if (status === "completed") {
          stopTimer();
          setLoading(false);
          setStatusMessage(null);
        }

        if (status === "failed") {
          setError("Route search failed.");
          stopTimer();
          setLoading(false);
          setStatusMessage(null);
        }
      }

      if (type === "JOB_404" && hash) {
        setStatusMessage("Reconnecting...");
        const partial = await idbReadRoutes(hash);
        await startJob(o ?? origin, d ?? destination, dt ?? date, partial ?? undefined);
      }
    };
  }, [origin, destination, date]); // re-bind when params change so retry closure is current

  const startTimer = (startedAtMs?: number) => {
    stopTimer();
    const initialElapsed = startedAtMs ? Math.floor((Date.now() - startedAtMs) / 1000) : 0;
    setElapsed(initialElapsed);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startJob = useCallback(async (
    org: string,
    dest: string,
    dt: string,
    partialResults?: RouteOption[],
  ) => {
    const hash = await deriveJobId(org, dest, dt);
    currentJobIdRef.current = hash;

    await idbWriteSearchMeta(hash, org, dest, dt);

    const startRes = await proxyFetch("/agent/compare-routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: org,
        destination: dest,
        date: dt || undefined,
        jobId: hash,
        localDate: new Date().toLocaleDateString("en-CA"),
        localTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
        partialResults: partialResults && partialResults.length > 0 ? partialResults : undefined,
      }),
    });

    const startData = await startRes.json();

    if (!startRes.ok) {
      setError(startData.error ?? "Route search failed.");
      stopTimer();
      setLoading(false);
      setStatusMessage(null);
      return;
    }

    await postToSW({
      type: "START_POLL",
      jobId: hash,
      hash,
      origin: org,
      destination: dest,
      date: dt,
    });
  }, []);

  const handleSearch = useCallback(async () => {
    const hash = await deriveJobId(origin, destination, date);

    setLoading(true);
    setError(null);
    setStatusMessage("Starting search...");

    const existingMeta = await idbReadSearchMeta(hash);
    startTimer(existingMeta?.ts);

    const cached = await idbReadRoutes(hash);
    if (cached && cached.length > 0) {
      setRoutes(cached);
    } else {
      setRoutes(null);
    }

    if (pathname === "/trips") {
      const params = new URLSearchParams();
      if (origin) params.set("sdest", origin);
      if (destination) params.set("edest", destination);
      if (date) params.set("sdate", date);
      router.replace(`/trips?${params.toString()}`, { scroll: false });
    }

    try {
      await startJob(origin, destination, date, cached ?? undefined);
    } catch (err) {
      console.error("Route search failed:", err);
      setError("Something went wrong. Check that services are running.");
      stopTimer();
      setLoading(false);
      setStatusMessage(null);
    }
  }, [origin, destination, date, router, pathname, startJob]);

  const autoSearched = useRef(false);
  useEffect(() => {
    if (autoSearched.current) return;
    const sd = searchParams.get("sdest");
    const ed = searchParams.get("edest");
    if (sd && ed) {
      autoSearched.current = true;
      handleSearch();
    }
  }, [searchParams, handleSearch]);

  const todayStr = (() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  })();

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            <Route style={{ width: 28, height: 28 }} />
            Compare Routes
          </h2>
          <p className={styles.pageDesc}>Find the most efficient way to your destination.</p>
        </div>
        <Link href="/trips/history" className={styles.historyBtn}>
          <History style={{ width: 15, height: 15 }} />
          History
        </Link>
      </div>

      <section className={styles.formCard}>
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Origin</label>
            <div className={styles.inputWrap}>
              <MapPin className={styles.inputIcon} style={{ width: 16, height: 16 }} />
              <input
                className={styles.input}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Where from?"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.pickerBtn}
                onClick={() => setPickerField("origin")}
                disabled={loading}
                aria-label="Pick from saved addresses"
              >
                <BookMarked style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Destination</label>
            <div className={styles.inputWrap}>
              <Flag className={styles.inputIcon} style={{ width: 16, height: 16 }} />
              <input
                className={styles.input}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where to?"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.pickerBtn}
                onClick={() => setPickerField("destination")}
                disabled={loading}
                aria-label="Pick from saved addresses"
              >
                <BookMarked style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Travel Date</label>
            <div className={styles.inputWrap}>
              <Calendar className={styles.inputIcon} style={{ width: 16, height: 16 }} />
              <input
                type="date"
                className={styles.input}
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <button
            className={styles.searchBtn}
            onClick={handleSearch}
            disabled={loading || !origin || !destination || !date}
          >
            {loading ? "Searching..." : "Find Routes"}
          </button>
        </div>
      </section>

      {loading && (
        <div className={styles.loadingSection}>
          {statusMessage && (
            <p className={styles.loadingStatus}>{statusMessage}</p>
          )}
          <div className={styles.loadingRow}>
            <span className={styles.spinner} />
            <span className={styles.elapsed}>{formatElapsed(elapsed)}</span>
          </div>
        </div>
      )}

      {routes && (
        <div className={styles.routeList}>
          {routes.map((route, i) => (
            <RouteCard key={i} option={route} travelDate={date || undefined} />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className={styles.errorMsg}>{error}</p>
      )}

      {!routes && !loading && !error && (
        <p className={styles.placeholder}>Enter your origin and destination to see options.</p>
      )}

      <RouteAddressPickerSheet
        open={pickerField !== null}
        title={pickerField === "origin" ? "Select Origin" : "Select Destination"}
        onClose={() => setPickerField(null)}
        onSelect={(address) => {
          if (pickerField === "origin") setOrigin(address);
          else setDestination(address);
          setPickerField(null);
        }}
      />
    </div>
  );
}
