import {
  FloatingAssistant
} from "./chunk-RDJA3UUM.js";
import {
  AppHeader,
  Link,
  useAgentIdentity
} from "./chunk-EYLK6625.js";
import "./chunk-OHWNV7E6.js";
import {
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-EEKIOSJK.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/today.tsx
var import_client = __toESM(require_client());

// components/dashboard/TodayPage.tsx
var import_react = __toESM(require_react());

// components/dashboard/TodayPage.module.css
var TodayPage_default = {
  shell: "TodayPage_shell",
  page: "TodayPage_page",
  heading: "TodayPage_heading",
  eyebrow: "TodayPage_eyebrow",
  board: "TodayPage_board",
  card: "TodayPage_card",
  schedule: "TodayPage_schedule",
  cardHead: "TodayPage_cardHead",
  row: "TodayPage_row",
  dot: "TodayPage_dot",
  checkbox: "TodayPage_checkbox",
  highPriority: "TodayPage_highPriority",
  empty: "TodayPage_empty",
  context: "TodayPage_context",
  loading: "TodayPage_loading",
  shimmer: "TodayPage_shimmer",
  error: "TodayPage_error",
  inbox: "TodayPage_inbox",
  inboxMetric: "TodayPage_inboxMetric",
  inboxHint: "TodayPage_inboxHint",
  taskMetric: "TodayPage_taskMetric",
  taskHint: "TodayPage_taskHint"
};

// components/dashboard/TodayPage.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function TodayPage({ userName, userImage }) {
  const { name: agentName } = useAgentIdentity();
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const [events, setEvents] = (0, import_react.useState)([]);
  const [tasks, setTasks] = (0, import_react.useState)([]);
  const [unreadCount, setUnreadCount] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    let active = true;
    const today = (/* @__PURE__ */ new Date()).toDateString();
    const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const localTaskDate = (dateStr) => {
      if (!dateStr) return null;
      const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr);
      if (Number.isNaN(parsed.getTime())) return null;
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    };
    const todayMidnight = /* @__PURE__ */ new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    Promise.all([
      proxyFetch("/agent/google/tasks"),
      proxyFetch("/agent/calendars?days=1"),
      proxyFetch(`/agent/inbox/count?localDate=${date}`)
    ]).then(async ([googleResponse, calendarResponse, inboxResponse]) => {
      const google = googleResponse.ok ? (await googleResponse.json()).tasks ?? [] : [];
      const calendar = calendarResponse.ok ? await calendarResponse.json() : { calendars: [] };
      const inbox = inboxResponse.ok ? await inboxResponse.json() : {};
      const loadedTasks = google.filter((task) => {
        const dueDate = localTaskDate(task.dueDate);
        return dueDate != null && dueDate.getTime() <= todayMidnight.getTime();
      }).map((task) => ({ title: task.name ?? task.title ?? "Untitled", priority: task.priority ?? 4, source: "google" }));
      const loadedEvents = (calendar.calendars ?? []).flatMap((calendarItem) => (calendarItem.events ?? []).filter((event) => event.start && (event.start.includes("T") ? new Date(event.start).toDateString() === today : event.start === date)).map((event) => ({ title: event.title, time: event.start.includes("T") ? new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "All day", color: calendarItem.color ?? "var(--color-accent)" }))).sort((a, b) => a.time.localeCompare(b.time));
      if (!active) return;
      setTasks(loadedTasks);
      setEvents(loadedEvents);
      setUnreadCount(inbox.unread ?? 0);
    }).catch(() => {
      if (active) setError("Today's information could not be refreshed. Try again in a moment.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.shell, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { userImage, userName, initials, backHref: "/", backLabel: "Home" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { className: TodayPage_default.page, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.heading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: TodayPage_default.eyebrow, children: "Agent view" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Today" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your commitments and work in one place. Calendar and task tools remain available when you need to manage them manually." })
      ] }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: TodayPage_default.error, children: error }) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.loading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {})
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.board, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: `${TodayPage_default.card} ${TodayPage_default.schedule}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.cardHead, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Schedule" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { href: "/calendar", children: "Open calendar \u2192" })
          ] }),
          events.length ? events.map((event, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.row, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: TodayPage_default.dot, style: { background: event.color } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: event.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { children: event.time })
          ] }, `${event.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: TodayPage_default.empty, children: "No events scheduled today." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: `${TodayPage_default.card} ${TodayPage_default.tasks}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.cardHead, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Tasks" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { href: "/tasks", children: "Open tasks \u2192" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: TodayPage_default.taskMetric, children: [
            tasks.length,
            " Google task",
            tasks.length === 1 ? "" : "s"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: TodayPage_default.taskHint, children: "Overdue or due today, from your connected Google Tasks account." }),
          tasks.length ? tasks.map((task, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.row, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${TodayPage_default.checkbox} ${task.priority <= 2 ? TodayPage_default.highPriority : ""}` }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: task.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Google" })
          ] }, `${task.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: TodayPage_default.empty, children: "Nothing needs your attention today." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, { href: "/inbox", className: `${TodayPage_default.card} ${TodayPage_default.inbox}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.cardHead, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Inbox" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open inbox \u2192" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: TodayPage_default.inboxMetric, children: unreadCount == null ? "\u2026" : unreadCount === 0 ? "All caught up" : `${unreadCount} unread` }),
          unreadCount && unreadCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: TodayPage_default.inboxHint, children: "Messages waiting for your attention." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: TodayPage_default.inboxHint, children: "No unread messages right now." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/today.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TodayPage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
