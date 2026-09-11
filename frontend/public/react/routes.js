import {
  Card_default
} from "./chunk-FKLB4VL5.js";
import {
  Input_default
} from "./chunk-VZUAWI7R.js";
import {
  PageShell
} from "./chunk-PIVCWVBE.js";
import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  FloatingAssistant
} from "./chunk-AIOOHO65.js";
import {
  AppHeader,
  useAgentIdentity
} from "./chunk-2MTXSAZN.js";
import "./chunk-OHWNV7E6.js";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleQuestionMark,
  Clock3,
  Compass,
  Droplets,
  ExternalLink,
  HeartPulse,
  ListChecks,
  MapPin,
  Mountain,
  Plane,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sun,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-D4E7FHL5.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/routes.tsx
var import_client = __toESM(require_client());

// components/routes/RoutesPage.tsx
var import_react = __toESM(require_react());

// components/ui/button.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      ...rest,
      disabled: disabled || loading,
      className: [Button_default.btn, Button_default[resolvedVariant], Button_default[resolvedSize], className].filter(Boolean).join(" "),
      children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Button_default.spinner }) : children
    }
  );
}

// components/ui/Badge.module.css
var Badge_default = {
  badge: "Badge_badge",
  accent: "Badge_accent",
  muted: "Badge_muted",
  success: "Badge_success",
  warning: "Badge_warning",
  danger: "Badge_danger"
};

// components/ui/badge.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
function resolveVariant2(v) {
  if (v === "default") return "accent";
  if (v === "secondary" || v === "outline" || v === "ghost" || v === "link") return "muted";
  if (v === "destructive") return "danger";
  if (v === "accent" || v === "muted" || v === "success" || v === "warning" || v === "danger") return v;
  return "accent";
}
function Badge({ className, variant = "accent", children, ...props }) {
  const resolved = resolveVariant2(variant);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "span",
    {
      className: [Badge_default.badge, Badge_default[resolved], className].filter(Boolean).join(" "),
      ...props,
      children
    }
  );
}

// components/ui/card.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function Card({ accent, delay, className, style, children, size: _size, ...rest }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "div",
    {
      ...rest,
      className: [Card_default.card, accent ? Card_default.accent : "", className].filter(Boolean).join(" "),
      style: { animationDelay: delay ? `${delay}ms` : void 0, ...style },
      children
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: [Card_default.cardHeader, className].filter(Boolean).join(" "), ...props });
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: [Card_default.cardTitle, className].filter(Boolean).join(" "), ...props });
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: [Card_default.cardDescription, className].filter(Boolean).join(" "), ...props });
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: [Card_default.cardContent, className].filter(Boolean).join(" "), ...props });
}

// components/ui/input.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
function Input({ className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "input",
    {
      className: [Input_default.input, className].filter(Boolean).join(" "),
      ...props
    }
  );
}

