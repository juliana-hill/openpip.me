export type Priority = "ASAP" | "HIGH" | "MEDIUM" | "LOW";

export type TaskSource = "google";

export type TaskStatus = {
  name: string;
  isResolvedStatus: boolean;
};

export type Task = {
  id: string;
  identifier?: string;
  source: TaskSource;
  title: string;
  status: TaskStatus;
  priority: Priority;
  /** Duration in minutes, null if unset */
  duration: number | null;
  dueDate: string | null;
  /** ISO datetime when a Google task has a scheduled start */
  scheduledStart: string | null;
  projectName: string | null;
  /** Google Tasks list ID (Google-sourced tasks only) — needed to complete the task */
  listId?: string;
  /** ISO date (YYYY-MM-DD) — day the task is scheduled to appear in (stored in IDB) */
  scheduledFor?: string;
  /** HH:MM — optional start of a locally scheduled focus window */
  scheduledStartTime?: string;
  /** HH:MM — optional end of a locally scheduled focus window */
  scheduledEndTime?: string;
  labels?: string[];
};

export type TaskSection = {
  label: string;
  items: UnifiedItem[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  calendarName: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  meetLink?: string;
};

export type UnifiedItem =
  | { kind: "task"; data: Task }
  | { kind: "event"; data: CalendarEvent };

export type ActiveTask = {
  task: Task;
  startedAt: number; // Date.now() when flagged
  flowRate: number; // 0–100
  baseElapsedMs: number; // previously accumulated ms from prior sessions
};
