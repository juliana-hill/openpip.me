"use client";
import { proxyFetch } from "@/lib/proxy";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./DashboardPage.module.css";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { idbGetUserPrefs, idbSetUserPrefs, idbListSearches } from "@/lib/idb";
import { pushUserData } from "@/lib/sync";
import { ReviewDashboardCard } from "./ReviewDashboardCard";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { useAgentIdentity } from "@/lib/agentIdentity";
import { postToSW } from "@/lib/sw";
import { AgentRunHistoryModal, type AgentRun } from "./AgentRunHistoryModal";

type BriefTask = { title: string; priority: string; projectName: string | null; source?: string };
type BriefEvent = { title: string; start: string };
type TaskSnapshot = { title: string; priority: number; source: string }[];
type RouteSnapshot = { origin: string; destination: string; date: string } | null;
type ScheduledPlan = AgentRun;

const localToday = () => new Date().toLocaleDateString("en-CA");
const localNow = () => new Date().toLocaleTimeString();

export function DashboardPage({ userName, userImage }: { userName: string; userImage: string }) {
  const { name: agentName } = useAgentIdentity();
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const [tasks, setTasks] = useState<TaskSnapshot>([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [openTotal, setOpenTotal] = useState(0);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [route, setRoute] = useState<RouteSnapshot>(null);
  const [scheduledPlan, setScheduledPlan] = useState<ScheduledPlan | null>(null);
  const [pipelineActions, setPipelineActions] = useState<ScheduledPlan[]>([]);
  const [latestPipelineAction, setLatestPipelineAction] = useState<ScheduledPlan | null>(null);
  const [runHistoryOpen, setRunHistoryOpen] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const briefFetchedRef = useRef(false);
  const dashboardPipelineRequestedRef = useRef(false);

  const latestPipelineEvents = latestPipelineAction?.events ?? [];
  const latestPipelineEvent = latestPipelineEvents[latestPipelineEvents.length - 1];
  const latestPipelineStatus = latestPipelineEvent?.title ?? latestPipelineAction?.title;
  const latestPipelineDetail = latestPipelineEvent?.detail ?? latestPipelineAction?.error;

  const briefSpeechText = brief?.replace(/[#*`_~>\-]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim() ?? "";

  const refreshScheduledActions = useCallback(async (): Promise<ScheduledPlan[]> => {
    try {
      const response = await proxyFetch("/agent/scheduled-actions");
      const data = response.ok ? await response.json() as { actions?: ScheduledPlan[] } : { actions: [] };
      const actions = data.actions ?? [];
      const active = actions.filter((action) => action.status === "queued" || action.status === "running");
      setPipelineActions(active);
      setScheduledPlan(active[0] ?? null);
      setLatestPipelineAction(actions[0] ?? null);
      if (active.length) await postToSW({ type: "START_SCHEDULED_ACTIONS_POLL" });
      return active;
    } catch {
      setScheduledPlan(null);
      return [];
    }
  }, []);

  const requestDashboardPipeline = useCallback(async () => {
    if (dashboardPipelineRequestedRef.current) return;
    dashboardPipelineRequestedRef.current = true;
    try {
      const response = await proxyFetch("/agent/proposals/scan", { method: "POST" });
      if (!response.ok) return;
      const channel = new BroadcastChannel("route-jobs");
      channel.postMessage({ type: "SCHEDULED_ACTIONS_ENQUEUED" });
      channel.close();
      await postToSW({ type: "START_SCHEDULED_ACTIONS_POLL" });
      await refreshScheduledActions();
    } catch {
      // The next dashboard visit retries through the same durable scheduler path.
    }
  }, [refreshScheduledActions]);

  useEffect(() => {
    const today = new Date().toDateString();

    async function loadTasks() {
      type GoogleTask = { title: string; priority?: string; dueDate?: string | null };
      type Calendar = { events?: Array<{ start?: string }> };
      const [googleTasksRes, calendarRes, inboxRes] = await Promise.all([
        proxyFetch("/agent/google/tasks"),
        proxyFetch("/agent/calendars?days=1"),
        proxyFetch(`/agent/inbox/count?localDate=${localToday()}`),
      ]);

      const googleTasks: GoogleTask[] = googleTasksRes.ok ? ((await googleTasksRes.json()).tasks ?? []) : [];
      const calendarData = calendarRes.ok ? await calendarRes.json() as { calendars?: Calendar[] } : { calendars: [] };
      const inboxData = inboxRes.ok ? await inboxRes.json() as { unread?: number } : {};
      const todayDate = new Date().toDateString();
      const eventCount = (calendarData.calendars ?? []).reduce((total, calendar) => total + (calendar.events ?? []).filter((event) => event.start && new Date(event.start).toDateString() === todayDate).length, 0);
      setEventsTotal(eventCount);
      setUnreadCount(inboxData.unread ?? 0);
      const namedPriorityToNumber = (p: string | undefined) =>
        p === "ASAP" ? 1 : p === "HIGH" ? 2 : p === "LOW" ? 4 : 3;

      // Top-3 URGENT tasks only — overdue, due today, or due within the next few
      // days — across every source. Non-urgent open tasks (e.g. undated Google
      // reading-list items and MEDIUM/LOW tasks are excluded, even if that
      // means showing fewer than 3.
      const SOON_DAYS = 3;
      const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
      const soonCutoff = new Date(todayMidnight);
      soonCutoff.setDate(soonCutoff.getDate() + SOON_DAYS);
      soonCutoff.setHours(23, 59, 59, 999);

      // Google Tasks returns due dates as YYYY-MM-DD. Parse those as local
      // calendar dates; `new Date("YYYY-MM-DD")` would interpret them as UTC
      // and shift them to the previous day in western time zones.
      const localTaskDate = (dateStr: string | null | undefined): Date | null => {
        if (!dateStr) return null;
        const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr);
        if (Number.isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      };

      // 0 = overdue, 1 = due today, 2 = due soon, null = not urgent by date
      const dateUrgencyTier = (dateStr: string | null | undefined): number | null => {
        const d = localTaskDate(dateStr);
        if (!d) return null;
        if (d.getTime() < todayMidnight.getTime()) return 0;
        if (d.getTime() === todayMidnight.getTime()) return 1;
        if (d.getTime() <= soonCutoff.getTime()) return 2;
        return null;
      };

      // The Today card count is intentionally narrower than "all open": only
      // overdue tasks and tasks due today belong in today's workload metric.
      const todayTaskCount = googleTasks.filter((task) => {
        const tier = dateUrgencyTier(task.dueDate);
        return tier === 0 || tier === 1;
      }).length;
      setTasksTotal(todayTaskCount);
      // "Open" is the combined workload across today's Google Tasks,
      // calendar events, and unread email—not the total number of open tasks.
      setOpenTotal(todayTaskCount + eventCount + (inboxData.unread ?? 0));

      type UrgentTask = { title: string; priority: number; source: string; tier: number };
      const urgentTasks: UrgentTask[] = [
        ...googleTasks
          .map((t) => ({ t, tier: dateUrgencyTier(t.dueDate) }))
          .filter((x): x is { t: GoogleTask; tier: number } => x.tier !== null)
          .map(({ t, tier }) => ({ title: t.title, priority: namedPriorityToNumber(t.priority), source: "google", tier })),
      ];
      const top3Urgent = urgentTasks
        .sort((a, b) => a.tier - b.tier || a.priority - b.priority)
        .slice(0, 3)
        .map(({ title, priority, source }) => ({ title, priority, source }));
      setTasks(top3Urgent);
      setTasksLoading(false);

      // Build brief payload from the data we already have
      const briefTasks: BriefTask[] = [
        ...googleTasks
          .filter((t) => localTaskDate(t.dueDate)?.toDateString() === today)
          .map((t) => ({ title: t.title, priority: t.priority ?? "LOW", projectName: null, source: "google" })),
      ];
      return { briefTasks, briefEvents: [] as BriefEvent[] };
    }

    async function loadBrief(briefTasks: BriefTask[], briefEvents: BriefEvent[]) {
      try {
        // Serve from IDB cache if generated today
        const prefs = await idbGetUserPrefs();
        if (prefs.dailyBriefing?.createdAtDate === localToday()) {
          setBrief(prefs.dailyBriefing.text);
          setBriefLoading(false);
          return;
        }

        const res = await proxyFetch("/agent/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: briefTasks, events: briefEvents, today: localToday(), now: localNow() }),
        });
        if (res.ok) {
          const data = await res.json() as { briefing?: string };
          const text = data.briefing ?? null;
          if (text) {
            const t = localNow();
            await idbSetUserPrefs({ dailyBriefing: { text, createdAtDate: localToday(), createdAtTime: t } });
            void pushUserData();
            setBrief(text);
          }
        }
      } catch { /* silent */ }
      setBriefLoading(false);
    }

    async function loadRoute() {
      try {
        const searches = await idbListSearches();
        if (searches.length > 0) {
          const s = searches[0];
          setRoute({ origin: s.origin, destination: s.destination, date: s.date });
        }
      } catch { /* silent */ }
    }

    async function init() {
      const [{ briefTasks, briefEvents }, , activeActions] = await Promise.all([
        loadTasks(),
        loadRoute(),
        refreshScheduledActions(),
      ]);
      // Pipeline scan is manual — user clicks the button to start it
      if (!briefFetchedRef.current) {
        briefFetchedRef.current = true;
        await loadBrief(briefTasks, briefEvents);
      }
    }

    init();
  }, [refreshScheduledActions]);

  useEffect(() => {
    const channel = new BroadcastChannel("route-jobs");
    const onMessage = (event: MessageEvent<{ type?: string; active?: ScheduledPlan[]; actions?: ScheduledPlan[] }>) => {
      if (event.data?.type === "SCHEDULED_ACTIONS_ENQUEUED") {
        void refreshScheduledActions();
        return;
      }
      if (event.data?.type === "SCHEDULED_ACTIONS_UPDATE") {
        const active = event.data.active ?? [];
        setPipelineActions(active);
        setScheduledPlan(active[0] ?? null);
        setLatestPipelineAction(event.data.actions?.[0] ?? null);
      }
    };
    channel.addEventListener("message", onMessage);
    return () => channel.close();
  }, [refreshScheduledActions]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className={styles.shell}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle={today} />

      <main className={styles.grid}>
        {/* Daily Brief */}
        <div className={`${styles.card} ${styles.cardFull} ${styles.cardBrief}`} style={{ animationDelay: "0ms" }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Today&apos;s Brief</span>
            {brief && !briefLoading && (
              <ReadAloudButton text={briefSpeechText} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, display: "flex", alignItems: "center", marginLeft: "auto" }} />
            )}
          </div>
          {briefLoading ? <div className={styles.skeleton} /> : brief ? (
            <div className={styles.briefText}>
              <Markdown remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ margin: "4px 0", paddingLeft: 18 }}>{children}</ul>,
                  li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                  blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid var(--color-border)", paddingLeft: 10, color: "var(--color-text-muted)", fontStyle: "italic", margin: "8px 0 0" }}>{children}</blockquote>,
                  strong: ({ children }) => <strong style={{ color: "var(--color-text)" }}>{children}</strong>,
                }}
              >{brief}</Markdown>
            </div>
          ) : <p className={styles.briefText}>No briefing available.</p>}
        </div>

        {latestPipelineAction && <button
          type="button"
          className={`${styles.card} ${styles.cardFull} ${styles.pipelineStatus}`}
          onClick={() => setRunHistoryOpen(true)}
          aria-label={`View ${agentName}'s action history. Latest status: ${latestPipelineStatus}`}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{latestPipelineAction.status === "queued" || latestPipelineAction.status === "running" ? `${agentName} is working` : latestPipelineAction.status === "completed" ? `${agentName} is up to date` : `${agentName} needs attention`}</span>
            {(latestPipelineAction.status === "queued" || latestPipelineAction.status === "running")
              ? <span className={`${styles.pipelineStatusDot} ${styles.pipelinePulse}`} aria-hidden="true" />
              : <span
                  role="button"
                  tabIndex={0}
                  className={styles.pipelineRunBtn}
                  onClick={(e) => { e.stopPropagation(); void requestDashboardPipeline(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); void requestDashboardPipeline(); } }}
                  aria-label="Run proposal scan"
                >Run scan</span>}
          </div>
          <p className={styles.pipelineText}>
            {latestPipelineStatus}
          </p>
          {latestPipelineDetail && <p className={styles.pipelineMeta}>{latestPipelineDetail}</p>}
          {latestPipelineAction.status === "failed" && !latestPipelineDetail && <p className={styles.pipelineMeta}>The agent will try again after the next data sync.</p>}
          {pipelineActions.length > 1 && <p className={styles.pipelineMeta}>+{pipelineActions.length - 1} more action{pipelineActions.length === 2 ? "" : "s"} in progress</p>}
        </button>}

        {!latestPipelineAction && <div className={`${styles.card} ${styles.cardFull} ${styles.pipelineStatus}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{agentName}</span>
            <span
              role="button"
              tabIndex={0}
              className={styles.pipelineRunBtn}
              onClick={() => void requestDashboardPipeline()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") void requestDashboardPipeline(); }}
              aria-label="Run proposal scan"
            >Run scan</span>
          </div>
          <p className={styles.pipelineText}>No recent activity. Start a scan to find useful next actions.</p>
        </div>}

        {/* Today is a single outcome card: schedule and work, not separate navigation modes. */}
        <Link href="/today" className={`${styles.card} ${styles.cardHalf} ${styles.outcomeToday}`} style={{ animationDelay: "60ms" }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Today</span>
            {openTotal > 0 && <span className={styles.badge}>{openTotal} open</span>}
            <span className={styles.cardArrow}>→</span>
          </div>
          {tasksLoading ? <div className={styles.skeleton} /> : <>
            <p className={styles.outcomeMetric}>{tasksTotal} Google task{tasksTotal === 1 ? "" : "s"}</p>
            <p className={styles.outcomeDescription}>Overdue or due today, from your connected Google Tasks account.</p>
            <p className={styles.outcomeDescription}>{eventsTotal} calendar event{eventsTotal === 1 ? "" : "s"} · {unreadCount ?? 0} unread email{unreadCount === 1 ? "" : "s"} today</p>
            {tasks.slice(0, 3).map((task, index) => (
              <div key={index} className={styles.taskRow}>
                <span className={styles.checkbox} />
                <span className={styles.taskTitle}>{task.title}</span>
                <span className={`${styles.priorityDot} ${task.priority <= 1 ? styles.priorityAsap : task.priority <= 2 ? styles.priorityHigh : task.priority <= 3 ? styles.priorityMed : styles.priorityLow}`} />
              </div>
            ))}
            {tasks.length === 0 && <p className={styles.emptyText}>No Google Tasks need your attention.</p>}
          </>}
        </Link>

        <ReviewDashboardCard className={styles.outcomeReview} style={{ animationDelay: "120ms" }} />

        {/* Travel planning is always visible as an outcome card. It only claims an
            active plan when the browser has a persisted route search. */}
        <Link href="/trips" className={`${styles.card} ${styles.cardHalf} ${styles.outcomePlan}`} style={{ animationDelay: "180ms" }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Travel planning</span>
            <span className={styles.cardArrow}>→</span>
          </div>
          {scheduledPlan && scheduledPlan.type === "trip_plan" ? <>
            <p className={styles.outcomeMetric}>{scheduledPlan.title}</p>
            <p className={styles.outcomeDescription}>{scheduledPlan.status === "queued" ? "Queued in Scheduled Actions. The agent will start it shortly." : "The agent is working from your approved proposal."}</p>
            <div className={styles.outcomeFooter}><span>{scheduledPlan.status === "queued" ? "Queued" : "In progress"}</span><b>Active</b></div>
          </> : route ? <>
            <p className={styles.outcomeMetric}>{route.destination}</p>
            <p className={styles.outcomeDescription}>Your saved route and next planning decisions.</p>
            <div className={styles.routeRow}>
              <span className={styles.routeOrigin}>{route.origin}</span>
              <span className={styles.routeArrow}>→</span>
              <span className={styles.routeDest}>{route.destination}</span>
              <span className={styles.routeMeta}>{route.date}</span>
            </div>
            <div className={styles.outcomeFooter}><span>Saved plan</span><b>Continue</b></div>
          </> : <>
            <p className={styles.outcomeMetric}>No active trip</p>
            <p className={styles.outcomeDescription}>When the agent has trip context, it will prepare a planning proposal here for your approval.</p>
            <div className={styles.outcomeFooter}><span>Nothing booked</span></div>
          </>}
        </Link>
      </main>

      <div className={styles.talkBar}>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-agent-assistant"))}>
          ◉ Talk or Type to {agentName}
        </button>
      </div>

      <AgentRunHistoryModal open={runHistoryOpen} action={latestPipelineAction} onClose={() => setRunHistoryOpen(false)} />
      <FloatingAssistant />
    </div>
  );
}
