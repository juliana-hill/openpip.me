"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleHelp,
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
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { proxyFetch } from "@/lib/proxy";
import { useAgentIdentity } from "@/lib/agentIdentity";
import type { InsightGatheringStatus } from "@/components/dashboard/StudyMeCard";
import { TravelPlanningGateCard } from "./TravelPlanningGateCard";
import styles from "./RoutesPage.module.css";

type Activity = "city" | "hiking" | "road trip" | "camping" | "cycling" | "water";
type View = "overview" | "plan";
type Phase = "past" | "current" | "upcoming";

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

const starterSignals = [
  { icon: Sun, label: "Weather & UV", detail: "Forecast windows and sun exposure by day" },
  { icon: Mountain, label: "Altitude", detail: "Sleeping elevation and acclimatization prompts" },
  { icon: HeartPulse, label: "Health & entry", detail: "Vaccination, disease, and document guidance" },
  { icon: Droplets, label: "Water & conditions", detail: "Water availability, fire, and air quality" },
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
  const count = collection.trips.length;
  return (
    <Card className={styles.libraryCard}>
      <CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>Saved trip library</p><CardTitle>Past, current & upcoming</CardTitle><CardDescription className={styles.sectionDescription}>Built from your separate trip records. Nothing is booked here.</CardDescription></div><Button variant="ghost" size="sm" onClick={onSync} disabled={syncing || loading || !syncAllowed} aria-label="Refresh trip library from Study Me"><RefreshCw size={15} className={syncing ? styles.spin : ""} /> {syncing ? "Building" : "Refresh"}</Button></CardHeader>
      {syncMessage && <p className={styles.syncMessage} role="status">{syncMessage}</p>}
      <CardContent className={styles.libraryContent}>
        {loading ? <div className={styles.libraryLoading}><span className={styles.loadingBar} /><span className={styles.loadingBarShort} /></div> : count > 0 ? <div className={styles.tripGroups}><TripGroup phase="past" trips={collection.groups.past} onOpen={onOpen} /><TripGroup phase="current" trips={collection.groups.current} onOpen={onOpen} /><TripGroup phase="upcoming" trips={collection.groups.upcoming} onOpen={onOpen} /></div> : <div className={styles.emptyTrips}><div className={styles.emptyIcon}><CalendarDays size={22} /></div><div><h3>No saved trips yet</h3><p>{collection.pipeline?.state === "not_run" ? "After Study Me completes, refresh this library to organize trip context from the shared index." : "Build a plan from scratch or refresh the completed Study Me index."}</p></div></div>}
      </CardContent>
    </Card>
  );
}

function Overview({ agentName, studyMeStatus, studyMeStatusLoading, collection, loading, syncing, syncMessage, onSync, onOpen, onCreatePlan }: { agentName: string; studyMeStatus: InsightGatheringStatus | null; studyMeStatusLoading: boolean; collection: TripCollection; loading: boolean; syncing: boolean; syncMessage: string | null; onSync: () => void; onOpen: (trip: TripRecord) => void; onCreatePlan: (draft: PlanDraft) => void }) {
  const studyMeReady = studyMeStatus?.state === "completed";
  return <div className={styles.pageStack}>
    <section className={styles.intro}><div><p className={styles.eyebrow}>Trip readiness</p><h1>Know what to prepare before you go.</h1><p className={styles.introCopy}>Turn a destination or your indexed history into a practical plan with current conditions, route context, and preparation prompts.</p></div><div className={styles.introIcon} aria-hidden="true"><Compass size={30} /></div></section>
    <TravelPlanningGateCard agentName={agentName} status={studyMeStatus} statusLoading={studyMeStatusLoading} hasLibrary={collection.trips.length > 0} building={syncing} onBuild={onSync} />
    <div className={styles.entryGrid}>
      <Card className={`${styles.startCard} ${styles.primaryStart}`}><CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>Start from scratch</p><CardTitle>Plan another trip</CardTitle><CardDescription className={styles.sectionDescription}>Give us the shape of the trip. We’ll help you fill in the preparation details.</CardDescription></div></CardHeader><CardContent><PlanForm onSubmit={onCreatePlan} /></CardContent></Card>
      <div className={styles.sideStack}><TripLibrary collection={collection} loading={loading} syncing={syncing} syncMessage={syncMessage} onSync={onSync} onOpen={onOpen} syncAllowed={studyMeReady} /><Card className={styles.signalCard}><CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>What we’ll look at</p><CardTitle>Preparation, not reservations</CardTitle></div><ShieldAlert size={19} className={styles.mutedIcon} /></CardHeader><CardContent className={styles.signalList}>{starterSignals.map(({ icon: Icon, label, detail }) => <div className={styles.signalRow} key={label}><span className={styles.signalIcon}><Icon size={16} /></span><div><strong>{label}</strong><span>{detail}</span></div></div>)}</CardContent></Card></div>
    </div>
  </div>;
}

