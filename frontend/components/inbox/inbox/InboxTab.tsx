"use client";
import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import styles from "./InboxTab.module.css";
import { InboxHeader } from "./InboxHeader";
import { SearchSortBar } from "./SearchSortBar";
import { TagFilterStrip } from "./TagFilterStrip";
import { GroupedEmailList } from "./GroupedEmailList";
import { ReplyModal } from "./ReplyModal";
import { ViewEmailModal } from "./ViewEmailModal";

export type Tag = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type Email = {
  id: string;
  subject: string;
  snippet: string;
  from: string;
  fromEmail: string;
  date: string;
  unread: boolean;
  source: "gmail";
  tags: string[];
  body?: string;
  archived?: boolean;
  attachments?: { name: string }[];
  hasDraft?: boolean;
};

export type EmailGroup = {
  sender: string;
  senderEmail: string;
  emails: Email[];
  latestDate: string;
};

type TriageProgress = {
  id: string;
  status: "running" | "completed" | "failed";
  total: number;
  attempted?: number;
  processed: number;
  deleted: number;
  tasksCreated: number;
  draftsCreated?: number;
  draftedMessageIds?: string[];
  failed?: number;
};

type Props = {
  unreadCount: number;
  onUnreadChange: (n: number) => void;
  onCompose: () => void;
  tags: Tag[];
  activeTag: string;
  onActiveTagChange: (tag: string) => void;
  onTagsLoaded: (tags: Tag[]) => void;
  onEmailsLoaded?: (emails: Email[]) => void;
  initialMessageId?: string;
};

