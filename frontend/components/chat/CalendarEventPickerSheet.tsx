"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useMemo } from "react";
import { Search, ArrowRight, X } from "lucide-react";
import type { EventChip } from "@/components/chat/ContextChip";
import styles from "./CalendarEventPickerSheet.module.css";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  calendarColor: string;
};

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  onConfirm: (events: EventChip[]) => void;
}>;

function formatEventTime(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (!start.includes("T")) return "All day";
  const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt(s)} – ${fmt(e)}`;
}

function groupEventsByDate(events: CalendarEvent[]): { label: string; events: CalendarEvent[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const groups = new Map<string, { date: Date; events: CalendarEvent[] }>();
  for (const ev of events) {
    const d = new Date(ev.start); d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    if (!groups.has(key)) groups.set(key, { date: d, events: [] });
    groups.get(key)!.events.push(ev);
  }
  return Array.from(groups.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ date, events }) => {
      const short = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const label = date.getTime() === today.getTime() ? `Today, ${short}`
        : date.getTime() === tomorrow.getTime() ? `Tomorrow, ${short}`
        : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      return { label, events };
    });
}

export function CalendarEventPickerSheet({ open, onClose, onConfirm }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    setQuery("");
    setLoading(true);
    proxyFetch("/agent/calendars?days=7")
      .then((r) => r.json())
      .then((data: { calendars?: Array<{ id: string; color: string; events: Array<{ title: string; start: string; end: string; location?: string }> }> }) => {
        const seen = new Set<string>();
        const flat: CalendarEvent[] = [];
        for (const cal of data.calendars ?? []) {
          for (const ev of cal.events ?? []) {
            const id = `${cal.id}:${ev.start}:${ev.title}`;
            if (seen.has(id)) continue;
            seen.add(id);
            flat.push({ id, title: ev.title, start: ev.start, end: ev.end, location: ev.location, calendarColor: cal.color });
          }
        }
        flat.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        setEvents(flat);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter((e) => e.title.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q));
  }, [events, query]);

  const groups = useMemo(() => groupEventsByDate(filtered), [filtered]);

  function toggle(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function handleConfirm() {
    const selected = events.filter((e) => selectedIds.has(e.id)).map<EventChip>((e) => ({ kind: "event", id: e.id, title: e.title, start: e.start, end: e.end }));
    onConfirm(selected);
    onClose();
  }

  if (!open) return null;

  const count = selectedIds.size;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Calendar Events</h2>
          <button type="button" aria-label="Close" onClick={onClose} className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.searchRow}>
          <Search size={15} className={styles.searchIcon} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events…"
            className={styles.searchInput}
          />
        </div>

        <div className={styles.list}>
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)}
            </>
          ) : groups.length === 0 ? (
            <p className={styles.empty}>No events found</p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className={styles.group}>
                <p className={styles.groupLabel}>{group.label}</p>
                {group.events.map((ev) => {
                  const checked = selectedIds.has(ev.id);
                  return (
                    <label key={ev.id} className={`${styles.eventRow} ${checked ? styles.eventRowChecked : ""}`}>
                      <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}>{checked ? "✓" : ""}</span>
                      <span className={styles.calDot} style={{ backgroundColor: ev.calendarColor }} />
                      <div className={styles.eventBody}>
                        <p className={styles.eventTitle}>{ev.title}</p>
                        <p className={styles.eventMeta}>
                          {formatEventTime(ev.start, ev.end)}
                          {ev.location && ` · ${ev.location}`}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={handleConfirm} disabled={count === 0} className={styles.confirmBtn}>
            {count === 0 ? "Select events" : `Add ${count} event${count === 1 ? "" : "s"}`}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
