import {
  CollapsiblePanel,
  JobDetailPage_default,
  JobHeader_default,
  JobStatusBar_default,
  panel_default
} from "./chunk-7ROSCENT.js";
import {
  TrippyIcon
} from "./chunk-HWKTRTVM.js";
import {
  ReadAloudButton
} from "./chunk-GBGSFNN4.js";
import {
  AppHeader,
  Link,
  Markdown,
  remarkGfm
} from "./chunk-ZLOKTPEE.js";
import "./chunk-OHWNV7E6.js";
import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  ArrowLeft,
  Bookmark,
  ChartNoAxesColumn,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheckBig,
  CircleQuestionMark,
  CircleX,
  Copy,
  ExternalLink,
  EyeOff,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  StickyNote,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  WandSparkles,
  X,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react,
  useRouter
} from "./chunk-NPORSBBQ.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/job-detail.tsx
var import_client = __toESM(require_client());

// components/career/job-detail/JobDetailPage.tsx
var import_react9 = __toESM(require_react());

// components/career/job-detail/JobHeader.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
var STATUS_COLORS = {
  saved: { bg: "var(--color-border)", color: "var(--color-text-muted)" },
  applied: { bg: "var(--color-accent)", color: "#fff" },
  interviewing: { bg: "var(--color-accent-light)", color: "var(--color-accent)" },
  offer: { bg: "rgba(76,175,80,0.12)", color: "#4caf50" },
  closed: { bg: "var(--color-border)", color: "var(--color-text-muted)" },
  rejected: { bg: "rgba(229,56,59,0.1)", color: "#e5383b" }
};
function JobHeader({ job, onPatch }) {
  const [editingTitle, setEditingTitle] = (0, import_react.useState)(false);
  const [titleDraft, setTitleDraft] = (0, import_react.useState)(job.role);
  const statusStyle = STATUS_COLORS[job.status];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: JobHeader_default.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.breadcrumb, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { href: "/career", className: JobHeader_default.backLink, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 16 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { className: JobHeader_default.crumbs, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { href: "/career", className: JobHeader_default.crumbLink, children: "Jobs" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 12, style: { opacity: 0.4 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: JobHeader_default.crumbCurrent, children: job.role })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.titleRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.titleLeft, children: [
        editingTitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.titleEdit, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              autoFocus: true,
              value: titleDraft,
              onChange: (e) => setTitleDraft(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  onPatch({ role: titleDraft.trim() });
                  setEditingTitle(false);
                }
                if (e.key === "Escape") {
                  setTitleDraft(job.role);
                  setEditingTitle(false);
                }
              },
              className: JobHeader_default.titleInput
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: JobHeader_default.iconBtn, onClick: () => {
            onPatch({ role: titleDraft.trim() });
            setEditingTitle(false);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 14 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: JobHeader_default.iconBtn, onClick: () => {
            setTitleDraft(job.role);
            setEditingTitle(false);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: JobHeader_default.titleStatic, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: JobHeader_default.title, children: job.role }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: JobHeader_default.editBtn, onClick: () => {
            setTitleDraft(job.role);
            setEditingTitle(true);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 13 }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: JobHeader_default.meta, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: JobHeader_default.company, children: job.company }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: JobHeader_default.badges, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "span",
        {
          className: JobHeader_default.statusBadge,
          style: { background: statusStyle.bg, color: statusStyle.color },
          children: job.status
        }
      ) })
    ] })
  ] });
}

