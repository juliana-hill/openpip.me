"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronDown,
  CircleHelp,
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
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { proxyFetch } from "@/lib/proxy";
import { useAgentIdentity } from "@/lib/agentIdentity";
import type { InsightGatheringStatus } from "@/components/dashboard/StudyMeCard";
import inboxStyles from "@/components/inbox/inbox/InboxTab.module.css";
import inboxHeaderStyles from "@/components/inbox/inbox/InboxHeader.module.css";
import styles from "./RoutesPage.module.css";

type Activity = "city" | "hiking" | "road trip" | "camping" | "cycling" | "water";
type View = "overview" | "plan";
type Phase = "past" | "current" | "upcoming";

type AgentPipelineOutput = {
  overview?: string;
  routeSummary?: string;
  stays?: Array<{ name?: string; area?: string; type?: string; detail?: string; safety?: string; sourceUrl?: string }>;
  places?: Array<{ name?: string; type?: string; detail?: string; route?: string; sourceUrl?: string }>;
  days?: Array<{ day?: number; date?: string | null; title?: string; detail?: string; route?: string; conditions?: string }>;
  preparation?: Array<{ title?: string; detail?: string }>;
  signals?: Array<{ category?: string; title?: string; detail?: string; severity?: string }>;
  sources?: Array<{ url?: string; retrievedAt?: string }>;
};

type TripRecord = {
  id: string;
  kind?: "scratch" | "detected";
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  activities?: string[];
  pace?: string;
  evidence?: string;
  confidence?: "confirmed" | "likely" | "needs review";
  sources?: Array<{ url?: string | null }>;
  "agent-pipeline"?: "queued" | "running" | "complete" | "failed";
  "agent-pipeline-stage"?: string;
  "agent-pipeline-output"?: AgentPipelineOutput;
  phase: Phase;
};

type TripCollection = {
  trips: TripRecord[];
  groups: Record<Phase, TripRecord[]>;
  pipeline?: { state?: string; recordsWritten?: number };
};

type PlanDraft = {
  id?: string;
  kind?: "scratch" | "detected";
  destination: string;
  startDate: string;
  endDate: string;
  activities: Activity[];
  pace: string;
  agentOutput?: AgentPipelineOutput;
};

const emptyCollection: TripCollection = { trips: [], groups: { past: [], current: [], upcoming: [] }, pipeline: { state: "not_run" } };

const activities: Array<{ value: Activity; label: string }> = [
  { value: "city", label: "City time" },
  { value: "hiking", label: "Hiking" },
  { value: "road trip", label: "Road trip" },
  { value: "camping", label: "Camping" },
  { value: "cycling", label: "Cycling" },
  { value: "water", label: "Water activity" },
];

