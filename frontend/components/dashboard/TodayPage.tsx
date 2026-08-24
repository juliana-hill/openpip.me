"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { proxyFetch } from "@/lib/proxy";
import { useAgentIdentity } from "@/lib/agentIdentity";
import styles from "./TodayPage.module.css";

type Task = { title: string; priority: number; source: "google" };
type Event = { title: string; time: string; color: string };

export function TodayPage({ userName, userImage }: { userName: string; userImage: string }) {
  const { name: agentName } = useAgentIdentity();
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const today = new Date().toDateString();
    // en-CA gives YYYY-MM-DD in the browser's local time zone — toISOString()
    // is UTC and can land on the wrong calendar day entirely for a user not
    // on UTC (e.g. still "today" locally but already tomorrow in UTC).
    const date = new Date().toLocaleDateString("en-CA");
    const localTaskDate = (dateStr: string | null | undefined): Date | null => {
      if (!dateStr) return null;
      const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr);
      if (Number.isNaN(parsed.getTime())) return null;
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    };
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    type RawTask = { name?: string; title?: string; priority?: number; scheduledStartTime?: string; dueDate?: string };
    type Calendar = { color?: string; events?: { title: string; start: string }[] };
    Promise.all([
      proxyFetch("/agent/google/tasks"),
      proxyFetch(`/agent/calendars?days=1&from=${date}`),
      // Not date-scoped — unread mail from before today is still unread.
      proxyFetch("/agent/inbox/count"),
    ])
      .then(async ([googleResponse, calendarResponse, inboxResponse]) => {
        const google = googleResponse.ok ? ((await googleResponse.json()).tasks ?? []) as RawTask[] : [];
        const calendar = calendarResponse.ok ? await calendarResponse.json() as { calendars?: Calendar[] } : { calendars: [] };
        const inbox = inboxResponse.ok ? await inboxResponse.json() as { unread?: number } : {};
        const loadedTasks: Task[] = google
          .filter((task) => {
            const dueDate = localTaskDate(task.dueDate);
            return dueDate != null && dueDate.getTime() <= todayMidnight.getTime();
          })
          .map((task) => ({ title: task.name ?? task.title ?? "Untitled", priority: task.priority ?? 4, source: "google" as const }));
        const loadedEvents = (calendar.calendars ?? []).flatMap((calendarItem) => (calendarItem.events ?? [])
          .filter((event) => event.start && (event.start.includes("T") ? new Date(event.start).toDateString() === today : event.start === date))
          .map((event) => ({ title: event.title, time: event.start.includes("T") ? new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "All day", color: calendarItem.color ?? "var(--color-accent)" })))
          .sort((a, b) => a.time.localeCompare(b.time));
        if (!active) return;
        setTasks(loadedTasks);
        setEvents(loadedEvents);
        setUnreadCount(inbox.unread ?? 0);
      })
      .catch(() => { if (active) setError("Today's information could not be refreshed. Try again in a moment."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className={styles.shell}>
    <AppHeader userImage={userImage} userName={userName} initials={initials} backHref="/" backLabel="Home" />
    <main className={styles.page}>
      <div className={styles.heading}><p className={styles.eyebrow}>Agent view</p><h1>Today</h1><p>Your commitments and work in one place. Calendar and task tools remain available when you need to manage them manually.</p></div>
      {error ? <section className={styles.error}>{error}</section> : loading ? <div className={styles.loading}><div /><div /></div> : <div className={styles.board}>
        <section className={`${styles.card} ${styles.schedule}`}><div className={styles.cardHead}><h2>Schedule</h2><Link href="/calendar">Open calendar →</Link></div>{events.length ? events.map((event, index) => <div className={styles.row} key={`${event.title}-${index}`}><span className={styles.dot} style={{ background: event.color }} /><span>{event.title}</span><time>{event.time}</time></div>) : <p className={styles.empty}>No events scheduled today.</p>}</section>
        <section className={`${styles.card} ${styles.tasks}`}><div className={styles.cardHead}><h2>Tasks</h2><Link href="/tasks">Open tasks →</Link></div><p className={styles.taskMetric}>{tasks.length} Google task{tasks.length === 1 ? "" : "s"}</p><p className={styles.taskHint}>Overdue or due today, from your connected Google Tasks account.</p>{tasks.length ? tasks.map((task, index) => <div className={styles.row} key={`${task.title}-${index}`}><span className={`${styles.checkbox} ${task.priority <= 2 ? styles.highPriority : ""}`} /><span>{task.title}</span><b>Google</b></div>) : <p className={styles.empty}>Nothing needs your attention today.</p>}</section>
        <Link href="/inbox" className={`${styles.card} ${styles.inbox}`}>
          <div className={styles.cardHead}><h2>Inbox</h2><span>Open inbox →</span></div>
          <p className={styles.inboxMetric}>{unreadCount == null ? "…" : unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}</p>
          {unreadCount && unreadCount > 0 ? <p className={styles.inboxHint}>Messages waiting for your attention.</p> : <p className={styles.inboxHint}>No unread messages right now.</p>}
        </Link>
      </div>}
    </main>
    <FloatingAssistant />
  </div>;
}
