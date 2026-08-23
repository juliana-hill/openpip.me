import {
  TrippyIcon
} from "./chunk-BUQHLX74.js";
import {
  Skeleton_default
} from "./chunk-WNLM7UWS.js";
import {
  Dialog_default
} from "./chunk-VGRKXESR.js";
import {
  PageShell
} from "./chunk-5ENZFSWS.js";
import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  FloatingAssistant,
  ReadAloudButton,
  idbAddNotification,
  idbClearPersistedActiveTask,
  idbDeleteTaskSchedule,
  idbGetAllTaskSchedules,
  idbGetPersistedActiveTask,
  idbGetTaskSchedule,
  idbGetUserPrefs,
  idbSaveTaskElapsed,
  idbSetPersistedActiveTask,
  idbSetUserPrefs,
  postToSW,
  pushTasksBackup,
  pushUserData
} from "./chunk-KMANJ7L3.js";
import {
  AppHeader,
  Markdown,
  remarkGfm
} from "./chunk-EYLK6625.js";
import "./chunk-OHWNV7E6.js";
import {
  CalendarDays,
  Check,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Pause,
  Play,
  SquareCheckBig,
  Video,
  X,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-EEKIOSJK.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/tasks.tsx
var import_client = __toESM(require_client());

// components/tasks/TasksDashboard.tsx
var import_react4 = __toESM(require_react());

// components/tasks/DailyBriefingCard.module.css
var DailyBriefingCard_default = {
  card: "DailyBriefingCard_card",
  accentBar: "DailyBriefingCard_accentBar",
  header: "DailyBriefingCard_header",
  title: "DailyBriefingCard_title",
  subtitle: "DailyBriefingCard_subtitle",
  skeletons: "DailyBriefingCard_skeletons",
  skeleton: "DailyBriefingCard_skeleton",
  shimmer: "DailyBriefingCard_shimmer",
  body: "DailyBriefingCard_body",
  mdP: "DailyBriefingCard_mdP",
  mdUl: "DailyBriefingCard_mdUl",
  mdLi: "DailyBriefingCard_mdLi",
  mdBlockquote: "DailyBriefingCard_mdBlockquote",
  empty: "DailyBriefingCard_empty"
};

// components/tasks/DailyBriefingCard.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function DailyBriefingCard({ briefing, loading, generatedAt }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: DailyBriefingCard_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: DailyBriefingCard_default.accentBar }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: DailyBriefingCard_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrippyIcon, { size: 40 }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: DailyBriefingCard_default.title, children: "Daily Briefing" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: DailyBriefingCard_default.subtitle, children: loading ? "Generating briefing\u2026" : generatedAt ? `Generated ${generatedAt}` : "" })
      ] }),
      briefing && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadAloudButton, { text: briefing ?? "", style: { background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, display: "flex", alignItems: "center" }, iconSize: 16 })
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: DailyBriefingCard_default.skeletons, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: DailyBriefingCard_default.skeleton, style: { width: "100%" } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: DailyBriefingCard_default.skeleton, style: { width: "85%" } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: DailyBriefingCard_default.skeleton, style: { width: "70%" } })
    ] }) : briefing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: DailyBriefingCard_default.body, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      Markdown,
      {
        remarkPlugins: [remarkGfm],
        components: {
          p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: DailyBriefingCard_default.mdP, children }),
          ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: DailyBriefingCard_default.mdUl, children }),
          li: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { className: DailyBriefingCard_default.mdLi, children }),
          blockquote: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", { className: DailyBriefingCard_default.mdBlockquote, children }),
          strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { color: "var(--color-text)", fontWeight: 700 }, children })
        },
        children: briefing
      }
    ) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: DailyBriefingCard_default.empty, children: "No briefing available yet." })
  ] });
}

// components/tasks/TodayAtAGlanceCard.module.css
var TodayAtAGlanceCard_default = {
  card: "TodayAtAGlanceCard_card",
  body: "TodayAtAGlanceCard_body",
  sectionLabel: "TodayAtAGlanceCard_sectionLabel",
  statRow: "TodayAtAGlanceCard_statRow",
  statNumber: "TodayAtAGlanceCard_statNumber",
  statLabel: "TodayAtAGlanceCard_statLabel",
  footer: "TodayAtAGlanceCard_footer",
  completionHeader: "TodayAtAGlanceCard_completionHeader",
  completionPct: "TodayAtAGlanceCard_completionPct",
  progressTrack: "TodayAtAGlanceCard_progressTrack",
  progressFill: "TodayAtAGlanceCard_progressFill"
};

