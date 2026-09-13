"use client";
import { proxyFetch } from "@/lib/proxy";
import { useEffect, useMemo, useState, useRef, type RefObject } from "react";
import type { Email, Tag } from "./InboxTab";
import { TagBadge } from "./TagBadge";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import styles from "./ViewEmailModal.module.css";

type Props = {
  email: Email;
  tags: Tag[];
  onClose: () => void;
  onReply: () => void;
  onDelete?: () => void;
  onBlockSender?: () => void;
  onMarkUnread?: () => void;
  onTagsChanged?: (updated: Email) => void;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch { return iso; }
}

const isHtml = (s: string) => /<\s*[a-z][\s\S]*>/i.test(s);

function htmlInnerText(html: string): string {
  if (typeof DOMParser === "undefined") return "";
  const document = new DOMParser().parseFromString(html, "text/html");
  return document.body?.innerText || document.body?.textContent || "";
}

function HtmlEmailFrame({ html, frameRef, onTextLoaded }: { html: string; frameRef: RefObject<HTMLIFrameElement | null>; onTextLoaded: (text: string) => void }) {
  const src = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 16px; font-family: -apple-system, sans-serif; background: #ffffff; color: #111111; }
    img { max-width: 100%; height: auto; }
    a { color: #1a73e8; }
  </style></head><body>${html}</body></html>`;
  return (
    <iframe
      ref={frameRef}
      srcDoc={src}
      sandbox="allow-same-origin allow-popups"
      className={styles.emailFrame}
      onLoad={(e) => {
        const iframe = e.currentTarget;
        const root = iframe.contentDocument?.documentElement;
        const h = root?.scrollHeight;
        if (h) iframe.style.height = `${h + 32}px`;
        const body = iframe.contentDocument?.body;
        onTextLoaded(body?.innerText || body?.textContent || root?.innerText || "");
      }}
    />
  );
}

export function ViewEmailModal({ email, tags, onClose, onReply, onDelete, onBlockSender, onMarkUnread, onTagsChanged }: Props) {
  const [currentEmail, setCurrentEmail] = useState<Email>(email);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(email.hasDraft ?? false);
  const [markingUnread, setMarkingUnread] = useState(false);
  const [showOriginal, setShowOriginal] = useState(!(email.hasDraft ?? false));
  const [detailLoading, setDetailLoading] = useState(!email.body);
  const emailFrameRef = useRef<HTMLIFrameElement>(null);
  const [renderedEmailSpeechText, setRenderedEmailSpeechText] = useState<{ emailId: string; text: string }>({ emailId: "", text: "" });

  const assignedTags = tags.filter((t) => t.name !== "Draft" && currentEmail.tags.includes(t.name));
  const unassignedTags = tags.filter((t) => t.name !== "Draft" && !currentEmail.tags.includes(t.name));

  useEffect(() => {
    let cancelled = false;
    setCurrentEmail(email);
    if (email.body) {
      setDetailLoading(false);
      return () => { cancelled = true; };
    }

    setDetailLoading(true);
    void proxyFetch(`/agent/inbox/message/${encodeURIComponent(email.id)}`)
      .then(async (res) => res.ok ? await res.json() as { message?: Email } : {})
      .then((data) => {
        if (!cancelled && data.message) setCurrentEmail((current) => ({ ...current, ...data.message }));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [email.id, email.body]);

  useEffect(() => {
    let cancelled = false;
    if (!email.hasDraft) {
      return () => { cancelled = true; };
    }

    void proxyFetch(`/agent/inbox/network/draft/${encodeURIComponent(email.id)}?savedOnly=true`)
      .then(async (res) => res.ok ? await res.json() as { draft?: string } : {})
      .then((data) => { if (!cancelled) setDraft(data.draft ?? null); })
      .catch(() => { if (!cancelled) setDraft(null); })
      .finally(() => { if (!cancelled) setDraftLoading(false); });
    return () => { cancelled = true; };
  }, [email.hasDraft, email.id]);

  const emailSpeechText = useMemo(() => {
    const raw = currentEmail.body ?? currentEmail.snippet ?? "";
    if (!isHtml(raw)) return raw;
    return renderedEmailSpeechText.emailId === currentEmail.id && renderedEmailSpeechText.text
      ? renderedEmailSpeechText.text
      : htmlInnerText(raw);
  }, [currentEmail.body, currentEmail.id, currentEmail.snippet, renderedEmailSpeechText]);

  const canReadEmailAloud = Boolean(currentEmail.body && (!isHtml(currentEmail.body) || emailSpeechText.trim()));

  const handleAssignTag = async (tagId: string) => {
    try {
      const res = await proxyFetch("/agent/inbox/messages/assign-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: currentEmail.id, tagId }),
      });
      if (!res.ok) return;
      const result = await res.json() as { labelIds?: unknown };
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        const labelIds = Array.isArray(result.labelIds) ? new Set(result.labelIds.map(String)) : null;
        const nextTags = labelIds
          ? tags.filter((item) => labelIds.has(item.id)).map((item) => item.name)
          : [...currentEmail.tags, tag.name];
        const updated = { ...currentEmail, tags: nextTags };
        setCurrentEmail(updated);
        onTagsChanged?.(updated);
      }
    } catch { /* the provider state was not changed */ }
    finally { setTagDropdownOpen(false); }
  };

  const handleRemoveTag = async (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;
    try {
      const res = await proxyFetch("/agent/inbox/messages/remove-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: currentEmail.id, tagId }),
      });
      if (!res.ok) return;
      const result = await res.json() as { labelIds?: unknown };
      const labelIds = Array.isArray(result.labelIds) ? new Set(result.labelIds.map(String)) : null;
      const updated = {
        ...currentEmail,
        tags: labelIds
          ? tags.filter((item) => labelIds.has(item.id)).map((item) => item.name)
          : currentEmail.tags.filter((n) => n !== tag.name),
      };
      setCurrentEmail(updated);
      onTagsChanged?.(updated);
    } catch { /* the provider state was not changed */ }
  };

  const handleMarkUnread = async () => {
    if (markingUnread) return;
    setMarkingUnread(true);
    try {
      const res = await proxyFetch("/agent/inbox/mark-unread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [currentEmail.id] }),
      });
      if (res.ok) {
        setCurrentEmail((current) => ({ ...current, unread: true }));
        onMarkUnread?.();
      }
    } finally {
      setMarkingUnread(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.subjectRow}>
              <h2 className={styles.subject}>{currentEmail.subject}</h2>
              {draft && <span className={styles.draftStatus}>Draft</span>}
            </div>
            <div className={styles.meta}>
              <span className={styles.from}>{currentEmail.from} &lt;{currentEmail.fromEmail}&gt;</span>
              <span className={styles.date}>{formatDate(currentEmail.date)}</span>
            </div>
            <div className={styles.tagRow}>
              {assignedTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" onRemove={() => handleRemoveTag(tag.id)} />
              ))}
              {unassignedTags.length > 0 && (
                <div style={{ position: "relative" }}>
                  <button className={styles.addTagBtn} onClick={() => setTagDropdownOpen((o) => !o)}>＋ Tag</button>
                  {tagDropdownOpen && (
                    <div className={styles.tagDropdown}>
                      {unassignedTags.map((tag) => (
                        <button key={tag.id} className={styles.tagDropdownItem} onClick={() => handleAssignTag(tag.id)}>
                          <span className={styles.tagDot} style={{ background: tag.color }} />
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {onDelete && (
                <button
                  className={styles.addTagBtn}
                  onClick={onDelete}
                  style={{ color: "#e53e3e", borderColor: "color-mix(in srgb, #e53e3e 40%, transparent)" }}
                >
                  🗑 Delete
                </button>
              )}
              {onBlockSender && (
                <button
                  className={styles.addTagBtn}
                  onClick={() => {
                    if (window.confirm(`Block ${currentEmail.fromEmail}? Future messages will be automatically removed.`)) onBlockSender();
                  }}
                  style={{ color: "#e53e3e", borderColor: "color-mix(in srgb, #e53e3e 40%, transparent)" }}
                >
                  🚫 Block sender
                </button>
              )}
              {onMarkUnread && (
                <button className={styles.addTagBtn} onClick={() => { void handleMarkUnread(); }} disabled={markingUnread}>
                  {markingUnread ? "Marking…" : "↩ Mark unread"}
                </button>
              )}
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.replyBtn} onClick={onReply}>↩ Reply</button>
            {canReadEmailAloud && (
              <ReadAloudButton
                text={emailSpeechText}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px 6px", display: "flex", alignItems: "center" }}
              />
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
        <div className={styles.body}>
          {currentEmail.hasDraft && (
            <section className={styles.draftSection} aria-live="polite">
              <p className={styles.draftHeading}>Drafted reply</p>
              {draftLoading ? (
                <p className={styles.draftPlaceholder}>Loading saved draft…</p>
              ) : draft ? (
                <pre className={styles.draftBody}>{draft}</pre>
              ) : (
                <p className={styles.draftPlaceholder}>The saved draft is no longer available.</p>
              )}
            </section>
          )}
          {currentEmail.hasDraft && (
            <button className={styles.originalToggle} onClick={() => setShowOriginal((visible) => !visible)}>
              {showOriginal ? "⌃ Hide original message" : "⌄ Show original message"}
            </button>
          )}
          {(!currentEmail.hasDraft || showOriginal) && (
            <>
              {detailLoading ? (
                <p className={styles.snippet}>Loading full message…</p>
              ) : currentEmail.body && isHtml(currentEmail.body) ? (
                <div className={styles.emailFrameWrapper}>
                  <HtmlEmailFrame
                    html={currentEmail.body}
                    frameRef={emailFrameRef}
                    onTextLoaded={(text) => setRenderedEmailSpeechText({ emailId: currentEmail.id, text })}
                  />
                </div>
              ) : currentEmail.body ? (
                <pre className={styles.textBody}>{currentEmail.body}</pre>
              ) : (
                <p className={styles.snippet}>{currentEmail.snippet}</p>
              )}
              {currentEmail.attachments && currentEmail.attachments.length > 0 && (
                <div className={styles.attachments}>
                  <p className={styles.attachmentsLabel}>Attachments ({currentEmail.attachments.length})</p>
                  <div className={styles.attachmentList}>
                    {currentEmail.attachments.map((att) => (
                      <span
                        key={att.name}
                        className={styles.attachmentChip}
                      >
                        📎 {att.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
