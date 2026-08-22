import type { Priority } from "@/types/tasks";

const PRIORITY_STYLES: Record<Priority, { background: string; color: string }> = {
  ASAP:   { background: "color-mix(in srgb, #f87171 15%, var(--color-bg))", color: "#f87171" },
  HIGH:   { background: "color-mix(in srgb, #fbbf24 15%, var(--color-bg))", color: "#fbbf24" },
  MEDIUM: { background: "var(--color-accent-light)", color: "var(--color-accent)" },
  LOW:    { background: "var(--color-border)", color: "var(--color-text-muted)" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span style={{ ...s, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 4 }}>
      {priority}
    </span>
  );
}
