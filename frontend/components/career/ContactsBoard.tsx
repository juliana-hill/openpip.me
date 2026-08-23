"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useCallback } from "react";
import { ContactCard } from "./ContactCard";
import type { Contact, ContactStatus } from "@/types/career";
import styles from "./JobsBoard.module.css";

const STATUS_FILTERS: Array<{ value: ContactStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "not_contacted", label: "Not contacted" },
  { value: "connection_requested", label: "Req. sent" },
  { value: "connected", label: "Connected" },
  { value: "messaged", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "meeting_scheduled", label: "Meeting set" },
  { value: "followed_up", label: "Followed up" },
];

export function ContactsBoard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<ContactStatus | "all">("all");

  const fetchContacts = useCallback(async () => {
    try {
      const res = await proxyFetch("/agent/career/contacts");
      if (!res.ok) return;
      const data = await res.json() as { contacts?: Contact[] };
      setContacts(data.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const filtered = activeStatus === "all" ? contacts : contacts.filter((c) => c.status === activeStatus);

  return (
    <div className={styles.board}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.heading}>Contacts</h2>
          <div className={styles.subRow}>
            <p className={styles.subLabel}>{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className={styles.tabs}>
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveStatus(value)}
            className={`${styles.tab} ${activeStatus === value ? styles.tabActive : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contact list */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <>
          {filtered.length > 0 && (
            <div className={styles.jobGrid}>
              {filtered.map((c) => (
                <ContactCard key={c.id} contact={c} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginTop: 8 }}>
              {contacts.length === 0
                ? "No contacts tracked yet — the agent will propose adding someone here once it's worth following up with."
                : "No contacts with this status."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
