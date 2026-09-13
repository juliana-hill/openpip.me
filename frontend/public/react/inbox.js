import {
  InboxHeader_default,
  InboxTab_default
} from "./chunk-GIUJGCQJ.js";
import {
  Dialog_default
} from "./chunk-VGRKXESR.js";
import {
  FloatingAssistant,
  ReadAloudButton
} from "./chunk-FT3IJZ4L.js";
import {
  AppHeader,
  Link,
  useAgentIdentity
} from "./chunk-5Y7KWAY6.js";
import "./chunk-OHWNV7E6.js";
import {
  X,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react,
  require_react_dom,
  useSearchParams
} from "./chunk-CJP2RCVW.js";
import {
  __toESM
} from "./chunk-U67V476Y.js";

// react-entries/inbox.tsx
var import_client = __toESM(require_client());

// components/inbox/InboxPage.tsx
var import_react14 = __toESM(require_react());

// components/inbox/inbox/InboxTab.tsx
var import_react8 = __toESM(require_react());

// components/inbox/inbox/InboxHeader.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function InboxHeader({ unreadCount, onCompose }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: InboxHeader_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: InboxHeader_default.left, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: InboxHeader_default.title, children: "Inbox" }),
      unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: InboxHeader_default.unreadPill, children: [
        unreadCount,
        " UNREAD"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: InboxHeader_default.composeBtn, onClick: onCompose, children: "Compose" })
  ] });
}

// components/inbox/inbox/SearchSortBar.module.css
var SearchSortBar_default = {
  bar: "SearchSortBar_bar",
  searchWrap: "SearchSortBar_searchWrap",
  searchIcon: "SearchSortBar_searchIcon",
  input: "SearchSortBar_input",
  clear: "SearchSortBar_clear",
  controls: "SearchSortBar_controls",
  sortSelect: "SearchSortBar_sortSelect",
  iconBtn: "SearchSortBar_iconBtn",
  active: "SearchSortBar_active"
};

// components/inbox/inbox/SearchSortBar.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
function SearchSortBar({ search, sort, grouped, onSearch, onSort, onGroupToggle, onRefresh }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SearchSortBar_default.bar, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SearchSortBar_default.searchWrap, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SearchSortBar_default.searchIcon, children: "\u{1F50D}" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          className: SearchSortBar_default.input,
          placeholder: "Search emails...",
          value: search,
          onChange: (e) => onSearch(e.target.value)
        }
      ),
      search && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: SearchSortBar_default.clear, onClick: () => onSearch(""), "aria-label": "Clear", children: "\u2715" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SearchSortBar_default.controls, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "select",
        {
          className: SearchSortBar_default.sortSelect,
          value: sort,
          onChange: (e) => onSort(e.target.value),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "date", children: "Date" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "sender", children: "Sender" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "count", children: "Count" })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          className: `${SearchSortBar_default.iconBtn} ${grouped ? SearchSortBar_default.active : ""}`,
          onClick: onGroupToggle,
          title: grouped ? "Ungroup" : "Group by sender",
          children: "\u229E"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: SearchSortBar_default.iconBtn, onClick: onRefresh, title: "Refresh", children: "\u21BB" })
    ] })
  ] });
}

// components/inbox/inbox/TagFilterStrip.tsx
var import_react2 = __toESM(require_react());

// components/inbox/inbox/TagManagerModal.tsx
var import_react_dom = __toESM(require_react_dom());
var import_react = __toESM(require_react());

// components/inbox/inbox/TagManagerModal.module.css
var TagManagerModal_default = {
  overlay: "TagManagerModal_overlay",
  modal: "TagManagerModal_modal",
  header: "TagManagerModal_header",
  title: "TagManagerModal_title",
  closeBtn: "TagManagerModal_closeBtn",
  error: "TagManagerModal_error",
  list: "TagManagerModal_list",
  empty: "TagManagerModal_empty",
  row: "TagManagerModal_row",
  colorDot: "TagManagerModal_colorDot",
  tagName: "TagManagerModal_tagName",
  input: "TagManagerModal_input",
  swatches: "TagManagerModal_swatches",
  swatch: "TagManagerModal_swatch",
  swatchActive: "TagManagerModal_swatchActive",
  editBtn: "TagManagerModal_editBtn",
  saveBtn: "TagManagerModal_saveBtn",
  createBtn: "TagManagerModal_createBtn",
  cancelBtn: "TagManagerModal_cancelBtn",
  deleteBtn: "TagManagerModal_deleteBtn",
  create: "TagManagerModal_create"
};

// components/inbox/inbox/TagManagerModal.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
var PRESET_COLORS = [
  "#f47560",
  "#45dfa4",
  "#1877f2",
  "#9b72cf",
  "#efbab0",
  "#6b9e6b",
  "#e5383b",
  "#f4a261"
];
function TagManagerModal({ tags: initialTags, onClose }) {
  const [tags, setTags] = (0, import_react.useState)(initialTags);
  const [mounted, setMounted] = (0, import_react.useState)(false);
  const [editingId, setEditingId] = (0, import_react.useState)(null);
  const [newName, setNewName] = (0, import_react.useState)("");
  const [newColor, setNewColor] = (0, import_react.useState)(PRESET_COLORS[0]);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => setMounted(true), []);
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await proxyFetch("/agent/inbox/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor })
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed");
        return;
      }
      const tag = await res.json();
      setTags((prev) => [...prev, tag]);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
    } catch {
      setError("Failed to create tag");
    } finally {
      setSaving(false);
    }
  };
  const handleUpdate = async (tag, name, color) => {
    setSaving(true);
    setError("");
    try {
      const res = await proxyFetch(`/agent/inbox/tags/${tag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color })
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed");
        return;
      }
      const updated = await res.json();
      setTags((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      setEditingId(null);
    } catch {
      setError("Failed to update tag");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    setSaving(true);
    setError("");
    try {
      const res = await proxyFetch(`/agent/inbox/tags/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed");
        return;
      }
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete tag");
    } finally {
      setSaving(false);
    }
  };
  if (!mounted) return null;
  return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TagManagerModal_default.overlay, onClick: () => onClose(tags), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      className: TagManagerModal_default.modal,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "manage-tags-title",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: TagManagerModal_default.header, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: TagManagerModal_default.title, id: "manage-tags-title", children: "Manage Tags" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: TagManagerModal_default.closeBtn, onClick: () => onClose(tags), children: "\xD7" })
        ] }),
        error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: TagManagerModal_default.error, children: error }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("ul", { className: TagManagerModal_default.list, children: [
          tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            TagRow,
            {
              tag,
              editing: editingId === tag.id,
              presetColors: PRESET_COLORS,
              onEdit: () => setEditingId(tag.id),
              onSave: (name, color) => handleUpdate(tag, name, color),
              onCancel: () => setEditingId(null),
              onDelete: () => handleDelete(tag.id),
              disabled: saving
            },
            tag.id
          )),
          tags.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("li", { className: TagManagerModal_default.empty, children: "No tags yet \u2014 create one below." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: TagManagerModal_default.create, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "input",
            {
              className: TagManagerModal_default.input,
              placeholder: "New tag name",
              value: newName,
              onChange: (e) => setNewName(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && handleCreate(),
              disabled: saving
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TagManagerModal_default.swatches, children: PRESET_COLORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              className: `${TagManagerModal_default.swatch} ${newColor === c ? TagManagerModal_default.swatchActive : ""}`,
              style: { background: c },
              onClick: () => setNewColor(c),
              "aria-label": c
            },
            c
          )) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: TagManagerModal_default.createBtn, onClick: handleCreate, disabled: saving || !newName.trim(), children: "Add" })
        ] })
      ]
    }
  ) }), document.body);
}
function TagRow({
  tag,
  editing,
  presetColors,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  disabled
}) {
  const [name, setName] = (0, import_react.useState)(tag.name);
  const [color, setColor] = (0, import_react.useState)(tag.color);
  if (editing) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: TagManagerModal_default.row, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          className: TagManagerModal_default.input,
          value: name,
          onChange: (e) => setName(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && onSave(name, color),
          disabled,
          autoFocus: true
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TagManagerModal_default.swatches, children: presetColors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          className: `${TagManagerModal_default.swatch} ${color === c ? TagManagerModal_default.swatchActive : ""}`,
          style: { background: c },
          onClick: () => setColor(c)
        },
        c
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: TagManagerModal_default.saveBtn, onClick: () => onSave(name, color), disabled, children: "Save" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: TagManagerModal_default.cancelBtn, onClick: onCancel, disabled, children: "Cancel" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: TagManagerModal_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: TagManagerModal_default.colorDot, style: { background: tag.color } }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: TagManagerModal_default.tagName, children: tag.name }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: TagManagerModal_default.editBtn, onClick: onEdit, disabled, children: "Edit" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: TagManagerModal_default.deleteBtn, onClick: onDelete, disabled, children: "Delete" })
  ] });
}

// components/inbox/inbox/TagFilterStrip.module.css
var TagFilterStrip_default = {
  strip: "TagFilterStrip_strip",
  staticPill: "TagFilterStrip_staticPill",
  manageBtn: "TagFilterStrip_manageBtn",
  scrollArea: "TagFilterStrip_scrollArea",
  pill: "TagFilterStrip_pill",
  active: "TagFilterStrip_active",
  dot: "TagFilterStrip_dot",
  count: "TagFilterStrip_count",
  actionPill: "TagFilterStrip_actionPill",
  dangerPill: "TagFilterStrip_dangerPill"
};

// components/inbox/inbox/TagFilterStrip.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
function TagFilterStrip({ tags, tagObjects, active, onChange, onManageTags, selectedEmails = [], onArchive, onDelete, onBlockSender }) {
  const [managing, setManaging] = (0, import_react2.useState)(false);
  const [confirmingBlock, setConfirmingBlock] = (0, import_react2.useState)(false);
  const colorMap = new Map(tagObjects.map((t) => [t.name, t.color]));
  const staticFilters = ["Unread", "Drafts"];
  const userLabels = Array.from(tags.keys()).filter((tag) => !staticFilters.includes(tag));
  const allTags = [...staticFilters, ...userLabels, tags.size > 0 ? "Untagged" : null].filter(Boolean);
  const uniqueSenders = Array.from(new Set(selectedEmails.map((e) => e.fromEmail).filter(Boolean)));
  const handleConfirmBlock = () => {
    setConfirmingBlock(false);
    onBlockSender?.(
      selectedEmails.map((e) => e.id),
      uniqueSenders
    );
  };
  const renderTagPill = (tag) => {
    const color = colorMap.get(tag);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "button",
      {
        className: `${TagFilterStrip_default.pill} ${active === tag ? TagFilterStrip_default.active : ""}`,
        onClick: () => onChange(tag),
        children: [
          color && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: TagFilterStrip_default.dot, style: { background: color } }),
          tag
        ]
      },
      tag
    );
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: TagFilterStrip_default.strip, children: [
      staticFilters.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: TagFilterStrip_default.staticPill, children: renderTagPill(tag) }, tag)),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: TagFilterStrip_default.scrollArea, children: [
        allTags.slice(staticFilters.length).map(renderTagPill),
        selectedEmails.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          onArchive && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: `${TagFilterStrip_default.pill} ${TagFilterStrip_default.actionPill}`, onClick: onArchive, children: "\u{1F4E6} Archive" }),
          onDelete && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: `${TagFilterStrip_default.pill} ${TagFilterStrip_default.dangerPill}`, onClick: onDelete, children: "\u{1F5D1} Delete" }),
          onBlockSender && (confirmingBlock ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { className: `${TagFilterStrip_default.pill} ${TagFilterStrip_default.dangerPill}`, onClick: handleConfirmBlock, children: [
              "\u2713 Block ",
              uniqueSenders.length === 1 ? uniqueSenders[0] : `${uniqueSenders.length} senders`
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: `${TagFilterStrip_default.pill} ${TagFilterStrip_default.actionPill}`, onClick: () => setConfirmingBlock(false), children: "\u2715 Cancel" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: `${TagFilterStrip_default.pill} ${TagFilterStrip_default.dangerPill}`, onClick: () => setConfirmingBlock(true), children: "\u{1F6AB} Block sender" }))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          className: TagFilterStrip_default.manageBtn,
          onClick: () => setManaging(true),
          title: "Manage tags",
          children: "\uFF0B Tags"
        }
      )
    ] }),
    managing && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      TagManagerModal,
      {
        tags: tagObjects,
        onClose: (updatedTags) => {
          setManaging(false);
          onManageTags(updatedTags);
        }
      }
    )
  ] });
}

// components/inbox/inbox/GroupedEmailList.tsx
var import_react4 = __toESM(require_react());

