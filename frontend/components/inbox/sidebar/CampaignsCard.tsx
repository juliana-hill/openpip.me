"use client";
import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./SidebarCard.module.css";
import { CreateCampaignModal } from "../campaigns/CreateCampaignModal";

type Campaign = { id: string; name: string; status: "sending" | "completed" | "pending" | "failed" };

export function CampaignsCard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    proxyFetch("/agent/campaigns")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.campaigns) setCampaigns(d.campaigns.slice(0, 3)); })
      .catch(() => {});
  }, []);

  const statusClass: Record<string, string> = {
    sending: styles.statusSending,
    completed: styles.statusCompleted,
    pending: styles.statusPending,
    failed: styles.statusPending,
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h4 className={styles.label}>Campaigns</h4>
            {campaigns.length > 0 && <span className={styles.countBadge}>{campaigns.length} TOTAL</span>}
          </div>
          <Link href="/inbox/campaigns" className={styles.viewAll}>View all →</Link>
        </div>
        {campaigns.length > 0 && (
          <div className={styles.itemList}>
            {campaigns.map((c) => (
              <div key={c.id} className={styles.item}>
                <span className={styles.itemName}>{c.name}</span>
                <span className={`${styles.statusBadge} ${statusClass[c.status] ?? styles.statusPending}`}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
        <button className={styles.dashedBtn} onClick={() => setCreateOpen(true)}>
          + Create Campaign
        </button>
      </div>
      {createOpen && <CreateCampaignModal onClose={() => setCreateOpen(false)} onCreated={() => setCreateOpen(false)} />}
    </>
  );
}