// components/career/job-detail/JobStatusBar.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var STATUSES = [
  { value: "saved", label: "Saved", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Bookmark, { size: 14 }) },
  { value: "applied", label: "Applied", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CircleCheckBig, { size: 14 }) },
  { value: "interviewing", label: "Interviewing", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MessageSquare, { size: 14 }) },
  { value: "offer", label: "Offer", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Trophy, { size: 14 }) },
  { value: "rejected", label: "Rejected", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CircleX, { size: 14 }) }
];
function JobStatusBar({ status, onStatusChange }) {
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

// components/career/job-detail/JobDescription.tsx
var import_react2 = __toESM(require_react());

// components/career/JobDetailModal.module.css
var JobDetailModal_default = {
  modal: "JobDetailModal_modal",
  slideUp: "JobDetailModal_slideUp",
  header: "JobDetailModal_header",
  titleGroup: "JobDetailModal_titleGroup",
  titleInput: "JobDetailModal_titleInput",
  titleText: "JobDetailModal_titleText",
  iconBtn: "JobDetailModal_iconBtn",
  iconBtnDanger: "JobDetailModal_iconBtnDanger",
  editBtn: "JobDetailModal_editBtn",
  closeBtn: "JobDetailModal_closeBtn",
  statusBadge: "JobDetailModal_statusBadge",
  statusMenu: "JobDetailModal_statusMenu",
  statusOption: "JobDetailModal_statusOption",
  companyRow: "JobDetailModal_companyRow",
  company: "JobDetailModal_company",
  body: "JobDetailModal_body",
  section: "JobDetailModal_section",
  sectionHeader: "JobDetailModal_sectionHeader",
  sectionLabel: "JobDetailModal_sectionLabel",
  divider: "JobDetailModal_divider",
  textarea: "JobDetailModal_textarea",
  urlRow: "JobDetailModal_urlRow",
  urlInput: "JobDetailModal_urlInput",
  urlLink: "JobDetailModal_urlLink",
  urlVerified: "JobDetailModal_urlVerified",
  urlUnverified: "JobDetailModal_urlUnverified",
  urlNone: "JobDetailModal_urlNone",
  urlActions: "JobDetailModal_urlActions",
  pillBtn: "JobDetailModal_pillBtn",
  pillBtnVerify: "JobDetailModal_pillBtnVerify",
  contactList: "JobDetailModal_contactList",
  contactRow: "JobDetailModal_contactRow",
  contactInfo: "JobDetailModal_contactInfo",
  contactNameRow: "JobDetailModal_contactNameRow",
  contactName: "JobDetailModal_contactName",
  contactScore: "JobDetailModal_contactScore",
  contactTitle: "JobDetailModal_contactTitle",
  contactEmail: "JobDetailModal_contactEmail",
  contactSource: "JobDetailModal_contactSource",
  skeletonList: "JobDetailModal_skeletonList",
  skeletonRow: "JobDetailModal_skeletonRow",
  skeletonAvatar: "JobDetailModal_skeletonAvatar",
  shimmer: "JobDetailModal_shimmer",
  skeletonLines: "JobDetailModal_skeletonLines",
  skeletonLine: "JobDetailModal_skeletonLine",
  skeletonBlock: "JobDetailModal_skeletonBlock",
  markdown: "JobDetailModal_markdown",
  refinementCard: "JobDetailModal_refinementCard",
  refinementHeader: "JobDetailModal_refinementHeader",
  entryInfo: "JobDetailModal_entryInfo",
  entryTitle: "JobDetailModal_entryTitle",
  entryOrg: "JobDetailModal_entryOrg",
  entryDates: "JobDetailModal_entryDates",
  entryTypeBadge: "JobDetailModal_entryTypeBadge",
  bulletSection: "JobDetailModal_bulletSection",
  bulletLabel: "JobDetailModal_bulletLabel",
  bulletLabelAccent: "JobDetailModal_bulletLabelAccent",
  bulletOld: "JobDetailModal_bulletOld",
  bulletNew: "JobDetailModal_bulletNew",
  bulletDot: "JobDetailModal_bulletDot",
  standoutNote: "JobDetailModal_standoutNote",
  refinementActions: "JobDetailModal_refinementActions",
  acceptedBadge: "JobDetailModal_acceptedBadge",
  dismissedBadge: "JobDetailModal_dismissedBadge",
  coverLetterBox: "JobDetailModal_coverLetterBox",
  headerEditor: "JobDetailModal_headerEditor",
  headerGrid: "JobDetailModal_headerGrid",
  headerInput: "JobDetailModal_headerInput",
  appQuestionCard: "JobDetailModal_appQuestionCard",
  appQuestion: "JobDetailModal_appQuestion",
  appAnswer: "JobDetailModal_appAnswer",
  statusMsg: "JobDetailModal_statusMsg",
  fadeOscillate: "JobDetailModal_fadeOscillate",
  emptyText: "JobDetailModal_emptyText",
  errorText: "JobDetailModal_errorText",
  inputRow: "JobDetailModal_inputRow",
  fadeIn: "JobDetailModal_fadeIn"
};

// components/career/job-detail/JobDescription.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function JobDescription({ job, onPatch }) {
  const [jdText, setJdText] = (0, import_react2.useState)(job.jd ?? "");
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [editingUrl, setEditingUrl] = (0, import_react2.useState)(false);
  const [urlDraft, setUrlDraft] = (0, import_react2.useState)(job.url ?? "");
  const handleFetchJd = (0, import_react2.useCallback)(async () => {
    if (!job.url) return;
    setLoading(true);
    try {
      const res = await proxyFetch("/agent/career/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: job.url, jobId: job.id })
      });
      const text = res.ok ? (await res.json()).text ?? "Could not extract job description." : "Failed to load \u2014 try opening the link directly.";
      setJdText(text);
      onPatch({ jd: text });
    } catch {
      setJdText("Failed to load \u2014 try opening the link directly.");
    } finally {
      setLoading(false);
    }
  }, [job.url, job.id, onPatch]);
  const actions = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
    !jdText && job.urlVerified && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: handleFetchJd, disabled: loading, children: loading ? "Loading\u2026" : "Load JD" }),
    jdText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ReadAloudButton, { text: jdText, className: JobDetailModal_default.iconBtn, iconSize: 14 })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    CollapsiblePanel,
    {
      icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FileText, { size: 16, style: { color: "var(--color-accent)" } }),
      title: "Job Description",
      actions,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: JobHeader_default.urlRow, children: editingUrl ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "input",
            {
              autoFocus: true,
              type: "url",
              value: urlDraft,
              onChange: (e) => setUrlDraft(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  onPatch({ url: urlDraft.trim() });
                  setEditingUrl(false);
                }
                if (e.key === "Escape") {
                  setUrlDraft(job.url ?? "");
                  setEditingUrl(false);
                }
              },
              placeholder: "https://...",
              className: JobHeader_default.urlInput
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: JobHeader_default.iconBtn, onClick: () => {
            onPatch({ url: urlDraft.trim() });
            setEditingUrl(false);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Check, { size: 13 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: JobHeader_default.iconBtn, onClick: () => {
            setUrlDraft(job.url ?? "");
            setEditingUrl(false);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(X, { size: 13 }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          job.url ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("a", { href: job.url, target: "_blank", rel: "noopener noreferrer", className: `${JobHeader_default.urlText} ${job.urlVerified ? JobHeader_default.urlVerified : JobHeader_default.urlUnverified}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ExternalLink, { size: 11, style: { flexShrink: 0 } }),
            job.url
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: JobHeader_default.urlNone, children: "No URL set" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: JobHeader_default.urlActions, children: [
            !job.urlVerified && job.url && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: JobHeader_default.pillBtn, onClick: () => onPatch({ urlVerified: true }), children: "Mark verified" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: JobHeader_default.pillBtn, onClick: () => {
              setUrlDraft(job.url ?? "");
              setEditingUrl(true);
            }, children: job.url ? "Update URL" : "Add URL" })
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "textarea",
          {
            value: jdText,
            onChange: (e) => setJdText(e.target.value),
            onBlur: () => {
              if (jdText !== (job.jd ?? "")) onPatch({ jd: jdText });
            },
            placeholder: job.url ? "Paste or load the job description\u2026" : "No URL saved \u2014 add a link in the header to load the JD.",
            className: panel_default.textarea,
            rows: 10
          }
        )
      ]
    }
  );
}

// components/career/job-detail/JobOverlaps.tsx
var import_react3 = __toESM(require_react());
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
var SECTION_PATTERN = [
  ["overlaps", /^#{1,3}\s*\*{0,2}overlaps?\*{0,2}:?\s*$/i],
  ["gaps", /^#{1,3}\s*\*{0,2}gaps?\*{0,2}:?\s*$/i],
  ["positioning", /^#{1,3}\s*\*{0,2}positioning\*{0,2}:?\s*$/i]
];
function matchSection(line) {
  for (const [tab, re] of SECTION_PATTERN) {
    if (re.test(line.trim())) return tab;
  }
  const stripped = line.replace(/[*#\s:]/g, "");
  if (/^overlaps?$/i.test(stripped)) return "overlaps";
  if (/^gaps?$/i.test(stripped)) return "gaps";
  if (/^positioning$/i.test(stripped)) return "positioning";
  return null;
}
function parseOverlaps(text) {
  const sections = { overlaps: "", gaps: "", positioning: "" };
  const lines = text.split("\n");
  let current = null;
  const buckets = { overlaps: [], gaps: [], positioning: [] };
  for (const line of lines) {
    const tab = matchSection(line);
    if (tab) {
      current = tab;
      const inlineContent = line.replace(/^#{1,3}\s*/, "").replace(/\*\*(overlaps?|gaps?|positioning)\*\*:?/i, "").trim();
      if (inlineContent) buckets[current].push(inlineContent);
    } else if (current) {
      buckets[current].push(line);
    }
  }
  for (const tab of ["overlaps", "gaps", "positioning"]) {
    sections[tab] = buckets[tab].join("\n").trim();
  }
  return sections;
}
function JobOverlaps({ job, onPatch }) {
  const [overlapsText, setOverlapsText] = (0, import_react3.useState)(job.overlaps ?? null);
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)(false);
  const [activeTab, setActiveTab] = (0, import_react3.useState)("overlaps");
  const handleFindOverlaps = (0, import_react3.useCallback)(async () => {
    if (!job.jd) return;
    setLoading(true);
    setError(false);
    setOverlapsText(null);
    try {
      const res = await proxyFetch("/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I'm applying for a ${job.role} role at ${job.company}. Here is the job description:

${job.jd}

Using my full career history (start from my earliest full-time position when calculating experience \u2014 full-time co-ops count), produce an overlap analysis using the required output format from the depth-positioning rule: **Overlaps** bullet points, **Gaps** bullet points each with sub-bullets on how to address them, and **Positioning** bullet points with first-person lift-and-use language. Nothing else.`,
          skill: "executive-coach"
        })
      });
      const { jobId } = await res.json();
      while (true) {
        await new Promise((r) => setTimeout(r, 800));
        const statusRes = await proxyFetch(`/agent/chat/status/${jobId}`);
        if (!statusRes.ok) continue;
        const agentJob = await statusRes.json();
        if (agentJob.status === "completed") {
          const result = agentJob.result ?? "No overlaps found.";
          setOverlapsText(result);
          onPatch({ overlaps: result });
          break;
        }
        if (agentJob.status === "failed") {
          setError(true);
          break;
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [job, onPatch]);
  const analyzeBtn = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "button",
    {
      type: "button",
      className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`,
      onClick: handleFindOverlaps,
      disabled: loading,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TrippyIcon, { sizeClass: "h-3.5 w-3.5" }),
        loading ? "Analyzing\u2026" : overlapsText ? "Re-analyze" : "Find Overlaps"
      ]
    }
  );
  const tabBar = !loading && overlapsText ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: panel_default.tabs, children: ["overlaps", "gaps", "positioning"].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "button",
    {
      type: "button",
      className: `${panel_default.tab} ${activeTab === tab ? panel_default.tabActive : ""}`,
      onClick: () => {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        setActiveTab(tab);
      },
      children: tab.charAt(0).toUpperCase() + tab.slice(1)
    },
    tab
  )) }) : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    CollapsiblePanel,
    {
      icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ChartNoAxesColumn, { size: 16, style: { color: "var(--color-accent)" } }),
      title: "Overlap Analysis",
      actions: analyzeBtn,
      subheader: tabBar,
      children: [
        loading && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: panel_default.skeletonList, children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: panel_default.skeleton, style: { width: i === 4 ? "60%" : "100%" } }, i)) }),
        !loading && error && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: panel_default.errorText, children: "Couldn't analyze overlaps \u2014 try again." }),
        !loading && overlapsText && (() => {
          const sections = parseOverlaps(overlapsText);
          const content = sections[activeTab];
          return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ReadAloudButton, { text: content.replace(/[#*`_~>\-]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim(), className: JobDetailModal_default.iconBtn, iconSize: 14 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Markdown, { remarkPlugins: [remarkGfm], components: {
              p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { marginBottom: 8, lineHeight: 1.6 }, children }),
              ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { style: { margin: "6px 0", paddingLeft: 20 }, children }),
              ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ol", { style: { margin: "6px 0", paddingLeft: 20 }, children }),
              li: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("li", { style: { marginBottom: 2, lineHeight: 1.5 }, children }),
              strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { style: { color: "var(--color-text)", fontWeight: 700 }, children })
            }, children: content || "_No content parsed for this section._" })
          ] });
        })(),
        !loading && !error && !overlapsText && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: panel_default.emptyText, children: 'Click "Find Overlaps" to see how your background aligns with this role.' })
      ]
    }
  );
}

