"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Clock } from "lucide-react";
import type { Contact, ContactStatus, Interaction } from "@/types/career";
import inputStyles from "@/components/ui/Input.module.css";
import { ContactHeader } from "./ContactHeader";
import { ContactStatusBar } from "./ContactStatusBar";
import { ContactNotes } from "./ContactNotes";
import { ContactOutreach } from "./ContactOutreach";
import { ContactPrep } from "./ContactPrep";
import btnStyles from "@/components/ui/Button.module.css";
import styles from "../../career/job-detail/JobDetailPage.module.css";

const CHANNELS: Array<{ value: Contact["preferredContact"]; label: string }> = [
  { value: "email", label: "Email" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "text", label: "Text" },
];

function localDateTimeString() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatInteractionDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

function ContactInfo({ contact, onPatch }: { contact: Contact; onPatch: (u: Partial<Contact>) => void }) {
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>
      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0 }}>Contact Info</p>
      <input
        className={inputStyles.input}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => { if (email !== (contact.email ?? "")) onPatch({ email: email.trim() || undefined }); }}
      />
      <input
        className={inputStyles.input}
        type="tel"
        placeholder="Phone / text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onBlur={() => { if (phone !== (contact.phone ?? "")) onPatch({ phone: phone.trim() || undefined }); }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0 }}>Preferred channel</p>
        <div style={{ display: "flex", gap: "8px" }}>
          {CHANNELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onPatch({ preferredContact: value })}
              style={{
                fontSize: "11px", fontWeight: 600, padding: "5px 12px",
                borderRadius: "var(--radius-pill)",
                border: contact.preferredContact === value ? "2px solid var(--color-accent)" : "2px solid var(--color-border)",
                background: contact.preferredContact === value ? "color-mix(in srgb, var(--color-accent) 12%, transparent)" : "transparent",
                color: contact.preferredContact === value ? "var(--color-accent)" : "var(--color-text-muted)",
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InteractionLog({
  interactions,
  onAdd,
}: {
  interactions: Interaction[];
  onAdd: (interaction: Omit<Interaction, "id">) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(localDateTimeString());
  const [notes, setNotes] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const handleAdd = () => {
    if (!date) return;
    onAdd({ date, notes: notes.trim() || undefined });
    setAdding(false);
    setNotes("");
    setDate(localDateTimeString());
  };

  const sorted = [...interactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px 0", borderTop: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0 }}>
          Interactions
        </p>
        {!adding && (
          <button
            type="button"
            className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`}
            onClick={() => { setAdding(true); setTimeout(() => notesRef.current?.focus(), 0); }}
          >
            <Plus size={13} /> Log
          </button>
        )}
      </div>

      {adding && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
          <input
            className={inputStyles.input}
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <textarea
            ref={notesRef}
            className={inputStyles.input}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={handleAdd} disabled={!date}>
              Save
            </button>
            <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !adding && (
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>No interactions logged yet.</p>
      )}

      {sorted.map((ix) => (
        <div key={ix.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <Clock size={12} style={{ color: "var(--color-text-muted)", marginTop: 2, flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
              {formatInteractionDate(ix.date)}
            </p>
            {ix.notes && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>{ix.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

type ContactDetailPageProps = Readonly<{ contactId: string }>;

export function ContactDetailPage({ contactId }: ContactDetailPageProps) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ status: ContactStatus; date: string } | null>(null);

  useEffect(() => {
    proxyFetch("/agent/career/contacts")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { contacts?: Contact[] } | null) => {
        const found = data?.contacts?.find((c) => c.id === contactId) ?? null;
        if (!found) setNotFound(true);
        else setContact(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [contactId]);

  const patchRaw = useCallback((body: Record<string, unknown>) => {
    proxyFetch(`/agent/career/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => { if (!r.ok) console.error("[patch] failed", r.status, body); })
      .catch((e) => console.error("[patch] error", e));
  }, [contactId]);

  const patch = useCallback((update: Partial<Contact>) => {
    setContact((prev) => prev ? { ...prev, ...update } : prev);
    patchRaw(update as Record<string, unknown>);
  }, [patchRaw]);

  const handleStatusChange = useCallback((status: ContactStatus) => {
    setPendingStatus({ status, date: localDateTimeString() });
  }, []);

  const confirmStatusChange = useCallback(() => {
    if (!pendingStatus) return;
    const interaction: Omit<Interaction, "id"> = { date: pendingStatus.date };
    patchRaw({ status: pendingStatus.status, addInteraction: { id: crypto.randomUUID(), ...interaction } });
    setContact((prev) => prev ? {
      ...prev,
      status: pendingStatus.status,
      lastInteractionDate: pendingStatus.date,
      interactions: [...(prev.interactions ?? []), { id: crypto.randomUUID(), date: pendingStatus.date }],
    } : prev);
    setPendingStatus(null);
  }, [pendingStatus, patchRaw]);

  const handleAddInteraction = useCallback((ix: Omit<Interaction, "id">) => {
    const interaction: Interaction = { id: crypto.randomUUID(), ...ix };
    patchRaw({ addInteraction: interaction });
    setContact((prev) => prev ? {
      ...prev,
      interactions: [...(prev.interactions ?? []), interaction],
      lastInteractionDate: interaction.date,
    } : prev);
  }, [patchRaw]);

  const handleDelete = useCallback(async () => {
    await proxyFetch(`/agent/career/contacts/${contactId}`, { method: "DELETE" }).catch(() => {});
    router.push("/network");
  }, [contactId, router]);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (notFound || !contact) return <div className={styles.loading}>Contact not found.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.stickyTop}>
        <ContactHeader contact={contact} />
        <ContactStatusBar status={contact.status} onStatusChange={handleStatusChange} />
        {pendingStatus && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--color-surface-raised)", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", flexShrink: 0 }}>When did this happen?</span>
            <input
              className={inputStyles.input}
              type="datetime-local"
              value={pendingStatus.date}
              onChange={(e) => setPendingStatus((p) => p ? { ...p, date: e.target.value } : p)}
              style={{ flex: 1 }}
            />
            <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={confirmStatusChange}>
              Save
            </button>
            <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={() => setPendingStatus(null)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          <ContactOutreach contact={contact} />
          <ContactPrep contact={contact} />
        </div>
        <div className={styles.right}>
          <ContactInfo contact={contact} onPatch={patch} />
          <ContactNotes contact={contact} onPatch={patch} />
          <InteractionLog interactions={contact.interactions ?? []} onAdd={handleAddInteraction} />
          <div className={styles.dangerZone}>
            <button
              type="button"
              className={`${btnStyles.btn} ${btnStyles.danger} ${btnStyles.sm}`}
              onClick={handleDelete}
            >
              <Trash2 size={13} /> Remove contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
