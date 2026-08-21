import { Button } from "@/components/ui/button";
import { CalendarDays, Inbox, ListChecks, Map, Plane, Settings } from "lucide-react";
import { DailyBriefingCard } from "@/components/dashboard/DailyBriefingCard";
import { DashboardNavCard } from "@/components/dashboard/DashboardNavCard";
import { TodayAtAGlanceCard } from "@/components/dashboard/TodayAtAGlanceCard";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Open Performance Improvement Plan</p>
          <h1>Good morning, Juliana.</h1>
        </div>
        <Button variant="secondary">Settings</Button>
      </header>

      <section className="dashboard-grid" aria-label="Daily briefing and workspace navigation">
        <DailyBriefingCard briefing="Three items need your judgment. Nothing has been sent, scheduled, or changed." generatedAt="Generated just now" />
        <TodayAtAGlanceCard events={4} tasks={7} />
        <DashboardNavCard href="/review" title="Review queue" metric="3 items" description="Drafts and proposals waiting for your decision." icon={ListChecks} accent />
        <DashboardNavCard href="/inbox" title="Inbox" metric="12 unread" description="Triage messages and prepare thoughtful replies." icon={Inbox} />
        <DashboardNavCard href="/calendar" title="Calendar" metric="4 events" description="See today’s schedule and proposed changes." icon={CalendarDays} />
        <DashboardNavCard href="/travel" title="Business travel" metric="Plan with your agent" description="Coordinate professional trips and prepare approval-gated travel actions." icon={Plane} />
        <DashboardNavCard href="/settings" title="Connections" metric="1 workspace" description="Manage accounts, permissions, and agent preferences." icon={Settings} />
      </section>
    </main>
  );
}
