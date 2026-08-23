import {
  TrippyIcon
} from "./chunk-2WTVMOSB.js";
import {
  Input_default
} from "./chunk-VZUAWI7R.js";
import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  AppHeader,
  Link,
  Markdown,
  remarkGfm
} from "./chunk-ZJ44CDQL.js";
import {
  ArrowLeft,
  Calendar,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  Lightbulb,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  StickyNote,
  Trash2,
  UserPlus,
  Users,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react,
  useRouter
} from "./chunk-YQDVQL7K.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/contact-detail.tsx
var import_client = __toESM(require_client());

// components/network/contact-detail/ContactDetailPage.tsx
var import_react5 = __toESM(require_react());

// components/career/job-detail/JobHeader.module.css
var JobHeader_default = {
  section: "JobHeader_section",
  breadcrumb: "JobHeader_breadcrumb",
  backLink: "JobHeader_backLink",
  crumbs: "JobHeader_crumbs",
  crumbLink: "JobHeader_crumbLink",
  crumbCurrent: "JobHeader_crumbCurrent",
  titleRow: "JobHeader_titleRow",
  titleLeft: "JobHeader_titleLeft",
  titleEdit: "JobHeader_titleEdit",
  titleInput: "JobHeader_titleInput",
  titleStatic: "JobHeader_titleStatic",
  title: "JobHeader_title",
  editBtn: "JobHeader_editBtn",
  iconBtn: "JobHeader_iconBtn",
  meta: "JobHeader_meta",
  company: "JobHeader_company",
  urlLink: "JobHeader_urlLink",
  badges: "JobHeader_badges",
  statusBadge: "JobHeader_statusBadge",
  urlRow: "JobHeader_urlRow",
  urlText: "JobHeader_urlText",
  urlVerified: "JobHeader_urlVerified",
  urlNone: "JobHeader_urlNone",
  urlInput: "JobHeader_urlInput",
  urlActions: "JobHeader_urlActions",
  pillBtn: "JobHeader_pillBtn"
};

// components/network/contact-detail/ContactHeader.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
var STATUS_COLORS = {
  not_contacted: { bg: "var(--color-border)", color: "var(--color-text-muted)" },
  connection_requested: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  connected: { bg: "rgba(129,140,248,0.12)", color: "#818cf8" },
  messaged: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  replied: { bg: "var(--color-accent-light)", color: "var(--color-accent)" },
  meeting_scheduled: { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
  followed_up: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" }
};
var STATUS_LABELS = {
  not_contacted: "Not contacted",
  connection_requested: "Req. sent",
  connected: "Connected",
  messaged: "Contacted",
  replied: "Replied",
  meeting_scheduled: "Meeting set",
  followed_up: "Followed up"
};
function ContactHeader({ contact }) {
  const statusStyle = STATUS_COLORS[contact.status] ?? STATUS_COLORS.not_contacted;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: JobHeader_default.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.breadcrumb, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { href: "/network", className: JobHeader_default.backLink, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 16 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { className: JobHeader_default.crumbs, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { href: "/network", className: JobHeader_default.crumbLink, children: "Networking" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 12, style: { opacity: 0.4 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: JobHeader_default.crumbCurrent, children: contact.name })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.titleRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.titleLeft, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: JobHeader_default.titleStatic, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: JobHeader_default.title, children: contact.name }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.meta, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: JobHeader_default.company, children: contact.company }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\xB7" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: contact.role }),
          contact.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: `mailto:${contact.email}`, className: JobHeader_default.urlLink, title: contact.email, children: contact.email }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "a",
            {
              href: `https://contacts.google.com/person/${contact.id}`,
              target: "_blank",
              rel: "noopener noreferrer",
              className: JobHeader_default.urlLink,
              title: "Open in Google Contacts",
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 13 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: JobHeader_default.badges, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: JobHeader_default.statusBadge, style: { background: statusStyle.bg, color: statusStyle.color }, children: STATUS_LABELS[contact.status] ?? contact.status }) })
    ] })
  ] });
}

// components/career/job-detail/JobStatusBar.module.css
var JobStatusBar_default = {
  bar: "JobStatusBar_bar",
  chip: "JobStatusBar_chip",
  chipActive: "JobStatusBar_chipActive",
  icon: "JobStatusBar_icon"
};

