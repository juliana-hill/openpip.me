import {
  CalendarList
} from "./chunk-4N4LPUSH.js";
import {
  TrippyIcon
} from "./chunk-HWKTRTVM.js";
import {
  Skeleton_default
} from "./chunk-WNLM7UWS.js";
import {
  Dialog_default
} from "./chunk-VGRKXESR.js";
import {
  PageShell
} from "./chunk-4OVOE75H.js";
import {
  FloatingAssistant,
  idbListChatSessions,
  idbReadChatSession,
  normalizeSkill
} from "./chunk-ST6WUVC7.js";
import "./chunk-GBGSFNN4.js";
import {
  AppHeader,
  Markdown,
  remarkGfm,
  useAgentIdentity
} from "./chunk-ZLOKTPEE.js";
import "./chunk-OHWNV7E6.js";
import {
  JobsBoard_default
} from "./chunk-HZMUDGND.js";
import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  Bookmark,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  User,
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

// react-entries/career.tsx
var import_client = __toESM(require_client());

// components/career/CareerDashboard.tsx
var import_react8 = __toESM(require_react());

// components/career/RecommendedJobCard.tsx
var import_react = __toESM(require_react());

// components/career/RecommendedJobCard.module.css
var RecommendedJobCard_default = {
  card: "RecommendedJobCard_card",
  topAccent: "RecommendedJobCard_topAccent",
  header: "RecommendedJobCard_header",
  headerLabel: "RecommendedJobCard_headerLabel",
  skeletonStack: "RecommendedJobCard_skeletonStack",
  skel: "RecommendedJobCard_skel",
  shimmer: "RecommendedJobCard_shimmer",
  body: "RecommendedJobCard_body",
  titleRow: "RecommendedJobCard_titleRow",
  titleGroup: "RecommendedJobCard_titleGroup",
  companyLabel: "RecommendedJobCard_companyLabel",
  roleRow: "RecommendedJobCard_roleRow",
  extLink: "RecommendedJobCard_extLink",
  bookmarkBtn: "RecommendedJobCard_bookmarkBtn",
  why: "RecommendedJobCard_why",
  empty: "RecommendedJobCard_empty",
  emptyHint: "RecommendedJobCard_emptyHint",
  emptyHintLabel: "RecommendedJobCard_emptyHintLabel"
};

// components/career/RecommendedJobCard.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function RecommendedJobCard({ loading, recommendation, savedJobs, onAddToBoard }) {
  const { name: agentName } = useAgentIdentity();
  const alreadySaved = recommendation ? savedJobs.some((j) => j.company === recommendation.company && j.role === recommendation.role) : false;
  const [bookmarked, setBookmarked] = (0, import_react.useState)(alreadySaved);
  (0, import_react.useEffect)(() => {
    if (alreadySaved) setBookmarked(true);
  }, [alreadySaved]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: RecommendedJobCard_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: RecommendedJobCard_default.topAccent }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: RecommendedJobCard_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrippyIcon, { sizeClass: "h-10 w-10" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: RecommendedJobCard_default.headerLabel, children: [
        agentName,
        "'s Pick"
      ] }) })
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: RecommendedJobCard_default.skeletonStack, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: RecommendedJobCard_default.skel, style: { height: 20, width: 128 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: RecommendedJobCard_default.skel, style: { height: 28, width: 256 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: RecommendedJobCard_default.skel, style: { height: 16, width: "100%" } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: RecommendedJobCard_default.skel, style: { height: 16, width: "85%" } })
    ] }) : recommendation ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: RecommendedJobCard_default.body, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: RecommendedJobCard_default.titleRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: RecommendedJobCard_default.titleGroup, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: RecommendedJobCard_default.companyLabel, children: recommendation.company }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: RecommendedJobCard_default.roleRow, children: [
            recommendation.role,
            recommendation.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: recommendation.url, target: "_blank", rel: "noopener noreferrer", className: RecommendedJobCard_default.extLink, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { style: { width: 16, height: 16 } }) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            title: bookmarked ? "Added to board" : "Add to board",
            onClick: () => {
              if (!bookmarked) {
                onAddToBoard({ company: recommendation.company, role: recommendation.role, url: recommendation.url });
                setBookmarked(true);
              }
            },
            className: RecommendedJobCard_default.bookmarkBtn,
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              Bookmark,
              {
                style: {
                  width: 20,
                  height: 20,
                  fill: bookmarked ? "#f47560" : "none",
                  color: bookmarked ? "#f47560" : "var(--color-text-muted)",
                  opacity: bookmarked ? 1 : 0.5
                }
              }
            )
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: RecommendedJobCard_default.why, children: recommendation.why })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: RecommendedJobCard_default.empty, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }, children: [
        "Chat with ",
        agentName,
        " to get a personalised job recommendation based on your profile."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: RecommendedJobCard_default.emptyHint, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrippyIcon, { sizeClass: "h-4 w-4" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: RecommendedJobCard_default.emptyHintLabel, children: "Start below to build your profile" })
      ] })
    ] })
  ] });
}

// components/career/TimelineTile.tsx
var import_react3 = __toESM(require_react());

// components/career/TimelineModal.tsx
var import_react2 = __toESM(require_react());

// components/career/TimelineModal.module.css
var TimelineModal_default = {
  scrollBody: "TimelineModal_scrollBody",
  titleRow: "TimelineModal_titleRow",
  entryCount: "TimelineModal_entryCount",
  skeletonList: "TimelineModal_skeletonList",
  skeletonRow: "TimelineModal_skeletonRow",
  skel: "TimelineModal_skel",
  shimmer: "TimelineModal_shimmer",
  emptyMsg: "TimelineModal_emptyMsg",
  timeline: "TimelineModal_timeline",
  yearGroup: "TimelineModal_yearGroup",
  yearLabel: "TimelineModal_yearLabel",
  yearEntries: "TimelineModal_yearEntries",
  entry: "TimelineModal_entry",
  entryDot: "TimelineModal_entryDot",
  dotWork: "TimelineModal_dotWork",
  dotEducation: "TimelineModal_dotEducation",
  dotCertification: "TimelineModal_dotCertification",
  dotAward: "TimelineModal_dotAward",
  dotClub: "TimelineModal_dotClub",
  dotProject: "TimelineModal_dotProject",
  deleteBtn: "TimelineModal_deleteBtn",
  editForm: "TimelineModal_editForm",
  editGrid: "TimelineModal_editGrid",
  editInput: "TimelineModal_editInput",
  editInputFull: "TimelineModal_editInputFull",
  editSelect: "TimelineModal_editSelect",
  editTextarea: "TimelineModal_editTextarea",
  editBtns: "TimelineModal_editBtns",
  readView: "TimelineModal_readView",
  readViewClickable: "TimelineModal_readViewClickable",
  entryMeta: "TimelineModal_entryMeta",
  metaWork: "TimelineModal_metaWork",
  metaEducation: "TimelineModal_metaEducation",
  metaCertification: "TimelineModal_metaCertification",
  metaAward: "TimelineModal_metaAward",
  metaClub: "TimelineModal_metaClub",
  metaProject: "TimelineModal_metaProject",
  entryTitle: "TimelineModal_entryTitle",
  entryOrg: "TimelineModal_entryOrg",
  entryGpa: "TimelineModal_entryGpa",
  skills: "TimelineModal_skills",
  skillChip: "TimelineModal_skillChip",
  chipWork: "TimelineModal_chipWork",
  chipEducation: "TimelineModal_chipEducation",
  chipCertification: "TimelineModal_chipCertification",
  chipAward: "TimelineModal_chipAward",
  chipClub: "TimelineModal_chipClub",
  chipProject: "TimelineModal_chipProject",
  confirmFooter: "TimelineModal_confirmFooter"
};