// components/tasks/TodayAtAGlanceCard.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
function TodayAtAGlanceCard({ totalEvents, tasksRemaining, completedCount, completionScope }) {
  const total = tasksRemaining + completedCount;
  const completionPct = total > 0 ? Math.round(completedCount / total * 100) : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TodayAtAGlanceCard_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TodayAtAGlanceCard_default.body, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: TodayAtAGlanceCard_default.sectionLabel, children: "Today" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TodayAtAGlanceCard_default.statRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CalendarDays, { size: 20, color: "var(--color-accent)", style: { flexShrink: 0 } }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: TodayAtAGlanceCard_default.statNumber, children: totalEvents }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: TodayAtAGlanceCard_default.statLabel, children: [
            "event",
            totalEvents !== 1 ? "s" : "",
            " scheduled"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TodayAtAGlanceCard_default.statRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SquareCheckBig, { size: 20, color: "#f59e0b", style: { flexShrink: 0 } }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: TodayAtAGlanceCard_default.statNumber, children: tasksRemaining }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: TodayAtAGlanceCard_default.statLabel, children: [
            "task",
            tasksRemaining !== 1 ? "s" : "",
            " remaining"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TodayAtAGlanceCard_default.footer, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TodayAtAGlanceCard_default.completionHeader, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: TodayAtAGlanceCard_default.sectionLabel, children: [
          "Completion (",
          completionScope,
          ")"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: TodayAtAGlanceCard_default.completionPct, children: [
          completionPct,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TodayAtAGlanceCard_default.progressTrack, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TodayAtAGlanceCard_default.progressFill, style: { width: `${completionPct}%` } }) })
    ] })
  ] });
}

// components/tasks/ActiveTaskCard.tsx
var import_react = __toESM(require_react());

// components/tasks/SourceBadge.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
var SOURCE_STYLES = {
  "google": { background: "color-mix(in srgb, #34d399 15%, var(--color-bg))", color: "#34d399" }
};
var SOURCE_LABELS = {
  "google": "Google"
};
function SourceBadge({ source }) {
  const s = SOURCE_STYLES[source];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { ...s, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }, children: SOURCE_LABELS[source] });
}

// components/tasks/PriorityBadge.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
var PRIORITY_STYLES = {
  ASAP: { background: "color-mix(in srgb, #f87171 15%, var(--color-bg))", color: "#f87171" },
  HIGH: { background: "color-mix(in srgb, #fbbf24 15%, var(--color-bg))", color: "#fbbf24" },
  MEDIUM: { background: "var(--color-accent-light)", color: "var(--color-accent)" },
  LOW: { background: "var(--color-border)", color: "var(--color-text-muted)" }
};
function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLES[priority];
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { ...s, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 4 }, children: priority });
}

// components/tasks/ActiveTaskCard.module.css
var ActiveTaskCard_default = {
  card: "ActiveTaskCard_card",
  accentLine: "ActiveTaskCard_accentLine",
  body: "ActiveTaskCard_body",
  pauseBtn: "ActiveTaskCard_pauseBtn",
  info: "ActiveTaskCard_info",
  infoRow: "ActiveTaskCard_infoRow",
  infoLeft: "ActiveTaskCard_infoLeft",
  label: "ActiveTaskCard_label",
  title: "ActiveTaskCard_title",
  badges: "ActiveTaskCard_badges",
  timerRow: "ActiveTaskCard_timerRow",
  timer: "ActiveTaskCard_timer",
  timerPaused: "ActiveTaskCard_timerPaused",
  unflagBtn: "ActiveTaskCard_unflagBtn",
  flowSection: "ActiveTaskCard_flowSection",
  flowHeader: "ActiveTaskCard_flowHeader",
  flowLabel: "ActiveTaskCard_flowLabel",
  flowValue: "ActiveTaskCard_flowValue",
  flowNumber: "ActiveTaskCard_flowNumber",
  flowDenom: "ActiveTaskCard_flowDenom",
  flowTrack: "ActiveTaskCard_flowTrack",
  flowBar: "ActiveTaskCard_flowBar"
};

