"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback } from "react";
import { TrippyIcon } from "@/components/TrippyIcon";
import { HelpCircle } from "lucide-react";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import modalStyles from "@/components/career/JobDetailModal.module.css";
import type { Job } from "@/types/career";
import { CollapsiblePanel } from "./CollapsiblePanel";
import styles from "./panel.module.css";
import aqStyles from "./JobAppQuestions.module.css";
import btnStyles from "@/components/ui/Button.module.css";

type JobAppQuestionsProps = Readonly<{ job: Job; onPatch: (update: Partial<Job>) => void }>;

export function JobAppQuestions({ job, onPatch }: JobAppQuestionsProps) {
  const [questions, setQuestions] = useState<[string, string][]>((job as Record<string, unknown>).app_questions as [string, string][] ?? []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [regenIndex, setRegenIndex] = useState<number | null>(null);

  const handleGenerate = useCallback(async (question: string, index?: number) => {
    if (!question.trim()) return;
    setLoading(true); setError(null); setStatus("Writing your response…");
    if (typeof index === "number") setRegenIndex(index);
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/app-question`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, index }) });
      if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Failed to generate response"); setLoading(false); setRegenIndex(null); return; }
      const { jobId: phaseJobId } = await res.json() as { jobId: string };
      const sw = navigator.serviceWorker.controller;
      if (!sw) { setError("Service worker not ready — try reloading."); setLoading(false); setRegenIndex(null); return; }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e: MessageEvent) {
        const msg = e.data as { type: string; jobId: string; status: string; statusMessage?: string; result?: Record<string, unknown>; error?: string };
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") { setStatus(msg.statusMessage ?? "Writing…"); return; }
        if (msg.status === "completed") {
          const q = msg.result?.question as string; const r = msg.result?.response as string;
          setQuestions((prev) => { const next = [...prev]; if (typeof index === "number" && index >= 0 && index < next.length) next[index] = [q,r]; else next.push([q,r]); queueMicrotask(() => onPatch({ app_questions: next } as Partial<Job>)); return next; });
          setInput(""); setLoading(false); setRegenIndex(null);
        }
        if (msg.status === "failed") { setError(msg.error ?? "Failed to generate response"); setLoading(false); setRegenIndex(null); }
        bc.removeEventListener("message", onMsg); bc.close();
      });
    } catch { setError("Failed to generate response"); setLoading(false); setRegenIndex(null); }
  }, [job.id, onPatch]);

  return (
    <CollapsiblePanel
      icon={<HelpCircle size={16} style={{ color: "var(--color-accent)" }} />}
      title="Application Questions"
    >
      {questions.map(([q, r], i) => (
          <div key={i} className={aqStyles.card}>
            <p className={aqStyles.question}>{q}</p>
            <p className={aqStyles.answer}>{r}</p>
            <div style={{ display: "flex", gap: 8, paddingTop: 4, alignItems: "center" }}>
              <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} disabled={loading} onClick={() => handleGenerate(q, i)}>
                <TrippyIcon sizeClass="h-3 w-3" />
                {loading && regenIndex === i ? (status || "Regenerating…") : "Regenerate"}
              </button>
              <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} disabled={loading} onClick={() => { const next = questions.filter((_, j) => j !== i); setQuestions(next); onPatch({ app_questions: next } as Partial<Job>); }}>
                Delete
              </button>
              <ReadAloudButton text={r} className={modalStyles.iconBtn} iconSize={14} />
            </div>
          </div>
        ))}

        <textarea
          className={styles.textarea}
          style={{ minHeight: "unset" }}
          rows={3}
          placeholder="Paste an application question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} disabled={loading || !input.trim()} onClick={() => handleGenerate(input)}>
            <TrippyIcon sizeClass="h-3.5 w-3.5" />
            {loading && regenIndex === null ? (status || "Generating…") : "Generate Response"}
          </button>
        </div>
      {error && <p className={styles.errorText} style={{ marginTop: 8 }}>{error}</p>}
    </CollapsiblePanel>
  );
}