function PriorityAction({ icon: Icon, tone, title, detail }: { icon: typeof Sun; tone: string; title: string; detail: string }) {
  return <div className={`${styles.priorityAction} ${styles[tone]}`}><span className={styles.priorityIcon}><Icon size={17} /></span><div><strong>{title}</strong><p>{detail}</p></div></div>;
}

function ItineraryDay({ day, date, title, detail, icon: Icon }: { day: string; date: string; title: string; detail: string; icon: typeof Plane }) {
  return <div className={styles.dayRow}><div className={styles.dayRail}><span>{day}</span><i /></div><div className={styles.dayBody}><div className={styles.dayHeading}><div><span className={styles.dayDate}>{date}</span><h3>{title}</h3></div><Icon size={18} className={styles.dayIcon} /></div><p>{detail}</p><div className={styles.dayMeta}><span><Clock3 size={14} /> Flexible timing</span><span><MapPin size={14} /> Route details after research</span></div></div></div>;
}

function Workspace({ draft, saved, onBack }: { draft: PlanDraft; saved: boolean; onBack: () => void }) {
  const activityLabel = draft.activities.length > 0 ? draft.activities.join(", ") : "a flexible mix of activities";
  const firstDate = formatDate(draft.startDate);
  const lastDate = formatDate(draft.endDate || draft.startDate);
  const dayTwoIcon = draft.activities.includes("hiking") ? Mountain : draft.activities.includes("water") ? Droplets : Compass;
  return <div className={styles.pageStack}>
    <button className={styles.backButton} type="button" onClick={onBack}><ChevronLeft size={16} /> All trips</button>
    <section className={styles.workspaceHeader}><div><p className={styles.eyebrow}>{saved ? "Saved plan" : "Planning draft"}</p><h1>{draft.destination}</h1><div className={styles.workspaceMeta}><span><CalendarDays size={15} /> {draft.startDate || draft.endDate ? `${firstDate} – ${lastDate}` : "Dates to be decided"}</span><span><Compass size={15} /> {activityLabel}</span><Badge variant="muted">{draft.pace} pace</Badge></div></div><Button variant="secondary" onClick={onBack}><Plus size={16} /> New plan</Button></section>
    <div className={styles.researchNotice}><Sparkles size={18} /><div><strong>Research stays source-linked.</strong><p>Current weather, health, hazard, and route signals will be checked before you rely on this plan.</p></div><Button variant="ghost" size="sm" disabled>Research current conditions</Button></div>
    <section className={styles.prioritySection}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Before you go</p><h2>Start with the important parts</h2></div><Badge variant="warning">Draft</Badge></div><div className={styles.priorityGrid}><PriorityAction icon={Mountain} tone="coralTone" title="Confirm elevation" detail="Sleeping altitude will determine acclimatization guidance." /><PriorityAction icon={Sun} tone="goldTone" title="Check the exposure" detail="Weather and UV windows should shape each outdoor day." /><PriorityAction icon={ListChecks} tone="blueTone" title="Build the gear list" detail={`Starting from ${draft.pace.toLowerCase()} days and ${activityLabel}.`} /></div></section>
    <div className={styles.workspaceGrid}><Card className={styles.itineraryCard}><CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>Outline</p><CardTitle>A flexible itinerary</CardTitle><CardDescription className={styles.sectionDescription}>Shape first, then add verified places and route legs.</CardDescription></div><Badge variant="muted">3 days</Badge></CardHeader><CardContent className={styles.timeline}><ItineraryDay day="01" date={firstDate} title="Arrive & get oriented" detail={`Settle in around ${draft.destination}. Keep the first block light while you confirm local conditions and logistics.`} icon={Plane} /><ItineraryDay day="02" date={draft.startDate ? "Next day" : "Day 2"} title="Make space for the main activity" detail={`A good day for ${activityLabel}. The planner will attach conditions, route details, and what to bring.`} icon={dayTwoIcon} /><ItineraryDay day="03" date={lastDate} title="Buffer & head home" detail="Keep a flexible buffer for weather, closures, recovery, or a slower route back." icon={Clock3} /></CardContent></Card><aside className={styles.workspaceRail}><Card className={styles.prepCard}><CardHeader className={styles.sectionHeader}><div><p className={styles.eyebrow}>Preparation list</p><CardTitle>Things to verify</CardTitle></div><ListChecks size={19} className={styles.mutedIcon} /></CardHeader><CardContent className={styles.prepContent}><div className={styles.checklist}><label><input type="checkbox" /> Confirm destination and dates</label><label><input type="checkbox" /> Check entry or vaccination requirements</label><label><input type="checkbox" /> Pack for weather, UV, and terrain</label><label><input type="checkbox" /> Save an offline route and emergency contact</label></div></CardContent></Card><Card className={styles.sourceCard}><CardContent className={styles.sourceContent}><div className={styles.sourceCardTitle}><Sparkles size={16} /> Grounded research</div><p>Nova will show the sources behind current conditions and preparation advice.</p><span className={styles.sourceStatus}><span className={styles.statusDot} /> Sources will appear here</span></CardContent></Card></aside></div>
  </div>;
}

