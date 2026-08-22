"use client";

import { type FC, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Route, Trash2, Plus } from "lucide-react";
import { idbListSearches, idbDeleteSearch, type SearchHistoryEntry } from "@/lib/idb";
import styles from "./RouteHistoryList.module.css";

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today ${time}`;
  if (isYesterday) return `Yesterday ${time}`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const RouteHistoryList: FC<{ className?: string }> = ({ className }) => {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  const loadEntries = useCallback(async () => {
    const list = await idbListSearches();
    setEntries(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = useCallback(async (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await idbDeleteSearch(hash);
    setEntries((prev) => prev.filter((s) => s.hash !== hash));
  }, []);

  const handleClick = useCallback((entry: SearchHistoryEntry) => {
    const params = new URLSearchParams();
    params.set("sdest", entry.origin);
    params.set("edest", entry.destination);
    if (entry.date) params.set("sdate", entry.date);
    router.push(`/trips?${params.toString()}`);
  }, [router]);

  const isEmpty = loaded && entries.length === 0;

  return (
    <div className={`${styles.list}${className ? ` ${className}` : ""}`}>
      <div className={styles.listHeader}>
        <h3 className={styles.historyLabel}>History</h3>
        <button onClick={() => router.push("/trips")} className={styles.newBtn}>
          <Plus style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div className={styles.scrollBody}>
        {isEmpty ? (
          <div className={styles.empty}>
            <Route className={styles.emptyIcon} style={{ width: 24, height: 24 }} />
            <p className={styles.emptyTitle}>No searches yet</p>
            <p className={styles.emptyHint}>Run a route comparison to see it here</p>
          </div>
        ) : (
          entries.map((entry) => {
            const label = `${entry.origin} → ${entry.destination}`;
            const badge = entry.routeCount > 0
              ? `${entry.routeCount} route${entry.routeCount !== 1 ? "s" : ""}`
              : "In progress";

            return (
              <button
                key={entry.hash}
                onClick={() => handleClick(entry)}
                className={styles.entryBtn}
              >
                <Route className={styles.entryIcon} style={{ width: 14, height: 14 }} />
                <div className={styles.entryContent}>
                  <p className={styles.entryLabel}>{label}</p>
                  <p className={styles.entryMeta}>
                    {formatTimestamp(entry.ts)}
                    {" · "}
                    <span className={entry.routeCount > 0 ? styles.badgeDone : styles.badgeInProgress}>
                      {badge}
                    </span>
                  </p>
                </div>
                <span
                  role="button"
                  onClick={(e) => handleDelete(entry.hash, e)}
                  className={styles.deleteBtn}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
