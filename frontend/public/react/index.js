import {
  idbListSearches
} from "./chunk-4JWWYGPH.js";
import {
  Dialog_default
} from "./chunk-VGRKXESR.js";
import {
  FloatingAssistant,
  ReadAloudButton
} from "./chunk-FT3IJZ4L.js";
import {
  AppHeader,
  Link,
  Markdown,
  remarkGfm,
  useAgentIdentity
} from "./chunk-5Y7KWAY6.js";
import "./chunk-OHWNV7E6.js";
import {
  X,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-CJP2RCVW.js";
import {
  __toESM
} from "./chunk-U67V476Y.js";

// react-entries/index.tsx
var import_client = __toESM(require_client());

// components/dashboard/DashboardPage.tsx
var import_react3 = __toESM(require_react());

// components/dashboard/DashboardPage.module.css
var DashboardPage_default = {
  shell: "DashboardPage_shell",
  nav: "DashboardPage_nav",
  avatar: "DashboardPage_avatar",
  avatarImg: "DashboardPage_avatarImg",
  avatarInitials: "DashboardPage_avatarInitials",
  wordmark: "DashboardPage_wordmark",
  wordmarkText: "DashboardPage_wordmarkText",
  axolotlIcon: "DashboardPage_axolotlIcon",
  agentIconSmall: "DashboardPage_agentIconSmall",
  navDate: "DashboardPage_navDate",
  grid: "DashboardPage_grid",
  card: "DashboardPage_card",
  fadeSlideUp: "DashboardPage_fadeSlideUp",
  cardFull: "DashboardPage_cardFull",
  cardHalf: "DashboardPage_cardHalf",
  cardBrief: "DashboardPage_cardBrief",
  assistantPrompt: "DashboardPage_assistantPrompt",
  assistantPromptEnter: "DashboardPage_assistantPromptEnter",
  assistantPromptContent: "DashboardPage_assistantPromptContent",
  assistantPromptKicker: "DashboardPage_assistantPromptKicker",
  assistantPromptTitle: "DashboardPage_assistantPromptTitle",
  assistantPromptCopy: "DashboardPage_assistantPromptCopy",
  assistantPromptMeta: "DashboardPage_assistantPromptMeta",
  assistantPromptTrust: "DashboardPage_assistantPromptTrust",
  assistantPromptActions: "DashboardPage_assistantPromptActions",
  showDetailsLink: "DashboardPage_showDetailsLink",
  assistantPrimaryBtn: "DashboardPage_assistantPrimaryBtn",
  assistantSecondaryBtn: "DashboardPage_assistantSecondaryBtn",
  studyMeSpinner: "DashboardPage_studyMeSpinner",
  studyMeSpin: "DashboardPage_studyMeSpin",
  pipelineStatus: "DashboardPage_pipelineStatus",
  pipelineText: "DashboardPage_pipelineText",
  pipelineMeta: "DashboardPage_pipelineMeta",
  pipelineRunningRow: "DashboardPage_pipelineRunningRow",
  pipelineStartRow: "DashboardPage_pipelineStartRow",
  pipelineStatusDot: "DashboardPage_pipelineStatusDot",
  pipelinePulse: "DashboardPage_pipelinePulse",
  pipelineComplete: "DashboardPage_pipelineComplete",
  pipelineFailed: "DashboardPage_pipelineFailed",
  pipelineRunBtn: "DashboardPage_pipelineRunBtn",
  outcomeToday: "DashboardPage_outcomeToday",
  eventTitle: "DashboardPage_eventTitle",
  taskTitle: "DashboardPage_taskTitle",
  outcomeMetric: "DashboardPage_outcomeMetric",
  outcomeDescription: "DashboardPage_outcomeDescription",
  outcomeFooter: "DashboardPage_outcomeFooter",
  outcomeReview: "DashboardPage_outcomeReview",
  outcomePlan: "DashboardPage_outcomePlan",
  talkBar: "DashboardPage_talkBar",
  cardHeader: "DashboardPage_cardHeader",
  cardTitle: "DashboardPage_cardTitle",
  cardArrow: "DashboardPage_cardArrow",
  briefText: "DashboardPage_briefText",
  badge: "DashboardPage_badge",
  pill: "DashboardPage_pill",
  taskRow: "DashboardPage_taskRow",
  checkbox: "DashboardPage_checkbox",
  priorityDot: "DashboardPage_priorityDot",
  priorityAsap: "DashboardPage_priorityAsap",
  priorityHigh: "DashboardPage_priorityHigh",
  priorityMed: "DashboardPage_priorityMed",
  priorityLow: "DashboardPage_priorityLow",
  eventRow: "DashboardPage_eventRow",
  eventDot: "DashboardPage_eventDot",
  eventTime: "DashboardPage_eventTime",
  jobRow: "DashboardPage_jobRow",
  companyInitial: "DashboardPage_companyInitial",
  jobInfo: "DashboardPage_jobInfo",
  jobRole: "DashboardPage_jobRole",
  jobCompany: "DashboardPage_jobCompany",
  jobReason: "DashboardPage_jobReason",
  routeRow: "DashboardPage_routeRow",
  routeOrigin: "DashboardPage_routeOrigin",
  routeDest: "DashboardPage_routeDest",
  routeArrow: "DashboardPage_routeArrow",
  routeMeta: "DashboardPage_routeMeta",
  tripCounts: "DashboardPage_tripCounts",
  compareLink: "DashboardPage_compareLink",
  skeleton: "DashboardPage_skeleton",
  shimmer: "DashboardPage_shimmer",
  emptyText: "DashboardPage_emptyText",
  contactList: "DashboardPage_contactList",
  contactRow: "DashboardPage_contactRow"
};

// components/dashboard/ReviewDashboardCard.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
function ReviewDashboardCard({ style, className, onLoaded }) {
  const [count, setCount] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    let active = true;
    proxyFetch("/agent/review").then(async (response) => response.ok ? response.json() : { items: [] }).then((data) => {
      if (!active) return;
      setCount(data.items?.length ?? 0);
      onLoaded?.();
    }).catch(() => {
      if (!active) return;
      setCount(0);
      onLoaded?.();
    });
    return () => {
      active = false;
    };
  }, [onLoaded]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, { href: "/review", className: `${DashboardPage_default.card} ${DashboardPage_default.cardHalf} ${className ?? ""}`, style, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: DashboardPage_default.cardHeader, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: DashboardPage_default.cardTitle, children: "Ready for review" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: DashboardPage_default.cardArrow, children: "\u2192" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: DashboardPage_default.outcomeMetric, children: count == null ? "Checking\u2026" : count === 0 ? "All clear" : `${count} item${count === 1 ? "" : "s"}` }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: DashboardPage_default.outcomeDescription, children: count == null ? "Checking the work your agent prepared." : count === 0 ? "Nothing needs your decision right now." : "Drafts, applications, and proposals waiting for your decision." }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: DashboardPage_default.outcomeFooter, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: count && count > 0 ? { color: "var(--color-accent)" } : void 0, children: count && count > 0 ? "These need your approval" : "You're up to date" }) })
  ] });
}