// components/career/job-detail/JobNotes.tsx
var import_react4 = __toESM(require_react());
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
function JobNotes({ job, onPatch }) {
  const [notes, setNotes] = (0, import_react4.useState)(job.notes ?? "");
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CollapsiblePanel, { icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(StickyNote, { size: 16, style: { color: "var(--color-accent)" } }), title: "Private Notes", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "textarea",
    {
      value: notes,
      onChange: (e) => setNotes(e.target.value),
      onBlur: () => {
        if (notes !== (job.notes ?? "")) onPatch({ notes });
      },
      placeholder: "Add private notes about interview prep, salary discussions, or company research\u2026",
      rows: 6,
      className: panel_default.textarea
    }
  ) });
}

// components/career/job-detail/JobContacts.tsx
var import_react5 = __toESM(require_react());

// components/career/job-detail/JobContacts.module.css
var JobContacts_default = {
  list: "JobContacts_list",
  row: "JobContacts_row",
  avatar: "JobContacts_avatar",
  info: "JobContacts_info",
  name: "JobContacts_name",
  title: "JobContacts_title",
  email: "JobContacts_email",
  link: "JobContacts_link",
  skeletonRow: "JobContacts_skeletonRow",
  skeletonAvatar: "JobContacts_skeletonAvatar",
  shimmer: "JobContacts_shimmer"
};