// components/tasks/ActiveTaskCard.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1e3);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds % 3600 / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
var ActiveTaskCard = (0, import_react.forwardRef)(function ActiveTaskCard2({ activeTask, onUnflag, onPause, onResume }, ref) {
  const [isPaused, setIsPaused] = (0, import_react.useState)(false);
  const baseElapsedRef = (0, import_react.useRef)(activeTask.baseElapsedMs);
  const resumedAtRef = (0, import_react.useRef)(activeTask.startedAt);
  const [elapsed, setElapsed] = (0, import_react.useState)(activeTask.baseElapsedMs + (Date.now() - activeTask.startedAt));
  (0, import_react.useEffect)(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setElapsed(baseElapsedRef.current + (Date.now() - resumedAtRef.current));
    }, 1e3);
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { ref, className: ActiveTaskCard_default.card, style: { gridColumn: "span 12" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: ActiveTaskCard_default.accentLine }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: ActiveTaskCard_default.body, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          type: "button",
          "aria-label": isPaused ? "Resume timer" : "Pause timer",
          onClick: handlePauseResume,
          className: ActiveTaskCard_default.pauseBtn,
          children: isPaused ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Play, { size: 20 }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Pause, { size: 20 })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: ActiveTaskCard_default.info, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: ActiveTaskCard_default.infoRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: ActiveTaskCard_default.infoLeft, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: ActiveTaskCard_default.label, children: "Currently Working On" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: ActiveTaskCard_default.title, children: task.title }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: ActiveTaskCard_default.badges, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SourceBadge, { source: task.source }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PriorityBadge, { priority: task.priority })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: ActiveTaskCard_default.timerRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: `${ActiveTaskCard_default.timer} ${isPaused ? ActiveTaskCard_default.timerPaused : ""}`, children: formatElapsed(elapsed) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              type: "button",
              "aria-label": "Unflag task",
              onClick: () => {
                const finalElapsed = baseElapsedRef.current + (isPaused ? 0 : Date.now() - resumedAtRef.current);
                onUnflag(finalElapsed);
              },
              className: ActiveTaskCard_default.unflagBtn,
              children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(X, { size: 16 })
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: ActiveTaskCard_default.flowSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: ActiveTaskCard_default.flowHeader, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: ActiveTaskCard_default.flowLabel, children: "Flow Rate" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: ActiveTaskCard_default.flowValue, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: ActiveTaskCard_default.flowNumber, children: flowRate }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: ActiveTaskCard_default.flowDenom, children: " /100" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: ActiveTaskCard_default.flowTrack, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: ActiveTaskCard_default.flowBar, style: { width: `${flowRate}%` } }) })
    ] })
  ] });
});