// components/career/TimelineModal.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var ENTRY_TYPES = ["work", "education", "certification", "award", "club", "project"];
var DOT_CLASS = {
  work: TimelineModal_default.dotWork,
  education: TimelineModal_default.dotEducation,
  certification: TimelineModal_default.dotCertification,
  award: TimelineModal_default.dotAward,
  club: TimelineModal_default.dotClub,
  project: TimelineModal_default.dotProject
};
var META_CLASS = {
  work: TimelineModal_default.metaWork,
  education: TimelineModal_default.metaEducation,
  certification: TimelineModal_default.metaCertification,
  award: TimelineModal_default.metaAward,
  club: TimelineModal_default.metaClub,
  project: TimelineModal_default.metaProject
};
var CHIP_CLASS = {
  work: TimelineModal_default.chipWork,
  education: TimelineModal_default.chipEducation,
  certification: TimelineModal_default.chipCertification,
  award: TimelineModal_default.chipAward,
  club: TimelineModal_default.chipClub,
  project: TimelineModal_default.chipProject
};
function formatDate(date) {
  if (!date) return "";
  return date;
}
function groupByYear(entries) {
  const sorted = [...entries].sort((a, b) => {
    const aSort = a.dateSort ?? "0000-00";
    const bSort = b.dateSort ?? "0000-00";
    return bSort.localeCompare(aSort);
  });
  const map = /* @__PURE__ */ new Map();
  for (const entry of sorted) {
    const year = (entry.dateSort ?? "0000").slice(0, 4);
    const label = year === "9999" ? "Present" : year === "0000" ? "Unknown" : year;
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(entry);
  }
  return map;
}
function TimelineModal({ open, onOpenChange, entries, loading, onDelete, onEdit }) {
  const grouped = groupByYear(entries);
  const [pendingDeleteId, setPendingDeleteId] = (0, import_react2.useState)(null);
  const pendingEntry = entries.find((e) => e.id === pendingDeleteId);
  const [editingId, setEditingId] = (0, import_react2.useState)(null);
  const [editDraft, setEditDraft] = (0, import_react2.useState)({});
  const [skillsRaw, setSkillsRaw] = (0, import_react2.useState)("");
  function startEdit(entry) {
    setEditingId(entry.id);
    setEditDraft({
      title: entry.title,
      organization: entry.organization,
      location: entry.location ?? "",
      type: entry.type,
      startDate: entry.startDate ?? "",
      endDate: entry.endDate ?? "",
      description: entry.description ?? "",
      skills: entry.skills ?? []
    });
    setSkillsRaw((entry.skills ?? []).join(", "));
  }
  function saveEdit(id) {
    const patch = {};
    if (editDraft.title !== void 0) patch.title = editDraft.title;
    if (editDraft.organization !== void 0) patch.organization = editDraft.organization;
    if (editDraft.location !== void 0) patch.location = editDraft.location;
    if (editDraft.type !== void 0) patch.type = editDraft.type;
    if (editDraft.startDate !== void 0) patch.startDate = editDraft.startDate;
    if (editDraft.endDate !== void 0) patch.endDate = editDraft.endDate;
    if (editDraft.description !== void 0) patch.description = editDraft.description;
    patch.skills = skillsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    onEdit?.(id, patch);
    setEditingId(null);
  }
  function handleDeleteConfirm() {
    if (pendingDeleteId) onDelete?.(pendingDeleteId);
    setPendingDeleteId(null);
  }
  if (!open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: Dialog_default.overlay, onClick: () => onOpenChange(false) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: Dialog_default.content, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: Dialog_default.header, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TimelineModal_default.titleRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: Dialog_default.title, children: "Career Timeline" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { color: "transparent", width: 10 }, children: "s" }),
        entries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: TimelineModal_default.entryCount, children: [
          entries.length,
          " ",
          entries.length === 1 ? "entry" : "entries"
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: Dialog_default.closeBtn, onClick: () => onOpenChange(false), "aria-label": "Close", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(X, { style: { width: 16, height: 16 } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.scrollBody, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.skeletonList, children: [1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TimelineModal_default.skeletonRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.skel, style: { width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 4 } }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8, flex: 1 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.skel, style: { height: 12, width: 96 } }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.skel, style: { height: 20, width: 192 } }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.skel, style: { height: 16, width: 144 } })
        ] })
      ] }, i)) }) : entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: TimelineModal_default.emptyMsg, children: "Upload a resume to build your timeline." }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.timeline, children: Array.from(grouped.entries()).map(([year, yearEntries]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TimelineModal_default.yearGroup, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: TimelineModal_default.yearLabel, children: year === "Unknown" ? "Unknown year" : year }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.yearEntries, children: yearEntries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TimelineModal_default.entry, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `${TimelineModal_default.entryDot} ${DOT_CLASS[entry.type]}` }),
          onDelete && editingId !== entry.id && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              type: "button",
              className: TimelineModal_default.deleteBtn,
              onClick: (e) => {
                e.stopPropagation();
                setPendingDeleteId(entry.id);
              },
              "aria-label": "Remove entry",
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(X, { style: { width: 12, height: 12 } })
            }
          ),
          editingId === entry.id ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TimelineModal_default.editForm, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TimelineModal_default.editGrid, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: `${TimelineModal_default.editInput} ${TimelineModal_default.editInputFull}`, placeholder: "Title", value: editDraft.title ?? "", onChange: (e) => setEditDraft((d) => ({ ...d, title: e.target.value })) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: TimelineModal_default.editInput, placeholder: "Organization", value: editDraft.organization ?? "", onChange: (e) => setEditDraft((d) => ({ ...d, organization: e.target.value })) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: TimelineModal_default.editInput, placeholder: "Location (City, ST)", value: editDraft.location ?? "", onChange: (e) => setEditDraft((d) => ({ ...d, location: e.target.value })) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: TimelineModal_default.editInput, placeholder: "Start date", value: editDraft.startDate ?? "", onChange: (e) => setEditDraft((d) => ({ ...d, startDate: e.target.value })) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: TimelineModal_default.editInput, placeholder: "End date (or Present)", value: editDraft.endDate ?? "", onChange: (e) => setEditDraft((d) => ({ ...d, endDate: e.target.value })) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("select", { className: TimelineModal_default.editSelect, value: editDraft.type ?? entry.type, onChange: (e) => setEditDraft((d) => ({ ...d, type: e.target.value })), children: ENTRY_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: t, children: t.charAt(0).toUpperCase() + t.slice(1) }, t)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { className: TimelineModal_default.editTextarea, rows: 4, placeholder: "Description / bullet points", value: editDraft.description ?? "", onChange: (e) => setEditDraft((d) => ({ ...d, description: e.target.value })) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: TimelineModal_default.editInput, style: { width: "100%" }, placeholder: "Skills (comma-separated)", value: skillsRaw, onChange: (e) => setSkillsRaw(e.target.value) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: TimelineModal_default.editBtns, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`, onClick: () => saveEdit(entry.id), children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Check, { style: { width: 12, height: 12 } }),
                " Save"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: () => setEditingId(null), children: "Cancel" })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "div",
            {
              className: `${TimelineModal_default.readView} ${onEdit ? TimelineModal_default.readViewClickable : ""}`,
              onClick: () => onEdit && startEdit(entry),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: `${TimelineModal_default.entryMeta} ${META_CLASS[entry.type]}`, children: [
                  entry.endDate === void 0 || entry.endDate === null ? "Present" : formatDate(entry.endDate),
                  " \xB7 ",
                  entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
                  entry.startDate && ` \xB7 ${formatDate(entry.startDate)}`
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: TimelineModal_default.entryTitle, children: entry.title }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: TimelineModal_default.entryOrg, children: [
                  entry.organization,
                  entry.location ? ` \xB7 ${entry.location}` : ""
                ] }),
                entry.type === "education" && entry.description && (() => {
                  const gpaMatch = entry.description.match(/(?:Cumulative )?GPA:\s*[\d.]+/i);
                  return gpaMatch ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: TimelineModal_default.entryGpa, children: gpaMatch[0] }) : null;
                })(),
                entry.skills && entry.skills.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: TimelineModal_default.skills, children: entry.skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `${TimelineModal_default.skillChip} ${CHIP_CLASS[entry.type]}`, children: skill }, skill)) })
              ]
            }
          )
        ] }, entry.id)) })
      ] }, year)) }) })
    ] }),
    pendingDeleteId && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: Dialog_default.overlay, onClick: () => setPendingDeleteId(null), style: { zIndex: 52 } }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: Dialog_default.content, style: { zIndex: 53 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: Dialog_default.header, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: Dialog_default.title, children: "Remove entry?" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: Dialog_default.description, children: pendingEntry ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            "Remove ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: pendingEntry.title }),
            pendingEntry.organization ? ` at ${pendingEntry.organization}` : "",
            "?"
          ] }) : "This cannot be undone." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: Dialog_default.footer, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: () => setPendingDeleteId(null), children: "Cancel" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.danger} ${Button_default.sm}`, onClick: handleDeleteConfirm, children: "Remove" })
        ] })
      ] })
    ] })
  ] });
}

