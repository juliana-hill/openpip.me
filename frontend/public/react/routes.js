import {
  InboxHeader_default,
  InboxTab_default
} from "./chunk-GIUJGCQJ.js";
import {
  Card_default
} from "./chunk-FKLB4VL5.js";
import {
  Input_default
} from "./chunk-VZUAWI7R.js";
import {
  PageShell
} from "./chunk-SXZ55IXU.js";
import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  FloatingAssistant
} from "./chunk-FT3IJZ4L.js";
import {
  AppHeader,
  Markdown,
  remarkGfm,
  useAgentIdentity
} from "./chunk-5Y7KWAY6.js";
import "./chunk-OHWNV7E6.js";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleQuestionMark,
  Clock3,
  Compass,
  Droplets,
  ExternalLink,
  ListChecks,
  MapPin,
  Mountain,
  Plane,
  Plus,
  RefreshCw,
  Sparkles,
  Sun,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-CJP2RCVW.js";
import {
  __toESM
} from "./chunk-U67V476Y.js";

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

// components/ui/collapsible.tsx
var React = __toESM(require_react());
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
var CollapsibleContext = React.createContext({ open: false, setOpen: () => {
} });
function Collapsible({ defaultOpen = false, open: controlledOpen, onOpenChange, children, ...props }) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== void 0;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CollapsibleContext.Provider, { value: { open, setOpen }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { ...props, children }) });
}
function CollapsibleTrigger({ children, onClick, ...props }) {
  const { open, setOpen } = React.useContext(CollapsibleContext);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "button",
    {
      type: "button",
      "aria-expanded": open,
      "data-panel-open": open ? "" : void 0,
      onClick: (e) => {
        setOpen(!open);
        onClick?.(e);
      },
      ...props,
      children
    }
  );
}
function CollapsibleContent({ children, ...props }) {
  const { open } = React.useContext(CollapsibleContext);
  if (!open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { "data-panel-open": "", ...props, children });
}

