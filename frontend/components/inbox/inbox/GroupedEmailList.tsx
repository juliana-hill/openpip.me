"use client";
import { useState } from "react";
import type { Email, EmailGroup, Tag } from "./InboxTab";
import { SenderGroupHeader } from "./SenderGroupHeader";
import { EmailRow } from "./EmailRow";
import styles from "./GroupedEmailList.module.css";

type Props = {
  groups: EmailGroup[];
  loading: boolean;
  selected: Set<string>;
  tags: Tag[];
  onToggleSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (email: Email) => void;
  onView: (email: Email) => void;
  onTagsChanged: (updated: Email) => void;
  grouped: boolean;
};

const PAGE_SIZE = 10;

export function GroupedEmailList({ groups, loading, selected, tags, onToggleSelect, onArchive, onDelete, onReply, onView, onTagsChanged, grouped }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [groupPages, setGroupPages] = useState<Map<string, number>>(new Map());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const getPage = (key: string) => groupPages.get(key) ?? 1;

  const setPage = (key: string, page: number) => {
    setGroupPages((prev) => { const next = new Map(prev); next.set(key, page); return next; });
  };

  if (loading) {
    return (
      <div className={styles.list}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.skeleton} style={{ height: 80, opacity: 1 - i * 0.2 }} />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return <p className={styles.empty}>No emails found.</p>;
  }

  return (
    <div className={styles.list}>
      {groups.map((group) => {
        const key = group.senderEmail || group.sender;
        const isExpanded = !grouped || expanded.has(key);
        const unread = group.emails.filter((e) => e.unread).length;

        const page = getPage(key);
        const totalPages = Math.ceil(group.emails.length / PAGE_SIZE);
        // Grouped mode paginates each sender independently. In the normal
        // list, the parent InboxTab pager controls the server-fetched page,
        // so render that entire page and do not add a second pager here.
        const pageEmails = grouped
          ? group.emails.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
          : group.emails;

        return (
          <div key={key} className={styles.group}>
            {grouped && (
              <SenderGroupHeader
                group={group}
                unreadCount={unread}
                expanded={isExpanded}
                onToggle={() => toggle(key)}
              />
            )}
            {isExpanded && (
              <div className={grouped ? styles.rows : undefined}>
                {pageEmails.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    tags={tags}
                    selected={selected.has(email.id)}
                    onToggleSelect={() => onToggleSelect(email.id)}
                    onArchive={() => onArchive(email.id)}
                    onDelete={() => onDelete(email.id)}
                    onReply={() => onReply(email)}
                    onView={() => onView(email)}
                    onTagsChanged={onTagsChanged}
                    indented={grouped}
                  />
                ))}
                {grouped && totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: "1px solid var(--color-border)", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                    <button
                      onClick={() => setPage(key, page - 1)}
                      disabled={page === 1}
                      style={{ background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "var(--color-text-muted)" : "var(--color-accent)", padding: "4px 8px", opacity: page === 1 ? 0.4 : 1 }}
                    >
                      ← Prev
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage(key, page + 1)}
                      disabled={page === totalPages}
                      style={{ background: "none", border: "none", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? "var(--color-text-muted)" : "var(--color-accent)", padding: "4px 8px", opacity: page === totalPages ? 0.4 : 1 }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
