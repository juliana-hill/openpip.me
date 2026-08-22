"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useRef, useEffect } from "react";
import styles from "./NotebookDashboard.module.css";
import overlayStyles from "@/components/ui/ModalOverlay.module.css";
import type { DriveFile } from "./DriveFileCard";

type FileType = "doc" | "sheet" | "slide";

const FILE_TYPES: { type: FileType; label: string; icon: string }[] = [
  { type: "doc", label: "Doc", icon: "📝" },
  { type: "sheet", label: "Sheet", icon: "📊" },
  { type: "slide", label: "Slide", icon: "📽️" },
];

type Props = Readonly<{
  onClose: () => void;
  onCreated: (file: DriveFile) => void;
}>;

export function NewDriveFileModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState<FileType>("doc");
  const [folderPath, setFolderPath] = useState("My Drive");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  async function handleCreate() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await proxyFetch("/agent/drive/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), fileType, folderPath }),
      });
      if (!res.ok) return;
      const { file } = await res.json();
      onCreated(file);
      window.open(file.webViewLink, "_blank", "noopener,noreferrer");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={overlayStyles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} type="button" aria-label="Close">✕</button>
        <h2 className={styles.modalTitle}>New Google Drive File</h2>

        <input
          ref={titleRef}
          className={styles.newPageModalTitleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="File name…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) handleCreate();
            if (e.key === "Escape") onClose();
          }}
        />

        <div className={styles.newPageModalTaskSection}>
          <p className={styles.newPageModalTaskLabel}>File type</p>
          <div className={styles.driveFileTypeGrid}>
            {FILE_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                className={`${styles.driveFileTypeBtn} ${fileType === type ? styles.driveFileTypeBtnActive : ""}`}
                onClick={() => setFileType(type)}
              >
                <span className={styles.driveFileTypeIcon}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.newPageModalTaskSection}>
          <p className={styles.newPageModalTaskLabel}>Folder path</p>
          <div className={styles.driveFolderRow}>
            <span className={styles.driveFolderIcon}>📁</span>
            <input
              className={styles.driveFolderInput}
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="My Drive"
              onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
            />
          </div>
        </div>

        <div className={styles.newPageModalActions}>
          <button
            className={styles.newPageConfirm}
            onClick={handleCreate}
            disabled={saving || !title.trim()}
            type="button"
          >
            {saving ? "Creating…" : "Create"}
          </button>
          <button className={styles.newPageCancel} onClick={onClose} type="button">Cancel</button>
        </div>
      </div>
    </div>
  );
}
