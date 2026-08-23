"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { Contact } from "@/types/career";
import styles from "../../career/job-detail/JobHeader.module.css";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  not_contacted:        { bg: "var(--color-border)",          color: "var(--color-text-muted)" },
  connection_requested: { bg: "rgba(167,139,250,0.12)",        color: "#a78bfa" },
  connected:            { bg: "rgba(129,140,248,0.12)",        color: "#818cf8" },
  messaged:             { bg: "rgba(59,130,246,0.12)",         color: "#3b82f6" },
  replied:              { bg: "var(--color-accent-light)",     color: "var(--color-accent)" },
  meeting_scheduled:    { bg: "rgba(52,211,153,0.12)",         color: "#34d399" },
  followed_up:          { bg: "rgba(245,158,11,0.12)",         color: "#f59e0b" },
};

const STATUS_LABELS: Record<string, string> = {
  not_contacted: "Not contacted",
  connection_requested: "Req. sent",
  connected: "Connected",
  messaged: "Contacted",
  replied: "Replied",
  meeting_scheduled: "Meeting set",
  followed_up: "Followed up",
};

type ContactHeaderProps = Readonly<{ contact: Contact }>;

export function ContactHeader({ contact }: ContactHeaderProps) {
  const statusStyle = STATUS_COLORS[contact.status] ?? STATUS_COLORS.not_contacted;
  return (
    <section className={styles.section}>
      <div className={styles.breadcrumb}>
        <Link href="/network" className={styles.backLink}><ArrowLeft size={16} /></Link>
        <nav className={styles.crumbs}>
          <Link href="/network" className={styles.crumbLink}>Networking</Link>
          <ChevronRight size={12} style={{ opacity: 0.4 }} />
          <span className={styles.crumbCurrent}>{contact.name}</span>
        </nav>
      </div>

      <div className={styles.titleRow}>
        <div className={styles.titleLeft}>
          <div className={styles.titleStatic}>
            <h1 className={styles.title}>{contact.name}</h1>
          </div>
          <div className={styles.meta}>
            <span className={styles.company}>{contact.company}</span>
            <span>·</span>
            <span>{contact.role}</span>
            {contact.email && (
              <a href={`mailto:${contact.email}`} className={styles.urlLink} title={contact.email}>
                {contact.email}
              </a>
            )}
            <a
              href={`https://contacts.google.com/person/${contact.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.urlLink}
              title="Open in Google Contacts"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
        <div className={styles.badges}>
          <span className={styles.statusBadge} style={{ background: statusStyle.bg, color: statusStyle.color }}>
            {STATUS_LABELS[contact.status] ?? contact.status}
          </span>
        </div>
      </div>
    </section>
  );
}
