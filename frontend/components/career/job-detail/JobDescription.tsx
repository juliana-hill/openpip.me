"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback } from "react";
import { FileText, Check, X, ExternalLink } from "lucide-react";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import modalStyles from "@/components/career/JobDetailModal.module.css";
import type { Job } from "@/types/career";
import { CollapsiblePanel } from "./CollapsiblePanel";
import styles from "./panel.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import headerStyles from "./JobHeader.module.css";

type JobDescriptionProps = Readonly<{
  job: Job;
  onPatch: (update: Partial<Job>) => void;
}>;

export function JobDescription({ job, onPatch }: JobDescriptionProps) {
  const [jdText, setJdText] = useState(job.jd ?? "");
  const [loading, setLoading] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(job.url ?? "");

  const handleFetchJd = useCallback(async () => {
    if (!job.url) return;
    setLoading(true);
    try {
      const res = await proxyFetch("/agent/career/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: job.url, jobId: job.id }),
      });
      const text = res.ok ? ((await res.json()) as { text?: string }).text ?? "Could not extract job description." : "Failed to load — try opening the link directly.";
      setJdText(text);
      onPatch({ jd: text });
    } catch {
      setJdText("Failed to load — try opening the link directly.");
    } finally {
      setLoading(false);
    }
  }, [job.url, job.id, onPatch]);

  const actions = (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {!jdText && job.urlVerified && (
        <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={handleFetchJd} disabled={loading}>
          {loading ? "Loading…" : "Load JD"}
        </button>
      )}
      {jdText && (
        <ReadAloudButton text={jdText} className={modalStyles.iconBtn} iconSize={14} />
      )}
    </div>
  );

  return (
    <CollapsiblePanel
      icon={<FileText size={16} style={{ color: "var(--color-accent)" }} />}
      title="Job Description"
      actions={actions}
    >
      {/* URL row */}
      <div className={headerStyles.urlRow}>
        {editingUrl ? (
          <>
            <input
              autoFocus
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { onPatch({ url: urlDraft.trim() }); setEditingUrl(false); }
                if (e.key === "Escape") { setUrlDraft(job.url ?? ""); setEditingUrl(false); }
              }}
              placeholder="https://..."
              className={headerStyles.urlInput}
            />
            <button type="button" className={headerStyles.iconBtn} onClick={() => { onPatch({ url: urlDraft.trim() }); setEditingUrl(false); }}><Check size={13} /></button>
            <button type="button" className={headerStyles.iconBtn} onClick={() => { setUrlDraft(job.url ?? ""); setEditingUrl(false); }}><X size={13} /></button>
          </>
        ) : (
          <>
            {job.url ? (
              <a href={job.url} target="_blank" rel="noopener noreferrer" className={`${headerStyles.urlText} ${job.urlVerified ? headerStyles.urlVerified : headerStyles.urlUnverified}`}>
                <ExternalLink size={11} style={{ flexShrink: 0 }} />
                {job.url}
              </a>
            ) : (
              <span className={headerStyles.urlNone}>No URL set</span>
            )}
            <div className={headerStyles.urlActions}>
              {!job.urlVerified && job.url && (
                <button type="button" className={headerStyles.pillBtn} onClick={() => onPatch({ urlVerified: true })}>
                  Mark verified
                </button>
              )}
              <button type="button" className={headerStyles.pillBtn} onClick={() => { setUrlDraft(job.url ?? ""); setEditingUrl(true); }}>
                {job.url ? "Update URL" : "Add URL"}
              </button>
            </div>
          </>
        )}
      </div>
      <textarea
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        onBlur={() => { if (jdText !== (job.jd ?? "")) onPatch({ jd: jdText }); }}
        placeholder={job.url ? "Paste or load the job description…" : "No URL saved — add a link in the header to load the JD."}
        className={styles.textarea}
        rows={10}
      />
    </CollapsiblePanel>
  );
}