// components/dashboard/AgentRunHistoryModal.module.css
var AgentRunHistoryModal_default = {
  content: "AgentRunHistoryModal_content",
  eyebrow: "AgentRunHistoryModal_eyebrow",
  boundary: "AgentRunHistoryModal_boundary",
  scrollArea: "AgentRunHistoryModal_scrollArea",
  timeline: "AgentRunHistoryModal_timeline",
  event: "AgentRunHistoryModal_event",
  dot: "AgentRunHistoryModal_dot",
  dotNeutral: "AgentRunHistoryModal_dotNeutral",
  dotWorker: "AgentRunHistoryModal_dotWorker",
  dotProgress: "AgentRunHistoryModal_dotProgress",
  dotCompleted: "AgentRunHistoryModal_dotCompleted",
  dotFailed: "AgentRunHistoryModal_dotFailed",
  dotCurrent: "AgentRunHistoryModal_dotCurrent",
  currentPulse: "AgentRunHistoryModal_currentPulse",
  legacy: "AgentRunHistoryModal_legacy",
  meta: "AgentRunHistoryModal_meta",
  error: "AgentRunHistoryModal_error"
};

// components/dashboard/AgentRunHistoryModal.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var STATUS_LABEL = {
  queued: "Queued",
  running: "Working",
  completed: "Completed",
  failed: "Needs attention"
};
function formatTime(value) {
  return new Date(value).toLocaleString(void 0, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function dotClass(event, current) {
  if (current) return AgentRunHistoryModal_default.dotCurrent;
  if (event.type === "completed") return AgentRunHistoryModal_default.dotCompleted;
  if (event.type === "failed") return AgentRunHistoryModal_default.dotFailed;
  if (event.type === "worker_started") return AgentRunHistoryModal_default.dotWorker;
  if (event.type === "progress") return AgentRunHistoryModal_default.dotProgress;
  return AgentRunHistoryModal_default.dotNeutral;
}
function AgentRunHistoryModal({ open, action, onClose }) {
  if (!open || !action) return null;
  const events = action.events ?? [];
  const active = action.status === "queued" || action.status === "running";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: Dialog_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: `${Dialog_default.content} ${AgentRunHistoryModal_default.content}`, role: "dialog", "aria-modal": "true", "aria-labelledby": "agent-run-title", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: Dialog_default.closeBtn, onClick: onClose, "aria-label": "Close agent run history", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(X, { size: 16 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: Dialog_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: AgentRunHistoryModal_default.eyebrow, children: "Agent activity" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: Dialog_default.title, id: "agent-run-title", children: action.title }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: Dialog_default.description, children: [
          STATUS_LABEL[action.status],
          " \xB7 ",
          formatTime(action.completedAt ?? action.startedAt ?? action.createdAt)
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: AgentRunHistoryModal_default.boundary, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "No external user-facing action" }),
        " has occurred from this run."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: AgentRunHistoryModal_default.scrollArea, children: [
        events.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { className: AgentRunHistoryModal_default.timeline, "aria-label": "Recorded action history", children: events.map((event, index) => {
          const current = active && index === events.length - 1;
          return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: AgentRunHistoryModal_default.event, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `${AgentRunHistoryModal_default.dot} ${dotClass(event, current)}`, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("time", { children: formatTime(event.at) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: event.title }),
            event.detail && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: event.detail })
          ] }, event.id);
        }) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: AgentRunHistoryModal_default.legacy, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "Detailed history is unavailable for this earlier run." }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
            "Recorded ",
            formatTime(action.createdAt),
            action.startedAt ? ` \xB7 started ${formatTime(action.startedAt)}` : "",
            action.completedAt ? ` \xB7 finished ${formatTime(action.completedAt)}` : "",
            "."
          ] })
        ] }),
        (action.workerJobId || action.error || action.proposalId) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("footer", { className: AgentRunHistoryModal_default.meta, children: [
          action.workerJobId && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
            "Worker job: ",
            action.workerJobId
          ] }),
          action.error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: AgentRunHistoryModal_default.error, children: action.error }),
          action.proposalId && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Link, { href: `/review/${encodeURIComponent(`proposal:${action.proposalId}`)}`, children: "Open proposal \u2192" })
        ] })
      ] })
    ] })
  ] });
}