// components/career/job-detail/JobContacts.tsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
function JobContacts({ job }) {
  const [contacts, setContacts] = (0, import_react5.useState)([]);
  const [loading, setLoading] = (0, import_react5.useState)(false);
  const [error, setError] = (0, import_react5.useState)(false);
  const [saved, setSaved] = (0, import_react5.useState)(/* @__PURE__ */ new Set());
  const [saving, setSaving] = (0, import_react5.useState)(/* @__PURE__ */ new Set());
  const handleSave = (0, import_react5.useCallback)(async (c, i) => {
    setSaving((prev) => new Set(prev).add(i));
    try {
      const res = await proxyFetch("/agent/career/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name,
          role: c.title ?? "Unknown role",
          company: c.company ?? job.company,
          email: c.email ?? void 0,
          linkedInUrl: c.url ?? void 0,
          source: "find_people"
        })
      });
      if (res.ok) setSaved((prev) => new Set(prev).add(i));
    } finally {
      setSaving((prev) => {
        const s = new Set(prev);
        s.delete(i);
        return s;
      });
    }
  }, [job.company]);
  const handleFindPeople = (0, import_react5.useCallback)(async () => {
    setLoading(true);
    setError(false);
    setContacts([]);
    try {
      const res = await proxyFetch("/agent/career/find-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: job.company, role: job.role })
      });
      if (!res.ok) {
        setError(true);
        setLoading(false);
        return;
      }
      const { jobId } = await res.json();
      const sw = await navigator.serviceWorker.ready;
      sw.active?.postMessage({ type: "START_FIND_PEOPLE_POLL", jobId });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e) {
        const msg = e.data;
        if (msg.type !== "FIND_PEOPLE_UPDATE" || msg.jobId !== jobId) return;
        if (msg.status === "completed") {
          setContacts((msg.contacts ?? []).slice(0, 6));
          setLoading(false);
          bc.removeEventListener("message", onMsg);
          bc.close();
        } else if (msg.status === "failed") {
          setError(true);
          setLoading(false);
          bc.removeEventListener("message", onMsg);
          bc.close();
        }
      });
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [job.company, job.role]);
  const actions = /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "button",
    {
      type: "button",
      className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`,
      onClick: handleFindPeople,
      disabled: loading,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Users, { size: 13 }),
        loading ? "Searching\u2026" : "Find People"
      ]
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    CollapsiblePanel,
    {
      icon: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Users, { size: 16, style: { color: "var(--color-accent)" } }),
      title: "Network",
      actions,
      children: [
        loading && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: panel_default.skeletonList, children: [1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobContacts_default.skeletonRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobContacts_default.skeletonAvatar }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: panel_default.skeleton, style: { width: "55%", height: 12 } }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: panel_default.skeleton, style: { width: "75%", height: 10 } })
          ] })
        ] }, i)) }),
        !loading && error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: panel_default.errorText, children: "Couldn't find contacts \u2014 try searching on LinkedIn directly." }),
        !loading && !error && contacts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: panel_default.emptyText, children: [
          'Click "Find People" to discover relevant contacts at ',
          job.company,
          "."
        ] }),
        !loading && !error && contacts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobContacts_default.list, children: contacts.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobContacts_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobContacts_default.avatar, children: c.name.charAt(0).toUpperCase() }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobContacts_default.info, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: JobContacts_default.name, children: c.name }),
            c.title && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: JobContacts_default.title, children: [
              c.title,
              c.company ? ` \xB7 ${c.company}` : ""
            ] }),
            c.email && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("a", { href: `mailto:${c.email}`, className: JobContacts_default.email, children: c.email })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
            c.url && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("a", { href: c.url, target: "_blank", rel: "noopener noreferrer", className: JobContacts_default.link, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ExternalLink, { size: 14 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "button",
              {
                type: "button",
                className: `${Button_default.btn} ${saved.has(i) ? Button_default.primary : Button_default.ghost} ${Button_default.sm}`,
                onClick: () => handleSave(c, i),
                disabled: saved.has(i) || saving.has(i),
                title: saved.has(i) ? "Saved to contacts" : "Save to contacts",
                children: saved.has(i) ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Check, { size: 13 }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(UserPlus, { size: 13 })
              }
            )
          ] })
        ] }, i)) })
      ]
    }
  );
}

// components/career/job-detail/JobResumeReview.tsx
var import_react6 = __toESM(require_react());

// components/career/job-detail/JobResumeReview.module.css
var JobResumeReview_default = {
  card: "JobResumeReview_card",
  cardHeader: "JobResumeReview_cardHeader",
  entryTitle: "JobResumeReview_entryTitle",
  entryOrg: "JobResumeReview_entryOrg",
  entryDates: "JobResumeReview_entryDates",
  typeBadge: "JobResumeReview_typeBadge",
  bulletSection: "JobResumeReview_bulletSection",
  bulletLabel: "JobResumeReview_bulletLabel",
  bulletLabelAccent: "JobResumeReview_bulletLabelAccent",
  bulletOld: "JobResumeReview_bulletOld",
  bulletNew: "JobResumeReview_bulletNew",
  bulletDot: "JobResumeReview_bulletDot",
  standoutNote: "JobResumeReview_standoutNote",
  actions: "JobResumeReview_actions",
  acceptedBadge: "JobResumeReview_acceptedBadge",
  dismissedBadge: "JobResumeReview_dismissedBadge",
  headerEditor: "JobResumeReview_headerEditor",
  headerGrid: "JobResumeReview_headerGrid",
  headerInput: "JobResumeReview_headerInput"
};

// components/career/job-detail/JobResumeReview.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
var HEADER_KEY = "resume-header";
var SECTION_LABELS = { work: "Experience", education: "Education", certification: "Certifications", award: "Awards & Recognition", club: "Leadership & Activities", project: "Projects" };
var SECTION_ORDER = ["work", "education", "certification", "award", "club", "project"];
function JobResumeReview({ job, onPatch }) {
  const [refinements, setRefinements] = (0, import_react6.useState)(job.refinements ?? null);
  const [loading, setLoading] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const [status, setStatus] = (0, import_react6.useState)("");
  const [showHeaderEditor, setShowHeaderEditor] = (0, import_react6.useState)(false);
  const [resumeHeader, setResumeHeader] = (0, import_react6.useState)(() => {
    try {
      return JSON.parse(localStorage.getItem(HEADER_KEY) ?? "{}");
    } catch {
      return {};
    }
  });
  const handleRunReview = (0, import_react6.useCallback)(async () => {
    setLoading(true);
    setError(null);
    setStatus("Reviewing\u2026");
    setRefinements(null);
    onPatch({ refinements: void 0, research: void 0 });
    await proxyFetch(`/agent/career/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refinements: null, research: null }) }).catch(() => {
    });
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/review`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Review failed");
        setLoading(false);
        return;
      }
      const { jobId: phaseJobId } = await res.json();
      const sw = navigator.serviceWorker.controller;
      if (!sw) {
        setError("Service worker not ready \u2014 try reloading.");
        setLoading(false);
        return;
      }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e) {
        const msg = e.data;
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") {
          setStatus(msg.statusMessage ?? "Reviewing\u2026");
          return;
        }
        if (msg.status === "completed") {
          const rf = msg.result?.refinements ?? null;
          setRefinements(rf);
          setLoading(false);
          if (rf) onPatch({ refinements: rf });
        }
        if (msg.status === "failed") {
          setError(msg.error ?? "Review failed");
          setLoading(false);
        }
        bc.removeEventListener("message", onMsg);
        bc.close();
      });
    } catch {
      setError("Review failed");
      setLoading(false);
    }
  }, [job.id, onPatch]);
  const handleAccept = (0, import_react6.useCallback)((entryId) => {
    const updated = refinements?.map((r) => r.entryId === entryId ? { ...r, accepted: true } : r) ?? null;
    setRefinements(updated);
    onPatch({ refinements: updated ?? void 0 });
  }, [refinements, onPatch]);
  const handleDismiss = (0, import_react6.useCallback)((entryId) => {
    const updated = refinements?.map((r) => r.entryId === entryId ? { ...r, dismissed: true } : r) ?? null;
    setRefinements(updated);
    onPatch({ refinements: updated ?? void 0 });
  }, [refinements, onPatch]);
  const handleExportResume = (0, import_react6.useCallback)(() => {
    if (!refinements) return;
    const all = refinements.filter((r) => r.accepted && !r.dismissed);
    if (!all.length) return;
    try {
      localStorage.setItem(HEADER_KEY, JSON.stringify(resumeHeader));
    } catch {
    }
    const parseDate = (d) => {
      if (!d) return 0;
      const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
      const parts = d.trim().split(/\s+/);
      if (parts.length === 2) {
        const mon = months[parts[0].toLowerCase().slice(0, 3)] ?? 0;
        const yr = parseInt(parts[1], 10) || 0;
        return yr * 100 + mon;
      }
      return (parseInt(parts[0], 10) || 0) * 100;
    };
    const groups = /* @__PURE__ */ new Map();
    for (const r of all) {
      const type = r.entryType ?? "other";
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(r);
    }
    for (const entries of groups.values()) entries.sort((a, b) => parseDate(b.entryStartDate) - parseDate(a.entryStartDate));
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerLines = [];
    if (resumeHeader.name) headerLines.push(`<div class="resume-name">${esc(resumeHeader.name)}</div>`);
    const contactParts = [];
    if (resumeHeader.phone) contactParts.push(esc(resumeHeader.phone));
    if (resumeHeader.email) contactParts.push(`<a href="mailto:${esc(resumeHeader.email)}">${esc(resumeHeader.email)}</a>`);
    if (resumeHeader.linkedin) contactParts.push(`<a href="${esc(resumeHeader.linkedin)}">${esc(resumeHeader.linkedin.replace(/^https?:\/\//, ""))}</a>`);
    if (contactParts.length) headerLines.push(`<div class="resume-contact">${contactParts.join(" | ")}</div>`);
    let body = "";
    for (const type of SECTION_ORDER) {
      const entries = groups.get(type);
      if (!entries?.length) continue;
      body += `<h2>${SECTION_LABELS[type] ?? "Other"}</h2>`;
      for (const r of entries) {
        const dates = [r.entryStartDate, r.entryEndDate].filter(Boolean).join(" \u2013 ");
        body += `<div class="entry"><div class="entry-top"><span class="entry-org">${esc(r.entryOrganization)}</span>${r.entryLocation ? `<span class="entry-location">${esc(r.entryLocation)}</span>` : ""}</div><div class="entry-role-line"><span class="entry-role">${esc(r.entryTitle)}</span>${dates ? `<span class="entry-dates">${esc(dates)}</span>` : ""}</div><ul>${r.refinedBullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`;
      }
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(job.role)} at ${esc(job.company)} \u2014 Resume</title><style>*{box-sizing:border-box}body{font-family:"Times New Roman",Times,serif;font-size:11pt;margin:0.85in 1in;color:#000}.resume-name{text-align:center;font-size:18pt;font-weight:bold;margin-bottom:2px}.resume-contact{text-align:center;font-size:10pt;margin-bottom:14px}.resume-contact a{color:#000;text-decoration:none}h2{font-size:11pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;border-bottom:1.5px solid #000;padding-bottom:1px;margin-top:14px;margin-bottom:6px}.entry{margin-bottom:10px}.entry-top{display:flex;justify-content:space-between;align-items:baseline}.entry-org{font-weight:bold;font-size:11pt}.entry-location{font-size:10pt}.entry-role-line{display:flex;justify-content:space-between;align-items:baseline}.entry-role{font-style:italic;font-size:11pt}.entry-dates{font-size:10pt}ul{margin:3px 0 0;padding-left:20px}li{margin-bottom:2px;line-height:1.35}@media print{@page{margin:.5in;size:letter}body{margin:0}}</style></head><body>${headerLines.join("\n")}${body}</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    const reset = refinements.map((r) => ({ ...r, accepted: false, dismissed: false }));
    setRefinements(reset);
    onPatch({ refinements: reset });
    setShowHeaderEditor(false);
  }, [job, refinements, resumeHeader, onPatch]);
  const actions = /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
    refinements?.some((r) => r.accepted && !r.dismissed) && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: () => setShowHeaderEditor((v) => !v), children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FileText, { size: 13 }),
      " Export"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: handleRunReview, disabled: loading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TrippyIcon, { sizeClass: "h-3.5 w-3.5" }),
      loading ? "Reviewing\u2026" : refinements ? "Re-review" : "Review Resume"
    ] })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    CollapsiblePanel,
    {
      icon: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(WandSparkles, { size: 16, style: { color: "var(--color-accent)" } }),
      title: "Resume Recommendations",
      actions,
      children: [
        showHeaderEditor && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobResumeReview_default.headerEditor, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: panel_default.sectionLabel, children: "Resume Header" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: JobResumeReview_default.headerGrid, children: ["name", "email", "phone", "linkedin", "location"].map((field) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "input",
            {
              type: "text",
              value: resumeHeader[field] ?? "",
              onChange: (e) => setResumeHeader((h) => ({ ...h, [field]: e.target.value })),
              placeholder: { name: "Full name", email: "Email", phone: "Phone", linkedin: "LinkedIn URL", location: "City, State" }[field],
              className: JobResumeReview_default.headerInput
            },
            field
          )) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`, onClick: handleExportResume, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FileText, { size: 13 }),
            " Generate PDF"
          ] })
        ] }),
        loading && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: panel_default.skeletonList, children: [
          status && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: panel_default.statusMsg, children: status }),
          [1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: panel_default.skeleton, style: { height: 60 } }, i))
        ] }),
        !loading && error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: panel_default.errorText, children: error }),
        !loading && refinements && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: refinements.map((r) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobResumeReview_default.card, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobResumeReview_default.cardHeader, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: JobResumeReview_default.entryTitle, children: r.entryTitle }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: JobResumeReview_default.entryOrg, children: r.entryOrganization }),
              (r.entryStartDate || r.entryEndDate) && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: JobResumeReview_default.entryDates, children: [r.entryStartDate, r.entryEndDate].filter(Boolean).join(" \u2013 ") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: JobResumeReview_default.typeBadge, children: r.entryType })
          ] }),
          r.originalBullets.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobResumeReview_default.bulletSection, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: JobResumeReview_default.bulletLabel, children: "Before" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("ul", { style: { margin: 0, paddingLeft: 16 }, children: r.originalBullets.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("li", { className: JobResumeReview_default.bulletOld, children: b }, i)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobResumeReview_default.bulletSection, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: `${JobResumeReview_default.bulletLabel} ${JobResumeReview_default.bulletLabelAccent}`, children: "Trippy's Suggestions" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("ul", { style: { margin: 0, padding: 0, listStyle: "none" }, children: r.refinedBullets.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { className: JobResumeReview_default.bulletNew, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: JobResumeReview_default.bulletDot, children: "\xB7" }),
              b
            ] }, i)) })
          ] }),
          r.standoutNote && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: JobResumeReview_default.standoutNote, children: r.standoutNote }),
          !r.accepted && !r.dismissed && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: JobResumeReview_default.actions, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.sm}`, style: { background: "rgba(52,211,153,0.12)", color: "#34d399", borderRadius: 999 }, onClick: () => handleAccept(r.entryId), children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Check, { size: 11 }),
              " Accept"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: () => handleDismiss(r.entryId), children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(X, { size: 11 }),
              " Dismiss"
            ] })
          ] }),
          r.accepted && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: JobResumeReview_default.acceptedBadge, children: "Accepted" }),
          r.dismissed && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: JobResumeReview_default.dismissedBadge, children: "Dismissed" })
        ] }, r.entryId)) }),
        !loading && !error && !refinements && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: panel_default.emptyText, children: "Review your resume against this role to get Trippy's targeted bullet recommendations." })
      ]
    }
  );
}

