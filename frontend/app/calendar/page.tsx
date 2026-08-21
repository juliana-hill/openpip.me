"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
type Event = { id: string; title: string; start: string; end: string };

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  useEffect(() => { fetch(`${apiBaseUrl}/api/demo/workspace`).then(async (response) => { if (response.ok) setEvents((await response.json()).events as Event[]); }).catch(() => setEvents([])); }, []);
  return <main className="app-shell settings-page"><Link href="/" className="back-link">← Today</Link><header className="settings-header"><p className="eyebrow">Calendar</p><h1>See the shape of your day.</h1><p className="muted">Calendar changes are never applied silently; proposed changes wait in Review.</p></header><div className="contact-list">{events.map((event) => <article className="contact-card" key={event.id}><div className="contact-avatar">▦</div><div><h2>{event.title}</h2><p>{event.start} – {event.end}</p><small>Source: {event.id}</small></div></article>)}</div></main>;
}
