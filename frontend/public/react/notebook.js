import {
  ModalOverlay_default
} from "./chunk-H5AG5GHM.js";
import {
  FloatingAssistant
} from "./chunk-HHC3YXP7.js";
import "./chunk-2G5PXYFZ.js";
import {
  AppHeader
} from "./chunk-ZLOKTPEE.js";
import "./chunk-OHWNV7E6.js";
import {
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-NPORSBBQ.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/notebook.tsx
var import_client = __toESM(require_client());

// components/notebook/NotebookDashboard.tsx
var import_react4 = __toESM(require_react());

// components/notebook/NotebookDashboard.module.css
var NotebookDashboard_default = {
  page: "NotebookDashboard_page",
  content: "NotebookDashboard_content",
  header: "NotebookDashboard_header",
  title: "NotebookDashboard_title",
  subtitle: "NotebookDashboard_subtitle",
  grid: "NotebookDashboard_grid",
  scrollRow: "NotebookDashboard_scrollRow",
  divider: "NotebookDashboard_divider",
  dividerLine: "NotebookDashboard_dividerLine",
  dividerLabel: "NotebookDashboard_dividerLabel",
  driveCard: "NotebookDashboard_driveCard",
  driveCardIconBadge: "NotebookDashboard_driveCardIconBadge",
  driveIconBlue: "NotebookDashboard_driveIconBlue",
  driveIconGreen: "NotebookDashboard_driveIconGreen",
  driveIconRed: "NotebookDashboard_driveIconRed",
  driveIconYellow: "NotebookDashboard_driveIconYellow",
  driveCardBottom: "NotebookDashboard_driveCardBottom",
  driveCardName: "NotebookDashboard_driveCardName",
  driveCardMeta: "NotebookDashboard_driveCardMeta",
  driveCardLinkIcon: "NotebookDashboard_driveCardLinkIcon",
  newDriveFileCard: "NotebookDashboard_newDriveFileCard",
  driveFileTypeGrid: "NotebookDashboard_driveFileTypeGrid",
  driveFileTypeBtn: "NotebookDashboard_driveFileTypeBtn",
  driveFileTypeBtnActive: "NotebookDashboard_driveFileTypeBtnActive",
  driveFileTypeIcon: "NotebookDashboard_driveFileTypeIcon",
  driveFolderRow: "NotebookDashboard_driveFolderRow",
  driveFolderIcon: "NotebookDashboard_driveFolderIcon",
  driveFolderInput: "NotebookDashboard_driveFolderInput",
  section: "NotebookDashboard_section",
  sectionTitle: "NotebookDashboard_sectionTitle",
  noteCard: "NotebookDashboard_noteCard",
  noteCardKeep: "NotebookDashboard_noteCardKeep",
  modalContent: "NotebookDashboard_modalContent",
  keepBadge: "NotebookDashboard_keepBadge",
  newPageCard: "NotebookDashboard_newPageCard",
  newPageConfirm: "NotebookDashboard_newPageConfirm",
  newPageCancel: "NotebookDashboard_newPageCancel",
  newPageIcon: "NotebookDashboard_newPageIcon",
  newPageLabel: "NotebookDashboard_newPageLabel",
  noteTitle: "NotebookDashboard_noteTitle",
  noteBody: "NotebookDashboard_noteBody",
  itemList: "NotebookDashboard_itemList",
  itemWrapper: "NotebookDashboard_itemWrapper",
  item: "NotebookDashboard_item",
  dateChip: "NotebookDashboard_dateChip",
  checkbox: "NotebookDashboard_checkbox",
  doneCount: "NotebookDashboard_doneCount",
  skeleton: "NotebookDashboard_skeleton",
  shimmer: "NotebookDashboard_shimmer",
  empty: "NotebookDashboard_empty",
  emptyIcon: "NotebookDashboard_emptyIcon",
  emptyTitle: "NotebookDashboard_emptyTitle",
  emptySubtext: "NotebookDashboard_emptySubtext",
  slideUp: "NotebookDashboard_slideUp",
  modalClose: "NotebookDashboard_modalClose",
  modalTitle: "NotebookDashboard_modalTitle",
  modalTextarea: "NotebookDashboard_modalTextarea",
  modalItemList: "NotebookDashboard_modalItemList",
  modalItem: "NotebookDashboard_modalItem",
  modalItemDone: "NotebookDashboard_modalItemDone",
  completedLabel: "NotebookDashboard_completedLabel",
  emptyNotes: "NotebookDashboard_emptyNotes",
  noteModalTaskList: "NotebookDashboard_noteModalTaskList",
  noteModalRow: "NotebookDashboard_noteModalRow",
  noteModalTitleRow: "NotebookDashboard_noteModalTitleRow",
  noteModalCheckbox: "NotebookDashboard_noteModalCheckbox",
  noteModalCheckmark: "NotebookDashboard_noteModalCheckmark",
  noteModalTitle: "NotebookDashboard_noteModalTitle",
  noteModalRowDone: "NotebookDashboard_noteModalRowDone",
  noteModalChips: "NotebookDashboard_noteModalChips",
  noteModalDateChip: "NotebookDashboard_noteModalDateChip",
  noteModalDateChipLabel: "NotebookDashboard_noteModalDateChipLabel",
  noteModalDateChipClear: "NotebookDashboard_noteModalDateChipClear",
  noteModalDateChipEmpty: "NotebookDashboard_noteModalDateChipEmpty",
  noteModalDateHidden: "NotebookDashboard_noteModalDateHidden",
  noteModalNotesToggle: "NotebookDashboard_noteModalNotesToggle",
  noteModalNotesToggleActive: "NotebookDashboard_noteModalNotesToggleActive",
  noteModalDelete: "NotebookDashboard_noteModalDelete",
  noteModalNotes: "NotebookDashboard_noteModalNotes",
  noteModalAddRow: "NotebookDashboard_noteModalAddRow",
  noteModalAddBtn: "NotebookDashboard_noteModalAddBtn",
  newPageModalTitleInput: "NotebookDashboard_newPageModalTitleInput",
  newPageModalTaskSection: "NotebookDashboard_newPageModalTaskSection",
  newPageModalTaskLabel: "NotebookDashboard_newPageModalTaskLabel",
  newPageModalTaskList: "NotebookDashboard_newPageModalTaskList",
  newPageModalTaskRow: "NotebookDashboard_newPageModalTaskRow",
  newPageModalCheckbox: "NotebookDashboard_newPageModalCheckbox",
  newPageModalTaskInput: "NotebookDashboard_newPageModalTaskInput",
  newPageModalActions: "NotebookDashboard_newPageModalActions"
};

// components/notebook/NoteCard.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
var DATE_ANNOTATION = /\s*\(based on (.+?)\)\s*$/i;
function parseTitle(raw) {
  const match = DATE_ANNOTATION.exec(raw);
  if (!match) return { title: raw, annotationYear: null };
  const yearMatch = /\b(\d{4})\b/.exec(match[1]);
  return { title: raw.slice(0, match.index).trim(), annotationYear: yearMatch ? yearMatch[1] : null };
}
function formatDue(iso) {
  return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
}
function NoteCard({ reminder, onClick, isKeep }) {
  const open = reminder.items.filter((i) => !i.completed).slice(0, 10);
  const doneCount = reminder.items.filter((i) => i.completed).length;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { className: `${NotebookDashboard_default.noteCard} ${isKeep ? NotebookDashboard_default.noteCardKeep : ""}`, onClick, type: "button", children: [
    isKeep && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: NotebookDashboard_default.keepBadge, children: "From Keep" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: NotebookDashboard_default.noteTitle, children: reminder.title }),
    open.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: NotebookDashboard_default.itemList, children: open.map((item) => {
      const { title, annotationYear } = parseTitle(item.title);
      const chip = item.due ? formatDue(item.due) : annotationYear;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: NotebookDashboard_default.itemWrapper, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: NotebookDashboard_default.item, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: NotebookDashboard_default.checkbox }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: title })
        ] }),
        chip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: NotebookDashboard_default.dateChip, children: chip })
      ] }, item.id);
    }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: NotebookDashboard_default.noteBody, style: { fontStyle: "italic" }, children: "No open tasks" }),
    doneCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: NotebookDashboard_default.doneCount, children: [
      doneCount,
      " completed"
    ] })
  ] });
}