// components/career/TimelineTile.module.css
var TimelineTile_default = {
  tile: "TimelineTile_tile",
  header: "TimelineTile_header",
  headerLeft: "TimelineTile_headerLeft",
  metaLabel: "TimelineTile_metaLabel",
  count: "TimelineTile_count",
  entriesLabel: "TimelineTile_entriesLabel",
  chevron: "TimelineTile_chevron",
  pills: "TimelineTile_pills",
  pill: "TimelineTile_pill",
  pillWork: "TimelineTile_pillWork",
  pillEducation: "TimelineTile_pillEducation",
  pillCert: "TimelineTile_pillCert",
  pillProject: "TimelineTile_pillProject",
  uploadZone: "TimelineTile_uploadZone",
  uploadInner: "TimelineTile_uploadInner",
  hiddenInput: "TimelineTile_hiddenInput",
  uploadRow: "TimelineTile_uploadRow",
  uploadIconWrap: "TimelineTile_uploadIconWrap",
  uploadSpinner: "TimelineTile_uploadSpinner",
  spin: "TimelineTile_spin",
  uploadTitle: "TimelineTile_uploadTitle",
  uploadSub: "TimelineTile_uploadSub"
};

// components/career/TimelineTile.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function TimelineTile({ entries, loading, onUpload, uploading, onDelete, onEdit }) {
  const [modalOpen, setModalOpen] = (0, import_react3.useState)(false);
  const fileInputRef = (0, import_react3.useRef)(null);
  const workCount = entries.filter((e) => e.type === "work").length;
  const educationCount = entries.filter((e) => e.type === "education").length;
  const certCount = entries.filter((e) => e.type === "certification").length;
  const projectCount = entries.filter((e) => e.type === "project").length;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: TimelineTile_default.tile, onClick: () => setModalOpen(true), children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: TimelineTile_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: TimelineTile_default.headerLeft, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: TimelineTile_default.metaLabel, children: "Career History" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: TimelineTile_default.count, children: loading ? "\u2014" : entries.length }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: TimelineTile_default.entriesLabel, children: [
            entries.length === 1 ? "entry" : "entries",
            " on record"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChevronRight, { className: TimelineTile_default.chevron, style: { width: 16, height: 16 } })
      ] }),
      entries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: TimelineTile_default.pills, children: [
        workCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: `${TimelineTile_default.pill} ${TimelineTile_default.pillWork}`, children: [
          workCount,
          " Work"
        ] }),
        educationCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: `${TimelineTile_default.pill} ${TimelineTile_default.pillEducation}`, children: [
          educationCount,
          " Education"
        ] }),
        certCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: `${TimelineTile_default.pill} ${TimelineTile_default.pillCert}`, children: [
          certCount,
          " Certs"
        ] }),
        projectCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: `${TimelineTile_default.pill} ${TimelineTile_default.pillProject}`, children: [
          projectCount,
          " Projects"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TimelineTile_default.uploadZone, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          className: TimelineTile_default.uploadInner,
          onClick: (e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: ".pdf,.docx,.doc",
                multiple: true,
                className: TimelineTile_default.hiddenInput,
                onChange: (e) => e.target.files && onUpload(e.target.files)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: TimelineTile_default.uploadRow, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TimelineTile_default.uploadIconWrap, children: uploading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: TimelineTile_default.uploadSpinner }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Upload, { style: { width: 14, height: 14 } }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: TimelineTile_default.uploadTitle, children: uploading ? "Parsing\u2026" : "Add documents" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: TimelineTile_default.uploadSub, children: "PDF or DOCX" })
              ] })
            ] })
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      TimelineModal,
      {
        open: modalOpen,
        onOpenChange: setModalOpen,
        entries,
        loading,
        onDelete,
        onEdit
      }
    )
  ] });
}

// components/career/JobsBoard.tsx
var import_react5 = __toESM(require_react());

// components/career/CompaniesModal.tsx
var import_react4 = __toESM(require_react());

// components/career/CompaniesModal.module.css
var CompaniesModal_default = {
  scrollBody: "CompaniesModal_scrollBody",
  subCount: "CompaniesModal_subCount",
  searchRow: "CompaniesModal_searchRow",
  searchWrap: "CompaniesModal_searchWrap",
  searchIcon: "CompaniesModal_searchIcon",
  searchInput: "CompaniesModal_searchInput",
  addFormWrap: "CompaniesModal_addFormWrap",
  formFields: "CompaniesModal_formFields",
  formInput: "CompaniesModal_formInput",
  formBtns: "CompaniesModal_formBtns",
  loadingCenter: "CompaniesModal_loadingCenter",
  spinner: "CompaniesModal_spinner",
  spin: "CompaniesModal_spin",
  empty: "CompaniesModal_empty",
  sectionLabel: "CompaniesModal_sectionLabel",
  row: "CompaniesModal_row",
  rowDead: "CompaniesModal_rowDead",
  rowContent: "CompaniesModal_rowContent",
  rowNameLine: "CompaniesModal_rowNameLine",
  rowName: "CompaniesModal_rowName",
  rowNameDead: "CompaniesModal_rowNameDead",
  scoreBadge: "CompaniesModal_scoreBadge",
  rowDomain: "CompaniesModal_rowDomain",
  rowCareersLink: "CompaniesModal_rowCareersLink",
  rowCareersUrl: "CompaniesModal_rowCareersUrl",
  rowActions: "CompaniesModal_rowActions",
  rowBtn: "CompaniesModal_rowBtn",
  rowBtnDanger: "CompaniesModal_rowBtnDanger",
  editFields: "CompaniesModal_editFields",
  fieldGroup: "CompaniesModal_fieldGroup",
  fieldLabel: "CompaniesModal_fieldLabel",
  fieldInput: "CompaniesModal_fieldInput",
  deadRow: "CompaniesModal_deadRow",
  toggleBtn: "CompaniesModal_toggleBtn",
  toggleBtnActive: "CompaniesModal_toggleBtnActive",
  toggleHint: "CompaniesModal_toggleHint",
  editBtns: "CompaniesModal_editBtns"
};

