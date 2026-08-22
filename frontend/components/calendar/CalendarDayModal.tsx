"use client";

import { X } from "lucide-react";
import styles from "./CalendarDayModal.module.css";
import overlayStyles from "@/components/ui/ModalOverlay.module.css";

type DayEvent = {
  title: string;
  start: string;
  end: string;
  calendarName: string;
  color: string;
};

type Props = {
  date: Date;
  events: DayEvent[];
  onClose: () => void;
};

function formatTime(iso: string): string {
  if (!iso.includes("T")) return "All day";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatTimeRange(start: string, end: string): string {
  if (!start.includes("T")) return "All day";
  const s = formatTime(start);
  const e = formatTime(end);
  return `${s} – ${e}`;
}

export function CalendarDayModal({ date, events, onClose }: Props) {
  const label = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const sorted = [...events].sort((a, b) => {
    if (!a.start.includes("T")) return -1;
    if (!b.start.includes("T")) return 1;
    return a.start.localeCompare(b.start);
  });

  return (
    <div className={overlayStyles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{label}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={styles.body}>
          {sorted.length === 0 ? (
            <p className={styles.empty}>No events this day.</p>
          ) : sorted.map((ev, i) => (
            <div key={i} className={styles.eventCard} style={{ borderLeftColor: ev.color }}>
              <p className={styles.eventTitle}>{ev.title}</p>
              <p className={styles.eventTime}>{formatTimeRange(ev.start, ev.end)}</p>
              <p className={styles.eventCal}>{ev.calendarName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