// components/notebook/NoteModal.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var DATE_ANNOTATION2 = /\s*\(based on .+?\)\s*$/i;
function cleanTitle(raw) {
  return raw.replace(DATE_ANNOTATION2, "").trim();
}
function patchTask(listId, taskId, body) {
  return proxyFetch(`/agent/notebook/pages/${listId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
function deleteTask(listId, taskId) {
  return proxyFetch(`/agent/notebook/pages/${listId}/tasks/${taskId}`, { method: "DELETE" });
}
function NoteModal({ reminder, onClose }) {
  const [items, setItems] = (0, import_react.useState)(reminder.items);
  const [adding, setAdding] = (0, import_react.useState)(false);
  const [newTitle, setNewTitle] = (0, import_react.useState)("");
  function updateItem(id, patch) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it));
  }
  async function addTask() {
    if (!newTitle.trim()) {
      setAdding(false);
      return;
    }
    const title = newTitle.trim();
    setNewTitle("");
    setAdding(false);
    const res = await proxyFetch(`/agent/notebook/pages/${reminder.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    if (res.ok) {
      const { task } = await res.json();
      setItems((prev) => [...prev, { id: task.id, title: task.title, notes: null, completed: false, due: null }]);
    }
  }
  async function toggleComplete(item) {
    const next = !item.completed;
    updateItem(item.id, { completed: next });
    await patchTask(reminder.id, item.id, { status: next ? "completed" : "needsAction" });
  }
  async function saveField(item, field, value) {
    if (value === (item[field] ?? "")) return;
    updateItem(item.id, { [field]: value });
    await patchTask(reminder.id, item.id, { [field]: value });
  }
  async function saveDue(item, value) {
    const due = value || null;
    updateItem(item.id, { due });
    await patchTask(reminder.id, item.id, { due: due ? `${due}T00:00:00.000Z` : null });
  }
  async function handleDelete(item) {
    updateItem(item.id, { deleted: true });
    await deleteTask(reminder.id, item.id);
  }
  const visible = items.filter((it) => !it.deleted);
  const open = visible.filter((it) => !it.completed);
  const done = visible.filter((it) => it.completed);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ModalOverlay_default.overlay, onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: NotebookDashboard_default.modalContent, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: NotebookDashboard_default.modalClose, onClick: onClose, type: "button", "aria-label": "Close", children: "\u2715" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: NotebookDashboard_default.modalTitle, children: reminder.title }),
    visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: NotebookDashboard_default.emptyNotes, children: "No tasks" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("ul", { className: NotebookDashboard_default.noteModalTaskList, children: [
        open.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          TaskRow,
          {
            item,
            onToggle: () => toggleComplete(item),
            onSaveTitle: (v) => saveField(item, "title", v),
            onSaveNotes: (v) => saveField(item, "notes", v),
            onSaveDue: (v) => saveDue(item, v),
            onDelete: () => handleDelete(item)
          },
          item.id
        )),
        adding ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: NotebookDashboard_default.noteModalAddRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: NotebookDashboard_default.noteModalCheckbox, "aria-hidden": true }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              autoFocus: true,
              className: NotebookDashboard_default.noteModalTitle,
              value: newTitle,
              onChange: (e) => setNewTitle(e.target.value),
              placeholder: "New task\u2026",
              onKeyDown: (e) => {
                if (e.key === "Enter") addTask();
                if (e.key === "Escape") {
                  setAdding(false);
                  setNewTitle("");
                }
              },
              onBlur: addTask
            }
          )
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: NotebookDashboard_default.noteModalAddBtn, onClick: () => setAdding(true), children: "+ Add task" }) })
      ] }),
      done.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: NotebookDashboard_default.completedLabel, children: [
          done.length,
          " completed"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: NotebookDashboard_default.noteModalTaskList, children: done.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          TaskRow,
          {
            item,
            onToggle: () => toggleComplete(item),
            onSaveTitle: (v) => saveField(item, "title", v),
            onSaveNotes: (v) => saveField(item, "notes", v),
            onSaveDue: (v) => saveDue(item, v),
            onDelete: () => handleDelete(item)
          },
          item.id
        )) })
      ] })
    ] })
  ] }) });
}
function formatDue2(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(void 0, { month: "short", day: "numeric" });
}
function TaskRow({ item, onToggle, onSaveTitle, onSaveNotes, onSaveDue, onDelete }) {
  const [notes, setNotes] = (0, import_react.useState)(item.notes ?? "");
  const [showNotes, setShowNotes] = (0, import_react.useState)(!!item.notes);
  const dateRef = (0, import_react.useRef)(null);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: `${NotebookDashboard_default.noteModalRow} ${item.completed ? NotebookDashboard_default.noteModalRowDone : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: NotebookDashboard_default.noteModalTitleRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          type: "button",
          className: NotebookDashboard_default.noteModalCheckbox,
          onClick: onToggle,
          "aria-label": item.completed ? "Mark incomplete" : "Mark complete",
          children: item.completed && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: NotebookDashboard_default.noteModalCheckmark, children: "\u2713" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "textarea",
        {
          className: NotebookDashboard_default.noteModalTitle,
          defaultValue: cleanTitle(item.title),
          rows: 1,
          onInput: (e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          },
          onBlur: (e) => onSaveTitle(e.currentTarget.value)
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: NotebookDashboard_default.noteModalChips, children: [
      item.due ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: NotebookDashboard_default.noteModalDateChip, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: NotebookDashboard_default.noteModalDateChipLabel, onClick: () => dateRef.current?.showPicker(), children: formatDue2(item.due) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: NotebookDashboard_default.noteModalDateChipClear, onClick: () => onSaveDue(""), "aria-label": "Remove due date", children: "\xD7" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: NotebookDashboard_default.noteModalDateChipEmpty, onClick: () => dateRef.current?.showPicker(), children: "+ date" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          ref: dateRef,
          type: "date",
          className: NotebookDashboard_default.noteModalDateHidden,
          value: item.due ?? "",
          onChange: (e) => onSaveDue(e.target.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "button",
        {
          type: "button",
          className: `${NotebookDashboard_default.noteModalNotesToggle} ${showNotes ? NotebookDashboard_default.noteModalNotesToggleActive : ""}`,
          onClick: () => setShowNotes((v) => !v),
          children: [
            "Details ",
            showNotes ? "\u25B2" : "\u25BC"
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: NotebookDashboard_default.noteModalDelete, onClick: onDelete, "aria-label": "Delete task", children: "\u{1F5D1}" })
    ] }),
    showNotes && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "textarea",
      {
        className: NotebookDashboard_default.noteModalNotes,
        value: notes,
        placeholder: "Add details\u2026",
        rows: 2,
        ref: (el) => {
          if (el) {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }
        },
        onChange: (e) => {
          setNotes(e.target.value);
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        },
        onBlur: () => onSaveNotes(notes)
      }
    )
  ] });
}

// components/notebook/NewPageModal.tsx
var import_react2 = __toESM(require_react());
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function NewPageModal({ onClose, onCreated }) {
  const [title, setTitle] = (0, import_react2.useState)("");
  const [tasks, setTasks] = (0, import_react2.useState)([""]);
  const [saving, setSaving] = (0, import_react2.useState)(false);
  const titleRef = (0, import_react2.useRef)(null);
  const taskRefs = (0, import_react2.useRef)([]);
  (0, import_react2.useEffect)(() => {
    titleRef.current?.focus();
  }, []);
  function updateTask(i, val) {
    setTasks((prev) => prev.map((t, idx) => idx === i ? val : t));
  }
  function addTaskAfter(i) {
    setTasks((prev) => [...prev.slice(0, i + 1), "", ...prev.slice(i + 1)]);
    setTimeout(() => taskRefs.current[i + 1]?.focus(), 30);
  }
  function removeTask(i) {
    if (tasks.length === 1) {
      setTasks([""]);
      return;
    }
    setTasks((prev) => prev.filter((_, idx) => idx !== i));
    setTimeout(() => taskRefs.current[Math.max(0, i - 1)]?.focus(), 30);
  }
  async function handleCreate() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const pageRes = await proxyFetch("/agent/notebook/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() })
      });
      if (!pageRes.ok) return;
      const { page } = await pageRes.json();
      const filled = tasks.map((t) => t.trim()).filter(Boolean);
      const createdTasks = await Promise.all(
        filled.map(
          (t) => proxyFetch(`/agent/notebook/pages/${page.id}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: t })
          }).then((r) => r.ok ? r.json().then((d) => d.task) : null)
        )
      );
      onCreated({ ...page, items: createdTasks.filter(Boolean).map((t) => ({ id: t.id, title: t.title, completed: false })) });
      onClose();
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: ModalOverlay_default.overlay, onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: NotebookDashboard_default.modalContent, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: NotebookDashboard_default.modalClose, onClick: onClose, type: "button", "aria-label": "Close", children: "\u2715" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: NotebookDashboard_default.modalTitle, children: "New Page" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "input",
      {
        ref: titleRef,
        className: NotebookDashboard_default.newPageModalTitleInput,
        value: title,
        onChange: (e) => setTitle(e.target.value),
        placeholder: "Page name\u2026",
        onKeyDown: (e) => {
          if (e.key === "Escape") onClose();
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: NotebookDashboard_default.newPageModalTaskSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: NotebookDashboard_default.newPageModalTaskLabel, children: "Tasks" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { className: NotebookDashboard_default.newPageModalTaskList, children: tasks.map((task, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: NotebookDashboard_default.newPageModalTaskRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", className: NotebookDashboard_default.newPageModalCheckbox, disabled: true, tabIndex: -1 }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            ref: (el) => {
              taskRefs.current[i] = el;
            },
            className: NotebookDashboard_default.newPageModalTaskInput,
            value: task,
            onChange: (e) => updateTask(i, e.target.value),
            placeholder: "Add a task\u2026",
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTaskAfter(i);
              }
              if (e.key === "Backspace" && task === "") {
                e.preventDefault();
                removeTask(i);
              }
              if (e.key === "Escape") onClose();
            }
          }
        )
      ] }, i)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: NotebookDashboard_default.newPageModalActions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: NotebookDashboard_default.newPageConfirm, onClick: handleCreate, disabled: saving || !title.trim(), type: "button", children: saving ? "Creating\u2026" : "Create" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: NotebookDashboard_default.newPageCancel, onClick: onClose, type: "button", children: "Cancel" })
    ] })
  ] }) });
}

