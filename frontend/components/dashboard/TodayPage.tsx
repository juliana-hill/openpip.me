"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { proxyFetch } from "@/lib/proxy";
import { useAgentIdentity } from "@/lib/agentIdentity";
import styles from "./TodayPage.module.css";

type Task = { title: string; priority: number; source: "google" };

export function TodayPage({ userName, userImage }: { userName: string; userImage: string }) {
  const { name: agentName } = useAgentIdentity();
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const today = new Date().toDateString();
    type RawTask = { name?: string; title?: string; priority?: number; scheduledStartTime?: string; dueDate?: string };
    proxyFetch("/agent/google/tasks")
      .then(async (googleResponse) => {
        const google = googleResponse.ok ? ((await googleResponse.json()).tasks ?? []) as RawTask[] : [];
        const loadedTasks: Task[] = [
          ...google.filter((task) => task.dueDate && new Date(task.dueDate).toDateString() === today).map((task) => ({ title: task.name ?? task.title ?? "Untitled", priority: task.priority ?? 4, source: "google" as const })),
        ];
        if (!active) return;
        setTasks(loadedTasks);
      })
      .catch(() => { if (active) setError("Today's information could not be refreshed. Try again in a moment."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className={styles.shell}>
    <AppHeader userImage={userImage} userName={userName} initials={initials} backHref="/" backLabel="Home" />
    <main className={styles.page}>
      <div className={styles.heading}><p className={styles.eyebrow}>Agent view</p><h1>Today</h1><p>Google Tasks due today, from your connected Google Workspace account.</p></div>
      {error ? <section className={styles.error}>{error}</section> : loading ? <div className={styles.loading}><div /><div /></div> : <div className={styles.board}>
        <section className={`${styles.card} ${styles.tasks}`}><div className={styles.cardHead}><h2>Tasks</h2><Link href="/tasks">Open tasks →</Link></div>{tasks.length ? tasks.map((task, index) => <div className={styles.row} key={`${task.title}-${index}`}><span className={`${styles.checkbox} ${task.priority <= 2 ? styles.highPriority : ""}`} /><span>{task.title}</span><b>Google</b></div>) : <p className={styles.empty}>Nothing needs your attention today.</p>}</section>
      </div>}
    </main>
    <FloatingAssistant />
  </div>;
}
