// Google Tasks' `due` date is a plain "YYYY-MM-DD" (see backend
// fetch_google_tasks: task.get("due","")[:10]). Parsing it as
// `new Date("YYYY-MM-DD")` reads it as UTC and shifts it a day earlier in
// western time zones — same local-calendar-date fix used in
// DashboardPage.tsx's dateUrgencyTier.
export function isTaskOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

// dueDate is "YYYY-MM-DD" (see Task type / backend fetch_google_tasks) —
// reformat directly from the string parts rather than through a Date, so
// there's no UTC-shift risk at all for a value that's purely cosmetic here.
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-");
  return `${month}-${day}-${year}`;
}

export function DueDateBadge({ dueDate }: { dueDate: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: "2px 6px",
        borderRadius: "var(--radius-pill)",
        background: "var(--color-border)",
        color: "var(--color-text-muted)",
        flexShrink: 0,
      }}
    >
      Due {formatDueDate(dueDate)}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span
      style={{
        background: "color-mix(in srgb, #f87171 15%, var(--color-bg))",
        color: "#f87171",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        padding: "2px 8px",
        borderRadius: 4,
        flexShrink: 0,
      }}
    >
      Overdue
    </span>
  );
}
