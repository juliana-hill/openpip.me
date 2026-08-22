import { CalendarDays, CheckSquare } from "lucide-react";
import styles from "./TodayAtAGlanceCard.module.css";

type Props = Readonly<{
  totalEvents: number;
  tasksRemaining: number;
  completedCount: number;
  completionScope: "today" | "all";
}>;

export function TodayAtAGlanceCard({ totalEvents, tasksRemaining, completedCount, completionScope }: Props) {
  const total = tasksRemaining + completedCount;
  const completionPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className={styles.card}>
      <div className={styles.body}>
        <p className={styles.sectionLabel}>Today</p>

        <div className={styles.statRow}>
          <CalendarDays size={20} color="var(--color-accent)" style={{ flexShrink: 0 }} />
          <div>
            <p className={styles.statNumber}>{totalEvents}</p>
            <p className={styles.statLabel}>event{totalEvents !== 1 ? "s" : ""} scheduled</p>
          </div>
        </div>

        <div className={styles.statRow}>
          <CheckSquare size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div>
            <p className={styles.statNumber}>{tasksRemaining}</p>
            <p className={styles.statLabel}>task{tasksRemaining !== 1 ? "s" : ""} remaining</p>
          </div>
        </div>

      </div>

      <div className={styles.footer}>
        <div className={styles.completionHeader}>
          <p className={styles.sectionLabel}>Completion ({completionScope})</p>
          <p className={styles.completionPct}>{completionPct}%</p>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${completionPct}%` }} />
        </div>
      </div>
    </div>
  );
}
