"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Pencil, ArrowLeft, ChevronRight } from "lucide-react";
import type { Job, JobStatus } from "@/types/career";
import styles from "./JobHeader.module.css";

const STATUS_COLORS: Record<JobStatus, { bg: string; color: string }> = {
  saved:        { bg: "var(--color-border)", color: "var(--color-text-muted)" },
  applied:      { bg: "var(--color-accent)", color: "#fff" },
  interviewing: { bg: "var(--color-accent-light)", color: "var(--color-accent)" },
  offer:        { bg: "rgba(76,175,80,0.12)", color: "#4caf50" },
  closed:       { bg: "var(--color-border)", color: "var(--color-text-muted)" },
  rejected:     { bg: "rgba(229,56,59,0.1)", color: "#e5383b" },
};

type JobHeaderProps = Readonly<{
  job: Job;
  onPatch: (update: Partial<Job>) => void;
}>;

export function JobHeader({ job, onPatch }: JobHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(job.role);
  const statusStyle = STATUS_COLORS[job.status];

  return (
    <section className={styles.section}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/career" className={styles.backLink}>
          <ArrowLeft size={16} />
        </Link>
        <nav className={styles.crumbs}>
          <Link href="/career" className={styles.crumbLink}>Jobs</Link>
          <ChevronRight size={12} style={{ opacity: 0.4 }} />
          <span className={styles.crumbCurrent}>{job.role}</span>
        </nav>
      </div>

      {/* Title + meta */}
      <div className={styles.titleRow}>
        <div className={styles.titleLeft}>
          {editingTitle ? (
            <div className={styles.titleEdit}>
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onPatch({ role: titleDraft.trim() }); setEditingTitle(false); }
                  if (e.key === "Escape") { setTitleDraft(job.role); setEditingTitle(false); }
                }}
                className={styles.titleInput}
              />
              <button type="button" className={styles.iconBtn} onClick={() => { onPatch({ role: titleDraft.trim() }); setEditingTitle(false); }}><Check size={14} /></button>
              <button type="button" className={styles.iconBtn} onClick={() => { setTitleDraft(job.role); setEditingTitle(false); }}><X size={14} /></button>
            </div>
          ) : (
            <div className={styles.titleStatic}>
              <h1 className={styles.title}>{job.role}</h1>
              <button type="button" className={styles.editBtn} onClick={() => { setTitleDraft(job.role); setEditingTitle(true); }}><Pencil size={13} /></button>
            </div>
          )}
          <div className={styles.meta}>
            <span className={styles.company}>{job.company}</span>
          </div>
        </div>

        {/* Salary + status */}
        <div className={styles.badges}>
          <span
            className={styles.statusBadge}
            style={{ background: statusStyle.bg, color: statusStyle.color }}
          >
            {job.status}
          </span>
        </div>
      </div>

    </section>
  );
}