// components/inbox/inbox/SenderGroupHeader.module.css
var SenderGroupHeader_default = {
  header: "SenderGroupHeader_header",
  avatar: "SenderGroupHeader_avatar",
  info: "SenderGroupHeader_info",
  nameRow: "SenderGroupHeader_nameRow",
  name: "SenderGroupHeader_name",
  unreadBadge: "SenderGroupHeader_unreadBadge",
  count: "SenderGroupHeader_count",
  email: "SenderGroupHeader_email",
  right: "SenderGroupHeader_right",
  date: "SenderGroupHeader_date",
  chevron: "SenderGroupHeader_chevron"
};

// components/inbox/inbox/SenderGroupHeader.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
function SenderGroupHeader({ group, unreadCount, expanded, onToggle }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: SenderGroupHeader_default.header, onClick: onToggle, role: "button", tabIndex: 0, onKeyDown: (e) => e.key === "Enter" && onToggle(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: SenderGroupHeader_default.avatar, children: initials(group.sender) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: SenderGroupHeader_default.info, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: SenderGroupHeader_default.nameRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: SenderGroupHeader_default.name, children: group.sender }),
        unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: SenderGroupHeader_default.unreadBadge, children: unreadCount }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: SenderGroupHeader_default.count, children: group.emails.length })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: SenderGroupHeader_default.email, children: group.senderEmail })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: SenderGroupHeader_default.right, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: SenderGroupHeader_default.date, children: formatDate(group.latestDate) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: SenderGroupHeader_default.chevron, children: expanded ? "\u25BE" : "\u203A" })
    ] })
  ] });
}

// components/inbox/inbox/EmailRow.tsx
var import_react3 = __toESM(require_react());

// components/inbox/inbox/TagBadge.module.css
var TagBadge_default = {
  badge: "TagBadge_badge",
  sm: "TagBadge_sm",
  md: "TagBadge_md",
  remove: "TagBadge_remove"
};

// components/inbox/inbox/TagBadge.tsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
function TagBadge({ tag, onRemove, size = "md" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "span",
    {
      className: `${TagBadge_default.badge} ${size === "sm" ? TagBadge_default.sm : TagBadge_default.md}`,
      style: {
        backgroundColor: tag.color + "20",
        color: tag.color,
        border: `1px solid ${tag.color}40`
      },
      children: [
        tag.name,
        onRemove && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "button",
          {
            className: TagBadge_default.remove,
            onClick: (e) => {
              e.stopPropagation();
              onRemove();
            },
            "aria-label": `Remove ${tag.name}`,
            children: "\xD7"
          }
        )
      ]
    }
  );
}

// components/inbox/inbox/EmailRow.module.css
var EmailRow_default = {
  row: "EmailRow_row",
  actions: "EmailRow_actions",
  selected: "EmailRow_selected",
  indented: "EmailRow_indented",
  checkbox: "EmailRow_checkbox",
  checkboxChecked: "EmailRow_checkboxChecked",
  unreadDot: "EmailRow_unreadDot",
  body: "EmailRow_body",
  top: "EmailRow_top",
  subject: "EmailRow_subject",
  bold: "EmailRow_bold",
  draftStatus: "EmailRow_draftStatus",
  gmailDraftStatus: "EmailRow_gmailDraftStatus",
  sourceBadge: "EmailRow_sourceBadge",
  source_gmail: "EmailRow_source_gmail",
  tagPill: "EmailRow_tagPill",
  snippet: "EmailRow_snippet",
  meta: "EmailRow_meta",
  date: "EmailRow_date",
  actionBtn: "EmailRow_actionBtn",
  tagDropdownWrap: "EmailRow_tagDropdownWrap",
  addTagBtn: "EmailRow_addTagBtn",
  tagDropdown: "EmailRow_tagDropdown",
  tagDropdownItem: "EmailRow_tagDropdownItem",
  tagDot: "EmailRow_tagDot"
};

// components/inbox/inbox/EmailRow.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
function formatDate2(iso) {
  try {
    return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
function EmailRow({ email, tags, selected, onToggleSelect, onArchive, onDelete, onReply, onView, onTagsChanged, indented }) {
  const [tagOpen, setTagOpen] = (0, import_react3.useState)(false);
  const [dropdownPos, setDropdownPos] = (0, import_react3.useState)({ top: 0, left: 0 });
  const btnRef = (0, import_react3.useRef)(null);
  const dropdownRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    if (!tagOpen) return;
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setTagOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tagOpen]);
  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const estimatedHeight = assignable.length * 32 + 8;
      const flippedUp = r.bottom + estimatedHeight > window.innerHeight;
      setDropdownPos({
        top: flippedUp ? r.top - estimatedHeight - 4 : r.bottom + 4,
        left: r.left
      });
    }
    setTagOpen((o) => !o);
  };
  const assignedNames = new Set(email.tags.filter((tag) => tag !== "Draft"));
  const assignable = tags.filter((t) => t.name !== "Draft" && !assignedNames.has(t.name));
  const assignedTags = tags.filter((t) => assignedNames.has(t.name));
  const handleAssign = async (tag) => {
    setTagOpen(false);
    try {
      const res = await proxyFetch("/agent/inbox/messages/assign-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: email.id, tagId: tag.id })
      });
      if (!res.ok) return;
      const result = await res.json();
      const labelIds = Array.isArray(result.labelIds) ? new Set(result.labelIds.map(String)) : null;
      const nextTags = labelIds ? tags.filter((item) => labelIds.has(item.id)).map((item) => item.name) : [...email.tags, tag.name];
      onTagsChanged?.({ ...email, tags: nextTags });
    } catch {
    }
  };
  const handleRemove = async (tag) => {
    try {
      const res = await proxyFetch("/agent/inbox/messages/remove-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: email.id, tagId: tag.id })
      });
      if (!res.ok) return;
      const result = await res.json();
      const labelIds = Array.isArray(result.labelIds) ? new Set(result.labelIds.map(String)) : null;
      const nextTags = labelIds ? tags.filter((item) => labelIds.has(item.id)).map((item) => item.name) : email.tags.filter((name) => name !== tag.name);
      onTagsChanged?.({ ...email, tags: nextTags });
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: `${EmailRow_default.row} ${selected ? EmailRow_default.selected : ""} ${indented ? EmailRow_default.indented : ""}`, onClick: onView, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "span",
      {
        className: `${EmailRow_default.checkbox} ${selected ? EmailRow_default.checkboxChecked : ""}`,
        onClick: (e) => {
          e.stopPropagation();
          onToggleSelect();
        },
        role: "checkbox",
        "aria-checked": selected,
        children: selected && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("svg", { width: "10", height: "8", viewBox: "0 0 10 8", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("path", { d: "M1 4l3 3 5-6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) })
      }
    ),
    email.unread && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: EmailRow_default.unreadDot }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: EmailRow_default.body, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: EmailRow_default.top, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `${EmailRow_default.subject} ${email.unread ? EmailRow_default.bold : ""}`, children: email.subject }),
        email.gmailDraft && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: EmailRow_default.gmailDraftStatus, children: "Draft" }),
        email.hasDraft && !email.gmailDraft && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: EmailRow_default.draftStatus, children: "Draft" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `${EmailRow_default.sourceBadge} ${EmailRow_default.source_gmail}`, children: "Gmail" }),
        assignedTags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TagBadge, { tag, size: "sm", onRemove: () => handleRemove(tag) }, tag.id)),
        assignable.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: EmailRow_default.tagDropdownWrap, onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              ref: btnRef,
              className: EmailRow_default.addTagBtn,
              onClick: openDropdown,
              title: "Add tag",
              children: "\uFF0B"
            }
          ),
          tagOpen && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "div",
            {
              ref: dropdownRef,
              className: EmailRow_default.tagDropdown,
              style: { position: "fixed", top: dropdownPos.top, left: dropdownPos.left },
              children: assignable.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { className: EmailRow_default.tagDropdownItem, onClick: () => handleAssign(tag), children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: EmailRow_default.tagDot, style: { background: tag.color } }),
                tag.name
              ] }, tag.id))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: EmailRow_default.snippet, children: email.snippet })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: EmailRow_default.meta, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: EmailRow_default.date, children: formatDate2(email.date) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: EmailRow_default.actions, children: [
        !email.gmailDraft && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: EmailRow_default.actionBtn, onClick: (e) => {
          e.stopPropagation();
          onReply();
        }, title: "Reply", children: "\u21A9" }),
        !email.gmailDraft && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: EmailRow_default.actionBtn, onClick: (e) => {
          e.stopPropagation();
          onArchive();
        }, title: "Archive", children: "\u{1F4E6}" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: EmailRow_default.actionBtn, onClick: (e) => {
          e.stopPropagation();
          onDelete();
        }, title: "Delete", children: "\u{1F5D1}" })
      ] })
    ] })
  ] });
}

// components/inbox/inbox/GroupedEmailList.module.css
var GroupedEmailList_default = {
  list: "GroupedEmailList_list",
  group: "GroupedEmailList_group",
  rows: "GroupedEmailList_rows",
  skeleton: "GroupedEmailList_skeleton",
  shimmer: "GroupedEmailList_shimmer",
  empty: "GroupedEmailList_empty"
};

// components/inbox/inbox/GroupedEmailList.tsx
var import_jsx_runtime8 = __toESM(require_jsx_runtime());
var PAGE_SIZE = 10;
function GroupedEmailList({ groups, loading, selected, tags, onToggleSelect, onArchive, onDelete, onReply, onView, onTagsChanged, grouped }) {
  const [expanded, setExpanded] = (0, import_react4.useState)(/* @__PURE__ */ new Set());
  const [groupPages, setGroupPages] = (0, import_react4.useState)(/* @__PURE__ */ new Map());
  const toggle = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const getPage = (key) => groupPages.get(key) ?? 1;
  const setPage = (key, page) => {
    setGroupPages((prev) => {
      const next = new Map(prev);
      next.set(key, page);
      return next;
    });
  };
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: GroupedEmailList_default.list, children: [0, 1, 2].map((i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: GroupedEmailList_default.skeleton, style: { height: 80, opacity: 1 - i * 0.2 } }, i)) });
  }
  if (groups.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: GroupedEmailList_default.empty, children: "No emails found." });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: GroupedEmailList_default.list, children: groups.map((group) => {
    const key = group.senderEmail || group.sender;
    const isExpanded = !grouped || expanded.has(key);
    const unread = group.emails.filter((e) => e.unread).length;
    const page = getPage(key);
    const totalPages = Math.ceil(group.emails.length / PAGE_SIZE);
    const pageEmails = grouped ? group.emails.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : group.emails;
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: GroupedEmailList_default.group, children: [
      grouped && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        SenderGroupHeader,
        {
          group,
          unreadCount: unread,
          expanded: isExpanded,
          onToggle: () => toggle(key)
        }
      ),
      isExpanded && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: grouped ? GroupedEmailList_default.rows : void 0, children: [
        pageEmails.map((email) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          EmailRow,
          {
            email,
            tags,
            selected: selected.has(email.id),
            onToggleSelect: () => onToggleSelect(email.id),
            onArchive: () => onArchive(email.id),
            onDelete: () => onDelete(email.id),
            onReply: () => onReply(email),
            onView: () => onView(email),
            onTagsChanged,
            indented: grouped
          },
          email.id
        )),
        grouped && totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: "1px solid var(--color-border)", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              onClick: () => setPage(key, page - 1),
              disabled: page === 1,
              style: { background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "var(--color-text-muted)" : "var(--color-accent)", padding: "4px 8px", opacity: page === 1 ? 0.4 : 1 },
              children: "\u2190 Prev"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
            "Page ",
            page,
            " of ",
            totalPages
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              onClick: () => setPage(key, page + 1),
              disabled: page === totalPages,
              style: { background: "none", border: "none", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? "var(--color-text-muted)" : "var(--color-accent)", padding: "4px 8px", opacity: page === totalPages ? 0.4 : 1 },
              children: "Next \u2192"
            }
          )
        ] })
      ] })
    ] }, key);
  }) });
}

// components/inbox/inbox/ReplyModal.tsx
var import_react5 = __toESM(require_react());

// components/inbox/compose/blankTemplate.ts
var BLANK_EMAIL_TEMPLATE = `<div style="max-width:640px; margin:0 auto; padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; background:#ffffff; border-radius:12px; overflow:hidden;">
    <tr>
      <td style="padding:28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <h2 style="margin:0 0 12px 0; font-size:20px; line-height:1.45; color:#111827;">
          Hi {{name}},
        </h2>

        <p style="margin:0 0 14px 0; font-size:16px; line-height:1.6; color:#374151;">
          Thank you for reaching out!
        </p>

        <p style="margin:0 0 14px 0; font-size:16px; line-height:1.6; color:#374151;">
          [details in response]
        </p>

        <p style="margin:0; font-size:16px; line-height:1.6; color:#374151;">
          Appreciate your understanding.<br>
          <br>
          Warmly,<br>
          Julie
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:16px 28px 24px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border-top:1px solid #f1f5f9;">
        <p style="margin:0; font-size:12px; line-height:1.6; color:#6b7280;">
          [P.S. section]
        </p>
      </td>
    </tr>
  </table>
</div>`;