// components/notebook/DriveFileCard.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
function fileIcon(mimeType) {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return { icon: "\u{1F4CA}", colorClass: NotebookDashboard_default.driveIconGreen };
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return { icon: "\u{1F4FD}\uFE0F", colorClass: NotebookDashboard_default.driveIconYellow };
  if (mimeType.includes("pdf")) return { icon: "\u{1F4C4}", colorClass: NotebookDashboard_default.driveIconRed };
  return { icon: "\u{1F4DD}", colorClass: NotebookDashboard_default.driveIconBlue };
}
function formatModified(iso) {
  const d = new Date(iso);
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
  if (diffHours < 1) return "Modified just now";
  if (diffHours < 24) return `Modified ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Modified ${diffDays}d ago`;
  return `Modified ${d.toLocaleDateString(void 0, { month: "short", day: "numeric" })}`;
}
function DriveFileCard({ file }) {
  const { icon, colorClass } = fileIcon(file.mimeType);
  function handleClick() {
    window.open(file.webViewLink, "_blank", "noopener,noreferrer");
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { className: NotebookDashboard_default.driveCard, onClick: handleClick, type: "button", "aria-label": `Open ${file.name} in Google Drive`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `${NotebookDashboard_default.driveCardIconBadge} ${colorClass}`, children: icon }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: NotebookDashboard_default.driveCardBottom, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: NotebookDashboard_default.driveCardName, children: file.name }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: NotebookDashboard_default.driveCardMeta, children: formatModified(file.modifiedTime) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: NotebookDashboard_default.driveCardLinkIcon, "aria-hidden": true, children: "\u2197" })
  ] });
}

