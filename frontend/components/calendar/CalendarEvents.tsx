"use client";

type CalendarEvent = {
  title: string;
  location?: string;
  start: string;
  end: string;
};

type Props = {
  events: CalendarEvent[];
  color: string;
};

function formatEventTime(isoString: string): string {
  if (!isoString) return "";
  // All-day events come as "YYYY-MM-DD" (no "T")
  if (!isoString.includes("T")) {
    const date = new Date(isoString + "T00:00:00");
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CalendarEvents({ events, color }: Props) {
  if (events.length === 0) {
    return (
      <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", paddingLeft: 20, paddingTop: 4, paddingBottom: 4 }}>
        No events in the next 7 days
      </p>
    );
  }

  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 20, paddingRight: 8, margin: 0, listStyle: "none" }}>
      {events.map((event, i) => (
        <li
          key={i}
          style={{
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            borderLeftWidth: 3,
            borderLeftColor: color,
            padding: "8px 12px",
            background: "var(--color-surface-raised)",
          }}
        >
          <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0, lineHeight: 1.3 }}>
            {event.title}
          </p>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
            {formatEventTime(event.start)}
          </p>
          {event.location && (
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.location}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