// components/network/contact-detail/ContactStatusBar.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var STATUSES = [
  { value: "not_contacted", label: "Not contacted", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Circle, { size: 14 }) },
  { value: "connection_requested", label: "Req. sent", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(UserPlus, { size: 14 }) },
  { value: "connected", label: "Connected", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Users, { size: 14 }) },
  { value: "messaged", label: "Contacted", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Send, { size: 14 }) },
  { value: "replied", label: "Replied", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MessageSquare, { size: 14 }) },
  { value: "meeting_scheduled", label: "Meeting set", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Calendar, { size: 14 }) },
  { value: "followed_up", label: "Followed up", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RefreshCw, { size: 14 }) }
];
function ContactStatusBar({ status, onStatusChange }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("section", { className: JobStatusBar_default.bar, children: STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "button",
    {
      type: "button",
      className: `${JobStatusBar_default.chip} ${status === s.value ? JobStatusBar_default.chipActive : ""}`,
      onClick: () => onStatusChange(s.value),
      children: [
        s.icon,
        s.label
      ]
    },
    s.value
  )) });
}

// components/network/contact-detail/ContactNotes.tsx
var import_react2 = __toESM(require_react());

// components/career/job-detail/CollapsiblePanel.tsx
var import_react = __toESM(require_react());

// components/career/job-detail/panel.module.css
var panel_default = {
  panel: "panel_panel",
  fadeSlideUp: "panel_fadeSlideUp",
  panelHeader: "panel_panelHeader",
  panelTitle: "panel_panelTitle",
  panelIcon: "panel_panelIcon",
  panelHeading: "panel_panelHeading",
  panelBody: "panel_panelBody",
  textarea: "panel_textarea",
  sectionLabel: "panel_sectionLabel",
  emptyText: "panel_emptyText",
  errorText: "panel_errorText",
  statusMsg: "panel_statusMsg",
  skeleton: "panel_skeleton",
  shimmer: "panel_shimmer",
  skeletonList: "panel_skeletonList",
  divider: "panel_divider",
  collapseWrapper: "panel_collapseWrapper",
  collapseWrapperClosed: "panel_collapseWrapperClosed",
  collapseInner: "panel_collapseInner",
  chevronIcon: "panel_chevronIcon",
  chevronCollapsed: "panel_chevronCollapsed",
  tabs: "panel_tabs",
  tab: "panel_tab",
  tabActive: "panel_tabActive"
};

// components/career/job-detail/CollapsiblePanel.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function CollapsiblePanel({
  icon,
  title,
  actions,
  children,
  defaultCollapsed = false,
  subheader
}) {
  const [collapsed, setCollapsed] = (0, import_react.useState)(defaultCollapsed);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: panel_default.panel, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "div",
      {
        className: panel_default.panelHeader,
        style: { cursor: "pointer", userSelect: "none" },
        onClick: () => setCollapsed((c) => !c),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: panel_default.panelTitle, children: [
            icon,
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: panel_default.panelHeading, children: title })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "div",
            {
              style: { display: "flex", alignItems: "center", gap: 8 },
              onClick: (e) => e.stopPropagation(),
              children: [
                actions,
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  ChevronDown,
                  {
                    size: 15,
                    color: "var(--color-text-muted)",
                    className: `${panel_default.chevronIcon} ${collapsed ? panel_default.chevronCollapsed : ""}`
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    subheader && !collapsed && subheader,
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: `${panel_default.collapseWrapper} ${collapsed ? panel_default.collapseWrapperClosed : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: panel_default.collapseInner, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: panel_default.panelBody, children }) }) })
  ] });
}

// components/network/contact-detail/ContactNotes.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
function ContactNotes({ contact, onPatch }) {
  const [notes, setNotes] = (0, import_react2.useState)(contact.notes ?? "");
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CollapsiblePanel, { icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(StickyNote, { size: 16, style: { color: "var(--color-accent)" } }), title: "Private Notes", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "textarea",
    {
      value: notes,
      onChange: (e) => setNotes(e.target.value),
      onBlur: () => {
        if (notes !== (contact.notes ?? "")) onPatch({ notes });
      },
      placeholder: "Add private notes \u2014 how you met, context, follow-up reminders\u2026",
      rows: 5,
      className: panel_default.textarea
    }
  ) });
}

// components/network/contact-detail/ContactOutreach.tsx
var import_react3 = __toESM(require_react());
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
function ContactOutreach({ contact }) {
  const [message, setMessage] = (0, import_react3.useState)("");
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const [status, setStatus] = (0, import_react3.useState)("");
  const [error, setError] = (0, import_react3.useState)(null);
  const [copied, setCopied] = (0, import_react3.useState)(false);
  const handleDraft = (0, import_react3.useCallback)(async () => {
    setLoading(true);
    setError(null);
    setStatus("Drafting\u2026");
    setMessage("");
    try {
      const res = await proxyFetch(`/agent/career/contacts/${contact.id}/outreach`, { method: "POST" });
      if (!res.ok) {
        setError("Failed to start draft");
        setLoading(false);
        return;
      }
      const { jobId } = await res.json();
      const sw = navigator.serviceWorker.controller;
      if (!sw) {
        setError("Service worker not ready \u2014 try reloading.");
        setLoading(false);
        return;
      }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId, careerJobId: contact.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e) {
        const msg = e.data;
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== jobId) return;
        if (msg.status === "running") {
          setStatus(msg.statusMessage ?? "Drafting\u2026");
          return;
        }
        if (msg.status === "completed") {
          setMessage(msg.result?.message ?? "");
          setLoading(false);
        }
        if (msg.status === "failed") {
          setError(msg.error ?? "Failed to draft message");
          setLoading(false);
        }
        bc.removeEventListener("message", onMsg);
        bc.close();
      });
    } catch {
      setError("Failed to draft message");
      setLoading(false);
    }
  }, [contact.id]);
  const handleCopy = (0, import_react3.useCallback)(() => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    });
  }, [message]);
  const actions = /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    "button",
    {
      type: "button",
      className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`,
      onClick: handleDraft,
      disabled: loading,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(TrippyIcon, { size: 13 }),
        loading ? status || "Drafting\u2026" : message ? "Redraft" : "Draft Message"
      ]
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(CollapsiblePanel, { icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Send, { size: 16, style: { color: "var(--color-accent)" } }), title: "Outreach Message", actions, children: [
    error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: panel_default.errorText, children: error }),
    !message && !loading && !error && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: panel_default.emptyText, children: [
      'Click "Draft Message" to generate a personalised outreach message for ',
      contact.name,
      "."
    ] }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: panel_default.statusMsg, children: status || "Drafting\u2026" }),
    message && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "textarea",
        {
          value: message,
          onChange: (e) => setMessage(e.target.value),
          rows: 8,
          className: panel_default.textarea
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { display: "flex", gap: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: handleCopy, children: [
        copied ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CheckCheck, { size: 13 }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Copy, { size: 13 }),
        copied ? "Copied!" : "Copy"
      ] }) })
    ] })
  ] });
}

