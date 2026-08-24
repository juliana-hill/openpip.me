import {
  FloatingAssistant
} from "./chunk-VZIUBKB3.js";
import {
  AppHeader,
  Link
} from "./chunk-XIKOZ5LE.js";
import "./chunk-OHWNV7E6.js";
import {
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-Y73BQP5V.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/review.tsx
var import_client = __toESM(require_client());

// components/review/ReviewQueuePage.tsx
var import_react = __toESM(require_react());

// components/review/ReviewQueuePage.module.css
var ReviewQueuePage_default = {
  shell: "ReviewQueuePage_shell",
  page: "ReviewQueuePage_page",
  heading: "ReviewQueuePage_heading",
  eyebrow: "ReviewQueuePage_eyebrow",
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
var import_jsx_runtime = __toESM(require_jsx_runtime());
var TYPE_LABEL = {
  application: "Application",
  email: "Email draft",
  campaign: "Campaign",
  proposal: "Agent proposal"
};
function ReviewQueuePage({ userName, userImage }) {
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const [items, setItems] = (0, import_react.useState)([]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    let active = true;
    proxyFetch("/agent/review").then(async (response) => response.ok ? response.json() : { items: [] }).then((data) => {
      if (active) setItems(data.items ?? []);
    }).catch(() => {
      if (active) setItems([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ReviewQueuePage_default.shell, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { userImage, userName, initials, backHref: "/", backLabel: "Home" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { className: ReviewQueuePage_default.page, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ReviewQueuePage_default.heading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: ReviewQueuePage_default.eyebrow, children: "Human decision needed" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Ready for review" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "These are the outcomes your agent prepared. Nothing is sent or submitted without your approval." })
      ] }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: ReviewQueuePage_default.list, "aria-label": "Loading review items", children: [0, 1, 2].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: ReviewQueuePage_default.skeleton }, index)) }) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: ReviewQueuePage_default.empty, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: "\u2713" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "You're all caught up" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "When the agent prepares something that needs your decision, it will appear here." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { href: "/", className: ReviewQueuePage_default.homeLink, children: "Back to today" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: ReviewQueuePage_default.list, children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, { href: `/review/${encodeURIComponent(item.id)}`, className: ReviewQueuePage_default.item, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ReviewQueuePage_default.itemContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ReviewQueuePage_default.itemTop, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ReviewQueuePage_default.type, children: item.category ?? TYPE_LABEL[item.kind] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { children: item.createdAt ? new Date(item.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric" }) : "" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: item.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ReviewQueuePage_default.metaRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: ReviewQueuePage_default.meta, children: [
              item.externalAction.label,
              ": ",
              item.externalAction.detail
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: ReviewQueuePage_default.meta, children: [
              "Prepared ",
              item.createdAt ? new Date(item.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric" }) : "recently"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: ReviewQueuePage_default.open, children: [
          "Review ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: "\u2192" })
        ] })
      ] }, item.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/review.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ReviewQueuePage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
