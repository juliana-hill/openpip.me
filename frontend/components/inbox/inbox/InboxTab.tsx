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
import { TriageDetailsModal, type TriageRun, type TriageSuggestion } from "./TriageDetailsModal";

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
  /** A native, unsent Gmail draft — distinct from an OpenPip reply suggestion. */
  gmailDraft?: boolean;
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
  fileSuggestions?: number;
  labelsApplied?: number;
  labelFailures?: number;
  readMarked?: number;
  readFailures?: number;
  interactionsTracked?: number;
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
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"date" | "sender" | "count">("date");
  const [grouped, setGrouped] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [replyEmail, setReplyEmail] = useState<Email | null>(null);
  const [replyDraft, setReplyDraft] = useState<string | undefined>();
  const [viewEmail, setViewEmail] = useState<Email | null>(null);
  const [triage, setTriage] = useState<TriageProgress | null>(null);
  const [triageSuggestions, setTriageSuggestions] = useState<TriageSuggestion[]>([]);
  const [triageCurrentRun, setTriageCurrentRun] = useState<TriageRun | null>(null);
  const [triageHistory, setTriageHistory] = useState<TriageRun[]>([]);
  const [triageDetailsOpen, setTriageDetailsOpen] = useState(false);
  const [showTriageCard, setShowTriageCard] = useState(false);
  const triagePoll = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFinishedInitialLoad = useRef(false);
  const openedSourceMessage = useRef(false);
  const tagsRef = useRef(tags);
  tagsRef.current = tags;

  const loadTags = useCallback(async (): Promise<Tag[]> => {
    try {
      const res = await proxyFetch("/agent/inbox/tags");
      if (!res.ok) return tagsRef.current;
      const nextTags = (await res.json() as Tag[]).filter((tag) => tag.name !== "Draft");
      // Keep the ref in sync immediately. A user can click a label rendered
      // from the first message response before React commits the parent
      // state update from this request.
      tagsRef.current = nextTags;
      onTagsLoaded(nextTags);
      return nextTags;
    } catch { return tagsRef.current; }
  }, [onTagsLoaded]);

  const stopTriagePolling = useCallback(() => {
    if (triagePoll.current) window.clearInterval(triagePoll.current);
    triagePoll.current = null;
  }, []);

  // Defined above pollTriage (rather than near openTriageDetails below,
  // where it's also used) because pollTriage's own useCallback references it
  // in its dependency array — a const declared later in the same component
  // body isn't in scope yet at that point (temporal dead zone), even though
  // it would be by the time pollTriage's callback actually runs.
  const loadTriageDetails = useCallback(async () => {
    try {
      const res = await proxyFetch("/agent/inbox/network/details");
      if (res.ok) {
        const data = await res.json() as { suggestions?: TriageSuggestion[]; currentRun?: TriageRun; history?: TriageRun[] };
        const currentRun = data.currentRun ?? { id: "latest", suggestions: data.suggestions ?? [] };
        setTriageCurrentRun(currentRun);
        setTriageSuggestions(currentRun.suggestions ?? data.suggestions ?? []);
        setTriageHistory(data.history ?? []);
      }
    } catch { /* history is optional until the first completed run */ }
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
        // Surface the results the moment the run finishes, rather than
        // making the user notice the card changed and click into it
        // themselves. loadTriageDetails pulls the just-finished run's own
        // suggestions before opening, so the modal never shows stale data.
        void loadTriageDetails().then(() => setTriageDetailsOpen(true));
      }
    };
    triagePoll.current = window.setInterval(() => { void update(); }, 350);
    void update();
  }, [loadTags, loadTriageDetails, stopTriagePolling]);

  useEffect(() => () => stopTriagePolling(), [stopTriagePolling]);

  // Let the inbox content establish itself first, then introduce the assistant
  // as a contextual suggestion instead of competing with the page title.
  useEffect(() => {
    if (!loading && !hasFinishedInitialLoad.current) {
      hasFinishedInitialLoad.current = true;
      setShowTriageCard(true);
    }
  }, [loading]);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      let availableTags = tagsRef.current;
      if (activeTag !== "Unread" && activeTag !== "Drafts" && activeTag !== "Untagged" && !availableTags.some((tag) => tag.name === activeTag)) {
        // Labels can be painted from the message payload before the separate
        // Gmail-label request finishes. Make the first click wait for that
        // request instead of resolving to no label at all.
        availableTags = await loadTags();
      }
      const selectedLabel = activeTag !== "Unread" && activeTag !== "Drafts" && activeTag !== "Untagged"
        ? availableTags.find((tag) => tag.name === activeTag)
        : undefined;
      const params = new URLSearchParams({ source: "gmail", page: String(p), pageSize: String(PAGE_SIZE) });
      if (activeTag === "Drafts") {
        // Native Gmail drafts are a mailbox state, not an OpenPip tag or a
        // user-managed Gmail label. They intentionally include read mail and
        // are never limited to today's Inbox messages.
        params.set("labelId", "DRAFT");
      } else if (selectedLabel) {
        // Label views intentionally include read and archived mail.
        params.set("labelId", selectedLabel.id);
      } else if (activeTag === "Unread") {
        // Unread means every unread message in the Inbox, not just today's —
        // no date restriction here (see backend fetch_gmail_messages: no
        // local_date means no after/before query at all).
        params.set("unreadOnly", "true");
      }
      // "Untagged" falls through with neither localDate nor unreadOnly set —
      // it means every untagged Inbox message, read or unread, any date.
      const res = await proxyFetch(`/agent/inbox/messages?${params.toString()}`);
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
      else throw new Error("Inbox request failed");
    } catch {
      // Do not leave the previous folder's count beside an empty filtered
      // list when Gmail temporarily rejects a request.
      setEmails([]);
      setTotal(0);
      setError("Unable to load this folder. Please try again.");
    }
    setLoading(false);
  }, [activeTag, initialMessageId, loadTags, onEmailsLoaded]);

  const load = useCallback(() => fetchPage(1), [fetchPage]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load(); void loadTags(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [load, loadTags]);

  useEffect(() => {
    onUnreadChange(emails.filter((e) => e.unread).length);
  }, [emails, onUnreadChange]);

  const visibleTags = useMemo(() => tags.filter((tag) => tag.name !== "Draft"), [tags]);

  const allTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const email of emails) {
      for (const tag of email.tags.filter((tag) => tag !== "Draft")) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    // Keep the filter strip in the order returned by Gmail rather than the
    // order labels happen to appear in the currently selected message page.
    const orderedTags = new Map<string, number>();
    for (const tag of visibleTags) {
      orderedTags.set(tag.name, tagCounts.get(tag.name) ?? 0);
    }
    // Preserve any message labels that were not included by the labels
    // endpoint, without allowing them to disturb the stable Gmail order.
    for (const [tag, count] of tagCounts) {
      if (!orderedTags.has(tag)) orderedTags.set(tag, count);
    }
    return orderedTags;
  }, [emails, visibleTags]);

  const filtered = useMemo(() => {
    let list = emails;
    if (activeTag === "Unread") {
      list = list.filter((e) => !e.archived && e.unread);
    } else if (activeTag === "Drafts") {
      list = list.filter((e) => !e.archived && e.gmailDraft);
    } else {
      list = list.filter((e) => !e.archived);
      if (activeTag === "Untagged") {
        list = list.filter((e) => e.tags.length === 0);
      } else {
        list = list.filter((e) => e.tags.includes(activeTag));
      }
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
    const previousEmails = emails;
    const removedCount = previousEmails.filter((email) => ids.includes(email.id)).length;
    // Optimistically hide deleted messages so the inbox responds immediately.
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    setTotal((prev) => Math.max(0, prev - removedCount));
    setSelected(new Set());
    try {
      const response = await proxyFetch("/agent/inbox/message", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Delete request failed");
    } catch {
      // Restore the row if the server could not move it to Gmail Trash.
      setEmails(previousEmails);
      setTotal((prev) => prev + removedCount);
    }
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

  const openTriageDetails = async () => {
    await loadTriageDetails();
    setTriageDetailsOpen(true);
  };

  const saveTriageChanges = async (runId: string, messageIds: string[]) => {
    const res = await proxyFetch("/agent/inbox/network/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, messageIds }),
    });
    if (!res.ok) throw new Error("Unable to save triage changes");
    // The backend returns 200 even when every item failed (a bulk operation
    // with per-item results, not an all-or-nothing transaction) — the actual
    // outcome is in the body, not the HTTP status.
    const data = await res.json() as { applied?: { messageId: string }[]; failures?: { messageId: string; error: string }[] };
    await Promise.all([load(), loadTriageDetails()]);
    return { applied: data.applied ?? [], failures: data.failures ?? [] };
  };

  const markTriageMessagesUnread = async (messageIds: string[]) => {
    const res = await proxyFetch("/agent/inbox/mark-unread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: messageIds }),
    });
    if (!res.ok) throw new Error("Unable to mark triage messages unread");
    await loadTriageDetails();
  };

  useEffect(() => { void loadTriageDetails(); }, [loadTriageDetails]);

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
  const unreadEmailCount = emails.filter((email) => email.unread).length;
  const reviewButtonLabel = unreadEmailCount
    ? `Review ${unreadEmailCount} unread email${unreadEmailCount === 1 ? "" : "s"}`
    : "Review inbox";

  return (
    <>
      <InboxHeader unreadCount={unreadEmailCount} onCompose={onCompose} />
      {showTriageCard && (triage ? (
        <section className={styles.triage} aria-live="polite">
          <div className={styles.triageContent}>
            <p className={styles.triageKicker}><span aria-hidden="true">✦</span> Inbox assistant</p>
            <h3 className={styles.triageTitle}>
              {triage.status === "running" ? "Reviewing your inbox" : triage.status === "completed" ? "Your inbox review is ready" : "Your inbox review needs attention"}
            </h3>
            <p className={styles.triageCopy}>
              {triage.status === "running"
                ? `Looking at ${triage.processed} of ${triage.total} unread emails. You can keep browsing.`
                : triage.status === "completed"
                  ? "Your assistant has prepared suggestions for you to review."
                  : "We could not finish reviewing every email. You can try again when you are ready."}
            </p>
          </div>
          {triage.status !== "running" && (
            <div className={styles.triageActions}>
              <button type="button" className={styles.triageReviewBtn} onClick={() => { void openTriageDetails(); }}>Review details</button>
            </div>
          )}
          <div className={styles.triageProgress}>
            <div className={styles.triageLabel}>
              <span>{triage.status === "running" ? "Review in progress" : "Review summary"}</span>
              <span>{triage.processed} of {triage.total} emails</span>
            </div>
            <div className={styles.triageTrack} role="progressbar" aria-valuemin={0} aria-valuemax={triage.total} aria-valuenow={triage.processed} aria-label="Inbox review progress">
              <div className={styles.triageFill} style={{ width: `${triage.total ? (triage.processed / triage.total) * 100 : 100}%` }} />
            </div>
            <p className={styles.triageSummary}>
              {triage.fileSuggestions ?? triage.deleted} filing suggestions · {triage.tasksCreated} task suggestions{triage.labelsApplied ? ` · ${triage.labelsApplied} Gmail tags applied` : ""}{triage.draftsCreated ? ` · ${triage.draftsCreated} reply drafts` : ""}{triage.interactionsTracked ? ` · ${triage.interactionsTracked} networking interactions logged` : ""}{triage.labelFailures ? ` · ${triage.labelFailures} tag failures` : ""}{triage.failed ? ` · ${triage.failed} failed` : ""}
            </p>
          </div>
        </section>
      ) : (
        <section className={styles.triage}>
          <div className={styles.triageContent}>
            <p className={styles.triageKicker}><span aria-hidden="true">✦</span> Inbox assistant</p>
            <h3 className={styles.triageTitle}>Clear the small stuff. Keep the important things.</h3>
            <p className={styles.triageCopy}>
              {unreadEmailCount
                ? `Review ${unreadEmailCount} unread email${unreadEmailCount === 1 ? "" : "s"} and surface what needs your attention.`
                : "Review recent mail and surface anything that still needs your attention."}
            </p>
            <p className={styles.triageCapabilities}>
              <strong>Can do:</strong> apply Gmail tags · draft replies · suggest Google Tasks
            </p>
          </div>
          <div className={styles.triageActions}>
            <button className={styles.triageRunBtn} onClick={runTriage}>{reviewButtonLabel}</button>
            <p className={styles.triageTrust}>Nothing is sent or changed without your review.</p>
            {triageHistory.length > 0 && (
              <button type="button" className={styles.triageHistoryLink} onClick={() => { void openTriageDetails(); }}>
                Review History
              </button>
            )}
          </div>
        </section>
      ))}
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
      {error ? (
        <p style={{ color: "var(--color-danger, #b42318)", fontSize: "var(--font-size-sm)" }}>{error}</p>
      ) : (
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
      )}
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
          onMarkUnread={() => {
            setEmails((prev) => prev.map((item) => item.id === viewEmail.id ? { ...item, unread: true } : item));
          }}
          onTagsChanged={(updatedEmail) => setEmails((prev) => {
            const next = prev.map((e) => e.id === updatedEmail.id ? updatedEmail : e);
            onEmailsLoaded?.(next);
            return next;
          })}
        />
      )}
      <TriageDetailsModal
        open={triageDetailsOpen}
        suggestions={triageSuggestions}
        currentRun={triageCurrentRun}
        history={triageHistory}
        onSaveChanges={saveTriageChanges}
        onMarkUnread={markTriageMessagesUnread}
        onClose={() => setTriageDetailsOpen(false)}
      />
    </>
  );
}