// components/inbox/compose/ComposeModal.module.css
var ComposeModal_default = {
  overlay: "ComposeModal_overlay",
  modal: "ComposeModal_modal",
  popIn: "ComposeModal_popIn",
  header: "ComposeModal_header",
  title: "ComposeModal_title",
  closeBtn: "ComposeModal_closeBtn",
  body: "ComposeModal_body",
  field: "ComposeModal_field",
  fieldLabel: "ComposeModal_fieldLabel",
  input: "ComposeModal_input",
  recipientWrap: "ComposeModal_recipientWrap",
  recipientPill: "ComposeModal_recipientPill",
  removePill: "ComposeModal_removePill",
  recipientInput: "ComposeModal_recipientInput",
  modeToggle: "ComposeModal_modeToggle",
  modeBtn: "ComposeModal_modeBtn",
  modeActive: "ComposeModal_modeActive",
  textarea: "ComposeModal_textarea",
  error: "ComposeModal_error",
  footer: "ComposeModal_footer",
  cancelBtn: "ComposeModal_cancelBtn",
  sendBtn: "ComposeModal_sendBtn"
};

// components/inbox/inbox/ReplyModal.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime());
function buildQuotedBlock(original) {
  const date = new Date(original.date).toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
  return original.body ? `<blockquote style="margin:16px 0 0;padding:12px 16px;border-left:3px solid #ccc;color:#666;font-size:14px;">
        <p style="margin:0 0 8px;font-size:12px;color:#999;">
          On ${date}, ${original.from} &lt;${original.fromEmail}&gt; wrote:
        </p>
        ${original.body}
      </blockquote>` : `<blockquote style="margin:16px 0 0;padding:12px 16px;border-left:3px solid #ccc;color:#666;font-size:14px;">
        <p style="margin:0 0 8px;font-size:12px;color:#999;">
          On ${date}, ${original.from} &lt;${original.fromEmail}&gt; wrote:
        </p>
        <p>${original.snippet}</p>
      </blockquote>`;
}
function buildReplyBody(original) {
  return BLANK_EMAIL_TEMPLATE + "\n" + buildQuotedBlock(original);
}
function wrapInTemplate(content, recipientName) {
  return BLANK_EMAIL_TEMPLATE.replace("{{name}}", recipientName).replace("Thank you for reaching out!", "").replace("[details in response]", content).replace("Appreciate your understanding.<br>\n          <br>\n          Warmly,<br>\n          Julie", "Best,<br>\n          Julie");
}
function ReplyModal({ email, onClose, initialBody }) {
  const [name, setName] = (0, import_react5.useState)(email.from);
  const [toEmail, setToEmail] = (0, import_react5.useState)(email.fromEmail);
  const [subject, setSubject] = (0, import_react5.useState)(`Re: ${email.subject}`);
  const [body, setBody] = (0, import_react5.useState)(() => {
    if (initialBody) {
      return wrapInTemplate(initialBody, email.from.split(" ")[0]) + "\n" + buildQuotedBlock(email);
    }
    return buildReplyBody(email);
  });
  const [mode, setMode] = (0, import_react5.useState)("custom");
  const [templates, setTemplates] = (0, import_react5.useState)([]);
  const [selectedTemplate, setSelectedTemplate] = (0, import_react5.useState)("");
  const [attachments, setAttachments] = (0, import_react5.useState)([]);
  const [sending, setSending] = (0, import_react5.useState)(false);
  const [error, setError] = (0, import_react5.useState)("");
  const [googleEmail, setGoogleEmail] = (0, import_react5.useState)("");
  const previewRef = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    proxyFetch("/agent/templates").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.templates) setTemplates(d.templates);
    }).catch(() => {
    });
    proxyFetch("/auth/me").then((r) => r.ok ? r.json() : null).then((user) => {
      if (user?.email) setGoogleEmail(user.email);
    }).catch(() => {
    });
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);
  (0, import_react5.useEffect)(() => {
    if (previewRef.current) {
      previewRef.current.querySelectorAll("a").forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
    }
  }, [body]);
  const getContent = () => {
    if (mode === "template" && selectedTemplate) {
      const tpl = templates.find((t) => t.id === selectedTemplate);
      if (tpl) return { subject: tpl.subject, body: buildReplyBody({ ...email, body: tpl.body }) };
    }
    return { subject, body };
  };
  const handleSend = async () => {
    if (!toEmail.trim()) {
      setError("Recipient email is required.");
      return;
    }
    const content = getContent();
    if (!content.subject.trim() || !content.body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("recipients", JSON.stringify([{ name, email: toEmail }]));
      fd.append("subject", content.subject);
      fd.append("body", content.body);
      if (googleEmail) fd.append("accountId", `google:${googleEmail}`);
      attachments.forEach((f) => fd.append("attachments", f));
      const res = await proxyFetch("/agent/compose/send", { method: "POST", body: fd });
      if (res.ok) {
        onClose();
        return;
      }
      const d = await res.json();
      setError(d.error ?? "Send failed.");
    } catch {
      setError("Network error.");
    }
    setSending(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: ComposeModal_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.modal, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h2", { className: ComposeModal_default.title, children: "Reply" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: ComposeModal_default.sendBtn, onClick: handleSend, disabled: sending, children: sending ? "Sending..." : "Send" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: ComposeModal_default.closeBtn, onClick: onClose, children: "\u2715" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.body, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "To" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { className: ComposeModal_default.input, style: { flex: 1 }, placeholder: "Name", value: name, onChange: (e) => setName(e.target.value) }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { className: ComposeModal_default.input, style: { flex: 1 }, type: "email", placeholder: "email@example.com", value: toEmail, onChange: (e) => setToEmail(e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.modeToggle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: `${ComposeModal_default.modeBtn} ${mode === "custom" ? ComposeModal_default.modeActive : ""}`, onClick: () => setMode("custom"), children: "Custom" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: `${ComposeModal_default.modeBtn} ${mode === "template" ? ComposeModal_default.modeActive : ""}`, onClick: () => setMode("template"), children: "Use Template" })
        ] }),
        mode === "template" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Template" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("select", { className: ComposeModal_default.input, value: selectedTemplate, onChange: (e) => setSelectedTemplate(e.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: "", children: "Choose a template..." }),
            templates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: t.id, children: t.name }, t.id))
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.field, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Subject" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { className: ComposeModal_default.input, value: subject, onChange: (e) => setSubject(e.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.field, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Body (HTML)" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("textarea", { className: ComposeModal_default.textarea, value: body, onChange: (e) => setBody(e.target.value), rows: 8 }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }, children: [
              "Use ",
              "{{name}}",
              " and ",
              "{{email}}",
              " for personalization"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.field, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Preview" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "div",
              {
                ref: previewRef,
                style: { border: "1px solid var(--color-border)", borderRadius: 8, padding: 16, background: "var(--color-bg)", maxHeight: 300, overflowY: "auto", fontSize: "var(--font-size-sm)", lineHeight: 1.6 },
                dangerouslySetInnerHTML: { __html: body }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Attachments" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", border: "2px dashed var(--color-border)", borderRadius: 12, cursor: "pointer", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", fontWeight: 600, transition: "border-color 0.15s" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" }) }),
            attachments.length ? `${attachments.length} file${attachments.length === 1 ? "" : "s"} attached` : "+ Attach files",
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "input",
              {
                type: "file",
                multiple: true,
                style: { display: "none" },
                onChange: (e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])])
              }
            )
          ] }),
          attachments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }, children: attachments.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { style: { fontSize: "var(--font-size-xs)", padding: "4px 10px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 999 }, children: [
            "\u{1F4CE} ",
            f.name,
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "button",
              {
                type: "button",
                onClick: () => setAttachments((prev) => prev.filter((_, idx) => idx !== i)),
                style: { background: "none", border: "none", cursor: "pointer", marginLeft: 4, color: "var(--color-text-muted)", fontSize: 11 },
                children: "\u2715"
              }
            )
          ] }, i)) })
        ] }),
        error && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: ComposeModal_default.error, children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: ComposeModal_default.footer, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: ComposeModal_default.cancelBtn, onClick: onClose, disabled: sending, children: "Cancel" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: ComposeModal_default.sendBtn, onClick: handleSend, disabled: sending, children: sending ? "Sending..." : "Send" })
      ] })
    ] })
  ] });
}

// components/inbox/inbox/ViewEmailModal.tsx
var import_react6 = __toESM(require_react());

// components/inbox/inbox/ViewEmailModal.module.css
var ViewEmailModal_default = {
  overlay: "ViewEmailModal_overlay",
  modal: "ViewEmailModal_modal",
  header: "ViewEmailModal_header",
  headerLeft: "ViewEmailModal_headerLeft",
  subject: "ViewEmailModal_subject",
  subjectRow: "ViewEmailModal_subjectRow",
  draftStatus: "ViewEmailModal_draftStatus",
  meta: "ViewEmailModal_meta",
  from: "ViewEmailModal_from",
  date: "ViewEmailModal_date",
  headerActions: "ViewEmailModal_headerActions",
  replyBtn: "ViewEmailModal_replyBtn",
  closeBtn: "ViewEmailModal_closeBtn",
  body: "ViewEmailModal_body",
  emailFrameWrapper: "ViewEmailModal_emailFrameWrapper",
  emailFrame: "ViewEmailModal_emailFrame",
  textBody: "ViewEmailModal_textBody",
  snippet: "ViewEmailModal_snippet",
  draftSection: "ViewEmailModal_draftSection",
  draftHeading: "ViewEmailModal_draftHeading",
  draftBody: "ViewEmailModal_draftBody",
  draftPlaceholder: "ViewEmailModal_draftPlaceholder",
  originalToggle: "ViewEmailModal_originalToggle",
  attachments: "ViewEmailModal_attachments",
  attachmentsLabel: "ViewEmailModal_attachmentsLabel",
  attachmentList: "ViewEmailModal_attachmentList",
  attachmentChip: "ViewEmailModal_attachmentChip",
  tagRow: "ViewEmailModal_tagRow",
  addTagBtn: "ViewEmailModal_addTagBtn",
  tagDropdown: "ViewEmailModal_tagDropdown",
  tagDropdownItem: "ViewEmailModal_tagDropdownItem",
  tagDot: "ViewEmailModal_tagDot"
};

