"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarDayModal } from "./CalendarDayModal";
import type { CalendarInfo } from "./CalendarList";
import styles from "./CalendarGrid.module.css";

type DayEvent = {
  title: string;
  start: string;
  end: string;
  calendarName: string;
  color: string;
};

type Props = {
  calendars: CalendarInfo[];
  year: number;
  month: number;
  loading?: boolean;
  onMonthChange: (year: number, month: number) => void;
};

function toLocalDateStr(iso: string): string {
  // All-day: "YYYY-MM-DD" — use directly
  if (!iso.includes("T")) return iso.slice(0, 10);
  // Timed: parse and format in local time
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function CalendarGrid({ calendars, year, month, loading, onMonthChange }: Props) {
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const todayStr = (() => { const p = (n: number) => String(n).padStart(2, "0"); return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`; })();

  // Flatten all events from all calendars, keyed by local date string
  const eventsByDay = new Map<string, DayEvent[]>();
  for (const cal of calendars) {
    for (const ev of cal.events) {
      const dateStr = toLocalDateStr(ev.start);
      if (!eventsByDay.has(dateStr)) eventsByDay.set(dateStr, []);
      eventsByDay.get(dateStr)!.push({ title: ev.title, start: ev.start, end: ev.end, calendarName: cal.name, color: cal.color });
    }
  }

  const totalDays = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const goMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    onMonthChange(y, m);
  };

  const p = (n: number) => String(n).padStart(2, "0");
  const selectedDayEvents = selectedDay
    ? (eventsByDay.get(`${selectedDay.getFullYear()}-${p(selectedDay.getMonth() + 1)}-${p(selectedDay.getDate())}`) ?? [])
    : [];

  return (
    <div className={styles.card} style={{ position: "relative" }}>
      {loading && <div style={{ position: "absolute", inset: 0, background: "var(--color-surface)", opacity: 0.6, borderRadius: "inherit", zIndex: 1 }} />}
      {/* Month navigation */}
      <div className={styles.monthNav}>
        <button type="button" className={styles.navBtn} onClick={() => goMonth(-1)}><ChevronLeft size={16} /></button>
        <p className={styles.monthLabel}>{MONTH_NAMES[month]} {year}</p>
        <button type="button" className={styles.navBtn} onClick={() => goMonth(1)}><ChevronRight size={16} /></button>
      </div>

      {/* Weekday headers */}
      <div className={styles.weekdays}>
        {WEEKDAYS.map((d) => <div key={d} className={styles.weekday}>{d}</div>)}
      </div>

      {/* Day grid */}
      <div className={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className={`${styles.cell} ${styles.cellEmpty}`} />;
          const dateStr = `${year}-${p(month + 1)}-${p(day)}`;
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          const dayEvents = eventsByDay.get(dateStr) ?? [];
          const hasEvents = dayEvents.length > 0;
          const calColors = [...new Map(dayEvents.map((e) => [e.color, e.color])).values()].slice(0, 4);

          return (
            <div
              key={i}
              className={[
                styles.cell,
                isPast ? styles.cellPast : "",
                isToday ? styles.today : "",
                hasEvents && !isPast ? styles.cellClickable : "",
              ].join(" ")}
              onClick={() => {
                if (hasEvents || isToday) setSelectedDay(new Date(year, month, day));
              }}
            >
              <span className={styles.dayNum}>{day}</span>
              {calColors.length > 0 && (
                <div className={styles.dots}>
                  {calColors.map((color, ci) => (
                    <span key={ci} className={styles.dot} style={{ background: color }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <CalendarDayModal
          date={selectedDay}
          events={selectedDayEvents}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