// components/career/CompaniesModal.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
function CompaniesModal({ open, onOpenChange }) {
  const [companies, setCompanies] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(false);
  const [search, setSearch] = (0, import_react4.useState)("");
  const [adding, setAdding] = (0, import_react4.useState)(false);
  const [newName, setNewName] = (0, import_react4.useState)("");
  const [newDomain, setNewDomain] = (0, import_react4.useState)("");
  const [newCareersUrl, setNewCareersUrl] = (0, import_react4.useState)("");
  const [editingCompany, setEditingCompany] = (0, import_react4.useState)(null);
  const load = (0, import_react4.useCallback)(async () => {
    setLoading(true);
    try {
      const res = await proxyFetch("/agent/career/companies");
      if (!res.ok) return;
      const data = await res.json();
      setCompanies(data.companies ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  (0, import_react4.useEffect)(() => {
    if (open) load();
  }, [open, load]);
  const patch = async (originalName, updates) => {
    const { name: newNameVal, ...rest } = updates;
    const body = { name: originalName, ...rest };
    if (newNameVal && newNameVal !== originalName) body.newName = newNameVal;
    const res = await proxyFetch("/agent/career/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.company) {
        setCompanies((prev) => prev.map((c) => c.name === originalName ? { ...c, ...data.company } : c));
      }
    }
  };
  const remove = async (name) => {
    await proxyFetch("/agent/career/companies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setCompanies((prev) => prev.filter((c) => c.name !== name));
  };
  const add = async () => {
    if (!newName.trim()) return;
    const res = await proxyFetch("/agent/career/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), domain: newDomain.trim() || void 0, careersUrl: newCareersUrl.trim() || void 0 })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.company) setCompanies((prev) => [...prev, data.company]);
    }
    setNewName("");
    setNewDomain("");
    setNewCareersUrl("");
    setAdding(false);
  };
  const handleEditSave = async (original, updates) => {
    await patch(original.name, updates);
    setEditingCompany(null);
  };
  const filtered = companies.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.domain?.toLowerCase().includes(search.toLowerCase())
  );
  const byName = (a, b) => a.name.localeCompare(b.name);
  const active = filtered.filter((c) => !c.dead).sort(byName);
  const skipped = filtered.filter((c) => c.dead).sort(byName);
  if (!open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: Dialog_default.overlay, onClick: () => onOpenChange(false) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: Dialog_default.content, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: Dialog_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: Dialog_default.title, children: "Companies" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: CompaniesModal_default.subCount, children: [
          companies.filter((c) => !c.dead).length,
          " active \xB7 ",
          companies.filter((c) => c.dead).length,
          " skipped"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: Dialog_default.closeBtn, onClick: () => onOpenChange(false), "aria-label": "Close", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(X, { style: { width: 16, height: 16 } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.searchRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.searchWrap, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Search, { className: CompaniesModal_default.searchIcon, style: { width: 14, height: 14 } }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search companies\u2026",
              className: CompaniesModal_default.searchInput
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "button",
          {
            type: "button",
            className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`,
            onClick: () => setAdding((v) => !v),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Plus, { style: { width: 14, height: 14 } }),
              " Add"
            ]
          }
        )
      ] }),
      adding && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.addFormWrap, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.formFields, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { autoFocus: true, type: "text", value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "Company name", className: CompaniesModal_default.formInput }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", value: newDomain, onChange: (e) => setNewDomain(e.target.value), placeholder: "domain.com (optional)", className: CompaniesModal_default.formInput }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "url", value: newCareersUrl, onChange: (e) => setNewCareersUrl(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter") add();
            if (e.key === "Escape") setAdding(false);
          }, placeholder: "Careers URL (optional)", className: CompaniesModal_default.formInput })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.formBtns, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`, onClick: add, disabled: !newName.trim(), children: "Add Company" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: () => setAdding(false), children: "Cancel" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.scrollBody, children: [
        loading && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: CompaniesModal_default.loadingCenter, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: CompaniesModal_default.spinner }) }),
        !loading && active.length === 0 && skipped.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: CompaniesModal_default.empty, children: "No companies yet \u2014 run a job search first." }),
        active.map((co) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          CompanyRow,
          {
            co,
            onEdit: () => setEditingCompany(co),
            onToggleDead: () => patch(co.name, { dead: true }),
            onRemove: () => remove(co.name)
          },
          co.name
        )),
        skipped.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: CompaniesModal_default.sectionLabel, children: "Skipped" }),
          skipped.map((co) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            CompanyRow,
            {
              co,
              onEdit: () => setEditingCompany(co),
              onToggleDead: () => patch(co.name, { dead: false }),
              onRemove: () => remove(co.name)
            },
            co.name
          ))
        ] })
      ] })
    ] }),
    editingCompany && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      EditCompanyModal,
      {
        company: editingCompany,
        onSave: (updates) => handleEditSave(editingCompany, updates),
        onClose: () => setEditingCompany(null)
      }
    )
  ] });
}
function scoreColor(score) {
  const hue = Math.round(score / 10 * 120);
  return `hsl(${hue}, 72%, 40%)`;
}
function CompanyRow({ co, onEdit, onToggleDead, onRemove }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `${CompaniesModal_default.row} ${co.dead ? CompaniesModal_default.rowDead : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.rowContent, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.rowNameLine, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: `${CompaniesModal_default.rowName} ${co.dead ? CompaniesModal_default.rowNameDead : ""}`, children: co.name }),
        co.domain && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: CompaniesModal_default.rowDomain, children: co.domain }),
        co.score != null && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: CompaniesModal_default.scoreBadge, style: { color: scoreColor(co.score) }, children: [
          co.score,
          "/10"
        ] })
      ] }),
      co.careersUrl && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.rowCareersLink, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("a", { href: co.careersUrl, target: "_blank", rel: "noopener noreferrer", className: CompaniesModal_default.rowCareersUrl, children: co.careersUrl }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ExternalLink, { style: { width: 12, height: 12, color: "var(--color-text-muted)", opacity: 0.4, flexShrink: 0 } })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.rowActions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", title: "Edit company", onClick: onEdit, className: CompaniesModal_default.rowBtn, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Pencil, { style: { width: 14, height: 14 } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", title: co.dead ? "Restore company" : "Skip company", onClick: onToggleDead, className: CompaniesModal_default.rowBtn, children: co.dead ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Eye, { style: { width: 14, height: 14 } }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(EyeOff, { style: { width: 14, height: 14 } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", title: "Remove from list", onClick: onRemove, className: `${CompaniesModal_default.rowBtn} ${CompaniesModal_default.rowBtnDanger}`, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Trash2, { style: { width: 14, height: 14 } }) })
    ] })
  ] });
}
function EditCompanyModal({ company, onSave, onClose }) {
  const [name, setName] = (0, import_react4.useState)(company.name);
  const [domain, setDomain] = (0, import_react4.useState)(company.domain ?? "");
  const [careersUrl, setCareersUrl] = (0, import_react4.useState)(company.careersUrl ?? "");
  const [dead, setDead] = (0, import_react4.useState)(company.dead ?? false);
  const handleSave = () => {
    const trimmedName = name.trim() || company.name;
    onSave({
      ...trimmedName !== company.name ? { name: trimmedName } : {},
      domain: domain.trim() || void 0,
      careersUrl: careersUrl.trim() || void 0,
      dead
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: Dialog_default.overlay, onClick: onClose, style: { zIndex: 52 } }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: Dialog_default.content, style: { zIndex: 53 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: Dialog_default.header, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: Dialog_default.title, children: "Edit Company" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: Dialog_default.closeBtn, onClick: onClose, "aria-label": "Close", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(X, { style: { width: 16, height: 16 } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.editFields, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.fieldGroup, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: CompaniesModal_default.fieldLabel, children: "Name" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { autoFocus: true, type: "text", value: name, onChange: (e) => setName(e.target.value), className: CompaniesModal_default.fieldInput })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.fieldGroup, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: CompaniesModal_default.fieldLabel, children: "Domain" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", value: domain, onChange: (e) => setDomain(e.target.value), placeholder: "domain.com", className: CompaniesModal_default.fieldInput })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.fieldGroup, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: CompaniesModal_default.fieldLabel, children: "Careers URL" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "url", value: careersUrl, onChange: (e) => setCareersUrl(e.target.value), placeholder: "https://company.com/careers", className: CompaniesModal_default.fieldInput })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.deadRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => setDead((v) => !v),
              className: `${CompaniesModal_default.toggleBtn} ${dead ? CompaniesModal_default.toggleBtnActive : ""}`,
              children: [
                dead ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(EyeOff, { style: { width: 14, height: 14 } }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Eye, { style: { width: 14, height: 14 } }),
                dead ? "Skipped" : "Active"
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: CompaniesModal_default.toggleHint, children: "Toggle to skip this company in future job searches." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CompaniesModal_default.editBtns, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`, onClick: handleSave, disabled: !name.trim(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Check, { style: { width: 14, height: 14 } }),
          " Save"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: onClose, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(X, { style: { width: 14, height: 14 } }),
          " Cancel"
        ] })
      ] })
    ] })
  ] });
}

// components/career/JobCard.module.css
var JobCard_default = {
  card: "JobCard_card",
  row: "JobCard_row",
  titleGroup: "JobCard_titleGroup",
  iconWrap: "JobCard_iconWrap",
  textStack: "JobCard_textStack",
  role: "JobCard_role",
  company: "JobCard_company",
  statusBadge: "JobCard_statusBadge",
  statusSaved: "JobCard_statusSaved",
  statusApplied: "JobCard_statusApplied",
  statusInterviewing: "JobCard_statusInterviewing",
  statusOffer: "JobCard_statusOffer",
  statusClosed: "JobCard_statusClosed",
  statusRejected: "JobCard_statusRejected",
  footer: "JobCard_footer",
  footerMeta: "JobCard_footerMeta",
  viewLink: "JobCard_viewLink"
};

