"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useRef, useEffect } from "react";
import type { Reminder } from "./NoteCard";
import styles from "./NotebookDashboard.module.css";
import overlayStyles from "@/components/ui/ModalOverlay.module.css";

type Props = {
  onClose: () => void;
  onCreated: (page: Reminder) => void;
};

export function NewPageModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const taskRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { titleRef.current?.focus(); }, []);

  function updateTask(i: number, val: string) {
    setTasks((prev) => prev.map((t, idx) => (idx === i ? val : t)));
  }

  function addTaskAfter(i: number) {
    setTasks((prev) => [...prev.slice(0, i + 1), "", ...prev.slice(i + 1)]);
    setTimeout(() => taskRefs.current[i + 1]?.focus(), 30);
  }

  function removeTask(i: number) {
    if (tasks.length === 1) { setTasks([""]); return; }
    setTasks((prev) => prev.filter((_, idx) => idx !== i));
    setTimeout(() => taskRefs.current[Math.max(0, i - 1)]?.focus(), 30);
  }

  async function handleCreate() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const pageRes = await proxyFetch("/agent/notebook/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!pageRes.ok) return;
      const { page } = await pageRes.json();

      const filled = tasks.map((t) => t.trim()).filter(Boolean);
      const createdTasks = await Promise.all(
        filled.map((t) =>
          proxyFetch(`/agent/notebook/pages/${page.id}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: t }),
          }).then((r) => r.ok ? r.json().then((d) => d.task) : null)
        )
      );

      onCreated({ ...page, items: createdTasks.filter(Boolean).map((t) => ({ id: t.id, title: t.title, completed: false })) });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={overlayStyles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} type="button" aria-label="Close">✕</button>
        <h2 className={styles.modalTitle}>New Page</h2>

        <input
          ref={titleRef}
          className={styles.newPageModalTitleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page name…"
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        />

        <div className={styles.newPageModalTaskSection}>
          <p className={styles.newPageModalTaskLabel}>Tasks</p>
          <ul className={styles.newPageModalTaskList}>
            {tasks.map((task, i) => (
              <li key={i} className={styles.newPageModalTaskRow}>
                <input type="checkbox" className={styles.newPageModalCheckbox} disabled tabIndex={-1} />
                <input
                  ref={(el) => { taskRefs.current[i] = el; }}
                  className={styles.newPageModalTaskInput}
                  value={task}
                  onChange={(e) => updateTask(i, e.target.value)}
                  placeholder="Add a task…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTaskAfter(i); }
                    if (e.key === "Backspace" && task === "") { e.preventDefault(); removeTask(i); }
                    if (e.key === "Escape") onClose();
                  }}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.newPageModalActions}>
          <button className={styles.newPageConfirm} onClick={handleCreate} disabled={saving || !title.trim()} type="button">
            {saving ? "Creating…" : "Create"}
          </button>
          <button className={styles.newPageCancel} onClick={onClose} type="button">Cancel</button>
        </div>
      </div>
    </div>
  );
}
