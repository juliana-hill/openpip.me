import {
  Dialog_default
} from "./chunk-VGRKXESR.js";
import {
  FloatingAssistant
} from "./chunk-EJQYZBM4.js";
import {
  AppHeader,
  Link,
  useAgentIdentity
} from "./chunk-GKLEY6TF.js";
import "./chunk-OHWNV7E6.js";
import {
  X,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-DONEC6XU.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/review.tsx
var import_client = __toESM(require_client());

// components/review/ReviewQueuePage.tsx
var import_react = __toESM(require_react());

// components/review/ExecutionProgressModal.module.css
var ExecutionProgressModal_default = {
  content: "ExecutionProgressModal_content",
  eyebrow: "ExecutionProgressModal_eyebrow",
  scrollArea: "ExecutionProgressModal_scrollArea",
  group: "ExecutionProgressModal_group",
  groupTitle: "ExecutionProgressModal_groupTitle",
  groupDot: "ExecutionProgressModal_groupDot",
  dotExecuting: "ExecutionProgressModal_dotExecuting",
  executingPulse: "ExecutionProgressModal_executingPulse",
  dotQueued: "ExecutionProgressModal_dotQueued",
  dotCompleted: "ExecutionProgressModal_dotCompleted",
  empty: "ExecutionProgressModal_empty",
  list: "ExecutionProgressModal_list",
  row: "ExecutionProgressModal_row",
  rowTitle: "ExecutionProgressModal_rowTitle",
  rowBadge: "ExecutionProgressModal_rowBadge",
  footnote: "ExecutionProgressModal_footnote"
};

// components/review/ExecutionProgressModal.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function Row({ item, badge }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: ExecutionProgressModal_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ExecutionProgressModal_default.rowTitle, children: item.title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: ExecutionProgressModal_default.rowBadge, children: [
      badge,
      item.attempt > 1 ? ` \xB7 attempt ${item.attempt}` : ""
    ] })
  ] });
}
function ExecutionProgressModal({ open, tick, onClose }) {
  if (!open || !tick) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: Dialog_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: `${Dialog_default.content} ${ExecutionProgressModal_default.content}`, role: "dialog", "aria-modal": "true", "aria-labelledby": "execution-progress-title", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: Dialog_default.closeBtn, onClick: onClose, "aria-label": "Close execution progress", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: Dialog_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: ExecutionProgressModal_default.eyebrow, children: "Background execution" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: Dialog_default.title, id: "execution-progress-title", children: "View Progress" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: Dialog_default.description, children: "One approved action runs at a time \u2014 nothing here was ever sent or changed without your earlier approval." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ExecutionProgressModal_default.scrollArea, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: ExecutionProgressModal_default.group, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { className: ExecutionProgressModal_default.groupTitle, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${ExecutionProgressModal_default.groupDot} ${ExecutionProgressModal_default.dotExecuting}`, "aria-hidden": "true" }),
            "Currently executing"
          ] }),
          tick.executing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: ExecutionProgressModal_default.list, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { item: tick.executing, badge: "Working" }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: ExecutionProgressModal_default.empty, children: "Nothing executing right now." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: ExecutionProgressModal_default.group, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { className: ExecutionProgressModal_default.groupTitle, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${ExecutionProgressModal_default.groupDot} ${ExecutionProgressModal_default.dotQueued}`, "aria-hidden": "true" }),
            "In queue (",
            tick.queuedCount,
            ")"
          ] }),
          tick.queued.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: ExecutionProgressModal_default.list, children: tick.queued.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { item, badge: index === 0 ? "Up next" : `#${index + 1}` }, item.id)) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: ExecutionProgressModal_default.empty, children: "Nothing else waiting." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: ExecutionProgressModal_default.group, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { className: ExecutionProgressModal_default.groupTitle, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${ExecutionProgressModal_default.groupDot} ${ExecutionProgressModal_default.dotCompleted}`, "aria-hidden": "true" }),
            "Recently completed"
          ] }),
          tick.completed.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: ExecutionProgressModal_default.list, children: tick.completed.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { item, badge: "Done" }, item.id)) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: ExecutionProgressModal_default.empty, children: "Nothing completed yet this session." })
        ] }),
        (tick.recoveredCount > 0 || tick.retriedCount > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: ExecutionProgressModal_default.footnote, children: [
          tick.recoveredCount > 0 && `Picked back up ${tick.recoveredCount} action${tick.recoveredCount === 1 ? "" : "s"} that looked stuck. `,
          tick.retriedCount > 0 && `Retried ${tick.retriedCount} action${tick.retriedCount === 1 ? "" : "s"} that failed earlier.`
        ] })
      ] })
    ] })
  ] });
}

// components/review/ReviewQueuePage.module.css
var ReviewQueuePage_default = {
  shell: "ReviewQueuePage_shell",
  page: "ReviewQueuePage_page",
  heading: "ReviewQueuePage_heading",
  eyebrow: "ReviewQueuePage_eyebrow",
  executionCard: "ReviewQueuePage_executionCard",
  executionKicker: "ReviewQueuePage_executionKicker",
  executionTitle: "ReviewQueuePage_executionTitle",
  executionCopy: "ReviewQueuePage_executionCopy",
  viewProgressLink: "ReviewQueuePage_viewProgressLink",
  executionDot: "ReviewQueuePage_executionDot",
  executionPulse: "ReviewQueuePage_executionPulse",
  list: "ReviewQueuePage_list",
  item: "ReviewQueuePage_item",
  homeLink: "ReviewQueuePage_homeLink",
  itemContent: "ReviewQueuePage_itemContent",
  itemTop: "ReviewQueuePage_itemTop",
  type: "ReviewQueuePage_type",
  metaRow: "ReviewQueuePage_metaRow",
  meta: "ReviewQueuePage_meta",
  open: "ReviewQueuePage_open",
  empty: "ReviewQueuePage_empty",
  skeleton: "ReviewQueuePage_skeleton",
  shimmer: "ReviewQueuePage_shimmer"
};

// components/review/ReviewQueuePage.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var TYPE_LABEL = {
  application: "Application",
  email: "Email draft",
  campaign: "Campaign",
  proposal: "Agent proposal"
};
function ReviewQueuePage({ userName, userImage }) {
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const { name: agentName } = useAgentIdentity();
  const [items, setItems] = (0, import_react.useState)([]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [tick, setTick] = (0, import_react.useState)(null);
  const [progressOpen, setProgressOpen] = (0, import_react.useState)(false);
  const tickTimer = (0, import_react.useRef)(null);
  const loadItems = (0, import_react.useCallback)(() => {
    return proxyFetch("/agent/review").then(async (response) => response.ok ? response.json() : { items: [] }).then((data) => setItems(data.items ?? [])).catch(() => setItems([]));
  }, []);
  (0, import_react.useEffect)(() => {
    let active = true;
    void loadItems().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadItems]);
  const runTick = (0, import_react.useCallback)(async () => {
    try {
      const res = await proxyFetch("/agent/proposals/execution/tick", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setTick(data);
      if (data.executing) void loadItems();
      if (data.executing || data.queuedCount > 0) {
        if (!tickTimer.current) tickTimer.current = window.setInterval(() => {
          void runTick();
        }, 2e3);
      } else if (tickTimer.current) {
        window.clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
    } catch {
    }
  }, [loadItems]);
  (0, import_react.useEffect)(() => {
    void runTick();
    return () => {
      if (tickTimer.current) window.clearInterval(tickTimer.current);
    };
  }, [runTick]);
  const showExecutionCard = Boolean(tick && (tick.executing || tick.queuedCount > 0));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ReviewQueuePage_default.shell, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AppHeader, { userImage, userName, initials, backHref: "/", backLabel: "Home" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("main", { className: ReviewQueuePage_default.page, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ReviewQueuePage_default.heading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: ReviewQueuePage_default.eyebrow, children: "Human decision needed" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { children: "Ready for review" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "These are the outcomes your agent prepared. Nothing is sent or submitted without your approval." })
      ] }),
      showExecutionCard && tick && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: ReviewQueuePage_default.executionCard, "aria-live": "polite", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: ReviewQueuePage_default.executionKicker, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
            " ",
            agentName,
            " assistant"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: ReviewQueuePage_default.executionTitle, children: tick.executing ? `Working on "${tick.executing.title}"` : "Picking up the next approved action" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: ReviewQueuePage_default.executionCopy, children: [
            tick.queuedCount > 0 ? `${tick.queuedCount} more approved action${tick.queuedCount === 1 ? "" : "s"} waiting its turn.` : "Finishing up \u2014 nothing else waiting.",
            tick.recoveredCount > 0 && " Picked back up something that looked stuck.",
            tick.retriedCount > 0 && " Retrying something that failed earlier."
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: ReviewQueuePage_default.viewProgressLink, onClick: () => setProgressOpen(true), children: "View Progress" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: ReviewQueuePage_default.executionDot, "aria-label": "Executing" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ExecutionProgressModal, { open: progressOpen, tick, onClose: () => setProgressOpen(false) }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ReviewQueuePage_default.list, "aria-label": "Loading review items", children: [0, 1, 2].map((index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ReviewQueuePage_default.skeleton }, index)) }) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: ReviewQueuePage_default.empty, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\u2713" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "You're all caught up" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "When the agent prepares something that needs your decision, it will appear here." }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Link, { href: "/", className: ReviewQueuePage_default.homeLink, children: "Back to today" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ReviewQueuePage_default.list, children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Link, { href: `/review/${encodeURIComponent(item.id)}`, className: ReviewQueuePage_default.item, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ReviewQueuePage_default.itemContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ReviewQueuePage_default.itemTop, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: ReviewQueuePage_default.type, children: item.category ?? TYPE_LABEL[item.kind] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("time", { children: item.createdAt ? new Date(item.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric" }) : "" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: item.title }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ReviewQueuePage_default.metaRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: ReviewQueuePage_default.meta, children: [
              item.externalAction.label,
              ": ",
              item.externalAction.detail
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: ReviewQueuePage_default.meta, children: [
              "Prepared ",
              item.createdAt ? new Date(item.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric" }) : "recently"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: ReviewQueuePage_default.open, children: [
          "Review ",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\u2192" })
        ] })
      ] }, item.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/review.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ReviewQueuePage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
