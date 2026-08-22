"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback } from "react";
import { Send, Copy, CheckCheck } from "lucide-react";
import { TrippyIcon } from "@/components/TrippyIcon";
import type { Contact } from "@/types/career";
import { CollapsiblePanel } from "../../career/job-detail/CollapsiblePanel";
import styles from "../../career/job-detail/panel.module.css";
import btnStyles from "@/components/ui/Button.module.css";

type ContactOutreachProps = Readonly<{ contact: Contact }>;

export function ContactOutreach({ contact }: ContactOutreachProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDraft = useCallback(async () => {
    setLoading(true); setError(null); setStatus("Drafting…"); setMessage("");
    try {
      const res = await proxyFetch(`/agent/career/contacts/${contact.id}/outreach`, { method: "POST" });
      if (!res.ok) { setError("Failed to start draft"); setLoading(false); return; }
      const { jobId } = await res.json() as { jobId: string };
      const sw = navigator.serviceWorker.controller;
      if (!sw) { setError("Service worker not ready — try reloading."); setLoading(false); return; }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId, careerJobId: contact.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e: MessageEvent) {
        const msg = e.data as { type: string; jobId: string; status: string; statusMessage?: string; result?: Record<string, unknown>; error?: string };
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== jobId) return;
        if (msg.status === "running") { setStatus(msg.statusMessage ?? "Drafting…"); return; }
        if (msg.status === "completed") { setMessage((msg.result as { message?: string })?.message ?? ""); setLoading(false); }
        if (msg.status === "failed") { setError(msg.error ?? "Failed to draft message"); setLoading(false); }
        bc.removeEventListener("message", onMsg); bc.close();
      });
    } catch { setError("Failed to draft message"); setLoading(false); }
  }, [contact.id]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message]);

  const actions = (
    <button
      type="button"
      className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
      onClick={handleDraft}
      disabled={loading}
    >
      <TrippyIcon size={13} />
      {loading ? status || "Drafting…" : message ? "Redraft" : "Draft Message"}
    </button>
  );

  return (
    <CollapsiblePanel icon={<Send size={16} style={{ color: "var(--color-accent)" }} />} title="Outreach Message" actions={actions}>
      {error && <p className={styles.errorText}>{error}</p>}
      {!message && !loading && !error && (
        <p className={styles.emptyText}>Click &quot;Draft Message&quot; to generate a personalised outreach message for {contact.name}.</p>
      )}
      {loading && <p className={styles.statusMsg}>{status || "Drafting…"}</p>}
      {message && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className={styles.textarea}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={handleCopy}>
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </CollapsiblePanel>
  );
}