export function InboxTab({ onUnreadChange, onCompose, tags, activeTag, onActiveTagChange, onTagsLoaded, onEmailsLoaded, initialMessageId }: Props) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"date" | "sender" | "count">("date");
  const [grouped, setGrouped] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [replyEmail, setReplyEmail] = useState<Email | null>(null);
  const [replyDraft, setReplyDraft] = useState<string | undefined>();
  const [viewEmail, setViewEmail] = useState<Email | null>(null);
  const [triage, setTriage] = useState<TriageProgress | null>(null);
  const triagePoll = useRef<ReturnType<typeof setInterval> | null>(null);
  const openedSourceMessage = useRef(false);

  const loadTags = useCallback(async () => {
    try {
      const res = await proxyFetch("/agent/inbox/tags");
      if (res.ok) onTagsLoaded((await res.json() as Tag[]).filter((tag) => tag.name !== "Draft"));
    } catch { /* silent */ }
  }, [onTagsLoaded]);

  const stopTriagePolling = useCallback(() => {
    if (triagePoll.current) window.clearInterval(triagePoll.current);
    triagePoll.current = null;
  }, []);

  const pollTriage = useCallback((jobId: string) => {
    stopTriagePolling();
    const update = async () => {
      const res = await proxyFetch(`/agent/inbox/network/triage/${jobId}`);
      if (!res.ok) {
        setTriage((current) => current ? { ...current, status: "failed" } : current);
        stopTriagePolling();
        return;
      }
      const progress = await res.json() as TriageProgress;
      setTriage(progress);
      const draftedMessageIds = progress.draftedMessageIds ?? [];
      if (draftedMessageIds.length) {
        setEmails((current) => current.map((email) => draftedMessageIds.includes(email.id)
          ? { ...email, hasDraft: true }
          : email));
      }
      if (progress.status !== "running") {
        stopTriagePolling();
        void loadTags();
      }
    };
    triagePoll.current = window.setInterval(() => { void update(); }, 350);
    void update();
  }, [loadTags, stopTriagePolling]);

  useEffect(() => () => stopTriagePolling(), [stopTriagePolling]);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const localDate = new Date().toISOString().slice(0, 10);
      const res = await proxyFetch(`/agent/inbox/messages?source=gmail&localDate=${localDate}&page=${p}&pageSize=${PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json() as { messages: Email[]; total: number; page: number; pageSize: number };
        const draftRes = await proxyFetch("/agent/inbox/network/drafts");
        const draftData = draftRes.ok ? await draftRes.json() as { messageIds?: string[] } : {};
        const draftedIds = new Set(draftData.messageIds ?? []);
        const msgs = (data.messages ?? []).filter((email) => email.source === "gmail").map((email) => ({
          ...email,
          tags: email.tags.filter((tag) => tag !== "Draft"),
          hasDraft: draftedIds.has(email.id),
        }));
        setEmails(msgs);
        setTotal(data.total ?? msgs.length);
        setPage(p);
        onEmailsLoaded?.(msgs);
        if (initialMessageId && !openedSourceMessage.current) {
          const sourceMessage = msgs.find((email) => email.id === initialMessageId);
          if (sourceMessage) {
            openedSourceMessage.current = true;
            setViewEmail(sourceMessage);
          } else {
            // Message not in current page — fetch it directly
            openedSourceMessage.current = true;
            proxyFetch(`/agent/inbox/message/${encodeURIComponent(initialMessageId)}`)
              .then(async (r) => {
                if (!r.ok) return;
                const data = await r.json() as { message?: Email };
                if (data.message) setViewEmail(data.message);
              })
              .catch(() => {});
          }
        }
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [initialMessageId, onEmailsLoaded, pollTriage]);

  const load = useCallback(() => fetchPage(1), [fetchPage]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load(); void loadTags(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [load, loadTags]);

  useEffect(() => {
    onUnreadChange(emails.filter((e) => e.unread).length);
  }, [emails, onUnreadChange]);

  const allTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const email of emails) {
      for (const tag of email.tags.filter((tag) => tag !== "Draft")) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    return tagCounts;
  }, [emails]);

  const visibleTags = useMemo(() => tags.filter((tag) => tag.name !== "Draft"), [tags]);

  const filtered = useMemo(() => {
    let list = emails;
    if (activeTag === "Archived") {
      list = list.filter((e) => e.archived);
    } else if (activeTag !== "All") {
      list = list.filter((e) => !e.archived);
      if (activeTag === "Untagged") {
        list = list.filter((e) => e.tags.length === 0);
      } else {
        list = list.filter((e) => e.tags.includes(activeTag));
      }
    } else {
      list = list.filter((e) => !e.archived);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.subject.toLowerCase().includes(q) || e.snippet.toLowerCase().includes(q) || e.from.toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, activeTag, search]);

  const groups = useMemo((): EmailGroup[] => {
    const map = new Map<string, EmailGroup>();
    for (const email of filtered) {
      const key = email.fromEmail;
      if (!map.has(key)) {
        map.set(key, { sender: email.from, senderEmail: email.fromEmail, emails: [], latestDate: email.date });
      }
      map.get(key)!.emails.push(email);
    }
    const gs = Array.from(map.values());
    if (sort === "date") gs.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
    else if (sort === "sender") gs.sort((a, b) => a.sender.localeCompare(b.sender));
    else if (sort === "count") gs.sort((a, b) => b.emails.length - a.emails.length);
    return gs;
  }, [filtered, sort]);

  const handleArchive = async (ids: string[]) => {
    await proxyFetch("/agent/inbox/archive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    setEmails((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, archived: true } : e));
    setSelected(new Set());
  };

  const handleDelete = async (ids: string[]) => {
    await proxyFetch("/agent/inbox/message", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    setSelected(new Set());
  };

  const handleBlockSender = async (messageIds: string[], senderEmails: string[]) => {
    await proxyFetch("/agent/inbox/block-sender", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds, senderEmails }),
    });
    setEmails((prev) => prev.filter((e) => !messageIds.includes(e.id)));
    setSelected(new Set());
  };

  const runTriage = async () => {
    try {
      const res = await proxyFetch("/agent/inbox/network/queue-triage", { method: "POST" });
      if (!res.ok) return;
      const progress = await res.json() as TriageProgress;
      setTriage(progress);
      if (progress.status === "running") pollTriage(progress.id);
    } catch { /* silent */ }
  };

  const openReply = async (email: Email) => {
    try {
      const res = await proxyFetch(`/agent/inbox/network/draft/${encodeURIComponent(email.id)}`);
      const data = res.ok ? await res.json() as { draft?: string } : {};
      setReplyDraft(data.draft);
    } catch { setReplyDraft(undefined); }
    setReplyEmail(email);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <>
      <InboxHeader unreadCount={emails.filter((e) => e.unread).length} onCompose={onCompose} />
      {triage ? (
        <section className={styles.triage} aria-live="polite">
          <div className={styles.triageLabel}>
            <span>{triage.status === "running" ? "Organizing inbox" : triage.status === "completed" ? "Inbox organized" : "Inbox processing needs attention"}</span>
            <span>{triage.processed} of {triage.total} emails processed</span>
          </div>
          <div className={styles.triageTrack} role="progressbar" aria-valuemin={0} aria-valuemax={triage.total} aria-valuenow={triage.processed} aria-label="Inbox processing progress">
            <div className={styles.triageFill} style={{ width: `${triage.total ? (triage.processed / triage.total) * 100 : 100}%` }} />
          </div>
          <p className={styles.triageSummary}>
            {triage.deleted} cleared · {triage.tasksCreated} tasks created{triage.failed ? ` · ${triage.failed} failed` : ""}
          </p>
        </section>
      ) : (
        <section className={styles.triage}>
          <div className={styles.triageLabel}>
            <span>Inbox triage</span>
            <button className={styles.triageRunBtn} onClick={runTriage}>Run triage</button>
          </div>
        </section>
      )}
      <SearchSortBar
        search={search}
        sort={sort}
        grouped={grouped}
        onSearch={setSearch}
        onSort={setSort}
        onGroupToggle={() => setGrouped((g) => !g)}
        onRefresh={load}
      />
      <TagFilterStrip
        tags={allTags}
        tagObjects={visibleTags}
        active={activeTag}
        onChange={onActiveTagChange}
        archivedCount={emails.filter((e) => e.archived).length}
        onManageTags={loadTags}
        selectedEmails={emails.filter((e) => selected.has(e.id))}
        onArchive={() => handleArchive(Array.from(selected))}
        onDelete={() => handleDelete(Array.from(selected))}
        onBlockSender={handleBlockSender}
      />
      {!loading && total > 0 && (
        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "0 0 4px" }}>
          {`${total} email${total !== 1 ? "s" : ""}`}
        </p>
      )}
      <GroupedEmailList
        groups={grouped ? groups : [{ sender: "All", senderEmail: "", emails: filtered, latestDate: "" }]}
        loading={loading}
        selected={selected}
        tags={visibleTags}
        onToggleSelect={toggleSelect}
        onArchive={(id) => handleArchive([id])}
        onDelete={(id) => handleDelete([id])}
        onReply={(email) => { void openReply(email); }}
        onTagsChanged={(updatedEmail) => setEmails((prev) => {
          const next = prev.map((e) => e.id === updatedEmail.id ? updatedEmail : e);
          onEmailsLoaded?.(next);
          return next;
        })}
        onView={(email) => {
          setViewEmail(email);
          if (email.unread) {
            setEmails((prev) => prev.map((e) => e.id === email.id ? { ...e, unread: false } : e));
            proxyFetch("/agent/inbox/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [email.id] }) }).catch(() => {});
          }
        }}
        grouped={grouped}
      />
      {!loading && total > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
          <button
            onClick={() => fetchPage(page - 1)}
            disabled={page === 1}
            style={{ background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "var(--color-text-muted)" : "var(--color-accent)", padding: "4px 8px", opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
          <button
            onClick={() => fetchPage(page + 1)}
            disabled={page >= Math.ceil(total / PAGE_SIZE)}
            style={{ background: "none", border: "none", cursor: page >= Math.ceil(total / PAGE_SIZE) ? "default" : "pointer", color: page >= Math.ceil(total / PAGE_SIZE) ? "var(--color-text-muted)" : "var(--color-accent)", padding: "4px 8px", opacity: page >= Math.ceil(total / PAGE_SIZE) ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
      {replyEmail && <ReplyModal email={replyEmail} initialBody={replyDraft} onClose={() => { setReplyEmail(null); setReplyDraft(undefined); }} />}
      {viewEmail && (
        <ViewEmailModal
          key={viewEmail.id}
          email={viewEmail}
          tags={visibleTags}
          onClose={() => setViewEmail(null)}
          onReply={() => { void openReply(viewEmail); setViewEmail(null); }}
          onDelete={() => { handleDelete([viewEmail.id]); setViewEmail(null); }}
          onBlockSender={() => { handleBlockSender([viewEmail.id], [viewEmail.fromEmail]); setViewEmail(null); }}
          onTagsChanged={(updatedEmail) => setEmails((prev) => {
            const next = prev.map((e) => e.id === updatedEmail.id ? updatedEmail : e);
            onEmailsLoaded?.(next);
            return next;
          })}
        />
      )}
    </>
  );
}
