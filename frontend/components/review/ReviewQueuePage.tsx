"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { proxyFetch } from "@/lib/proxy";
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
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    proxyFetch("/agent/review")
      .then(async (response) => response.ok ? response.json() as Promise<{ items?: ReviewItem[] }> : { items: [] })
      .then((data) => { if (active) setItems(data.items ?? []); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className={styles.shell}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} backHref="/" backLabel="Home" />
      <main className={styles.page}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Human decision needed</p>
          <h1>Ready for review</h1>
          <p>These are the outcomes your agent prepared. Nothing is sent or submitted without your approval.</p>
        </div>

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