// components/career/job-detail/JobCoverLetter.tsx
var import_react7 = __toESM(require_react());

// components/career/job-detail/JobCoverLetter.module.css
var JobCoverLetter_default = {
  box: "JobCoverLetter_box"
};

// components/career/job-detail/JobCoverLetter.tsx
var import_jsx_runtime8 = __toESM(require_jsx_runtime());
var HEADER_KEY2 = "resume-header";
function JobCoverLetter({ job, onPatch }) {
  const [coverLetter, setCoverLetter] = (0, import_react7.useState)(job.coverLetter ?? null);
  const [loading, setLoading] = (0, import_react7.useState)(false);
  const [error, setError] = (0, import_react7.useState)(null);
  const [status, setStatus] = (0, import_react7.useState)("");
  const [copied, setCopied] = (0, import_react7.useState)(false);
  const resumeHeader = (() => {
    try {
      return JSON.parse(localStorage.getItem(HEADER_KEY2) ?? "{}");
    } catch {
      return {};
    }
  })();
  const handleDraft = (0, import_react7.useCallback)(async () => {
    setLoading(true);
    setError(null);
    setStatus("Drafting\u2026");
    setCoverLetter(null);
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/cover-letter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ header: resumeHeader }) });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to draft cover letter");
        setLoading(false);
        return;
      }
      const { jobId: phaseJobId } = await res.json();
      const sw = navigator.serviceWorker.controller;
      if (!sw) {
        setError("Service worker not ready \u2014 try reloading.");
        setLoading(false);
        return;
      }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e) {
        const msg = e.data;
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") {
          setStatus(msg.statusMessage ?? "Drafting\u2026");
          return;
        }
        if (msg.status === "completed") {
          const cl = msg.result?.coverLetter ?? null;
          setCoverLetter(cl);
          setLoading(false);
          if (cl) onPatch({ coverLetter: cl });
        }
        if (msg.status === "failed") {
          setError(msg.error ?? "Failed to draft cover letter");
          setLoading(false);
        }
        bc.removeEventListener("message", onMsg);
        bc.close();
      });
    } catch {
      setError("Failed to draft cover letter");
      setLoading(false);
    }
  }, [job.id, resumeHeader, onPatch]);
  const handleExport = (0, import_react7.useCallback)(() => {
    if (!coverLetter) return;
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const paragraphs = coverLetter.split(/\n\n+/).map((p) => `<p>${p.split("\n").map((l) => esc(l)).join("<br>")}</p>`).join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter</title><style>body{font-family:"Times New Roman",serif;font-size:12pt;margin:1in;color:#000;line-height:1.5}p{margin:0 0 12px}@media print{@page{margin:1in}body{margin:0}}</style></head><body>${paragraphs}</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }, [coverLetter]);
  const actions = /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
    coverLetter && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: () => {
        navigator.clipboard.writeText(coverLetter).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2e3);
        }).catch(() => {
        });
      }, children: [
        copied ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(CheckCheck, { size: 13 }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Copy, { size: 13 }),
        copied ? "Copied" : "Copy"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: handleExport, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(FileText, { size: 13 }),
        " Export"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ReadAloudButton, { text: coverLetter, className: JobDetailModal_default.iconBtn, iconSize: 14 })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: handleDraft, disabled: loading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(TrippyIcon, { sizeClass: "h-3.5 w-3.5" }),
      loading ? status || "Drafting\u2026" : coverLetter ? "Regenerate" : "Draft Cover Letter"
    ] })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    CollapsiblePanel,
    {
      icon: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Mail, { size: 16, style: { color: "var(--color-accent)" } }),
      title: "Cover Letter",
      actions,
      children: [
        loading && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: panel_default.skeletonList, children: [1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: panel_default.skeleton, style: { width: "100%", height: 16 } }, i)) }),
        !loading && error && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: panel_default.errorText, children: error }),
        !loading && coverLetter && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: JobCoverLetter_default.box, children: coverLetter }),
        !loading && !error && !coverLetter && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: panel_default.emptyText, children: "Draft a tailored cover letter using your resume experience and this role's requirements." })
      ]
    }
  );
}