// components/career/JobCard.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
var STATUS_CLASS = {
  saved: JobCard_default.statusSaved,
  applied: JobCard_default.statusApplied,
  interviewing: JobCard_default.statusInterviewing,
  offer: JobCard_default.statusOffer,
  closed: JobCard_default.statusClosed,
  rejected: JobCard_default.statusRejected
};
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 864e5);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""} ago`;
}
function JobCard({ job, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick(job);
      return;
    }
    window.open(`/career/jobs/${job.id}`, "_blank");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: JobCard_default.card, onClick: handleClick, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: JobCard_default.row, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: JobCard_default.titleGroup, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: JobCard_default.iconWrap, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Building2, { style: { width: 16, height: 16 } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: JobCard_default.textStack, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h4", { className: JobCard_default.role, children: job.role }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: JobCard_default.company, children: job.company })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `${JobCard_default.statusBadge} ${STATUS_CLASS[job.status]}`, children: job.status })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: JobCard_default.footer, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: JobCard_default.footerMeta, children: [
        "Added ",
        timeAgo(job.addedAt)
      ] }),
      job.url ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "a",
        {
          href: job.url,
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: (e) => e.stopPropagation(),
          className: JobCard_default.viewLink,
          children: "View Details"
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: JobCard_default.viewLink, children: "View Details" })
    ] })
  ] });
}

// components/career/JobsBoard.tsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
var STATUSES = ["saved", "applied", "interviewing"];
var STATUS_LABELS = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interview",
  offer: "Offer",
  closed: "Closed",
  rejected: "Rejected"
};
function JobsBoard({ jobs, loading, onJobUpdate: _onJobUpdate, onAddJob, onSkipCompany, onDeleteJob, onCleanupJobs, jobSearchId, onStatusChange: _1, onNotesChange: _2, onJdChange: _3, onOverlapsChange: _4, onUrlChange: _5, onUrlVerifiedChange: _6 }) {
  const PAGE_SIZE = 20;
  const [activeStatus, setActiveStatus] = (0, import_react5.useState)("all");
  const [jobsPage, setJobsPage] = (0, import_react5.useState)(1);
  const [addingJob, setAddingJob] = (0, import_react5.useState)(false);
  const [newCompany, setNewCompany] = (0, import_react5.useState)("");
  const [newRole, setNewRole] = (0, import_react5.useState)("");
  const [newUrl, setNewUrl] = (0, import_react5.useState)("");
  const [searchResults, setSearchResults] = (0, import_react5.useState)([]);
  const [resultsPage, setResultsPage] = (0, import_react5.useState)(1);
  const [resultsTotal, setResultsTotal] = (0, import_react5.useState)(0);
  const [resultsLoading, setResultsLoading] = (0, import_react5.useState)(false);
  const [skippedCompanies, setSkippedCompanies] = (0, import_react5.useState)(/* @__PURE__ */ new Set());
  const [showCompanies, setShowCompanies] = (0, import_react5.useState)(false);
  const [searchStatus, setSearchStatus] = (0, import_react5.useState)(null);
  const [searchError, setSearchError] = (0, import_react5.useState)(null);
  const [searchElapsed, setSearchElapsed] = (0, import_react5.useState)(0);
  const [cleanupRunning, setCleanupRunning] = (0, import_react5.useState)(false);
  const [cleanupResult, setCleanupResult] = (0, import_react5.useState)(null);
  const timerRef = (0, import_react5.useRef)(null);
  const seenIdsRef = (0, import_react5.useRef)(/* @__PURE__ */ new Set());
  const isSearchingRef = (0, import_react5.useRef)(false);
  const [scrapedAt, setScrapedAt] = (0, import_react5.useState)(null);
  const [resultsVisible, setResultsVisible] = (0, import_react5.useState)(true);
  const fetchResultsPage = (page) => {
    setResultsLoading(true);
    setResultsVisible(false);
    proxyFetch(`/agent/career/job-results?page=${page}&pageSize=${PAGE_SIZE}`).then((r) => r.ok ? r.json() : null).then((data) => {
      if (data?.results && data.results.length > 0) {
        setSearchResults(data.results);
        setResultsTotal(data.total);
        setResultsPage(page);
        setScrapedAt(data.scrapedAt ?? null);
      }
    }).catch(() => {
    }).finally(() => {
      setResultsLoading(false);
      setResultsVisible(true);
    });
  };
  (0, import_react5.useEffect)(() => {
    fetchResultsPage(1);
  }, []);
  (0, import_react5.useEffect)(() => {
    if (!jobSearchId) return;
    isSearchingRef.current = true;
    setSearchStatus("Starting job search...");
    setSearchElapsed(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => setSearchElapsed(Math.floor((Date.now() - startTime) / 1e3)), 1e3);
    const channel = new BroadcastChannel("route-jobs");
    channel.onmessage = async (event) => {
      const msg = event.data;
      if (msg.type !== "JOB_SEARCH_UPDATE" || msg.jobId !== jobSearchId) return;
      if (msg.statusMessage) setSearchStatus(msg.statusMessage);
      if (msg.results && msg.results.length > 0) {
        setSearchResults(msg.results.slice(0, PAGE_SIZE));
        setResultsTotal(msg.results.length);
        setResultsPage(1);
      }
      if (msg.status === "failed") {
        if (timerRef.current) clearInterval(timerRef.current);
        setSearchStatus(null);
        setSearchError(msg.error ?? "Search failed \u2014 upload a resume to build your profile.");
        channel.close();
      }
      if (msg.status === "completed") {
        if (timerRef.current) clearInterval(timerRef.current);
        fetchResultsPage(1);
        setSearchStatus(null);
        isSearchingRef.current = false;
        navigator.serviceWorker.controller?.postMessage({ type: "STOP_JOB_SEARCH_POLL", jobId: jobSearchId });
        channel.close();
      }
    };
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      channel.close();
    };
  }, [jobSearchId]);
  const dismissResult = (id) => {
    setSearchResults((prev) => prev.filter((r) => r.id !== id));
    setResultsTotal((t) => Math.max(0, t - 1));
    proxyFetch("/agent/career/dismiss-result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {
    });
  };
  const activeJobCount = jobs.filter((j) => j.status === "saved" || j.status === "applied" || j.status === "interviewing" || j.status === "offer").length;
  const filtered = activeStatus === "all" ? [] : jobs.filter((j) => j.status === activeStatus);
  const filteredSorted = activeStatus === "saved" ? [...filtered.filter((j) => j.urlVerified), ...filtered.filter((j) => !j.urlVerified)] : filtered;
  const pagedJobs = filteredSorted.slice(0, jobsPage * PAGE_SIZE);
  const verifiedCount = activeStatus === "saved" ? filtered.filter((j) => j.urlVerified).length : 0;
  const savedUrls = new Set(jobs.map((j) => j.url).filter(Boolean));
  const visibleResults = searchResults.filter((r) => !skippedCompanies.has(r.company) && (!r.url || !savedUrls.has(r.url)));
  const hasMoreResults = resultsPage * PAGE_SIZE < resultsTotal;
  const handleCleanup = async () => {
    setCleanupRunning(true);
    setCleanupResult(null);
    const result = await onCleanupJobs();
    setCleanupResult(result);
    setCleanupRunning(false);
  };
  const handleSkipCompany = (company) => {
    setSkippedCompanies((prev) => new Set(prev).add(company));
    onSkipCompany(company);
  };
  const handleAddSubmit = () => {
    if (!newCompany.trim() || !newRole.trim()) return;
    onAddJob(newCompany.trim(), newRole.trim(), newUrl.trim() || void 0);
    setNewCompany("");
    setNewRole("");
    setNewUrl("");
    setAddingJob(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.board, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.topBar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: JobsBoard_default.heading, children: "Jobs" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.subRow, children: [
          jobs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: JobsBoard_default.pulse }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: JobsBoard_default.subLabel, children: [
            activeJobCount,
            " Active ",
            activeJobCount === 1 ? "Tracked Job" : "Tracked Jobs"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.actions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "button",
          {
            type: "button",
            onClick: handleCleanup,
            disabled: cleanupRunning,
            className: JobsBoard_default.actionBtn,
            title: cleanupResult ? `Checked ${cleanupResult.checked}, closed ${cleanupResult.closed}` : "Check job URLs for 404s and closures",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Sparkles, { style: { width: 14, height: 14 } }),
              " ",
              cleanupRunning ? "Checking\u2026" : "Clean up"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => setShowCompanies(true),
            className: JobsBoard_default.actionBtn,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Building2, { style: { width: 14, height: 14 } }),
              " Companies"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.tabs, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "button",
        {
          type: "button",
          onClick: () => {
            setActiveStatus("all");
            setJobsPage(1);
          },
          className: `${JobsBoard_default.tab} ${activeStatus === "all" ? JobsBoard_default.tabActive : ""}`,
          children: "All"
        }
      ),
      STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "button",
        {
          type: "button",
          onClick: () => {
            setActiveStatus(s);
            setJobsPage(1);
          },
          className: `${JobsBoard_default.tab} ${activeStatus === s ? JobsBoard_default.tabActive : ""}`,
          children: STATUS_LABELS[s]
        },
        s
      ))
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.skeletonGrid, children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.skeleton }, i)) }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      searchError ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.errorMsg, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }, children: searchError }) }) : searchStatus ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.statusMsg, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: JobsBoard_default.spinner }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: JobsBoard_default.statusText, children: searchStatus }),
        searchElapsed != null && searchElapsed > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: JobsBoard_default.elapsed, children: [
          Math.floor(searchElapsed / 60),
          ":",
          String(searchElapsed % 60).padStart(2, "0")
        ] })
      ] }) : null,
      !addingJob ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.addPrompt, onClick: () => setAddingJob(true), children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.addIcon, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Plus, { style: { width: 16, height: 16 } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: JobsBoard_default.addLabel, children: "Add Opportunity" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.addForm, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.addFields, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { autoFocus: true, type: "text", value: newCompany, onChange: (e) => setNewCompany(e.target.value), placeholder: "Company", className: JobsBoard_default.addInput }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { type: "text", value: newRole, onChange: (e) => setNewRole(e.target.value), placeholder: "Role title", className: JobsBoard_default.addInput }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { type: "url", value: newUrl, onChange: (e) => setNewUrl(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter") handleAddSubmit();
            if (e.key === "Escape") {
              setAddingJob(false);
              setNewCompany("");
              setNewRole("");
              setNewUrl("");
            }
          }, placeholder: "Job posting URL (optional)", className: JobsBoard_default.addInput })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.addBtns, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`, onClick: handleAddSubmit, disabled: !newCompany.trim() || !newRole.trim(), children: "Add" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: () => {
            setAddingJob(false);
            setNewCompany("");
            setNewRole("");
            setNewUrl("");
          }, children: "Cancel" })
        ] })
      ] }),
      pagedJobs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.jobGrid, children: pagedJobs.map((job, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_react5.Fragment, { children: [
          activeStatus === "saved" && i === verifiedCount && verifiedCount > 0 && verifiedCount < pagedJobs.length && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.separator, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.sepLine }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: JobsBoard_default.sepLabel, children: "Unverified URL" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.sepLine })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { animation: `fadeSlideUp 300ms ease-out ${i * 40}ms both`, minWidth: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(JobCard, { job }) })
        ] }, job.id)) }),
        filtered.length > pagedJobs.length && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", onClick: () => setJobsPage((p) => p + 1), className: JobsBoard_default.loadMoreBtn, children: [
          "Load more (",
          filtered.length - pagedJobs.length,
          " remaining)"
        ] })
      ] }),
      filtered.length === 0 && !searchStatus && !searchError && visibleResults.length === 0 && activeStatus === "all" && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.emptyState, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }, children: "No discovered jobs yet \u2014 search is running." }) }),
      filtered.length === 0 && activeStatus !== "all" && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: JobsBoard_default.emptyState, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }, children: [
        "No ",
        activeStatus,
        " jobs."
      ] }) }),
      activeStatus === "all" && searchResults && searchResults.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.discoveredSection, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: JobsBoard_default.discoveredHeader, children: [
          `Discovered \u2014 ${resultsTotal} ${resultsTotal === 1 ? "result" : "results"}`,
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: JobsBoard_default.discoveredMeta, children: [
            `${(resultsPage - 1) * PAGE_SIZE + 1}\u2013${Math.min(resultsPage * PAGE_SIZE, resultsTotal)}`,
            scrapedAt && ` \xB7 ${scrapedAt}`
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: `${JobsBoard_default.resultsGrid} ${resultsVisible ? JobsBoard_default.resultsGridVisible : JobsBoard_default.resultsGridHidden}`, children: visibleResults.map((result, i) => {
          const isNew = !seenIdsRef.current.has(result.id);
          seenIdsRef.current.add(result.id);
          return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.resultCard, style: { animationDelay: `${i * 40}ms` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.resultTop, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { minWidth: 0 }, children: [
                result.url ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("a", { href: result.url, target: "_blank", rel: "noopener noreferrer", className: JobsBoard_default.resultTitle, children: result.title }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: JobsBoard_default.resultTitle, children: result.title }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: JobsBoard_default.resultCompany, children: [
                  result.company,
                  result.location ? ` \xB7 ${result.location.length > 40 ? result.location.slice(0, 40) + "\u2026" : result.location}` : "",
                  result.score != null && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { marginLeft: 8, fontWeight: 700, fontSize: "var(--font-size-xs)", color: `hsl(${Math.round(result.score / 10 * 120)}, 72%, 40%)`, opacity: 0.85 }, children: [
                    result.score,
                    "/10"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.resultBtns, children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => onAddJob(result.company, result.title, result.url),
                    className: JobsBoard_default.resultIconBtn,
                    title: "Save to board",
                    children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Bookmark, { style: { width: 16, height: 16 } })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => dismissResult(result.id),
                    className: `${JobsBoard_default.resultIconBtn} ${JobsBoard_default.resultIconBtnDanger}`,
                    title: "Dismiss this listing",
                    children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(EyeOff, { style: { width: 16, height: 16 } })
                  }
                )
              ] })
            ] }),
            result.snippet && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: JobsBoard_default.resultSnippet, children: result.snippet }),
            (result.salary || result.postedDate) && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: JobsBoard_default.resultMeta, children: [result.salary, result.postedDate].filter(Boolean).join(" \xB7 ") })
          ] }, result.id);
        }) }),
        (resultsPage > 1 || hasMoreResults) && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: JobsBoard_default.pagination, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", disabled: resultsLoading || resultsPage <= 1, onClick: () => fetchResultsPage(resultsPage - 1), className: JobsBoard_default.pageBtn, children: "\u2190 Prev" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: JobsBoard_default.pageInfo, children: `page ${resultsPage} of ${Math.ceil(resultsTotal / PAGE_SIZE)}` }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", disabled: resultsLoading || !hasMoreResults, onClick: () => fetchResultsPage(resultsPage + 1), className: JobsBoard_default.pageBtn, children: resultsLoading ? "Loading\u2026" : "Next \u2192" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CompaniesModal, { open: showCompanies, onOpenChange: setShowCompanies })
  ] });
}

