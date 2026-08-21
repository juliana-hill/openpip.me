import { CalendarDays, CheckSquare } from "lucide-react";
import styles from "./TodayAtAGlanceCard.module.css";

export function TodayAtAGlanceCard({ events = 0, tasks = 0 }: Readonly<{ events?: number; tasks?: number }>) {
  return <section className={styles.card} aria-labelledby="glance-title">
    <p className={styles.label} id="glance-title">Today</p>
    <div className={styles.stat}><CalendarDays size={20} /><div><strong>{events}</strong><span>events scheduled</span></div></div>
    <div className={styles.stat}><CheckSquare size={20} /><div><strong>{tasks}</strong><span>tasks remaining</span></div></div>
  </section>;
}
