import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  ExternalLink,
  Plus,
  User,
  Users,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react,
  useRouter
} from "./chunk-2OHSVDHZ.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

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
  const lastSeen = contact.lastInteractionDate ?? contact.updatedAt;
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
      contact.linkedInUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "a",
        {
          href: contact.linkedInUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: (e) => e.stopPropagation(),
          className: ContactCard_default.linkedInLink,
          children: "LinkedIn \u2192"
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ContactCard_default.footerMeta, children: contact.source.replace("_", " ") })
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
  const [contacts, setContacts] = (0, import_react.useState)([]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [activeStatus, setActiveStatus] = (0, import_react.useState)("all");
  const [adding, setAdding] = (0, import_react.useState)(false);
  const [newName, setNewName] = (0, import_react.useState)("");
  const [newRole, setNewRole] = (0, import_react.useState)("");
  const [newCompany, setNewCompany] = (0, import_react.useState)("");
  const [newLinkedIn, setNewLinkedIn] = (0, import_react.useState)("");
  const [newEmail, setNewEmail] = (0, import_react.useState)("");
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [searchCompany, setSearchCompany] = (0, import_react.useState)("");
  const [searchRole, setSearchRole] = (0, import_react.useState)("");
  const [searching, setSearching] = (0, import_react.useState)(false);
  const [searchResults, setSearchResults] = (0, import_react.useState)([]);
  const [searchError, setSearchError] = (0, import_react.useState)(false);
  const [showSearch, setShowSearch] = (0, import_react.useState)(false);
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
  const handleAdd = (0, import_react.useCallback)(async () => {
    if (!newName.trim() || !newRole.trim() || !newCompany.trim()) return;
    setSaving(true);
    try {
      const res = await proxyFetch("/agent/career/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          role: newRole.trim(),
          company: newCompany.trim(),
          email: newEmail.trim() || void 0,
          linkedInUrl: newLinkedIn.trim() || void 0,
          source: "manual"
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contact) setContacts((prev) => [data.contact, ...prev]);
        setNewName("");
        setNewRole("");
        setNewCompany("");
        setNewEmail("");
        setNewLinkedIn("");
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  }, [newName, newRole, newCompany, newEmail, newLinkedIn]);
  const handleSaveFromSearch = (0, import_react.useCallback)(async (result) => {
    const res = await proxyFetch("/agent/career/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.name,
        role: result.title ?? "Unknown role",
        company: result.company ?? searchCompany,
        linkedInUrl: result.url ?? void 0,
        source: "find_people"
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.contact) setContacts((prev) => [data.contact, ...prev]);
    }
  }, [searchCompany]);
  const handleSearch = (0, import_react.useCallback)(async () => {
    if (!searchCompany.trim()) return;
    setSearching(true);
    setSearchError(false);
    setSearchResults([]);
    try {
      const res = await proxyFetch("/agent/career/find-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: searchCompany.trim(), role: searchRole.trim() })
      });
      if (!res.ok) {
        setSearchError(true);
        setSearching(false);
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
          setSearchResults((msg.contacts ?? []).slice(0, 8));
          setSearching(false);
          bc.removeEventListener("message", onMsg);
          bc.close();
        } else if (msg.status === "failed") {
          setSearchError(true);
          setSearching(false);
          bc.removeEventListener("message", onMsg);
          bc.close();
        }
      });
    } catch {
      setSearchError(true);
      setSearching(false);
    }
  }, [searchCompany, searchRole]);
  const filtered = activeStatus === "all" ? contacts : contacts.filter((c) => c.status === activeStatus);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.board, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.topBar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: JobsBoard_default.heading, children: "Contacts" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.subRow, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: JobsBoard_default.subLabel, children: [
          contacts.length,
          " contact",
          contacts.length !== 1 ? "s" : ""
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "button",
        {
          type: "button",
          className: JobsBoard_default.actionBtn,
          onClick: () => {
            setShowSearch((v) => !v);
            setAdding(false);
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Users, { style: { width: 14, height: 14 } }),
            " Network Search"
          ]
        }
      ) })
    ] }),
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
    showSearch && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.addForm, style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.addFields, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            autoFocus: true,
            placeholder: "Company name",
            value: searchCompany,
            onChange: (e) => setSearchCompany(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") handleSearch();
            },
            className: JobsBoard_default.addInput
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            placeholder: "Role (optional)",
            value: searchRole,
            onChange: (e) => setSearchRole(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") handleSearch();
            },
            className: JobsBoard_default.addInput
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.addBtns, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            type: "button",
            className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`,
            onClick: handleSearch,
            disabled: searching || !searchCompany.trim(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Users, { size: 13 }),
              " ",
              searching ? "Searching\u2026" : "Find People"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`,
            onClick: () => {
              setShowSearch(false);
              setSearchResults([]);
              setSearchCompany("");
              setSearchRole("");
            },
            children: "Cancel"
          }
        )
      ] }),
      searchError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "#e5383b", margin: "8px 0 0" }, children: "Couldn't find people \u2014 try searching on LinkedIn directly." }),
      searchResults.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }, children: searchResults.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--color-bg)", borderRadius: 10, border: "1px solid var(--color-border)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { width: 32, height: 32, borderRadius: 8, background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "var(--font-size-sm)", color: "var(--color-accent)", flexShrink: 0 }, children: r.name.charAt(0).toUpperCase() }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: 0, fontWeight: 700, fontSize: "var(--font-size-sm)", color: "var(--color-text)" }, children: r.name }),
          r.title && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { style: { margin: 0, fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }, children: [
            r.title,
            r.company ? ` \xB7 ${r.company}` : ""
          ] })
        ] }),
        r.url && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("a", { href: r.url, target: "_blank", rel: "noopener noreferrer", style: { color: "var(--color-text-muted)", display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ExternalLink, { size: 13 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`,
            onClick: () => handleSaveFromSearch(r),
            children: "Save"
          }
        )
      ] }, i)) })
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.skeletonGrid, children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.skeleton }, i)) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      !adding ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.addPrompt, onClick: () => {
        setAdding(true);
        setShowSearch(false);
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.addIcon, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Plus, { style: { width: 16, height: 16 } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: JobsBoard_default.addLabel, children: "Add Contact" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.addForm, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.addFields, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { autoFocus: true, placeholder: "Name *", value: newName, onChange: (e) => setNewName(e.target.value), className: JobsBoard_default.addInput }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { placeholder: "Role *", value: newRole, onChange: (e) => setNewRole(e.target.value), className: JobsBoard_default.addInput }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { placeholder: "Company *", value: newCompany, onChange: (e) => setNewCompany(e.target.value), className: JobsBoard_default.addInput }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { placeholder: "Email", type: "email", value: newEmail, onChange: (e) => setNewEmail(e.target.value), className: JobsBoard_default.addInput }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { placeholder: "LinkedIn URL", value: newLinkedIn, onChange: (e) => setNewLinkedIn(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") setAdding(false);
          }, className: JobsBoard_default.addInput })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: JobsBoard_default.addBtns, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.primary} ${Button_default.sm}`, onClick: handleAdd, disabled: saving || !newName.trim() || !newRole.trim() || !newCompany.trim(), children: saving ? "Saving\u2026" : "Add" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`, onClick: () => {
            setAdding(false);
            setNewName("");
            setNewRole("");
            setNewCompany("");
            setNewEmail("");
            setNewLinkedIn("");
          }, children: "Cancel" })
        ] })
      ] }),
      filtered.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: JobsBoard_default.jobGrid, children: filtered.map((c) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ContactCard, { contact: c }, c.id)) }),
      filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginTop: 8 }, children: contacts.length === 0 ? "No contacts yet \u2014 add one or run a network search." : "No contacts with this status." })
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
