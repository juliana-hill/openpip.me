import {
  User,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react,
  useRouter,
  useThemeSync
} from "./chunk-CJP2RCVW.js";
import {
  __toESM
} from "./chunk-U67V476Y.js";

// react-entries/network.tsx
var import_client = __toESM(require_client());

// components/career/ContactsBoard.tsx
var import_react = __toESM(require_react());

// components/career/ContactCard.module.css
var ContactCard_default = {
  card: "ContactCard_card",
  row: "ContactCard_row",
  titleGroup: "ContactCard_titleGroup",
  avatar: "ContactCard_avatar",
  textStack: "ContactCard_textStack",
  name: "ContactCard_name",
  meta: "ContactCard_meta",
  statusBadge: "ContactCard_statusBadge",
  statusNotContacted: "ContactCard_statusNotContacted",
  statusConnectionRequested: "ContactCard_statusConnectionRequested",
  statusConnected: "ContactCard_statusConnected",
  statusMessaged: "ContactCard_statusMessaged",
  statusReplied: "ContactCard_statusReplied",
  statusMeeting: "ContactCard_statusMeeting",
  statusFollowedUp: "ContactCard_statusFollowedUp",
  notes: "ContactCard_notes",
  footer: "ContactCard_footer",
  footerMeta: "ContactCard_footerMeta",
  linkedInLink: "ContactCard_linkedInLink"
};

// components/career/ContactCard.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
var STATUS_CLASS = {
  not_contacted: ContactCard_default.statusNotContacted,
  connection_requested: ContactCard_default.statusConnectionRequested,
  connected: ContactCard_default.statusConnected,
  messaged: ContactCard_default.statusMessaged,
  replied: ContactCard_default.statusReplied,
  meeting_scheduled: ContactCard_default.statusMeeting,
  followed_up: ContactCard_default.statusFollowedUp
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
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 864e5);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
function ContactCard({ contact, onClick }) {
  const router = useRouter();
  const initials = contact.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const lastSeen = contact.lastInteractionDate ?? contact.updatedAt ?? contact.addedAt;
  const handleClick = () => {
    if (onClick) {
      onClick(contact);
      return;
    }
    router.push(`/network/contacts/${contact.id}`);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ContactCard_default.card, onClick: handleClick, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ContactCard_default.row, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ContactCard_default.titleGroup, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: ContactCard_default.avatar, children: initials || /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { style: { width: 16, height: 16 } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ContactCard_default.textStack, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { className: ContactCard_default.name, children: contact.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: ContactCard_default.meta, children: [
            contact.role,
            " \xB7 ",
            contact.company
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${ContactCard_default.statusBadge} ${STATUS_CLASS[contact.status]}`, children: STATUS_LABELS[contact.status] })
    ] }),
    contact.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: ContactCard_default.notes, children: contact.notes }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ContactCard_default.footer, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: ContactCard_default.footerMeta, children: [
        "Last: ",
        timeAgo(lastSeen)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "a",
        {
          href: `https://contacts.google.com/person/${contact.id}`,
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: (e) => e.stopPropagation(),
          className: ContactCard_default.linkedInLink,
          children: "Google Contacts \u2192"
        }
      )
    ] })
  ] });
}

