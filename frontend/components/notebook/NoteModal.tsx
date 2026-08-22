"use client";

import { proxyFetch } from "@/lib/proxy";
import { useRef, useState } from "react";
import type { NoteItem, Reminder } from "./NoteCard";

const DATE_ANNOTATION = /\s*\(based on .+?\)\s*$/i;
function cleanTitle(raw: string) { return raw.replace(DATE_ANNOTATION, "").trim(); }
import styles from "./NotebookDashboard.module.css";
import overlayStyles from "@/components/ui/ModalOverlay.module.css";

type Props = { reminder: Reminder; onClose: () => void };

type ItemState = NoteItem & { deleted?: boolean };

function patchTask(listId: string, taskId: string, body: Record<string, unknown>) {
  return proxyFetch(`/agent/notebook/pages/${listId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteTask(listId: string, taskId: string) {
  return proxyFetch(`/agent/notebook/pages/${listId}/tasks/${taskId}`, { method: "DELETE" });
}

export function NoteModal({ reminder, onClose }: Props) {
  const [items, setItems] = useState<ItemState[]>(reminder.items);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function updateItem(id: string, patch: Partial<ItemState>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function addTask() {
    if (!newTitle.trim()) { setAdding(false); return; }
    const title = newTitle.trim();
    setNewTitle("");
    setAdding(false);
    const res = await proxyFetch(`/agent/notebook/pages/${reminder.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const { task } = await res.json();
      setItems((prev) => [...prev, { id: task.id, title: task.title, notes: null, completed: false, due: null }]);
    }
  }

  async function toggleComplete(item: ItemState) {
    const next = !item.completed;
    updateItem(item.id, { completed: next });
    await patchTask(reminder.id, item.id, { status: next ? "completed" : "needsAction" });
  }

  async function saveField(item: ItemState, field: "title" | "notes", value: string) {
    if (value === (item[field] ?? "")) return;
    updateItem(item.id, { [field]: value });
    await patchTask(reminder.id, item.id, { [field]: value });
  }

  async function saveDue(item: ItemState, value: string) {
    const due = value || null;
    updateItem(item.id, { due });
    await patchTask(reminder.id, item.id, { due: due ? `${due}T00:00:00.000Z` : null });
  }

  async function handleDelete(item: ItemState) {
    updateItem(item.id, { deleted: true });
    await deleteTask(reminder.id, item.id);
  }

  const visible = items.filter((it) => !it.deleted);
  const open = visible.filter((it) => !it.completed);
  const done = visible.filter((it) => it.completed);

  return (
    <div className={overlayStyles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} type="button" aria-label="Close">✕</button>
        <h2 className={styles.modalTitle}>{reminder.title}</h2>

        {visible.length === 0 ? (
          <p className={styles.emptyNotes}>No tasks</p>
        ) : (
          <>
            <ul className={styles.noteModalTaskList}>
              {open.map((item) => (
                <TaskRow key={item.id} item={item}
                  onToggle={() => toggleComplete(item)}
                  onSaveTitle={(v) => saveField(item, "title", v)}
                  onSaveNotes={(v) => saveField(item, "notes", v)}
                  onSaveDue={(v) => saveDue(item, v)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
              {adding ? (
                <li className={styles.noteModalAddRow}>
                  <span className={styles.noteModalCheckbox} aria-hidden />
                  <input
                    autoFocus
                    className={styles.noteModalTitle}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="New task…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask();
                      if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
                    }}
                    onBlur={addTask}
                  />
                </li>
              ) : (
                <li>
                  <button type="button" className={styles.noteModalAddBtn} onClick={() => setAdding(true)}>
                    + Add task
                  </button>
                </li>
              )}
            </ul>
            {done.length > 0 && (
              <>
                <p className={styles.completedLabel}>{done.length} completed</p>
                <ul className={styles.noteModalTaskList}>
                  {done.map((item) => (
                    <TaskRow key={item.id} item={item}
                      onToggle={() => toggleComplete(item)}
                      onSaveTitle={(v) => saveField(item, "title", v)}
                      onSaveNotes={(v) => saveField(item, "notes", v)}
                      onSaveDue={(v) => saveDue(item, v)}
                      onDelete={() => handleDelete(item)}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

type RowProps = {
  item: ItemState;
  onToggle: () => void;
  onSaveTitle: (v: string) => void;
  onSaveNotes: (v: string) => void;
  onSaveDue: (v: string) => void;
  onDelete: () => void;
};

function formatDue(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TaskRow({ item, onToggle, onSaveTitle, onSaveNotes, onSaveDue, onDelete }: RowProps) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const [showNotes, setShowNotes] = useState(!!item.notes);
  const dateRef = useRef<HTMLInputElement>(null);

  return (
    <li className={`${styles.noteModalRow} ${item.completed ? styles.noteModalRowDone : ""}`}>
      {/* Title line: checkbox button (matches /tasks style) + auto-wrapping textarea */}
      <div className={styles.noteModalTitleRow}>
        <button
          type="button"
          className={styles.noteModalCheckbox}
          onClick={onToggle}
          aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
        >
          {item.completed && <span className={styles.noteModalCheckmark}>✓</span>}
        </button>
        <textarea
          className={styles.noteModalTitle}
          defaultValue={cleanTitle(item.title)}
          rows={1}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
          onBlur={(e) => onSaveTitle(e.currentTarget.value)}
        />
      </div>
      {/* Chips row (indented past checkbox): date chip, details toggle, trash */}
      <div className={styles.noteModalChips}>
        {item.due ? (
          <span className={styles.noteModalDateChip}>
            <button type="button" className={styles.noteModalDateChipLabel} onClick={() => dateRef.current?.showPicker()}>
              {formatDue(item.due)}
            </button>
            <button type="button" className={styles.noteModalDateChipClear} onClick={() => onSaveDue("")} aria-label="Remove due date">
              ×
            </button>
          </span>
        ) : (
          <button type="button" className={styles.noteModalDateChipEmpty} onClick={() => dateRef.current?.showPicker()}>
            + date
          </button>
        )}
        <input
          ref={dateRef}
          type="date"
          className={styles.noteModalDateHidden}
          value={item.due ?? ""}
          onChange={(e) => onSaveDue(e.target.value)}
        />
        <button
          type="button"
          className={`${styles.noteModalNotesToggle} ${showNotes ? styles.noteModalNotesToggleActive : ""}`}
          onClick={() => setShowNotes((v) => !v)}
        >
          Details {showNotes ? "▲" : "▼"}
        </button>
        <button type="button" className={styles.noteModalDelete} onClick={onDelete} aria-label="Delete task">
          🗑
        </button>
      </div>
      {showNotes && (
        <textarea
          className={styles.noteModalNotes}
          value={notes}
          placeholder="Add details…"
          rows={2}
          ref={(el) => {
            if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
          }}
          onChange={(e) => {
            setNotes(e.target.value);
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
          onBlur={() => onSaveNotes(notes)}
        />
      )}
    </li>
  );
}
