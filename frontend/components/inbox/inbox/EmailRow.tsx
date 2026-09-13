"use client";
import { useState, useRef, useEffect } from "react";
import { proxyFetch } from "@/lib/proxy";
import type { Email, Tag } from "./InboxTab";
import { TagBadge } from "./TagBadge";
import styles from "./EmailRow.module.css";

type Props = {
  email: Email;
  tags: Tag[];
  selected: boolean;
  onToggleSelect: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onReply: () => void;
  onView: () => void;
  onTagsChanged?: (updated: Email) => void;
  indented?: boolean;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return iso; }
}

export function EmailRow({ email, tags, selected, onToggleSelect, onArchive, onDelete, onReply, onView, onTagsChanged, indented }: Props) {
  const [tagOpen, setTagOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tagOpen) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setTagOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tagOpen]);

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const estimatedHeight = assignable.length * 32 + 8;
      const flippedUp = r.bottom + estimatedHeight > window.innerHeight;
      setDropdownPos({
        top: flippedUp ? r.top - estimatedHeight - 4 : r.bottom + 4,
        left: r.left,
      });
    }
    setTagOpen((o) => !o);
  };

  const assignedNames = new Set(email.tags.filter((tag) => tag !== "Draft"));
  const assignable = tags.filter((t) => t.name !== "Draft" && !assignedNames.has(t.name));
  const assignedTags = tags.filter((t) => assignedNames.has(t.name));

  const handleAssign = async (tag: Tag) => {
    setTagOpen(false);
    try {
      const res = await proxyFetch("/agent/inbox/messages/assign-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: email.id, tagId: tag.id }),
      });
      if (!res.ok) return;
      const result = await res.json() as { labelIds?: unknown };
      const labelIds = Array.isArray(result.labelIds) ? new Set(result.labelIds.map(String)) : null;
      // Use the label IDs returned by Gmail's messages.modify response for
      // the local render. The row is a cache of provider state, never the
      // place where that state is stored.
      const nextTags = labelIds
        ? tags.filter((item) => labelIds.has(item.id)).map((item) => item.name)
        : [...email.tags, tag.name];
      onTagsChanged?.({ ...email, tags: nextTags });
    } catch { /* the provider state was not changed */ }
  };

  const handleRemove = async (tag: Tag) => {
    try {
      const res = await proxyFetch("/agent/inbox/messages/remove-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: email.id, tagId: tag.id }),
      });
      if (!res.ok) return;
      const result = await res.json() as { labelIds?: unknown };
      const labelIds = Array.isArray(result.labelIds) ? new Set(result.labelIds.map(String)) : null;
      const nextTags = labelIds
        ? tags.filter((item) => labelIds.has(item.id)).map((item) => item.name)
        : email.tags.filter((name) => name !== tag.name);
      onTagsChanged?.({ ...email, tags: nextTags });
    } catch { /* the provider state was not changed */ }
  };

  return (
    <div className={`${styles.row} ${selected ? styles.selected : ""} ${indented ? styles.indented : ""}`} onClick={onView}>
      <span
        className={`${styles.checkbox} ${selected ? styles.checkboxChecked : ""}`}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        role="checkbox"
        aria-checked={selected}
      >
        {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      {email.unread && <span className={styles.unreadDot} />}
      <div className={styles.body}>
        <div className={styles.top}>
          <span className={`${styles.subject} ${email.unread ? styles.bold : ""}`}>{email.subject}</span>
          {email.gmailDraft && <span className={styles.gmailDraftStatus}>Draft</span>}
          {email.hasDraft && !email.gmailDraft && <span className={styles.draftStatus}>Draft</span>}
          <span className={`${styles.sourceBadge} ${styles.source_gmail}`}>Gmail</span>
          {assignedTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} size="sm" onRemove={() => handleRemove(tag)} />
          ))}
          {assignable.length > 0 && (
            <div className={styles.tagDropdownWrap} onClick={(e) => e.stopPropagation()}>
              <button
                ref={btnRef}
                className={styles.addTagBtn}
                onClick={openDropdown}
                title="Add tag"
              >＋</button>
              {tagOpen && (
                <div
                  ref={dropdownRef}
                  className={styles.tagDropdown}
                  style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left }}
                >
                  {assignable.map((tag) => (
                    <button key={tag.id} className={styles.tagDropdownItem} onClick={() => handleAssign(tag)}>
                      <span className={styles.tagDot} style={{ background: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <p className={styles.snippet}>{email.snippet}</p>
      </div>
      <div className={styles.meta}>
        <span className={styles.date}>{formatDate(email.date)}</span>
        <div className={styles.actions}>
          {!email.gmailDraft && <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onReply(); }} title="Reply">↩</button>}
          {!email.gmailDraft && <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onArchive(); }} title="Archive">📦</button>}
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">🗑</button>
        </div>
      </div>
    </div>
  );
}
