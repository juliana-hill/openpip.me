"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState } from "react";
import { Calendar, MapPin, CheckCircle, X } from "lucide-react";
import styles from "./CalendarEventProposalCard.module.css";

type ProposeArgs = {
  calendarId: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
};

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const date = s.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const startTime = s.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const endTime = e.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date}, ${startTime} – ${endTime}`;
}

type Props = { args: ProposeArgs };

export function CalendarEventProposalCard({ args }: Props) {
  const [state, setState] = useState<"pending" | "accepted" | "dismissed">("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state === "dismissed") return null;

  if (state === "accepted") {
    return (
      <div className={styles.accepted}>
        <CheckCircle size={16} />
        <span><strong>{args.title}</strong> added to your calendar.</span>
      </div>
    );
  }

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await proxyFetch("/agent/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: args.calendarId,
          title: args.title,
          start: args.start,
          end: args.end,
          description: args.description,
          location: args.location,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to add event.");
      } else {
        setState("accepted");
      }
    } catch {
      setError("Network error — could not add event.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.titleRow}>
        <Calendar size={14} className={styles.calIcon} />
        <span className={styles.eventTitle}>{args.title}</span>
      </div>

      <p className={styles.timeRange}>{formatRange(args.start, args.end)}</p>

      {args.location && (
        <div className={styles.locationRow}>
          <MapPin size={12} className={styles.pinIcon} />
          <span className={styles.location}>{args.location}</span>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button className={styles.acceptBtn} onClick={handleAccept} disabled={loading}>
          {loading ? "Adding…" : "Add to Calendar"}
        </button>
        <button
          className={styles.dismissBtn}
          onClick={() => setState("dismissed")}
          disabled={loading}
        >
          <X size={12} />
          Dismiss
        </button>
      </div>
    </div>
  );
}
