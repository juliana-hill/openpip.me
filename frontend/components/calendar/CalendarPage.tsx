"use client";

import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { RefreshCw } from "lucide-react";
import { CalendarList, type CalendarInfo } from "./CalendarList";
import { CalendarGrid } from "./CalendarGrid";
import styles from "./CalendarPage.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import skeletonStyles from "@/components/ui/Skeleton.module.css";

type Props = Readonly<{ userName: string; userImage: string }>;

const DAY_OPTIONS = [7, 14, 30] as const;

function monthRange(year: number, month: number): { from: string; days: number } {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 2, 0);
  const days = Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-01`, days };
}

export function CalendarPage({ userName, userImage }: Props) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const now = new Date();

  // Grid state — fetches by month
  const [gridYear, setGridYear] = useState(now.getFullYear());
  const [gridMonth, setGridMonth] = useState(now.getMonth());
  const [gridState, setGridState] = useState<"loading" | "populated" | "error">("loading");
  const [gridCalendars, setGridCalendars] = useState<CalendarInfo[]>([]);

  // Aside state — fetches by day range
  const [asideDays, setAsideDays] = useState<7 | 14 | 30>(7);
  const [asideState, setAsideState] = useState<"loading" | "populated" | "error">("loading");
  const [asideCalendars, setAsideCalendars] = useState<CalendarInfo[]>([]);
  const [asideError, setAsideError] = useState("");

  const fetchForMonth = useCallback(async (year: number, month: number) => {
    setGridYear(year);
    setGridMonth(month);
    setGridState("loading");
    const { from, days } = monthRange(year, month);
    try {
      const res = await proxyFetch(`/agent/calendars?from=${from}&days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { calendars: CalendarInfo[] };
      setGridCalendars(data.calendars);
      setGridState("populated");
    } catch {
      setGridState("error");
    }
  }, []);

  const fetchAside = useCallback(async (days: number) => {
    setAsideState("loading");
    setAsideError("");
    try {
      // Anchor to the browser's local date — the backend defaults to the
      // server's UTC date when `from` is omitted, which drifts a day off
      // near midnight for anyone not on UTC.
      const from = new Date().toLocaleDateString("en-CA");
      const res = await proxyFetch(`/agent/calendars?days=${days}&from=${from}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { calendars: CalendarInfo[] };
      setAsideCalendars(data.calendars);
      setAsideState("populated");
    } catch (err) {
      setAsideError(err instanceof Error ? err.message : "Unknown error");
      setAsideState("error");
    }
  }, []);

  useEffect(() => {
    fetchForMonth(now.getFullYear(), now.getMonth());
    fetchAside(7);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDaysChange = (days: 7 | 14 | 30) => {
    setAsideDays(days);
    fetchAside(days);
  };

  return (
    <>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle="My Calendars" />
      <PageShell>
        <div className={styles.layout}>
          {/* Monthly grid */}
          {gridState === "error" ? (
            <div className={styles.gridSkeleton} style={{ alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "var(--font-size-sm)", color: "#c02e2e", margin: 0 }}>Could not load calendar.</p>
              <button className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => fetchForMonth(gridYear, gridMonth)}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : (
            <CalendarGrid
              calendars={gridCalendars}
              year={gridYear}
              month={gridMonth}
              loading={gridState === "loading"}
              onMonthChange={fetchForMonth}
            />
          )}

          {/* Aside */}
          <div className={styles.aside}>
            <div className={styles.asideHeader}>
              <p className={styles.asideLabel}>Upcoming Events</p>
              <div style={{ display: "flex", gap: 6 }}>
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    className={`${btnStyles.btn} ${asideDays === d ? btnStyles.primary : btnStyles.secondary} ${btnStyles.sm}`}
                    onClick={() => handleDaysChange(d)}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {asideState === "loading" ? (
              <div className={styles.asideSkelList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.asideSkelItem}>
                    <div className={skeletonStyles.skeleton} style={{ width: 160, height: 14 }} />
                    <div className={skeletonStyles.skeleton} style={{ width: 120, height: 11, marginLeft: 16 }} />
                    <div className={skeletonStyles.skeleton} style={{ width: 90, height: 11, marginLeft: 16 }} />
                  </div>
                ))}
              </div>
            ) : asideState === "error" ? (
              <div style={{ textAlign: "center", paddingTop: 16 }}>
                <p style={{ fontSize: "var(--font-size-xs)", color: "#c02e2e", margin: "0 0 8px" }}>{asideError || "Could not load events."}</p>
                <button className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => fetchAside(asideDays)}>
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            ) : (
              <CalendarList calendars={asideCalendars} />
            )}
          </div>
        </div>
      </PageShell>
      <FloatingAssistant onAgentAction={() => { fetchForMonth(gridYear, gridMonth); fetchAside(asideDays); }} />
    </>
  );
}
