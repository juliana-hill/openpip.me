"use client";

import Link from "next/link";
import { X } from "lucide-react";
import dialogStyles from "@/components/ui/Dialog.module.css";
import styles from "./AgentRunHistoryModal.module.css";

export type AgentRunEvent = {
  id: string;
  type: "queued" | "started" | "progress" | "worker_started" | "completed" | "failed";
  at: string;
  title: string;
  detail?: string;
};

export type AgentRun = {
  id: string;
  proposalId?: string;
  type?: string;
  title: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  workerJobId?: string;
  error?: string;
  events?: AgentRunEvent[];
};

type Props = Readonly<{ open: boolean; action: AgentRun | null; onClose: () => void }>;

const STATUS_LABEL: Record<AgentRun["status"], string> = {
  queued: "Queued",
  running: "Working",
  completed: "Completed",
  failed: "Needs attention",
};

function formatTime(value: string): string {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function dotClass(event: AgentRunEvent, current: boolean): string {
  if (current) return styles.dotCurrent;
  if (event.type === "completed") return styles.dotCompleted;
  if (event.type === "failed") return styles.dotFailed;
  if (event.type === "worker_started") return styles.dotWorker;
  if (event.type === "progress") return styles.dotProgress;
  return styles.dotNeutral;
}

export function AgentRunHistoryModal({ open, action, onClose }: Props) {
  if (!open || !action) return null;
  const events = action.events ?? [];
  const active = action.status === "queued" || action.status === "running";

  return <>
    <div className={dialogStyles.overlay} onClick={onClose} />
    <section className={`${dialogStyles.content} ${styles.content}`} role="dialog" aria-modal="true" aria-labelledby="agent-run-title">
      <button className={dialogStyles.closeBtn} onClick={onClose} aria-label="Close agent run history"><X size={16} /></button>
      <header className={dialogStyles.header}>
        <p className={styles.eyebrow}>Agent activity</p>
        <h2 className={dialogStyles.title} id="agent-run-title">{action.title}</h2>
        <p className={dialogStyles.description}>{STATUS_LABEL[action.status]} · {formatTime(action.completedAt ?? action.startedAt ?? action.createdAt)}</p>
      </header>

      <p className={styles.boundary}><strong>No external user-facing action</strong> has occurred from this run.</p>

      <div className={styles.scrollArea}>
        {events.length > 0 ? <ol className={styles.timeline} aria-label="Recorded action history">
          {events.map((event, index) => {
            const current = active && index === events.length - 1;
            return <li className={styles.event} key={event.id}>
              <span className={`${styles.dot} ${dotClass(event, current)}`} aria-hidden="true" />
              <time>{formatTime(event.at)}</time>
              <strong>{event.title}</strong>
              {event.detail && <p>{event.detail}</p>}
            </li>;
          })}
        </ol> : <section className={styles.legacy}>
          <strong>Detailed history is unavailable for this earlier run.</strong>
          <p>Recorded {formatTime(action.createdAt)}{action.startedAt ? ` · started ${formatTime(action.startedAt)}` : ""}{action.completedAt ? ` · finished ${formatTime(action.completedAt)}` : ""}.</p>
        </section>}

        {(action.workerJobId || action.error || action.proposalId) && <footer className={styles.meta}>
          {action.workerJobId && <span>Worker job: {action.workerJobId}</span>}
          {action.error && <span className={styles.error}>{action.error}</span>}
          {action.proposalId && <Link href={`/review/${encodeURIComponent(`proposal:${action.proposalId}`)}`}>Open proposal →</Link>}
        </footer>}
      </div>
    </section>
  </>;
}
