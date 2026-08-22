"use client";

import { Circle, UserPlus, Users, Send, MessageSquare, Calendar, RefreshCw } from "lucide-react";
import type { ContactStatus } from "@/types/career";
import styles from "../../career/job-detail/JobStatusBar.module.css";

const STATUSES: { value: ContactStatus; label: string; icon: React.ReactNode }[] = [
  { value: "not_contacted",        label: "Not contacted", icon: <Circle size={14} /> },
  { value: "connection_requested", label: "Req. sent",     icon: <UserPlus size={14} /> },
  { value: "connected",            label: "Connected",     icon: <Users size={14} /> },
  { value: "messaged",             label: "Contacted",      icon: <Send size={14} /> },
  { value: "replied",              label: "Replied",       icon: <MessageSquare size={14} /> },
  { value: "meeting_scheduled",    label: "Meeting set",   icon: <Calendar size={14} /> },
  { value: "followed_up",          label: "Followed up",   icon: <RefreshCw size={14} /> },
];

type ContactStatusBarProps = Readonly<{
  status: ContactStatus;
  onStatusChange: (status: ContactStatus) => void;
}>;

export function ContactStatusBar({ status, onStatusChange }: ContactStatusBarProps) {
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
