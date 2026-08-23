"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useCallback, useRef } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { AppHeader } from "@/components/app-header";
import { DailyBriefingCard } from "./DailyBriefingCard";
import { TodayAtAGlanceCard } from "./TodayAtAGlanceCard";
import { ActiveTaskCard } from "./ActiveTaskCard";
import { TaskList } from "./TaskList";
import { FloatingAssistant } from "./FloatingAssistant";
import { idbGetUserPrefs, idbSetUserPrefs, idbAddNotification } from "@/lib/idb";
import {
  getAllTaskSchedules,
  getTaskSchedule,
  deleteTaskSchedule,
  getPersistedActiveTask,
  setPersistedActiveTask,
  clearPersistedActiveTask,
  saveTaskElapsed,
} from "@/lib/taskStorage";
import { postToSW } from "@/lib/sw";
import type { Task, CalendarEvent, UnifiedItem, ActiveTask, Priority, TaskSection } from "@/types/tasks";
import dashStyles from "./TasksDashboard.module.css";

type TasksDashboardProps = Readonly<{
  userName: string;
  userImage: string;

}>;

const PRIORITY_ORDER: Record<Priority, number> = { ASAP: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function computeFlowRate(task: Task): number {
  const base: Record<Priority, number> = { ASAP: 85, HIGH: 70, MEDIUM: 55, LOW: 40 };
  const jitter = Math.floor(Math.random() * 20) - 10;
  return Math.max(0, Math.min(100, base[task.priority] + jitter));
}

function toTaskStartMs(task: Task): number {
  if (task.scheduledFor) {
    const dateTime = task.scheduledStartTime
      ? `${task.scheduledFor}T${task.scheduledStartTime}:00`
      : `${task.scheduledFor}T00:00:00`;
    return new Date(dateTime).getTime();
  }
  const raw = task.scheduledStart ?? task.dueDate;
  return raw ? new Date(raw).getTime() : Infinity;
}

function getDayBucket(task: Task, today: string, tomorrow: string): "today" | "tomorrow" | "later" | "unscheduled" {
  if (task.scheduledFor) {
    if (task.scheduledFor <= today) return "today";
    if (task.scheduledFor === tomorrow) return "tomorrow";
    return "later";
  }
  if (task.scheduledStart) {
    const date = task.scheduledStart.slice(0, 10);
    if (date <= today) return "today";
    if (date === tomorrow) return "tomorrow";
    return "later";
  }
  return "unscheduled";
}

function groupItems(tasks: Task[], events: CalendarEvent[]): TaskSection[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = localDate(now);
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  const tomorrow = localDate(d);

  const remoteTasks = tasks;

  const byBucket = (bucket: "today" | "tomorrow" | "later" | "unscheduled") =>
    remoteTasks.filter((t) => getDayBucket(t, today, tomorrow) === bucket);

  const sortByPriority = (a: Task, b: Task): number => {
    const pa = PRIORITY_ORDER[a.priority];
    const pb = PRIORITY_ORDER[b.priority];
    if (pa !== pb) return pa - pb;
    return toTaskStartMs(a) - toTaskStartMs(b);
  };

  const toItem = (t: Task): UnifiedItem => ({ kind: "task", data: t });

  // For all-day events, start is "YYYY-MM-DD" — slice directly to avoid UTC shift
  const eventDate = (start: string) => start.length === 10 ? start : localDate(new Date(start));

  // ms for any UnifiedItem — used for time-based interleaving in today/tomorrow
  const toUnifiedStartMs = (item: UnifiedItem): number => {
    if (item.kind === "event") return new Date(item.data.start).getTime();
    const t = item.data;
    if (t.scheduledStartTime && t.scheduledFor)
      return new Date(`${t.scheduledFor}T${t.scheduledStartTime}:00`).getTime();
    if (t.scheduledStart) return new Date(t.scheduledStart).getTime();
    return Infinity;
  };

  const sortByTime = (a: UnifiedItem, b: UnifiedItem) => toUnifiedStartMs(a) - toUnifiedStartMs(b);

  // today/tomorrow: timed items (events + tasks with a start time) sorted by time,
  // then untimed tasks sorted by priority
  const buildTimeBucket = (bucketName: "today" | "tomorrow", bucketDate: string): UnifiedItem[] => {
    const bucketTasks = remoteTasks.filter((t) => getDayBucket(t, today, tomorrow) === bucketName);
    const timedTasks = bucketTasks.filter((t) => !!t.scheduledStartTime).map(toItem);
    const untimedTasks = bucketTasks.filter((t) => !t.scheduledStartTime).sort(sortByPriority).map(toItem);
    const bucketEvents = events
      .filter((e) => eventDate(e.start) === bucketDate)
      .map((e) => ({ kind: "event" as const, data: e }));
    return [...[...timedTasks, ...bucketEvents].sort(sortByTime), ...untimedTasks];
  };

  const todayItems = buildTimeBucket("today", today);
  const tomorrowItems = buildTimeBucket("tomorrow", tomorrow);
  const laterItems = byBucket("later").sort(sortByPriority).map(toItem);

  const allUnscheduled = byBucket("unscheduled").sort(sortByPriority);
  const asapUnscheduledItems = allUnscheduled.filter((t) => t.priority === "ASAP").slice(0, 3).map(toItem);
  const remainingAsap = allUnscheduled.filter((t) => t.priority === "ASAP").slice(3).map(toItem);
  const unscheduledItems = [...remainingAsap, ...allUnscheduled.filter((t) => t.priority !== "ASAP").map(toItem)];

  const sections: TaskSection[] = [];
  if (todayItems.length > 0) sections.push({ label: "Today", items: todayItems });
  if (asapUnscheduledItems.length > 0) sections.push({ label: "ASAP (Unscheduled)", items: asapUnscheduledItems });
  if (tomorrowItems.length > 0) sections.push({ label: "Tomorrow", items: tomorrowItems });
  if (laterItems.length > 0) sections.push({ label: "Later", items: laterItems });
  if (unscheduledItems.length > 0) sections.push({ label: "Unscheduled", items: unscheduledItems });
  return sections;
}

export function TasksDashboard({ userName, userImage }: TasksDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [briefingAt, setBriefingAt] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [scheduleMap, setScheduleMap] = useState<Map<string, { scheduledFor?: string; scheduledStartTime?: string; scheduledEndTime?: string }>>(new Map());
  const [authError, setAuthError] = useState(false);

  const firstName = userName.split(" ")[0] ?? userName;
  const activeTaskRef = useRef<HTMLDivElement>(null);
  const briefingFetchedRef = useRef(false);
  const tasksSnapshotRef = useRef<string>("");
  const eventsSnapshotRef = useRef<string>("");
  const reminderStateRef = useRef<{ lastTaskReminderAt: number; remindedEventIds: Set<string> }>({
    lastTaskReminderAt: 0,
    remindedEventIds: new Set(),
  });

  useEffect(() => {
    if (activeTask) {
      activeTaskRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeTask?.task.id]);

  // This view is intentionally Google Tasks-only. Calendar data belongs to the
  // dedicated Calendar view and must not be pulled as a hidden task source.
  const fetchEvents = useCallback(async (): Promise<CalendarEvent[]> => {
    setEvents([]);
    return [];
  }, []);

  // Fetch Google Tasks only.
  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    const response = await proxyFetch("/agent/google/tasks");
    if (response.status === 401) setAuthError(true);
    const data: { tasks?: Task[] } = response.ok ? await response.json() : { tasks: [] };
    const googleTasks = (data.tasks ?? []).map((task) => ({ ...task, source: "google" as const }));
    setTasks(googleTasks);
    return googleTasks;
  }, []);


  // Generate daily briefing — serves from IDB cache if generated today (local date)
  const fetchBriefing = useCallback(async (currentTasks: Task[], currentEvents: CalendarEvent[]) => {
    setBriefingLoading(true);
    const localToday = () => new Date().toLocaleDateString("en-CA");
    const localNow = () => new Date().toLocaleTimeString();
    try {
      // Check IDB cache first
      const prefs = await idbGetUserPrefs();
      if (prefs.dailyBriefing?.createdAtDate === localToday()) {
        setBriefing(prefs.dailyBriefing.text);
        setBriefingAt(prefs.dailyBriefing.createdAtTime);
        setBriefingLoading(false);
        return;
      }

      const today = localToday();
      const now = localNow();
      // Most-pressing-first: same combined priority + earliest-due/scheduled
      // ordering the visible task list already sorts by (PRIORITY_ORDER,
      // toTaskStartMs above), so the briefing leads with what's actually
      // closest to due, not whatever order the tasks happened to load in.
      // dueDate is included so the model has the real date to reason about,
      // not just a priority label with no timeframe attached to it.
      const tasks = [...currentTasks]
        .sort((a, b) => {
          const pa = PRIORITY_ORDER[a.priority];
          const pb = PRIORITY_ORDER[b.priority];
          if (pa !== pb) return pa - pb;
          return toTaskStartMs(a) - toTaskStartMs(b);
        })
        .map((t) => ({ title: t.title, priority: t.priority ?? "LOW", projectName: t.projectName, dueDate: t.dueDate }));

      const res = await proxyFetch("/agent/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          events: currentEvents.map((e) => ({
            title: e.title,
            start: e.start,
            localTime: e.start.length === 10 ? "" : new Date(e.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          })),
          today,
          now,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { briefing?: string };
        const text = data.briefing ?? null;
        if (text) {
          await idbSetUserPrefs({ dailyBriefing: { text, createdAtDate: today, createdAtTime: now } });
        }
        setBriefing(text);
        setBriefingAt(now);
      }
    } catch {
      setBriefing(null);
    } finally {
      setBriefingLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSchedules = useCallback(async () => {
    const entries = await getAllTaskSchedules();
    setScheduleMap(new Map(entries.map((e) => [e.taskId, { scheduledFor: e.scheduledFor, scheduledStartTime: e.scheduledStartTime, scheduledEndTime: e.scheduledEndTime }])));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEvents(), fetchTasks(), loadSchedules()])
      .then(([evts, tsks]) => {
        // Seed snapshots so the first poll tick doesn't trigger a false-positive backup
        eventsSnapshotRef.current = JSON.stringify(evts);
        tasksSnapshotRef.current = JSON.stringify(tsks);
      })
      .finally(() => setLoading(false));
  }, [fetchEvents, fetchTasks, loadSchedules]);

  const checkReminders = useCallback((newTasks: Task[], newEvents: CalendarEvent[], hasActiveTask: boolean) => {
    const now = Date.now();
    const state = reminderStateRef.current;

    // Meeting reminders: fire once per event when it's ≤10 minutes away
    for (const event of newEvents) {
      if (state.remindedEventIds.has(event.id)) continue;
      const startMs = new Date(event.start).getTime();
      const minsUntil = (startMs - now) / 60_000;
      if (minsUntil > 0 && minsUntil <= 10) {
        const mins = Math.round(minsUntil);
        const notification = {
          id: `reminder-meeting-${event.id}`,
          title: `Starting in ${mins} minute${mins !== 1 ? "s" : ""}`,
          body: event.title,
          ts: now,
        };
        idbAddNotification(notification);
        window.dispatchEvent(new CustomEvent("task-reminder", { detail: notification }));
        state.remindedEventIds.add(event.id);
      }
    }

    // ASAP task reminder: fire at most once per 10 minutes when there's no active timer
    if (!hasActiveTask && now - state.lastTaskReminderAt > 10 * 60_000) {
      const asapTasks = newTasks.filter((t) => t.priority === "ASAP");
      if (asapTasks.length > 0) {
        const body = asapTasks.length === 1
          ? asapTasks[0].title
          : `${asapTasks[0].title} +${asapTasks.length - 1} more`;
        const notification = {
          id: `reminder-asap-${now}`,
          title: `${asapTasks.length} urgent task${asapTasks.length !== 1 ? "s" : ""} need${asapTasks.length === 1 ? "s" : ""} attention`,
          body,
          ts: now,
        };
        idbAddNotification(notification);
        window.dispatchEvent(new CustomEvent("task-reminder", { detail: notification }));
        state.lastTaskReminderAt = now;
      }
    }
  }, []);

  // Polling: delegate to service worker — sends POLL_TICK when it's time to refresh
  useEffect(() => {
    postToSW({ type: "START_TASKS_POLL" });

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type !== "POLL_TICK") return;
      const [newTasks, newEvents] = await Promise.all([fetchTasks(), fetchEvents(), loadSchedules()]);
      const newTasksJson = JSON.stringify(newTasks);
      const newEventsJson = JSON.stringify(newEvents);
      if (newTasksJson !== tasksSnapshotRef.current || newEventsJson !== eventsSnapshotRef.current) {
        tasksSnapshotRef.current = newTasksJson;
        eventsSnapshotRef.current = newEventsJson;
      }
      checkReminders(newTasks, newEvents, activeTask !== null);
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      postToSW({ type: "STOP_TASKS_POLL" });
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, [fetchTasks, fetchEvents, loadSchedules]);

  // Restore active task from Drive (OpenPip/tasks/active.json) after Google Tasks load
  useEffect(() => {
    if (loading) return;
    getPersistedActiveTask().then((persisted) => {
      if (!persisted) return;
      const remoteTask = tasks.find((t) => t.id === persisted.taskId && t.source === persisted.source);
      if (remoteTask) {
        setActiveTask({ task: remoteTask, startedAt: persisted.startedAt, flowRate: persisted.flowRate, baseElapsedMs: persisted.baseElapsedMs ?? 0 });
        return;
      }
    });
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate briefing once tasks + events are loaded — guard ref prevents double-call (e.g. StrictMode)
  useEffect(() => {
    if (!loading && !briefingFetchedRef.current) {
      briefingFetchedRef.current = true;
      fetchBriefing(tasks, events);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlag = useCallback(async (task: Task) => {
    if (activeTask?.task.id === task.id) {
      clearPersistedActiveTask();
      setActiveTask(null);
      return;
    }
    const entry = await getTaskSchedule(task.id);
    const baseElapsedMs = entry?.elapsedMs ?? 0;
    const flowRate = computeFlowRate(task);
    const startedAt = Date.now();
    setPersistedActiveTask({ taskId: task.id, source: task.source, startedAt, flowRate, baseElapsedMs });
    setActiveTask({ task, startedAt, flowRate, baseElapsedMs });
  }, [activeTask]);

  const handleTimerPause = useCallback((baseElapsedMs: number) => {
    if (!activeTask) return;
    setPersistedActiveTask({ taskId: activeTask.task.id, source: activeTask.task.source, startedAt: activeTask.startedAt, flowRate: activeTask.flowRate, baseElapsedMs });
  }, [activeTask]);

  const handleTimerResume = useCallback((newStartedAt: number, baseElapsedMs: number) => {
    if (!activeTask) return;
    setPersistedActiveTask({ taskId: activeTask.task.id, source: activeTask.task.source, startedAt: newStartedAt, flowRate: activeTask.flowRate, baseElapsedMs });
  }, [activeTask]);

  const handleUnflag = useCallback((elapsedMs?: number) => {
    if (elapsedMs !== undefined && activeTask) {
      saveTaskElapsed(activeTask.task.id, elapsedMs);
    }
    clearPersistedActiveTask();
    setActiveTask(null);
  }, [activeTask]);


  const handleComplete = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTask?.task.id === taskId) {
      clearPersistedActiveTask();
      setActiveTask(null);
    }

    try {
      if (task.source === "google" && task.listId) {
        const res = await proxyFetch(`/agent/notebook/pages/${task.listId}/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });
        if (!res.ok) setTasks((prev) => [...prev, task]);
      }
    } catch {
      setTasks((prev) => [...prev, task]);
    }
  }, [tasks, activeTask]);

  // Merge local schedule annotations onto Google Tasks.
  const annotatedTasks = tasks.map((t) => {
    const sched = scheduleMap.get(t.id);
    // If the API says this task is unscheduled, evict any stale Drive schedule file and trust the API.
    if (!t.scheduledFor && sched?.scheduledFor) {
      deleteTaskSchedule(t.id).then(() => {
        setScheduleMap((prev) => { const next = new Map(prev); next.delete(t.id); return next; });
      });
      return t;
    }
    if (!sched) return t;
    // Only apply IDB values that are actually set — spreading undefined would wipe
    // the scheduledFor that the API already merged from the server-side file
    return {
      ...t,
      ...(sched.scheduledFor !== undefined ? { scheduledFor: sched.scheduledFor } : {}),
      ...(sched.scheduledStartTime !== undefined ? { scheduledStartTime: sched.scheduledStartTime } : {}),
      ...(sched.scheduledEndTime !== undefined ? { scheduledEndTime: sched.scheduledEndTime } : {}),
    };
  });
  const sections = groupItems(annotatedTasks, events);
  const todayTaskCount = (sections.find((s) => s.label === "Today")?.items.filter((i) => i.kind === "task").length) ?? 0;
  const completionScope = todayTaskCount > 0 ? "today" : "all";
  const tasksRemaining = todayTaskCount > 0 ? todayTaskCount : sections.flatMap((section) => section.items).filter((item) => item.kind === "task").length;

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle={`Good ${getGreeting()}, ${firstName}.`} />
      <PageShell>
      {authError && (
        <div style={{ background: "#fde8e8", borderRadius: 8, padding: "8px 16px", fontSize: "var(--font-size-sm)", color: "#c02e2e", textAlign: "center" }}>
          Your Google session expired — live updates are paused.{" "}
          <a href="/login" style={{ textDecoration: "underline", fontWeight: 700 }}>Re-authenticate</a>
        </div>
      )}

      <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0 }}>
        {tasksRemaining} task{tasksRemaining !== 1 ? "s" : ""} remaining
      </p>

      <div className={dashStyles.grid}>
        <DailyBriefingCard briefing={briefing} loading={briefingLoading} generatedAt={briefingAt} />
        <TodayAtAGlanceCard
          totalEvents={events.length}
          tasksRemaining={tasksRemaining}
          completedCount={0}
          completionScope={completionScope}
        />

        {activeTask && (
          <ActiveTaskCard ref={activeTaskRef} activeTask={activeTask} onUnflag={handleUnflag} onPause={handleTimerPause} onResume={handleTimerResume} />
        )}

        <TaskList
          sections={sections}
          loading={loading}
          activeTask={activeTask}
          onFlag={handleFlag}
          onComplete={handleComplete}
        />
      </div>

      <FloatingAssistant
        onFlagTask={(taskId, source) => {
          const task = tasks.find((t) => t.id === taskId && t.source === source);
          if (task) handleFlag(task);
        }}
        onUnflagTask={handleUnflag}
        onScheduleTask={(taskId, scheduledFor) => {
          setScheduleMap((prev) => new Map(prev).set(taskId, { scheduledFor }));
        }}
        onAgentAction={() => { fetchTasks(); fetchEvents(); loadSchedules(); }}
      />
    </PageShell>
    </>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}
