"use client";

import { X } from "lucide-react";
import dialogStyles from "@/components/ui/Dialog.module.css";
import styles from "./TriageDetailsModal.module.css";

export type TriageSuggestion = {
  messageId: string;
  kind: "file" | "reply" | "task";
  action: string;
  reason: string;
  subject?: string;
  sender?: string;
  label?: string;
  labelSource?: string;
  deleteSuggested?: boolean;
  draft?: string;
};

type Props = Readonly<{
  open: boolean;
  suggestions: TriageSuggestion[];
  onClose: () => void;
}>;

export function TriageDetailsModal({ open, suggestions, onClose }: Props) {
  if (!open) return null;
  const deletions = suggestions.filter((item) => item.deleteSuggested);

  return <>
    <div className={dialogStyles.overlay} onClick={onClose} />
    <section className={`${dialogStyles.content} ${styles.content}`} role="dialog" aria-modal="true" aria-labelledby="triage-details-title">
      <button className={dialogStyles.closeBtn} onClick={onClose} aria-label="Close triage details"><X size={16} /></button>
      <header className={dialogStyles.header}>
        <p className={styles.eyebrow}>Inbox assistant</p>
        <h2 className={dialogStyles.title} id="triage-details-title">Review details</h2>
        <p className={dialogStyles.description}>The assistant found {suggestions.length} item{suggestions.length === 1 ? "" : "s"} to review. Nothing has been deleted.</p>
      </header>

      <div className={styles.boundary}>
        <strong>{deletions.length} deletion suggestion{deletions.length === 1 ? "" : "s"}</strong>
        <span>Deletion is irreversible, so review each message in the inbox before taking action.</span>
      </div>

      <div className={styles.scrollArea}>
        {suggestions.length ? <ul className={styles.list}>
          {suggestions.map((suggestion) => <li className={styles.item} key={suggestion.messageId}>
            <div className={styles.itemHeader}>
              <strong>{suggestion.deleteSuggested ? "Suggested deletion" : suggestion.action}</strong>
              {suggestion.label && <span className={styles.label}>{suggestion.label}</span>}
            </div>
            <div className={styles.subject}>{suggestion.subject || "Email suggestion"}</div>
            {suggestion.sender && <div className={styles.sender}>{suggestion.sender}</div>}
            <p>{suggestion.reason}</p>
            {suggestion.draft && <pre className={styles.draft}>{suggestion.draft}</pre>}
            <span className={styles.messageId}>Message: {suggestion.messageId}</span>
          </li>)}
        </ul> : <p className={styles.empty}>No saved suggestions from the latest review.</p>}
      </div>
    </section>
  </>;
}