// components/tasks/TaskRow.tsx
var import_react2 = __toESM(require_react());
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
function TaskRow({ task, isActive, onFlag, onComplete }) {
  const [open, setOpen] = (0, import_react2.useState)(false);
  const [completing, setCompleting] = (0, import_react2.useState)(false);
  const [detail, setDetail] = (0, import_react2.useState)(null);
  const [detailLoading, setDetailLoading] = (0, import_react2.useState)(false);
  const handleComplete = async (event) => {
    event.stopPropagation();
    setCompleting(true);
    try {
      await onComplete(task.id);
    } finally {
      setCompleting(false);
    }
  };
  const handleOpen = async () => {
    setOpen(true);
    if (detail || !task.listId) return;
    setDetailLoading(true);
    try {
      const response = await proxyFetch(`/agent/notebook/pages/${task.listId}/tasks/${task.id}`);
      if (response.ok) setDetail(await response.json());
    } catch {
    } finally {
      setDetailLoading(false);
    }
  };
  const durationMinutes = task.scheduledStartTime && task.scheduledEndTime ? Math.max(0, Number(task.scheduledEndTime.slice(0, 2)) * 60 + Number(task.scheduledEndTime.slice(3, 5)) - (Number(task.scheduledStartTime.slice(0, 2)) * 60 + Number(task.scheduledStartTime.slice(3, 5)))) : task.duration ?? null;
  const durationLabel = durationMinutes ? durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ""}` : `${durationMinutes}m` : null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "div",
      {
        style: { background: "color-mix(in srgb, var(--color-surface) 40%, transparent)", borderRadius: "var(--radius-lg)", border: "1px solid transparent", cursor: "pointer", opacity: isActive ? 0.6 : 1 },
        onClick: () => void handleOpen(),
        onMouseEnter: (event) => {
          if (!isActive) {
            event.currentTarget.style.background = "color-mix(in srgb, var(--color-border) 40%, transparent)";
            event.currentTarget.style.borderColor = "var(--color-border)";
          }
        },
        onMouseLeave: (event) => {
          event.currentTarget.style.background = "color-mix(in srgb, var(--color-surface) 40%, transparent)";
          event.currentTarget.style.borderColor = "transparent";
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { padding: "12px", display: "flex", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-label": "Mark Google task complete", onClick: handleComplete, disabled: completing, style: { width: 24, height: 24, borderRadius: "var(--radius-sm)", border: "2px solid var(--color-border)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: completing ? "not-allowed" : "pointer", opacity: completing ? 0.5 : 1 }, children: completing ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(LoaderCircle, { size: 12, style: { animation: "spin 0.6s linear infinite" } }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Check, { size: 12, style: { color: "var(--color-text-muted)" } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SourceBadge, { source: "google" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: task.title }),
              isActive && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "#fb7185", flexShrink: 0, animation: "pulse 2s infinite" } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }, children: [
              durationLabel && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: "var(--radius-pill)", background: "var(--color-border)", color: "var(--color-text-muted)" }, children: durationLabel }),
              task.labels?.map((label) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: "var(--radius-pill)", background: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }, children: label }, label))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PriorityBadge, { priority: task.priority }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-label": "Flag as active", onClick: (event) => {
              event.stopPropagation();
              onFlag(task);
            }, style: { color: "var(--color-text-muted)", background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Play, { size: 16 }) })
          ] })
        ] })
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: Dialog_default.overlay, onClick: () => setOpen(false) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: Dialog_default.content, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: Dialog_default.closeBtn, onClick: () => setOpen(false), "aria-label": "Close", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(X, { size: 16 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: Dialog_default.header, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: Dialog_default.title, children: task.title }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SourceBadge, { source: "google" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PriorityBadge, { priority: task.priority })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { overflowY: "auto", flex: 1, minHeight: 0 }, children: detailLoading ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", padding: "8px 0" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(LoaderCircle, { size: 14, style: { animation: "spin 0.6s linear infinite" } }),
          "Loading details\u2026"
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 10, fontSize: "var(--font-size-sm)" }, children: [
          task.dueDate && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { color: "var(--color-text-muted)" }, children: "Due " }),
            new Date(task.dueDate).toLocaleDateString()
          ] }),
          detail?.description && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Markdown, { remarkPlugins: [remarkGfm], children: detail.description }),
          detail?.comments?.map((comment) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { borderLeft: "2px solid var(--color-border)", paddingLeft: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("b", { children: comment.author }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: comment.body })
          ] }, comment.id)),
          detail?.url && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("a", { href: detail.url, target: "_blank", rel: "noopener noreferrer", style: { color: "var(--color-accent)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }, children: [
            "Open in Google Tasks ",
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ExternalLink, { size: 12 })
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: Dialog_default.footer, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: () => setOpen(false), children: "Close" }) })
      ] })
    ] })
  ] });
}

// components/tasks/CalendarEventRow.tsx
var import_react3 = __toESM(require_react());
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
function formatTime(iso) {
  if (iso.length === 10) return "All day";
  return new Date(iso).toLocaleTimeString(void 0, {
    hour: "numeric",
    minute: "2-digit"
  });
}
function formatRange(start, end) {
  if (start.length === 10) return "All day";
  return `${formatTime(start)} \u2013 ${formatTime(end)}`;
}
function CalendarEventRow({ event }) {
  const [open, setOpen] = (0, import_react3.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        style: {
          background: "color-mix(in srgb, var(--color-border) 30%, transparent)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderLeft: "4px solid rgba(37, 99, 235, 0.3)",
          cursor: "pointer",
          transition: "background 150ms ease"
        },
        onClick: () => setOpen(true),
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "color-mix(in srgb, var(--color-border) 50%, transparent)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "color-mix(in srgb, var(--color-border) 30%, transparent)";
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: {
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
            fontVariantNumeric: "tabular-nums",
            width: "64px",
            flexShrink: 0
          }, children: formatTime(event.start) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: {
              fontSize: "var(--font-size-sm)",
              fontWeight: 500,
              color: "var(--color-text)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }, children: event.title }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: {
              fontSize: "var(--font-size-xs)",
              color: "color-mix(in srgb, var(--color-text-muted) 60%, transparent)",
              margin: "2px 0 0 0"
            }, children: event.calendarName })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CalendarDays, { size: 16, style: { color: "color-mix(in srgb, var(--color-text-muted) 40%, transparent)", flexShrink: 0 } })
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: Dialog_default.overlay, onClick: () => setOpen(false) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: Dialog_default.content, style: { maxWidth: 500 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: Dialog_default.closeBtn, onClick: () => setOpen(false), "aria-label": "Close", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(X, { size: 16 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: Dialog_default.header, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { className: Dialog_default.title, children: event.title }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: Dialog_default.description, children: formatRange(event.start, event.end) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { overflowY: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }, children: [
          event.meetLink && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
            "a",
            {
              href: event.meetLink,
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "var(--font-size-sm)",
                fontWeight: 500,
                color: "#3b82f6",
                textDecoration: "none"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Video, { size: 16 }),
                "Join Google Meet"
              ]
            }
          ),
          event.location && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(MapPin, { size: 16, style: { marginTop: "2px", flexShrink: 0 } }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: event.location })
          ] }),
          event.description && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }, children: event.description }),
          !event.meetLink && !event.location && !event.description && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }, children: "No additional details." })
        ] })
      ] })
    ] })
  ] });
}

// components/tasks/TaskList.module.css
var TaskList_default = {
  sectionAsap: "TaskList_sectionAsap",
  sectionToday: "TaskList_sectionToday",
  sectionTomorrow: "TaskList_sectionTomorrow"
};

// components/tasks/TaskList.tsx
var import_jsx_runtime8 = __toESM(require_jsx_runtime());
function SectionBlock({ section, activeTask, onFlag, onComplete }) {
  const isAsap = section.label === "ASAP (Unscheduled)";
  const isToday = section.label === "Today";
  const isTomorrow = section.label === "Tomorrow";
  const cls = [
    isAsap ? TaskList_default.sectionAsap : "",
    isToday ? TaskList_default.sectionToday : "",
    isTomorrow ? TaskList_default.sectionTomorrow : ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: cls, style: { borderRadius: "var(--radius-lg)", paddingLeft: 12, paddingRight: 12, paddingBottom: 12 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: {
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "var(--color-text-muted)",
      marginBottom: "16px",
      padding: "12px 8px 0 8px"
    }, children: section.label }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: section.items.map((item, i) => item.kind === "event" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { animationDuration: "300ms", animationDelay: `${i * 40}ms` }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(CalendarEventRow, { event: item.data }) }, `event-${item.data.id}`) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { animationDuration: "300ms", animationDelay: `${i * 40}ms` }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      TaskRow,
      {
        task: item.data,
        isActive: activeTask?.task.id === item.data.id,
        onFlag,
        onComplete
      }
    ) }, `task-${item.data.id}`)) })
  ] });
}
function TaskList({ sections, loading, activeTask, onFlag, onComplete }) {
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { gridColumn: "span 12", width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: "12px" }, children: [1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: Skeleton_default.skeleton, style: { height: "64px", borderRadius: "var(--radius-lg)" } }, i)) });
  }
  if (sections.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { gridColumn: "span 12", width: "100%", minWidth: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", textAlign: "center", padding: "64px 0" }, children: "You're all caught up. Enjoy the space." }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { gridColumn: "span 12", width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }, children: sections.map((section) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SectionBlock, { section, activeTask, onFlag, onComplete }, section.label)) });
}

// components/tasks/TasksDashboard.module.css
var TasksDashboard_default = {
  grid: "TasksDashboard_grid"
};

// components/tasks/TasksDashboard.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime());
var PRIORITY_ORDER = { ASAP: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
function computeFlowRate(task) {
  const base = { ASAP: 85, HIGH: 70, MEDIUM: 55, LOW: 40 };
  const jitter = Math.floor(Math.random() * 20) - 10;
  return Math.max(0, Math.min(100, base[task.priority] + jitter));
}
function toTaskStartMs(task) {
  if (task.scheduledFor) {
    const dateTime = task.scheduledStartTime ? `${task.scheduledFor}T${task.scheduledStartTime}:00` : `${task.scheduledFor}T00:00:00`;
    return new Date(dateTime).getTime();
  }
  const raw = task.scheduledStart ?? task.dueDate;
  return raw ? new Date(raw).getTime() : Infinity;
}
function getDayBucket(task, today, tomorrow) {
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
function groupItems(tasks, events) {
  const now = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const localDate = (d2) => `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-${pad(d2.getDate())}`;
  const today = localDate(now);
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  const tomorrow = localDate(d);
  const remoteTasks = tasks;
  const byBucket = (bucket) => remoteTasks.filter((t) => getDayBucket(t, today, tomorrow) === bucket);
  const sortByPriority = (a, b) => {
    const pa = PRIORITY_ORDER[a.priority];
    const pb = PRIORITY_ORDER[b.priority];
    if (pa !== pb) return pa - pb;
    return toTaskStartMs(a) - toTaskStartMs(b);
  };
  const toItem = (t) => ({ kind: "task", data: t });
  const eventDate = (start) => start.length === 10 ? start : localDate(new Date(start));
  const toUnifiedStartMs = (item) => {
    if (item.kind === "event") return new Date(item.data.start).getTime();
    const t = item.data;
    if (t.scheduledStartTime && t.scheduledFor)
      return (/* @__PURE__ */ new Date(`${t.scheduledFor}T${t.scheduledStartTime}:00`)).getTime();
    if (t.scheduledStart) return new Date(t.scheduledStart).getTime();
    return Infinity;
  };
  const sortByTime = (a, b) => toUnifiedStartMs(a) - toUnifiedStartMs(b);
  const buildTimeBucket = (bucketName, bucketDate) => {
    const bucketTasks = remoteTasks.filter((t) => getDayBucket(t, today, tomorrow) === bucketName);
    const timedTasks = bucketTasks.filter((t) => !!t.scheduledStartTime).map(toItem);
    const untimedTasks = bucketTasks.filter((t) => !t.scheduledStartTime).sort(sortByPriority).map(toItem);
    const bucketEvents = events.filter((e) => eventDate(e.start) === bucketDate).map((e) => ({ kind: "event", data: e }));
    return [...[...timedTasks, ...bucketEvents].sort(sortByTime), ...untimedTasks];
  };
  const todayItems = buildTimeBucket("today", today);
  const tomorrowItems = buildTimeBucket("tomorrow", tomorrow);
  const laterItems = byBucket("later").sort(sortByPriority).map(toItem);
  const allUnscheduled = byBucket("unscheduled").sort(sortByPriority);
  const asapUnscheduledItems = allUnscheduled.filter((t) => t.priority === "ASAP").slice(0, 3).map(toItem);
  const remainingAsap = allUnscheduled.filter((t) => t.priority === "ASAP").slice(3).map(toItem);
  const unscheduledItems = [...remainingAsap, ...allUnscheduled.filter((t) => t.priority !== "ASAP").map(toItem)];
  const sections = [];
  if (todayItems.length > 0) sections.push({ label: "Today", items: todayItems });
  if (asapUnscheduledItems.length > 0) sections.push({ label: "ASAP (Unscheduled)", items: asapUnscheduledItems });
  if (tomorrowItems.length > 0) sections.push({ label: "Tomorrow", items: tomorrowItems });
  if (laterItems.length > 0) sections.push({ label: "Later", items: laterItems });
  if (unscheduledItems.length > 0) sections.push({ label: "Unscheduled", items: unscheduledItems });
  return sections;
}
function TasksDashboard({ userName, userImage }) {
  const [tasks, setTasks] = (0, import_react4.useState)([]);
  const [events, setEvents] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [briefing, setBriefing] = (0, import_react4.useState)(null);
  const [briefingLoading, setBriefingLoading] = (0, import_react4.useState)(true);
  const [briefingAt, setBriefingAt] = (0, import_react4.useState)(null);
  const [activeTask, setActiveTask] = (0, import_react4.useState)(null);
  const [scheduleMap, setScheduleMap] = (0, import_react4.useState)(/* @__PURE__ */ new Map());
  const [authError, setAuthError] = (0, import_react4.useState)(false);
  const firstName = userName.split(" ")[0] ?? userName;
  const activeTaskRef = (0, import_react4.useRef)(null);
  const briefingFetchedRef = (0, import_react4.useRef)(false);
  const tasksSnapshotRef = (0, import_react4.useRef)("");
  const eventsSnapshotRef = (0, import_react4.useRef)("");
  const reminderStateRef = (0, import_react4.useRef)({
    lastTaskReminderAt: 0,
    remindedEventIds: /* @__PURE__ */ new Set()
  });
  (0, import_react4.useEffect)(() => {
    if (activeTask) {
      activeTaskRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeTask?.task.id]);
  const fetchEvents = (0, import_react4.useCallback)(async () => {
    setEvents([]);
    return [];
  }, []);
  const fetchTasks = (0, import_react4.useCallback)(async () => {
    const response = await proxyFetch("/agent/google/tasks");
    if (response.status === 401) setAuthError(true);
    const data = response.ok ? await response.json() : { tasks: [] };
    const googleTasks = (data.tasks ?? []).map((task) => ({ ...task, source: "google" }));
    setTasks(googleTasks);
    return googleTasks;
  }, []);
  const fetchBriefing = (0, import_react4.useCallback)(async (currentTasks, currentEvents) => {
    setBriefingLoading(true);
    const localToday = () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
    const localNow = () => (/* @__PURE__ */ new Date()).toLocaleTimeString();
    try {
      const prefs = await idbGetUserPrefs();
      if (prefs.dailyBriefing?.createdAtDate === localToday()) {
        setBriefing(prefs.dailyBriefing.text);
        setBriefingAt(prefs.dailyBriefing.createdAtTime);
        setBriefingLoading(false);
        return;
      }
      const today = localToday();
      const now = localNow();
      const tasks2 = [...currentTasks].sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority];
        const pb = PRIORITY_ORDER[b.priority];
        if (pa !== pb) return pa - pb;
        return toTaskStartMs(a) - toTaskStartMs(b);
      }).map((t) => ({ title: t.title, priority: t.priority ?? "LOW", projectName: t.projectName, dueDate: t.dueDate }));
      const res = await proxyFetch("/agent/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks2,
          events: currentEvents.map((e) => ({
            title: e.title,
            start: e.start,
            localTime: e.start.length === 10 ? "" : new Date(e.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
          })),
          today,
          now
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.briefing ?? null;
        if (text) {
          await idbSetUserPrefs({ dailyBriefing: { text, createdAtDate: today, createdAtTime: now } });
          Promise.all([pushUserData(), pushTasksBackup()]);
        }
        setBriefing(text);
        setBriefingAt(now);
      }
    } catch {
      setBriefing(null);
    } finally {
      setBriefingLoading(false);
    }
  }, []);
  const loadSchedules = (0, import_react4.useCallback)(async () => {
    const entries = await idbGetAllTaskSchedules();
    setScheduleMap(new Map(entries.map((e) => [e.taskId, { scheduledFor: e.scheduledFor, scheduledStartTime: e.scheduledStartTime, scheduledEndTime: e.scheduledEndTime }])));
  }, []);
  (0, import_react4.useEffect)(() => {
    setLoading(true);
    Promise.all([fetchEvents(), fetchTasks(), loadSchedules()]).then(([evts, tsks]) => {
      eventsSnapshotRef.current = JSON.stringify(evts);
      tasksSnapshotRef.current = JSON.stringify(tsks);
    }).finally(() => setLoading(false));
  }, [fetchEvents, fetchTasks, loadSchedules]);
  const checkReminders = (0, import_react4.useCallback)((newTasks, newEvents, hasActiveTask) => {
    const now = Date.now();
    const state = reminderStateRef.current;
    for (const event of newEvents) {
      if (state.remindedEventIds.has(event.id)) continue;
      const startMs = new Date(event.start).getTime();
      const minsUntil = (startMs - now) / 6e4;
      if (minsUntil > 0 && minsUntil <= 10) {
        const mins = Math.round(minsUntil);
        const notification = {
          id: `reminder-meeting-${event.id}`,
          title: `Starting in ${mins} minute${mins !== 1 ? "s" : ""}`,
          body: event.title,
          ts: now
        };
        idbAddNotification(notification);
        window.dispatchEvent(new CustomEvent("task-reminder", { detail: notification }));
        state.remindedEventIds.add(event.id);
      }
    }
    if (!hasActiveTask && now - state.lastTaskReminderAt > 10 * 6e4) {
      const asapTasks = newTasks.filter((t) => t.priority === "ASAP");
      if (asapTasks.length > 0) {
        const body = asapTasks.length === 1 ? asapTasks[0].title : `${asapTasks[0].title} +${asapTasks.length - 1} more`;
        const notification = {
          id: `reminder-asap-${now}`,
          title: `${asapTasks.length} urgent task${asapTasks.length !== 1 ? "s" : ""} need${asapTasks.length === 1 ? "s" : ""} attention`,
          body,
          ts: now
        };
        idbAddNotification(notification);
        window.dispatchEvent(new CustomEvent("task-reminder", { detail: notification }));
        state.lastTaskReminderAt = now;
      }
    }
  }, []);
  (0, import_react4.useEffect)(() => {
    postToSW({ type: "START_TASKS_POLL" });
    const handleMessage = async (event) => {
      if (event.data?.type !== "POLL_TICK") return;
      const [newTasks, newEvents] = await Promise.all([fetchTasks(), fetchEvents(), loadSchedules()]);
      const newTasksJson = JSON.stringify(newTasks);
      const newEventsJson = JSON.stringify(newEvents);
      if (newTasksJson !== tasksSnapshotRef.current || newEventsJson !== eventsSnapshotRef.current) {
        tasksSnapshotRef.current = newTasksJson;
        eventsSnapshotRef.current = newEventsJson;
        await Promise.all([pushUserData(), pushTasksBackup()]);
      }
      checkReminders(newTasks, newEvents, activeTask !== null);
    };
    navigator.serviceWorker?.addEventListener("message", handleMessage);
    return () => {
      postToSW({ type: "STOP_TASKS_POLL" });
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, [fetchTasks, fetchEvents, loadSchedules]);
  (0, import_react4.useEffect)(() => {
    if (loading) return;
    idbGetPersistedActiveTask().then((persisted) => {
      if (!persisted) return;
      const remoteTask = tasks.find((t) => t.id === persisted.taskId && t.source === persisted.source);
      if (remoteTask) {
        setActiveTask({ task: remoteTask, startedAt: persisted.startedAt, flowRate: persisted.flowRate, baseElapsedMs: persisted.baseElapsedMs ?? 0 });
        return;
      }
    });
  }, [loading]);
  (0, import_react4.useEffect)(() => {
    if (!loading && !briefingFetchedRef.current) {
      briefingFetchedRef.current = true;
      fetchBriefing(tasks, events);
    }
  }, [loading]);
  const handleFlag = (0, import_react4.useCallback)(async (task) => {
    if (activeTask?.task.id === task.id) {
      idbClearPersistedActiveTask();
      setActiveTask(null);
      Promise.all([pushUserData(), pushTasksBackup()]);
      return;
    }
    const entry = await idbGetTaskSchedule(task.id);
    const baseElapsedMs = entry?.elapsedMs ?? 0;
    const flowRate = computeFlowRate(task);
    const startedAt = Date.now();
    idbSetPersistedActiveTask({ taskId: task.id, source: task.source, startedAt, flowRate, baseElapsedMs });
    setActiveTask({ task, startedAt, flowRate, baseElapsedMs });
    Promise.all([pushUserData(), pushTasksBackup()]);
  }, [activeTask]);
  const handleTimerPause = (0, import_react4.useCallback)((baseElapsedMs) => {
    if (!activeTask) return;
    idbSetPersistedActiveTask({ taskId: activeTask.task.id, source: activeTask.task.source, startedAt: activeTask.startedAt, flowRate: activeTask.flowRate, baseElapsedMs });
    Promise.all([pushUserData(), pushTasksBackup()]);
  }, [activeTask]);
  const handleTimerResume = (0, import_react4.useCallback)((newStartedAt, baseElapsedMs) => {
    if (!activeTask) return;
    idbSetPersistedActiveTask({ taskId: activeTask.task.id, source: activeTask.task.source, startedAt: newStartedAt, flowRate: activeTask.flowRate, baseElapsedMs });
    Promise.all([pushUserData(), pushTasksBackup()]);
  }, [activeTask]);
  const handleUnflag = (0, import_react4.useCallback)((elapsedMs) => {
    if (elapsedMs !== void 0 && activeTask) {
      idbSaveTaskElapsed(activeTask.task.id, elapsedMs);
    }
    idbClearPersistedActiveTask();
    setActiveTask(null);
    Promise.all([pushUserData(), pushTasksBackup()]);
  }, [activeTask]);
  const handleComplete = (0, import_react4.useCallback)(async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTask?.task.id === taskId) {
      idbClearPersistedActiveTask();
      setActiveTask(null);
    }
    try {
      if (task.source === "google" && task.listId) {
        const res = await proxyFetch(`/agent/notebook/pages/${task.listId}/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" })
        });
        if (!res.ok) setTasks((prev) => [...prev, task]);
      }
    } catch {
      setTasks((prev) => [...prev, task]);
    }
  }, [tasks, activeTask]);
  const annotatedTasks = tasks.map((t) => {
    const sched = scheduleMap.get(t.id);
    if (!t.scheduledFor && sched?.scheduledFor) {
      idbDeleteTaskSchedule(t.id).then(() => {
        setScheduleMap((prev) => {
          const next = new Map(prev);
          next.delete(t.id);
          return next;
        });
      });
      return t;
    }
    if (!sched) return t;
    return {
      ...t,
      ...sched.scheduledFor !== void 0 ? { scheduledFor: sched.scheduledFor } : {},
      ...sched.scheduledStartTime !== void 0 ? { scheduledStartTime: sched.scheduledStartTime } : {},
      ...sched.scheduledEndTime !== void 0 ? { scheduledEndTime: sched.scheduledEndTime } : {}
    };
  });
  const sections = groupItems(annotatedTasks, events);
  const todayTaskCount = sections.find((s) => s.label === "Today")?.items.filter((i) => i.kind === "task").length ?? 0;
  const completionScope = todayTaskCount > 0 ? "today" : "all";
  const tasksRemaining = todayTaskCount > 0 ? todayTaskCount : sections.flatMap((section) => section.items).filter((item) => item.kind === "task").length;
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AppHeader, { userImage, userName, initials, pageTitle: `Good ${getGreeting()}, ${firstName}.` }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(PageShell, { children: [
      authError && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { background: "#fde8e8", borderRadius: 8, padding: "8px 16px", fontSize: "var(--font-size-sm)", color: "#c02e2e", textAlign: "center" }, children: [
        "Your Google session expired \u2014 live updates are paused.",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("a", { href: "/login", style: { textDecoration: "underline", fontWeight: 700 }, children: "Re-authenticate" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { style: { fontSize: "var(--font-size-sm)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0 }, children: [
        tasksRemaining,
        " task",
        tasksRemaining !== 1 ? "s" : "",
        " remaining"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: TasksDashboard_default.grid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(DailyBriefingCard, { briefing, loading: briefingLoading, generatedAt: briefingAt }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          TodayAtAGlanceCard,
          {
            totalEvents: events.length,
            tasksRemaining,
            completedCount: 0,
            completionScope
          }
        ),
        activeTask && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ActiveTaskCard, { ref: activeTaskRef, activeTask, onUnflag: handleUnflag, onPause: handleTimerPause, onResume: handleTimerResume }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          TaskList,
          {
            sections,
            loading,
            activeTask,
            onFlag: handleFlag,
            onComplete: handleComplete
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        FloatingAssistant,
        {
          onFlagTask: (taskId, source) => {
            const task = tasks.find((t) => t.id === taskId && t.source === source);
            if (task) handleFlag(task);
          },
          onUnflagTask: handleUnflag,
          onScheduleTask: (taskId, scheduledFor) => {
            setScheduleMap((prev) => new Map(prev).set(taskId, { scheduledFor }));
          },
          onAgentAction: () => {
            fetchTasks();
            fetchEvents();
            loadSchedules();
          }
        }
      )
    ] })
  ] });
}
function getGreeting() {
  const h = (/* @__PURE__ */ new Date()).getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

// react-entries/tasks.tsx
var import_jsx_runtime10 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime10.jsx)(TasksDashboard, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