// components/ui/input.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
function Input({ className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
  tripPageLoader: "RoutesPage_tripPageLoader",
  tripPageLoaderIcon: "RoutesPage_tripPageLoaderIcon",
  RoutesPage_loaderPulse: "RoutesPage_RoutesPage_loaderPulse",
  RoutesPage_spin: "RoutesPage_RoutesPage_spin",
  eyebrow: "RoutesPage_eyebrow",
  tripPageLoaderBar: "RoutesPage_tripPageLoaderBar",
  RoutesPage_loaderBar: "RoutesPage_RoutesPage_loaderBar",
  intro: "RoutesPage_intro",
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
  dayDescription: "RoutesPage_dayDescription",
  recommendationMarkdown: "RoutesPage_recommendationMarkdown",
  recommendationNote: "RoutesPage_recommendationNote",
  itineraryHeaderContent: "RoutesPage_itineraryHeaderContent",
  itinerarySummaryTrigger: "RoutesPage_itinerarySummaryTrigger",
  itineraryTitle: "RoutesPage_itineraryTitle",
  itinerarySummaryIcon: "RoutesPage_itinerarySummaryIcon",
  itinerarySummaryContent: "RoutesPage_itinerarySummaryContent",
  durationBadge: "RoutesPage_durationBadge",
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
  phaseTabs: "RoutesPage_phaseTabs",
  phaseChip: "RoutesPage_phaseChip",
  phaseChipActive: "RoutesPage_phaseChipActive",
  tripList: "RoutesPage_tripList",
  planBuildPage: "RoutesPage_planBuildPage",
  planBuildCard: "RoutesPage_planBuildCard",
  planBuildIcon: "RoutesPage_planBuildIcon",
  planBuildPulse: "RoutesPage_planBuildPulse",
  planBuildCopy: "RoutesPage_planBuildCopy",
  planBuildStage: "RoutesPage_planBuildStage",
  planBuildSteps: "RoutesPage_planBuildSteps",
  planBuildStep: "RoutesPage_planBuildStep",
  planBuildStepCurrent: "RoutesPage_planBuildStepCurrent",
  planBuildSpinner: "RoutesPage_planBuildSpinner",
  planBuildDot: "RoutesPage_planBuildDot",
  spin: "RoutesPage_spin",
  planBuildComplete: "RoutesPage_planBuildComplete",
  planBuildNote: "RoutesPage_planBuildNote",
  planBuildError: "RoutesPage_planBuildError",
  backButton: "RoutesPage_backButton",
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
  researchNotice: "RoutesPage_researchNotice",
  researchSources: "RoutesPage_researchSources",
  researchSourcesTrigger: "RoutesPage_researchSourcesTrigger",
  researchSourcesIcon: "RoutesPage_researchSourcesIcon",
  researchSourcesContent: "RoutesPage_researchSourcesContent",
  sectionHeading: "RoutesPage_sectionHeading",
  priorityGrid: "RoutesPage_priorityGrid",
  recommendationGrid: "RoutesPage_recommendationGrid",
  recommendationCard: "RoutesPage_recommendationCard",
  recommendationList: "RoutesPage_recommendationList",
  recommendationRow: "RoutesPage_recommendationRow",
  placeRecommendationRow: "RoutesPage_placeRecommendationRow",
  placeRecommendationIcon: "RoutesPage_placeRecommendationIcon",
  placeRecommendationContent: "RoutesPage_placeRecommendationContent",
  placeRecommendationTitle: "RoutesPage_placeRecommendationTitle",
  recommendationType: "RoutesPage_recommendationType",
  recommendationSourceLink: "RoutesPage_recommendationSourceLink",
  stayRecommendationRow: "RoutesPage_stayRecommendationRow",
  stayTile: "RoutesPage_stayTile",
  stayRecommendationContent: "RoutesPage_stayRecommendationContent",
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
  statusDot: "RoutesPage_statusDot"
};

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
function tripIdFromPath() {
  const match = window.location.pathname.match(/^\/trips\/([^/]+)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
function setTripPath(tripId, replace = false) {
  const nextPath = tripId ? `/trips/${encodeURIComponent(tripId)}` : "/trips";
  if (window.location.pathname === nextPath) return;
  if (replace) window.history.replaceState({}, "", nextPath);
  else window.history.pushState({}, "", nextPath);
}
function TripCard({ trip, onOpen }) {
  const sourceUrl = trip.sources?.find((source) => source.url)?.url;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Card, { className: RoutesPage_default.tripCard, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardContent, { className: RoutesPage_default.tripCardContent, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.detectedTopline, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: RoutesPage_default.sourceMark, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CalendarDays, { size: 14 }),
      " ",
      trip.evidence || (trip.kind === "scratch" ? "Saved plan" : "Indexed history")
    ] }) }),
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
  const [activePhase, setActivePhase] = (0, import_react.useState)("current");
  const count = collection.trips.length;
  const phases = ["current", "upcoming", "past"];
  const labels = { past: "Past", current: "Current", upcoming: "Upcoming" };
  const activeTrips = collection.groups[activePhase];
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
    ] }) : count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.phaseTabs, role: "tablist", "aria-label": "Trip phases", children: phases.map((phase) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", role: "tab", "aria-selected": activePhase === phase, className: `${RoutesPage_default.phaseChip} ${activePhase === phase ? RoutesPage_default.phaseChipActive : ""}`, onClick: () => setActivePhase(phase), children: [
        labels[phase],
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: collection.groups[phase].length })
      ] }, phase)) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.tripList, children: activeTrips.length > 0 ? activeTrips.map((trip) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TripCard, { trip, onOpen }, trip.id)) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.emptyGroup, children: "No saved trips here yet." }) })
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
  const studyMeRunning = studyMeStatus?.state === "queued" || studyMeStatus?.state === "running";
  const gateTitle = studyMeReady ? collection.trips.length > 0 ? "Your trip library is ready" : "Map your trip history" : studyMeRunning ? "Waiting for Study Me to finish" : "Map your trip history";
  const gateCopy = studyMeReady ? collection.trips.length > 0 ? "Review and record past, current, and upcoming trips from your indexed history." : "Use the completed Study Me index to find and record past, current, and upcoming trips." : studyMeStatusLoading ? "Checking whether your indexed history is ready to map into your trip library." : "Your indexed history will be mapped into past, current, and upcoming trips when Study Me finishes.";
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.pageStack, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: InboxHeader_default.row, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: InboxHeader_default.left, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: InboxHeader_default.title, children: "Travel Planning" }) }) }),
    !loading && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: InboxTab_default.triage, "aria-live": "polite", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: InboxTab_default.triageContent, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: InboxTab_default.triageKicker, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
          " ",
          agentName,
          " travel planning"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: InboxTab_default.triageTitle, children: gateTitle }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: InboxTab_default.triageCopy, children: gateCopy })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: InboxTab_default.triageActions, children: studyMeReady ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: InboxTab_default.triageRunBtn, onClick: onSync, disabled: syncing, children: syncing ? "Building\u2026" : collection.trips.length > 0 ? "Refresh trip library" : "Build trip library" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: InboxTab_default.triageRunBtn, disabled: true, children: studyMeStatusLoading ? "Checking Study Me" : "Waiting for Study Me" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.entryGrid, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { id: "plan-another-trip", className: `${RoutesPage_default.startCard} ${RoutesPage_default.primaryStart}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardHeader, { className: RoutesPage_default.sectionHeader, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Start from scratch" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "Plan another trip" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardDescription, { className: RoutesPage_default.sectionDescription, children: "Give us the shape of the trip. We\u2019ll help you fill in the preparation details." })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PlanForm, { onSubmit: onCreatePlan }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.sideStack, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TripLibrary, { collection, loading, syncing, syncMessage, onSync, onOpen, syncAllowed: studyMeReady }) })
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
function itineraryBulletSummary(value) {
  const text = readableAgentText(value).trim();
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  const firstBullet = lines.findIndex((line) => /^\s*(?:[-*+]|\d+[.)])\s+/.test(line));
  if (firstBullet === -1) return text;
  let bulletEnd = firstBullet;
  for (let index = firstBullet + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(line) || /^\s{2,}\S/.test(line) || !line.trim()) {
      bulletEnd = index;
      continue;
    }
    break;
  }
  return lines.slice(0, bulletEnd + 1).join("\n").trim();
}
function ItineraryDay({ date, title, detail, icon: Icon }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.dayRow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.dayRail, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { "aria-label": date, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { size: 17, "aria-hidden": "true" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("i", {})
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.dayBody, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.dayHeading, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.dayDate, children: date }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: itineraryDayTitle(title) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AgentMarkdown, { className: RoutesPage_default.dayDescription, value: itineraryBulletSummary(detail) })
    ] })
  ] });
}
function placeIconForType(type) {
  const normalized = type?.toLowerCase() || "";
  if (normalized.includes("trail") || normalized.includes("hike")) return Mountain;
  if (normalized.includes("museum")) return Building2;
  return MapPin;
}
function placeTypeLabel(type) {
  const normalized = (type || "other").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const labels = {
    attraction: "Attraction",
    city_area: "City area",
    hiking_trail: "Hiking trail",
    trail: "Trail",
    viewpoint: "Viewpoint",
    museum: "Museum",
    temple: "Temple",
    shrine: "Shrine",
    park: "Park",
    market: "Market",
    neighborhood: "Neighborhood",
    hotel: "Hotel",
    hostel: "Hostel",
    apartment: "Apartment",
    camping: "Camping",
    other: "Other"
  };
  return labels[normalized] || normalized.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function readableAgentText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => readableAgentText(item)).filter(Boolean).join(" ");
  if (value && typeof value === "object") {
    const record = value;
    for (const key of ["description", "summary", "text", "detail", "itinerary", "recommendations", "items"]) {
      const text = readableAgentText(record[key]);
      if (text) return text;
    }
  }
  return fallback;
}
function itineraryDayTitle(value) {
  const title = value?.trim() || "Plan this day";
  const withoutDate = title.replace(
    /^(?:day\s+\d+\b|\d{4}-\d{2}-\d{2}\b|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?)\s*(?:[—–-]|:\s*)?\s*/i,
    ""
  ).trim();
  return withoutDate || title;
}
function AgentMarkdown({ value, className }) {
  const text = readableAgentText(value);
  if (!text) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Markdown, { className, remarkPlugins: [remarkGfm], children: text });
}
function draftFromTrip(trip) {
  const knownActivities = activities.map(({ value }) => value).filter((value) => trip.activities?.includes(value));
  return { id: trip.id, kind: trip.kind, destination: trip.destination, startDate: trip.startDate || "", endDate: trip.endDate || "", activities: knownActivities, pace: trip.pace || "Balanced", agentOutput: trip["agent-pipeline-output"] };
}
function ResearchRecommendations({ output }) {
  const stays = output.stays || [];
  const places = (output.places || []).filter((place) => place.name?.replace(/[*_]/g, "").trim().toLowerCase() !== "current status");
  if (stays.length === 0 && places.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.recommendationGrid, children: [
    stays.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { className: RoutesPage_default.recommendationCard, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardHeader, { className: RoutesPage_default.sectionHeader, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Places to stay" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "Suggested bases" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Compass, { size: 19, className: RoutesPage_default.mutedIcon })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { className: RoutesPage_default.recommendationList, children: stays.map((stay, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `${RoutesPage_default.recommendationRow} ${RoutesPage_default.stayRecommendationRow}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.stayTile, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Building2, { size: 22, "aria-hidden": "true" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: placeTypeLabel(stay.type) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.stayRecommendationContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: stay.name || "Stay option" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: stay.area || "Area to confirm" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AgentMarkdown, { className: RoutesPage_default.recommendationMarkdown, value: stay.detail }),
          stay.safety && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AgentMarkdown, { className: RoutesPage_default.recommendationNote, value: stay.safety })
        ] }),
        stay.sourceUrl && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("a", { className: RoutesPage_default.recommendationSourceLink, href: stay.sourceUrl, target: "_blank", rel: "noopener noreferrer", children: [
          "View source ",
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ExternalLink, { size: 12 })
        ] })
      ] }, `${stay.name}-${index}`)) })
    ] }),
    places.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { className: RoutesPage_default.recommendationCard, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardHeader, { className: RoutesPage_default.sectionHeader, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "What to see" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "Places and activities" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(MapPin, { size: 19, className: RoutesPage_default.mutedIcon })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { className: RoutesPage_default.recommendationList, children: places.map((place, index) => {
        const PlaceIcon = placeIconForType(place.type);
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `${RoutesPage_default.recommendationRow} ${RoutesPage_default.placeRecommendationRow}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.placeRecommendationIcon, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PlaceIcon, { size: 26, "aria-hidden": "true" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.placeRecommendationContent, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.placeRecommendationTitle, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: place.name || "Place to verify" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.recommendationType, children: placeTypeLabel(place.type) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AgentMarkdown, { className: RoutesPage_default.recommendationMarkdown, value: place.detail }),
            place.route && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AgentMarkdown, { className: RoutesPage_default.recommendationNote, value: place.route }),
            place.sourceUrl && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("a", { className: RoutesPage_default.recommendationSourceLink, href: place.sourceUrl, target: "_blank", rel: "noopener noreferrer", children: [
              "View source ",
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ExternalLink, { size: 12 })
            ] })
          ] })
        ] }, `${place.name}-${index}`);
      }) })
    ] })
  ] });
}
function ResearchSources({ output }) {
  const sources = output.sources || [];
  if (!sources.length) return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.researchSources, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "Nova will show the sources behind current conditions and preparation advice." }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: RoutesPage_default.sourceStatus, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.statusDot }),
      " Sources will appear here"
    ] })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Collapsible, { className: RoutesPage_default.researchSources, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CollapsibleTrigger, { className: RoutesPage_default.researchSourcesTrigger, "aria-controls": "research-sources-list", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
        sources.length,
        " sources attached to this plan."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ChevronDown, { size: 16, className: RoutesPage_default.researchSourcesIcon })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CollapsibleContent, { id: "research-sources-list", className: RoutesPage_default.researchSourcesContent, children: sources.map((source, index) => source.url ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("a", { className: RoutesPage_default.sourceLink, href: source.url, target: "_blank", rel: "noopener noreferrer", children: [
      "Source ",
      index + 1,
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ExternalLink, { size: 12 })
    ] }, `${source.url}-${index}`) : null) })
  ] });
}
function buildStepIndex(stage) {
  const normalized = (stage || "").toLowerCase();
  if (normalized.includes("gap review") || normalized.includes("itinerary") || normalized.includes("complete")) return 2;
  if (normalized.includes("health") || normalized.includes("hazard")) return 1;
  return 0;
}
function Workspace({ draft, saved, onBack, onRetry }) {
  const activityLabel = draft.activities.length > 0 ? draft.activities.join(", ") : "a flexible mix of activities";
  const firstDate = formatDate(draft.startDate);
  const lastDate = formatDate(draft.endDate || draft.startDate);
  const dayTwoIcon = draft.activities.includes("hiking") ? Mountain : draft.activities.includes("water") ? Droplets : Compass;
  const output = draft.agentOutput;
  const overview = readableAgentText(output?.overview);
  const routeSummary = readableAgentText(output?.routeSummary);
  const preparation = output?.preparation || [];
  const generatedDays = output?.days || [];
  const priorityIcons = [Mountain, Sun, ListChecks];
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
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Button, { variant: "secondary", onClick: onRetry, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RefreshCw, { size: 16 }),
        " Start over"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.researchNotice, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Sparkles, { size: 18 }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: overview ? "Agent research is ready." : "Research is being assembled." }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: overview || "Current weather, health, hazard, and route signals will be checked before you rely on this plan." }),
        output && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ResearchSources, { output })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: RoutesPage_default.prioritySection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.sectionHeading, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Before you go" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: "Start with the important parts" })
      ] }) }),
      preparation.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.priorityGrid, children: preparation.slice(0, 3).map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PriorityAction, { icon: priorityIcons[index] || ListChecks, tone: ["coralTone", "goldTone", "blueTone"][index] || "blueTone", title: item.title || "Preparation item", detail: item.detail || "Research-based guidance for this trip." }, `${item.title}-${index}`)) }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.prepEmpty, children: "The agent did not return preparation details for this plan." })
    ] }),
    output && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ResearchRecommendations, { output }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.workspaceGrid, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Card, { className: RoutesPage_default.itineraryCard, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Collapsible, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardHeader, { className: RoutesPage_default.sectionHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.itineraryHeaderContent, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Outline" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CollapsibleTrigger, { className: RoutesPage_default.itinerarySummaryTrigger, "aria-controls": "itinerary-route-summary", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.itineraryTitle, children: "A flexible itinerary" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ChevronDown, { size: 16, className: RoutesPage_default.itinerarySummaryIcon })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CollapsibleContent, { id: "itinerary-route-summary", className: RoutesPage_default.itinerarySummaryContent, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AgentMarkdown, { className: RoutesPage_default.sectionDescription, value: routeSummary || "Shape first, then add verified places and route legs." }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Badge, { className: RoutesPage_default.durationBadge, variant: "muted", children: [
            generatedDays.length || 3,
            " days"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { className: RoutesPage_default.timeline, children: generatedDays.length > 0 ? generatedDays.map((day, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ItineraryDay, { date: day.date ? formatDate(day.date) : index === 0 ? firstDate : `Day ${index + 1}`, title: day.title || "Plan this day", detail: day.detail || "", icon: index === 0 ? Plane : dayTwoIcon }, `${day.day}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ItineraryDay, { date: firstDate, title: "Arrive & get oriented", detail: `Settle in around ${draft.destination}. Keep the first block light while you confirm local conditions and logistics.`, icon: Plane }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ItineraryDay, { date: draft.startDate ? "Next day" : "Day 2", title: "Make space for the main activity", detail: `A good day for ${activityLabel}. The planner will attach conditions, route details, and what to bring.`, icon: dayTwoIcon }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ItineraryDay, { date: lastDate, title: "Buffer & head home", detail: "Keep a flexible buffer for weather, closures, recovery, or a slower route back.", icon: Clock3 })
        ] }) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("aside", { className: RoutesPage_default.workspaceRail, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { className: RoutesPage_default.prepCard, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardHeader, { className: RoutesPage_default.sectionHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Preparation list" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardTitle, { children: "What you\u2019ll need" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ListChecks, { size: 19, className: RoutesPage_default.mutedIcon })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CardContent, { className: RoutesPage_default.prepContent, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.checklist, children: preparation.length > 0 ? preparation.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { type: "checkbox" }),
          " ",
          item.title || "Preparation item",
          item.detail ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { children: item.detail }) : null
        ] }, `${item.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.prepEmpty, children: "The agent did not return preparation details for this plan." }) }) })
      ] }) })
    ] })
  ] });
}
function PlanBuildScreen({ draft, agentName, stage, error, onRetry, onBack }) {
  const failed = Boolean(error);
  const stageLabel = stage ? stage.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Starting";
  const rawActiveStep = buildStepIndex(stage);
  const [activeStep, setActiveStep] = (0, import_react.useState)(rawActiveStep);
  (0, import_react.useEffect)(() => {
    setActiveStep((current) => Math.max(current, rawActiveStep));
  }, [rawActiveStep]);
  const buildSteps = [
    ["Prepare around current conditions", "Weather, exposure, access, and environmental constraints"],
    ["Prepare around health & hazards", "Health, wildlife, security, and official advisory context"],
    ["Build the itinerary", `${draft.startDate || draft.endDate ? formatRange(draft.startDate, draft.endDate) : "Flexible dates"} \xB7 ${draft.pace} pace \xB7 planned around researched conditions`]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.planBuildPage, "aria-live": "polite", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Card, { className: RoutesPage_default.planBuildCard, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(CardContent, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.planBuildIcon, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Sparkles, { size: 22, "aria-hidden": "true" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: RoutesPage_default.eyebrow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { "aria-hidden": "true", children: "\u2726" }),
      " ",
      agentName,
      " travel planning"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { children: failed ? "Travel research could not finish" : "Building your preparation plan" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.planBuildCopy, children: failed ? `The agent did not produce a complete trip for ${draft.destination}.` : `The agent is researching conditions and hazards first, then shaping an itinerary around what it found for ${draft.destination}.` }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.planBuildStage, children: failed ? "Pipeline status: Failed" : stageLabel }),
    failed ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.planBuildError, role: "alert", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.planBuildSteps, children: buildSteps.map(([title, detail], index) => {
        const complete = index < activeStep;
        const current = index === activeStep;
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `${RoutesPage_default.planBuildStep} ${current ? RoutesPage_default.planBuildStepCurrent : ""}`, "aria-current": current ? "step" : void 0, children: [
          complete ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.planBuildComplete, "aria-label": "Complete", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Check, { size: 11 }) }) : current ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.planBuildSpinner, "aria-hidden": "true" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.planBuildDot, "aria-hidden": "true" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: detail })
          ] })
        ] }, title);
      }) })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.planBuildSteps, children: buildSteps.map(([title, detail], index) => {
      const complete = index < activeStep;
      const current = index === activeStep;
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `${RoutesPage_default.planBuildStep} ${current ? RoutesPage_default.planBuildStepCurrent : ""}`, "aria-current": current ? "step" : void 0, children: [
        complete ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.planBuildComplete, "aria-label": "Complete", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Check, { size: 11 }) }) : current ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.planBuildSpinner, "aria-hidden": "true" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.planBuildDot, "aria-hidden": "true" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: title }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: detail })
        ] })
      ] }, title);
    }) }),
    failed && onRetry && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Button, { variant: "secondary", onClick: onRetry, children: "Continue research" }),
    failed && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: RoutesPage_default.backButton, type: "button", onClick: onBack, children: "Back to trips" })
  ] }) }) });
}
function TripPageLoader() {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: RoutesPage_default.tripPageLoader, role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: RoutesPage_default.tripPageLoaderIcon, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RefreshCw, { size: 22, "aria-hidden": "true" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: RoutesPage_default.eyebrow, children: "Travel planning" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { children: "Loading your trip" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "Pulling in the saved trip details and current research." }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: RoutesPage_default.tripPageLoaderBar, "aria-hidden": "true" })
  ] });
}
function RoutesPage({ userName, userImage }) {
  const { name: agentName } = useAgentIdentity();
  const [routeTripId, setRouteTripId] = (0, import_react.useState)(() => tripIdFromPath());
  const [view, setView] = (0, import_react.useState)(() => routeTripId ? "plan" : "overview");
  const [draft, setDraft] = (0, import_react.useState)(null);
  const [saved, setSaved] = (0, import_react.useState)(false);
  const [planBuilding, setPlanBuilding] = (0, import_react.useState)(false);
  const [planBuildStage, setPlanBuildStage] = (0, import_react.useState)();
  const [planBuildError, setPlanBuildError] = (0, import_react.useState)(null);
  const [collection, setCollection] = (0, import_react.useState)(emptyCollection);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [syncing, setSyncing] = (0, import_react.useState)(false);
  const [syncMessage, setSyncMessage] = (0, import_react.useState)(null);
  const [studyMeStatus, setStudyMeStatus] = (0, import_react.useState)(null);
  const [studyMeStatusLoading, setStudyMeStatusLoading] = (0, import_react.useState)(true);
  const openingTripId = (0, import_react.useRef)(null);
  const initials = (0, import_react.useMemo)(() => initialsFor(userName), [userName]);
  (0, import_react.useEffect)(() => {
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
    setPlanBuildError(null);
    setPlanBuilding(true);
    setPlanBuildStage("starting");
    setView("plan");
    try {
      const response = await proxyFetch("/agent/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "scratch", destination: next.destination, startDate: next.startDate || null, endDate: next.endDate || null, activities: next.activities, pace: next.pace }) });
      if (!response.ok) throw new Error("The trip could not be saved. Try again.");
      const payload = await response.json();
      if (!payload.trip) throw new Error("The trip was saved without a usable trip record.");
      openingTripId.current = payload.trip.id;
      setTripPath(payload.trip.id);
      setRouteTripId(payload.trip.id);
      setDraft(draftFromTrip(payload.trip));
      setSaved(true);
      if (await processTripPipeline(payload.trip)) await loadTrips();
    } catch (error) {
      setPlanBuildError(error instanceof Error ? error.message : "The trip could not be prepared.");
    } finally {
      setPlanBuilding(false);
    }
  }
  async function openTrip(trip) {
    openingTripId.current = trip.id;
    setTripPath(trip.id);
    setRouteTripId(trip.id);
    setDraft(draftFromTrip(trip));
    setSaved(true);
    setPlanBuildError(null);
    setView("plan");
    if (trip["agent-pipeline"] === "complete" && trip["agent-pipeline-output"]) {
      setPlanBuilding(false);
      return;
    }
    setPlanBuilding(true);
    setPlanBuildStage(trip["agent-pipeline-stage"] || "starting");
    await processTripPipeline(trip);
  }
  (0, import_react.useEffect)(() => {
    if (loading || !routeTripId || draft?.id === routeTripId || openingTripId.current === routeTripId) return;
    const trip = collection.trips.find((candidate) => candidate.id === routeTripId);
    if (!trip) {
      setTripPath(void 0, true);
      setRouteTripId(null);
      setView("overview");
      return;
    }
    void openTrip(trip);
  }, [collection, draft?.id, loading, routeTripId]);
  (0, import_react.useEffect)(() => {
    const handlePopState = () => {
      const nextTripId = tripIdFromPath();
      openingTripId.current = null;
      setRouteTripId(nextTripId);
      if (!nextTripId) {
        setDraft(null);
        setSaved(false);
        setPlanBuilding(false);
        setPlanBuildError(null);
        setPlanBuildStage(void 0);
        setView("overview");
        return;
      }
      const trip = collection.trips.find((candidate) => candidate.id === nextTripId);
      if (trip) void openTrip(trip);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [collection]);
  function showOverview() {
    openingTripId.current = null;
    setTripPath();
    setRouteTripId(null);
    setDraft(null);
    setSaved(false);
    setPlanBuilding(false);
    setPlanBuildError(null);
    setPlanBuildStage(void 0);
    setView("overview");
  }
  async function processTripPipeline(trip, retry = false) {
    setPlanBuildError(null);
    try {
      const response = await proxyFetch(`/agent/trips/${encodeURIComponent(trip.id)}/pipeline${retry ? "?retry=true" : ""}`, { method: "POST" });
      if (!response.ok) throw new Error("The travel-planning pipeline could not be started.");
      const payload = await response.json();
      if (payload.trip) setDraft(draftFromTrip(payload.trip));
      setPlanBuildStage(payload.stage || payload.trip?.["agent-pipeline-stage"] || payload.status);
      if (!payload.id) {
        if (payload.status === "complete" && payload.trip?.["agent-pipeline-output"]) return true;
        throw new Error(payload.error || "The pipeline returned no run to poll.");
      }
      let status = payload.status || "queued";
      let latest = payload;
      while (status !== "complete" && status !== "failed") {
        await new Promise((resolve) => window.setTimeout(resolve, 1e3));
        const pollResponse = await proxyFetch(`/agent/trips/${encodeURIComponent(trip.id)}/pipeline/${encodeURIComponent(payload.id)}`);
        if (!pollResponse.ok) throw new Error("The travel-planning pipeline status could not be read.");
        latest = await pollResponse.json();
        status = latest.status || "queued";
        setPlanBuildStage(latest.stage || latest.trip?.["agent-pipeline-stage"] || status);
        if (latest.trip) setDraft(draftFromTrip(latest.trip));
      }
      if (status !== "complete" || !latest.trip?.["agent-pipeline-output"]) {
        throw new Error(latest.error || "The pipeline stopped before producing a complete trip plan.");
      }
      return true;
    } catch (error) {
      setPlanBuildError(error instanceof Error ? error.message : "The travel-planning pipeline could not finish.");
      return false;
    } finally {
      setPlanBuilding(false);
    }
  }
  function retryPlanBuild(force = false) {
    if (!draft?.id) return;
    setPlanBuildError(null);
    setPlanBuilding(true);
    setPlanBuildStage("retrying");
    void processTripPipeline({ id: draft.id, kind: draft.kind, destination: draft.destination, startDate: draft.startDate, endDate: draft.endDate, activities: draft.activities, pace: draft.pace, phase: "current" }, force);
  }
  const overviewProps = { agentName, studyMeStatus, studyMeStatusLoading, collection, loading, syncing, syncMessage, onSync: () => void syncTrips(), onOpen: openTrip, onCreatePlan: (next) => void submitDraft(next) };
  const pageContent = view === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Overview, { ...overviewProps }) : routeTripId && !draft ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TripPageLoader, {}) : draft ? planBuilding || planBuildError ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PlanBuildScreen, { draft, agentName, stage: planBuildStage, error: planBuildError, onRetry: () => retryPlanBuild(false), onBack: showOverview }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Workspace, { draft, saved, onBack: showOverview, onRetry: () => retryPlanBuild(true) }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Overview, { ...overviewProps });
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AppHeader, { userImage, userName, initials, pageTitle: "Trips" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PageShell, { children: pageContent }),
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
