"use client";

import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import styles from "./CalendarSummaryCard.module.css";

type AgentCalendarEvent = {
  id: string;
  calendarName: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
};

const CALENDAR_COLORS = [
  "#4285f4", "#0b8043", "#8e24aa", "#d50000",
  "#f4511e", "#039be5", "#7986cb", "#616161",
];

function formatTimeRange(start: string, end: string): string {
  if (!start.includes("T")) {
    const dateStr = new Date(start + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric",
    });
    return `${dateStr} — All day`;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateStr = startDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const startTime = startDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const endTime = endDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr}, ${startTime} – ${endTime}`;
}

function groupByCalendar(events: AgentCalendarEvent[]) {
  const colorMap = new Map<string, string>();
  const grouped = new Map<string, AgentCalendarEvent[]>();
  for (const event of events) {
    const name = event.calendarName;
    if (!grouped.has(name)) {
      grouped.set(name, []);
      colorMap.set(name, CALENDAR_COLORS[colorMap.size % CALENDAR_COLORS.length]);
    }
    grouped.get(name)!.push(event);
  }
  return Array.from(grouped.entries()).map(([name, events]) => ({
    name,
    color: colorMap.get(name)!,
    events,
  }));
}

type Props = { result: string };

export function CalendarSummaryCard({ result }: Props) {
  let events: AgentCalendarEvent[] = [];
  try {
    if (typeof result === "string") events = JSON.parse(result);
    else if (Array.isArray(result)) events = result as unknown as AgentCalendarEvent[];
  } catch { /* parse failed */ }

  const speechText = events.map((event) => `${event.title}, ${formatTimeRange(event.start, event.end)}`).join(". ");

  if (!events.length) {
    return <p className={styles.empty}>No calendar events found.</p>;
  }

  const calendars = groupByCalendar(events);

  return (
    <div className={styles.card}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <ReadAloudButton text={speechText} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, display: "flex", alignItems: "center" }} iconSize={14} />
      </div>
      {calendars.map((cal, ci) => (
        <div key={ci}>
          <div className={styles.calHeader}>
            <span className={styles.dot} style={{ backgroundColor: cal.color }} />
            <span className={styles.calName}>{cal.name}</span>
            <span className={styles.count}>{cal.events.length} event{cal.events.length !== 1 ? "s" : ""}</span>
          </div>
          <div className={styles.events}>
            {cal.events.map((event, ei) => (
              <div key={ei} className={styles.event} style={{ borderLeftColor: cal.color }}>
                <p className={styles.eventTitle}>{event.title}</p>
                <p className={styles.eventTime}>{formatTimeRange(event.start, event.end)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
