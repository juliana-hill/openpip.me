"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Lightbulb } from "lucide-react";
import { TrippyIcon } from "@/components/TrippyIcon";
import type { Contact } from "@/types/career";
import { CollapsiblePanel } from "../../career/job-detail/CollapsiblePanel";
import styles from "../../career/job-detail/panel.module.css";
import btnStyles from "@/components/ui/Button.module.css";

type ContactPrepProps = Readonly<{ contact: Contact }>;

export function ContactPrep({ contact }: ContactPrepProps) {
  const [prep, setPrep] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true); setError(null); setStatus("Generating…"); setPrep("");
    try {
      const res = await proxyFetch(`/agent/career/contacts/${contact.id}/prep`, { method: "POST" });
      if (!res.ok) { setError("Failed to start prep"); setLoading(false); return; }
      const { jobId } = await res.json() as { jobId: string };
      const sw = navigator.serviceWorker.controller;
      if (!sw) { setError("Service worker not ready — try reloading."); setLoading(false); return; }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId, careerJobId: contact.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e: MessageEvent) {
        const msg = e.data as { type: string; jobId: string; status: string; statusMessage?: string; result?: Record<string, unknown>; error?: string };
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== jobId) return;
        if (msg.status === "running") { setStatus(msg.statusMessage ?? "Generating…"); return; }
        if (msg.status === "completed") { setPrep((msg.result as { prep?: string })?.prep ?? ""); setLoading(false); }
        if (msg.status === "failed") { setError(msg.error ?? "Failed to generate prep"); setLoading(false); }
        bc.removeEventListener("message", onMsg); bc.close();
      });
    } catch { setError("Failed to generate prep"); setLoading(false); }
  }, [contact.id]);

  const actions = (
    <button
      type="button"
      className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
      onClick={handleGenerate}
      disabled={loading}
    >
      <TrippyIcon size={13} />
      {loading ? status || "Generating…" : prep ? "Regenerate" : "Generate Prep"}
    </button>
  );

  return (
    <CollapsiblePanel icon={<Lightbulb size={16} style={{ color: "var(--color-accent)" }} />} title="Conversation Prep" actions={actions}>
      {error && <p className={styles.errorText}>{error}</p>}
      {!prep && !loading && !error && (
        <p className={styles.emptyText}>Click &quot;Generate Prep&quot; to get talking points, questions to ask, and what to share with {contact.name}.</p>
      )}
      {loading && <p className={styles.statusMsg}>{status || "Generating…"}</p>}
      {prep && (
        <div style={{ fontSize: "var(--font-size-sm)", lineHeight: 1.6, color: "var(--color-text)" }}>
          <Markdown remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => <h2 style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, margin: "16px 0 6px", color: "var(--color-text)" }}>{children}</h2>,
              ul: ({ children }) => <ul style={{ margin: "4px 0 12px", paddingLeft: 18 }}>{children}</ul>,
              li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
              p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
            }}
          >{prep}</Markdown>
        </div>
      )}
    </CollapsiblePanel>
  );
}