// components/inbox/inbox/ViewEmailModal.tsx
var import_jsx_runtime10 = __toESM(require_jsx_runtime());
function formatDate3(iso) {
  try {
    return new Date(iso).toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
var isHtml = (s) => /<\s*[a-z][\s\S]*>/i.test(s);
function htmlInnerText(html) {
  if (typeof DOMParser === "undefined") return "";
  const document2 = new DOMParser().parseFromString(html, "text/html");
  return document2.body?.innerText || document2.body?.textContent || "";
}
function HtmlEmailFrame({ html, frameRef, onTextLoaded }) {
  const src = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 16px; font-family: -apple-system, sans-serif; background: #ffffff; color: #111111; }
    img { max-width: 100%; height: auto; }
    a { color: #1a73e8; }
  </style></head><body>${html}</body></html>`;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    "iframe",
    {
      ref: frameRef,
      srcDoc: src,
      sandbox: "allow-same-origin allow-popups",
      className: ViewEmailModal_default.emailFrame,
      onLoad: (e) => {
        const iframe = e.currentTarget;
        const root = iframe.contentDocument?.documentElement;
        const h = root?.scrollHeight;
        if (h) iframe.style.height = `${h + 32}px`;
        const body = iframe.contentDocument?.body;
        onTextLoaded(body?.innerText || body?.textContent || root?.innerText || "");
      }
    }
  );
}
function ViewEmailModal({ email, tags, onClose, onReply, onDelete, onBlockSender, onMarkUnread, onTagsChanged }) {
  const [currentEmail, setCurrentEmail] = (0, import_react6.useState)(email);
  const [tagDropdownOpen, setTagDropdownOpen] = (0, import_react6.useState)(false);
  const [draft, setDraft] = (0, import_react6.useState)(null);
  const [draftLoading, setDraftLoading] = (0, import_react6.useState)(email.hasDraft ?? false);
  const [markingUnread, setMarkingUnread] = (0, import_react6.useState)(false);
  const [showOriginal, setShowOriginal] = (0, import_react6.useState)(!(email.hasDraft ?? false));
  const [detailLoading, setDetailLoading] = (0, import_react6.useState)(!email.body);
  const emailFrameRef = (0, import_react6.useRef)(null);
  const [renderedEmailSpeechText, setRenderedEmailSpeechText] = (0, import_react6.useState)({ emailId: "", text: "" });
  const assignedTags = tags.filter((t) => t.name !== "Draft" && currentEmail.tags.includes(t.name));
  const unassignedTags = tags.filter((t) => t.name !== "Draft" && !currentEmail.tags.includes(t.name));
  (0, import_react6.useEffect)(() => {
    let cancelled = false;
    setCurrentEmail(email);
    if (email.body) {
      setDetailLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setDetailLoading(true);
    void proxyFetch(`/agent/inbox/message/${encodeURIComponent(email.id)}`).then(async (res) => res.ok ? await res.json() : {}).then((data) => {
      if (!cancelled && data.message) setCurrentEmail((current) => ({ ...current, ...data.message }));
    }).catch(() => {
    }).finally(() => {
      if (!cancelled) setDetailLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [email.id, email.body]);
  (0, import_react6.useEffect)(() => {
    let cancelled = false;
    if (!email.hasDraft) {
      return () => {
        cancelled = true;
      };
    }
    void proxyFetch(`/agent/inbox/network/draft/${encodeURIComponent(email.id)}?savedOnly=true`).then(async (res) => res.ok ? await res.json() : {}).then((data) => {
      if (!cancelled) setDraft(data.draft ?? null);
    }).catch(() => {
      if (!cancelled) setDraft(null);
    }).finally(() => {
      if (!cancelled) setDraftLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [email.hasDraft, email.id]);
  const emailSpeechText = (0, import_react6.useMemo)(() => {
    const raw = currentEmail.body ?? currentEmail.snippet ?? "";
    if (!isHtml(raw)) return raw;
    return renderedEmailSpeechText.emailId === currentEmail.id && renderedEmailSpeechText.text ? renderedEmailSpeechText.text : htmlInnerText(raw);
  }, [currentEmail.body, currentEmail.id, currentEmail.snippet, renderedEmailSpeechText]);
  const canReadEmailAloud = Boolean(currentEmail.body && (!isHtml(currentEmail.body) || emailSpeechText.trim()));
  const handleAssignTag = async (tagId) => {
    try {
      const res = await proxyFetch("/agent/inbox/messages/assign-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: currentEmail.id, tagId })
      });
      if (!res.ok) return;
      const result = await res.json();
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        const labelIds = Array.isArray(result.labelIds) ? new Set(result.labelIds.map(String)) : null;
        const nextTags = labelIds ? tags.filter((item) => labelIds.has(item.id)).map((item) => item.name) : [...currentEmail.tags, tag.name];
        const updated = { ...currentEmail, tags: nextTags };
        setCurrentEmail(updated);
        onTagsChanged?.(updated);
      }
    } catch {
    } finally {
      setTagDropdownOpen(false);
    }
  };
  const handleRemoveTag = async (tagId) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;
    try {
      const res = await proxyFetch("/agent/inbox/messages/remove-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: currentEmail.id, tagId })
      });
      if (!res.ok) return;
      const result = await res.json();
      const labelIds = Array.isArray(result.labelIds) ? new Set(result.labelIds.map(String)) : null;
      const updated = {
        ...currentEmail,
        tags: labelIds ? tags.filter((item) => labelIds.has(item.id)).map((item) => item.name) : currentEmail.tags.filter((n) => n !== tag.name)
      };
      setCurrentEmail(updated);
      onTagsChanged?.(updated);
    } catch {
    }
  };
  const handleMarkUnread = async () => {
    if (markingUnread) return;
    setMarkingUnread(true);
    try {
      const res = await proxyFetch("/agent/inbox/mark-unread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [currentEmail.id] })
      });
      if (res.ok) {
        setCurrentEmail((current) => ({ ...current, unread: true }));
        onMarkUnread?.();
      }
    } finally {
      setMarkingUnread(false);
    }
  };
  (0, import_react6.useEffect)(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: ViewEmailModal_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.modal, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.headerLeft, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.subjectRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h2", { className: ViewEmailModal_default.subject, children: currentEmail.subject }),
            draft && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: ViewEmailModal_default.draftStatus, children: "Draft" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.meta, children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: ViewEmailModal_default.from, children: [
              currentEmail.from,
              " <",
              currentEmail.fromEmail,
              ">"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: ViewEmailModal_default.date, children: formatDate3(currentEmail.date) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.tagRow, children: [
            assignedTags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(TagBadge, { tag, size: "sm", onRemove: () => handleRemoveTag(tag.id) }, tag.id)),
            unassignedTags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: ViewEmailModal_default.addTagBtn, onClick: () => setTagDropdownOpen((o) => !o), children: "\uFF0B Tag" }),
              tagDropdownOpen && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: ViewEmailModal_default.tagDropdown, children: unassignedTags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { className: ViewEmailModal_default.tagDropdownItem, onClick: () => handleAssignTag(tag.id), children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: ViewEmailModal_default.tagDot, style: { background: tag.color } }),
                tag.name
              ] }, tag.id)) })
            ] }),
            onDelete && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "button",
              {
                className: ViewEmailModal_default.addTagBtn,
                onClick: onDelete,
                style: { color: "#e53e3e", borderColor: "color-mix(in srgb, #e53e3e 40%, transparent)" },
                children: "\u{1F5D1} Delete"
              }
            ),
            onBlockSender && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "button",
              {
                className: ViewEmailModal_default.addTagBtn,
                onClick: () => {
                  if (window.confirm(`Block ${currentEmail.fromEmail}? Future messages will be automatically removed.`)) onBlockSender();
                },
                style: { color: "#e53e3e", borderColor: "color-mix(in srgb, #e53e3e 40%, transparent)" },
                children: "\u{1F6AB} Block sender"
              }
            ),
            onMarkUnread && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: ViewEmailModal_default.addTagBtn, onClick: () => {
              void handleMarkUnread();
            }, disabled: markingUnread, children: markingUnread ? "Marking\u2026" : "\u21A9 Mark unread" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.headerActions, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: ViewEmailModal_default.replyBtn, onClick: onReply, children: "\u21A9 Reply" }),
          canReadEmailAloud && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            ReadAloudButton,
            {
              text: emailSpeechText,
              style: { background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px 6px", display: "flex", alignItems: "center" }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: ViewEmailModal_default.closeBtn, onClick: onClose, children: "\u2715" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.body, children: [
        currentEmail.hasDraft && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: ViewEmailModal_default.draftSection, "aria-live": "polite", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: ViewEmailModal_default.draftHeading, children: "Drafted reply" }),
          draftLoading ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: ViewEmailModal_default.draftPlaceholder, children: "Loading saved draft\u2026" }) : draft ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("pre", { className: ViewEmailModal_default.draftBody, children: draft }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: ViewEmailModal_default.draftPlaceholder, children: "The saved draft is no longer available." })
        ] }),
        currentEmail.hasDraft && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: ViewEmailModal_default.originalToggle, onClick: () => setShowOriginal((visible) => !visible), children: showOriginal ? "\u2303 Hide original message" : "\u2304 Show original message" }),
        (!currentEmail.hasDraft || showOriginal) && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
          detailLoading ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: ViewEmailModal_default.snippet, children: "Loading full message\u2026" }) : currentEmail.body && isHtml(currentEmail.body) ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: ViewEmailModal_default.emailFrameWrapper, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            HtmlEmailFrame,
            {
              html: currentEmail.body,
              frameRef: emailFrameRef,
              onTextLoaded: (text) => setRenderedEmailSpeechText({ emailId: currentEmail.id, text })
            }
          ) }) : currentEmail.body ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("pre", { className: ViewEmailModal_default.textBody, children: currentEmail.body }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: ViewEmailModal_default.snippet, children: currentEmail.snippet }),
          currentEmail.attachments && currentEmail.attachments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: ViewEmailModal_default.attachments, children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: ViewEmailModal_default.attachmentsLabel, children: [
              "Attachments (",
              currentEmail.attachments.length,
              ")"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: ViewEmailModal_default.attachmentList, children: currentEmail.attachments.map((att) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
              "span",
              {
                className: ViewEmailModal_default.attachmentChip,
                children: [
                  "\u{1F4CE} ",
                  att.name
                ]
              },
              att.name
            )) })
          ] })
        ] })
      ] })
    ] })
  ] });
}

// components/inbox/inbox/TriageDetailsModal.tsx
var import_react7 = __toESM(require_react());

// components/inbox/inbox/TriageDetailsModal.module.css
var TriageDetailsModal_default = {
  content: "TriageDetailsModal_content",
  eyebrow: "TriageDetailsModal_eyebrow",
  boundary: "TriageDetailsModal_boundary",
  historyControls: "TriageDetailsModal_historyControls",
  historyButton: "TriageDetailsModal_historyButton",
  historyMenu: "TriageDetailsModal_historyMenu",
  historyItem: "TriageDetailsModal_historyItem",
  historyItemActive: "TriageDetailsModal_historyItemActive",
  scrollArea: "TriageDetailsModal_scrollArea",
  list: "TriageDetailsModal_list",
  item: "TriageDetailsModal_item",
  historyItemRow: "TriageDetailsModal_historyItemRow",
  selectRow: "TriageDetailsModal_selectRow",
  rowMain: "TriageDetailsModal_rowMain",
  rowTop: "TriageDetailsModal_rowTop",
  subject: "TriageDetailsModal_subject",
  sender: "TriageDetailsModal_sender",
  snippet: "TriageDetailsModal_snippet",
  rowMeta: "TriageDetailsModal_rowMeta",
  label: "TriageDetailsModal_label",
  messageId: "TriageDetailsModal_messageId",
  draft: "TriageDetailsModal_draft",
  empty: "TriageDetailsModal_empty",
  footer: "TriageDetailsModal_footer",
  saveMessage: "TriageDetailsModal_saveMessage",
  saveButton: "TriageDetailsModal_saveButton"
};

// components/inbox/inbox/TriageDetailsModal.tsx
var import_jsx_runtime11 = __toESM(require_jsx_runtime());
function formatRunDate(value) {
  if (!value) return "Previous review";
  try {
    return new Date(value).toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "Previous review";
  }
}
function formatMessageDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(void 0, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
function displaySuggestionLabel(suggestion) {
  if (suggestion.deleteSuggested) return "Delete";
  if (suggestion.kind === "task" || suggestion.taskSuggested) return "Task";
  if (suggestion.kind === "reply") return "Reply";
  const label = suggestion.label;
  if (!label) return "";
  if (label === "OpenPip/Triage/Filed") return "Delete";
  if (label === "OpenPip/Triage/Reply") return "Reply";
  return label;
}
function TriageDetailsModal({ open, suggestions, currentRun, history = [], onSaveChanges, onMarkUnread, onClose }) {
  const { name: agentName } = useAgentIdentity();
  const [selectedRunId, setSelectedRunId] = (0, import_react7.useState)(currentRun?.id ?? "latest");
  const [historyOpen, setHistoryOpen] = (0, import_react7.useState)(false);
  const [selectedMessageIds, setSelectedMessageIds] = (0, import_react7.useState)(/* @__PURE__ */ new Set());
  const [saving, setSaving] = (0, import_react7.useState)(false);
  const [markingUnread, setMarkingUnread] = (0, import_react7.useState)(false);
  const [saveMessage, setSaveMessage] = (0, import_react7.useState)(null);
  (0, import_react7.useEffect)(() => {
    if (open) {
      setSelectedRunId(currentRun?.id ?? "latest");
      setHistoryOpen(false);
      setSelectedMessageIds(/* @__PURE__ */ new Set());
      setSaveMessage(null);
      setMarkingUnread(false);
    }
  }, [open, currentRun?.id]);
  if (!open) return null;
  const selectedRun = selectedRunId === (currentRun?.id ?? "latest") ? currentRun : history.find((run) => run.id === selectedRunId);
  const displayedSuggestions = selectedRun?.suggestions ?? suggestions;
  const deletions = displayedSuggestions.filter((item) => item.deleteSuggested);
  const isCurrentRun = selectedRunId === (currentRun?.id ?? "latest");
  const selectedRunKey = selectedRun?.id ?? currentRun?.id ?? "latest";
  const toggleMessage = (messageId) => {
    setSelectedMessageIds((current) => {
      const next = new Set(current);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };
  const saveChanges = async () => {
    if (!onSaveChanges || !selectedMessageIds.size || saving) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const { applied, failures } = await onSaveChanges(selectedRunKey, Array.from(selectedMessageIds));
      if (failures.length && !applied.length) {
        setSaveMessage(`Could not save ${failures.length === 1 ? "that change" : `any of the ${failures.length} changes`}: ${failures[0].error}`);
      } else if (failures.length) {
        setSaveMessage(`${applied.length} change${applied.length === 1 ? "" : "s"} saved, ${failures.length} could not be saved.`);
      } else {
        setSaveMessage(`${applied.length} change${applied.length === 1 ? "" : "s"} saved.`);
      }
      setSelectedMessageIds(/* @__PURE__ */ new Set());
    } catch {
      setSaveMessage("Some changes could not be saved. Nothing was deleted automatically.");
    } finally {
      setSaving(false);
    }
  };
  const markAllUnread = async () => {
    if (!onMarkUnread || !displayedSuggestions.length || markingUnread) return;
    setMarkingUnread(true);
    setSaveMessage(null);
    try {
      await onMarkUnread(displayedSuggestions.map((item) => item.messageId));
      setSaveMessage(`${displayedSuggestions.length} message${displayedSuggestions.length === 1 ? "" : "s"} marked unread.`);
    } catch {
      setSaveMessage("Some messages could not be marked unread.");
    } finally {
      setMarkingUnread(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: Dialog_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: `${Dialog_default.content} ${TriageDetailsModal_default.content}`, role: "dialog", "aria-modal": "true", "aria-labelledby": "triage-details-title", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: Dialog_default.closeBtn, onClick: onClose, "aria-label": "Close triage details", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(X, { size: 16 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: Dialog_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: TriageDetailsModal_default.eyebrow, children: "Inbox assistant" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { className: Dialog_default.title, id: "triage-details-title", children: "Review details" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { className: Dialog_default.description, children: [
          "The assistant found ",
          displayedSuggestions.length,
          " item",
          displayedSuggestions.length === 1 ? "" : "s",
          " in this review. Nothing has been deleted."
        ] }),
        history.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: TriageDetailsModal_default.historyControls, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", className: TriageDetailsModal_default.historyButton, onClick: () => setHistoryOpen((openState) => !openState), "aria-expanded": historyOpen, children: [
            "History (",
            history.length,
            ")"
          ] }),
          historyOpen && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: TriageDetailsModal_default.historyMenu, role: "menu", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", className: selectedRunId === (currentRun?.id ?? "latest") ? TriageDetailsModal_default.historyItemActive : TriageDetailsModal_default.historyItem, onClick: () => {
              setSelectedRunId(currentRun?.id ?? "latest");
              setHistoryOpen(false);
            }, role: "menuitem", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: "Current review" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: formatRunDate(currentRun?.completedAt) })
            ] }),
            history.map((run) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", className: selectedRunId === run.id ? TriageDetailsModal_default.historyItemActive : TriageDetailsModal_default.historyItem, onClick: () => {
              setSelectedRunId(run.id);
              setHistoryOpen(false);
            }, role: "menuitem", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: run.status === "failed" ? "Incomplete review" : "Previous review" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: formatRunDate(run.completedAt) })
            ] }, run.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: TriageDetailsModal_default.boundary, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("strong", { children: [
          deletions.length,
          " deletion suggestion",
          deletions.length === 1 ? "" : "s"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: "Deletion is irreversible, so review each message in the inbox before taking action." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: TriageDetailsModal_default.scrollArea, children: displayedSuggestions.length ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ul", { className: TriageDetailsModal_default.list, children: displayedSuggestions.map((suggestion) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("li", { className: `${TriageDetailsModal_default.item} ${isCurrentRun ? "" : TriageDetailsModal_default.historyItemRow}`, children: [
        isCurrentRun && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("label", { className: TriageDetailsModal_default.selectRow, "aria-label": suggestion.appliedAction ? `${suggestion.subject || "email"} already applied` : `Select ${suggestion.subject || "email"} to apply`, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          "input",
          {
            type: "checkbox",
            checked: selectedMessageIds.has(suggestion.messageId) || Boolean(suggestion.appliedAction),
            disabled: Boolean(suggestion.appliedAction),
            onChange: () => toggleMessage(suggestion.messageId)
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: TriageDetailsModal_default.rowMain, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: TriageDetailsModal_default.rowTop, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: TriageDetailsModal_default.sender, children: suggestion.sender || `${agentName} assistant` }) }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: TriageDetailsModal_default.subject, children: suggestion.subject || "Email suggestion" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: TriageDetailsModal_default.snippet, children: suggestion.reason }),
          suggestion.draft && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("pre", { className: TriageDetailsModal_default.draft, children: suggestion.draft }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: TriageDetailsModal_default.messageId, children: [
            "Message: ",
            suggestion.messageId
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: TriageDetailsModal_default.rowMeta, children: [
          (suggestion.label || suggestion.deleteSuggested || suggestion.kind === "task" || suggestion.taskSuggested || suggestion.kind === "reply") && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: TriageDetailsModal_default.label, children: displaySuggestionLabel(suggestion) }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: formatMessageDate(suggestion.date) })
        ] })
      ] }, suggestion.messageId)) }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: TriageDetailsModal_default.empty, children: "No saved suggestions from this review." }) }),
      isCurrentRun && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("footer", { className: TriageDetailsModal_default.footer, children: [
        saveMessage && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: TriageDetailsModal_default.saveMessage, role: "status", children: saveMessage }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: TriageDetailsModal_default.saveButton, disabled: !selectedMessageIds.size || saving, onClick: () => {
          void saveChanges();
        }, children: saving ? "Saving\u2026" : "Save changes" })
      ] }),
      !isCurrentRun && onMarkUnread && displayedSuggestions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("footer", { className: TriageDetailsModal_default.footer, children: [
        saveMessage && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: TriageDetailsModal_default.saveMessage, role: "status", children: saveMessage }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: TriageDetailsModal_default.saveButton, disabled: markingUnread, onClick: () => {
          void markAllUnread();
        }, children: markingUnread ? "Marking\u2026" : "Mark all unread" })
      ] })
    ] })
  ] });
}

// components/inbox/inbox/InboxTab.tsx
var import_jsx_runtime12 = __toESM(require_jsx_runtime());
function InboxTab({ onUnreadChange, onCompose, tags, activeTag, onActiveTagChange, onTagsLoaded, onEmailsLoaded, initialMessageId }) {
  const { name: agentName } = useAgentIdentity();
  const [emails, setEmails] = (0, import_react8.useState)([]);
  const [loading, setLoading] = (0, import_react8.useState)(true);
  const [error, setError] = (0, import_react8.useState)(null);
  const [page, setPage] = (0, import_react8.useState)(1);
  const [total, setTotal] = (0, import_react8.useState)(0);
  const PAGE_SIZE2 = 20;
  const [search, setSearch] = (0, import_react8.useState)("");
  const [sort, setSort] = (0, import_react8.useState)("date");
  const [grouped, setGrouped] = (0, import_react8.useState)(true);
  const [selected, setSelected] = (0, import_react8.useState)(/* @__PURE__ */ new Set());
  const [replyEmail, setReplyEmail] = (0, import_react8.useState)(null);
  const [replyDraft, setReplyDraft] = (0, import_react8.useState)();
  const [viewEmail, setViewEmail] = (0, import_react8.useState)(null);
  const [triage, setTriage] = (0, import_react8.useState)(null);
  const [triageSuggestions, setTriageSuggestions] = (0, import_react8.useState)([]);
  const [triageCurrentRun, setTriageCurrentRun] = (0, import_react8.useState)(null);
  const [triageHistory, setTriageHistory] = (0, import_react8.useState)([]);
  const [triageDetailsOpen, setTriageDetailsOpen] = (0, import_react8.useState)(false);
  const [showTriageCard, setShowTriageCard] = (0, import_react8.useState)(false);
  const [studyMeStatus, setStudyMeStatus] = (0, import_react8.useState)(null);
  const [studyMeStatusLoading, setStudyMeStatusLoading] = (0, import_react8.useState)(true);
  const triagePoll = (0, import_react8.useRef)(null);
  const hasFinishedInitialLoad = (0, import_react8.useRef)(false);
  const openedSourceMessage = (0, import_react8.useRef)(false);
  const tagsRef = (0, import_react8.useRef)(tags);
  tagsRef.current = tags;
  (0, import_react8.useEffect)(() => {
    let cancelled = false;
    const loadStudyMeStatus = async () => {
      try {
        const response = await proxyFetch("/agent/insights/gather/login-status");
        if (!response.ok) {
          if (!cancelled) setStudyMeStatus(null);
          return;
        }
        const next = await response.json();
        if (cancelled) return;
        setStudyMeStatus(next);
      } catch {
        if (!cancelled) setStudyMeStatus(null);
      } finally {
        if (!cancelled) setStudyMeStatusLoading(false);
      }
    };
    void loadStudyMeStatus();
    return () => {
      cancelled = true;
    };
  }, []);
  const loadTags = (0, import_react8.useCallback)(async () => {
    try {
      const res = await proxyFetch("/agent/inbox/tags");
      if (!res.ok) return tagsRef.current;
      const nextTags = (await res.json()).filter((tag) => tag.name !== "Draft");
      tagsRef.current = nextTags;
      onTagsLoaded(nextTags);
      return nextTags;
    } catch {
      return tagsRef.current;
    }
  }, [onTagsLoaded]);
  const stopTriagePolling = (0, import_react8.useCallback)(() => {
    if (triagePoll.current) window.clearInterval(triagePoll.current);
    triagePoll.current = null;
  }, []);
  const loadTriageDetails = (0, import_react8.useCallback)(async () => {
    try {
      const res = await proxyFetch("/agent/inbox/network/details");
      if (res.ok) {
        const data = await res.json();
        const currentRun = data.currentRun ?? { id: "latest", suggestions: data.suggestions ?? [] };
        setTriageCurrentRun(currentRun);
        setTriageSuggestions(currentRun.suggestions ?? data.suggestions ?? []);
        setTriageHistory(data.history ?? []);
      }
    } catch {
    }
  }, []);
  const pollTriage = (0, import_react8.useCallback)((jobId) => {
    stopTriagePolling();
    const update = async () => {
      const res = await proxyFetch(`/agent/inbox/network/triage/${jobId}`);
      if (!res.ok) {
        setTriage((current) => current ? { ...current, status: "failed" } : current);
        stopTriagePolling();
        return;
      }
      const progress = await res.json();
      setTriage(progress);
      const draftedMessageIds = progress.draftedMessageIds ?? [];
      if (draftedMessageIds.length) {
        setEmails((current) => current.map((email) => draftedMessageIds.includes(email.id) ? { ...email, hasDraft: true } : email));
      }
      if (progress.status !== "running") {
        stopTriagePolling();
        void loadTags();
        void loadTriageDetails().then(() => setTriageDetailsOpen(true));
      }
    };
    triagePoll.current = window.setInterval(() => {
      void update();
    }, 350);
    void update();
  }, [loadTags, loadTriageDetails, stopTriagePolling]);
  (0, import_react8.useEffect)(() => () => stopTriagePolling(), [stopTriagePolling]);
  (0, import_react8.useEffect)(() => {
    if (!loading && !hasFinishedInitialLoad.current) {
      hasFinishedInitialLoad.current = true;
      setShowTriageCard(true);
    }
  }, [loading]);
  const fetchPage = (0, import_react8.useCallback)(async (p) => {
    setLoading(true);
    setError(null);
    try {
      let availableTags = tagsRef.current;
      if (activeTag !== "Unread" && activeTag !== "Drafts" && activeTag !== "Untagged" && !availableTags.some((tag) => tag.name === activeTag)) {
        availableTags = await loadTags();
      }
      const selectedLabel = activeTag !== "Unread" && activeTag !== "Drafts" && activeTag !== "Untagged" ? availableTags.find((tag) => tag.name === activeTag) : void 0;
      const params = new URLSearchParams({ source: "gmail", page: String(p), pageSize: String(PAGE_SIZE2) });
      if (activeTag === "Drafts") {
        params.set("labelId", "DRAFT");
      } else if (selectedLabel) {
        params.set("labelId", selectedLabel.id);
      } else if (activeTag === "Unread") {
        params.set("unreadOnly", "true");
      }
      const res = await proxyFetch(`/agent/inbox/messages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const draftRes = await proxyFetch("/agent/inbox/network/drafts");
        const draftData = draftRes.ok ? await draftRes.json() : {};
        const draftedIds = new Set(draftData.messageIds ?? []);
        const msgs = (data.messages ?? []).filter((email) => email.source === "gmail").map((email) => ({
          ...email,
          tags: email.tags.filter((tag) => tag !== "Draft"),
          hasDraft: draftedIds.has(email.id)
        }));
        setEmails(msgs);
        setTotal(data.total ?? msgs.length);
        setPage(p);
        onEmailsLoaded?.(msgs);
        if (initialMessageId && !openedSourceMessage.current) {
          const sourceMessage = msgs.find((email) => email.id === initialMessageId);
          if (sourceMessage) {
            openedSourceMessage.current = true;
            setViewEmail(sourceMessage);
          } else {
            openedSourceMessage.current = true;
            proxyFetch(`/agent/inbox/message/${encodeURIComponent(initialMessageId)}`).then(async (r) => {
              if (!r.ok) return;
              const data2 = await r.json();
              if (data2.message) setViewEmail(data2.message);
            }).catch(() => {
            });
          }
        }
      } else throw new Error("Inbox request failed");
    } catch {
      setEmails([]);
      setTotal(0);
      setError("Unable to load this folder. Please try again.");
    }
    setLoading(false);
  }, [activeTag, initialMessageId, loadTags, onEmailsLoaded]);
  const load = (0, import_react8.useCallback)(() => fetchPage(1), [fetchPage]);
  const refreshAfterTagManagement = (0, import_react8.useCallback)((updatedTags) => {
    if (updatedTags) {
      tagsRef.current = updatedTags;
      onTagsLoaded(updatedTags);
    }
    void loadTags().then(() => load());
  }, [load, loadTags, onTagsLoaded]);
  (0, import_react8.useEffect)(() => {
    const initialLoad = window.setTimeout(() => {
      void load();
      void loadTags();
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [load, loadTags]);
  (0, import_react8.useEffect)(() => {
    onUnreadChange(emails.filter((e) => e.unread).length);
  }, [emails, onUnreadChange]);
  const visibleTags = (0, import_react8.useMemo)(() => tags.filter((tag) => tag.name !== "Draft"), [tags]);
  const allTags = (0, import_react8.useMemo)(() => {
    const tagCounts = /* @__PURE__ */ new Map();
    for (const email of emails) {
      for (const tag of email.tags.filter((tag2) => tag2 !== "Draft")) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    const orderedTags = /* @__PURE__ */ new Map();
    for (const tag of visibleTags) {
      orderedTags.set(tag.name, tagCounts.get(tag.name) ?? 0);
    }
    for (const [tag, count] of tagCounts) {
      if (!orderedTags.has(tag)) orderedTags.set(tag, count);
    }
    return orderedTags;
  }, [emails, visibleTags]);
  const filtered = (0, import_react8.useMemo)(() => {
    let list = emails;
    if (activeTag === "Unread") {
      list = list.filter((e) => !e.archived && e.unread);
    } else if (activeTag === "Drafts") {
      list = list.filter((e) => !e.archived && e.gmailDraft);
    } else {
      list = list.filter((e) => !e.archived);
      if (activeTag === "Untagged") {
        list = list.filter((e) => e.tags.length === 0);
      } else {
        list = list.filter((e) => e.tags.includes(activeTag));
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.subject.toLowerCase().includes(q) || e.snippet.toLowerCase().includes(q) || e.from.toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, activeTag, search]);
  const groups = (0, import_react8.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const email of filtered) {
      const key = email.fromEmail;
      if (!map.has(key)) {
        map.set(key, { sender: email.from, senderEmail: email.fromEmail, emails: [], latestDate: email.date });
      }
      map.get(key).emails.push(email);
    }
    const gs = Array.from(map.values());
    if (sort === "date") gs.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
    else if (sort === "sender") gs.sort((a, b) => a.sender.localeCompare(b.sender));
    else if (sort === "count") gs.sort((a, b) => b.emails.length - a.emails.length);
    return gs;
  }, [filtered, sort]);
  const handleArchive = async (ids) => {
    await proxyFetch("/agent/inbox/archive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    setEmails((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, archived: true } : e));
    setSelected(/* @__PURE__ */ new Set());
  };
  const handleDelete = async (ids) => {
    const previousEmails = emails;
    const removedCount = previousEmails.filter((email) => ids.includes(email.id)).length;
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    setTotal((prev) => Math.max(0, prev - removedCount));
    setSelected(/* @__PURE__ */ new Set());
    try {
      const response = await proxyFetch("/agent/inbox/message", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      if (!response.ok) throw new Error("Delete request failed");
    } catch {
      setEmails(previousEmails);
      setTotal((prev) => prev + removedCount);
    }
  };
  const handleBlockSender = async (messageIds, senderEmails) => {
    await proxyFetch("/agent/inbox/block-sender", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds, senderEmails })
    });
    setEmails((prev) => prev.filter((e) => !messageIds.includes(e.id)));
    setSelected(/* @__PURE__ */ new Set());
  };
  const runTriage = async () => {
    if (studyMeStatus?.state !== "completed") return;
    try {
      const res = await proxyFetch("/agent/inbox/network/queue-triage", { method: "POST" });
      if (res.status === 409) {
        window.location.assign("/");
        return;
      }
      if (!res.ok) return;
      const progress = await res.json();
      setTriage(progress);
      if (progress.status === "running") pollTriage(progress.id);
    } catch {
    }
  };
  const openTriageDetails = async () => {
    await loadTriageDetails();
    setTriageDetailsOpen(true);
  };
  const saveTriageChanges = async (runId, messageIds) => {
    const res = await proxyFetch("/agent/inbox/network/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, messageIds })
    });
    if (!res.ok) throw new Error("Unable to save triage changes");
    const data = await res.json();
    await Promise.all([load(), loadTriageDetails()]);
    return { applied: data.applied ?? [], failures: data.failures ?? [] };
  };
  const markTriageMessagesUnread = async (messageIds) => {
    const res = await proxyFetch("/agent/inbox/mark-unread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: messageIds })
    });
    if (!res.ok) throw new Error("Unable to mark triage messages unread");
    await loadTriageDetails();
  };
  (0, import_react8.useEffect)(() => {
    void loadTriageDetails();
  }, [loadTriageDetails]);
  const openReply = async (email) => {
    try {
      const res = await proxyFetch(`/agent/inbox/network/draft/${encodeURIComponent(email.id)}`);
      const data = res.ok ? await res.json() : {};
      setReplyDraft(data.draft);
    } catch {
      setReplyDraft(void 0);
    }
    setReplyEmail(email);
  };
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(/* @__PURE__ */ new Set());
  const unreadEmailCount = emails.filter((email) => email.unread).length;
  const reviewButtonLabel = unreadEmailCount ? `Review ${unreadEmailCount} unread email${unreadEmailCount === 1 ? "" : "s"}` : "Review inbox";
  const studyMeRunning = studyMeStatus?.state === "queued" || studyMeStatus?.state === "running";
  const studyMeReady = studyMeStatus?.state === "completed";
  const triageBlocked = !studyMeReady;
  const triageTitle = studyMeRunning ? `Waiting for ${agentName} to finish studying you\u2026` : studyMeStatusLoading ? "Checking Study Me before Inbox Assistant starts" : "Study Me is required before Inbox Assistant starts";
  const triageBlockedCopy = studyMeRunning ? "Inbox Assistant will be ready as soon as your indexed history is complete." : studyMeStatusLoading ? "Checking whether your indexed history is ready." : "Start or resume Study Me from the Dashboard before Inbox Assistant can review your inbox.";
  const studyMeNeedsDashboard = !studyMeReady && !studyMeRunning && !studyMeStatusLoading;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(InboxHeader, { unreadCount: unreadEmailCount, onCompose }),
    showTriageCard && (triage ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: InboxTab_default.triage, "aria-live": "polite", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: InboxTab_default.triageContent, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { className: InboxTab_default.triageKicker, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
          " Inbox assistant"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { className: InboxTab_default.triageTitle, children: triage.status === "running" ? "Reviewing your inbox" : triage.status === "completed" ? "Your inbox review is ready" : "Your inbox review needs attention" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: InboxTab_default.triageCopy, children: triage.status === "running" ? `Looking at ${triage.processed} of ${triage.total} unread emails. You can keep browsing.` : triage.status === "completed" ? "Your assistant has prepared suggestions for you to review." : "We could not finish reviewing every email. You can try again when you are ready." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: InboxTab_default.triageActions, children: [
        triage.status !== "running" && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: InboxTab_default.triageReviewBtn, onClick: () => {
          void openTriageDetails();
        }, children: "Review details" }),
        triageHistory.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: InboxTab_default.triageHistoryLink, onClick: () => {
          void openTriageDetails();
        }, children: "Review History" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: InboxTab_default.triageProgress, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: InboxTab_default.triageLabel, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: triage.status === "running" ? "Review in progress" : "Review summary" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
            triage.processed,
            " of ",
            triage.total,
            " emails"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: InboxTab_default.triageTrack, role: "progressbar", "aria-valuemin": 0, "aria-valuemax": triage.total, "aria-valuenow": triage.processed, "aria-label": "Inbox review progress", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: InboxTab_default.triageFill, style: { width: `${triage.total ? triage.processed / triage.total * 100 : 100}%` } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { className: InboxTab_default.triageSummary, children: [
          triage.fileSuggestions ?? triage.deleted,
          " filing suggestions \xB7 ",
          triage.tasksCreated,
          " task suggestions",
          triage.labelsApplied ? ` \xB7 ${triage.labelsApplied} Gmail tags applied` : "",
          triage.draftsCreated ? ` \xB7 ${triage.draftsCreated} reply drafts` : "",
          triage.interactionsTracked ? ` \xB7 ${triage.interactionsTracked} networking interactions logged` : "",
          triage.labelFailures ? ` \xB7 ${triage.labelFailures} tag failures` : "",
          triage.failed ? ` \xB7 ${triage.failed} failed` : ""
        ] })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: InboxTab_default.triage, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: InboxTab_default.triageContent, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { className: InboxTab_default.triageKicker, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
          " Inbox assistant"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { className: InboxTab_default.triageTitle, children: triageBlocked ? triageTitle : "Clear the small stuff. Keep the important things." }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: InboxTab_default.triageCopy, children: triageBlocked ? triageBlockedCopy : unreadEmailCount ? `Review ${unreadEmailCount} unread email${unreadEmailCount === 1 ? "" : "s"} and surface what needs your attention.` : "Review recent mail and surface anything that still needs your attention." }),
        !triageBlocked && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { className: InboxTab_default.triageCapabilities, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("strong", { children: "Can do:" }),
          " apply Gmail tags \xB7 draft replies \xB7 suggest Google Tasks"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: InboxTab_default.triageActions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { className: InboxTab_default.triageRunBtn, onClick: studyMeNeedsDashboard ? () => window.location.assign("/") : runTriage, disabled: studyMeRunning || studyMeStatusLoading, children: studyMeRunning ? "Waiting for Study Me" : studyMeStatusLoading ? "Checking Study Me\u2026" : studyMeReady ? reviewButtonLabel : "Start or resume Study Me" }),
        !triageBlocked && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: InboxTab_default.triageTrust, children: "Nothing is sent or changed without your review." }),
        triageHistory.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: InboxTab_default.triageHistoryLink, onClick: () => {
          void openTriageDetails();
        }, children: "Review History" })
      ] })
    ] })),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      SearchSortBar,
      {
        search,
        sort,
        grouped,
        onSearch: setSearch,
        onSort: setSort,
        onGroupToggle: () => setGrouped((g) => !g),
        onRefresh: load
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      TagFilterStrip,
      {
        tags: allTags,
        tagObjects: visibleTags,
        active: activeTag,
        onChange: onActiveTagChange,
        onManageTags: refreshAfterTagManagement,
        selectedEmails: emails.filter((e) => selected.has(e.id)),
        onArchive: () => handleArchive(Array.from(selected)),
        onDelete: () => handleDelete(Array.from(selected)),
        onBlockSender: handleBlockSender
      }
    ),
    !loading && total > 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "0 0 4px" }, children: `${total} email${total !== 1 ? "s" : ""}` }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { style: { color: "var(--color-danger, #b42318)", fontSize: "var(--font-size-sm)" }, children: error }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      GroupedEmailList,
      {
        groups: grouped ? groups : [{ sender: "All", senderEmail: "", emails: filtered, latestDate: "" }],
        loading,
        selected,
        tags: visibleTags,
        onToggleSelect: toggleSelect,
        onArchive: (id) => handleArchive([id]),
        onDelete: (id) => handleDelete([id]),
        onReply: (email) => {
          void openReply(email);
        },
        onTagsChanged: (updatedEmail) => setEmails((prev) => {
          const next = prev.map((e) => e.id === updatedEmail.id ? updatedEmail : e);
          onEmailsLoaded?.(next);
          return next;
        }),
        onView: (email) => {
          if (email.hasDraft) {
            void openReply(email);
            return;
          }
          setViewEmail(email);
          if (email.unread) {
            setEmails((prev) => prev.map((e) => e.id === email.id ? { ...e, unread: false } : e));
            proxyFetch("/agent/inbox/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [email.id] }) }).catch(() => {
            });
          }
        },
        grouped
      }
    ),
    !loading && total > PAGE_SIZE2 && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
        "button",
        {
          onClick: () => fetchPage(page - 1),
          disabled: page === 1,
          style: { background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "var(--color-text-muted)" : "var(--color-accent)", padding: "4px 8px", opacity: page === 1 ? 0.4 : 1 },
          children: "\u2190 Prev"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
        "Page ",
        page,
        " of ",
        Math.ceil(total / PAGE_SIZE2)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
        "button",
        {
          onClick: () => fetchPage(page + 1),
          disabled: page >= Math.ceil(total / PAGE_SIZE2),
          style: { background: "none", border: "none", cursor: page >= Math.ceil(total / PAGE_SIZE2) ? "default" : "pointer", color: page >= Math.ceil(total / PAGE_SIZE2) ? "var(--color-text-muted)" : "var(--color-accent)", padding: "4px 8px", opacity: page >= Math.ceil(total / PAGE_SIZE2) ? 0.4 : 1 },
          children: "Next \u2192"
        }
      )
    ] }),
    replyEmail && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ReplyModal, { email: replyEmail, initialBody: replyDraft, onClose: () => {
      setReplyEmail(null);
      setReplyDraft(void 0);
    } }),
    viewEmail && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      ViewEmailModal,
      {
        email: viewEmail,
        tags: visibleTags,
        onClose: () => setViewEmail(null),
        onReply: () => {
          void openReply(viewEmail);
          setViewEmail(null);
        },
        onDelete: () => {
          handleDelete([viewEmail.id]);
          setViewEmail(null);
        },
        onBlockSender: () => {
          handleBlockSender([viewEmail.id], [viewEmail.fromEmail]);
          setViewEmail(null);
        },
        onMarkUnread: () => {
          setEmails((prev) => prev.map((item) => item.id === viewEmail.id ? { ...item, unread: true } : item));
        },
        onTagsChanged: (updatedEmail) => setEmails((prev) => {
          const next = prev.map((e) => e.id === updatedEmail.id ? updatedEmail : e);
          onEmailsLoaded?.(next);
          return next;
        })
      },
      viewEmail.id
    ),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      TriageDetailsModal,
      {
        open: triageDetailsOpen,
        suggestions: triageSuggestions,
        currentRun: triageCurrentRun,
        history: triageHistory,
        onSaveChanges: saveTriageChanges,
        onMarkUnread: markTriageMessagesUnread,
        onClose: () => setTriageDetailsOpen(false)
      }
    )
  ] });
}

