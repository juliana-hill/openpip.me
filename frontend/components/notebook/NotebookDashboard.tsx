"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { NoteCard, type Reminder } from "./NoteCard";
import { NoteModal } from "./NoteModal";
import { NewPageModal } from "./NewPageModal";
import { DriveFileCard, type DriveFile } from "./DriveFileCard";
import { NewDriveFileModal } from "./NewDriveFileModal";
import styles from "./NotebookDashboard.module.css";

const KEEP_LIST_TITLE = "Old Google Keep Reminders";

type Props = { userName: string; userImage: string };

export function NotebookDashboard({ userName, userImage }: Props) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const [pages, setPages] = useState<Reminder[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reminder | null>(null);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [newDriveFileOpen, setNewDriveFileOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      proxyFetch("/agent/notebook/pages")
        .then(async (r) => {
          if (!r.ok) { console.error("[notebook] fetch failed", r.status, await r.text()); return { pages: [] }; }
          return r.json();
        })
        .then((data) => setPages(data.pages ?? [])),
      proxyFetch("/agent/drive/files")
        .then(async (r) => {
          if (!r.ok) return { files: [] };
          return r.json();
        })
        .then((data) => setDriveFiles(data.files ?? [])),
    ])
      .catch((err) => console.error("[notebook] error", err))
      .finally(() => setLoading(false));
  }, []);

  const keepList = pages.find((p) => p.title === KEEP_LIST_TITLE);
  const taskLists = pages.filter((p) => p.title !== KEEP_LIST_TITLE);

  return (
    <div className={styles.page}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Notebook</h1>
          <p className={styles.subtitle}>
            {loading ? "Loading…" : `${pages.length} ${pages.length === 1 ? "page" : "pages"}`}
          </p>
        </div>

        {loading ? (
          <div className={styles.scrollRow}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} style={{ width: 220, flexShrink: 0 }} />)}
          </div>
        ) : (
          <>
            {/* Row 1 — Google Reminders pages */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Pages</h2>
              <div className={styles.scrollRow}>
                <button className={styles.newPageCard} type="button" onClick={() => setNewPageOpen(true)}>
                  <span className={styles.newPageIcon}>+</span>
                  <span className={styles.newPageLabel}>New Page</span>
                </button>
                {keepList && (
                  <NoteCard reminder={keepList} onClick={() => setSelected(keepList)} isKeep />
                )}
                {taskLists.map((p) => (
                  <NoteCard key={p.id} reminder={p} onClick={() => setSelected(p)} />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerLabel}>Google Drive</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Row 2 — Google Drive files */}
            <div className={styles.section}>
              <div className={styles.scrollRow}>
                <button className={styles.newDriveFileCard} type="button" onClick={() => setNewDriveFileOpen(true)}>
                  <span className={styles.newPageIcon}>+</span>
                  <span className={styles.newPageLabel}>New File</span>
                </button>
                {driveFiles.map((f) => (
                  <DriveFileCard key={f.id} file={f} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {newPageOpen && (
        <NewPageModal
          onClose={() => setNewPageOpen(false)}
          onCreated={(page) => setPages((prev) => [...prev, page])}
        />
      )}
      {newDriveFileOpen && (
        <NewDriveFileModal
          onClose={() => setNewDriveFileOpen(false)}
          onCreated={(file) => setDriveFiles((prev) => [...prev, file])}
        />
      )}
      {selected && <NoteModal reminder={selected} onClose={() => setSelected(null)} />}
      <FloatingAssistant />
    </div>
  );
}
