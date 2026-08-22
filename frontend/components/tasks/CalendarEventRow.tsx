"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Video, X } from "lucide-react";
import type { CalendarEvent } from "@/types/tasks";
import dialogStyles from "@/components/ui/Dialog.module.css";

type CalendarEventRowProps = Readonly<{ event: CalendarEvent }>;

function formatTime(iso: string) {
  if (iso.length === 10) return "All day";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRange(start: string, end: string) {
  if (start.length === 10) return "All day";
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function CalendarEventRow({ event }: CalendarEventRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        style={{
          background: "color-mix(in srgb, var(--color-border) 30%, transparent)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderLeft: "4px solid rgba(37, 99, 235, 0.3)",
          cursor: "pointer",
          transition: "background 150ms ease",
        }}
        onClick={() => setOpen(true)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "color-mix(in srgb, var(--color-border) 50%, transparent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "color-mix(in srgb, var(--color-border) 30%, transparent)";
        }}
      >
        <span style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-muted)",
          fontVariantNumeric: "tabular-nums",
          width: "64px",
          flexShrink: 0,
        }}>
          {formatTime(event.start)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: 500,
            color: "var(--color-text)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>{event.title}</p>
          <p style={{
            fontSize: "var(--font-size-xs)",
            color: "color-mix(in srgb, var(--color-text-muted) 60%, transparent)",
            margin: "2px 0 0 0",
          }}>{event.calendarName}</p>
        </div>
        <CalendarDays size={16} style={{ color: "color-mix(in srgb, var(--color-text-muted) 40%, transparent)", flexShrink: 0 }} />
      </div>

      {open && (
        <>
          <div className={dialogStyles.overlay} onClick={() => setOpen(false)} />
          <div className={dialogStyles.content} style={{ maxWidth: 500 }}>
            <button className={dialogStyles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
            <div className={dialogStyles.header}>
              <h2 className={dialogStyles.title}>{event.title}</h2>
              <p className={dialogStyles.description}>{formatRange(event.start, event.end)}</p>
            </div>

            <div style={{ overflowY: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
              {event.meetLink && (
                <a
                  href={event.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 500,
                    color: "#3b82f6",
                    textDecoration: "none",
                  }}
                >
                  <Video size={16} />
                  Join Google Meet
                </a>
              )}
              {event.location && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                  <MapPin size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
                  <span>{event.location}</span>
                </div>
              )}
              {event.description && (
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
                  {event.description}
                </p>
              )}
              {!event.meetLink && !event.location && !event.description && (
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }}>No additional details.</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