// components/dashboard/StudyMeCard.tsx
var import_react2 = __toESM(require_react());
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function StudyMeCard({
  agentName,
  status,
  onStart
}) {
  const [starting, setStarting] = (0, import_react2.useState)(false);
  const running = status.state === "queued" || status.state === "running";
  const resumable = status.state === "paused" || status.state === "failed";
  const progress = Math.max(0, Math.min(100, status.progress ?? 0));
  const progressLabel = running && !status.currentDate ? "Working\u2026" : `${progress}% complete`;
  const stage = status.currentStage ? status.currentStage.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "your history";
  const statusMessage = status.statusMessage && (/^Gathering |^Reading Google Drive history|^Reading spreadsheet/.test(status.statusMessage) ? "Building your chronological history." : status.statusMessage);
  (0, import_react2.useEffect)(() => {
    if (running || status.state === "failed") setStarting(false);
  }, [running, status.state]);
  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    const accepted = await onStart();
    if (!accepted) setStarting(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: `${DashboardPage_default.assistantPrompt} ${DashboardPage_default.cardFull}`, style: { animationDelay: "0ms" }, "aria-live": "polite", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: DashboardPage_default.assistantPromptContent, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: DashboardPage_default.assistantPromptKicker, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
        " ",
        agentName,
        " assistant"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: DashboardPage_default.assistantPromptTitle, children: running ? `${agentName} is learning more about you` : `${agentName} would like to learn more about you!` }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: DashboardPage_default.assistantPromptCopy, children: running ? statusMessage || `Reviewing ${stage.toLowerCase()} to gather useful historical details.` : resumable ? "Your saved historical review is ready to resume when you are ready." : `Let ${agentName} review your past history to gather important historical details about you without having to rehash old news.` }),
      running && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: DashboardPage_default.assistantPromptMeta, children: [
        progressLabel,
        status.datesIndexed ? ` \xB7 ${status.datesIndexed} date${status.datesIndexed === 1 ? "" : "s"} indexed` : ""
      ] }),
      status.state === "failed" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: DashboardPage_default.assistantPromptMeta, children: "The review paused. You can resume it whenever you are ready." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: DashboardPage_default.assistantPromptActions, children: running ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: DashboardPage_default.pipelineStartRow, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { "aria-label": progressLabel, style: { width: 180, height: 6, borderRadius: 99, background: "var(--color-border)", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { width: `${progress}%`, height: "100%", borderRadius: 99, background: "var(--color-accent, currentColor)", transition: "width 300ms ease" } }) }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: DashboardPage_default.pipelineStartRow, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: DashboardPage_default.assistantPrimaryBtn, onClick: () => void handleStart(), disabled: starting, children: [
      starting && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: DashboardPage_default.studyMeSpinner, "aria-hidden": "true" }),
      starting ? "Starting\u2026" : resumable ? "Resume review" : "Study Me"
    ] }) }) })
  ] });
}

