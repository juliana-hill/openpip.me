"use client";

import { useEffect, useState } from "react";
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
  date?: string;
  label?: string;
  labelSource?: string;
  deleteSuggested?: boolean;
  taskSuggested?: boolean;
  draft?: string;
  appliedAction?: string;
};

export type TriageRun = {
  id: string;
  completedAt?: string;
  status?: "completed" | "failed";
  total?: number;
  processed?: number;
  suggestions: TriageSuggestion[];
};

type Props = Readonly<{
  open: boolean;
  suggestions: TriageSuggestion[];
  currentRun?: TriageRun | null;
  history?: TriageRun[];
  onSaveChanges?: (runId: string, messageIds: string[]) => Promise<{ applied: { messageId: string }[]; failures: { messageId: string; error: string }[] }>;
  onMarkUnread?: (messageIds: string[]) => Promise<void>;
  onClose: () => void;
}>;

function formatRunDate(value?: string) {
  if (!value) return "Previous review";
  try {
    return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "Previous review";
  }
}

function formatMessageDate(value?: string) {
  if (!value) return "";
  try { return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  catch { return ""; }
}

function displaySuggestionLabel(suggestion: TriageSuggestion) {
  if (suggestion.deleteSuggested) return "Delete";
  if (suggestion.kind === "task" || suggestion.taskSuggested) return "Task";
  if (suggestion.kind === "reply") return "Reply";
  const label = suggestion.label;
  if (!label) return "";
  if (label === "OpenPip/Triage/Filed") return "Delete";
  if (label === "OpenPip/Triage/Reply") return "Reply";
  return label;
}

export function TriageDetailsModal({ open, suggestions, currentRun, history = [], onSaveChanges, onMarkUnread, onClose }: Props) {
  const [selectedRunId, setSelectedRunId] = useState<string>(currentRun?.id ?? "latest");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [markingUnread, setMarkingUnread] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedRunId(currentRun?.id ?? "latest");
      setHistoryOpen(false);
      setSelectedMessageIds(new Set());
      setSaveMessage(null);
      setMarkingUnread(false);
    }
  }, [open, currentRun?.id]);

  if (!open) return null;
  const selectedRun = selectedRunId === (currentRun?.id ?? "latest")
    ? currentRun
    : history.find((run) => run.id === selectedRunId);
  const displayedSuggestions = selectedRun?.suggestions ?? suggestions;
  const deletions = displayedSuggestions.filter((item) => item.deleteSuggested);
  const isCurrentRun = selectedRunId === (currentRun?.id ?? "latest");
  const selectedRunKey = selectedRun?.id ?? currentRun?.id ?? "latest";
  const toggleMessage = (messageId: string) => {
    setSelectedMessageIds((current) => {
      const next = new Set(current);
      if (next.has(messageId)) next.delete(messageId); else next.add(messageId);
      return next;
    });
  };
  const saveChanges = async () => {
    if (!onSaveChanges || !selectedMessageIds.size || saving) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const { applied, failures } = await onSaveChanges(selectedRunKey, Array.from(selectedMessageIds));
      // The request can resolve (HTTP 200) with some or all items in
      // `failures` — a bulk operation with per-item results, not an
      // all-or-nothing transaction — so the message has to reflect what the
      // response actually reports, not just that the request didn't throw.
      if (failures.length && !applied.length) {
        setSaveMessage(`Could not save ${failures.length === 1 ? "that change" : `any of the ${failures.length} changes`}: ${failures[0].error}`);
      } else if (failures.length) {
        setSaveMessage(`${applied.length} change${applied.length === 1 ? "" : "s"} saved, ${failures.length} could not be saved.`);
      } else {
        setSaveMessage(`${applied.length} change${applied.length === 1 ? "" : "s"} saved.`);
      }
      setSelectedMessageIds(new Set());
    } catch {
      setSaveMessage("Some changes could not be saved. Nothing was deleted automatically.");
    } finally {
      setSaving(false);
    }
  };
  const markAllUnread = async () => {
    if (!onMarkUnread || !displayedSuggestions.length || markingUnread) return;
    setMarkingUnread(true);
    setSaveMessage(null);
    try {
      await onMarkUnread(displayedSuggestions.map((item) => item.messageId));
      setSaveMessage(`${displayedSuggestions.length} message${displayedSuggestions.length === 1 ? "" : "s"} marked unread.`);
    } catch {
      setSaveMessage("Some messages could not be marked unread.");
    } finally {
      setMarkingUnread(false);
    }
  };

  return <>
    <div className={dialogStyles.overlay} onClick={onClose} />
    <section className={`${dialogStyles.content} ${styles.content}`} role="dialog" aria-modal="true" aria-labelledby="triage-details-title">
      <button className={dialogStyles.closeBtn} onClick={onClose} aria-label="Close triage details"><X size={16} /></button>
      <header className={dialogStyles.header}>
        <p className={styles.eyebrow}>Inbox assistant</p>
        <h2 className={dialogStyles.title} id="triage-details-title">Review details</h2>
        <p className={dialogStyles.description}>The assistant found {displayedSuggestions.length} item{displayedSuggestions.length === 1 ? "" : "s"} in this review. Nothing has been deleted.</p>
        {history.length > 0 && (
          <div className={styles.historyControls}>
            <button type="button" className={styles.historyButton} onClick={() => setHistoryOpen((openState) => !openState)} aria-expanded={historyOpen}>
              History ({history.length})
            </button>
            {historyOpen && (
              <div className={styles.historyMenu} role="menu">
                <button type="button" className={selectedRunId === (currentRun?.id ?? "latest") ? styles.historyItemActive : styles.historyItem} onClick={() => { setSelectedRunId(currentRun?.id ?? "latest"); setHistoryOpen(false); }} role="menuitem">
                  <strong>Current review</strong>
                  <span>{formatRunDate(currentRun?.completedAt)}</span>
                </button>
                {history.map((run) => (
                  <button type="button" className={selectedRunId === run.id ? styles.historyItemActive : styles.historyItem} key={run.id} onClick={() => { setSelectedRunId(run.id); setHistoryOpen(false); }} role="menuitem">
                    <strong>{run.status === "failed" ? "Incomplete review" : "Previous review"}</strong>
                    <span>{formatRunDate(run.completedAt)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      <div className={styles.boundary}>
        <strong>{deletions.length} deletion suggestion{deletions.length === 1 ? "" : "s"}</strong>
        <span>Deletion is irreversible, so review each message in the inbox before taking action.</span>
      </div>

      <div className={styles.scrollArea}>
        {displayedSuggestions.length ? <ul className={styles.list}>
          {displayedSuggestions.map((suggestion) => <li className={`${styles.item} ${isCurrentRun ? "" : styles.historyItemRow}`} key={suggestion.messageId}>
            {isCurrentRun && (
              <label className={styles.selectRow} aria-label={`Select ${suggestion.subject || "email"} to apply`}>
                <input
                  type="checkbox"
                  checked={selectedMessageIds.has(suggestion.messageId)}
                  disabled={Boolean(suggestion.appliedAction)}
                  onChange={() => toggleMessage(suggestion.messageId)}
                />
              </label>
            )}
            <div className={styles.rowMain}>
              <div className={styles.rowTop}>
                <span className={styles.sender}>{suggestion.sender || "OpenPip assistant"}</span>
              </div>
              <div className={styles.subject}>{suggestion.subject || "Email suggestion"}</div>
              <div className={styles.snippet}>{suggestion.reason}</div>
              {suggestion.draft && <pre className={styles.draft}>{suggestion.draft}</pre>}
              <span className={styles.messageId}>Message: {suggestion.messageId}</span>
            </div>
            <div className={styles.rowMeta}>
              {(suggestion.label || suggestion.deleteSuggested || suggestion.kind === "task" || suggestion.taskSuggested || suggestion.kind === "reply") && <span className={styles.label}>{displaySuggestionLabel(suggestion)}</span>}
              <span>{formatMessageDate(suggestion.date)}</span>
            </div>
          </li>)}
        </ul> : <p className={styles.empty}>No saved suggestions from this review.</p>}
      </div>
      {isCurrentRun && <footer className={styles.footer}>
        {saveMessage && <span className={styles.saveMessage} role="status">{saveMessage}</span>}
        <button type="button" className={styles.saveButton} disabled={!selectedMessageIds.size || saving} onClick={() => { void saveChanges(); }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </footer>}
      {!isCurrentRun && onMarkUnread && displayedSuggestions.length > 0 && <footer className={styles.footer}>
        {saveMessage && <span className={styles.saveMessage} role="status">{saveMessage}</span>}
        <button type="button" className={styles.saveButton} disabled={markingUnread} onClick={() => { void markAllUnread(); }}>
          {markingUnread ? "Marking…" : "Mark all unread"}
        </button>
      </footer>}
    </section>
  </>;
}
