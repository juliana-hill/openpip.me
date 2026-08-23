"use client";

import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import type { Contact, ContactStatus } from "@/types/career";
import styles from "./ContactCard.module.css";

type ContactCardProps = Readonly<{
  contact: Contact;
  onClick?: (contact: Contact) => void;
}>;

const STATUS_CLASS: Record<ContactStatus, string> = {
  not_contacted: styles.statusNotContacted,
  connection_requested: styles.statusConnectionRequested,
  connected: styles.statusConnected,
  messaged: styles.statusMessaged,
  replied: styles.statusReplied,
  meeting_scheduled: styles.statusMeeting,
  followed_up: styles.statusFollowedUp,
};

const STATUS_LABELS: Record<ContactStatus, string> = {
  not_contacted: "Not contacted",
  connection_requested: "Req. sent",
  connected: "Connected",
  messaged: "Contacted",
  replied: "Replied",
  meeting_scheduled: "Meeting set",
  followed_up: "Followed up",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const router = useRouter();
  const initials = contact.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const lastSeen = contact.lastInteractionDate ?? contact.updatedAt ?? contact.addedAt;
  const handleClick = () => {
    if (onClick) { onClick(contact); return; }
    router.push(`/network/contacts/${contact.id}`);
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.row}>
        <div className={styles.titleGroup}>
          <div className={styles.avatar}>
            {initials || <User style={{ width: 16, height: 16 }} />}
          </div>
          <div className={styles.textStack}>
            <h4 className={styles.name}>{contact.name}</h4>
            <p className={styles.meta}>{contact.role} · {contact.company}</p>
          </div>
        </div>
        <span className={`${styles.statusBadge} ${STATUS_CLASS[contact.status]}`}>
          {STATUS_LABELS[contact.status]}
        </span>
      </div>

      {contact.notes && (
        <p className={styles.notes}>{contact.notes}</p>
      )}

      <div className={styles.footer}>
        <p className={styles.footerMeta}>Last: {timeAgo(lastSeen)}</p>
        <a
          href={`https://contacts.google.com/person/${contact.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={styles.linkedInLink}
        >
          Google Contacts →
        </a>
      </div>
    </div>
  );
}
