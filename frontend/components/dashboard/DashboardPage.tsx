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
import { AgentRunHistoryModal, type AgentRun } from "./AgentRunHistoryModal";

type BriefTask = { title: string; priority: string; projectName: string | null; source?: string; dueDate?: string | null };
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
  const [dashboardDataReady, setDashboardDataReady] = useState(false);
  const [reviewLoaded, setReviewLoaded] = useState(false);
  const briefFetchedRef = useRef(false);
  const scanPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const latestPipelineEvents = latestPipelineAction?.events ?? [];
  const latestPipelineEvent = latestPipelineEvents[latestPipelineEvents.length - 1];
  const latestPipelineStatus = latestPipelineEvent?.title ?? latestPipelineAction?.title;
  const latestPipelineDetail = latestPipelineEvent?.detail ?? latestPipelineAction?.error;
  const isPipelineRunning = latestPipelineAction?.status === "queued" || latestPipelineAction?.status === "running";

  // Approved-but-not-yet-executed proposals — a separate concept from the
  // scan job below (execution itself stays mocked for now; this just
  // reflects anything already approved on a previous visit).
  const refreshScheduledActions = useCallback(async (): Promise<ScheduledPlan[]> => {
    try {
      const response = await proxyFetch("/agent/scheduled-actions");
      const data = response.ok ? await response.json() as { actions?: ScheduledPlan[] } : { actions: [] };
      const actions = data.actions ?? [];
      // These are real Proposal rows (ProposalStatus: pending/approved/
      // rejected/executing/executed/failed) via /agent/scheduled-actions,
      // NOT scan-job rows (queued/running/completed/failed) — "queued" and
      // "running" here used to check for scan-job values that a Proposal
      // can never actually have, so this always matched nothing and an
      // approved proposal never appeared as active work.
      const active = actions.filter((action) => action.status === "approved" || action.status === "executing");
      setPipelineActions(active);
      setScheduledPlan(active[0] ?? null);
      // A live scan (below) takes precedence over this on first paint; don't
      // clobber it if one is already in progress or just finished.
      setLatestPipelineAction((current) => current ?? actions[0] ?? null);
      return active;
    } catch {
      setScheduledPlan(null);
      return [];
    }
  }, []);

  const stopScanPolling = useCallback(() => {
    if (scanPollRef.current) window.clearInterval(scanPollRef.current);
    scanPollRef.current = null;
  }, []);

  const pollScan = useCallback((jobId: string) => {
    stopScanPolling();
    const update = async () => {
      try {
        const res = await proxyFetch(`/agent/proposals/scan/${jobId}`);
        if (!res.ok) { stopScanPolling(); return; }
        const job = await res.json() as ScheduledPlan;
        setLatestPipelineAction(job);
        if (job.status !== "queued" && job.status !== "running") {
          stopScanPolling();
          void refreshScheduledActions();
        }
      } catch {
        stopScanPolling();
      }
    };
    scanPollRef.current = window.setInterval(() => { void update(); }, 800);
    void update();
  }, [stopScanPolling, refreshScheduledActions]);

  useEffect(() => () => stopScanPolling(), [stopScanPolling]);

  const requestDashboardPipeline = useCallback(async () => {
    try {
      const response = await proxyFetch("/agent/proposals/scan", { method: "POST" });
      if (!response.ok) return;
      const job = await response.json() as ScheduledPlan;
      setLatestPipelineAction(job);
      pollScan(job.id);
    } catch {
      // The button stays available — nothing is left in a stuck disabled state.
    }
  }, [pollScan]);

  const handleReviewLoaded = useCallback(() => setReviewLoaded(true), []);

  useEffect(() => {
    const today = new Date().toDateString();

    async function loadTasks() {
      type GoogleTask = { title: string; priority?: string; dueDate?: string | null };
      type Calendar = { events?: Array<{ title?: string; start?: string }> };
      const [googleTasksRes, calendarRes, inboxRes] = await Promise.all([
        proxyFetch("/agent/google/tasks"),
        // Without `from`, the backend's "today" defaults to the server's UTC
        // date — wrong on either side of midnight UTC for any user not on
        // UTC. Always anchor it to the user's own local date.
        proxyFetch(`/agent/calendars?days=1&from=${localToday()}`),
        proxyFetch("/agent/inbox/count"),
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
      // "Open" combines today's Google Tasks + today's calendar events with
      // the total unread email count (not date-scoped — see /agent/inbox/count;
      // older unread mail is still work waiting on you, not just today's).
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

      // Build brief payload from the data we already have. Overdue tasks
      // (tier 0) belong in the briefing just as much as tasks due today
      // (tier 1) — a briefing that only looked at "due today" would silently
      // drop anything overdue, which is exactly the work that most needs
      // surfacing.
      // Sorted, not just filtered — the backend prompt tells the LLM these
      // arrive in urgency order (closest due date, then highest priority)
      // and treats earlier entries as more urgent without re-ranking them
      // itself, so that ordering has to actually hold here.
      const briefTasks: BriefTask[] = [
        ...googleTasks
          .map((t) => ({ t, tier: dateUrgencyTier(t.dueDate) }))
          .filter((x): x is { t: GoogleTask; tier: number } => x.tier === 0 || x.tier === 1)
          .sort((a, b) => a.tier - b.tier || namedPriorityToNumber(a.t.priority) - namedPriorityToNumber(b.t.priority))
          .map(({ t }) => ({ title: t.title, priority: t.priority ?? "LOW", projectName: null, source: "google", dueDate: t.dueDate ?? null })),
      ];
      const briefEvents: BriefEvent[] = (calendarData.calendars ?? [])
        .flatMap((calendarItem) => (calendarItem.events ?? [])
          .filter((event) => event.start && new Date(event.start).toDateString() === todayDate)
          .map((event) => ({ title: event.title ?? "Calendar event", start: event.start! })));
      return { briefTasks, briefEvents };
    }

    async function loadBrief(briefTasks: BriefTask[], briefEvents: BriefEvent[]) {
      try {
        // Serve from IDB cache if generated today
        const prefs = await idbGetUserPrefs();
        // Version the cache so a briefing generated by the former LLM path is
        // not shown after switching routine briefs to the deterministic backend.
        if (prefs.dailyBriefing?.version === "deterministic-v1" && prefs.dailyBriefing?.createdAtDate === localToday()) {
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
            await idbSetUserPrefs({ dailyBriefing: { version: "deterministic-v1", text, createdAtDate: localToday(), createdAtTime: t } });
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
      try {
        const [{ briefTasks, briefEvents }] = await Promise.all([
          loadTasks(),
          loadRoute(),
          refreshScheduledActions(),
        ]);
        // Pipeline scan is manual — user clicks the button to start it
        if (!briefFetchedRef.current) {
          briefFetchedRef.current = true;
          await loadBrief(briefTasks, briefEvents);
        }
      } catch {
        // A partial provider outage should not keep the assistant entry point
        // hidden forever. The individual cards already render their empty
        // states when their data is unavailable.
        setTasksLoading(false);
        setBriefLoading(false);
      } finally {
        // The assistant prompt is deliberately introduced after the rest of
        // the dashboard establishes its initial content.
        setDashboardDataReady(true);
      }
    }

    init();
  }, [refreshScheduledActions]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const showAssistantPrompt = dashboardDataReady && reviewLoaded && !tasksLoading && !briefLoading;

  return (
    <div className={styles.shell}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle={today} />

      <main className={styles.grid}>
        {showAssistantPrompt && (latestPipelineAction ? (
          <section className={`${styles.assistantPrompt} ${styles.cardFull}`} style={{ animationDelay: "0ms" }} aria-live="polite">
            <div className={styles.assistantPromptContent}>
              <p className={styles.assistantPromptKicker}><span aria-hidden="true">✦</span> {agentName} assistant</p>
              <h2 className={styles.assistantPromptTitle}>
                {isPipelineRunning
                  ? "Reviewing your workspace"
                  : latestPipelineAction.status === "completed"
                    ? "Your workspace review is ready"
                    : "Something needs your attention"}
              </h2>
              <p className={styles.assistantPromptCopy}>
                {isPipelineRunning
                  ? "Your assistant is looking for useful next actions. You can keep working while it finishes."
                  : latestPipelineStatus || "Your assistant prepared an item for you to review."}
              </p>
              {latestPipelineDetail && <p className={styles.assistantPromptMeta}>{latestPipelineDetail}</p>}
              {latestPipelineAction.status === "failed" && !latestPipelineDetail && <p className={styles.assistantPromptMeta}>The scan did not finish. You can try again whenever you are ready.</p>}
              {pipelineActions.length > 1 && <p className={styles.assistantPromptMeta}>+{pipelineActions.length - 1} more action{pipelineActions.length === 2 ? "" : "s"} in progress</p>}
            </div>
            <div className={styles.assistantPromptActions}>
              {isPipelineRunning ? (
                // The pulsing dot already says "a scan is running" — a second,
                // merely-disabled "Run new scan" button next to it was
                // redundant and read as broken. Nothing to click while one
                // is already in flight, so nothing renders here.
                <span className={`${styles.pipelineStatusDot} ${styles.pipelinePulse}`} aria-label="Scan in progress" />
              ) : (
                <>
                  <button type="button" className={styles.assistantPrimaryBtn} onClick={() => setRunHistoryOpen(true)}>Review details</button>
                  <button type="button" className={styles.assistantSecondaryBtn} onClick={() => void requestDashboardPipeline()}>
                    Run new scan
                  </button>
                </>
              )}
              {isPipelineRunning ? (
                <button type="button" className={styles.showDetailsLink} onClick={() => setRunHistoryOpen(true)}>Show details</button>
              ) : (
                <p className={styles.assistantPromptTrust}>Nothing is changed without your approval.</p>
              )}
            </div>
          </section>
        ) : (
          <section className={`${styles.assistantPrompt} ${styles.cardFull}`} style={{ animationDelay: "0ms" }}>
            <div className={styles.assistantPromptContent}>
              <p className={styles.assistantPromptKicker}><span aria-hidden="true">✦</span> {agentName} assistant</p>
              <h2 className={styles.assistantPromptTitle}>Ready to review your workspace.</h2>
              <p className={styles.assistantPromptCopy}>Scan for useful next actions and prepare suggestions for you to review.</p>
            </div>
            <div className={styles.assistantPromptActions}>
              <button type="button" className={styles.assistantPrimaryBtn} onClick={() => void requestDashboardPipeline()}>Start workspace scan</button>
              <p className={styles.assistantPromptTrust}>Nothing is changed without your approval.</p>
            </div>
          </section>
        ))}

        {/* Daily Brief */}
        <div className={`${styles.card} ${styles.cardFull} ${styles.cardBrief}`} style={{ animationDelay: "80ms" }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Today&apos;s Brief</span>
            {brief && !briefLoading && (
              <ReadAloudButton text={brief ?? ""} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, display: "flex", alignItems: "center", marginLeft: "auto" }} />
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
            <p className={styles.outcomeDescription}>{eventsTotal} calendar event{eventsTotal === 1 ? "" : "s"} today · {unreadCount ?? 0} unread email{unreadCount === 1 ? "" : "s"}</p>
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

        <ReviewDashboardCard className={styles.outcomeReview} style={{ animationDelay: "120ms" }} onLoaded={handleReviewLoaded} />

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
