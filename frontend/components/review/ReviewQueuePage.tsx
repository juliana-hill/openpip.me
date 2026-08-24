"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { proxyFetch } from "@/lib/proxy";
import { useAgentIdentity } from "@/lib/agentIdentity";
import { ExecutionProgressModal, type ExecutionTick } from "./ExecutionProgressModal";
import { ReviewHistoryModal } from "./ReviewHistoryModal";
import styles from "./ReviewQueuePage.module.css";

export type ReviewItem = {
  id: string;
  kind: "application" | "email" | "campaign" | "proposal";
  title: string;
  subtitle: string;
  summary: string;
  createdAt: string;
  category?: string;
  externalAction: {
    occurred: boolean;
    label: string;
    detail: string;
  };
};

const TYPE_LABEL: Record<ReviewItem["kind"], string> = {
  application: "Application",
  email: "Email draft",
  campaign: "Campaign",
  proposal: "Agent proposal",
};

export function ReviewQueuePage({ userName, userImage }: { userName: string; userImage: string }) {
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const { name: agentName } = useAgentIdentity();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState<ExecutionTick | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadItems = useCallback(() => {
    return proxyFetch("/agent/review")
      .then(async (response) => response.ok ? response.json() as Promise<{ items?: ReviewItem[] }> : { items: [] })
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    let active = true;
    void loadItems().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadItems]);

  // Drives approved proposals to execution one at a time while this page is
  // open (see execution_pipeline.py's tick — there's no server-side worker,
  // this polling *is* the mechanism). Keeps polling as long as there's
  // still something executing or waiting its turn, stops once idle so an
  // empty queue doesn't poll forever.
  const runTick = useCallback(async () => {
    try {
      const res = await proxyFetch("/agent/proposals/execution/tick", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json() as ExecutionTick;
      setTick(data);
      if (data.executing) void loadItems(); // a proposal just left "pending" or finished — refresh the list
      if (data.executing || data.queuedCount > 0) {
        if (!tickTimer.current) tickTimer.current = window.setInterval(() => { void runTick(); }, 2000);
      } else if (tickTimer.current) {
        window.clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
    } catch { /* the next scheduled poll retries; a transient failure here isn't worth surfacing */ }
  }, [loadItems]);

  useEffect(() => {
    void runTick();
    return () => { if (tickTimer.current) window.clearInterval(tickTimer.current); };
  }, [runTick]);

  const showExecutionCard = Boolean(tick && (tick.executing || tick.queuedCount > 0));

  return (
    <div className={styles.shell}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} backHref="/" backLabel="Home" />
      <main className={styles.page}>
        <div className={styles.heading}>
          <div className={styles.headingTop}>
            <div>
              <p className={styles.eyebrow}>Human decision needed</p>
              <h1>Ready for review</h1>
            </div>
            <button type="button" className={styles.historyBtn} onClick={() => setHistoryOpen(true)}>History</button>
          </div>
          <p>These are the outcomes your agent prepared. Nothing is sent or submitted without your approval.</p>
        </div>

        <ReviewHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />

        {showExecutionCard && tick && (
          <section className={styles.executionCard} aria-live="polite">
            <div>
              <p className={styles.executionKicker}><span aria-hidden="true">✦</span> {agentName} assistant</p>
              <h2 className={styles.executionTitle}>
                {tick.executing ? `Working on "${tick.executing.title}"` : "Picking up the next approved action"}
              </h2>
              <p className={styles.executionCopy}>
                {tick.queuedCount > 0
                  ? `${tick.queuedCount} more approved action${tick.queuedCount === 1 ? "" : "s"} waiting its turn.`
                  : "Finishing up — nothing else waiting."}
                {tick.recoveredCount > 0 && " Picked back up something that looked stuck."}
                {tick.retriedCount > 0 && " Retrying something that failed earlier."}
              </p>
              <button type="button" className={styles.viewProgressLink} onClick={() => setProgressOpen(true)}>View Progress</button>
            </div>
            <span className={styles.executionDot} aria-label="Executing" />
          </section>
        )}

        <ExecutionProgressModal open={progressOpen} tick={tick} onClose={() => setProgressOpen(false)} />

        {loading ? (
          <div className={styles.list} aria-label="Loading review items">
            {[0, 1, 2].map((index) => <div className={styles.skeleton} key={index} />)}
          </div>
        ) : items.length === 0 ? (
          <section className={styles.empty}>
            <span aria-hidden="true">✓</span>
            <h2>You&apos;re all caught up</h2>
            <p>When the agent prepares something that needs your decision, it will appear here.</p>
            <Link href="/" className={styles.homeLink}>Back to today</Link>
          </section>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <Link key={item.id} href={`/review/${encodeURIComponent(item.id)}`} className={styles.item}>
                <div className={styles.itemContent}>
                  <div className={styles.itemTop}>
                    <span className={styles.type}>{item.category ?? TYPE_LABEL[item.kind]}</span>
                    <time>{item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</time>
                  </div>
                  <h2>{item.title}</h2>
                  <div className={styles.metaRow}>
                    <span className={styles.meta}>{item.externalAction.label}: {item.externalAction.detail}</span>
                    <span className={styles.meta}>Prepared {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "recently"}</span>
                  </div>
                </div>
                <span className={styles.open}>Review <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <FloatingAssistant />
    </div>
  );
}
