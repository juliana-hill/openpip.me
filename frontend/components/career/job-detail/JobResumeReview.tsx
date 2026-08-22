"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback } from "react";
import { Check, X, FileText, Wand2 } from "lucide-react";
import { TrippyIcon } from "@/components/TrippyIcon";
import type { Job, JobRefinement } from "@/types/career";
import { CollapsiblePanel } from "./CollapsiblePanel";
import styles from "./panel.module.css";
import cardStyles from "./JobResumeReview.module.css";
import btnStyles from "@/components/ui/Button.module.css";

const HEADER_KEY = "resume-header";
type ResumeHeader = { name: string; email: string; phone: string; linkedin: string; location: string };
const SECTION_LABELS: Record<string, string> = { work: "Experience", education: "Education", certification: "Certifications", award: "Awards & Recognition", club: "Leadership & Activities", project: "Projects" };
const SECTION_ORDER = ["work", "education", "certification", "award", "club", "project"];

type JobResumeReviewProps = Readonly<{ job: Job; onPatch: (update: Partial<Job>) => void }>;

export function JobResumeReview({ job, onPatch }: JobResumeReviewProps) {
  const [refinements, setRefinements] = useState<JobRefinement[] | null>(job.refinements ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [showHeaderEditor, setShowHeaderEditor] = useState(false);
  const [resumeHeader, setResumeHeader] = useState<ResumeHeader>(() => {
    try { return JSON.parse(localStorage.getItem(HEADER_KEY) ?? "{}"); } catch { return {}; }
  });

  const handleRunReview = useCallback(async () => {
    setLoading(true); setError(null); setStatus("Reviewing…"); setRefinements(null);
    onPatch({ refinements: undefined, research: undefined });
    await proxyFetch(`/agent/career/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refinements: null, research: null }) }).catch(() => {});
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/review`, { method: "POST" });
      if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Review failed"); setLoading(false); return; }
      const { jobId: phaseJobId } = await res.json() as { jobId: string };
      const sw = navigator.serviceWorker.controller;
      if (!sw) { setError("Service worker not ready — try reloading."); setLoading(false); return; }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e: MessageEvent) {
        const msg = e.data as { type: string; jobId: string; status: string; statusMessage?: string; result?: Record<string, unknown>; error?: string };
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") { setStatus(msg.statusMessage ?? "Reviewing…"); return; }
        if (msg.status === "completed") { const rf = (msg.result as { refinements?: JobRefinement[] })?.refinements ?? null; setRefinements(rf); setLoading(false); if (rf) onPatch({ refinements: rf }); }
        if (msg.status === "failed") { setError(msg.error ?? "Review failed"); setLoading(false); }
        bc.removeEventListener("message", onMsg); bc.close();
      });
    } catch { setError("Review failed"); setLoading(false); }
  }, [job.id, onPatch]);

  const handleAccept = useCallback((entryId: string) => {
    const updated = refinements?.map((r) => r.entryId === entryId ? { ...r, accepted: true } : r) ?? null;
    setRefinements(updated);
    onPatch({ refinements: updated ?? undefined });
  }, [refinements, onPatch]);

  const handleDismiss = useCallback((entryId: string) => {
    const updated = refinements?.map((r) => r.entryId === entryId ? { ...r, dismissed: true } : r) ?? null;
    setRefinements(updated);
    onPatch({ refinements: updated ?? undefined });
  }, [refinements, onPatch]);

  const handleExportResume = useCallback(() => {
    if (!refinements) return;
    const all = refinements.filter((r) => r.accepted && !r.dismissed);
    if (!all.length) return;
    try { localStorage.setItem(HEADER_KEY, JSON.stringify(resumeHeader)); } catch { /* ignore */ }
    const parseDate = (d?: string): number => {
      if (!d) return 0;
      const months: Record<string, number> = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
      const parts = d.trim().split(/\s+/);
      if (parts.length === 2) { const mon = months[parts[0].toLowerCase().slice(0,3)] ?? 0; const yr = parseInt(parts[1],10)||0; return yr*100+mon; }
      return (parseInt(parts[0],10)||0)*100;
    };
    const groups = new Map<string, typeof all>();
    for (const r of all) { const type = r.entryType ?? "other"; if (!groups.has(type)) groups.set(type, []); groups.get(type)!.push(r); }
    for (const entries of groups.values()) entries.sort((a,b) => parseDate(b.entryStartDate)-parseDate(a.entryStartDate));
    const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const headerLines: string[] = [];
    if (resumeHeader.name) headerLines.push(`<div class="resume-name">${esc(resumeHeader.name)}</div>`);
    const contactParts: string[] = [];
    if (resumeHeader.phone) contactParts.push(esc(resumeHeader.phone));
    if (resumeHeader.email) contactParts.push(`<a href="mailto:${esc(resumeHeader.email)}">${esc(resumeHeader.email)}</a>`);
    if (resumeHeader.linkedin) contactParts.push(`<a href="${esc(resumeHeader.linkedin)}">${esc(resumeHeader.linkedin.replace(/^https?:\/\//,""))}</a>`);
    if (contactParts.length) headerLines.push(`<div class="resume-contact">${contactParts.join(" | ")}</div>`);
    let body = "";
    for (const type of SECTION_ORDER) {
      const entries = groups.get(type);
      if (!entries?.length) continue;
      body += `<h2>${SECTION_LABELS[type] ?? "Other"}</h2>`;
      for (const r of entries) {
        const dates = [r.entryStartDate, r.entryEndDate].filter(Boolean).join(" – ");
        body += `<div class="entry"><div class="entry-top"><span class="entry-org">${esc(r.entryOrganization)}</span>${r.entryLocation?`<span class="entry-location">${esc(r.entryLocation)}</span>`:""}</div><div class="entry-role-line"><span class="entry-role">${esc(r.entryTitle)}</span>${dates?`<span class="entry-dates">${esc(dates)}</span>`:""}</div><ul>${r.refinedBullets.map((b)=>`<li>${esc(b)}</li>`).join("")}</ul></div>`;
      }
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(job.role)} at ${esc(job.company)} — Resume</title><style>*{box-sizing:border-box}body{font-family:"Times New Roman",Times,serif;font-size:11pt;margin:0.85in 1in;color:#000}.resume-name{text-align:center;font-size:18pt;font-weight:bold;margin-bottom:2px}.resume-contact{text-align:center;font-size:10pt;margin-bottom:14px}.resume-contact a{color:#000;text-decoration:none}h2{font-size:11pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;border-bottom:1.5px solid #000;padding-bottom:1px;margin-top:14px;margin-bottom:6px}.entry{margin-bottom:10px}.entry-top{display:flex;justify-content:space-between;align-items:baseline}.entry-org{font-weight:bold;font-size:11pt}.entry-location{font-size:10pt}.entry-role-line{display:flex;justify-content:space-between;align-items:baseline}.entry-role{font-style:italic;font-size:11pt}.entry-dates{font-size:10pt}ul{margin:3px 0 0;padding-left:20px}li{margin-bottom:2px;line-height:1.35}@media print{@page{margin:.5in;size:letter}body{margin:0}}</style></head><body>${headerLines.join("\n")}${body}</body></html>`;
    const win = window.open("","_blank");
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus(); win.print();
    const reset = refinements.map((r) => ({ ...r, accepted: false, dismissed: false }));
    setRefinements(reset);
    onPatch({ refinements: reset });
    setShowHeaderEditor(false);
  }, [job, refinements, resumeHeader, onPatch]);

  const actions = (
    <div style={{ display: "flex", gap: 8 }}>
      {refinements?.some((r) => r.accepted && !r.dismissed) && (
        <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => setShowHeaderEditor((v) => !v)}>
          <FileText size={13} /> Export
        </button>
      )}
      <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleRunReview} disabled={loading}>
        <TrippyIcon sizeClass="h-3.5 w-3.5" />
        {loading ? "Reviewing…" : refinements ? "Re-review" : "Review Resume"}
      </button>
    </div>
  );

  return (
    <CollapsiblePanel
      icon={<Wand2 size={16} style={{ color: "var(--color-accent)" }} />}
      title="Resume Recommendations"
      actions={actions}
    >
        {showHeaderEditor && (
          <div className={cardStyles.headerEditor}>
            <p className={styles.sectionLabel}>Resume Header</p>
            <div className={cardStyles.headerGrid}>
              {(["name", "email", "phone", "linkedin", "location"] as const).map((field) => (
                <input key={field} type="text" value={resumeHeader[field] ?? ""} onChange={(e) => setResumeHeader((h) => ({ ...h, [field]: e.target.value }))}
                  placeholder={{ name: "Full name", email: "Email", phone: "Phone", linkedin: "LinkedIn URL", location: "City, State" }[field]}
                  className={cardStyles.headerInput}
                />
              ))}
            </div>
            <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={handleExportResume}>
              <FileText size={13} /> Generate PDF
            </button>
          </div>
        )}

        {loading && (
          <div className={styles.skeletonList}>
            {status && <p className={styles.statusMsg}>{status}</p>}
            {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} style={{ height: 60 }} />)}
          </div>
        )}

        {!loading && error && <p className={styles.errorText}>{error}</p>}

        {!loading && refinements && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {refinements.map((r) => (
              <div key={r.entryId} className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div>
                    <p className={cardStyles.entryTitle}>{r.entryTitle}</p>
                    <p className={cardStyles.entryOrg}>{r.entryOrganization}</p>
                    {(r.entryStartDate || r.entryEndDate) && (
                      <p className={cardStyles.entryDates}>{[r.entryStartDate, r.entryEndDate].filter(Boolean).join(" – ")}</p>
                    )}
                  </div>
                  <span className={cardStyles.typeBadge}>{r.entryType}</span>
                </div>

                {r.originalBullets.length > 0 && (
                  <div className={cardStyles.bulletSection}>
                    <p className={cardStyles.bulletLabel}>Before</p>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {r.originalBullets.map((b, i) => <li key={i} className={cardStyles.bulletOld}>{b}</li>)}
                    </ul>
                  </div>
                )}

                <div className={cardStyles.bulletSection}>
                  <p className={`${cardStyles.bulletLabel} ${cardStyles.bulletLabelAccent}`}>Trippy&apos;s Suggestions</p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {r.refinedBullets.map((b, i) => (
                      <li key={i} className={cardStyles.bulletNew}><span className={cardStyles.bulletDot}>·</span>{b}</li>
                    ))}
                  </ul>
                </div>

                {r.standoutNote && <p className={cardStyles.standoutNote}>{r.standoutNote}</p>}

                {!r.accepted && !r.dismissed && (
                  <div className={cardStyles.actions}>
                    <button type="button" className={`${btnStyles.btn} ${btnStyles.sm}`} style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", borderRadius: 999 }} onClick={() => handleAccept(r.entryId)}>
                      <Check size={11} /> Accept
                    </button>
                    <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={() => handleDismiss(r.entryId)}>
                      <X size={11} /> Dismiss
                    </button>
                  </div>
                )}
                {r.accepted && <span className={cardStyles.acceptedBadge}>Accepted</span>}
                {r.dismissed && <span className={cardStyles.dismissedBadge}>Dismissed</span>}
              </div>
            ))}
          </div>
        )}

      {!loading && !error && !refinements && (
        <p className={styles.emptyText}>Review your resume against this role to get Trippy&apos;s targeted bullet recommendations.</p>
      )}
    </CollapsiblePanel>
  );
}
