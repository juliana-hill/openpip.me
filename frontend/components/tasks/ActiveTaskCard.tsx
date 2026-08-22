"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { X, Pause, Play } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { ActiveTask } from "@/types/tasks";
import styles from "./ActiveTaskCard.module.css";

type ActiveTaskCardProps = Readonly<{
  activeTask: ActiveTask;
  onUnflag: (elapsedMs: number) => void;
  onPause?: (baseElapsedMs: number) => void;
  onResume?: (newStartedAt: number, baseElapsedMs: number) => void;
}>;

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const ActiveTaskCard = forwardRef<HTMLDivElement, ActiveTaskCardProps>(function ActiveTaskCard({ activeTask, onUnflag, onPause, onResume }, ref) {
  const [isPaused, setIsPaused] = useState(false);
  const baseElapsedRef = useRef(activeTask.baseElapsedMs);
  const resumedAtRef = useRef(activeTask.startedAt);
  const [elapsed, setElapsed] = useState(activeTask.baseElapsedMs + (Date.now() - activeTask.startedAt));

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setElapsed(baseElapsedRef.current + (Date.now() - resumedAtRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  const handlePauseResume = () => {
    if (isPaused) {
      const now = Date.now();
      resumedAtRef.current = now;
      setIsPaused(false);
      onResume?.(now, baseElapsedRef.current);
    } else {
      baseElapsedRef.current += Date.now() - resumedAtRef.current;
      setElapsed(baseElapsedRef.current);
      setIsPaused(true);
      onPause?.(baseElapsedRef.current);
    }
  };

  const { task, flowRate } = activeTask;

  return (
    <div ref={ref} className={styles.card} style={{ gridColumn: "span 12" }}>
      <div className={styles.accentLine} />

      <div className={styles.body}>
        <button
          type="button"
          aria-label={isPaused ? "Resume timer" : "Pause timer"}
          onClick={handlePauseResume}
          className={styles.pauseBtn}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>

        <div className={styles.info}>
          <div className={styles.infoRow}>
            <div className={styles.infoLeft}>
              <p className={styles.label}>Currently Working On</p>
              <p className={styles.title}>{task.title}</p>
              <div className={styles.badges}>
                <SourceBadge source={task.source} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>

            <div className={styles.timerRow}>
              <p className={`${styles.timer} ${isPaused ? styles.timerPaused : ""}`}>
                {formatElapsed(elapsed)}
              </p>
              <button
                type="button"
                aria-label="Unflag task"
                onClick={() => {
                  const finalElapsed = baseElapsedRef.current + (isPaused ? 0 : Date.now() - resumedAtRef.current);
                  onUnflag(finalElapsed);
                }}
                className={styles.unflagBtn}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.flowSection}>
        <div className={styles.flowHeader}>
          <p className={styles.flowLabel}>Flow Rate</p>
          <p className={styles.flowValue}>
            <span className={styles.flowNumber}>{flowRate}</span>
            <span className={styles.flowDenom}> /100</span>
          </p>
        </div>
        <div className={styles.flowTrack}>
          <div className={styles.flowBar} style={{ width: `${flowRate}%` }} />
        </div>
      </div>
    </div>
  );
});
