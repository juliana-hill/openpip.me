"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback } from "react";
import { FileText, Copy, CheckCheck, Mail } from "lucide-react";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import modalStyles from "@/components/career/JobDetailModal.module.css";
import { TrippyIcon } from "@/components/TrippyIcon";
import type { Job } from "@/types/career";
import { CollapsiblePanel } from "./CollapsiblePanel";
import styles from "./panel.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import clStyles from "./JobCoverLetter.module.css";

const HEADER_KEY = "resume-header";

type JobCoverLetterProps = Readonly<{ job: Job; onPatch: (update: Partial<Job>) => void }>;

export function JobCoverLetter({ job, onPatch }: JobCoverLetterProps) {
  const [coverLetter, setCoverLetter] = useState<string | null>((job as Record<string, unknown>).coverLetter as string ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const resumeHeader = (() => { try { return JSON.parse(localStorage.getItem(HEADER_KEY) ?? "{}"); } catch { return {}; } })();

  const handleDraft = useCallback(async () => {
    setLoading(true); setError(null); setStatus("Drafting…"); setCoverLetter(null);
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/cover-letter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ header: resumeHeader }) });
      if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Failed to draft cover letter"); setLoading(false); return; }
      const { jobId: phaseJobId } = await res.json() as { jobId: string };
      const sw = navigator.serviceWorker.controller;
      if (!sw) { setError("Service worker not ready — try reloading."); setLoading(false); return; }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e: MessageEvent) {
        const msg = e.data as { type: string; jobId: string; status: string; statusMessage?: string; result?: Record<string, unknown>; error?: string };
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") { setStatus(msg.statusMessage ?? "Drafting…"); return; }
        if (msg.status === "completed") { const cl = (msg.result as { coverLetter?: string })?.coverLetter ?? null; setCoverLetter(cl); setLoading(false); if (cl) onPatch({ coverLetter: cl } as Partial<Job>); }
        if (msg.status === "failed") { setError(msg.error ?? "Failed to draft cover letter"); setLoading(false); }
        bc.removeEventListener("message", onMsg); bc.close();
      });
    } catch { setError("Failed to draft cover letter"); setLoading(false); }
  }, [job.id, resumeHeader, onPatch]);

  const handleExport = useCallback(() => {
    if (!coverLetter) return;
    const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const paragraphs = coverLetter.split(/\n\n+/).map((p) => `<p>${p.split("\n").map((l) => esc(l)).join("<br>")}</p>`).join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter</title><style>body{font-family:"Times New Roman",serif;font-size:12pt;margin:1in;color:#000;line-height:1.5}p{margin:0 0 12px}@media print{@page{margin:1in}body{margin:0}}</style></head><body>${paragraphs}</body></html>`;
    const win = window.open("","_blank");
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus(); win.print();
  }, [coverLetter]);

  const actions = (
    <div style={{ display: "flex", gap: 8 }}>
      {coverLetter && (
        <>
          <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => {
            navigator.clipboard.writeText(coverLetter).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
          }}>
            {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleExport}>
            <FileText size={13} /> Export
          </button>
          <ReadAloudButton text={coverLetter} className={modalStyles.iconBtn} iconSize={14} />
        </>
      )}
      <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleDraft} disabled={loading}>
        <TrippyIcon sizeClass="h-3.5 w-3.5" />
        {loading ? (status || "Drafting…") : coverLetter ? "Regenerate" : "Draft Cover Letter"}
      </button>
    </div>
  );

  return (
    <CollapsiblePanel
      icon={<Mail size={16} style={{ color: "var(--color-accent)" }} />}
      title="Cover Letter"
      actions={actions}
    >
      {loading && (
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} style={{ width: "100%", height: 16 }} />)}
        </div>
      )}
      {!loading && error && <p className={styles.errorText}>{error}</p>}
      {!loading && coverLetter && <div className={clStyles.box}>{coverLetter}</div>}
      {!loading && !error && !coverLetter && (
        <p className={styles.emptyText}>Draft a tailored cover letter using your resume experience and this role&apos;s requirements.</p>
      )}
    </CollapsiblePanel>
  );
}