// components/routes/RoutesPage.module.css
var RoutesPage_default = {
  pageStack: "RoutesPage_pageStack",
  intro: "RoutesPage_intro",
  eyebrow: "RoutesPage_eyebrow",
  workspaceHeader: "RoutesPage_workspaceHeader",
  introCopy: "RoutesPage_introCopy",
  introIcon: "RoutesPage_introIcon",
  travelGateCard: "RoutesPage_travelGateCard",
  travelGateContent: "RoutesPage_travelGateContent",
  travelGateCopy: "RoutesPage_travelGateCopy",
  travelGateTitle: "RoutesPage_travelGateTitle",
  travelGateDescription: "RoutesPage_travelGateDescription",
  travelGateMeta: "RoutesPage_travelGateMeta",
  travelGateActions: "RoutesPage_travelGateActions",
  travelGateWaiting: "RoutesPage_travelGateWaiting",
  travelGateActionLabel: "RoutesPage_travelGateActionLabel",
  travelGateProgress: "RoutesPage_travelGateProgress",
  travelGateProgressFill: "RoutesPage_travelGateProgressFill",
  entryGrid: "RoutesPage_entryGrid",
  startCard: "RoutesPage_startCard",
  upcomingCard: "RoutesPage_upcomingCard",
  signalCard: "RoutesPage_signalCard",
  itineraryCard: "RoutesPage_itineraryCard",
  prepCard: "RoutesPage_prepCard",
  sourceCard: "RoutesPage_sourceCard",
  primaryStart: "RoutesPage_primaryStart",
  sectionHeader: "RoutesPage_sectionHeader",
  sectionDescription: "RoutesPage_sectionDescription",
  sideStack: "RoutesPage_sideStack",
  workspaceRail: "RoutesPage_workspaceRail",
  planForm: "RoutesPage_planForm",
  formSection: "RoutesPage_formSection",
  formLabel: "RoutesPage_formLabel",
  inputWithIcon: "RoutesPage_inputWithIcon",
  formRow: "RoutesPage_formRow",
  select: "RoutesPage_select",
  activityGrid: "RoutesPage_activityGrid",
  activityChip: "RoutesPage_activityChip",
  activityChipActive: "RoutesPage_activityChipActive",
  formFooter: "RoutesPage_formFooter",
  formHint: "RoutesPage_formHint",
  upcomingContent: "RoutesPage_upcomingContent",
  libraryCard: "RoutesPage_libraryCard",
  libraryContent: "RoutesPage_libraryContent",
  syncMessage: "RoutesPage_syncMessage",
  tripGroups: "RoutesPage_tripGroups",
  tripGroup: "RoutesPage_tripGroup",
  tripGroupHeading: "RoutesPage_tripGroupHeading",
  tripCard: "RoutesPage_tripCard",
  tripCardContent: "RoutesPage_tripCardContent",
  cardActionRow: "RoutesPage_cardActionRow",
  emptyGroup: "RoutesPage_emptyGroup",
  detectedCard: "RoutesPage_detectedCard",
  detectedContent: "RoutesPage_detectedContent",
  detectedTopline: "RoutesPage_detectedTopline",
  sourceMark: "RoutesPage_sourceMark",
  workspaceMeta: "RoutesPage_workspaceMeta",
  dayMeta: "RoutesPage_dayMeta",
  sourceStatus: "RoutesPage_sourceStatus",
  sourceLink: "RoutesPage_sourceLink",
  detectedTitle: "RoutesPage_detectedTitle",
  detectedDates: "RoutesPage_detectedDates",
  detectedDetail: "RoutesPage_detectedDetail",
  emptyTrips: "RoutesPage_emptyTrips",
  emptyIcon: "RoutesPage_emptyIcon",
  signalIcon: "RoutesPage_signalIcon",
  mutedIcon: "RoutesPage_mutedIcon",
  signalList: "RoutesPage_signalList",
  signalRow: "RoutesPage_signalRow",
  backButton: "RoutesPage_backButton",
  researchNotice: "RoutesPage_researchNotice",
  sectionHeading: "RoutesPage_sectionHeading",
  priorityGrid: "RoutesPage_priorityGrid",
  priorityAction: "RoutesPage_priorityAction",
  priorityIcon: "RoutesPage_priorityIcon",
  coralTone: "RoutesPage_coralTone",
  goldTone: "RoutesPage_goldTone",
  blueTone: "RoutesPage_blueTone",
  workspaceGrid: "RoutesPage_workspaceGrid",
  timeline: "RoutesPage_timeline",
  dayRow: "RoutesPage_dayRow",
  dayRail: "RoutesPage_dayRail",
  dayBody: "RoutesPage_dayBody",
  dayHeading: "RoutesPage_dayHeading",
  dayDate: "RoutesPage_dayDate",
  dayIcon: "RoutesPage_dayIcon",
  prepContent: "RoutesPage_prepContent",
  checklist: "RoutesPage_checklist",
  sourceContent: "RoutesPage_sourceContent",
  sourceCardTitle: "RoutesPage_sourceCardTitle",
  statusDot: "RoutesPage_statusDot",
  spin: "RoutesPage_spin"
};