// components/inbox/sidebar/CampaignsCard.tsx
var import_react10 = __toESM(require_react());

// components/inbox/sidebar/SidebarCard.module.css
var SidebarCard_default = {
  card: "SidebarCard_card",
  label: "SidebarCard_label",
  headerRow: "SidebarCard_headerRow",
  viewAll: "SidebarCard_viewAll",
  countBadge: "SidebarCard_countBadge",
  statRow: "SidebarCard_statRow",
  statLabel: "SidebarCard_statLabel",
  bigNumber: "SidebarCard_bigNumber",
  grid2: "SidebarCard_grid2",
  miniStat: "SidebarCard_miniStat",
  miniLabel: "SidebarCard_miniLabel",
  miniNumber: "SidebarCard_miniNumber",
  itemList: "SidebarCard_itemList",
  item: "SidebarCard_item",
  itemName: "SidebarCard_itemName",
  statusBadge: "SidebarCard_statusBadge",
  statusSending: "SidebarCard_statusSending",
  statusCompleted: "SidebarCard_statusCompleted",
  statusPending: "SidebarCard_statusPending",
  templateIcon: "SidebarCard_templateIcon",
  dashedBtn: "SidebarCard_dashedBtn"
};

// components/inbox/campaigns/CreateCampaignModal.tsx
var import_react9 = __toESM(require_react());