// components/calendar/CalendarPanel.tsx
var import_react6 = __toESM(require_react());

// components/ui/button.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
function resolveVariant(v) {
  if (v === "default") return "primary";
  if (v === "outline") return "secondary";
  if (v === "destructive") return "danger";
  if (v === "link") return "ghost";
  if (v === "primary" || v === "secondary" || v === "ghost" || v === "danger") return v;
  return "primary";
}
function resolveSize(s) {
  if (s === "default" || s === "icon" || s === "icon-sm") return "md";
  if (s === "xs" || s === "icon-xs") return "sm";
  if (s === "lg" || s === "icon-lg") return "lg";
  if (s === "sm" || s === "md" || s === "lg") return s;
  return "md";
}
function Button({ variant = "primary", size = "md", loading, children, className, disabled, ...rest }) {
  const resolvedVariant = resolveVariant(variant);
  const resolvedSize = resolveSize(size);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "button",
    {
      ...rest,
      disabled: disabled || loading,
      className: [Button_default.btn, Button_default[resolvedVariant], Button_default[resolvedSize], className].filter(Boolean).join(" "),
      children: loading ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: Button_default.spinner }) : children
    }
  );
}

// components/ui/skeleton.tsx
var import_jsx_runtime8 = __toESM(require_jsx_runtime());
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
    "div",
    {
      className: [Skeleton_default.skeleton, className].filter(Boolean).join(" "),
      ...props
    }
  );
}

