"use client";

import { X } from "lucide-react";
import dialogStyles from "@/components/ui/Dialog.module.css";
import styles from "./ExecutionProgressModal.module.css";

export type ExecutionSummary = { id: string; title: string; action: string; status: string; attempt: number };
export type ExecutionTick = {
  executing: ExecutionSummary | null;
  queuedCount: number;
  queued: ExecutionSummary[];
  completed: ExecutionSummary[];
  recoveredCount: number;
  retriedCount: number;
};

type Props = Readonly<{ open: boolean; tick: ExecutionTick | null; onClose: () => void }>;

function Row({ item, badge }: { item: ExecutionSummary; badge: string }) {
  return (
    <li className={styles.row}>
      <span className={styles.rowTitle}>{item.title}</span>
      <span className={styles.rowBadge}>{badge}{item.attempt > 1 ? ` · attempt ${item.attempt}` : ""}</span>
    </li>
  );
}

export function ExecutionProgressModal({ open, tick, onClose }: Props) {
  if (!open || !tick) return null;

  return <>
    <div className={dialogStyles.overlay} onClick={onClose} />
    <section className={`${dialogStyles.content} ${styles.content}`} role="dialog" aria-modal="true" aria-labelledby="execution-progress-title">
      <button className={dialogStyles.closeBtn} onClick={onClose} aria-label="Close execution progress"><X size={16} /></button>
      <header className={dialogStyles.header}>
        <p className={styles.eyebrow}>Background execution</p>
        <h2 className={dialogStyles.title} id="execution-progress-title">View Progress</h2>
        <p className={dialogStyles.description}>One approved action runs at a time — nothing here was ever sent or changed without your earlier approval.</p>
      </header>

      <div className={styles.scrollArea}>
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>
            <span className={`${styles.groupDot} ${styles.dotExecuting}`} aria-hidden="true" />
            Currently executing
          </h3>
          {tick.executing ? (
            <ul className={styles.list}><Row item={tick.executing} badge="Working" /></ul>
          ) : (
            <p className={styles.empty}>Nothing executing right now.</p>
          )}
        </section>

        <section className={styles.group}>
          <h3 className={styles.groupTitle}>
            <span className={`${styles.groupDot} ${styles.dotQueued}`} aria-hidden="true" />
            In queue ({tick.queuedCount})
          </h3>
          {tick.queued.length > 0 ? (
            <ul className={styles.list}>
              {tick.queued.map((item, index) => <Row key={item.id} item={item} badge={index === 0 ? "Up next" : `#${index + 1}`} />)}
            </ul>
          ) : (
            <p className={styles.empty}>Nothing else waiting.</p>
          )}
        </section>

        <section className={styles.group}>
          <h3 className={styles.groupTitle}>
            <span className={`${styles.groupDot} ${styles.dotCompleted}`} aria-hidden="true" />
            Recently completed
          </h3>
          {tick.completed.length > 0 ? (
            <ul className={styles.list}>
              {tick.completed.map((item) => <Row key={item.id} item={item} badge="Done" />)}
            </ul>
          ) : (
            <p className={styles.empty}>Nothing completed yet this session.</p>
          )}
        </section>

        {(tick.recoveredCount > 0 || tick.retriedCount > 0) && (
          <p className={styles.footnote}>
            {tick.recoveredCount > 0 && `Picked back up ${tick.recoveredCount} action${tick.recoveredCount === 1 ? "" : "s"} that looked stuck. `}
            {tick.retriedCount > 0 && `Retried ${tick.retriedCount} action${tick.retriedCount === 1 ? "" : "s"} that failed earlier.`}
          </p>
        )}
      </div>
    </section>
  </>;
}
