"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useCallback } from "react";
import { Plus, Users, ExternalLink } from "lucide-react";
import { ContactCard } from "./ContactCard";
import type { Contact, ContactStatus } from "@/types/career";
import styles from "./JobsBoard.module.css";
import btnStyles from "@/components/ui/Button.module.css";

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

type FindResult = {
  name: string;
  title: string | null;
  company: string | null;
  url: string | null;
};

export function ContactsBoard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<ContactStatus | "all">("all");

  // Add contact inline
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLinkedIn, setNewLinkedIn] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Network search
  const [searchCompany, setSearchCompany] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FindResult[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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

  const handleAdd = useCallback(async () => {
    if (!newName.trim() || !newRole.trim() || !newCompany.trim()) return;
    setSaving(true);
    try {
      const res = await proxyFetch("/agent/career/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          role: newRole.trim(),
          company: newCompany.trim(),
          email: newEmail.trim() || undefined,
          linkedInUrl: newLinkedIn.trim() || undefined,
          source: "manual",
        }),
      });
      if (res.ok) {
        const data = await res.json() as { contact?: Contact };
        if (data.contact) setContacts((prev) => [data.contact!, ...prev]);
        setNewName(""); setNewRole(""); setNewCompany(""); setNewEmail(""); setNewLinkedIn("");
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  }, [newName, newRole, newCompany, newEmail, newLinkedIn]);

  const handleSaveFromSearch = useCallback(async (result: FindResult) => {
    const res = await proxyFetch("/agent/career/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.name,
        role: result.title ?? "Unknown role",
        company: result.company ?? searchCompany,
        linkedInUrl: result.url ?? undefined,
        source: "find_people",
      }),
    });
    if (res.ok) {
      const data = await res.json() as { contact?: Contact };
      if (data.contact) setContacts((prev) => [data.contact!, ...prev]);
    }
  }, [searchCompany]);

  const handleSearch = useCallback(async () => {
    if (!searchCompany.trim()) return;
    setSearching(true); setSearchError(false); setSearchResults([]);
    try {
      const res = await proxyFetch("/agent/career/find-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: searchCompany.trim(), role: searchRole.trim() }),
      });
      if (!res.ok) { setSearchError(true); setSearching(false); return; }
      const { jobId } = await res.json() as { jobId: string };
      const sw = await navigator.serviceWorker.ready;
      sw.active?.postMessage({ type: "START_FIND_PEOPLE_POLL", jobId });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e: MessageEvent) {
        const msg = e.data as { type: string; jobId: string; status: string; contacts?: FindResult[] };
        if (msg.type !== "FIND_PEOPLE_UPDATE" || msg.jobId !== jobId) return;
        if (msg.status === "completed") {
          setSearchResults((msg.contacts ?? []).slice(0, 8));
          setSearching(false);
          bc.removeEventListener("message", onMsg); bc.close();
        } else if (msg.status === "failed") {
          setSearchError(true); setSearching(false);
          bc.removeEventListener("message", onMsg); bc.close();
        }
      });
    } catch { setSearchError(true); setSearching(false); }
  }, [searchCompany, searchRole]);

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
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => { setShowSearch((v) => !v); setAdding(false); }}
          >
            <Users style={{ width: 14, height: 14 }} /> Network Search
          </button>
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

      {/* Network search panel */}
      {showSearch && (
        <div className={styles.addForm} style={{ marginBottom: 16 }}>
          <div className={styles.addFields}>
            <input
              autoFocus
              placeholder="Company name"
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className={styles.addInput}
            />
            <input
              placeholder="Role (optional)"
              value={searchRole}
              onChange={(e) => setSearchRole(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className={styles.addInput}
            />
          </div>
          <div className={styles.addBtns}>
            <button
              type="button"
              className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`}
              onClick={handleSearch}
              disabled={searching || !searchCompany.trim()}
            >
              <Users size={13} /> {searching ? "Searching…" : "Find People"}
            </button>
            <button
              type="button"
              className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`}
              onClick={() => { setShowSearch(false); setSearchResults([]); setSearchCompany(""); setSearchRole(""); }}
            >
              Cancel
            </button>
          </div>
          {searchError && (
            <p style={{ fontSize: "var(--font-size-xs)", color: "#e5383b", margin: "8px 0 0" }}>
              Couldn't find people — try searching on LinkedIn directly.
            </p>
          )}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {searchResults.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--color-bg)", borderRadius: 10, border: "1px solid var(--color-border)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "var(--font-size-sm)", color: "var(--color-accent)", flexShrink: 0 }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>{r.name}</p>
                    {r.title && <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{r.title}{r.company ? ` · ${r.company}` : ""}</p>}
                  </div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-muted)", display: "flex" }}>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    type="button"
                    className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
                    onClick={() => handleSaveFromSearch(r)}
                  >
                    Save
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact list */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <>
          {/* Add Contact inline card */}
          {!adding ? (
            <div className={styles.addPrompt} onClick={() => { setAdding(true); setShowSearch(false); }}>
              <div className={styles.addIcon}><Plus style={{ width: 16, height: 16 }} /></div>
              <p className={styles.addLabel}>Add Contact</p>
            </div>
          ) : (
            <div className={styles.addForm}>
              <div className={styles.addFields}>
                <input autoFocus placeholder="Name *" value={newName} onChange={(e) => setNewName(e.target.value)} className={styles.addInput} />
                <input placeholder="Role *" value={newRole} onChange={(e) => setNewRole(e.target.value)} className={styles.addInput} />
                <input placeholder="Company *" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className={styles.addInput} />
                <input placeholder="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={styles.addInput} />
                <input placeholder="LinkedIn URL" value={newLinkedIn} onChange={(e) => setNewLinkedIn(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }} className={styles.addInput} />
              </div>
              <div className={styles.addBtns}>
                <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={handleAdd} disabled={saving || !newName.trim() || !newRole.trim() || !newCompany.trim()}>
                  {saving ? "Saving…" : "Add"}
                </button>
                <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={() => { setAdding(false); setNewName(""); setNewRole(""); setNewCompany(""); setNewEmail(""); setNewLinkedIn(""); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Contact grid */}
          {filtered.length > 0 && (
            <div className={styles.jobGrid}>
              {filtered.map((c) => (
                <ContactCard key={c.id} contact={c} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginTop: 8 }}>
              {contacts.length === 0 ? "No contacts yet — add one or run a network search." : "No contacts with this status."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