// components/inbox/campaigns/CreateCampaignModal.module.css
var CreateCampaignModal_default = {
  overlay: "CreateCampaignModal_overlay",
  modal: "CreateCampaignModal_modal",
  popIn: "CreateCampaignModal_popIn",
  header: "CreateCampaignModal_header",
  title: "CreateCampaignModal_title",
  closeBtn: "CreateCampaignModal_closeBtn",
  body: "CreateCampaignModal_body",
  field: "CreateCampaignModal_field",
  label: "CreateCampaignModal_label",
  input: "CreateCampaignModal_input",
  dropZone: "CreateCampaignModal_dropZone",
  dropHint: "CreateCampaignModal_dropHint",
  fileName: "CreateCampaignModal_fileName",
  browseBtn: "CreateCampaignModal_browseBtn",
  recipientHint: "CreateCampaignModal_recipientHint",
  error: "CreateCampaignModal_error",
  footer: "CreateCampaignModal_footer",
  cancelBtn: "CreateCampaignModal_cancelBtn",
  createBtn: "CreateCampaignModal_createBtn",
  select: "CreateCampaignModal_select",
  required: "CreateCampaignModal_required",
  noTemplates: "CreateCampaignModal_noTemplates"
};

// components/inbox/campaigns/CreateCampaignModal.tsx
var import_jsx_runtime13 = __toESM(require_jsx_runtime());
function CreateCampaignModal({ onClose, onCreated }) {
  const [name, setName] = (0, import_react9.useState)("");
  const [templateId, setTemplateId] = (0, import_react9.useState)("");
  const [templates, setTemplates] = (0, import_react9.useState)([]);
  const [csvFile, setCsvFile] = (0, import_react9.useState)(null);
  const [recipientCount, setRecipientCount] = (0, import_react9.useState)(null);
  const [creating, setCreating] = (0, import_react9.useState)(false);
  const [error, setError] = (0, import_react9.useState)("");
  (0, import_react9.useEffect)(() => {
    proxyFetch("/agent/templates").then((r) => r.json()).then((d) => setTemplates(d.templates ?? [])).catch(() => {
    });
  }, []);
  const handleFile = async (file) => {
    setCsvFile(file);
    const text = await file.text();
    const lines = text.trim().split("\n").filter(Boolean);
    setRecipientCount(Math.max(0, lines.length - 1));
  };
  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    if (!templateId) {
      setError("Please select a template.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("templateId", templateId);
      if (csvFile) formData.append("csv", csvFile);
      const res = await proxyFetch("/agent/campaigns", { method: "POST", body: formData });
      if (res.ok) {
        onCreated();
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to create campaign.");
      }
    } catch {
      setError("Network error.");
    }
    setCreating(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: CreateCampaignModal_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CreateCampaignModal_default.modal, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CreateCampaignModal_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h2", { className: CreateCampaignModal_default.title, children: "Create Campaign" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: CreateCampaignModal_default.closeBtn, onClick: onClose, children: "\u2715" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CreateCampaignModal_default.body, children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CreateCampaignModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("label", { className: CreateCampaignModal_default.label, children: "Campaign Name" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { className: CreateCampaignModal_default.input, value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Q4 Beta Launch" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CreateCampaignModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: CreateCampaignModal_default.label, children: [
            "Template ",
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: CreateCampaignModal_default.required, children: "*" })
          ] }),
          templates.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: CreateCampaignModal_default.noTemplates, children: [
            "No templates yet \u2014 ",
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("a", { href: "/inbox/templates", children: "create one first" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("select", { className: CreateCampaignModal_default.select, value: templateId, onChange: (e) => setTemplateId(e.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "", children: "Select a template..." }),
            templates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("option", { value: t.id, children: [
              t.name,
              t.subject ? ` \u2014 ${t.subject}` : ""
            ] }, t.id))
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CreateCampaignModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("label", { className: CreateCampaignModal_default.label, children: "Recipients CSV" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
            "div",
            {
              className: CreateCampaignModal_default.dropZone,
              onDragOver: (e) => e.preventDefault(),
              onDrop: (e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              },
              children: [
                csvFile ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: CreateCampaignModal_default.fileName, children: csvFile.name }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: CreateCampaignModal_default.dropHint, children: "Drop a CSV here or" }),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: CreateCampaignModal_default.browseBtn, children: [
                  "Browse",
                  /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { type: "file", accept: ".csv", style: { display: "none" }, onChange: (e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  } })
                ] })
              ]
            }
          ),
          recipientCount != null && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: CreateCampaignModal_default.recipientHint, children: [
            recipientCount,
            " recipient",
            recipientCount !== 1 ? "s" : "",
            " after merge & dedup"
          ] })
        ] }),
        error && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: CreateCampaignModal_default.error, children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CreateCampaignModal_default.footer, children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: CreateCampaignModal_default.cancelBtn, onClick: onClose, disabled: creating, children: "Cancel" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: CreateCampaignModal_default.createBtn, onClick: handleCreate, disabled: creating || !name.trim() || !templateId, children: creating ? "Creating..." : "Create Campaign" })
      ] })
    ] })
  ] });
}

