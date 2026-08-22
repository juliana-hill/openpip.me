"use client";

import type { Priority, TaskSource } from "@/types/tasks";
import styles from "./TaskCard.module.css";

type RawTask = {
  id?: string;
  identifier?: string;
  title?: string;
  name?: string;
  source?: string;
  priority?: number | string;
  state?: string;
  status?: string | { name: string };
  scheduledFor?: string | null;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  scheduledStart?: string | null;
  duration?: number | null;
  project?: string | null;
};

function parsePriority(raw: number | string | undefined): Priority {
  if (typeof raw === "number") return (["LOW", "ASAP", "HIGH", "MEDIUM", "LOW"] as Priority[])[raw] ?? "MEDIUM";
  if (typeof raw === "string") {
    const u = raw.toUpperCase();
    if (u === "ASAP" || u === "HIGH" || u === "MEDIUM" || u === "LOW") return u as Priority;
  }
  return "MEDIUM";
}

function parseStatus(raw: string | { name: string } | undefined): string {
  if (!raw) return "Todo";
  return typeof raw === "string" ? raw : raw.name ?? "Todo";
}

function getDurationLabel(task: RawTask): string | null {
  let mins: number | null = null;
  if (task.scheduledStartTime && task.scheduledEndTime) {
    const [sh, sm] = task.scheduledStartTime.split(":").map(Number);
    const [eh, em] = task.scheduledEndTime.split(":").map(Number);
    const calc = (eh * 60 + em) - (sh * 60 + sm);
    if (calc > 0) mins = calc;
  }
  if (mins === null && task.duration) mins = task.duration;
  if (mins === null) return null;
  return mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}` : `${mins}m`;
}

function getScheduledLabel(task: RawTask): string | null {
  const date = task.scheduledFor ?? task.scheduledStart;
  if (!date) return null;
  const d = new Date(date.includes("T") ? date : date + "T12:00:00");
  const label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (task.scheduledStartTime && task.scheduledEndTime) {
    return `${label} · ${task.scheduledStartTime}–${task.scheduledEndTime}`;
  }
  return label;
}

function resolveSource(task: RawTask): TaskSource {
  const s = task.source;
  return "google";
}

function TaskRow({ task }: { task: RawTask }) {
  const title = task.title ?? task.name ?? "Untitled";
  const priority = parsePriority(task.priority);
  const status = parseStatus(task.state ?? task.status);
  const duration = getDurationLabel(task);
  const scheduled = getScheduledLabel(task);
  const source = resolveSource(task);

  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <div className={styles.topLine}>
          <span className={`${styles.sourceBadge} ${styles[`source_${source}`]}`}>
            Google Tasks
          </span>
          {task.identifier && <span className={styles.identifier}>{task.identifier}</span>}
          <span className={styles.title}>{title}</span>
        </div>
        <div className={styles.bottomLine}>
          {task.project && <span className={styles.project}>{task.project}</span>}
          {duration && <span className={styles.chip}>{duration}</span>}
          {scheduled && <span className={styles.scheduled}>{scheduled}</span>}
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.status}>{status}</span>
        <span className={`${styles.priorityBadge} ${styles[`priority_${priority}`]}`}>{priority}</span>
      </div>
    </div>
  );
}

type Props = { result: string; toolName: string };

export function TaskCard({ result, toolName: _toolName }: Props) {
  if (!result) return <p className={styles.empty}>No tasks found.</p>;

  let tasks: RawTask[] | null = null;
  try {
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) tasks = parsed;
    else if (parsed && Array.isArray(parsed.tasks)) tasks = parsed.tasks;
  } catch {
    return <p className={styles.empty}>{result}</p>;
  }

  if (!tasks || tasks.length === 0) return <p className={styles.empty}>No tasks found.</p>;

  return (
    <div className={styles.list}>
      {tasks.map((task, i) => (
        <TaskRow key={task.id ?? i} task={task} />
      ))}
    </div>
  );
}
