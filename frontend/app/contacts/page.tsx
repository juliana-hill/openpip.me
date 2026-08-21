"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
type Contact = { id: string; name: string; email: string; last_interaction: string; interaction_count: number; relationship_note: string };

export default function ContactsPage() {
  const [items, setItems] = useState<Contact[]>([]);
  useEffect(() => { fetch(`${apiBaseUrl}/api/demo/contacts`).then(async (response) => { if (response.ok) setItems((await response.json()).items as Contact[]); }).catch(() => setItems([])); }, []);
  return <main className="app-shell settings-page"><Link href="/" className="back-link">← Today</Link><header className="settings-header"><p className="eyebrow">Contacts</p><h1>Relationships, remembered lightly.</h1><p className="muted">OpenPip keeps relationship context grounded in actual communication history.</p></header><div className="contact-list">{items.map((contact) => <article className="contact-card" key={contact.id}><div className="contact-avatar">{contact.name.split(" ").map((part) => part[0]).join("")}</div><div><h2>{contact.name}</h2><p>{contact.email}</p><small>{contact.relationship_note}</small></div><span className="contact-meta">{contact.interaction_count} interactions<br />Last: {contact.last_interaction}</span></article>)}</div>{items.length === 0 && <p className="muted">Start the backend to load sanitized demo contacts.</p>}</main>;
}
