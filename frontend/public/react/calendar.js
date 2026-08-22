import {
  ModalOverlay_default
} from "./chunk-H5AG5GHM.js";
import {
  CalendarList
} from "./chunk-2EQ7WS3J.js";
import {
  Skeleton_default
} from "./chunk-WNLM7UWS.js";
import {
  PageShell
} from "./chunk-DFELCCCF.js";
import {
  AppHeader,
  FloatingAssistant
} from "./chunk-B6E4MHQS.js";
import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  __toESM,
  proxyFetch,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-7G5O7DHP.js";

// react-entries/calendar.tsx
var import_client = __toESM(require_client());

// components/calendar/CalendarPage.tsx
var import_react2 = __toESM(require_react());

// components/calendar/CalendarGrid.tsx
var import_react = __toESM(require_react());

// components/calendar/CalendarDayModal.module.css
var CalendarDayModal_default = {
  modal: "CalendarDayModal_modal",
  slideUp: "CalendarDayModal_slideUp",
  header: "CalendarDayModal_header",
  title: "CalendarDayModal_title",
  closeBtn: "CalendarDayModal_closeBtn",
  body: "CalendarDayModal_body",
  eventCard: "CalendarDayModal_eventCard",
  eventTitle: "CalendarDayModal_eventTitle",
  eventTime: "CalendarDayModal_eventTime",
  eventCal: "CalendarDayModal_eventCal",
  empty: "CalendarDayModal_empty",
  fadeIn: "CalendarDayModal_fadeIn"
};

// components/calendar/CalendarDayModal.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function formatTime(iso) {
  if (!iso.includes("T")) return "All day";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function formatTimeRange(start, end) {
  if (!start.includes("T")) return "All day";
  const s = formatTime(start);
  const e = formatTime(end);
  return `${s} \u2013 ${e}`;
}
function CalendarDayModal({ date, events, onClose }) {
  const label = date.toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" });
  const sorted = [...events].sort((a, b) => {
    if (!a.start.includes("T")) return -1;
    if (!b.start.includes("T")) return 1;
    return a.start.localeCompare(b.start);
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: ModalOverlay_default.overlay, onClick: (e) => {
    if (e.target === e.currentTarget) onClose();
  }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: CalendarDayModal_default.modal, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: CalendarDayModal_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: CalendarDayModal_default.title, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: CalendarDayModal_default.closeBtn, onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: CalendarDayModal_default.body, children: sorted.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: CalendarDayModal_default.empty, children: "No events this day." }) : sorted.map((ev, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: CalendarDayModal_default.eventCard, style: { borderLeftColor: ev.color }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: CalendarDayModal_default.eventTitle, children: ev.title }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: CalendarDayModal_default.eventTime, children: formatTimeRange(ev.start, ev.end) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: CalendarDayModal_default.eventCal, children: ev.calendarName })
    ] }, i)) })
  ] }) });
}

// components/calendar/CalendarGrid.module.css
var CalendarGrid_default = {
  card: "CalendarGrid_card",
  monthNav: "CalendarGrid_monthNav",
  monthLabel: "CalendarGrid_monthLabel",
  navBtn: "CalendarGrid_navBtn",
  weekdays: "CalendarGrid_weekdays",
  weekday: "CalendarGrid_weekday",
  grid: "CalendarGrid_grid",
  cell: "CalendarGrid_cell",
  cellClickable: "CalendarGrid_cellClickable",
  cellEmpty: "CalendarGrid_cellEmpty",
  cellPast: "CalendarGrid_cellPast",
  dayNum: "CalendarGrid_dayNum",
  today: "CalendarGrid_today",
  dots: "CalendarGrid_dots",
  dot: "CalendarGrid_dot"
};

