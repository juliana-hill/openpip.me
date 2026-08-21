"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
type Message = { id: string; subject: string; from: string };

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => { fetch(`${apiBaseUrl}/api/demo/workspace`).then(async (response) => { if (response.ok) setMessages((await response.json()).messages as Message[]); }).catch(() => setMessages([])); }, []);
  return <main className="app-shell settings-page"><Link href="/" className="back-link">← Today</Link><header className="settings-header"><p className="eyebrow">Inbox</p><h1>Only messages worth your attention.</h1><p className="muted">The demo view is read-only. Triage actions become cited proposals in Review.</p></header><div className="contact-list">{messages.map((message) => <article className="contact-card" key={message.id}><div className="contact-avatar">✉</div><div><h2>{message.subject}</h2><p>{message.from}</p><small>Source: {message.id}</small></div><span className="proposal-badge">Review</span></article>)}</div></main>;
}
