"use client";

import styles from "./NotebookDashboard.module.css";

export type NoteItem = { id: string; title: string; notes: string | null; completed: boolean; due: string | null };

export type Reminder = {
  id: string;
  title: string;
  notes: string | null;
  reminderAt: string | null;
  items: NoteItem[];
};

// Extracts "(based on XXXX date)" or similar trailing date annotations from titles
const DATE_ANNOTATION = /\s*\(based on (.+?)\)\s*$/i;

function parseTitle(raw: string): { title: string; annotationYear: string | null } {
  const match = DATE_ANNOTATION.exec(raw);
  if (!match) return { title: raw, annotationYear: null };
  const yearMatch = /\b(\d{4})\b/.exec(match[1]);
  return { title: raw.slice(0, match.index).trim(), annotationYear: yearMatch ? yearMatch[1] : null };
}

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

type Props = { reminder: Reminder; onClick: () => void; isKeep?: boolean };

export function NoteCard({ reminder, onClick, isKeep }: Props) {
  const open = reminder.items.filter((i) => !i.completed).slice(0, 10);
  const doneCount = reminder.items.filter((i) => i.completed).length;

  return (
    <button className={`${styles.noteCard} ${isKeep ? styles.noteCardKeep : ""}`} onClick={onClick} type="button">
      {isKeep && <span className={styles.keepBadge}>From Keep</span>}
      <div className={styles.noteTitle}>{reminder.title}</div>
      {open.length > 0 ? (
        <ul className={styles.itemList}>
          {open.map((item) => {
            const { title, annotationYear } = parseTitle(item.title);
            const chip = item.due ? formatDue(item.due) : annotationYear;
            return (
              <li key={item.id} className={styles.itemWrapper}>
                <div className={styles.item}>
                  <span className={styles.checkbox} />
                  <span>{title}</span>
                </div>
                {chip && <span className={styles.dateChip}>{chip}</span>}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.noteBody} style={{ fontStyle: "italic" }}>No open tasks</p>
      )}
      {doneCount > 0 && (
        <p className={styles.doneCount}>{doneCount} completed</p>
      )}
    </button>
  );
}
