import Link from "next/link";
import { CalendarDays, Inbox, ListChecks, Network, Plane, Settings } from "lucide-react";
import { AgentBrand } from "@/components/AgentBrand";
import { DemoBriefingCard } from "@/components/dashboard/DemoBriefingCard";
import { DashboardNavCard } from "@/components/dashboard/DashboardNavCard";
import { TodayAtAGlanceCard } from "@/components/dashboard/TodayAtAGlanceCard";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <AgentBrand />
          <h1>Good morning, Juliana.</h1>
        </div>
        <Link href="/settings" className="settings-link">Settings</Link>
      </header>

      <section className="dashboard-grid" aria-label="Daily briefing and workspace navigation">
        <DemoBriefingCard />
        <TodayAtAGlanceCard events={4} tasks={7} />
        <DashboardNavCard href="/review" title="Review queue" metric="3 items" description="Drafts and proposals waiting for your decision." icon={ListChecks} accent />
        <DashboardNavCard href="/inbox" title="Inbox" metric="12 unread" description="Triage messages and prepare thoughtful replies." icon={Inbox} />
        <DashboardNavCard href="/calendar" title="Calendar" metric="4 events" description="See today’s schedule and proposed changes." icon={CalendarDays} />
        <DashboardNavCard href="/travel" title="Business travel" metric="Plan with your agent" description="Coordinate professional trips and prepare approval-gated travel actions." icon={Plane} />
        <DashboardNavCard href="/settings" title="Connections" metric="1 workspace" description="Manage accounts, permissions, and agent preferences." icon={Settings} />
        <DashboardNavCard href="/contacts" title="Contacts" metric="Relationship memory" description="Keep lightweight context grounded in real communication history." icon={Network} />
      </section>
    </main>
  );
}
