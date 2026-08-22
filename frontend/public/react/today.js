import {
  AppHeader,
  FloatingAssistant,
  Link,
  useAgentIdentity
} from "./chunk-B6E4MHQS.js";
import {
  __toESM,
  proxyFetch,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-7G5O7DHP.js";

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
  inboxHint: "TodayPage_inboxHint"
};

// components/dashboard/TodayPage.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function TodayPage({ userName, userImage }) {
  const { name: agentName } = useAgentIdentity();
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const [tasks, setTasks] = (0, import_react.useState)([]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    let active = true;
    const today = (/* @__PURE__ */ new Date()).toDateString();
    proxyFetch("/agent/google/tasks").then(async (googleResponse) => {
      const google = googleResponse.ok ? (await googleResponse.json()).tasks ?? [] : [];
      const loadedTasks = [
        ...google.filter((task) => task.dueDate && new Date(task.dueDate).toDateString() === today).map((task) => ({ title: task.name ?? task.title ?? "Untitled", priority: task.priority ?? 4, source: "google" }))
      ];
      if (!active) return;
      setTasks(loadedTasks);
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Google Tasks due today, from your connected Google Workspace account." })
      ] }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: TodayPage_default.error, children: error }) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.loading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {})
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TodayPage_default.board, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: `${TodayPage_default.card} ${TodayPage_default.tasks}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.cardHead, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Tasks" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { href: "/tasks", children: "Open tasks \u2192" })
        ] }),
        tasks.length ? tasks.map((task, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TodayPage_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${TodayPage_default.checkbox} ${task.priority <= 2 ? TodayPage_default.highPriority : ""}` }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: task.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Google" })
        ] }, `${task.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: TodayPage_default.empty, children: "Nothing needs your attention today." })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/today.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await fetch("/auth/me", { credentials: "include" });
  if (!r.ok) return;
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TodayPage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
