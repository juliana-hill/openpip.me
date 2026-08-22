"use client";
import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./DashboardPage.module.css";
import cardStyles from "./InboxDashboardCard.module.css";

export function InboxDashboardCard({ style }: { style?: React.CSSProperties }) {
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    const localDate = new Date().toISOString().slice(0, 10);
    proxyFetch(`/agent/inbox/messages?localDate=${localDate}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { messages?: { unread: boolean; id: string }[] } | null) => {
        if (d?.messages) {
          const count = d.messages.filter((m) => m.unread && !m.id.startsWith("local_")).length;
          setUnread(count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Link href="/inbox" className={`${styles.card} ${styles.cardHalf}`} style={style}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Inbox</span>
        {unread != null && unread > 0 && (
          <span className={`${styles.badge} ${cardStyles.unreadBadge}`}>{unread} unread</span>
        )}
        <span className={styles.cardArrow}>→</span>
      </div>
      <p className={styles.emptyText}>
        {unread == null ? "Loading..." : unread === 0 ? "All caught up 🎉" : `${unread} unread message${unread === 1 ? "" : "s"}`}
      </p>
      <span className={styles.compareLink}>Compose or manage email →</span>
    </Link>
  );
}