// components/career/job-detail/JobAppQuestions.tsx
var import_react8 = __toESM(require_react());

// components/career/job-detail/JobAppQuestions.module.css
var JobAppQuestions_default = {
  card: "JobAppQuestions_card",
  question: "JobAppQuestions_question",
  answer: "JobAppQuestions_answer"
};

// components/career/job-detail/JobAppQuestions.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime());
function JobAppQuestions({ job, onPatch }) {
  const [questions, setQuestions] = (0, import_react8.useState)(job.app_questions ?? []);
  const [input, setInput] = (0, import_react8.useState)("");
  const [loading, setLoading] = (0, import_react8.useState)(false);
  const [status, setStatus] = (0, import_react8.useState)("");
  const [error, setError] = (0, import_react8.useState)(null);
  const [regenIndex, setRegenIndex] = (0, import_react8.useState)(null);
  const handleGenerate = (0, import_react8.useCallback)(async (question, index) => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setStatus("Writing your response\u2026");
    if (typeof index === "number") setRegenIndex(index);
    try {
      const res = await proxyFetch(`/agent/career/jobs/${job.id}/app-question`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, index }) });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to generate response");
        setLoading(false);
        setRegenIndex(null);
        return;
      }
      const { jobId: phaseJobId } = await res.json();
      const sw = navigator.serviceWorker.controller;
      if (!sw) {
        setError("Service worker not ready \u2014 try reloading.");
        setLoading(false);
        setRegenIndex(null);
        return;
      }
      sw.postMessage({ type: "START_CAREER_PIPELINE_POLL", jobId: phaseJobId, careerJobId: job.id });
      const bc = new BroadcastChannel("route-jobs");
      bc.addEventListener("message", function onMsg(e) {
        const msg = e.data;
        if (msg.type !== "CAREER_PIPELINE_UPDATE" || msg.jobId !== phaseJobId) return;
        if (msg.status === "running") {
          setStatus(msg.statusMessage ?? "Writing\u2026");
          return;
        }
        if (msg.status === "completed") {
          const q = msg.result?.question;
          const r = msg.result?.response;
          setQuestions((prev) => {
            const next = [...prev];
            if (typeof index === "number" && index >= 0 && index < next.length) next[index] = [q, r];
            else next.push([q, r]);
            queueMicrotask(() => onPatch({ app_questions: next }));
            return next;
          });
          setInput("");
          setLoading(false);
          setRegenIndex(null);
        }
        if (msg.status === "failed") {
          setError(msg.error ?? "Failed to generate response");
          setLoading(false);
          setRegenIndex(null);
        }
        bc.removeEventListener("message", onMsg);
        bc.close();
      });
    } catch {
      setError("Failed to generate response");
      setLoading(false);
      setRegenIndex(null);
    }
  }, [job.id, onPatch]);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    CollapsiblePanel,
    {
      icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(CircleQuestionMark, { size: 16, style: { color: "var(--color-accent)" } }),
      title: "Application Questions",
      children: [
        questions.map(([q, r], i) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: JobAppQuestions_default.card, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: JobAppQuestions_default.question, children: q }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: JobAppQuestions_default.answer, children: r }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", gap: 8, paddingTop: 4, alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, disabled: loading, onClick: () => handleGenerate(q, i), children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(TrippyIcon, { sizeClass: "h-3 w-3" }),
              loading && regenIndex === i ? status || "Regenerating\u2026" : "Regenerate"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, disabled: loading, onClick: () => {
              const next = questions.filter((_, j) => j !== i);
              setQuestions(next);
              onPatch({ app_questions: next });
            }, children: "Delete" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ReadAloudButton, { text: r, className: JobDetailModal_default.iconBtn, iconSize: 14 })
          ] })
        ] }, i)),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "textarea",
          {
            className: panel_default.textarea,
            style: { minHeight: "unset" },
            rows: 3,
            placeholder: "Paste an application question\u2026",
            value: input,
            onChange: (e) => setInput(e.target.value),
            disabled: loading
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, disabled: loading || !input.trim(), onClick: () => handleGenerate(input), children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(TrippyIcon, { sizeClass: "h-3.5 w-3.5" }),
          loading && regenIndex === null ? status || "Generating\u2026" : "Generate Response"
        ] }) }),
        error && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: panel_default.errorText, style: { marginTop: 8 }, children: error })
      ]
    }
  );
}

