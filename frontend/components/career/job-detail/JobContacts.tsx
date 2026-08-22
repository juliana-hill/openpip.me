"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback } from "react";
import { ExternalLink, Users, UserPlus, Check } from "lucide-react";
import type { Job } from "@/types/career";
import { CollapsiblePanel } from "./CollapsiblePanel";
import styles from "./panel.module.css";
import contactStyles from "./JobContacts.module.css";
import btnStyles from "@/components/ui/Button.module.css";

type Contact = {
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  url: string | null;
  source: string | null;
};

type JobContactsProps = Readonly<{ job: Job }>;

export function JobContacts({ job }: JobContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState<Set<number>>(new Set());

  const handleSave = useCallback(async (c: Contact, i: number) => {
    setSaving((prev) => new Set(prev).add(i));
    try {
      const res = await proxyFetch("/agent/career/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name,
          role: c.title ?? "Unknown role",
          company: c.company ?? job.company,
          email: c.email ?? undefined,
          linkedInUrl: c.url ?? undefined,
          source: "find_people",
        }),
      });
      if (res.ok) setSaved((prev) => new Set(prev).add(i));
    } finally {
      setSaving((prev) => { const s = new Set(prev); s.delete(i); return s; });
    }
  }, [job.company]);

  const handleFindPeople = useCallback(async () => {
    setLoading(true);
    setError(false);
    setContacts([]);
    try {
      const res = await proxyFetch("/agent/career/find-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: job.company, role: job.role }),
      });
      if (!res.ok) { setError(true); setLoading(false); return; }
      const { jobId } = await res.json() as { jobId: string };
      const sw = await navigator.serviceWorker.ready;
      sw.active?.postMessage({ type: "START_FIND_PEOPLE_POLL", jobId });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e: MessageEvent) {
        const msg = e.data as { type: string; jobId: string; status: string; contacts?: Contact[]; };
        if (msg.type !== "FIND_PEOPLE_UPDATE" || msg.jobId !== jobId) return;
        if (msg.status === "completed") { setContacts((msg.contacts ?? []).slice(0, 6)); setLoading(false); bc.removeEventListener("message", onMsg); bc.close(); }
        else if (msg.status === "failed") { setError(true); setLoading(false); bc.removeEventListener("message", onMsg); bc.close(); }
      });
    } catch { setError(true); setLoading(false); }
  }, [job.company, job.role]);

  const actions = (
    <button
      type="button"
      className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
      onClick={handleFindPeople}
      disabled={loading}
    >
      <Users size={13} />
      {loading ? "Searching…" : "Find People"}
    </button>
  );

  return (
    <CollapsiblePanel
      icon={<Users size={16} style={{ color: "var(--color-accent)" }} />}
      title="Network"
      actions={actions}
    >
      {loading && (
          <div className={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={contactStyles.skeletonRow}>
                <div className={contactStyles.skeletonAvatar} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className={styles.skeleton} style={{ width: "55%", height: 12 }} />
                  <div className={styles.skeleton} style={{ width: "75%", height: 10 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && <p className={styles.errorText}>Couldn&apos;t find contacts — try searching on LinkedIn directly.</p>}

        {!loading && !error && contacts.length === 0 && (
          <p className={styles.emptyText}>Click &quot;Find People&quot; to discover relevant contacts at {job.company}.</p>
        )}

      {!loading && !error && contacts.length > 0 && (
        <div className={contactStyles.list}>
          {contacts.map((c, i) => (
            <div key={i} className={contactStyles.row}>
              <div className={contactStyles.avatar}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className={contactStyles.info}>
                <p className={contactStyles.name}>{c.name}</p>
                {c.title && <p className={contactStyles.title}>{c.title}{c.company ? ` · ${c.company}` : ""}</p>}
                {c.email && <a href={`mailto:${c.email}`} className={contactStyles.email}>{c.email}</a>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className={contactStyles.link}>
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  type="button"
                  className={`${btnStyles.btn} ${saved.has(i) ? btnStyles.primary : btnStyles.ghost} ${btnStyles.sm}`}
                  onClick={() => handleSave(c, i)}
                  disabled={saved.has(i) || saving.has(i)}
                  title={saved.has(i) ? "Saved to contacts" : "Save to contacts"}
                >
                  {saved.has(i) ? <Check size={13} /> : <UserPlus size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsiblePanel>
  );
}