// components/notebook/NewDriveFileModal.tsx
var import_react3 = __toESM(require_react());
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
var FILE_TYPES = [
  { type: "doc", label: "Doc", icon: "\u{1F4DD}" },
  { type: "sheet", label: "Sheet", icon: "\u{1F4CA}" },
  { type: "slide", label: "Slide", icon: "\u{1F4FD}\uFE0F" }
];
function NewDriveFileModal({ onClose, onCreated }) {
  const [title, setTitle] = (0, import_react3.useState)("");
  const [fileType, setFileType] = (0, import_react3.useState)("doc");
  const [folderPath, setFolderPath] = (0, import_react3.useState)("My Drive");
  const [saving, setSaving] = (0, import_react3.useState)(false);
  const titleRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    titleRef.current?.focus();
  }, []);
  async function handleCreate() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await proxyFetch("/agent/drive/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), fileType, folderPath })
      });
      if (!res.ok) return;
      const { file } = await res.json();
      onCreated(file);
      window.open(file.webViewLink, "_blank", "noopener,noreferrer");
      onClose();
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: ModalOverlay_default.overlay, onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: NotebookDashboard_default.modalContent, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: NotebookDashboard_default.modalClose, onClick: onClose, type: "button", "aria-label": "Close", children: "\u2715" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: NotebookDashboard_default.modalTitle, children: "New Google Drive File" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "input",
      {
        ref: titleRef,
        className: NotebookDashboard_default.newPageModalTitleInput,
        value: title,
        onChange: (e) => setTitle(e.target.value),
        placeholder: "File name\u2026",
        onKeyDown: (e) => {
          if (e.key === "Enter" && title.trim()) handleCreate();
          if (e.key === "Escape") onClose();
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: NotebookDashboard_default.newPageModalTaskSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: NotebookDashboard_default.newPageModalTaskLabel, children: "File type" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: NotebookDashboard_default.driveFileTypeGrid, children: FILE_TYPES.map(({ type, label, icon }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        "button",
        {
          type: "button",
          className: `${NotebookDashboard_default.driveFileTypeBtn} ${fileType === type ? NotebookDashboard_default.driveFileTypeBtnActive : ""}`,
          onClick: () => setFileType(type),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: NotebookDashboard_default.driveFileTypeIcon, children: icon }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: label })
          ]
        },
        type
      )) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: NotebookDashboard_default.newPageModalTaskSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: NotebookDashboard_default.newPageModalTaskLabel, children: "Folder path" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: NotebookDashboard_default.driveFolderRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: NotebookDashboard_default.driveFolderIcon, children: "\u{1F4C1}" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            className: NotebookDashboard_default.driveFolderInput,
            value: folderPath,
            onChange: (e) => setFolderPath(e.target.value),
            placeholder: "My Drive",
            onKeyDown: (e) => {
              if (e.key === "Escape") onClose();
            }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: NotebookDashboard_default.newPageModalActions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          className: NotebookDashboard_default.newPageConfirm,
          onClick: handleCreate,
          disabled: saving || !title.trim(),
          type: "button",
          children: saving ? "Creating\u2026" : "Create"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: NotebookDashboard_default.newPageCancel, onClick: onClose, type: "button", children: "Cancel" })
    ] })
  ] }) });
}