// components/routes/TravelPlanningGateCard.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
function TravelPlanningGateCard({ agentName, status, statusLoading, hasLibrary, building, onBuild }) {
  const running = status?.state === "queued" || status?.state === "running";
  const ready = status?.state === "completed";
  const progress = Math.max(0, Math.min(100, status?.progress ?? 0));
  const title = running ? `Waiting for ${agentName} to finish studying you\u2026` : statusLoading ? "Checking Study Me before travel planning starts" : ready ? hasLibrary ? "Your trip library is ready" : "Build your trip library" : "Study Me needs to finish first";
  const copy = running ? "Once the historical index is complete, I\u2019ll organize your past, current, and future trips from that shared context." : statusLoading ? "Checking whether your indexed history is ready." : ready ? hasLibrary ? "Your saved trips are ready to review and prepare." : "Use the completed Study Me index as the starting point for a separate, read-only trip library." : "The trip library is gated until Study Me has finished building your indexed history.";
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Card, { className: RoutesPage_default.travelGateCard, "aria-live": "polite", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(CardContent, { className: RoutesPage_default.travelGateContent, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: RoutesPage_default.travelGateCopy, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: RoutesPage_default.eyebrow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
        " ",
        agentName,
        " travel planning"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: RoutesPage_default.travelGateTitle, children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: RoutesPage_default.travelGateDescription, children: copy }),
      running && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: RoutesPage_default.travelGateMeta, children: [
        status?.progress == null ? "Studying your history\u2026" : `${progress}% complete`,
        " \xB7 Trip planning is waiting"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: RoutesPage_default.travelGateActions, children: running || statusLoading ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: RoutesPage_default.travelGateWaiting, children: [
      running && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: RoutesPage_default.travelGateProgress, "aria-label": "Trip planning is waiting for Study Me", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: RoutesPage_default.travelGateProgressFill, style: { width: `${progress}%` } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: RoutesPage_default.travelGateActionLabel, children: running ? "Waiting for Study Me" : "Checking Study Me\u2026" })
    ] }) : ready ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Button, { type: "button", size: "lg", onClick: onBuild, disabled: building, children: building ? "Building\u2026" : hasLibrary ? "Refresh trip library" : "Build trip library" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: RoutesPage_default.travelGateActionLabel, children: "Waiting for Study Me" }) })
  ] }) });
}