// components/network/contact-detail/ContactPrep.tsx
var import_react4 = __toESM(require_react());
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
function ContactPrep({ contact }) {
  const [prep, setPrep] = (0, import_react4.useState)("");
  const [loading, setLoading] = (0, import_react4.useState)(false);
  const [status, setStatus] = (0, import_react4.useState)("");
  const [error, setError] = (0, import_react4.useState)(null);
  const handleGenerate = (0, import_react4.useCallback)(async () => {
    setLoading(true);
    setError(null);
    setStatus("Generating\u2026");
    setPrep("");
    try {
      const res = await proxyFetch(`/agent/career/contacts/${contact.id}/prep`, { method: "POST" });
      if (!res.ok) {
        setError("Failed to start prep");
        setLoading(false);
        return;
      }
      const { jobId } = await res.json();
      const sw = navigator.serviceWorker.controller;
      if (!sw) {
        setError("Service worker not ready \u2014 try reloading.");
        setLoading(false);
        return;
      }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId, careerJobId: contact.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e) {
        const msg = e.data;
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== jobId) return;
        if (msg.status === "running") {
          setStatus(msg.statusMessage ?? "Generating\u2026");
          return;
        }
        if (msg.status === "completed") {
          setPrep(msg.result?.prep ?? "");
          setLoading(false);
        }
        if (msg.status === "failed") {
          setError(msg.error ?? "Failed to generate prep");
          setLoading(false);
        }
        bc.removeEventListener("message", onMsg);
        bc.close();
      });
    } catch {
      setError("Failed to generate prep");
      setLoading(false);
    }
  }, [contact.id]);
  const actions = /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "button",
    {
      type: "button",
      className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`,
      onClick: handleGenerate,
      disabled: loading,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TrippyIcon, { size: 13 }),
        loading ? status || "Generating\u2026" : prep ? "Regenerate" : "Generate Prep"
      ]
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CollapsiblePanel, { icon: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Lightbulb, { size: 16, style: { color: "var(--color-accent)" } }), title: "Conversation Prep", actions, children: [
    error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: panel_default.errorText, children: error }),
    !prep && !loading && !error && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: panel_default.emptyText, children: [
      'Click "Generate Prep" to get talking points, questions to ask, and what to share with ',
      contact.name,
      "."
    ] }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: panel_default.statusMsg, children: status || "Generating\u2026" }),
    prep && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: "var(--font-size-sm)", lineHeight: 1.6, color: "var(--color-text)" }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      Markdown,
      {
        remarkPlugins: [remarkGfm],
        components: {
          h2: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { style: { fontSize: "var(--font-size-sm)", fontWeight: 700, margin: "16px 0 6px", color: "var(--color-text)" }, children }),
          ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ul", { style: { margin: "4px 0 12px", paddingLeft: 18 }, children }),
          li: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("li", { style: { marginBottom: 4 }, children }),
          p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { style: { margin: "0 0 8px" }, children })
        },
        children: prep
      }
    ) })
  ] });
}

// components/career/job-detail/JobDetailPage.module.css
var JobDetailPage_default = {
  page: "JobDetailPage_page",
  stickyTop: "JobDetailPage_stickyTop",
  loading: "JobDetailPage_loading",
  grid: "JobDetailPage_grid",
  left: "JobDetailPage_left",
  right: "JobDetailPage_right",
  dangerZone: "JobDetailPage_dangerZone"
};

// components/network/contact-detail/ContactDetailPage.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
var CHANNELS = [
  { value: "email", label: "Email" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "text", label: "Text" }
];
function localDateTimeString() {
  const d = /* @__PURE__ */ new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function formatInteractionDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}
function ContactInfo({ contact, onPatch }) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0 }, children: "Contact Info" }),
    contact.email ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("a", { href: `mailto:${contact.email}`, className: Input_default.input, style: { display: "block", textDecoration: "none", color: "var(--color-text)" }, children: contact.email }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }, children: "No email on file in Google Contacts." }),
    contact.phone ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("a", { href: `tel:${contact.phone}`, className: Input_default.input, style: { display: "block", textDecoration: "none", color: "var(--color-text)" }, children: contact.phone }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }, children: "No phone on file in Google Contacts." }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0 }, children: "Preferred channel" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { display: "flex", gap: "8px" }, children: CHANNELS.map(({ value, label }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "button",
        {
          type: "button",
          onClick: () => onPatch({ preferredContact: value }),
          style: {
            fontSize: "11px",
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: "var(--radius-pill)",
            border: contact.preferredContact === value ? "2px solid var(--color-accent)" : "2px solid var(--color-border)",
            background: contact.preferredContact === value ? "color-mix(in srgb, var(--color-accent) 12%, transparent)" : "transparent",
            color: contact.preferredContact === value ? "var(--color-accent)" : "var(--color-text-muted)",
            cursor: "pointer",
            transition: "all 120ms ease"
          },
          children: label
        },
        value
      )) })
    ] })
  ] });
}
function InteractionLog({
  interactions,
  onAdd
}) {
  const [adding, setAdding] = (0, import_react5.useState)(false);
  const [date, setDate] = (0, import_react5.useState)(localDateTimeString());
  const [notes, setNotes] = (0, import_react5.useState)("");
  const notesRef = (0, import_react5.useRef)(null);
  const handleAdd = () => {
    if (!date) return;
    onAdd({ date, notes: notes.trim() || void 0 });
    setAdding(false);
    setNotes("");
    setDate(localDateTimeString());
  };
  const sorted = [...interactions].sort((a, b) => b.date.localeCompare(a.date));
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px", padding: "16px 0", borderTop: "1px solid var(--color-border)" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0 }, children: "Interactions" }),
      !adding && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "button",
        {
          type: "button",
          className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`,
          onClick: () => {
            setAdding(true);
            setTimeout(() => notesRef.current?.focus(), 0);
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Plus, { size: 13 }),
            " Log"
          ]
        }
      )
    ] }),
    adding && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "8px", padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "input",
        {
          className: Input_default.input,
          type: "datetime-local",
          value: date,
          onChange: (e) => setDate(e.target.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "textarea",
        {
          ref: notesRef,
          className: Input_default.input,
          placeholder: "Notes (optional)",
          value: notes,
          onChange: (e) => setNotes(e.target.value),
          rows: 2,
          style: { resize: "vertical", fontFamily: "inherit" }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`, onClick: handleAdd, disabled: !date, children: "Save" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: () => setAdding(false), children: "Cancel" })
      ] })
    ] }),
    sorted.length === 0 && !adding && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }, children: "No interactions logged yet." }),
    sorted.map((ix) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", gap: "10px", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Clock, { size: 12, style: { color: "var(--color-text-muted)", marginTop: 2, flexShrink: 0 } }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "2px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "11px", fontWeight: 600, color: "var(--color-text)", margin: 0 }, children: formatInteractionDate(ix.date) }),
        ix.notes && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }, children: ix.notes })
      ] })
    ] }, ix.id))
  ] });
}
function ContactDetailPage({ contactId }) {
  const router = useRouter();
  const [contact, setContact] = (0, import_react5.useState)(null);
  const [loading, setLoading] = (0, import_react5.useState)(true);
  const [notFound, setNotFound] = (0, import_react5.useState)(false);
  const [pendingStatus, setPendingStatus] = (0, import_react5.useState)(null);
  (0, import_react5.useEffect)(() => {
    proxyFetch("/agent/career/contacts").then((r) => r.ok ? r.json() : null).then((data) => {
      const found = data?.contacts?.find((c) => c.id === contactId) ?? null;
      if (!found) setNotFound(true);
      else setContact(found);
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [contactId]);
  const patchRaw = (0, import_react5.useCallback)((body) => {
    proxyFetch(`/agent/career/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then((r) => {
      if (!r.ok) console.error("[patch] failed", r.status, body);
    }).catch((e) => console.error("[patch] error", e));
  }, [contactId]);
  const patch = (0, import_react5.useCallback)((update) => {
    setContact((prev) => prev ? { ...prev, ...update } : prev);
    patchRaw(update);
  }, [patchRaw]);
  const handleStatusChange = (0, import_react5.useCallback)((status) => {
    setPendingStatus({ status, date: localDateTimeString() });
  }, []);
  const confirmStatusChange = (0, import_react5.useCallback)(() => {
    if (!pendingStatus) return;
    const interaction = { date: pendingStatus.date };
    patchRaw({ status: pendingStatus.status, addInteraction: { id: crypto.randomUUID(), ...interaction } });
    setContact((prev) => prev ? {
      ...prev,
      status: pendingStatus.status,
      lastInteractionDate: pendingStatus.date,
      interactions: [...prev.interactions ?? [], { id: crypto.randomUUID(), date: pendingStatus.date }]
    } : prev);
    setPendingStatus(null);
  }, [pendingStatus, patchRaw]);
  const handleAddInteraction = (0, import_react5.useCallback)((ix) => {
    const interaction = { id: crypto.randomUUID(), ...ix };
    patchRaw({ addInteraction: interaction });
    setContact((prev) => prev ? {
      ...prev,
      interactions: [...prev.interactions ?? [], interaction],
      lastInteractionDate: interaction.date
    } : prev);
  }, [patchRaw]);
  const handleDelete = (0, import_react5.useCallback)(async () => {
    await proxyFetch(`/agent/career/contacts/${contactId}`, { method: "DELETE" }).catch(() => {
    });
    router.push("/network");
  }, [contactId, router]);
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: JobDetailPage_default.loading, children: "Loading\u2026" });
  if (notFound || !contact) return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: JobDetailPage_default.loading, children: "Contact not found." });
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobDetailPage_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobDetailPage_default.stickyTop, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ContactHeader, { contact }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ContactStatusBar, { status: contact.status, onStatusChange: handleStatusChange }),
      pendingStatus && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--color-surface-raised)", borderBottom: "1px solid var(--color-border)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { fontSize: "12px", color: "var(--color-text-muted)", flexShrink: 0 }, children: "When did this happen?" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "input",
          {
            className: Input_default.input,
            type: "datetime-local",
            value: pendingStatus.date,
            onChange: (e) => setPendingStatus((p) => p ? { ...p, date: e.target.value } : p),
            style: { flex: 1 }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`, onClick: confirmStatusChange, children: "Save" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: () => setPendingStatus(null), children: "Cancel" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobDetailPage_default.grid, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobDetailPage_default.left, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ContactOutreach, { contact }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ContactPrep, { contact })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobDetailPage_default.right, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ContactInfo, { contact, onPatch: patch }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ContactNotes, { contact, onPatch: patch }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(InteractionLog, { interactions: contact.interactions ?? [], onAdd: handleAddInteraction }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: JobDetailPage_default.dangerZone, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            type: "button",
            className: `${Button_default.btn} ${Button_default.danger} ${Button_default.sm}`,
            onClick: handleDelete,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Trash2, { size: 13 }),
              " Remove contact"
            ]
          }
        ) })
      ] })
    ] })
  ] });
}

// react-entries/contact-detail.tsx
var import_jsx_runtime8 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  const name = u.name ?? "";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const contactId = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() ?? "");
  (0, import_client.createRoot)(document.getElementById("react-root")).render(
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(AppHeader, { userImage: u.picture ?? "", userName: name, initials, pageTitle: "Contact" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ContactDetailPage, { contactId })
    ] })
  );
}
void mount();