// components/dashboard/todayBrief.ts
async function fetchDailyQuote() {
  for (const path of ["/agent/briefing/quote", "/api/briefing/quote"]) {
    try {
      const response = await proxyFetch(path);
      if (!response.ok) continue;
      const data = await response.json();
      if (typeof data.quote === "string" && data.quote.trim()) return data.quote.trim();
    } catch {
    }
  }
  return null;
}
function buildTodayBriefing({
  tasks,
  events,
  openCount,
  taskCount,
  eventCount,
  unreadCount,
  quote
}) {
  const bullets = [
    ...events.map((event) => event.title.trim()).filter(Boolean),
    ...tasks.map((task) => task.title.trim()).filter(Boolean)
  ].slice(0, 3);
  while (bullets.length < 3) bullets.push("No additional priority returned");
  const lines = [
    quote?.trim() || `Today: ${openCount} open`,
    "",
    `${taskCount} Google task${taskCount === 1 ? "" : "s"} \xB7 ${eventCount} calendar event${eventCount === 1 ? "" : "s"} today \xB7 ${unreadCount} unread email${unreadCount === 1 ? "" : "s"}`,
    "",
    ...bullets.map((item) => `- ${item}`)
  ];
  return lines.join("\n");
}

// components/dashboard/DashboardPage.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
var localToday = () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
function BriefMarkdown({ content }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: DashboardPage_default.briefText, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    Markdown,
    {
      remarkPlugins: [remarkGfm],
      components: {
        p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { margin: "0 0 8px" }, children }),
        ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { style: { margin: "4px 0", paddingLeft: 18 }, children }),
        li: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("li", { style: { marginBottom: 2 }, children }),
        blockquote: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("blockquote", { style: { borderLeft: "3px solid var(--color-border)", paddingLeft: 10, color: "var(--color-text-muted)", fontStyle: "italic", margin: "0 0 12px" }, children }),
        strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { style: { color: "var(--color-text)" }, children })
      },
      children: content
    }
  ) });
}
function DashboardPage({ userName, userImage }) {
  const { name: agentName } = useAgentIdentity();
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const [tasks, setTasks] = (0, import_react3.useState)([]);
  const [tasksTotal, setTasksTotal] = (0, import_react3.useState)(0);
  const [openTotal, setOpenTotal] = (0, import_react3.useState)(0);
  const [eventsTotal, setEventsTotal] = (0, import_react3.useState)(0);
  const [unreadCount, setUnreadCount] = (0, import_react3.useState)(null);
  const [route, setRoute] = (0, import_react3.useState)(null);
  const [tripCounts, setTripCounts] = (0, import_react3.useState)(null);
  const [scheduledPlan, setScheduledPlan] = (0, import_react3.useState)(null);
  const [pipelineActions, setPipelineActions] = (0, import_react3.useState)([]);
  const [latestPipelineAction, setLatestPipelineAction] = (0, import_react3.useState)(null);
  const [runHistoryOpen, setRunHistoryOpen] = (0, import_react3.useState)(false);
  const [brief, setBrief] = (0, import_react3.useState)(null);
  const [briefLoading, setBriefLoading] = (0, import_react3.useState)(true);
  const [tasksLoading, setTasksLoading] = (0, import_react3.useState)(true);
  const [dashboardDataReady, setDashboardDataReady] = (0, import_react3.useState)(false);
  const [reviewLoaded, setReviewLoaded] = (0, import_react3.useState)(false);
  const [insightStatus, setInsightStatus] = (0, import_react3.useState)(null);
  const [insightLoaded, setInsightLoaded] = (0, import_react3.useState)(false);
  const scanPollRef = (0, import_react3.useRef)(null);
  const insightPollRef = (0, import_react3.useRef)(null);
  const insightPollGenerationRef = (0, import_react3.useRef)(0);
  const latestPipelineEvents = latestPipelineAction?.events ?? [];
  const latestPipelineEvent = latestPipelineEvents[latestPipelineEvents.length - 1];
  const latestPipelineStatus = latestPipelineEvent?.title ?? latestPipelineAction?.title;
  const latestPipelineDetail = latestPipelineEvent?.detail ?? latestPipelineAction?.error;
  const isPipelineRunning = latestPipelineAction?.status === "queued" || latestPipelineAction?.status === "running";
  const refreshScheduledActions = (0, import_react3.useCallback)(async () => {
    try {
      const response = await proxyFetch("/agent/scheduled-actions");
      const data = response.ok ? await response.json() : { actions: [] };
      const actions = data.actions ?? [];
      const active = actions.filter((action) => action.status === "approved" || action.status === "executing");
      setPipelineActions(active);
      setScheduledPlan(active[0] ?? null);
      setLatestPipelineAction((current) => current ?? actions[0] ?? null);
      return active;
    } catch {
      setScheduledPlan(null);
      return [];
    }
  }, []);
  const stopScanPolling = (0, import_react3.useCallback)(() => {
    if (scanPollRef.current) window.clearInterval(scanPollRef.current);
    scanPollRef.current = null;
  }, []);
  const pollScan = (0, import_react3.useCallback)((jobId) => {
    stopScanPolling();
    const update = async () => {
      try {
        const res = await proxyFetch(`/agent/proposals/scan/${jobId}`);
        if (!res.ok) {
          stopScanPolling();
          return;
        }
        const job = await res.json();
        setLatestPipelineAction(job);
        if (job.status !== "queued" && job.status !== "running") {
          stopScanPolling();
          void refreshScheduledActions();
        }
      } catch {
        stopScanPolling();
      }
    };
    scanPollRef.current = window.setInterval(() => {
      void update();
    }, 800);
    void update();
  }, [stopScanPolling, refreshScheduledActions]);
  (0, import_react3.useEffect)(() => () => stopScanPolling(), [stopScanPolling]);
  const stopInsightPolling = (0, import_react3.useCallback)(() => {
    insightPollGenerationRef.current += 1;
    if (insightPollRef.current) window.clearTimeout(insightPollRef.current);
    insightPollRef.current = null;
  }, []);
  const pollInsightGathering = (0, import_react3.useCallback)(() => {
    stopInsightPolling();
    const generation = insightPollGenerationRef.current;
    const update = async () => {
      if (generation !== insightPollGenerationRef.current) return;
      try {
        const response = await proxyFetch("/agent/insights/gather");
        if (!response.ok) {
          stopInsightPolling();
          return;
        }
        const next = await response.json();
        if (generation !== insightPollGenerationRef.current) return;
        setInsightStatus(next);
        if (next.state === "queued" || next.state === "running") {
          insightPollRef.current = window.setTimeout(() => {
            void update();
          }, 1e3);
        } else {
          stopInsightPolling();
        }
      } catch {
        stopInsightPolling();
      }
    };
    void update();
  }, [stopInsightPolling]);
  const requestInsightGathering = (0, import_react3.useCallback)(async () => {
    try {
      const response = await proxyFetch("/agent/insights/gather", { method: "POST" });
      if (!response.ok) return false;
      const next = await response.json();
      setInsightStatus(next);
      if (next.state === "queued" || next.state === "running") pollInsightGathering();
      return next.state === "queued" || next.state === "running";
    } catch {
      return false;
    }
  }, [pollInsightGathering]);
  const requestDashboardPipeline = (0, import_react3.useCallback)(async () => {
    try {
      const response = await proxyFetch("/agent/proposals/scan", { method: "POST" });
      if (!response.ok) return;
      const job = await response.json();
      setLatestPipelineAction(job);
      pollScan(job.id);
    } catch {
    }
  }, [pollScan]);
  const handleReviewLoaded = (0, import_react3.useCallback)(() => setReviewLoaded(true), []);
  (0, import_react3.useEffect)(() => {
    let mounted = true;
    async function loadInsightStatus() {
      try {
        const response = await proxyFetch("/agent/insights/gather/login-status");
        if (mounted && response.ok) {
          const next = await response.json();
          setInsightStatus(next);
          if (next.state === "queued" || next.state === "running") pollInsightGathering();
        }
      } catch {
      } finally {
        if (mounted) setInsightLoaded(true);
      }
    }
    void loadInsightStatus();
    return () => {
      mounted = false;
      stopInsightPolling();
    };
  }, [pollInsightGathering, stopInsightPolling]);
  (0, import_react3.useEffect)(() => {
    const today2 = (/* @__PURE__ */ new Date()).toDateString();
    async function loadTasks() {
      const [googleTasksRes, calendarRes, inboxRes] = await Promise.all([
        proxyFetch("/agent/google/tasks"),
        // Without `from`, the backend's "today" defaults to the server's UTC
        // date — wrong on either side of midnight UTC for any user not on
        // UTC. Always anchor it to the user's own local date.
        proxyFetch(`/agent/calendars?days=1&from=${localToday()}`),
        proxyFetch("/agent/inbox/count")
      ]);
      const googleTasks = googleTasksRes.ok ? (await googleTasksRes.json()).tasks ?? [] : [];
      const calendarData = calendarRes.ok ? await calendarRes.json() : { calendars: [] };
      const inboxData = inboxRes.ok ? await inboxRes.json() : {};
      const todayDate = (/* @__PURE__ */ new Date()).toDateString();
      const eventCount = (calendarData.calendars ?? []).reduce((total, calendar) => total + (calendar.events ?? []).filter((event) => event.start && new Date(event.start).toDateString() === todayDate).length, 0);
      setEventsTotal(eventCount);
      setUnreadCount(inboxData.unread ?? 0);
      const namedPriorityToNumber = (p) => p === "ASAP" ? 1 : p === "HIGH" ? 2 : p === "LOW" ? 4 : 3;
      const SOON_DAYS = 3;
      const todayMidnight = /* @__PURE__ */ new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const soonCutoff = new Date(todayMidnight);
      soonCutoff.setDate(soonCutoff.getDate() + SOON_DAYS);
      soonCutoff.setHours(23, 59, 59, 999);
      const localTaskDate = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr);
        if (Number.isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      };
      const dateUrgencyTier = (dateStr) => {
        const d = localTaskDate(dateStr);
        if (!d) return null;
        if (d.getTime() < todayMidnight.getTime()) return 0;
        if (d.getTime() === todayMidnight.getTime()) return 1;
        if (d.getTime() <= soonCutoff.getTime()) return 2;
        return null;
      };
      const todayTaskCount = googleTasks.filter((task) => {
        const tier = dateUrgencyTier(task.dueDate);
        return tier === 0 || tier === 1;
      }).length;
      setTasksTotal(todayTaskCount);
      setOpenTotal(todayTaskCount + eventCount + (inboxData.unread ?? 0));
      const urgentTasks = [
        ...googleTasks.map((t) => ({ t, tier: dateUrgencyTier(t.dueDate) })).filter((x) => x.tier !== null).map(({ t, tier }) => ({ title: t.title, priority: namedPriorityToNumber(t.priority), source: "google", tier }))
      ];
      const top3Urgent = urgentTasks.sort((a, b) => a.tier - b.tier || a.priority - b.priority).slice(0, 3).map(({ title, priority, source }) => ({ title, priority, source }));
      setTasks(top3Urgent);
      setTasksLoading(false);
      const briefEvents = (calendarData.calendars ?? []).flatMap((calendarItem) => (calendarItem.events ?? []).filter((event) => event.start && new Date(event.start).toDateString() === todayDate).map((event) => ({ title: event.title ?? "Calendar event" })));
      return {
        briefTasks: top3Urgent,
        briefEvents,
        openCount: todayTaskCount + eventCount + (inboxData.unread ?? 0),
        taskCount: todayTaskCount,
        eventCount,
        unreadCount: inboxData.unread ?? 0
      };
    }
    async function loadRoute() {
      try {
        const searches = await idbListSearches();
        if (searches.length > 0) {
          const s = searches[0];
          setRoute({ origin: s.origin, destination: s.destination, date: s.date });
        }
      } catch {
      }
    }
    async function loadTripCounts() {
      try {
        const response = await proxyFetch("/agent/trips");
        if (!response.ok) return;
        const data = await response.json();
        setTripCounts({
          past: data.groups?.past?.length ?? 0,
          current: data.groups?.current?.length ?? 0,
          upcoming: data.groups?.upcoming?.length ?? 0
        });
      } catch {
      }
    }
    async function init() {
      try {
        const [{ briefTasks, briefEvents, openCount, taskCount, eventCount, unreadCount: unreadCount2 }, , , , quote] = await Promise.all([
          loadTasks(),
          loadRoute(),
          loadTripCounts(),
          refreshScheduledActions(),
          fetchDailyQuote()
        ]);
        setBrief(buildTodayBriefing({
          tasks: briefTasks,
          events: briefEvents,
          openCount,
          taskCount,
          eventCount,
          unreadCount: unreadCount2,
          quote
        }));
        setBriefLoading(false);
      } catch {
        setTasksLoading(false);
        setBriefLoading(false);
      } finally {
        setDashboardDataReady(true);
      }
    }
    init();
  }, [refreshScheduledActions]);
  const today = (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" });
  const showAssistantPrompt = dashboardDataReady && reviewLoaded && !tasksLoading && !briefLoading && insightLoaded && insightStatus !== null;
  const showStudyMe = showAssistantPrompt && insightStatus !== null && insightStatus.state !== "completed";
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.shell, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(AppHeader, { userImage, userName, initials, pageTitle: today }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("main", { className: DashboardPage_default.grid, children: [
      showStudyMe ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(StudyMeCard, { agentName, status: insightStatus, onStart: requestInsightGathering }) : showAssistantPrompt && (latestPipelineAction ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: `${DashboardPage_default.assistantPrompt} ${DashboardPage_default.cardFull}`, style: { animationDelay: "0ms" }, "aria-live": "polite", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.assistantPromptContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: DashboardPage_default.assistantPromptKicker, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
            " ",
            agentName,
            " assistant"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: DashboardPage_default.assistantPromptTitle, children: isPipelineRunning ? "Reviewing your workspace" : latestPipelineAction.status === "completed" ? "Your workspace review is ready" : "Something needs your attention" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.assistantPromptCopy, children: isPipelineRunning ? "Your assistant is looking for useful next actions. You can keep working while it finishes." : latestPipelineStatus || "Your assistant prepared an item for you to review." }),
          latestPipelineDetail && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.assistantPromptMeta, children: latestPipelineDetail }),
          latestPipelineAction.status === "failed" && !latestPipelineDetail && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.assistantPromptMeta, children: "The scan did not finish. You can try again whenever you are ready." }),
          pipelineActions.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: DashboardPage_default.assistantPromptMeta, children: [
            "+",
            pipelineActions.length - 1,
            " more action",
            pipelineActions.length === 2 ? "" : "s",
            " in progress"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: DashboardPage_default.assistantPromptActions, children: isPipelineRunning ? (
          // The pulsing dot already says "a scan is running" — a second,
          // merely-disabled "Run new scan" button next to it was
          // redundant and read as broken. Nothing to click while one
          // is already in flight, so only "Show details" and the dot
          // render here, side by side.
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.pipelineRunningRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: DashboardPage_default.showDetailsLink, onClick: () => setRunHistoryOpen(true), children: "Show details" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: `${DashboardPage_default.pipelineStatusDot} ${DashboardPage_default.pipelinePulse}`, "aria-label": "Scan in progress" })
          ] })
        ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: DashboardPage_default.assistantPrimaryBtn, onClick: () => setRunHistoryOpen(true), children: "Review details" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: DashboardPage_default.assistantSecondaryBtn, onClick: () => void requestDashboardPipeline(), children: "Run new scan" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.assistantPromptTrust, children: "Nothing is changed without your approval." })
        ] }) })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: `${DashboardPage_default.assistantPrompt} ${DashboardPage_default.cardFull}`, style: { animationDelay: "0ms" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.assistantPromptContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: DashboardPage_default.assistantPromptKicker, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
            " ",
            agentName,
            " assistant"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: DashboardPage_default.assistantPromptTitle, children: "Ready to review your workspace." }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.assistantPromptCopy, children: "Scan for useful next actions and prepare suggestions for you to review." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.assistantPromptActions, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: DashboardPage_default.pipelineStartRow, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: DashboardPage_default.assistantPrimaryBtn, onClick: () => void requestDashboardPipeline(), children: "Start workspace scan" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.assistantPromptTrust, children: "Nothing is changed without your approval." })
        ] })
      ] })),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `${DashboardPage_default.card} ${DashboardPage_default.cardFull} ${DashboardPage_default.cardBrief}`, style: { animationDelay: "80ms" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.cardHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.cardTitle, children: "Today's Brief" }),
          brief && !briefLoading && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ReadAloudButton, { text: brief, style: { background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, display: "flex", alignItems: "center", marginLeft: "auto" } })
        ] }),
        briefLoading ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: DashboardPage_default.skeleton }) : brief ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(BriefMarkdown, { content: brief }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.briefText, children: "No briefing available." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Link, { href: "/today", className: `${DashboardPage_default.card} ${DashboardPage_default.cardHalf} ${DashboardPage_default.outcomeToday}`, style: { animationDelay: "60ms" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.cardHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.cardTitle, children: "Today" }),
          openTotal > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: DashboardPage_default.badge, children: [
            openTotal,
            " open"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.cardArrow, children: "\u2192" })
        ] }),
        tasksLoading ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: DashboardPage_default.skeleton }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: DashboardPage_default.outcomeMetric, children: [
            tasksTotal,
            " Google task",
            tasksTotal === 1 ? "" : "s"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.outcomeDescription, children: "Overdue or due today, from your connected Google Tasks account." }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: DashboardPage_default.outcomeDescription, children: [
            eventsTotal,
            " calendar event",
            eventsTotal === 1 ? "" : "s",
            " today \xB7 ",
            unreadCount ?? 0,
            " unread email",
            unreadCount === 1 ? "" : "s"
          ] }),
          tasks.slice(0, 3).map((task, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.taskRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.checkbox }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.taskTitle, children: task.title }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: `${DashboardPage_default.priorityDot} ${task.priority <= 1 ? DashboardPage_default.priorityAsap : task.priority <= 2 ? DashboardPage_default.priorityHigh : task.priority <= 3 ? DashboardPage_default.priorityMed : DashboardPage_default.priorityLow}` })
          ] }, index)),
          tasks.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.emptyText, children: "No Google Tasks need your attention." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ReviewDashboardCard, { className: DashboardPage_default.outcomeReview, style: { animationDelay: "120ms" }, onLoaded: handleReviewLoaded }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Link, { href: "/trips", className: `${DashboardPage_default.card} ${DashboardPage_default.cardHalf} ${DashboardPage_default.outcomePlan}`, style: { animationDelay: "180ms" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.cardHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.cardTitle, children: "Travel planning" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.cardArrow, children: "\u2192" })
        ] }),
        tripCounts ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.outcomeMetric, children: "Your trip library" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.tripCounts, "aria-label": "Saved trip counts", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: tripCounts.past }),
              " Past"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: tripCounts.current }),
              " Current"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: tripCounts.upcoming }),
              " Upcoming"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.outcomeFooter, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
              tripCounts.past + tripCounts.current + tripCounts.upcoming,
              " saved trip",
              tripCounts.past + tripCounts.current + tripCounts.upcoming === 1 ? "" : "s"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: "Open library" })
          ] })
        ] }) : scheduledPlan && scheduledPlan.type === "trip_plan" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.outcomeMetric, children: scheduledPlan.title }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.outcomeDescription, children: scheduledPlan.status === "queued" ? "Queued in Scheduled Actions. The agent will start it shortly." : "The agent is working from your approved proposal." }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.outcomeFooter, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: scheduledPlan.status === "queued" ? "Queued" : "In progress" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: "Active" })
          ] })
        ] }) : route ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.outcomeMetric, children: route.destination }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.outcomeDescription, children: "Your saved route and next planning decisions." }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.routeRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.routeOrigin, children: route.origin }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.routeArrow, children: "\u2192" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.routeDest, children: route.destination }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: DashboardPage_default.routeMeta, children: route.date })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: DashboardPage_default.outcomeFooter, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Saved plan" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: "Continue" })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.outcomeMetric, children: "No active trip" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: DashboardPage_default.outcomeDescription, children: "When the agent has trip context, it will prepare a planning proposal here for your approval." }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: DashboardPage_default.outcomeFooter, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Nothing booked" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: DashboardPage_default.talkBar, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", onClick: () => window.dispatchEvent(new CustomEvent("open-agent-assistant")), children: [
      "\u25C9 Talk or Type to ",
      agentName
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(AgentRunHistoryModal, { open: runHistoryOpen, action: latestPipelineAction, onClose: () => setRunHistoryOpen(false) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/index.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
async function mount() {
  const response = await proxyFetch("/auth/me");
  if (!response.ok) {
    redirectToLogin();
    return;
  }
  const user = await response.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime5.jsx)(DashboardPage, { userName: user.name ?? "", userImage: user.picture ?? "" }));
}
void mount();