// components/calendar/CalendarPanel.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime());
var DAY_OPTIONS = [7, 14, 30];
function CalendarPanel({ closeHref }) {
  const router = useRouter();
  const [state, setState] = (0, import_react6.useState)("loading");
  const [calendars, setCalendars] = (0, import_react6.useState)([]);
  const [error, setError] = (0, import_react6.useState)("");
  const [days, setDays] = (0, import_react6.useState)(7);
  const fetchCalendars = (0, import_react6.useCallback)(async (numDays) => {
    setState("loading");
    setError("");
    try {
      const res = await proxyFetch(`/agent/calendars?days=${numDays}`);
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        throw new Error(data2.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCalendars(data.calendars);
      setState("populated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }, []);
  (0, import_react6.useEffect)(() => {
    fetchCalendars(days);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col h-full border-l border-border/10 bg-card/80 backdrop-blur-sm w-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between px-4 py-3 border-b border-border/10", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Calendar, { className: "h-4 w-4 text-primary" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-sm", children: "Calendar" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "h-7 w-7",
          onClick: () => router.push(closeHref),
          children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(X, { className: "h-4 w-4" })
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "px-3 pt-3 pb-2 flex gap-1.5", children: [
      DAY_OPTIONS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        Button,
        {
          variant: days === d ? "default" : "outline",
          size: "sm",
          className: "h-7 text-xs px-2.5",
          onClick: () => {
            setDays(d);
            fetchCalendars(d);
          },
          children: [
            d,
            "d"
          ]
        },
        d
      )),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "h-7 w-7 ml-auto",
          onClick: () => fetchCalendars(days),
          children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(RefreshCw, { className: "h-3.5 w-3.5 text-muted-foreground" })
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex-1 overflow-y-auto px-2 pb-4", children: [
      state === "loading" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(CalendarPanelSkeleton, {}),
      state === "populated" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(CalendarList, { calendars }),
      state === "error" && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-3 text-center py-8 px-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-destructive", children: "Could not load calendars." }),
        error && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs text-muted-foreground", children: error }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Button, { variant: "outline", size: "sm", onClick: () => fetchCalendars(days), children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(RefreshCw, { className: "h-3.5 w-3.5 mr-1.5" }),
          "Retry"
        ] })
      ] })
    ] })
  ] });
}
function CalendarPanelSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "space-y-4 px-3 pt-2", children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Skeleton, { className: "h-2.5 w-2.5 rounded-full" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Skeleton, { className: "h-4 w-32" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "pl-5 space-y-1.5", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Skeleton, { className: "h-3 w-40" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Skeleton, { className: "h-3 w-28" })
    ] })
  ] }, i)) });
}

// components/career/CareerChatSessionModal.tsx
var import_react7 = __toESM(require_react());

// components/career/CareerChatSessionModal.module.css
var CareerChatSessionModal_default = {
  body: "CareerChatSessionModal_body",
  turn: "CareerChatSessionModal_turn",
  msgRow: "CareerChatSessionModal_msgRow",
  avatar: "CareerChatSessionModal_avatar",
  userMsg: "CareerChatSessionModal_userMsg",
  assistantContent: "CareerChatSessionModal_assistantContent"
};

// components/career/CareerChatSessionModal.tsx
var import_jsx_runtime10 = __toESM(require_jsx_runtime());
function CareerChatSessionModal({ session, onClose }) {
  const [messages, setMessages] = (0, import_react7.useState)([]);
  (0, import_react7.useEffect)(() => {
    if (!session) {
      setMessages([]);
      return;
    }
    idbReadChatSession(session.id).then((data) => {
      setMessages(data?.messages ?? []);
    }).catch(() => {
    });
  }, [session?.id]);
  if (!session) return null;
  const pairs = [];
  for (let i = 0; i < messages.length; i += 2) {
    const user = messages[i];
    const assistant = messages[i + 1];
    if (user) pairs.push({ user, assistant });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: Dialog_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: Dialog_default.content, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: Dialog_default.header, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h2", { className: Dialog_default.title, children: new Date(session.createdAt).toLocaleDateString(void 0, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: Dialog_default.closeBtn, onClick: onClose, "aria-label": "Close", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(X, { style: { width: 16, height: 16 } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: CareerChatSessionModal_default.body, children: pairs.map(({ user, assistant }, i) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: CareerChatSessionModal_default.turn, children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: CareerChatSessionModal_default.msgRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: CareerChatSessionModal_default.avatar, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(User, { style: { width: 14, height: 14 } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: CareerChatSessionModal_default.userMsg, children: user.message })
        ] }),
        assistant && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: CareerChatSessionModal_default.msgRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(TrippyIcon, { sizeClass: "h-10 w-10" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: CareerChatSessionModal_default.assistantContent, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            Markdown,
            {
              remarkPlugins: [remarkGfm],
              components: {
                p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children }),
                ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ul", { children }),
                ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ol", { children }),
                li: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("li", { children }),
                strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children }),
                code: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("code", { children })
              },
              children: assistant.message
            }
          ) })
        ] })
      ] }, i)) })
    ] })
  ] });
}

// components/career/CareerDashboard.module.css
var CareerDashboard_default = {
  grid: "CareerDashboard_grid"
};

