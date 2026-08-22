import type { TaskSource } from "@/types/tasks";

const SOURCE_STYLES: Record<TaskSource, { background: string; color: string }> = {
  "google": { background: "color-mix(in srgb, #34d399 15%, var(--color-bg))", color: "#34d399" },
};

const SOURCE_LABELS: Record<TaskSource, string> = {
  "google": "Google",
};

export function SourceBadge({ source }: { source: TaskSource }) {
  const s = SOURCE_STYLES[source];
  return (
    <span style={{ ...s, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
      {SOURCE_LABELS[source]}
    </span>
  );
}