type Props = Readonly<{ userName: string; userImage: string }>;

export function RoutesPage({ userName, userImage }: Props) {
  const { name: agentName } = useAgentIdentity();
  const [view, setView] = useState<View>("overview");
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [saved, setSaved] = useState(false);
  const [collection, setCollection] = useState<TripCollection>(emptyCollection);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [studyMeStatus, setStudyMeStatus] = useState<InsightGatheringStatus | null>(null);
  const [studyMeStatusLoading, setStudyMeStatusLoading] = useState(true);
  const initials = useMemo(() => initialsFor(userName), [userName]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

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
        if (next.state === "queued" || next.state === "running") {
          timer = window.setTimeout(() => { void loadStudyMeStatus(); }, 1000);
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
    setView("plan");
    try {
      const response = await proxyFetch("/agent/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "scratch", destination: next.destination, startDate: next.startDate || null, endDate: next.endDate || null, activities: next.activities, pace: next.pace }) });
      if (response.ok) { setSaved(true); await loadTrips(); }
    } catch {
      // Keep the draft visible; it is not presented as saved when Drive is unavailable.
    }
  }

  function openTrip(trip: TripRecord) {
    const knownActivities = activities.map(({ value }) => value).filter((value) => trip.activities?.includes(value));
    setDraft({ id: trip.id, kind: trip.kind, destination: trip.destination, startDate: trip.startDate || "", endDate: trip.endDate || "", activities: knownActivities, pace: trip.pace || "Balanced" });
    setSaved(true);
    setView("plan");
  }

  const overviewProps = { agentName, studyMeStatus, studyMeStatusLoading, collection, loading, syncing, syncMessage, onSync: () => void syncTrips(), onOpen: openTrip, onCreatePlan: (next: PlanDraft) => void submitDraft(next) };
  return <><AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle="Trips" /><PageShell>{view === "overview" ? <Overview {...overviewProps} /> : draft ? <Workspace draft={draft} saved={saved} onBack={() => setView("overview")} /> : <Overview {...overviewProps} />}</PageShell><FloatingAssistant /></>;
}
