"use client";
import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { CreateCampaignModal } from "./CreateCampaignModal";
import styles from "./CampaignsPage.module.css";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";

type Campaign = {
  id: string;
  name: string;
  status: "sending" | "completed" | "pending" | "failed";
  sent: number;
  failed: number;
  suppressed: number;
  recipients: number;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  sending: "Sending",
  pending: "Pending",
  failed: "Failed",
};

export function CampaignsPage({ userName, userImage }: { userName: string; userImage: string }) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await proxyFetch("/agent/campaigns");
      if (res.ok) {
        const d = await res.json() as { campaigns: Campaign[] };
        setCampaigns(d.campaigns ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalSent = campaigns.reduce((s, c) => s + (c.sent ?? 0), 0);
  const deliveryRate = totalSent > 0
    ? Math.round((totalSent / campaigns.reduce((s, c) => s + (c.recipients ?? 0), 0)) * 100)
    : 0;

  return (
    <div className={styles.shell}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle="Campaigns" backHref="/inbox" backLabel="Inbox" />
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Campaigns</h2>
          {campaigns.length > 0 && <span className={styles.count}>{campaigns.length}</span>}
        </div>
        <button className={styles.createBtn} onClick={() => setCreateOpen(true)}>+ Create Campaign</button>
      </div>

      {campaigns.length > 0 && (
        <div className={styles.statsStrip}>
          <span className={styles.statChip}>{totalSent} sent</span>
          <span className={styles.statChip}>{campaigns.length} campaigns</span>
          <span className={styles.statChip}>{deliveryRate}% delivery</span>
        </div>
      )}

      {loading ? (
        <div className={styles.list}>
          {[0, 1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className={styles.empty}>
          <p>No campaigns yet.</p>
          <button className={styles.createBtn} onClick={() => setCreateOpen(true)}>Create your first campaign</button>
        </div>
      ) : (
        <div className={styles.list}>
          {campaigns.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.campaignName}>{c.name}</span>
                <span className={`${styles.statusBadge} ${styles[`status_${c.status}`]}`}>
                  {STATUS_LABELS[c.status] ?? c.status}
                </span>
              </div>
              <div className={styles.statsRow}>
                <span className={`${styles.chip} ${styles.chipGreen}`}>✓ {c.sent ?? 0} sent</span>
                <span className={`${styles.chip} ${styles.chipRed}`}>✗ {c.failed ?? 0} failed</span>
                <span className={`${styles.chip} ${styles.chipMuted}`}>⊘ {c.suppressed ?? 0} suppressed</span>
                <span className={`${styles.chip} ${styles.chipMuted}`}>👤 {c.recipients ?? 0} recipients</span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.createdAt}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</span>
                <div className={styles.actions}>
                  {c.status === "pending" && (
                    <button className={styles.actionBtn} onClick={async () => {
                      await proxyFetch(`/agent/campaigns/${c.id}/send`, { method: "POST" });
                      load();
                    }}>Send</button>
                  )}
                  <button className={styles.actionBtn}>View Results</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && <CreateCampaignModal onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); load(); }} />}
      <FloatingAssistant />
    </div>
    </div>
  );
}
