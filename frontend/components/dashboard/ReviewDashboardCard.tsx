"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { proxyFetch } from "@/lib/proxy";
import styles from "./DashboardPage.module.css";

type ReviewCountResponse = { items?: unknown[] };

export function ReviewDashboardCard({ style, className, onLoaded }: { style?: React.CSSProperties; className?: string; onLoaded?: () => void }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    proxyFetch("/agent/review")
      .then(async (response) => response.ok ? response.json() as Promise<ReviewCountResponse> : { items: [] })
      .then((data) => {
        if (!active) return;
        setCount(data.items?.length ?? 0);
        onLoaded?.();
      })
      .catch(() => {
        if (!active) return;
        setCount(0);
        onLoaded?.();
      });
    return () => { active = false; };
  }, [onLoaded]);

  return (
    <Link href="/review" className={`${styles.card} ${styles.cardHalf} ${className ?? ""}`} style={style}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Ready for review</span>
        <span className={styles.cardArrow}>→</span>
      </div>
      <p className={styles.outcomeMetric}>{count == null ? "Checking…" : count === 0 ? "All clear" : `${count} item${count === 1 ? "" : "s"}`}</p>
      <p className={styles.outcomeDescription}>
        {count == null ? "Checking the work your agent prepared." : count === 0 ? "Nothing needs your decision right now." : "Drafts, applications, and proposals waiting for your decision."}
      </p>
      <div className={styles.outcomeFooter}>
        <span style={count && count > 0 ? { color: "var(--color-accent)" } : undefined}>{count && count > 0 ? "These need your approval" : "You're up to date"}</span>
      </div>
    </Link>
  );
}