// components/career/JobsBoard.module.css
var JobsBoard_default = {
  board: "JobsBoard_board",
  topBar: "JobsBoard_topBar",
  heading: "JobsBoard_heading",
  subRow: "JobsBoard_subRow",
  pulse: "JobsBoard_pulse",
  subLabel: "JobsBoard_subLabel",
  actions: "JobsBoard_actions",
  actionBtn: "JobsBoard_actionBtn",
  tabs: "JobsBoard_tabs",
  tab: "JobsBoard_tab",
  tabActive: "JobsBoard_tabActive",
  skeletonGrid: "JobsBoard_skeletonGrid",
  skeleton: "JobsBoard_skeleton",
  shimmer: "JobsBoard_shimmer",
  statusMsg: "JobsBoard_statusMsg",
  spinner: "JobsBoard_spinner",
  spin: "JobsBoard_spin",
  statusText: "JobsBoard_statusText",
  fadeOscillate: "JobsBoard_fadeOscillate",
  elapsed: "JobsBoard_elapsed",
  errorMsg: "JobsBoard_errorMsg",
  addPrompt: "JobsBoard_addPrompt",
  addIcon: "JobsBoard_addIcon",
  addLabel: "JobsBoard_addLabel",
  addForm: "JobsBoard_addForm",
  addFields: "JobsBoard_addFields",
  addInput: "JobsBoard_addInput",
  addBtns: "JobsBoard_addBtns",
  jobGrid: "JobsBoard_jobGrid",
  separator: "JobsBoard_separator",
  sepLine: "JobsBoard_sepLine",
  sepLabel: "JobsBoard_sepLabel",
  loadMoreBtn: "JobsBoard_loadMoreBtn",
  emptyState: "JobsBoard_emptyState",
  discoveredSection: "JobsBoard_discoveredSection",
  discoveredHeader: "JobsBoard_discoveredHeader",
  discoveredMeta: "JobsBoard_discoveredMeta",
  resultsGrid: "JobsBoard_resultsGrid",
  resultsGridHidden: "JobsBoard_resultsGridHidden",
  resultsGridVisible: "JobsBoard_resultsGridVisible",
  resultCard: "JobsBoard_resultCard",
  fadeSlideUp: "JobsBoard_fadeSlideUp",
  resultTop: "JobsBoard_resultTop",
  resultTitle: "JobsBoard_resultTitle",
  resultCompany: "JobsBoard_resultCompany",
  resultBtns: "JobsBoard_resultBtns",
  resultIconBtn: "JobsBoard_resultIconBtn",
  resultIconBtnDanger: "JobsBoard_resultIconBtnDanger",
  resultSnippet: "JobsBoard_resultSnippet",
  resultMeta: "JobsBoard_resultMeta",
  pagination: "JobsBoard_pagination",
  pageBtn: "JobsBoard_pageBtn",
  pageInfo: "JobsBoard_pageInfo"
};

// components/career/ContactsBoard.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "not_contacted", label: "Not contacted" },
  { value: "connection_requested", label: "Req. sent" },
  { value: "connected", label: "Connected" },
  { value: "messaged", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "meeting_scheduled", label: "Meeting set" },
  { value: "followed_up", label: "Followed up" }
];
function ContactsBoard() {
  useThemeSync();
  const [contacts, setContacts] = (0, import_react.useState)([]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [activeStatus, setActiveStatus] = (0, import_react.useState)("all");
  const fetchContacts = (0, import_react.useCallback)(async () => {
    try {
      const res = await proxyFetch("/agent/career/contacts");
      if (!res.ok) return;
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  (0, import_react.useEffect)(() => {
    fetchContacts();
  }, [fetchContacts]);
  const filtered = activeStatus === "all" ? contacts : contacts.filter((c) => c.status === activeStatus);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.board, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.topBar, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: JobsBoard_default.heading, children: "Contacts" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.subRow, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: JobsBoard_default.subLabel, children: [
        contacts.length,
        " contact",
        contacts.length !== 1 ? "s" : ""
      ] }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.tabs, children: STATUS_FILTERS.map(({ value, label }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        onClick: () => setActiveStatus(value),
        className: `${JobsBoard_default.tab} ${activeStatus === value ? JobsBoard_default.tabActive : ""}`,
        children: label
      },
      value
    )) }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.skeletonGrid, children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.skeleton }, i)) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      filtered.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.jobGrid, children: filtered.map((c) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ContactCard, { contact: c }, c.id)) }),
      filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginTop: 8 }, children: contacts.length === 0 ? "No contacts tracked yet \u2014 the agent will propose adding someone here once it's worth following up with." : "No contacts with this status." })
    ] })
  ] });
}

// react-entries/network.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ContactsBoard, {}));
}
void mount();
