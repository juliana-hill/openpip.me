import { proxyFetch } from "@/lib/proxy";

/** Per-task local data, stored as individual Drive files (one per task, under
 * OpenPip/tasks/schedules/{taskId}.json) rather than one shared blob — tasks
 * are an unbounded, ever-growing collection, unlike Settings' small fixed
 * set of fields (see lib/userData.ts). See backend app.py's
 * /agent/tasks/active and /agent/tasks/schedules/{taskId} routes, and
 * google_drive_docs.py for the Drive-side implementation. */
export type PersistedActiveTask = {
  taskId: string;
  source: string;
  startedAt: number;
  flowRate: number;
  baseElapsedMs: number;
};

export type TaskScheduleEntry = {
  elapsedMs?: number;
  scheduledFor?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
};

export async function getPersistedActiveTask(): Promise<PersistedActiveTask | null> {
  const res = await proxyFetch("/agent/tasks/active");
  if (!res.ok) return null;
  const data = await res.json() as { active: PersistedActiveTask | null };
  return data.active ?? null;
}

export async function setPersistedActiveTask(value: PersistedActiveTask): Promise<void> {
  await proxyFetch("/agent/tasks/active", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  }).catch(() => {});
}

export async function clearPersistedActiveTask(): Promise<void> {
  await proxyFetch("/agent/tasks/active", { method: "DELETE" }).catch(() => {});
}

export async function getAllTaskSchedules(): Promise<Array<{ taskId: string } & TaskScheduleEntry>> {
  const res = await proxyFetch("/agent/tasks/schedules");
  if (!res.ok) return [];
  const data = await res.json() as { schedules?: Record<string, TaskScheduleEntry> };
  return Object.entries(data.schedules ?? {}).map(([taskId, entry]) => ({ taskId, ...entry }));
}

export async function getTaskSchedule(taskId: string): Promise<TaskScheduleEntry | null> {
  const res = await proxyFetch(`/agent/tasks/schedules/${encodeURIComponent(taskId)}`);
  if (!res.ok) return null;
  const data = await res.json() as { schedule: TaskScheduleEntry | null };
  return data.schedule ?? null;
}

/** Merges into the task's existing record server-side — safe to call with
 * just the field(s) that changed (e.g. only elapsedMs, or only
 * scheduledFor) without clobbering the rest. */
export async function patchTaskSchedule(taskId: string, patch: Partial<TaskScheduleEntry>): Promise<void> {
  await proxyFetch(`/agent/tasks/schedules/${encodeURIComponent(taskId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => {});
}

export async function saveTaskElapsed(taskId: string, elapsedMs: number): Promise<void> {
  return patchTaskSchedule(taskId, { elapsedMs });
}

export async function deleteTaskSchedule(taskId: string): Promise<void> {
  await proxyFetch(`/agent/tasks/schedules/${encodeURIComponent(taskId)}`, { method: "DELETE" }).catch(() => {});
}