// components/calendar/CalendarGrid.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
function toLocalDateStr(iso) {
  if (!iso.includes("T")) return iso.slice(0, 10);
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year, month) {
  return new Date(year, month, 1).getDay();
}
var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function CalendarGrid({ calendars, year, month, loading, onMonthChange }) {
  const now = /* @__PURE__ */ new Date();
  const [selectedDay, setSelectedDay] = (0, import_react.useState)(null);
  const todayStr = (() => {
    const p2 = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  })();
  const eventsByDay = /* @__PURE__ */ new Map();
  for (const cal of calendars) {
    for (const ev of cal.events) {
      const dateStr = toLocalDateStr(ev.start);
      if (!eventsByDay.has(dateStr)) eventsByDay.set(dateStr, []);
      eventsByDay.get(dateStr).push({ title: ev.title, start: ev.start, end: ev.end, calendarName: cal.name, color: cal.color });
    }
  }
  const totalDays = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const goMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    onMonthChange(y, m);
  };
  const p = (n) => String(n).padStart(2, "0");
  const selectedDayEvents = selectedDay ? eventsByDay.get(`${selectedDay.getFullYear()}-${p(selectedDay.getMonth() + 1)}-${p(selectedDay.getDate())}`) ?? [] : [];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: CalendarGrid_default.card, style: { position: "relative" }, children: [
    loading && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { position: "absolute", inset: 0, background: "var(--color-surface)", opacity: 0.6, borderRadius: "inherit", zIndex: 1 } }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: CalendarGrid_default.monthNav, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: CalendarGrid_default.navBtn, onClick: () => goMonth(-1), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronLeft, { size: 16 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: CalendarGrid_default.monthLabel, children: [
        MONTH_NAMES[month],
        " ",
        year
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: CalendarGrid_default.navBtn, onClick: () => goMonth(1), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronRight, { size: 16 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: CalendarGrid_default.weekdays, children: WEEKDAYS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: CalendarGrid_default.weekday, children: d }, d)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: CalendarGrid_default.grid, children: cells.map((day, i) => {
      if (day === null) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `${CalendarGrid_default.cell} ${CalendarGrid_default.cellEmpty}` }, i);
      const dateStr = `${year}-${p(month + 1)}-${p(day)}`;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const dayEvents = eventsByDay.get(dateStr) ?? [];
      const hasEvents = dayEvents.length > 0;
      const calColors = [...new Map(dayEvents.map((e) => [e.color, e.color])).values()].slice(0, 4);
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "div",
        {
          className: [
            CalendarGrid_default.cell,
            isPast ? CalendarGrid_default.cellPast : "",
            isToday ? CalendarGrid_default.today : "",
            hasEvents && !isPast ? CalendarGrid_default.cellClickable : ""
          ].join(" "),
          onClick: () => {
            if (hasEvents || isToday) setSelectedDay(new Date(year, month, day));
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: CalendarGrid_default.dayNum, children: day }),
            calColors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: CalendarGrid_default.dots, children: calColors.map((color, ci) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: CalendarGrid_default.dot, style: { background: color } }, ci)) })
          ]
        },
        i
      );
    }) }),
    selectedDay && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      CalendarDayModal,
      {
        date: selectedDay,
        events: selectedDayEvents,
        onClose: () => setSelectedDay(null)
      }
    )
  ] });
}

// components/calendar/CalendarPage.module.css
var CalendarPage_default = {
  layout: "CalendarPage_layout",
  aside: "CalendarPage_aside",
  asideHeader: "CalendarPage_asideHeader",
  asideLabel: "CalendarPage_asideLabel",
  gridSkeleton: "CalendarPage_gridSkeleton",
  gridSkeletonCells: "CalendarPage_gridSkeletonCells",
  gridSkeletonCell: "CalendarPage_gridSkeletonCell",
  asideSkelList: "CalendarPage_asideSkelList",
  asideSkelItem: "CalendarPage_asideSkelItem"
};

