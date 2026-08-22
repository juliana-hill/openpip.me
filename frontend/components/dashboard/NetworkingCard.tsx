"use client";

import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Contact, ContactStatus } from "@/types/career";
import styles from "./DashboardPage.module.css";

const STATUS_LABELS: Record<ContactStatus, string> = {
  not_contacted: "Not contacted",
  connection_requested: "Req. sent",
  connected: "Connected",
  messaged: "Contacted",
  replied: "Replied",
  meeting_scheduled: "Meeting set",
  followed_up: "Followed up",
};

const STATUS_COLOR: Record<ContactStatus, string> = {
  not_contacted: "var(--color-text-muted)",
  connection_requested: "#a78bfa",
  connected: "#818cf8",
  messaged: "#3b82f6",
  replied: "var(--color-accent)",
  meeting_scheduled: "#34d399",
  followed_up: "#f59e0b",
};

export function NetworkingCard({ style }: { style?: React.CSSProperties }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proxyFetch("/agent/career/contacts")
      .then((r) => r.ok ? r.json() : { contacts: [] })
      .then((d: { contacts?: Contact[] }) => setContacts(d.contacts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const recent = contacts
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <Link href="/network" className={`${styles.card} ${styles.cardFull}`} style={style}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Networking</span>
        {contacts.length > 0 && (
          <span className={styles.badge}>{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</span>
        )}
        <span className={styles.cardArrow}>→</span>
      </div>

      {loading ? (
        <div className={styles.skeleton} />
      ) : recent.length === 0 ? (
        <p className={styles.emptyText}>No contacts yet — save someone from a find-people search</p>
      ) : (
        <div className={styles.contactList}>
          {recent.map((c) => (
            <div key={c.id} className={styles.contactRow}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: `color-mix(in srgb, ${STATUS_COLOR[c.status]} 15%, var(--color-bg))`,
                color: STATUS_COLOR[c.status],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "var(--font-size-sm)", fontWeight: 700,
              }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                  <span style={{
                    fontSize: "var(--font-size-xs)", fontWeight: 600,
                    color: STATUS_COLOR[c.status],
                    background: `color-mix(in srgb, ${STATUS_COLOR[c.status]} 12%, var(--color-bg))`,
                    padding: "1px 6px", borderRadius: 99, flexShrink: 0,
                  }}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                  {c.role} · {c.company}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
