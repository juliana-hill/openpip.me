import {
  ChevronDown,
  __toESM,
  require_jsx_runtime,
  require_react
} from "./chunk-7G5O7DHP.js";

// components/calendar/CalendarList.tsx
var import_react = __toESM(require_react());

// components/calendar/CalendarEvents.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function formatEventTime(isoString) {
  if (!isoString) return "";
  if (!isoString.includes("T")) {
    const date2 = /* @__PURE__ */ new Date(isoString + "T00:00:00");
    return date2.toLocaleDateString(void 0, { month: "short", day: "numeric" });
  }
  const date = new Date(isoString);
  return date.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
function CalendarEvents({ events, color }) {
  if (events.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", paddingLeft: 20, paddingTop: 4, paddingBottom: 4 }, children: "No events in the next 7 days" });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { style: { display: "flex", flexDirection: "column", gap: 6, paddingLeft: 20, paddingRight: 8, margin: 0, listStyle: "none" }, children: events.map((event, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "li",
    {
      style: {
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        borderLeftWidth: 3,
        borderLeftColor: color,
        padding: "8px 12px",
        background: "var(--color-surface-raised)"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0, lineHeight: 1.3 }, children: event.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "2px 0 0" }, children: formatEventTime(event.start) }),
        event.location && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: event.location })
      ]
    },
    i
  )) });
}

// components/calendar/CalendarList.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
function CalendarList({ calendars }) {
  if (calendars.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", padding: "0 16px" }, children: "No calendars found." });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: calendars.map((cal) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CalendarItem, { cal }, cal.id)) });
}
function CalendarItem({ cal }) {
  const [open, setOpen] = (0, import_react.useState)(cal.primary);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          transition: "background 150ms ease",
          fontFamily: "var(--font-sans)"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "var(--color-accent-light)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "transparent";
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: cal.color } }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { flex: 1, fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--color-text)", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: cal.name }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }, children: cal.events.length }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronDown, { size: 14, style: { color: "var(--color-text-muted)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease" } })
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { paddingBottom: 8, paddingTop: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CalendarEvents, { events: cal.events, color: cal.color }) })
  ] });
}

export {
  CalendarList
};
