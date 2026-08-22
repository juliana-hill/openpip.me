"use client";

import { TaskRow } from "./TaskRow";
import { CalendarEventRow } from "./CalendarEventRow";
import type { Task, ActiveTask, TaskSection } from "@/types/tasks";
import skeletonStyles from "@/components/ui/Skeleton.module.css";
import sectionStyles from "./TaskList.module.css";

function SectionBlock({ section, activeTask, onFlag, onComplete }: {
  section: TaskSection;
  activeTask: ActiveTask | null;
  onFlag: (task: Task) => void;
  onComplete: (taskId: string) => Promise<void>;
}) {
  const isAsap = section.label === "ASAP (Unscheduled)";
  const isToday = section.label === "Today";
  const isTomorrow = section.label === "Tomorrow";
  const cls = [
    isAsap ? sectionStyles.sectionAsap : "",
    isToday ? sectionStyles.sectionToday : "",
    isTomorrow ? sectionStyles.sectionTomorrow : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls} style={{ borderRadius: "var(--radius-lg)", paddingLeft: 12, paddingRight: 12, paddingBottom: 12 }}>
      <p style={{
        fontSize: "10px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "var(--color-text-muted)",
        marginBottom: "16px",
        padding: "12px 8px 0 8px",
      }}>
        {section.label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {section.items.map((item, i) => item.kind === "event" ? (
          <div key={`event-${item.data.id}`} style={{ animationDuration: "300ms", animationDelay: `${i * 40}ms` }}>
            <CalendarEventRow event={item.data} />
          </div>
        ) : (
          <div key={`task-${item.data.id}`} style={{ animationDuration: "300ms", animationDelay: `${i * 40}ms` }}>
            <TaskRow
              task={item.data}
              isActive={activeTask?.task.id === item.data.id}
              onFlag={onFlag}
              onComplete={onComplete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type TaskListProps = Readonly<{
  sections: TaskSection[];
  loading: boolean;
  activeTask: ActiveTask | null;
  onFlag: (task: Task) => void;
  onComplete: (taskId: string) => Promise<void>;
}>;

export function TaskList({ sections, loading, activeTask, onFlag, onComplete }: TaskListProps) {
  if (loading) {
    return (
      <div style={{ gridColumn: "span 12", width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
        {[1, 2, 3].map((i) => <div key={i} className={skeletonStyles.skeleton} style={{ height: "64px", borderRadius: "var(--radius-lg)" }} />)}
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div style={{ gridColumn: "span 12", width: "100%", minWidth: 0 }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", textAlign: "center", padding: "64px 0" }}>
          You&apos;re all caught up. Enjoy the space.
        </p>
      </div>
    );
  }

  return (
    <div style={{ gridColumn: "span 12", width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
      {sections.map((section) => (
        <SectionBlock key={section.label} section={section} activeTask={activeTask} onFlag={onFlag} onComplete={onComplete} />
      ))}
    </div>
  );
}
