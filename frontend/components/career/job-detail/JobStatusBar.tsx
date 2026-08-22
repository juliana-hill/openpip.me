"use client";

import { Bookmark, CheckCircle, MessageSquare, Trophy, XCircle } from "lucide-react";
import type { JobStatus } from "@/types/career";
import styles from "./JobStatusBar.module.css";

const STATUSES: { value: JobStatus; label: string; icon: React.ReactNode }[] = [
  { value: "saved",        label: "Saved",        icon: <Bookmark size={14} /> },
  { value: "applied",      label: "Applied",      icon: <CheckCircle size={14} /> },
  { value: "interviewing", label: "Interviewing", icon: <MessageSquare size={14} /> },
  { value: "offer",        label: "Offer",        icon: <Trophy size={14} /> },
  { value: "rejected",     label: "Rejected",     icon: <XCircle size={14} /> },
];

type JobStatusBarProps = Readonly<{
  status: JobStatus;
  onStatusChange: (status: JobStatus) => void;
}>;

export function JobStatusBar({ status, onStatusChange }: JobStatusBarProps) {
  return (
    <section className={styles.bar}>
      {STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          className={`${styles.chip} ${status === s.value ? styles.chipActive : ""}`}
          onClick={() => onStatusChange(s.value)}
        >
          {s.icon}
          {s.label}
        </button>
      ))}
    </section>
  );
}
