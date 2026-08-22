"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CalendarEvents } from "./CalendarEvents";

type CalendarEvent = { title: string; start: string; end: string };

export type CalendarInfo = {
  id: string;
  name: string;
  color: string;
  primary: boolean;
  accessRole: string;
  events: CalendarEvent[];
};

export function CalendarList({ calendars }: { calendars: CalendarInfo[] }) {
  if (calendars.length === 0) {
    return <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", padding: "0 16px" }}>No calendars found.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {calendars.map((cal) => (
        <CalendarItem key={cal.id} cal={cal} />
      ))}
    </div>
  );
}

function CalendarItem({ cal }: { cal: CalendarInfo }) {
  const [open, setOpen] = useState(cal.primary);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "8px 12px",
          borderRadius: "var(--radius-md)", border: "none",
          background: "transparent", cursor: "pointer",
          transition: "background 150ms ease", fontFamily: "var(--font-sans)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-light)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: cal.color }} />
        <span style={{ flex: 1, fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--color-text)", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cal.name}
        </span>
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
          {cal.events.length}
        </span>
        <ChevronDown size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }} />
      </button>

      {open && (
        <div style={{ paddingBottom: 8, paddingTop: 2 }}>
          <CalendarEvents events={cal.events} color={cal.color} />
        </div>
      )}
    </div>
  );
}