function formatDate(value?: string | null): string {
  if (!value) return "Dates to be decided";
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "Flexible dates";
  if (!end || start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function initialsFor(name: string): string {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}

function tripIdFromPath(): string | null {
  const match = window.location.pathname.match(/^\/trips\/([^/]+)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function setTripPath(tripId?: string, replace = false): void {
  const nextPath = tripId ? `/trips/${encodeURIComponent(tripId)}` : "/trips";
  if (window.location.pathname === nextPath) return;
  if (replace) window.history.replaceState({}, "", nextPath);
  else window.history.pushState({}, "", nextPath);
}

function TripCard({ trip, onOpen }: { trip: TripRecord; onOpen: (trip: TripRecord) => void }) {
  const confidenceVariant = trip.confidence === "confirmed" ? "success" : trip.confidence === "likely" ? "warning" : "muted";
  const sourceUrl = trip.sources?.find((source) => source.url)?.url;
  return (
    <Card className={styles.tripCard}>
      <CardContent className={styles.tripCardContent}>
        <div className={styles.detectedTopline}>
          <span className={styles.sourceMark}><CalendarDays size={14} /> {trip.evidence || (trip.kind === "scratch" ? "Saved plan" : "Indexed history")}</span>
          {trip.confidence && <Badge variant={confidenceVariant}>{trip.confidence}</Badge>}
        </div>
        <h3 className={styles.detectedTitle}>{trip.destination}</h3>
        <p className={styles.detectedDates}>{formatRange(trip.startDate, trip.endDate)}</p>
        <div className={styles.cardActionRow}>
          <Button size="sm" onClick={() => onOpen(trip)}>{trip.phase === "past" ? "Review trip" : "Open plan"} <ArrowRight size={14} /></Button>
          {sourceUrl && <a className={styles.sourceLink} href={sourceUrl} target="_blank" rel="noopener noreferrer">Source <ExternalLink size={12} /></a>}
        </div>
      </CardContent>
    </Card>
  );
}

function TripGroup({ phase, trips, onOpen }: { phase: Phase; trips: TripRecord[]; onOpen: (trip: TripRecord) => void }) {
  const labels: Record<Phase, string> = { past: "Past", current: "Current", upcoming: "Upcoming" };
  return (
    <div className={styles.tripGroup}>
      <div className={styles.tripGroupHeading}><h3>{labels[phase]}</h3><span>{trips.length}</span></div>
      {trips.length > 0 ? trips.map((trip) => <TripCard key={trip.id} trip={trip} onOpen={onOpen} />) : <p className={styles.emptyGroup}>No saved trips here yet.</p>}
    </div>
  );
}

function ActivityPicker({ selected, onChange }: { selected: Activity[]; onChange: (next: Activity[]) => void }) {
  function toggle(value: Activity) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }
  return (
    <div className={styles.activityGrid} role="group" aria-label="Activities">
      {activities.map(({ value, label }) => {
        const active = selected.includes(value);
        return <button className={`${styles.activityChip} ${active ? styles.activityChipActive : ""}`} type="button" key={value} aria-pressed={active} onClick={() => toggle(value)}>{active ? <Check size={14} /> : <Plus size={14} />}{label}</button>;
      })}
    </div>
  );
}

function PlanForm({ onSubmit }: { onSubmit: (draft: PlanDraft) => void }) {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<Activity[]>([]);
  const [pace, setPace] = useState("Balanced");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (destination.trim()) onSubmit({ destination: destination.trim(), startDate, endDate, activities: selected, pace, kind: "scratch" });
  }

  return (
    <form className={styles.planForm} onSubmit={submit}>
      <div className={styles.formSection}><label className={styles.formLabel} htmlFor="trip-destination">Where are you going?</label><div className={styles.inputWithIcon}><MapPin size={17} aria-hidden="true" /><Input id="trip-destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="e.g. Cusco, Peru" autoComplete="off" /></div></div>
      <div className={styles.formRow}><div className={styles.formSection}><label className={styles.formLabel} htmlFor="trip-start">Start date</label><Input id="trip-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div><div className={styles.formSection}><label className={styles.formLabel} htmlFor="trip-end">End date</label><Input id="trip-end" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></div></div>
      <div className={styles.formSection}><span className={styles.formLabel}>What are you doing?</span><ActivityPicker selected={selected} onChange={setSelected} /></div>
      <div className={styles.formSection}><label className={styles.formLabel} htmlFor="trip-pace">Trip pace</label><select id="trip-pace" className={styles.select} value={pace} onChange={(event) => setPace(event.target.value)}><option>Easy</option><option>Balanced</option><option>Full days</option></select></div>
      <div className={styles.formFooter}><p className={styles.formHint}><CircleHelp size={14} /> Passport and health context can be added later for this plan only.</p><Button type="submit" size="lg" disabled={!destination.trim()}>Build my plan <ArrowRight size={17} /></Button></div>
    </form>
  );
}

function TripLibrary({ collection, loading, syncing, syncMessage, onSync, onOpen, syncAllowed }: { collection: TripCollection; loading: boolean; syncing: boolean; syncMessage: string | null; onSync: () => void; onOpen: (trip: TripRecord) => void; syncAllowed: boolean }) {
  const [activePhase, setActivePhase] = useState<Phase>("current");
  const count = collection.trips.length;
  const phases: Phase[] = ["current", "upcoming", "past"];
  const labels: Record<Phase, string> = { past: "Past", current: "Current", upcoming: "Upcoming" };
  const activeTrips = collection.groups[activePhase];
  return (
    <Card className={styles.libraryCard}>
      <CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>Saved trip library</p><CardTitle>Past, current & upcoming</CardTitle><CardDescription className={styles.sectionDescription}>Built from your separate trip records. Nothing is booked here.</CardDescription></div><Button variant="ghost" size="sm" onClick={onSync} disabled={syncing || loading || !syncAllowed} aria-label="Refresh trip library from Study Me"><RefreshCw size={15} className={syncing ? styles.spin : ""} /> {syncing ? "Building" : "Refresh"}</Button></CardHeader>
      {syncMessage && <p className={styles.syncMessage} role="status">{syncMessage}</p>}
      <CardContent className={styles.libraryContent}>
        {loading ? <div className={styles.libraryLoading}><span className={styles.loadingBar} /><span className={styles.loadingBarShort} /></div> : count > 0 ? <><div className={styles.phaseTabs} role="tablist" aria-label="Trip phases">{phases.map((phase) => <button key={phase} type="button" role="tab" aria-selected={activePhase === phase} className={`${styles.phaseChip} ${activePhase === phase ? styles.phaseChipActive : ""}`} onClick={() => setActivePhase(phase)}>{labels[phase]} <span>{collection.groups[phase].length}</span></button>)}</div><div className={styles.tripList}>{activeTrips.length > 0 ? activeTrips.map((trip) => <TripCard key={trip.id} trip={trip} onOpen={onOpen} />) : <p className={styles.emptyGroup}>No saved trips here yet.</p>}</div></> : <div className={styles.emptyTrips}><div className={styles.emptyIcon}><CalendarDays size={22} /></div><div><h3>No saved trips yet</h3><p>{collection.pipeline?.state === "not_run" ? "After Study Me completes, refresh this library to organize trip context from the shared index." : "Build a plan from scratch or refresh the completed Study Me index."}</p></div></div>}
      </CardContent>
    </Card>
  );
}

function Overview({ agentName, studyMeStatus, studyMeStatusLoading, collection, loading, syncing, syncMessage, onSync, onOpen, onCreatePlan }: { agentName: string; studyMeStatus: InsightGatheringStatus | null; studyMeStatusLoading: boolean; collection: TripCollection; loading: boolean; syncing: boolean; syncMessage: string | null; onSync: () => void; onOpen: (trip: TripRecord) => void; onCreatePlan: (draft: PlanDraft) => void }) {
  const studyMeReady = studyMeStatus?.state === "completed";
  const studyMeRunning = studyMeStatus?.state === "queued" || studyMeStatus?.state === "running";
  const gateTitle = studyMeReady
    ? collection.trips.length > 0 ? "Your trip library is ready" : "Map your trip history"
    : studyMeRunning
      ? "Waiting for Study Me to finish"
      : "Map your trip history";
  const gateCopy = studyMeReady
    ? collection.trips.length > 0
      ? "Review and record past, current, and upcoming trips from your indexed history."
      : "Use the completed Study Me index to find and record past, current, and upcoming trips."
    : studyMeStatusLoading
      ? "Checking whether your indexed history is ready to map into your trip library."
      : "Your indexed history will be mapped into past, current, and upcoming trips when Study Me finishes.";
  return <div className={styles.pageStack}>
    <div className={inboxHeaderStyles.row}>
      <div className={inboxHeaderStyles.left}><h2 className={inboxHeaderStyles.title}>Travel Planning</h2></div>
    </div>
    {!loading && <section className={inboxStyles.triage} aria-live="polite">
      <div className={inboxStyles.triageContent}>
        <p className={inboxStyles.triageKicker}><span aria-hidden="true">✦</span> {agentName} travel planning</p>
        <h3 className={inboxStyles.triageTitle}>{gateTitle}</h3>
        <p className={inboxStyles.triageCopy}>{gateCopy}</p>
      </div>
      <div className={inboxStyles.triageActions}>
        {studyMeReady ? <button type="button" className={inboxStyles.triageRunBtn} onClick={onSync} disabled={syncing}>{syncing ? "Building…" : collection.trips.length > 0 ? "Refresh trip library" : "Build trip library"}</button> : <button type="button" className={inboxStyles.triageRunBtn} disabled>{studyMeStatusLoading ? "Checking Study Me" : "Waiting for Study Me"}</button>}
      </div>
    </section>}
    <div className={styles.entryGrid}>
      <Card id="plan-another-trip" className={`${styles.startCard} ${styles.primaryStart}`}><CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>Start from scratch</p><CardTitle>Plan another trip</CardTitle><CardDescription className={styles.sectionDescription}>Give us the shape of the trip. We’ll help you fill in the preparation details.</CardDescription></div></CardHeader><CardContent><PlanForm onSubmit={onCreatePlan} /></CardContent></Card>
      <div className={styles.sideStack}><TripLibrary collection={collection} loading={loading} syncing={syncing} syncMessage={syncMessage} onSync={onSync} onOpen={onOpen} syncAllowed={studyMeReady} /></div>
    </div>
  </div>;
}

function PriorityAction({ icon: Icon, tone, title, detail }: { icon: typeof Sun; tone: string; title: string; detail: string }) {
  return <div className={`${styles.priorityAction} ${styles[tone]}`}><span className={styles.priorityIcon}><Icon size={17} /></span><div><strong>{title}</strong><p>{detail}</p></div></div>;
}

function ItineraryDay({ day, date, title, detail, icon: Icon }: { day: string; date: string; title: string; detail: string; icon: typeof Plane }) {
  return <div className={styles.dayRow}><div className={styles.dayRail}><span aria-label={`Day ${day}`}><Icon size={17} aria-hidden="true" /></span><i /></div><div className={styles.dayBody}><div className={styles.dayHeading}><div><span className={styles.dayDate}>{date}</span><h3>{title}</h3></div></div><p>{detail}</p><div className={styles.dayMeta}><span><Clock3 size={14} /> Flexible timing</span><span><MapPin size={14} /> Route details after research</span></div></div></div>;
}

function placeIconForType(type?: string): typeof MapPin {
  const normalized = type?.toLowerCase() || "";
  if (normalized.includes("trail") || normalized.includes("hike")) return Mountain;
  if (normalized.includes("museum")) return Building2;
  return MapPin;
}

function hasSourceLinkedRecommendations(output?: AgentPipelineOutput): boolean {
  const stays = output?.stays || [];
  const places = output?.places || [];
  return stays.length > 0 && places.length > 0 && [...stays, ...places].every((item) => /^https?:\/\//i.test(item.sourceUrl || ""));
}

function draftFromTrip(trip: TripRecord): PlanDraft {
  const knownActivities = activities.map(({ value }) => value).filter((value) => trip.activities?.includes(value));
  return { id: trip.id, kind: trip.kind, destination: trip.destination, startDate: trip.startDate || "", endDate: trip.endDate || "", activities: knownActivities, pace: trip.pace || "Balanced", agentOutput: trip["agent-pipeline-output"] };
}

function ResearchRecommendations({ output }: { output: AgentPipelineOutput }) {
  const stays = output.stays || [];
  const places = output.places || [];
  if (stays.length === 0 && places.length === 0) return null;
  return <div className={styles.recommendationGrid}>
    {stays.length > 0 && <Card className={styles.recommendationCard}><CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>Places to stay</p><CardTitle>Suggested bases</CardTitle></div><Compass size={19} className={styles.mutedIcon} /></CardHeader><CardContent className={styles.recommendationList}>{stays.map((stay, index) => <div className={styles.recommendationRow} key={`${stay.name}-${index}`}><strong>{stay.name || "Stay option"}</strong><span>{[stay.type, stay.area].filter(Boolean).join(" · ")}</span><p>{stay.detail}</p>{stay.safety && <small>{stay.safety}</small>}{stay.sourceUrl && <a className={styles.recommendationSourceLink} href={stay.sourceUrl} target="_blank" rel="noopener noreferrer">View source <ExternalLink size={12} /></a>}</div>)}</CardContent></Card>}
    {places.length > 0 && <Card className={styles.recommendationCard}><CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>What to see</p><CardTitle>Verified places and activities</CardTitle></div><MapPin size={19} className={styles.mutedIcon} /></CardHeader><CardContent className={styles.recommendationList}>{places.map((place, index) => { const PlaceIcon = placeIconForType(place.type); return <div className={`${styles.recommendationRow} ${styles.placeRecommendationRow}`} key={`${place.name}-${index}`}><span className={styles.placeRecommendationIcon}><PlaceIcon size={26} aria-hidden="true" /></span><div className={styles.placeRecommendationContent}><div className={styles.placeRecommendationTitle}><strong>{place.name || "Place to verify"}</strong><span className={styles.recommendationType}>{place.type || "Activity"}</span></div><p>{place.detail}</p>{place.route && <small>{place.route}</small>}{place.sourceUrl && <a className={styles.recommendationSourceLink} href={place.sourceUrl} target="_blank" rel="noopener noreferrer">View source <ExternalLink size={12} /></a>}</div></div>; })}</CardContent></Card>}
  </div>;
}

function ResearchSources({ output }: { output: AgentPipelineOutput }) {
  const sources = output.sources || [];
  if (!sources.length) return <div className={styles.researchSources}><p>Nova will show the sources behind current conditions and preparation advice.</p><span className={styles.sourceStatus}><span className={styles.statusDot} /> Sources will appear here</span></div>;
  return <Collapsible className={styles.researchSources}>
    <CollapsibleTrigger className={styles.researchSourcesTrigger} aria-controls="research-sources-list"><span>{sources.length} sources attached to this plan.</span><ChevronDown size={16} className={styles.researchSourcesIcon} /></CollapsibleTrigger>
    <CollapsibleContent id="research-sources-list" className={styles.researchSourcesContent}>{sources.map((source, index) => source.url ? <a key={`${source.url}-${index}`} className={styles.sourceLink} href={source.url} target="_blank" rel="noopener noreferrer">Source {index + 1} <ExternalLink size={12} /></a> : null)}</CollapsibleContent>
  </Collapsible>;
}

function Workspace({ draft, saved, onBack }: { draft: PlanDraft; saved: boolean; onBack: () => void }) {
  const activityLabel = draft.activities.length > 0 ? draft.activities.join(", ") : "a flexible mix of activities";
  const firstDate = formatDate(draft.startDate);
  const lastDate = formatDate(draft.endDate || draft.startDate);
  const dayTwoIcon = draft.activities.includes("hiking") ? Mountain : draft.activities.includes("water") ? Droplets : Compass;
  const output = draft.agentOutput;
  const preparation = output?.preparation || [];
  const generatedDays = output?.days || [];
  const priorityIcons = [Mountain, Sun, ListChecks];
  return <div className={styles.pageStack}>
    <button className={styles.backButton} type="button" onClick={onBack}><ChevronLeft size={16} /> All trips</button>
    <section className={styles.workspaceHeader}><div><p className={styles.eyebrow}>{saved ? "Saved plan" : "Planning draft"}</p><h1>{draft.destination}</h1><div className={styles.workspaceMeta}><span><CalendarDays size={15} /> {draft.startDate || draft.endDate ? `${firstDate} – ${lastDate}` : "Dates to be decided"}</span><span><Compass size={15} /> {activityLabel}</span><Badge variant="muted">{draft.pace} pace</Badge></div></div><Button variant="secondary" onClick={onBack}><Plus size={16} /> New plan</Button></section>
    <div className={styles.researchNotice}><Sparkles size={18} /><div><strong>{output?.overview ? "Agent research is source-linked." : "Research stays source-linked."}</strong><p>{output?.overview || "Current weather, health, hazard, and route signals will be checked before you rely on this plan."}</p>{output && <ResearchSources output={output} />}</div></div>
    <section className={styles.prioritySection}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Before you go</p><h2>Start with the important parts</h2></div></div><div className={styles.priorityGrid}>{(preparation.length > 0 ? preparation.slice(0, 3) : [{ title: "Confirm elevation", detail: "Sleeping altitude will determine acclimatization guidance." }, { title: "Check the exposure", detail: "Weather and UV windows should shape each outdoor day." }, { title: "Build the gear list", detail: `Starting from ${draft.pace.toLowerCase()} days and ${activityLabel}.` }]).map((item, index) => <PriorityAction key={`${item.title}-${index}`} icon={priorityIcons[index] || ListChecks} tone={["coralTone", "goldTone", "blueTone"][index] || "blueTone"} title={item.title || "Preparation item"} detail={item.detail || "Verify before departure."} />)}</div></section>
    {output && <ResearchRecommendations output={output} />}
    <div className={styles.workspaceGrid}><Card className={styles.itineraryCard}><Collapsible><CardHeader className={styles.sectionHeader}><div className={styles.itineraryHeaderContent}><p className={styles.eyebrow}>Outline</p><CollapsibleTrigger className={styles.itinerarySummaryTrigger} aria-controls="itinerary-route-summary"><span className={styles.itineraryTitle}>A flexible itinerary</span><ChevronDown size={16} className={styles.itinerarySummaryIcon} /></CollapsibleTrigger><CollapsibleContent id="itinerary-route-summary" className={styles.itinerarySummaryContent}><CardDescription className={styles.sectionDescription}>{output?.routeSummary || "Shape first, then add verified places and route legs."}</CardDescription></CollapsibleContent></div><Badge className={styles.durationBadge} variant="muted">{generatedDays.length || 3} days</Badge></CardHeader><CardContent className={styles.timeline}>{generatedDays.length > 0 ? generatedDays.map((day, index) => <ItineraryDay key={`${day.day}-${index}`} day={String(day.day || index + 1).padStart(2, "0")} date={day.date ? formatDate(day.date) : index === 0 ? firstDate : `Day ${index + 1}`} title={day.title || `Day ${index + 1}`} detail={[day.detail, day.conditions, day.route].filter(Boolean).join(" ")} icon={index === 0 ? Plane : dayTwoIcon} />) : <><ItineraryDay day="01" date={firstDate} title="Arrive & get oriented" detail={`Settle in around ${draft.destination}. Keep the first block light while you confirm local conditions and logistics.`} icon={Plane} /><ItineraryDay day="02" date={draft.startDate ? "Next day" : "Day 2"} title="Make space for the main activity" detail={`A good day for ${activityLabel}. The planner will attach conditions, route details, and what to bring.`} icon={dayTwoIcon} /><ItineraryDay day="03" date={lastDate} title="Buffer & head home" detail="Keep a flexible buffer for weather, closures, recovery, or a slower route back." icon={Clock3} /></>}</CardContent></Collapsible></Card><aside className={styles.workspaceRail}><Card className={styles.prepCard}><CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>Preparation list</p><CardTitle>Things to verify</CardTitle></div><ListChecks size={19} className={styles.mutedIcon} /></CardHeader><CardContent className={styles.prepContent}><div className={styles.checklist}>{preparation.length > 0 ? preparation.map((item, index) => <label key={`${item.title}-${index}`}><input type="checkbox" /> {item.title || "Preparation item"}{item.detail ? <small>{item.detail}</small> : null}</label>) : <><label><input type="checkbox" /> Confirm destination and dates</label><label><input type="checkbox" /> Check entry or vaccination requirements</label><label><input type="checkbox" /> Pack for weather, UV, and terrain</label><label><input type="checkbox" /> Save an offline route and emergency contact</label></>}</div></CardContent></Card></aside></div>
  </div>;
}

function PlanBuildScreen({ draft, agentName, stage, error, onRetry, onBack }: { draft: PlanDraft; agentName: string; stage?: string; error?: string | null; onRetry?: () => void; onBack: () => void }) {
  const failed = Boolean(error);
  const stageLabel = stage ? stage.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Starting";
  return <div className={styles.planBuildPage} aria-live="polite">
    <Card className={styles.planBuildCard}>
      <CardContent>
        <div className={styles.planBuildIcon}><Sparkles size={22} aria-hidden="true" /></div>
        <p className={styles.eyebrow}><span aria-hidden="true">✦</span> {agentName} travel planning</p>
        <h1>{failed ? "Travel research could not finish" : "Building your preparation plan"}</h1>
        <p className={styles.planBuildCopy}>{failed ? `The agent did not produce a complete, source-linked trip for ${draft.destination}.` : `The agent is shaping your itinerary for ${draft.destination}, then preparing the conditions and safety details you’ll want before you go.`}</p>
        <p className={styles.planBuildStage}>{failed ? "Pipeline status: Failed" : stageLabel}</p>
        {failed ? <p className={styles.planBuildError} role="alert">{error}</p> : <div className={styles.planBuildSteps}>
          <div className={styles.planBuildStep}><span className={styles.planBuildSpinner} aria-hidden="true" /><div><strong>Building the trip shape</strong><span>{draft.startDate || draft.endDate ? formatRange(draft.startDate, draft.endDate) : "Flexible dates"} · {draft.pace} pace</span></div></div>
          <div className={styles.planBuildStep}><span className={styles.planBuildDot} aria-hidden="true" /><div><strong>Preparing current-condition research</strong><span>Weather, UV, altitude, health, water, and route context</span></div></div>
          <div className={styles.planBuildStep}><span className={styles.planBuildDot} aria-hidden="true" /><div><strong>Assembling the itinerary output</strong><span>Source-linked preparation prompts for review</span></div></div>
        </div>}
        {failed && onRetry && <Button variant="secondary" onClick={onRetry}>Retry research</Button>}
        {failed && <button className={styles.backButton} type="button" onClick={onBack}>Back to trips</button>}
      </CardContent>
    </Card>
  </div>;
}

type Props = Readonly<{ userName: string; userImage: string }>;

export function RoutesPage({ userName, userImage }: Props) {
  const { name: agentName } = useAgentIdentity();
  const [routeTripId, setRouteTripId] = useState<string | null>(() => tripIdFromPath());
  const [view, setView] = useState<View>(() => routeTripId ? "plan" : "overview");
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [saved, setSaved] = useState(false);
  const [planBuilding, setPlanBuilding] = useState(false);
  const [planBuildStage, setPlanBuildStage] = useState<string | undefined>();
  const [planBuildError, setPlanBuildError] = useState<string | null>(null);
  const [collection, setCollection] = useState<TripCollection>(emptyCollection);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [studyMeStatus, setStudyMeStatus] = useState<InsightGatheringStatus | null>(null);
  const [studyMeStatusLoading, setStudyMeStatusLoading] = useState(true);
  const openingTripId = useRef<string | null>(null);
  const initials = useMemo(() => initialsFor(userName), [userName]);

  useEffect(() => {
    let cancelled = false;
    const loadStudyMeStatus = async () => {
      try {
        const response = await proxyFetch("/agent/insights/gather/login-status");
        if (!response.ok) {
          if (!cancelled) setStudyMeStatus(null);
          return;
        }
        const next = await response.json() as InsightGatheringStatus;
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
      if (response.ok) setCollection(await response.json() as TripCollection);
    } catch {
      // Keep a truthful empty state when Drive is unavailable.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTrips(); }, []);

  async function syncTrips() {
    setSyncing(true);
    try {
      const response = await proxyFetch("/agent/trips/sync", { method: "POST" });
      if (response.ok) { setCollection(await response.json() as TripCollection); setSyncMessage(null); }
      else {
        const payload = await response.json().catch(() => null) as { detail?: string } | null;
        setSyncMessage(payload?.detail || "Complete Study Me before refreshing the trip library.");
        await loadTrips();
      }
    } catch {
      setSyncMessage("The trip library could not be reached. Try again when you’re ready.");
      await loadTrips();
    } finally {
      setSyncing(false);
    }
  }

  async function submitDraft(next: PlanDraft) {
    setDraft(next);
    setSaved(false);
    setPlanBuildError(null);
    setPlanBuilding(true);
    setPlanBuildStage("starting");
    setView("plan");
    try {
      const response = await proxyFetch("/agent/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "scratch", destination: next.destination, startDate: next.startDate || null, endDate: next.endDate || null, activities: next.activities, pace: next.pace }) });
      if (!response.ok) throw new Error("The trip could not be saved. Try again.");
      const payload = await response.json() as { trip?: TripRecord };
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

  async function openTrip(trip: TripRecord) {
    openingTripId.current = trip.id;
    setTripPath(trip.id);
    setRouteTripId(trip.id);
    setDraft(draftFromTrip(trip));
    setSaved(true);
    setPlanBuildError(null);
    setView("plan");
    if (trip["agent-pipeline"] === "complete" && trip["agent-pipeline-output"] && hasSourceLinkedRecommendations(trip["agent-pipeline-output"])) {
      setPlanBuilding(false);
      return;
    }
    setPlanBuilding(true);
    setPlanBuildStage(trip["agent-pipeline-stage"] || "starting");
    await processTripPipeline(trip);
  }

  useEffect(() => {
    if (loading || !routeTripId || draft?.id === routeTripId || openingTripId.current === routeTripId) return;
    const trip = collection.trips.find((candidate) => candidate.id === routeTripId);
    if (!trip) {
      setTripPath(undefined, true);
      setRouteTripId(null);
      setView("overview");
      return;
    }
    void openTrip(trip);
  }, [collection, draft?.id, loading, routeTripId]);

  useEffect(() => {
    const handlePopState = () => {
      const nextTripId = tripIdFromPath();
      openingTripId.current = null;
      setRouteTripId(nextTripId);
      if (!nextTripId) {
        setDraft(null);
        setSaved(false);
        setPlanBuilding(false);
        setPlanBuildError(null);
        setPlanBuildStage(undefined);
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
    setPlanBuildStage(undefined);
    setView("overview");
  }

  async function processTripPipeline(trip: TripRecord): Promise<boolean> {
    setPlanBuildError(null);
    try {
      const response = await proxyFetch(`/agent/trips/${encodeURIComponent(trip.id)}/pipeline`, { method: "POST" });
      if (!response.ok) throw new Error("The travel-planning pipeline could not be started.");
      const payload = await response.json() as { id?: string | null; status?: string; stage?: string; trip?: TripRecord; error?: string };
      if (payload.trip) setDraft(draftFromTrip(payload.trip));
      setPlanBuildStage(payload.stage || payload.trip?.["agent-pipeline-stage"] || payload.status);
      if (!payload.id) {
        if (payload.status === "complete" && payload.trip?.["agent-pipeline-output"]) return true;
        throw new Error(payload.error || "The pipeline returned no run to poll.");
      }

      let status = payload.status || "queued";
      let latest = payload;
      while (status !== "complete" && status !== "failed") {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        const pollResponse = await proxyFetch(`/agent/trips/${encodeURIComponent(trip.id)}/pipeline/${encodeURIComponent(payload.id)}`);
        if (!pollResponse.ok) throw new Error("The travel-planning pipeline status could not be read.");
        latest = await pollResponse.json() as { status?: string; stage?: string; trip?: TripRecord; error?: string };
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

  function retryPlanBuild() {
    if (!draft?.id) return;
    setPlanBuildError(null);
    setPlanBuilding(true);
    setPlanBuildStage("retrying");
    void processTripPipeline({ id: draft.id, kind: draft.kind, destination: draft.destination, startDate: draft.startDate, endDate: draft.endDate, activities: draft.activities, pace: draft.pace, phase: "current" });
  }

  const overviewProps = { agentName, studyMeStatus, studyMeStatusLoading, collection, loading, syncing, syncMessage, onSync: () => void syncTrips(), onOpen: openTrip, onCreatePlan: (next: PlanDraft) => void submitDraft(next) };
  return <><AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle="Trips" /><PageShell>{view === "overview" ? <Overview {...overviewProps} /> : draft ? planBuilding || planBuildError ? <PlanBuildScreen draft={draft} agentName={agentName} stage={planBuildStage} error={planBuildError} onRetry={retryPlanBuild} onBack={showOverview} /> : <Workspace draft={draft} saved={saved} onBack={showOverview} /> : <Overview {...overviewProps} />}</PageShell><FloatingAssistant /></>;
}
