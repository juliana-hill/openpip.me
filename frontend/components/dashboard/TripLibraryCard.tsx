import { useEffect, useState } from "react";
import Link from "next/link";
import { proxyFetch } from "@/lib/proxy";
import type { InsightGatheringStatus } from "./StudyMeCard";
import styles from "./DashboardPage.module.css";

export function TripLibraryCard({ agentName, status }: { agentName: string; status: InsightGatheringStatus }) {
  const [building, setBuilding] = useState(false);
  const [built, setBuilt] = useState(false);
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = status.state === "queued" || status.state === "running";
  const ready = status.state === "completed";
  const progress = Math.max(0, Math.min(100, status.progress ?? 0));

  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    async function loadTrips() {
      try {
        const response = await proxyFetch("/agent/trips");
        if (!response.ok) return;
        const payload = await response.json() as { trips?: unknown[] };
        if (mounted) {
          const count = Array.isArray(payload.trips) ? payload.trips.length : 0;
          setTripCount(count);
          setBuilt(count > 0);
        }
      } catch {
        // The Trips page remains the source of truth if this dashboard card cannot load.
      }
    }
    void loadTrips();
    return () => { mounted = false; };
  }, [ready]);

  async function buildLibrary() {
    if (building || !ready) return;
    setBuilding(true);
    setError(null);
    try {
      const response = await proxyFetch("/agent/trips/sync", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { detail?: string } | null;
        setError(payload?.detail || "The trip library could not be built yet.");
        return;
      }
      const payload = await response.json() as { trips?: unknown[] };
      setTripCount(Array.isArray(payload.trips) ? payload.trips.length : 0);
      setBuilt(true);
    } catch {
      setError("The trip library could not be reached. Try again when you’re ready.");
    } finally {
      setBuilding(false);
    }
  }

  return (
    <section className={`${styles.assistantPrompt} ${styles.cardFull}`} style={{ animationDelay: "30ms" }} aria-live="polite">
      <div className={styles.assistantPromptContent}>
        <p className={styles.assistantPromptKicker}><span aria-hidden="true">✦</span> {agentName} travel planning</p>
        <h2 className={styles.assistantPromptTitle}>
          {running ? `Waiting for ${agentName} to finish studying you…` : ready ? built ? "Your trip library is ready" : "Build your trip library" : "Study Me needs to finish first"}
        </h2>
        <p className={styles.assistantPromptCopy}>
          {running
            ? "Once the historical index is complete, I’ll organize your past, current, and future trips from that shared context."
            : ready
              ? built
                ? `${tripCount ?? 0} saved trip${tripCount === 1 ? "" : "s"} organized from your indexed history.`
                : "Use the completed Study Me index as the starting point for a separate, read-only trip library."
              : "The trip library is gated until Study Me has finished building your indexed history."}
        </p>
        {running && <p className={styles.assistantPromptMeta}>{status.progress == null ? "Studying your history…" : `${progress}% complete`} · Trip planning is waiting</p>}
        {error && <p className={styles.assistantPromptMeta}>{error}</p>}
      </div>
      <div className={styles.assistantPromptActions}>
        {running ? (
          <div className={styles.pipelineStartRow}>
            <div aria-label="Trip planning is waiting for Study Me" style={{ width: 180, height: 6, borderRadius: 99, background: "var(--color-border)", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: "var(--color-accent, currentColor)", transition: "width 300ms ease" }} />
            </div>
          </div>
        ) : ready ? (
          <div className={styles.pipelineStartRow}>
            {built ? <Link href="/trips" className={styles.assistantPrimaryBtn}>Open trip library</Link> : <button type="button" className={styles.assistantPrimaryBtn} onClick={() => void buildLibrary()} disabled={building}>{building ? "Building…" : "Build trip library"}</button>}
          </div>
        ) : (
          <div className={styles.pipelineStartRow}><span className={styles.assistantPromptMeta}>Waiting for Study Me</span></div>
        )}
      </div>
    </section>
  );
}