// components/career/job-detail/JobDetailPage.tsx
var import_jsx_runtime10 = __toESM(require_jsx_runtime());
function JobDetailPage({ jobId }) {
  const router = useRouter();
  const [job, setJob] = (0, import_react9.useState)(null);
  const [loading, setLoading] = (0, import_react9.useState)(true);
  const [notFound, setNotFound] = (0, import_react9.useState)(false);
  (0, import_react9.useEffect)(() => {
    proxyFetch("/agent/career/jobs").then((r) => r.ok ? r.json() : null).then((data) => {
      const found = data?.jobs?.find((j) => j.id === jobId) ?? null;
      if (!found) setNotFound(true);
      else setJob(found);
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [jobId]);
  const patch = (0, import_react9.useCallback)(async (update) => {
    setJob((prev) => prev ? { ...prev, ...update } : prev);
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update)
    }).catch(() => {
    });
  }, [jobId]);
  const handleDelete = (0, import_react9.useCallback)(async () => {
    await proxyFetch(`/agent/career/jobs/${jobId}`, { method: "DELETE" }).catch(() => {
    });
    router.push("/career");
  }, [jobId, router]);
  const handleSkipCompany = (0, import_react9.useCallback)(async () => {
    if (!job) return;
    await proxyFetch("/agent/career/skip-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: job.company })
    }).catch(() => {
    });
    router.push("/career");
  }, [job, router]);
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: JobDetailPage_default.loading, children: "Loading\u2026" });
  if (notFound || !job) return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: JobDetailPage_default.loading, children: "Job not found." });
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: JobDetailPage_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: JobDetailPage_default.stickyTop, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(JobHeader, { job, onPatch: patch }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        JobStatusBar,
        {
          status: job.status,
          onStatusChange: (status) => patch({ status })
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: JobDetailPage_default.grid, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: JobDetailPage_default.left, children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(JobDescription, { job, onPatch: patch }),
        job.jd && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(JobOverlaps, { job, onPatch: patch }),
        job.jd && job.overlaps && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(JobResumeReview, { job, onPatch: patch }),
        job.jd && job.refinements && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(JobCoverLetter, { job, onPatch: patch })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: JobDetailPage_default.right, children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(JobNotes, { job, onPatch: patch }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(JobContacts, { job }),
        !!job.coverLetter && job.refinements && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(JobAppQuestions, { job, onPatch: patch }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: JobDetailPage_default.dangerZone, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.danger} ${Button_default.sm}`, onClick: handleDelete, children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Trash2, { size: 13 }),
            " Delete job"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: handleSkipCompany, children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(EyeOff, { size: 13 }),
            " Skip company"
          ] })
        ] })
      ] })
    ] })
  ] });
}

// react-entries/job-detail.tsx
var import_jsx_runtime11 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  const initials = (u.name ?? "?").charAt(0).toUpperCase();
  const jobId = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() ?? "");
  (0, import_client.createRoot)(document.getElementById("react-root")).render(
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(AppHeader, { userImage: u.picture ?? "", userName: u.name ?? "", initials }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(JobDetailPage, { jobId })
    ] })
  );
}
void mount();