// components/calendar/CalendarPage.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
var DAY_OPTIONS = [7, 14, 30];
function monthRange(year, month) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 2, 0);
  const days = Math.ceil((to.getTime() - from.getTime()) / 864e5) + 1;
  const pad = (n) => String(n).padStart(2, "0");
  return { from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-01`, days };
}
function CalendarPage({ userName, userImage }) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const now = /* @__PURE__ */ new Date();
  const [gridYear, setGridYear] = (0, import_react2.useState)(now.getFullYear());
  const [gridMonth, setGridMonth] = (0, import_react2.useState)(now.getMonth());
  const [gridState, setGridState] = (0, import_react2.useState)("loading");
  const [gridCalendars, setGridCalendars] = (0, import_react2.useState)([]);
  const [asideDays, setAsideDays] = (0, import_react2.useState)(7);
  const [asideState, setAsideState] = (0, import_react2.useState)("loading");
  const [asideCalendars, setAsideCalendars] = (0, import_react2.useState)([]);
  const [asideError, setAsideError] = (0, import_react2.useState)("");
  const fetchForMonth = (0, import_react2.useCallback)(async (year, month) => {
    setGridYear(year);
    setGridMonth(month);
    setGridState("loading");
    const { from, days } = monthRange(year, month);
    try {
      const res = await proxyFetch(`/agent/calendars?from=${from}&days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGridCalendars(data.calendars);
      setGridState("populated");
    } catch {
      setGridState("error");
    }
  }, []);
  const fetchAside = (0, import_react2.useCallback)(async (days) => {
    setAsideState("loading");
    setAsideError("");
    try {
      const res = await proxyFetch(`/agent/calendars?days=${days}`);
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        throw new Error(data2.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setAsideCalendars(data.calendars);
      setAsideState("populated");
    } catch (err) {
      setAsideError(err instanceof Error ? err.message : "Unknown error");
      setAsideState("error");
    }
  }, []);
  (0, import_react2.useEffect)(() => {
    fetchForMonth(now.getFullYear(), now.getMonth());
    fetchAside(7);
  }, []);
  const handleDaysChange = (days) => {
    setAsideDays(days);
    fetchAside(days);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(AppHeader, { userImage, userName, initials, pageTitle: "My Calendars" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: CalendarPage_default.layout, children: [
      gridState === "error" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: CalendarPage_default.gridSkeleton, style: { alignItems: "center", justifyContent: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "#c02e2e", margin: 0 }, children: "Could not load calendar." }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: () => fetchForMonth(gridYear, gridMonth), children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RefreshCw, { size: 14 }),
          " Retry"
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        CalendarGrid,
        {
          calendars: gridCalendars,
          year: gridYear,
          month: gridMonth,
          loading: gridState === "loading",
          onMonthChange: fetchForMonth
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: CalendarPage_default.aside, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: CalendarPage_default.asideHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: CalendarPage_default.asideLabel, children: "Upcoming Events" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", gap: 6 }, children: DAY_OPTIONS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "button",
            {
              className: `${Button_default.btn} ${asideDays === d ? Button_default.primary : Button_default.secondary} ${Button_default.sm}`,
              onClick: () => handleDaysChange(d),
              children: [
                d,
                "d"
              ]
            },
            d
          )) })
        ] }),
        asideState === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: CalendarPage_default.asideSkelList, children: [1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: CalendarPage_default.asideSkelItem, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: Skeleton_default.skeleton, style: { width: 160, height: 14 } }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: Skeleton_default.skeleton, style: { width: 120, height: 11, marginLeft: 16 } }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: Skeleton_default.skeleton, style: { width: 90, height: 11, marginLeft: 16 } })
        ] }, i)) }) : asideState === "error" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { textAlign: "center", paddingTop: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "#c02e2e", margin: "0 0 8px" }, children: asideError || "Could not load events." }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`, onClick: () => fetchAside(asideDays), children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RefreshCw, { size: 13 }),
            " Retry"
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CalendarList, { calendars: asideCalendars })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FloatingAssistant, { onAgentAction: () => {
      fetchForMonth(gridYear, gridMonth);
      fetchAside(asideDays);
    } })
  ] });
}

// react-entries/calendar.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await fetch("/auth/me", { credentials: "include" });
  if (!r.ok) return;
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CalendarPage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
