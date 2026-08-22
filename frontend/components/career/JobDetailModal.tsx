"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback, useRef, useEffect } from "react";
import { ExternalLink, Users, ChevronDown, EyeOff, Trash2, Pencil, Check, X, FileText, Copy, CheckCheck } from "lucide-react";
import { TrippyIcon } from "@/components/TrippyIcon";
import { useAgentIdentity } from "@/lib/agentIdentity";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Job, JobStatus, JobRefinement } from "@/types/career";
import styles from "./JobDetailModal.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import overlayStyles from "@/components/ui/ModalOverlay.module.css";

function isValidUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

type Contact = {
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  url: string | null;
  source: string | null;
  relevantJobTitle: string;
  score?: number;
};

type JobDetailModalProps = Readonly<{
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (jobId: string, status: JobStatus) => void;
  onNotesChange: (jobId: string, notes: string) => void;
  onUrlChange: (jobId: string, url: string) => void;
  onUrlVerifiedChange: (jobId: string, verified: boolean) => void;
  onJdChange: (jobId: string, jd: string) => void;
  onOverlapsChange: (jobId: string, overlaps: string) => void;
  onJobUpdate: (jobId: string, patch: Partial<Job>) => void;
  onSkipCompany?: (company: string) => void;
  onDeleteJob?: (jobId: string) => void;
}>;

const STATUS_OPTIONS: JobStatus[] = ["saved", "applied", "interviewing", "offer", "closed", "rejected"];

const STATUS_STYLES: Record<JobStatus, React.CSSProperties> = {
  saved:        { background: "var(--color-bg)", color: "var(--color-text-muted)" },
  applied:      { background: "color-mix(in srgb, #3b82f6 15%, var(--color-bg))", color: "#3b82f6" },
  interviewing: { background: "var(--color-accent-light)", color: "var(--color-accent)" },
  offer:        { background: "color-mix(in srgb, #34d399 15%, var(--color-bg))", color: "#34d399" },
  closed:       { background: "var(--color-bg)", color: "var(--color-text-muted)", opacity: 0.6 },
  rejected:     { background: "color-mix(in srgb, #f87171 15%, var(--color-bg))", color: "#f87171" },
};

