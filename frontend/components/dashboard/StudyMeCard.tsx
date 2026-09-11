import styles from "./DashboardPage.module.css";
import { useEffect, useState } from "react";

export type InsightGatheringStatus = {
  state: "not_started" | "paused" | "queued" | "running" | "completed" | "failed";
  progress?: number;
  currentStage?: string | null;
  currentDate?: string | null;
  statusMessage?: string | null;
  datesIndexed?: number | null;
  insightsWritten?: number;
  stages?: {
    history?: { total?: number };
    aggregate?: { total?: number; processed?: number };
  };
  error?: string | null;
};

export function StudyMeCard({
  agentName,
  status,
  onStart,
}: {
  agentName: string;
  status: InsightGatheringStatus;
  onStart: () => boolean | Promise<boolean>;
}) {
  const [starting, setStarting] = useState(false);
  const running = status.state === "queued" || status.state === "running";
  const resumable = status.state === "paused" || status.state === "failed";
  const progress = Math.max(0, Math.min(100, status.progress ?? 0));
  const progressLabel = running && !status.currentDate ? "Working…" : `${progress}% complete`;
  const stage = status.currentStage ? status.currentStage.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "your history";
  const statusMessage = status.statusMessage && (/^Gathering |^Reading Google Drive history|^Reading spreadsheet/.test(status.statusMessage)
    ? "Building your chronological history."
    : status.statusMessage);

  useEffect(() => {
    if (running || status.state === "failed") setStarting(false);
  }, [running, status.state]);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    const accepted = await onStart();
    if (!accepted) setStarting(false);
  };

  return (
    <section className={`${styles.assistantPrompt} ${styles.cardFull}`} style={{ animationDelay: "0ms" }} aria-live="polite">
      <div className={styles.assistantPromptContent}>
        <p className={styles.assistantPromptKicker}><span aria-hidden="true">✦</span> {agentName} assistant</p>
        <h2 className={styles.assistantPromptTitle}>
          {running ? `${agentName} is learning more about you` : `${agentName} would like to learn more about you!`}
        </h2>
        <p className={styles.assistantPromptCopy}>
          {running
            ? (statusMessage || `Reviewing ${stage.toLowerCase()} to gather useful historical details.`)
            : resumable
              ? "Your saved historical review is ready to resume when you are ready."
            : `Let ${agentName} review your past history to gather important historical details about you without having to rehash old news.`}
        </p>
        {running && (
          <p className={styles.assistantPromptMeta}>
            {progressLabel}{status.datesIndexed ? ` · ${status.datesIndexed} date${status.datesIndexed === 1 ? "" : "s"} indexed` : ""}
          </p>
        )}
        {status.state === "failed" && <p className={styles.assistantPromptMeta}>The review paused. You can resume it whenever you are ready.</p>}
      </div>
      <div className={styles.assistantPromptActions}>
        {running ? (
          <div className={styles.pipelineStartRow}>
            <div aria-label={progressLabel} style={{ width: 180, height: 6, borderRadius: 99, background: "var(--color-border)", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: "var(--color-accent, currentColor)", transition: "width 300ms ease" }} />
            </div>
          </div>
        ) : (
          <div className={styles.pipelineStartRow}>
            <button type="button" className={styles.assistantPrimaryBtn} onClick={() => void handleStart()} disabled={starting}>
              {starting && <span className={styles.studyMeSpinner} aria-hidden="true" />}
              {starting ? "Starting…" : resumable ? "Resume review" : "Study Me"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