// components/inbox/sidebar/CampaignsCard.tsx
var import_jsx_runtime14 = __toESM(require_jsx_runtime());
function CampaignsCard() {
  const [campaigns, setCampaigns] = (0, import_react10.useState)([]);
  const [createOpen, setCreateOpen] = (0, import_react10.useState)(false);
  (0, import_react10.useEffect)(() => {
    proxyFetch("/agent/campaigns").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.campaigns) setCampaigns(d.campaigns.slice(0, 3));
    }).catch(() => {
    });
  }, []);
  const statusClass = {
    sending: SidebarCard_default.statusSending,
    completed: SidebarCard_default.statusCompleted,
    pending: SidebarCard_default.statusPending,
    failed: SidebarCard_default.statusPending
  };
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: SidebarCard_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: SidebarCard_default.headerRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h4", { className: SidebarCard_default.label, children: "Campaigns" }),
          campaigns.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { className: SidebarCard_default.countBadge, children: [
            campaigns.length,
            " TOTAL"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Link, { href: "/inbox/campaigns", className: SidebarCard_default.viewAll, children: "View all \u2192" })
      ] }),
      campaigns.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: SidebarCard_default.itemList, children: campaigns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: SidebarCard_default.item, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: SidebarCard_default.itemName, children: c.name }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: `${SidebarCard_default.statusBadge} ${statusClass[c.status] ?? SidebarCard_default.statusPending}`, children: c.status.charAt(0).toUpperCase() + c.status.slice(1) })
      ] }, c.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { className: SidebarCard_default.dashedBtn, onClick: () => setCreateOpen(true), children: "+ Create Campaign" })
    ] }),
    createOpen && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(CreateCampaignModal, { onClose: () => setCreateOpen(false), onCreated: () => setCreateOpen(false) })
  ] });
}

// components/inbox/sidebar/TemplatesCard.tsx
var import_react12 = __toESM(require_react());

// components/inbox/templates/TemplateModal.tsx
var import_react11 = __toESM(require_react());

// components/inbox/templates/TemplateModal.module.css
var TemplateModal_default = {
  overlay: "TemplateModal_overlay",
  modal: "TemplateModal_modal",
  popIn: "TemplateModal_popIn",
  header: "TemplateModal_header",
  title: "TemplateModal_title",
  closeBtn: "TemplateModal_closeBtn",
  body: "TemplateModal_body",
  row2: "TemplateModal_row2",
  field: "TemplateModal_field",
  label: "TemplateModal_label",
  input: "TemplateModal_input",
  modeToggle: "TemplateModal_modeToggle",
  modeBtn: "TemplateModal_modeBtn",
  modeActive: "TemplateModal_modeActive",
  textarea: "TemplateModal_textarea",
  visualEditor: "TemplateModal_visualEditor",
  error: "TemplateModal_error",
  footer: "TemplateModal_footer",
  deleteBtn: "TemplateModal_deleteBtn",
  duplicateBtn: "TemplateModal_duplicateBtn",
  cancelBtn: "TemplateModal_cancelBtn",
  saveBtn: "TemplateModal_saveBtn",
  typeSelector: "TemplateModal_typeSelector",
  typeChip: "TemplateModal_typeChip",
  typeChipActive: "TemplateModal_typeChipActive"
};

