"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import dialogStyles from "@/components/ui/Dialog.module.css";
import { proxyFetch } from "@/lib/proxy";
import styles from "./ReviewHistoryModal.module.css";

type HistoryItem = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  decidedAt: string | null;
  status: string;
  failureReason: string | null;
  executionReference: string | null;
};

/** What actually happened to this proposal — the gap that made the History
 * modal show a bare title/action/date list with no indication whether an
 * accepted proposal ever really executed, or why one failed. */
function describeResult(item: HistoryItem): string | null {
  switch (item.status) {
    case "executed":
      if (item.executionReference?.startsWith("gmail://drafts/")) return "Saved to Gmail Drafts";
      if (item.executionReference?.startsWith("mock://")) return "Completed";
      return item.executionReference ? `Completed — ${item.executionReference}` : "Completed";
    case "failed":
      return item.failureReason ? `Failed — ${item.failureReason}` : "Failed";
    case "executing":
      return "Still in progress";
    case "approved":
      return "Approved, not yet executed";
    default:
      return null;
  }
}

type Filter = "accepted" | "rejected";

type Props = Readonly<{ open: boolean; onClose: () => void }>;

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** "draft_reply" -> "Draft Reply", "task_followup" -> "Task Followup" —
 * every proposal action (draft_reply, task_followup, contact_followup,
 * inbox_pointer, task_complete, contact_track, save_draft, ...) reads as a
 * tag, not a raw snake_case string. */
function formatActionTag(action: string): string {
  return action
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function ReviewHistoryModal({ open, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>("accepted");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    proxyFetch(`/agent/review/history?decision=${filter}&limit=10`)
      .then(async (response) => response.ok ? response.json() as Promise<{ items?: HistoryItem[] }> : { items: [] })
      .then((data) => { if (active) setItems(data.items ?? []); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, filter]);

  if (!open) return null;

  return <>
    <div className={dialogStyles.overlay} onClick={onClose} />
    <section className={`${dialogStyles.content} ${styles.content}`} role="dialog" aria-modal="true" aria-labelledby="review-history-title">
      <button className={dialogStyles.closeBtn} onClick={onClose} aria-label="Close review history"><X size={16} /></button>
      <header className={dialogStyles.header}>
        <h2 className={dialogStyles.title} id="review-history-title">Review History</h2>
        <p className={dialogStyles.description}>Your last 10 decisions in each category.</p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Filter review history">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "accepted"}
          className={`${styles.tab} ${filter === "accepted" ? styles.tabActive : ""}`}
          onClick={() => setFilter("accepted")}
        >
          Accepted
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "rejected"}
          className={`${styles.tab} ${filter === "rejected" ? styles.tabActive : ""}`}
          onClick={() => setFilter("rejected")}
        >
          Rejected
        </button>
      </div>

      <div className={styles.scrollArea}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>No {filter} proposals yet.</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => {
              const result = describeResult(item);
              return (
                <li className={styles.row} key={item.id}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>{item.title}</span>
                    <span className={styles.rowTag}>{formatActionTag(item.subtitle)}</span>
                  </div>
                  <div className={styles.rowMeta}>
                    <time className={styles.rowDate}>{formatDate(item.decidedAt ?? item.createdAt)}</time>
                    {result && (
                      <span
                        className={`${styles.rowResult} ${
                          item.status === "failed"
                            ? styles.rowResultFailed
                            : item.status === "executed"
                              ? ""
                              : styles.rowResultPending
                        }`}
                      >
                        {result}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  </>;
}