// components/notebook/NotebookDashboard.tsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
var KEEP_LIST_TITLE = "Old Google Keep Reminders";
function NotebookDashboard({ userName, userImage }) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const [pages, setPages] = (0, import_react4.useState)([]);
  const [driveFiles, setDriveFiles] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [selected, setSelected] = (0, import_react4.useState)(null);
  const [newPageOpen, setNewPageOpen] = (0, import_react4.useState)(false);
  const [newDriveFileOpen, setNewDriveFileOpen] = (0, import_react4.useState)(false);
  (0, import_react4.useEffect)(() => {
    Promise.all([
      proxyFetch("/agent/notebook/pages").then(async (r) => {
        if (!r.ok) {
          console.error("[notebook] fetch failed", r.status, await r.text());
          return { pages: [] };
        }
        return r.json();
      }).then((data) => setPages(data.pages ?? [])),
      proxyFetch("/agent/drive/files").then(async (r) => {
        if (!r.ok) return { files: [] };
        return r.json();
      }).then((data) => setDriveFiles(data.files ?? []))
    ]).catch((err) => console.error("[notebook] error", err)).finally(() => setLoading(false));
  }, []);
  const keepList = pages.find((p) => p.title === KEEP_LIST_TITLE);
  const taskLists = pages.filter((p) => p.title !== KEEP_LIST_TITLE);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: NotebookDashboard_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AppHeader, { userImage, userName, initials }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: NotebookDashboard_default.content, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: NotebookDashboard_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { className: NotebookDashboard_default.title, children: "Notebook" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: NotebookDashboard_default.subtitle, children: loading ? "Loading\u2026" : `${pages.length} ${pages.length === 1 ? "page" : "pages"}` })
      ] }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: NotebookDashboard_default.scrollRow, children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: NotebookDashboard_default.skeleton, style: { width: 220, flexShrink: 0 } }, i)) }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: NotebookDashboard_default.section, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: NotebookDashboard_default.sectionTitle, children: "Pages" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: NotebookDashboard_default.scrollRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { className: NotebookDashboard_default.newPageCard, type: "button", onClick: () => setNewPageOpen(true), children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: NotebookDashboard_default.newPageIcon, children: "+" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: NotebookDashboard_default.newPageLabel, children: "New Page" })
            ] }),
            keepList && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(NoteCard, { reminder: keepList, onClick: () => setSelected(keepList), isKeep: true }),
            taskLists.map((p) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(NoteCard, { reminder: p, onClick: () => setSelected(p) }, p.id))
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: NotebookDashboard_default.divider, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: NotebookDashboard_default.dividerLine }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: NotebookDashboard_default.dividerLabel, children: "Google Drive" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: NotebookDashboard_default.dividerLine })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: NotebookDashboard_default.section, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: NotebookDashboard_default.scrollRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { className: NotebookDashboard_default.newDriveFileCard, type: "button", onClick: () => setNewDriveFileOpen(true), children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: NotebookDashboard_default.newPageIcon, children: "+" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: NotebookDashboard_default.newPageLabel, children: "New File" })
          ] }),
          driveFiles.map((f) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DriveFileCard, { file: f }, f.id))
        ] }) })
      ] })
    ] }),
    newPageOpen && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      NewPageModal,
      {
        onClose: () => setNewPageOpen(false),
        onCreated: (page) => setPages((prev) => [...prev, page])
      }
    ),
    newDriveFileOpen && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      NewDriveFileModal,
      {
        onClose: () => setNewDriveFileOpen(false),
        onCreated: (file) => setDriveFiles((prev) => [...prev, file])
      }
    ),
    selected && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(NoteModal, { reminder: selected, onClose: () => setSelected(null) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/notebook.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime7.jsx)(NotebookDashboard, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