// components/inbox/templates/TemplateModal.tsx
var import_jsx_runtime15 = __toESM(require_jsx_runtime());
function TemplateModal({ template, onClose, onSaved }) {
  const isEdit = !!template?.id;
  const [name, setName] = (0, import_react11.useState)(template?.name ?? "");
  const [subject, setSubject] = (0, import_react11.useState)(template?.subject ?? "");
  const [type, setType] = (0, import_react11.useState)(template?.type ?? "");
  const [body, setBody] = (0, import_react11.useState)(template?.body ?? "");
  const [editorMode, setEditorMode] = (0, import_react11.useState)("code");
  const [saving, setSaving] = (0, import_react11.useState)(false);
  const [error, setError] = (0, import_react11.useState)("");
  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { name: name.trim(), subject: subject.trim(), body, type: type || void 0 };
      const res = isEdit ? await proxyFetch(`/agent/templates/${template.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }) : await proxyFetch("/agent/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        onSaved();
      } else {
        const d = await res.json();
        setError(d.error ?? "Save failed.");
      }
    } catch {
      setError("Network error.");
    }
    setSaving(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: TemplateModal_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.modal, children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h2", { className: TemplateModal_default.title, children: isEdit ? "Edit Template" : "New Template" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: TemplateModal_default.closeBtn, onClick: onClose, children: "\u2715" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.body, children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.row2, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.field, children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("label", { className: TemplateModal_default.label, children: "Name" }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("input", { className: TemplateModal_default.input, value: name, onChange: (e) => setName(e.target.value), placeholder: "Template name" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.field, children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("label", { className: TemplateModal_default.label, children: "Subject" }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("input", { className: TemplateModal_default.input, value: subject, onChange: (e) => setSubject(e.target.value), placeholder: "Email subject" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("label", { className: TemplateModal_default.label, children: "Type" }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: TemplateModal_default.typeSelector, children: ["welcome", "newsletter", "promotional", "transactional", "other"].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
            "button",
            {
              type: "button",
              className: `${TemplateModal_default.typeChip} ${type === opt ? TemplateModal_default.typeChipActive : ""}`,
              onClick: () => setType(type === opt ? "" : opt),
              children: opt
            },
            opt
          )) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.modeToggle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: `${TemplateModal_default.modeBtn} ${editorMode === "code" ? TemplateModal_default.modeActive : ""}`, onClick: () => setEditorMode("code"), children: "Code" }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: `${TemplateModal_default.modeBtn} ${editorMode === "visual" ? TemplateModal_default.modeActive : ""}`, onClick: () => setEditorMode("visual"), children: "Visual" })
        ] }),
        editorMode === "code" ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          "textarea",
          {
            className: TemplateModal_default.textarea,
            value: body,
            onChange: (e) => setBody(e.target.value),
            placeholder: "Paste your HTML template here...",
            rows: 14
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          "div",
          {
            className: TemplateModal_default.visualEditor,
            contentEditable: true,
            dangerouslySetInnerHTML: { __html: body },
            onInput: (e) => setBody(e.target.innerHTML)
          }
        ),
        error && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: TemplateModal_default.error, children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: TemplateModal_default.footer, children: [
        isEdit && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: TemplateModal_default.deleteBtn, onClick: async () => {
          await proxyFetch(`/agent/templates/${template.id}`, { method: "DELETE" });
          onSaved();
        }, children: "Delete" }),
        isEdit && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: TemplateModal_default.duplicateBtn, onClick: async () => {
          await proxyFetch("/agent/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `Copy of ${name.trim()}`, subject, body, type: type || void 0 })
          });
          onSaved();
        }, children: "Duplicate" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { style: { flex: 1 } }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: TemplateModal_default.cancelBtn, onClick: onClose, disabled: saving, children: "Cancel" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: TemplateModal_default.saveBtn, onClick: handleSave, disabled: saving || !name.trim(), children: saving ? "Saving..." : "Save" })
      ] })
    ] })
  ] });
}

// components/inbox/sidebar/TemplatesCard.tsx
var import_jsx_runtime16 = __toESM(require_jsx_runtime());
function TemplatesCard() {
  const [templates, setTemplates] = (0, import_react12.useState)([]);
  const [newOpen, setNewOpen] = (0, import_react12.useState)(false);
  (0, import_react12.useEffect)(() => {
    proxyFetch("/agent/templates").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.templates) setTemplates(d.templates.slice(0, 3));
    }).catch(() => {
    });
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: SidebarCard_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: SidebarCard_default.headerRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h4", { className: SidebarCard_default.label, children: "Templates" }),
          templates.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: SidebarCard_default.countBadge, children: [
            templates.length,
            " SAVED"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Link, { href: "/inbox/templates", className: SidebarCard_default.viewAll, children: "View all \u2192" })
      ] }),
      templates.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: SidebarCard_default.itemList, children: templates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: SidebarCard_default.item, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: SidebarCard_default.templateIcon, children: "\u{1F4C4}" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: SidebarCard_default.itemName, children: t.name })
      ] }, t.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { className: SidebarCard_default.dashedBtn, onClick: () => setNewOpen(true), children: "+ New Template" })
    ] }),
    newOpen && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(TemplateModal, { onClose: () => setNewOpen(false), onSaved: () => setNewOpen(false) })
  ] });
}

// components/inbox/compose/ComposeModal.tsx
var import_react13 = __toESM(require_react());
var import_jsx_runtime17 = __toESM(require_jsx_runtime());
function ComposeModal({ onClose }) {
  const [recipients, setRecipients] = (0, import_react13.useState)([{ name: "", email: "" }]);
  const [subject, setSubject] = (0, import_react13.useState)("");
  const [body, setBody] = (0, import_react13.useState)(BLANK_EMAIL_TEMPLATE);
  const [mode, setMode] = (0, import_react13.useState)("custom");
  const [templates, setTemplates] = (0, import_react13.useState)([]);
  const [selectedTemplate, setSelectedTemplate] = (0, import_react13.useState)("");
  const [attachments, setAttachments] = (0, import_react13.useState)([]);
  const [sending, setSending] = (0, import_react13.useState)(false);
  const [error, setError] = (0, import_react13.useState)("");
  const [showPreview, setShowPreview] = (0, import_react13.useState)(false);
  const [googleEmail, setGoogleEmail] = (0, import_react13.useState)("");
  (0, import_react13.useEffect)(() => {
    proxyFetch("/agent/templates").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.templates) setTemplates(d.templates);
    }).catch(() => {
    });
    proxyFetch("/auth/me").then((r) => r.ok ? r.json() : null).then((user) => {
      if (user?.email) setGoogleEmail(user.email);
    }).catch(() => {
    });
  }, []);
  (0, import_react13.useEffect)(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);
  const updateRecipient = (i, field, val) => setRecipients((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addRecipient = () => setRecipients((prev) => [...prev, { name: "", email: "" }]);
  const removeRecipient = (i) => setRecipients((prev) => prev.filter((_, idx) => idx !== i));
  const getContent = () => {
    if (mode === "template" && selectedTemplate) {
      const tpl = templates.find((t) => t.id === selectedTemplate);
      if (tpl) return { subject: tpl.subject, body: tpl.body };
    }
    return { subject, body };
  };
  const handleSend = async () => {
    const valid = recipients.filter((r) => r.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()));
    if (!valid.length) {
      setError("Add at least one valid recipient.");
      return;
    }
    const content = getContent();
    if (!content.subject.trim() || !content.body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("recipients", JSON.stringify(valid));
      fd.append("subject", content.subject);
      fd.append("body", content.body);
      if (googleEmail) fd.append("accountId", `google:${googleEmail}`);
      attachments.forEach((f) => fd.append("attachments", f));
      const res = await proxyFetch("/agent/compose/send", { method: "POST", body: fd });
      if (res.ok) {
        onClose();
        return;
      }
      const d = await res.json();
      setError(d.error ?? "Send failed.");
    } catch {
      setError("Network error.");
    }
    setSending(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: ComposeModal_default.overlay, onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.modal, children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h2", { className: ComposeModal_default.title, children: "Compose" }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: ComposeModal_default.sendBtn, onClick: handleSend, disabled: sending, children: sending ? "Sending..." : "Send" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: ComposeModal_default.closeBtn, onClick: onClose, children: "\u2715" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.body, children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "To" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
            recipients.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
                "input",
                {
                  className: ComposeModal_default.input,
                  style: { flex: 1 },
                  placeholder: "Name",
                  value: r.name,
                  onChange: (e) => updateRecipient(i, "name", e.target.value)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
                "input",
                {
                  className: ComposeModal_default.input,
                  style: { flex: 1 },
                  type: "email",
                  placeholder: "email@example.com",
                  value: r.email,
                  onChange: (e) => updateRecipient(i, "email", e.target.value)
                }
              ),
              recipients.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: ComposeModal_default.closeBtn, onClick: () => removeRecipient(i), title: "Remove", children: "\u2715" })
            ] }, i)),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              "button",
              {
                style: { alignSelf: "flex-start", background: "none", border: "none", color: "var(--color-accent)", fontSize: "var(--font-size-xs)", fontWeight: 600, cursor: "pointer", padding: 0 },
                onClick: addRecipient,
                children: "+ Add recipient"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.modeToggle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: `${ComposeModal_default.modeBtn} ${mode === "custom" ? ComposeModal_default.modeActive : ""}`, onClick: () => setMode("custom"), children: "Custom" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: `${ComposeModal_default.modeBtn} ${mode === "template" ? ComposeModal_default.modeActive : ""}`, onClick: () => setMode("template"), children: "Use Template" })
        ] }),
        mode === "template" ? /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Template" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
            "select",
            {
              className: ComposeModal_default.input,
              value: selectedTemplate,
              onChange: (e) => setSelectedTemplate(e.target.value),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("option", { value: "", children: "Choose a template..." }),
                templates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("option", { value: t.id, children: t.name }, t.id))
              ]
            }
          ),
          selectedTemplate && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }, children: [
            "Subject: ",
            templates.find((t) => t.id === selectedTemplate)?.subject
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.field, children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Subject" }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              "input",
              {
                className: ComposeModal_default.input,
                value: subject,
                onChange: (e) => setSubject(e.target.value),
                placeholder: "Subject line (use {{name}} for personalization)"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.field, children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Body (HTML)" }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
                "button",
                {
                  type: "button",
                  style: { background: "none", border: "none", fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-accent)", cursor: "pointer", padding: 0 },
                  onClick: () => setShowPreview((p) => !p),
                  children: showPreview ? "Hide Preview" : "Show Preview"
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              "textarea",
              {
                className: ComposeModal_default.textarea,
                value: body,
                onChange: (e) => setBody(e.target.value),
                rows: 10
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }, children: [
              "Use ",
              "{{name}}",
              " and ",
              "{{email}}",
              " for personalization"
            ] }),
            showPreview && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              "iframe",
              {
                srcDoc: body,
                sandbox: "allow-same-origin",
                title: "Preview",
                style: { width: "100%", minHeight: 300, border: "1px solid var(--color-border)", borderRadius: 8, marginTop: 8, background: "#fff" }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("label", { className: ComposeModal_default.fieldLabel, children: "Attachments" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", border: "2px dashed var(--color-border)", borderRadius: 12, cursor: "pointer", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", fontWeight: 600, transition: "border-color 0.15s" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" }) }),
            attachments.length ? `${attachments.length} file${attachments.length === 1 ? "" : "s"} attached` : "+ Attach files",
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              "input",
              {
                type: "file",
                multiple: true,
                style: { display: "none" },
                onChange: (e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])])
              }
            )
          ] }),
          attachments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }, children: attachments.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { style: { fontSize: "var(--font-size-xs)", padding: "4px 10px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 999 }, children: [
            "\u{1F4CE} ",
            f.name,
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              "button",
              {
                type: "button",
                onClick: () => setAttachments((prev) => prev.filter((_, idx) => idx !== i)),
                style: { background: "none", border: "none", cursor: "pointer", marginLeft: 4, color: "var(--color-text-muted)", fontSize: 11 },
                children: "\u2715"
              }
            )
          ] }, i)) })
        ] }),
        error && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: ComposeModal_default.error, children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: ComposeModal_default.footer, children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: ComposeModal_default.cancelBtn, onClick: onClose, disabled: sending, children: "Cancel" }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: ComposeModal_default.sendBtn, onClick: handleSend, disabled: sending, children: sending ? "Sending..." : "Send" })
      ] })
    ] })
  ] });
}

// components/inbox/InboxPage.module.css
var InboxPage_default = {
  shell: "InboxPage_shell",
  layout: "InboxPage_layout",
  main: "InboxPage_main",
  sidebar: "InboxPage_sidebar"
};

// components/inbox/InboxPage.tsx
var import_jsx_runtime18 = __toESM(require_jsx_runtime());
function InboxPage({ userName, userImage }) {
  const searchParams = useSearchParams();
  const initials2 = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const [composeOpen, setComposeOpen] = (0, import_react14.useState)(false);
  const [unreadCount, setUnreadCount] = (0, import_react14.useState)(0);
  const [tags, setTags] = (0, import_react14.useState)([]);
  const [activeTag, setActiveTag] = (0, import_react14.useState)("Unread");
  const handleUnreadChange = (0, import_react14.useCallback)((n) => setUnreadCount(n), []);
  const handleTagsLoaded = (0, import_react14.useCallback)((t) => setTags(t), []);
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: InboxPage_default.shell, children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(AppHeader, { userImage, userName, initials: initials2, pageTitle: "Inbox" }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("main", { className: InboxPage_default.layout, children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: InboxPage_default.main, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        InboxTab,
        {
          unreadCount,
          onUnreadChange: handleUnreadChange,
          onCompose: () => setComposeOpen(true),
          tags,
          activeTag,
          onActiveTagChange: setActiveTag,
          onTagsLoaded: handleTagsLoaded,
          initialMessageId: searchParams.get("messageId") ?? void 0
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("aside", { className: InboxPage_default.sidebar, children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(CampaignsCard, {}),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(TemplatesCard, {})
      ] })
    ] }),
    composeOpen && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(ComposeModal, { onClose: () => setComposeOpen(false) }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/inbox.tsx
var import_jsx_runtime19 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime19.jsx)(InboxPage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