// components/career/CareerDashboard.tsx
var import_jsx_runtime11 = __toESM(require_jsx_runtime());
function CareerDashboard({ userName, userImage, showHistory = false, showCalendar = false }) {
  const router = useRouter();
  const [chatSessions, setChatSessions] = (0, import_react8.useState)([]);
  const [selectedSession, setSelectedSession] = (0, import_react8.useState)(null);
  const [jobs, setJobs] = (0, import_react8.useState)([]);
  const [jobsLoading, setJobsLoading] = (0, import_react8.useState)(true);
  const [timeline, setTimeline] = (0, import_react8.useState)([]);
  const [timelineLoading, setTimelineLoading] = (0, import_react8.useState)(true);
  const [uploading, setUploading] = (0, import_react8.useState)(false);
  const [recommendation, setRecommendation] = (0, import_react8.useState)(null);
  const [recommendationLoading, setRecommendationLoading] = (0, import_react8.useState)(false);
  const [jobSearchId, setJobSearchId] = (0, import_react8.useState)(null);
  const searchTriggeredRef = (0, import_react8.useRef)(false);
  const recommendationFetchedRef = (0, import_react8.useRef)(false);
  const recommendationCache = (0, import_react8.useRef)(null);
  const localToday = () => {
    const d = /* @__PURE__ */ new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const firstName = userName.split(" ")[0] ?? userName;
  (0, import_react8.useEffect)(() => {
    if (showHistory) {
      idbListChatSessions().then((all) => setChatSessions(all.filter((s) => normalizeSkill(s.skill) === "executive-coach"))).catch(() => {
      });
    }
  }, [showHistory]);
  const fetchJobs = (0, import_react8.useCallback)(async () => {
    try {
      const res = await proxyFetch("/agent/career/jobs");
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } finally {
      setJobsLoading(false);
    }
  }, []);
  const fetchTimeline = (0, import_react8.useCallback)(async () => {
    try {
      const res = await proxyFetch("/agent/career/timeline");
      if (!res.ok) return;
      const data = await res.json();
      setTimeline(data.entries ?? []);
    } finally {
      setTimelineLoading(false);
    }
  }, []);
  (0, import_react8.useEffect)(() => {
    fetchJobs();
    fetchTimeline();
  }, [fetchJobs, fetchTimeline]);
  const fetchRecommendation = (0, import_react8.useCallback)(async () => {
    setRecommendationLoading(true);
    try {
      const today = localToday();
      if (recommendationCache.current?.date === today) {
        setRecommendation(recommendationCache.current.recommendation);
        setRecommendationLoading(false);
        return;
      }
      const res = await proxyFetch("/agent/career/recommend-job", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ localDate: today }) });
      if (res.ok) {
        const data = await res.json();
        setRecommendation(data.recommendation);
        recommendationCache.current = { recommendation: data.recommendation, date: today };
      }
    } catch {
    } finally {
      setRecommendationLoading(false);
    }
  }, []);
  (0, import_react8.useEffect)(() => {
    if (!jobsLoading && !recommendationFetchedRef.current) {
      recommendationFetchedRef.current = true;
      fetchRecommendation();
    }
  }, [jobsLoading, fetchRecommendation]);
  (0, import_react8.useEffect)(() => {
    if (searchTriggeredRef.current) return;
    searchTriggeredRef.current = true;
    (async () => {
      try {
        const res = await proxyFetch("/agent/career/job-results");
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) return;
        }
      } catch {
      }
      proxyFetch("/agent/career/refresh-companies", { method: "POST" }).catch(() => {
      });
      try {
        const startRes = await proxyFetch("/agent/career/search-jobs", { method: "POST" });
        if (!startRes.ok) return;
        const { jobId } = await startRes.json();
        setJobSearchId(jobId);
        const sw = await navigator.serviceWorker.ready;
        sw.active?.postMessage({ type: "START_JOB_SEARCH_POLL", jobId });
      } catch {
      }
    })();
  }, []);
  const handleUpload = (0, import_react8.useCallback)(async (files) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await proxyFetch("/agent/career/timeline", { method: "POST", body: form });
        if (res.ok) {
          const data = await res.json();
          if (data.entries) {
            setTimeline((prev) => [...prev, ...data.entries]);
          }
        }
      }
    } finally {
      setUploading(false);
    }
  }, []);
  const handleDeleteEntry = (0, import_react8.useCallback)(async (id) => {
    setTimeline((prev) => prev.filter((e) => e.id !== id));
    await proxyFetch(`/agent/career/timeline/${id}`, { method: "DELETE" });
  }, []);
  const handleEditEntry = (0, import_react8.useCallback)(async (id, patch) => {
    setTimeline((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e));
    await proxyFetch(`/agent/career/timeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
  }, []);
  const handleStatusChange = (0, import_react8.useCallback)(async (jobId, status) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
  }, []);
  const handleNotesChange = (0, import_react8.useCallback)(async (jobId, notes) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, notes, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes })
    });
  }, []);
  const handleUrlChange = (0, import_react8.useCallback)(async (jobId, url) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, url: url || void 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url || null })
    });
  }, []);
  const handleUrlVerifiedChange = (0, import_react8.useCallback)(async (jobId, verified) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, urlVerified: verified, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urlVerified: verified })
    });
  }, []);
  const handleOverlapsChange = (0, import_react8.useCallback)(async (jobId, overlaps) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, overlaps, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overlaps })
    });
  }, []);
  const handleJdChange = (0, import_react8.useCallback)(async (jobId, jd) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, jd: jd || void 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd: jd || null })
    });
  }, []);
  const handleJobUpdate = (0, import_react8.useCallback)((jobId, patch) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : j));
    proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => {
    });
  }, []);
  const handleSkipCompany = (0, import_react8.useCallback)(async (company) => {
    await proxyFetch("/agent/career/skip-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company })
    }).catch(() => {
    });
  }, []);
  const handleCleanupJobs = (0, import_react8.useCallback)(async () => {
    try {
      const startRes = await proxyFetch("/agent/career/jobs/cleanup", { method: "POST" });
      if (!startRes.ok) return null;
      const { jobId } = await startRes.json();
      while (true) {
        await new Promise((r) => setTimeout(r, 3e3));
        const pollRes = await proxyFetch(`/agent/career/jobs/cleanup/${jobId}`);
        if (!pollRes.ok) break;
        const data = await pollRes.json();
        if (data.status === "completed") return { checked: data.checked ?? 0, closed: data.removed ?? 0 };
        if (data.status === "failed") return null;
      }
      return null;
    } catch {
      return null;
    }
  }, []);
  const handleDeleteJob = (0, import_react8.useCallback)(async (jobId) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    await proxyFetch(`/agent/career/jobs/${jobId}`, { method: "DELETE" }).catch(() => {
    });
  }, []);
  const handleAddJob = (0, import_react8.useCallback)(async (company, role, url) => {
    const res = await proxyFetch("/agent/career/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, role, url })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.job) setJobs((prev) => [...prev, data.job]);
    }
  }, []);
  const handleFindPeople = (0, import_react8.useCallback)((_company, _role) => {
    document.querySelector('input[placeholder*="Trippy"]')?.focus();
  }, []);
  const handleAddToBoard = (0, import_react8.useCallback)((job) => {
    handleAddJob(job.company, job.role, job.url);
  }, [handleAddJob]);
  const panelActive = showHistory || showCalendar;
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(AppHeader, { userImage, userName, initials, pageTitle: `${firstName}'s Career` }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(PageShell, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { filter: panelActive ? "blur(4px)" : "none", transition: "filter 300ms" }, children: [
          panelActive && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { position: "fixed", inset: 0, zIndex: 30, cursor: "pointer" }, onClick: () => router.push("/career") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: CareerDashboard_default.grid, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              RecommendedJobCard,
              {
                loading: recommendationLoading,
                recommendation,
                savedJobs: jobs,
                onAddToBoard: handleAddToBoard,
                onFindPeople: handleFindPeople
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              TimelineTile,
              {
                entries: timeline,
                loading: timelineLoading,
                uploading,
                onUpload: handleUpload,
                onDelete: handleDeleteEntry,
                onEdit: handleEditEntry
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              JobsBoard,
              {
                jobs,
                loading: jobsLoading,
                onStatusChange: handleStatusChange,
                onNotesChange: handleNotesChange,
                onJdChange: handleJdChange,
                onOverlapsChange: handleOverlapsChange,
                onJobUpdate: handleJobUpdate,
                onUrlChange: handleUrlChange,
                onUrlVerifiedChange: handleUrlVerifiedChange,
                onAddJob: handleAddJob,
                onSkipCompany: handleSkipCompany,
                onDeleteJob: handleDeleteJob,
                onCleanupJobs: handleCleanupJobs,
                jobSearchId
              }
            )
          ] })
        ] }),
        showHistory && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { position: "fixed", top: 64, bottom: 0, left: 0, width: 256, zIndex: 40, boxShadow: "var(--shadow-lg)", background: "var(--color-surface)", borderRight: "1px solid var(--color-border)", overflowY: "auto", display: "flex", flexDirection: "column" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { style: { fontSize: "var(--font-size-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }, children: "Chat History" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", onClick: () => router.push("/career"), style: { color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)", background: "none", border: "none" }, children: "\u2715" })
          ] }),
          chatSessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", padding: "24px 16px" }, children: "No sessions yet." }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ul", { style: { flex: 1, padding: "8px 0", listStyle: "none", margin: 0 }, children: chatSessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
            "li",
            {
              style: { padding: "8px 16px", cursor: "pointer" },
              onClick: () => setSelectedSession(s),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { style: { fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }, children: s.title || "Career chat" }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2 }, children: new Date(s.createdAt).toLocaleDateString() })
              ]
            },
            s.id
          )) })
        ] }),
        showCalendar && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { position: "fixed", top: 64, bottom: 0, right: 0, width: 320, zIndex: 40, boxShadow: "var(--shadow-lg)" }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CalendarPanel, { closeHref: "/career" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        FloatingAssistant,
        {
          onAgentAction: fetchJobs
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        CareerChatSessionModal,
        {
          session: selectedSession,
          onClose: () => setSelectedSession(null)
        }
      )
    ] })
  ] });
}

// react-entries/career.tsx
var import_jsx_runtime12 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime12.jsx)(CareerDashboard, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
