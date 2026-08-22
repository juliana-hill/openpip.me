"use client";

import { useRef, useState } from "react";
import { Upload, ChevronRight } from "lucide-react";
import { TimelineModal } from "./TimelineModal";
import type { TimelineEntry } from "@/types/career";
import styles from "./TimelineTile.module.css";

type TimelineTileProps = Readonly<{
  entries: TimelineEntry[];
  loading: boolean;
  onUpload: (files: FileList) => void;
  uploading: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, patch: Partial<TimelineEntry>) => void;
}>;

export function TimelineTile({ entries, loading, onUpload, uploading, onDelete, onEdit }: TimelineTileProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workCount = entries.filter((e) => e.type === "work").length;
  const educationCount = entries.filter((e) => e.type === "education").length;
  const certCount = entries.filter((e) => e.type === "certification").length;
  const projectCount = entries.filter((e) => e.type === "project").length;

  return (
    <>
      <div className={styles.tile} onClick={() => setModalOpen(true)}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.metaLabel}>Career History</p>
            <p className={styles.count}>{loading ? "—" : entries.length}</p>
            <p className={styles.entriesLabel}>{entries.length === 1 ? "entry" : "entries"} on record</p>
          </div>
          <ChevronRight className={styles.chevron} style={{ width: 16, height: 16 }} />
        </div>

        {/* Type breakdown pills */}
        {entries.length > 0 && (
          <div className={styles.pills}>
            {workCount > 0 && <p className={`${styles.pill} ${styles.pillWork}`}>{workCount} Work</p>}
            {educationCount > 0 && <p className={`${styles.pill} ${styles.pillEducation}`}>{educationCount} Education</p>}
            {certCount > 0 && <p className={`${styles.pill} ${styles.pillCert}`}>{certCount} Certs</p>}
            {projectCount > 0 && <p className={`${styles.pill} ${styles.pillProject}`}>{projectCount} Projects</p>}
          </div>
        )}

        {/* Upload zone */}
        <div className={styles.uploadZone}>
          <div
            className={styles.uploadInner}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              multiple
              className={styles.hiddenInput}
              onChange={(e) => e.target.files && onUpload(e.target.files)}
            />
            <div className={styles.uploadRow}>
              <div className={styles.uploadIconWrap}>
                {uploading ? (
                  <span className={styles.uploadSpinner} />
                ) : (
                  <Upload style={{ width: 14, height: 14 }} />
                )}
              </div>
              <div>
                <p className={styles.uploadTitle}>{uploading ? "Parsing…" : "Add documents"}</p>
                <p className={styles.uploadSub}>PDF or DOCX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TimelineModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entries={entries}
        loading={loading}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </>
  );
}