export function JobDetailModal({ job, open, onOpenChange, onStatusChange, onNotesChange, onUrlChange, onUrlVerifiedChange, onJdChange, onOverlapsChange, onJobUpdate, onSkipCompany, onDeleteJob }: JobDetailModalProps) {
  const { name: agentName } = useAgentIdentity();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setStatusMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusMenuOpen]);

  const HEADER_KEY = "resume-header";
  const [showHeaderEditor, setShowHeaderEditor] = useState(false);
  const [resumeHeader, setResumeHeader] = useState<{ name: string; email: string; phone: string; linkedin: string; location: string }>(() => {
    try { return JSON.parse(localStorage.getItem(HEADER_KEY) ?? "{}"); } catch { return {}; }
  });

  const [refinements, setRefinements] = useState<JobRefinement[] | null>(job?.refinements ?? null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [appQuestions, setAppQuestions] = useState<[string, string][]>((job as Record<string, unknown>)?.app_questions as [string, string][] ?? []);
  const [appQuestionInput, setAppQuestionInput] = useState("");
  const [appQuestionLoading, setAppQuestionLoading] = useState(false);
  const [appQuestionError, setAppQuestionError] = useState<string | null>(null);
  const [appQuestionStatus, setAppQuestionStatus] = useState("");
  const [regenIndex, setRegenIndex] = useState<number | null>(null);

  const [coverLetter, setCoverLetter] = useState<string | null>(job?.coverLetter ?? null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  const [coverLetterStatus, setCoverLetterStatus] = useState("");
  const [coverLetterCopied, setCoverLetterCopied] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("");
  const [notes, setNotes] = useState(job?.notes ?? "");
  const [jdText, setJdText] = useState<string | null>(job?.jd ?? null);
  const [jdLoading, setJdLoading] = useState(false);
  const [urlDraft, setUrlDraft] = useState(job?.url ?? "");
  const [editingUrl, setEditingUrl] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(job?.role ?? "");
  const [urlVerified, setUrlVerified] = useState(job?.urlVerified ?? false);
  const [overlapsText, setOverlapsText] = useState<string | null>(job?.overlaps ?? null);
  const [overlapsLoading, setOverlapsLoading] = useState(false);
  const [overlapsError, setOverlapsError] = useState(false);

  const stableNotes = job?.notes ?? "";
  if (notes !== stableNotes && !open) setNotes(stableNotes);

  const stableUrl = job?.url ?? "";
  const [lastUrl, setLastUrl] = useState("");
  if (stableUrl !== lastUrl) {
    setLastUrl(stableUrl);
    setJdText(job?.jd ?? null);
    setOverlapsText(job?.overlaps ?? null);
    setUrlDraft(stableUrl);
    setUrlVerified(job?.urlVerified ?? false);
    setRefinements(job?.refinements ?? null);
    setCoverLetter(job?.coverLetter ?? null);
    setTitleDraft(job?.role ?? "");
    setEditingTitle(false);
  }

  const handleFetchJd = useCallback(async () => {
    const url = urlDraft.trim() || job?.url;
    if (!url) return;
    setJdLoading(true);
    try {
      const res = await proxyFetch("/agent/career/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, jobId: job?.id }),
      });
      setJdText(res.ok ? ((await res.json()) as { text?: string }).text ?? "Could not extract job description." : "Failed to load — try opening the link directly.");
    } catch {
      setJdText("Failed to load — try opening the link directly.");
    } finally {
      setJdLoading(false);
    }
  }, [urlDraft, job?.url, job?.id]);

  const handleFindPeople = useCallback(async () => {
    if (!job) return;
    setContactsLoading(true);
    setContactsError(false);
    setContacts([]);
    try {
      const res = await proxyFetch("/agent/career/find-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: job.company, role: job.role }),
      });
      if (!res.ok) { setContactsError(true); setContactsLoading(false); return; }
      const { jobId } = await res.json() as { jobId: string };
      const sw = await navigator.serviceWorker.ready;
      sw.active?.postMessage({ type: "START_FIND_PEOPLE_POLL", jobId });
      const bc = new BroadcastChannel("route-jobs");
      const onMessage = (e: MessageEvent) => {
        const msg = e.data as { type: string; jobId: string; status: string; contacts?: Contact[]; error?: string };
        if (msg.type !== "FIND_PEOPLE_UPDATE" || msg.jobId !== jobId) return;
        if (msg.status === "completed") { setContacts((msg.contacts ?? []).slice(0, 6)); setContactsLoading(false); bc.removeEventListener("message", onMessage); bc.close(); }
        else if (msg.status === "failed") { setContactsError(true); setContactsLoading(false); bc.removeEventListener("message", onMessage); bc.close(); }
      };
      bc.addEventListener("message", onMessage);
    } catch { setContactsError(true); setContactsLoading(false); }
  }, [job]);

  const handleFindOverlaps = useCallback(async () => {
    if (!job || !jdText) return;
    setOverlapsLoading(true);
    setOverlapsError(false);
    setOverlapsText(null);
    try {
      const res = await proxyFetch("/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I'm applying for a ${job.role} role at ${job.company}. Here is the job description:\n\n${jdText}\n\nUsing my full career history (start from my earliest full-time position when calculating experience — full-time co-ops count), produce an overlap analysis using the required output format from the depth-positioning rule: **Overlaps** bullet points, **Gaps** bullet points each with sub-bullets on how to address them, and **Positioning** bullet points with first-person lift-and-use language. Nothing else.`,
          skill: "executive-coach",
        }),
      });
      const { jobId } = (await res.json()) as { jobId: string };
      while (true) {
        await new Promise((r) => setTimeout(r, 800));
        const statusRes = await proxyFetch(`/agent/chat/status/${jobId}`);
        if (!statusRes.ok) continue;
        const agentJob = (await statusRes.json()) as { status: string; result?: string };
        if (agentJob.status === "completed") { const result = agentJob.result ?? "No overlaps found."; setOverlapsText(result); onOverlapsChange(job.id, result); break; }
        if (agentJob.status === "failed") { setOverlapsError(true); break; }
      }
    } catch { setOverlapsError(true); }
    finally { setOverlapsLoading(false); }
  }, [job, jdText]);

  const handleRunReview = useCallback(async () => {
    if (!job) return;
    setReviewLoading(true);
    setReviewError(null);
    setReviewStatus("Reviewing…");
    setRefinements(null);
    onJobUpdate(job.id, { refinements: undefined, research: undefined });
    await proxyFetch(`/agent/career/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refinements: null, research: null }) }).catch(() => {});
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/review`, { method: "POST" });
      if (!res.ok) { const d = await res.json() as { error?: string }; setReviewError(d.error ?? "Review failed"); setReviewLoading(false); return; }
      const { jobId: phaseJobId } = await res.json() as { jobId: string };
      const sw = navigator.serviceWorker.controller;
      if (!sw) { setReviewError("Service worker not ready — try reloading."); setReviewLoading(false); return; }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      const onMessage = (e: MessageEvent) => {
        const msg = e.data as { type: string; jobId: string; status: string; statusMessage?: string; result?: Record<string, unknown>; error?: string };
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") { setReviewStatus(msg.statusMessage ?? "Reviewing…"); return; }
        if (msg.status === "completed") { const rf = (msg.result as { refinements?: JobRefinement[] })?.refinements ?? null; setRefinements(rf); setReviewLoading(false); if (rf) onJobUpdate(job.id, { refinements: rf }); }
        if (msg.status === "failed") { setReviewError(msg.error ?? "Review failed"); setReviewLoading(false); }
        bc.removeEventListener("message", onMessage); bc.close();
      };
      bc.addEventListener("message", onMessage);
    } catch { setReviewError("Review failed"); setReviewLoading(false); }
  }, [job, onJobUpdate]);

  const handleAcceptRefinement = useCallback((entryId: string) => {
    if (!job) return;
    const updated = refinements?.map((r) => r.entryId === entryId ? { ...r, accepted: true } : r) ?? null;
    setRefinements(updated);
    onJobUpdate(job.id, { refinements: updated ?? undefined });
  }, [job, refinements, onJobUpdate]);

  const handleDismissRefinement = useCallback((entryId: string) => {
    if (!job) return;
    const updated = refinements?.map((r) => r.entryId === entryId ? { ...r, dismissed: true } : r) ?? null;
    setRefinements(updated);
    onJobUpdate(job.id, { refinements: updated ?? undefined });
  }, [job, refinements, onJobUpdate]);

  const handleExportResume = useCallback(() => {
    if (!job || !refinements) return;
    const all = refinements.filter((r) => r.accepted && !r.dismissed);
    if (all.length === 0) return;
    try { localStorage.setItem(HEADER_KEY, JSON.stringify(resumeHeader)); } catch { /* ignore */ }
    const SECTION_LABELS: Record<string, string> = { work: "Experience", education: "Education", certification: "Certifications", award: "Awards & Recognition", club: "Leadership & Activities", project: "Projects" };
    const SECTION_ORDER = ["work", "education", "certification", "award", "club", "project"];
    const parseDate = (d?: string): number => {
      if (!d) return 0;
      const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
      const parts = d.trim().split(/\s+/);
      if (parts.length === 2) { const mon = months[parts[0].toLowerCase().slice(0, 3)] ?? 0; const yr = parseInt(parts[1], 10) || 0; return yr * 100 + mon; }
      return (parseInt(parts[0], 10) || 0) * 100;
    };
    const groups = new Map<string, typeof all>();
    for (const r of all) { const type = r.entryType ?? "other"; if (!groups.has(type)) groups.set(type, []); groups.get(type)!.push(r); }
    for (const entries of groups.values()) entries.sort((a, b) => parseDate(b.entryStartDate) - parseDate(a.entryStartDate));
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerLines: string[] = [];
    if (resumeHeader.name) headerLines.push(`<div class="resume-name">${esc(resumeHeader.name)}</div>`);
    const contactParts: string[] = [];
    if (resumeHeader.phone) contactParts.push(esc(resumeHeader.phone));
    if (resumeHeader.email) contactParts.push(`<a href="mailto:${esc(resumeHeader.email)}">${esc(resumeHeader.email)}</a>`);
    if (resumeHeader.linkedin) contactParts.push(`<a href="${esc(resumeHeader.linkedin)}">${esc(resumeHeader.linkedin.replace(/^https?:\/\//, ""))}</a>`);
    if (contactParts.length) headerLines.push(`<div class="resume-contact">${contactParts.join(" | ")}</div>`);
    let body = "";
    for (const type of SECTION_ORDER) {
      const entries = groups.get(type);
      if (!entries?.length) continue;
      body += `<h2>${SECTION_LABELS[type] ?? "Other"}</h2>`;
      for (const r of entries) {
        const dates = [r.entryStartDate, r.entryEndDate].filter(Boolean).join(" – ");
        body += `<div class="entry"><div class="entry-top"><span class="entry-org">${esc(r.entryOrganization)}</span>${r.entryLocation ? `<span class="entry-location">${esc(r.entryLocation)}</span>` : ""}</div><div class="entry-role-line"><span class="entry-role">${esc(r.entryTitle)}</span>${dates ? `<span class="entry-dates">${esc(dates)}</span>` : ""}</div><ul>${r.refinedBullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`;
      }
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(job.role)} at ${esc(job.company)} — Resume</title><style>*{box-sizing:border-box}body{font-family:"Times New Roman",Times,serif;font-size:11pt;margin:0.85in 1in;color:#000}.resume-name{text-align:center;font-size:18pt;font-weight:bold;margin-bottom:2px}.resume-contact{text-align:center;font-size:10pt;margin-bottom:14px}.resume-contact a{color:#000;text-decoration:none}h2{font-size:11pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;border-bottom:1.5px solid #000;padding-bottom:1px;margin-top:14px;margin-bottom:6px}.entry{margin-bottom:10px}.entry-top{display:flex;justify-content:space-between;align-items:baseline}.entry-org{font-weight:bold;font-size:11pt}.entry-location{font-size:10pt}.entry-role-line{display:flex;justify-content:space-between;align-items:baseline}.entry-role{font-style:italic;font-size:11pt}.entry-dates{font-size:10pt}ul{margin:3px 0 0;padding-left:20px}li{margin-bottom:2px;line-height:1.35}@media print{@page{margin:.5in;size:letter}body{margin:0}}</style></head><body>${headerLines.join("\n")}${body}</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus(); win.print();
    const reset = refinements.map((r) => ({ ...r, accepted: false, dismissed: false }));
    setRefinements(reset);
    onJobUpdate(job.id, { refinements: reset });
    setShowHeaderEditor(false);
  }, [job, refinements, resumeHeader, onJobUpdate]);

  const handleGenerateAppQuestion = useCallback(async (question: string, index?: number) => {
    if (!job || !question.trim()) return;
    setAppQuestionLoading(true); setAppQuestionError(null); setAppQuestionStatus("Writing your response…");
    if (typeof index === "number") setRegenIndex(index);
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/app-question`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, index }) });
      if (!res.ok) { const d = await res.json() as { error?: string }; setAppQuestionError(d.error ?? "Failed to generate response"); setAppQuestionLoading(false); setRegenIndex(null); return; }
      const { jobId: phaseJobId } = await res.json() as { jobId: string };
      const sw = navigator.serviceWorker.controller;
      if (!sw) { setAppQuestionError("Service worker not ready — try reloading."); setAppQuestionLoading(false); setRegenIndex(null); return; }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      const onMessage = (e: MessageEvent) => {
        const msg = e.data as { type: string; jobId: string; status: string; statusMessage?: string; result?: Record<string, unknown>; error?: string };
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") { setAppQuestionStatus(msg.statusMessage ?? "Writing…"); return; }
        if (msg.status === "completed") {
          const q = msg.result?.question as string; const r = msg.result?.response as string;
          setAppQuestions((prev) => { const next = [...prev]; if (typeof index === "number" && index >= 0 && index < next.length) next[index] = [q, r]; else next.push([q, r]); queueMicrotask(() => onJobUpdate(job.id, { app_questions: next } as Record<string, unknown>)); return next; });
          setAppQuestionInput(""); setAppQuestionLoading(false); setRegenIndex(null);
        }
        if (msg.status === "failed") { setAppQuestionError(msg.error ?? "Failed to generate response"); setAppQuestionLoading(false); setRegenIndex(null); }
        bc.removeEventListener("message", onMessage); bc.close();
      };
      bc.addEventListener("message", onMessage);
    } catch { setAppQuestionError("Failed to generate response"); setAppQuestionLoading(false); setRegenIndex(null); }
  }, [job, onJobUpdate]);

  const handleDraftCoverLetter = useCallback(async () => {
    if (!job) return;
    setCoverLetterLoading(true); setCoverLetterError(null); setCoverLetterStatus("Drafting…"); setCoverLetter(null);
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/cover-letter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ header: resumeHeader }) });
      if (!res.ok) { const d = await res.json() as { error?: string }; setCoverLetterError(d.error ?? "Failed to draft cover letter"); setCoverLetterLoading(false); return; }
      const { jobId: phaseJobId } = await res.json() as { jobId: string };
      const sw = navigator.serviceWorker.controller;
      if (!sw) { setCoverLetterError("Service worker not ready — try reloading."); setCoverLetterLoading(false); return; }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      const onMessage = (e: MessageEvent) => {
        const msg = e.data as { type: string; jobId: string; status: string; statusMessage?: string; result?: Record<string, unknown>; error?: string };
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") { setCoverLetterStatus(msg.statusMessage ?? "Drafting…"); return; }
        if (msg.status === "completed") { const cl = (msg.result as { coverLetter?: string })?.coverLetter ?? null; setCoverLetter(cl); setCoverLetterLoading(false); if (cl) onJobUpdate(job.id, { coverLetter: cl }); }
        if (msg.status === "failed") { setCoverLetterError(msg.error ?? "Failed to draft cover letter"); setCoverLetterLoading(false); }
        bc.removeEventListener("message", onMessage); bc.close();
      };
      bc.addEventListener("message", onMessage);
    } catch { setCoverLetterError("Failed to draft cover letter"); setCoverLetterLoading(false); }
  }, [job, resumeHeader, onJobUpdate]);

  const handleExportCoverLetter = useCallback(() => {
    if (!job || !coverLetter) return;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const paragraphs = coverLetter.split(/\n\n+/).map((para) => `<p>${para.split("\n").map((l) => esc(l)).join("<br>")}</p>`).join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(job.role)} at ${esc(job.company)} — Cover Letter</title><style>*{box-sizing:border-box}body{font-family:"Times New Roman",Times,serif;font-size:12pt;margin:1in;color:#000;line-height:1.5}p{margin:0 0 12px}@media print{@page{margin:1in;size:letter}body{margin:0}}</style></head><body>${paragraphs}</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus(); win.print();
  }, [job, coverLetter]);

  if (!job) return null;

  const close = () => {
    onNotesChange(job.id, notes);
    if (jdText !== null) onJdChange(job.id, jdText);
    onOpenChange(false);
  };

  return open ? (
    <div className={overlayStyles.overlay} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            {editingTitle ? (
              <>
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { onJobUpdate(job.id, { role: titleDraft.trim() }); setEditingTitle(false); }
                    if (e.key === "Escape") { setTitleDraft(job.role); setEditingTitle(false); }
                  }}
                  className={styles.titleInput}
                />
                <button type="button" className={styles.iconBtn} onClick={() => { onJobUpdate(job.id, { role: titleDraft.trim() }); setEditingTitle(false); }}><Check size={14} /></button>
                <button type="button" className={styles.iconBtn} onClick={() => { setTitleDraft(job.role); setEditingTitle(false); }}><X size={14} /></button>
              </>
            ) : (
              <>
                <h2 className={styles.titleText}>{job.role}</h2>
                <button type="button" className={`${styles.iconBtn} ${styles.editBtn}`} onClick={() => { setTitleDraft(job.role); setEditingTitle(true); }}><Pencil size={13} /></button>
              </>
            )}

            {/* Status badge + dropdown */}
            <div style={{ position: "relative" }} ref={statusMenuRef}>
              <button
                type="button"
                className={styles.statusBadge}
                style={STATUS_STYLES[job.status]}
                onClick={() => setStatusMenuOpen((o) => !o)}
              >
                {job.status}
                <ChevronDown size={11} style={{ opacity: 0.6 }} />
              </button>
              {statusMenuOpen && (
                <div className={styles.statusMenu}>
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s} type="button" className={styles.statusOption} onClick={() => { onStatusChange(job.id, s); setStatusMenuOpen(false); }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.companyRow}>
            <p className={styles.company}>{job.company}</p>
            {onSkipCompany && (
              <button type="button" title="Skip this company in future searches" onClick={() => { onSkipCompany(job.company); onOpenChange(false); }} className={`${styles.iconBtn} ${styles.iconBtnDanger}`}>
                <EyeOff size={13} />
              </button>
            )}
            {onDeleteJob && (
              <button type="button" title="Remove this listing" onClick={() => { onNotesChange(job.id, notes); onDeleteJob(job.id); onOpenChange(false); }} className={`${styles.iconBtn} ${styles.iconBtnDanger}`}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <button type="button" className={styles.closeBtn} onClick={close}><X size={16} /></button>

        {/* Body */}
        <div className={styles.body}>
          {/* Job Description */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionLabel}>Job Description</p>
              {!jdText && urlVerified && (
                <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleFetchJd} disabled={jdLoading}>
                  {jdLoading ? "Loading…" : "Load JD"}
                </button>
              )}
            </div>
            <textarea
              value={jdText ?? ""}
              onChange={(e) => setJdText(e.target.value)}
              onBlur={() => { if (jdText !== null) onJdChange(job.id, jdText); }}
              placeholder={job.url ? "Paste or load the job description…" : "No URL saved — add a link above to load the JD."}
              className={styles.textarea}
              rows={6}
            />
            {/* URL row */}
            <div className={styles.urlRow}>
              {editingUrl ? (
                <>
                  <input autoFocus type="url" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onUrlChange(job.id, urlDraft.trim()); setEditingUrl(false); }
                      if (e.key === "Escape") { setUrlDraft(job.url ?? ""); setEditingUrl(false); }
                    }}
                    placeholder="https://..."
                    className={styles.urlInput}
                  />
                  <button type="button" className={styles.iconBtn} onClick={() => { onUrlChange(job.id, urlDraft.trim()); setEditingUrl(false); }}><Check size={13} /></button>
                  <button type="button" className={styles.iconBtn} onClick={() => { setUrlDraft(job.url ?? ""); setEditingUrl(false); }}><X size={13} /></button>
                </>
              ) : (
                <>
                  {job.url ? (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className={`${styles.urlLink} ${urlVerified ? styles.urlVerified : styles.urlUnverified}`}>
                      {job.url} <ExternalLink size={11} style={{ flexShrink: 0 }} />
                    </a>
                  ) : (
                    <span className={styles.urlNone}>No URL set</span>
                  )}
                  <div className={styles.urlActions}>
                    {!urlVerified && (
                      <button type="button" className={`${styles.pillBtn} ${styles.pillBtnVerify}`} onClick={() => { setUrlVerified(true); onUrlVerifiedChange(job.id, true); }}>
                        URL Verified
                      </button>
                    )}
                    <button type="button" className={styles.pillBtn} onClick={() => { setUrlDraft(job.url ?? ""); setEditingUrl(true); }}>Update</button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          {/* People */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionLabel}>People to Reach Out To</p>
              <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleFindPeople} disabled={contactsLoading}>
                <Users size={13} />
                {contactsLoading ? "Searching…" : "Find People"}
              </button>
            </div>

            {contactsLoading && (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonRow}>
                    <div className={styles.skeletonAvatar} />
                    <div className={styles.skeletonLines}>
                      <div className={styles.skeletonLine} style={{ width: "60%" }} />
                      <div className={styles.skeletonLine} style={{ width: "80%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!contactsLoading && contactsError && <p className={styles.emptyText}>Couldn&apos;t find contacts — try searching on LinkedIn directly.</p>}

            {!contactsLoading && !contactsError && contacts.length > 0 && (
              <div className={styles.contactList}>
                {contacts.map((c, i) => (
                  <div key={i} className={styles.contactRow}>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactNameRow}>
                        <p className={styles.contactName}>{c.name}</p>
                        {c.score && <span className={styles.contactScore} title={`${c.score}/5 contact potential`}>{"★".repeat(c.score)}{"☆".repeat(5 - c.score)}</span>}
                      </div>
                      {c.title && <p className={styles.contactTitle}>{c.title}</p>}
                      {c.email && <a href={`mailto:${c.email}`} className={styles.contactEmail}>{c.email}</a>}
                      {c.source && <p className={styles.contactSource}>{c.source}</p>}
                    </div>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className={styles.iconBtn} style={{ marginTop: 2 }}>
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!contactsLoading && !contactsError && contacts.length === 0 && (
              <p className={styles.emptyText}>Click &quot;Find People&quot; to discover relevant contacts at {job.company}.</p>
            )}
          </div>

          <div className={styles.divider} />

          {/* Notes */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onNotesChange(job.id, notes)}
              placeholder="Add notes about this opportunity…"
              rows={4}
              className={styles.textarea}
              style={{ minHeight: "unset" }}
            />
          </div>

          {/* Overlaps */}
          {jdText && (
            <>
              <div className={styles.divider} />
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionLabel}>Ask {agentName} to Find Overlaps</p>
                  <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleFindOverlaps} disabled={overlapsLoading}>
                    <TrippyIcon sizeClass="h-3.5 w-3.5" />
                    {overlapsLoading ? "Analyzing…" : overlapsText ? "Re-analyze" : "Find Overlaps"}
                  </button>
                </div>
                {overlapsLoading && (
                  <div className={styles.skeletonList}>
                    {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeletonLine} style={{ width: i === 4 ? "60%" : "100%" }} />)}
                  </div>
                )}
                {!overlapsLoading && overlapsError && <p className={styles.errorText}>Couldn&apos;t analyze overlaps — try again.</p>}
                {!overlapsLoading && overlapsText && (
                  <div className={styles.markdown}>
                    <Markdown remarkPlugins={[remarkGfm]} components={{
                      p: ({ children }) => <p style={{ marginBottom: 8, lineHeight: 1.6 }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ margin: "6px 0", paddingLeft: 20 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "6px 0", paddingLeft: 20 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 2, lineHeight: 1.5 }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ color: "var(--color-text)", fontWeight: 600 }}>{children}</strong>,
                    }}>
                      {overlapsText}
                    </Markdown>
                  </div>
                )}
                {!overlapsLoading && !overlapsError && !overlapsText && (
                  <p className={styles.emptyText}>Click &quot;Find Overlaps&quot; to see how your background aligns with this role.</p>
                )}
              </div>
            </>
          )}

          {/* Resume Recommendations */}
          {jdText && overlapsText && (
            <>
              <div className={styles.divider} />
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionLabel}>Resume Recommendations from {agentName}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {refinements && refinements.some((r) => r.accepted && !r.dismissed) && (
                      <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => setShowHeaderEditor((v) => !v)}>
                        <FileText size={13} /> Export Resume
                      </button>
                    )}
                    <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleRunReview} disabled={reviewLoading}>
                      <TrippyIcon sizeClass="h-3.5 w-3.5" />
                      {reviewLoading ? "Reviewing…" : refinements ? "Re-review" : "Review Resume"}
                    </button>
                  </div>
                </div>

                {showHeaderEditor && (
                  <div className={styles.headerEditor}>
                    <p className={styles.sectionLabel} style={{ opacity: 0.5 }}>Resume Header</p>
                    <div className={styles.headerGrid}>
                      {(["name", "email", "phone", "linkedin", "location"] as const).map((field) => (
                        <input key={field} type="text" value={resumeHeader[field] ?? ""} onChange={(e) => setResumeHeader((h) => ({ ...h, [field]: e.target.value }))}
                          placeholder={{ name: "Full name", email: "Email", phone: "Phone", linkedin: "LinkedIn URL", location: "City, State" }[field]}
                          className={styles.headerInput}
                        />
                      ))}
                    </div>
                    <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={handleExportResume} style={{ alignSelf: "flex-start" }}>
                      <FileText size={13} /> Generate PDF
                    </button>
                  </div>
                )}

                {reviewLoading && (
                  <div className={styles.skeletonList}>
                    <p className={styles.statusMsg}>{reviewStatus || "Reviewing…"}</p>
                    {[1, 2, 3].map((i) => <div key={i} className={styles.skeletonBlock} />)}
                  </div>
                )}

                {!reviewLoading && reviewError && <p className={styles.errorText}>{reviewError}</p>}

                {!reviewLoading && refinements && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {refinements.map((r) => (
                      <div key={r.entryId} className={styles.refinementCard}>
                        <div className={styles.refinementHeader}>
                          <div className={styles.entryInfo}>
                            <p className={styles.entryTitle}>{r.entryTitle}</p>
                            <p className={styles.entryOrg}>{r.entryOrganization}</p>
                            {(r.entryStartDate || r.entryEndDate) && (
                              <p className={styles.entryDates}>{[r.entryStartDate, r.entryEndDate].filter(Boolean).join(" – ")}</p>
                            )}
                          </div>
                          <span className={styles.entryTypeBadge}>{r.entryType}</span>
                        </div>

                        {r.originalBullets.length > 0 && (
                          <div className={styles.bulletSection}>
                            <p className={styles.bulletLabel}>Before</p>
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                              {r.originalBullets.map((b, i) => <li key={i} className={styles.bulletOld}>{b}</li>)}
                            </ul>
                          </div>
                        )}

                        <div className={styles.bulletSection}>
                          <p className={`${styles.bulletLabel} ${styles.bulletLabelAccent}`}>{agentName}&apos;s Recommendations</p>
                          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                            {r.refinedBullets.map((b, i) => (
                              <li key={i} className={styles.bulletNew}>
                                <span className={styles.bulletDot}>·</span>{b}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {r.standoutNote && <p className={styles.standoutNote}>{r.standoutNote}</p>}

                        {!r.accepted && !r.dismissed && (
                          <div className={styles.refinementActions}>
                            <button type="button" className={`${btnStyles.btn} ${btnStyles.sm}`} style={{ background: "color-mix(in srgb, #34d399 15%, var(--color-bg))", color: "#34d399", borderRadius: 999 }} onClick={() => handleAcceptRefinement(r.entryId)}>
                              <Check size={11} /> Accept
                            </button>
                            <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={() => handleDismissRefinement(r.entryId)}>
                              <X size={11} /> Dismiss
                            </button>
                          </div>
                        )}
                        {r.accepted && <span className={styles.acceptedBadge}>Accepted</span>}
                        {r.dismissed && <span className={styles.dismissedBadge}>Dismissed</span>}
                      </div>
                    ))}
                  </div>
                )}

                {!reviewLoading && !reviewError && !refinements && (
                  <p className={styles.emptyText}>Review your resume against this role to get {agentName}&apos;s targeted bullet recommendations.</p>
                )}
              </div>
            </>
          )}

          {/* Cover Letter */}
          {jdText && refinements && (
            <>
              <div className={styles.divider} />
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionLabel}>Cover Letter</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {coverLetter && (
                      <>
                        <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => {
                          navigator.clipboard.writeText(coverLetter).then(() => { setCoverLetterCopied(true); setTimeout(() => setCoverLetterCopied(false), 2000); }).catch(() => {});
                        }}>
                          {coverLetterCopied ? <CheckCheck size={13} /> : <Copy size={13} />}
                          {coverLetterCopied ? "Copied" : "Copy"}
                        </button>
                        <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleExportCoverLetter}>
                          <FileText size={13} /> Export
                        </button>
                      </>
                    )}
                    <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleDraftCoverLetter} disabled={coverLetterLoading}>
                      <TrippyIcon sizeClass="h-3.5 w-3.5" />
                      {coverLetterLoading ? coverLetterStatus || "Drafting…" : coverLetter ? "Regenerate" : "Draft Cover Letter"}
                    </button>
                  </div>
                </div>

                {coverLetterLoading && (
                  <div className={styles.skeletonList}>
                    <p className={styles.statusMsg}>{coverLetterStatus || "Drafting…"}</p>
                    {[1, 2, 3].map((i) => <div key={i} className={styles.skeletonLine} style={{ width: "100%", height: 20 }} />)}
                  </div>
                )}
                {!coverLetterLoading && coverLetterError && <p className={styles.errorText}>{coverLetterError}</p>}
                {!coverLetterLoading && coverLetter && <div className={styles.coverLetterBox}>{coverLetter}</div>}
                {!coverLetterLoading && !coverLetterError && !coverLetter && (
                  <p className={styles.emptyText}>Draft a tailored cover letter using your resume experience and this role&apos;s requirements.</p>
                )}
              </div>
            </>
          )}

          {/* Application Questions */}
          {coverLetter && (
            <>
              <div className={styles.divider} />
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Application Questions</p>

                {appQuestions.map(([q, r], i) => (
                  <div key={i} className={styles.appQuestionCard}>
                    <p className={styles.appQuestion}>{q}</p>
                    <p className={styles.appAnswer}>{r}</p>
                    <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                      <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} disabled={appQuestionLoading} onClick={() => { setAppQuestionInput(q); handleGenerateAppQuestion(q, i); }}>
                        <TrippyIcon sizeClass="h-3 w-3" />
                        {appQuestionLoading && regenIndex === i ? appQuestionStatus || "Regenerating…" : "Regenerate"}
                      </button>
                      <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} disabled={appQuestionLoading} onClick={() => { const next = appQuestions.filter((_, j) => j !== i); setAppQuestions(next); onJobUpdate(job!.id, { app_questions: next } as Record<string, unknown>); }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                <textarea
                  className={styles.textarea}
                  style={{ minHeight: "unset" }}
                  rows={3}
                  placeholder="Paste an application question…"
                  value={appQuestionInput}
                  onChange={(e) => setAppQuestionInput(e.target.value)}
                  disabled={appQuestionLoading}
                />
                <div className={styles.inputRow}>
                  <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} disabled={appQuestionLoading || !appQuestionInput.trim()} onClick={() => handleGenerateAppQuestion(appQuestionInput)}>
                    <TrippyIcon sizeClass="h-3.5 w-3.5" />
                    {appQuestionLoading && regenIndex === null ? appQuestionStatus || "Generating…" : "Generate Response"}
                  </button>
                </div>
                {appQuestionError && <p className={styles.errorText}>{appQuestionError}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;
}