// components/routes/RoutesPage.tsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
var emptyCollection = { trips: [], groups: { past: [], current: [], upcoming: [] }, pipeline: { state: "not_run" } };
var activities = [
  { value: "city", label: "City time" },
  { value: "hiking", label: "Hiking" },
  { value: "road trip", label: "Road trip" },
  { value: "camping", label: "Camping" },
  { value: "cycling", label: "Cycling" },
  { value: "water", label: "Water activity" }
];
var starterSignals = [
  { icon: Sun, label: "Weather & UV", detail: "Forecast windows and sun exposure by day" },
  { icon: Mountain, label: "Altitude", detail: "Sleeping elevation and acclimatization prompts" },
  { icon: HeartPulse, label: "Health & entry", detail: "Vaccination, disease, and document guidance" },
  { icon: Droplets, label: "Water & conditions", detail: "Water availability, fire, and air quality" }
];
function formatDate(value) {
  if (!value) return "Dates to be decided";
  const parsed = /* @__PURE__ */ new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
}
function formatRange(start, end) {
  if (!start && !end) return "Flexible dates";
  if (!end || start === end) return formatDate(start);
  return `${formatDate(start)} \u2013 ${formatDate(end)}`;
}
function initialsFor(name) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}
function TripCard({ trip, onOpen }) {
  const confidenceVariant = trip.confidence === "confirmed" ? "success" : trip.confidence === "likely" ? "warning" : "muted";
  const sourceUrl = trip.sources?.find((source) => source.url)?.url;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Card, { className: RoutesPage_default.tripCard, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardContent, { className: RoutesPage_default.tripCardContent, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.detectedTopline, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: RoutesPage_default.sourceMark, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CalendarDays, { size: 14 }),
        " ",
        trip.evidence || (trip.kind === "scratch" ? "Saved plan" : "Indexed history")
      ] }),
      trip.confidence && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Badge, { variant: confidenceVariant, children: trip.confidence })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: RoutesPage_default.detectedTitle, children: trip.destination }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.detectedDates, children: formatRange(trip.startDate, trip.endDate) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.cardActionRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Button, { size: "sm", onClick: () => onOpen(trip), children: [
        trip.phase === "past" ? "Review trip" : "Open plan",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ArrowRight, { size: 14 })
      ] }),
      sourceUrl && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("a", { className: RoutesPage_default.sourceLink, href: sourceUrl, target: "_blank", rel: "noopener noreferrer", children: [
        "Source ",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ExternalLink, { size: 12 })
      ] })
    ] })
  ] }) });
}
function TripGroup({ phase, trips, onOpen }) {
  const labels = { past: "Past", current: "Current", upcoming: "Upcoming" };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.tripGroup, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.tripGroupHeading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: labels[phase] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: trips.length })
    ] }),
    trips.length > 0 ? trips.map((trip) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TripCard, { trip, onOpen }, trip.id)) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.emptyGroup, children: "No saved trips here yet." })
  ] });
}
function ActivityPicker({ selected, onChange }) {
  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.activityGrid, role: "group", "aria-label": "Activities", children: activities.map(({ value, label }) => {
    const active = selected.includes(value);
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { className: `${RoutesPage_default.activityChip} ${active ? RoutesPage_default.activityChipActive : ""}`, type: "button", "aria-pressed": active, onClick: () => toggle(value), children: [
      active ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Check, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Plus, { size: 14 }),
      label
    ] }, value);
  }) });
}
function PlanForm({ onSubmit }) {
  const [destination, setDestination] = (0, import_react.useState)("");
  const [startDate, setStartDate] = (0, import_react.useState)("");
  const [endDate, setEndDate] = (0, import_react.useState)("");
  const [selected, setSelected] = (0, import_react.useState)([]);
  const [pace, setPace] = (0, import_react.useState)("Balanced");
  function submit(event) {
    event.preventDefault();
    if (destination.trim()) onSubmit({ destination: destination.trim(), startDate, endDate, activities: selected, pace, kind: "scratch" });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("form", { className: RoutesPage_default.planForm, onSubmit: submit, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.formSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: RoutesPage_default.formLabel, htmlFor: "trip-destination", children: "Where are you going?" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.inputWithIcon, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(MapPin, { size: 17, "aria-hidden": "true" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Input, { id: "trip-destination", value: destination, onChange: (event) => setDestination(event.target.value), placeholder: "e.g. Cusco, Peru", autoComplete: "off" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.formRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.formSection, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: RoutesPage_default.formLabel, htmlFor: "trip-start", children: "Start date" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Input, { id: "trip-start", type: "date", value: startDate, onChange: (event) => setStartDate(event.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.formSection, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: RoutesPage_default.formLabel, htmlFor: "trip-end", children: "End date" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Input, { id: "trip-end", type: "date", value: endDate, min: startDate || void 0, onChange: (event) => setEndDate(event.target.value) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.formSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.formLabel, children: "What are you doing?" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ActivityPicker, { selected, onChange: setSelected })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.formSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: RoutesPage_default.formLabel, htmlFor: "trip-pace", children: "Trip pace" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("select", { id: "trip-pace", className: RoutesPage_default.select, value: pace, onChange: (event) => setPace(event.target.value), children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { children: "Easy" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { children: "Balanced" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { children: "Full days" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.formFooter, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: RoutesPage_default.formHint, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CircleQuestionMark, { size: 14 }),
        " Passport and health context can be added later for this plan only."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Button, { type: "submit", size: "lg", disabled: !destination.trim(), children: [
        "Build my plan ",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ArrowRight, { size: 17 })
      ] })
    ] })
  ] });
}
function TripLibrary({ collection, loading, syncing, syncMessage, onSync, onOpen, syncAllowed }) {
  const count = collection.trips.length;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { className: RoutesPage_default.libraryCard, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardHeader, { className: RoutesPage_default.sectionHeader, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Saved trip library" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "Past, current & upcoming" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardDescription, { className: RoutesPage_default.sectionDescription, children: "Built from your separate trip records. Nothing is booked here." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Button, { variant: "ghost", size: "sm", onClick: onSync, disabled: syncing || loading || !syncAllowed, "aria-label": "Refresh trip library from Study Me", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RefreshCw, { size: 15, className: syncing ? RoutesPage_default.spin : "" }),
        " ",
        syncing ? "Building" : "Refresh"
      ] })
    ] }),
    syncMessage && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.syncMessage, role: "status", children: syncMessage }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { className: RoutesPage_default.libraryContent, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.libraryLoading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.loadingBar }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.loadingBarShort })
    ] }) : count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.tripGroups, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TripGroup, { phase: "past", trips: collection.groups.past, onOpen }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TripGroup, { phase: "current", trips: collection.groups.current, onOpen }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TripGroup, { phase: "upcoming", trips: collection.groups.upcoming, onOpen })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.emptyTrips, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.emptyIcon, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CalendarDays, { size: 22 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "No saved trips yet" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: collection.pipeline?.state === "not_run" ? "After Study Me completes, refresh this library to organize trip context from the shared index." : "Build a plan from scratch or refresh the completed Study Me index." })
      ] })
    ] }) })
  ] });
}
function Overview({ agentName, studyMeStatus, studyMeStatusLoading, collection, loading, syncing, syncMessage, onSync, onOpen, onCreatePlan }) {
  const studyMeReady = studyMeStatus?.state === "completed";
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.pageStack, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: RoutesPage_default.intro, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Trip readiness" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { children: "Know what to prepare before you go." }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.introCopy, children: "Turn a destination or your indexed history into a practical plan with current conditions, route context, and preparation prompts." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.introIcon, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Compass, { size: 30 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TravelPlanningGateCard, { agentName, status: studyMeStatus, statusLoading: studyMeStatusLoading, hasLibrary: collection.trips.length > 0, building: syncing, onBuild: onSync }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.entryGrid, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { className: `${RoutesPage_default.startCard} ${RoutesPage_default.primaryStart}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardHeader, { className: RoutesPage_default.sectionHeader, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Start from scratch" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "Plan another trip" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardDescription, { className: RoutesPage_default.sectionDescription, children: "Give us the shape of the trip. We\u2019ll help you fill in the preparation details." })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PlanForm, { onSubmit: onCreatePlan }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.sideStack, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TripLibrary, { collection, loading, syncing, syncMessage, onSync, onOpen, syncAllowed: studyMeReady }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { className: RoutesPage_default.signalCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardHeader, { className: RoutesPage_default.sectionHeader, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "What we\u2019ll look at" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "Preparation, not reservations" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ShieldAlert, { size: 19, className: RoutesPage_default.mutedIcon })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { className: RoutesPage_default.signalList, children: starterSignals.map(({ icon: Icon, label, detail }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.signalRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.signalIcon, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { size: 16 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: label }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: detail })
            ] })
          ] }, label)) })
        ] })
      ] })
    ] })
  ] });
}
function PriorityAction({ icon: Icon, tone, title, detail }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `${RoutesPage_default.priorityAction} ${RoutesPage_default[tone]}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.priorityIcon, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { size: 17 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: detail })
    ] })
  ] });
}
function ItineraryDay({ day, date, title, detail, icon: Icon }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.dayRow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.dayRail, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: day }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("i", {})
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.dayBody, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.dayHeading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.dayDate, children: date }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: title })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { size: 18, className: RoutesPage_default.dayIcon })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: detail }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.dayMeta, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Clock3, { size: 14 }),
          " Flexible timing"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(MapPin, { size: 14 }),
          " Route details after research"
        ] })
      ] })
    ] })
  ] });
}
function Workspace({ draft, saved, onBack }) {
  const activityLabel = draft.activities.length > 0 ? draft.activities.join(", ") : "a flexible mix of activities";
  const firstDate = formatDate(draft.startDate);
  const lastDate = formatDate(draft.endDate || draft.startDate);
  const dayTwoIcon = draft.activities.includes("hiking") ? Mountain : draft.activities.includes("water") ? Droplets : Compass;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.pageStack, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { className: RoutesPage_default.backButton, type: "button", onClick: onBack, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ChevronLeft, { size: 16 }),
      " All trips"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: RoutesPage_default.workspaceHeader, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: saved ? "Saved plan" : "Planning draft" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { children: draft.destination }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.workspaceMeta, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CalendarDays, { size: 15 }),
            " ",
            draft.startDate || draft.endDate ? `${firstDate} \u2013 ${lastDate}` : "Dates to be decided"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Compass, { size: 15 }),
            " ",
            activityLabel
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Badge, { variant: "muted", children: [
            draft.pace,
            " pace"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Button, { variant: "secondary", onClick: onBack, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Plus, { size: 16 }),
        " New plan"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.researchNotice, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Sparkles, { size: 18 }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "Research stays source-linked." }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "Current weather, health, hazard, and route signals will be checked before you rely on this plan." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Button, { variant: "ghost", size: "sm", disabled: true, children: "Research current conditions" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: RoutesPage_default.prioritySection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.sectionHeading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Before you go" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: "Start with the important parts" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Badge, { variant: "warning", children: "Draft" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.priorityGrid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PriorityAction, { icon: Mountain, tone: "coralTone", title: "Confirm elevation", detail: "Sleeping altitude will determine acclimatization guidance." }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PriorityAction, { icon: Sun, tone: "goldTone", title: "Check the exposure", detail: "Weather and UV windows should shape each outdoor day." }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PriorityAction, { icon: ListChecks, tone: "blueTone", title: "Build the gear list", detail: `Starting from ${draft.pace.toLowerCase()} days and ${activityLabel}.` })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.workspaceGrid, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { className: RoutesPage_default.itineraryCard, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardHeader, { className: RoutesPage_default.sectionHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Outline" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "A flexible itinerary" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardDescription, { className: RoutesPage_default.sectionDescription, children: "Shape first, then add verified places and route legs." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Badge, { variant: "muted", children: "3 days" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardContent, { className: RoutesPage_default.timeline, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ItineraryDay, { day: "01", date: firstDate, title: "Arrive & get oriented", detail: `Settle in around ${draft.destination}. Keep the first block light while you confirm local conditions and logistics.`, icon: Plane }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ItineraryDay, { day: "02", date: draft.startDate ? "Next day" : "Day 2", title: "Make space for the main activity", detail: `A good day for ${activityLabel}. The planner will attach conditions, route details, and what to bring.`, icon: dayTwoIcon }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ItineraryDay, { day: "03", date: lastDate, title: "Buffer & head home", detail: "Keep a flexible buffer for weather, closures, recovery, or a slower route back.", icon: Clock3 })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("aside", { className: RoutesPage_default.workspaceRail, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { className: RoutesPage_default.prepCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardHeader, { className: RoutesPage_default.sectionHeader, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Preparation list" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "Things to verify" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ListChecks, { size: 19, className: RoutesPage_default.mutedIcon })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { className: RoutesPage_default.prepContent, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.checklist, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { type: "checkbox" }),
              " Confirm destination and dates"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { type: "checkbox" }),
              " Check entry or vaccination requirements"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { type: "checkbox" }),
              " Pack for weather, UV, and terrain"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { type: "checkbox" }),
              " Save an offline route and emergency contact"
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Card, { className: RoutesPage_default.sourceCard, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardContent, { className: RoutesPage_default.sourceContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.sourceCardTitle, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Sparkles, { size: 16 }),
            " Grounded research"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "Nova will show the sources behind current conditions and preparation advice." }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: RoutesPage_default.sourceStatus, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.statusDot }),
            " Sources will appear here"
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
function RoutesPage({ userName, userImage }) {
  const { name: agentName } = useAgentIdentity();
  const [view, setView] = (0, import_react.useState)("overview");
  const [draft, setDraft] = (0, import_react.useState)(null);
  const [saved, setSaved] = (0, import_react.useState)(false);
  const [collection, setCollection] = (0, import_react.useState)(emptyCollection);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [syncing, setSyncing] = (0, import_react.useState)(false);
  const [syncMessage, setSyncMessage] = (0, import_react.useState)(null);
  const [studyMeStatus, setStudyMeStatus] = (0, import_react.useState)(null);
  const [studyMeStatusLoading, setStudyMeStatusLoading] = (0, import_react.useState)(true);
  const initials = (0, import_react.useMemo)(() => initialsFor(userName), [userName]);
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    let timer = null;
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
        if (next.state === "queued" || next.state === "running") {
          timer = window.setTimeout(() => {
            void loadStudyMeStatus();
          }, 1e3);
        }
      } catch {
        if (!cancelled) setStudyMeStatus(null);
      } finally {
        if (!cancelled) setStudyMeStatusLoading(false);
      }
    };
    void loadStudyMeStatus();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);
  async function loadTrips() {
    setLoading(true);
    try {
      const response = await proxyFetch("/agent/trips");
      if (response.ok) setCollection(await response.json());
    } catch {
    } finally {
      setLoading(false);
    }
  }
  (0, import_react.useEffect)(() => {
    void loadTrips();
  }, []);
  async function syncTrips() {
    setSyncing(true);
    try {
      const response = await proxyFetch("/agent/trips/sync", { method: "POST" });
      if (response.ok) {
        setCollection(await response.json());
        setSyncMessage(null);
      } else {
        const payload = await response.json().catch(() => null);
        setSyncMessage(payload?.detail || "Complete Study Me before refreshing the trip library.");
        await loadTrips();
      }
    } catch {
      setSyncMessage("The trip library could not be reached. Try again when you\u2019re ready.");
      await loadTrips();
    } finally {
      setSyncing(false);
    }
  }
  async function submitDraft(next) {
    setDraft(next);
    setSaved(false);
    setView("plan");
    try {
      const response = await proxyFetch("/agent/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "scratch", destination: next.destination, startDate: next.startDate || null, endDate: next.endDate || null, activities: next.activities, pace: next.pace }) });
      if (response.ok) {
        setSaved(true);
        await loadTrips();
      }
    } catch {
    }
  }
  function openTrip(trip) {
    const knownActivities = activities.map(({ value }) => value).filter((value) => trip.activities?.includes(value));
    setDraft({ id: trip.id, kind: trip.kind, destination: trip.destination, startDate: trip.startDate || "", endDate: trip.endDate || "", activities: knownActivities, pace: trip.pace || "Balanced" });
    setSaved(true);
    setView("plan");
  }
  const overviewProps = { agentName, studyMeStatus, studyMeStatusLoading, collection, loading, syncing, syncMessage, onSync: () => void syncTrips(), onOpen: openTrip, onCreatePlan: (next) => void submitDraft(next) };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AppHeader, { userImage, userName, initials, pageTitle: "Trips" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PageShell, { children: view === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Overview, { ...overviewProps }) : draft ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Workspace, { draft, saved, onBack: () => setView("overview") }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Overview, { ...overviewProps }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/routes.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RoutesPage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
