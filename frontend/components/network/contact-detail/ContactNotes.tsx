"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";
import type { Contact } from "@/types/career";
import { CollapsiblePanel } from "../../career/job-detail/CollapsiblePanel";
import styles from "../../career/job-detail/panel.module.css";

type ContactNotesProps = Readonly<{ contact: Contact; onPatch: (update: Partial<Contact>) => void }>;

export function ContactNotes({ contact, onPatch }: ContactNotesProps) {
  const [notes, setNotes] = useState(contact.notes ?? "");
  return (
    <CollapsiblePanel icon={<StickyNote size={16} style={{ color: "var(--color-accent)" }} />} title="Private Notes">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => { if (notes !== (contact.notes ?? "")) onPatch({ notes }); }}
        placeholder="Add private notes — how you met, context, follow-up reminders…"
        rows={5}
        className={styles.textarea}
      />
    </CollapsiblePanel>
  );
}
