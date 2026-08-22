import styles from "./SavedInsightCard.module.css";

type InsightData = {
  id?: string;
  type?: string;
  value?: unknown;
  loosely_held?: boolean;
  note?: string;
};

/** Renders a saved insight as a structured card instead of raw JSON. */
export function SavedInsightCard({ detail, label }: { detail: string; label?: string }) {
  // Try to parse as JSON first (for legacy data that has stringified insight objects)
  let insight: InsightData | null = null;
  try {
    const jsonMatch = detail.match(/\{[\s\S]*\}/);
    if (jsonMatch) insight = JSON.parse(jsonMatch[0]) as InsightData;
  } catch { /* not valid JSON — use label/detail directly */ }

  // If we parsed a full insight object, use its fields
  if (insight?.type) {
    const typeLabel = insight.type.replace(/_/g, " ");
    const valueText = Array.isArray(insight.value)
      ? insight.value.join(", ")
      : typeof insight.value === "string"
        ? insight.value
        : JSON.stringify(insight.value);

    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.typeTag}>{typeLabel}</span>
          {insight.loosely_held && <span className={styles.looseTag}>loosely held</span>}
        </div>
        <p className={styles.value}>{valueText}</p>
        {insight.note && <p className={styles.note}>{insight.note}</p>}
      </div>
    );
  }

  // New format: label has the type, detail has the value text
  const typeFromLabel = label?.replace(/^Saved insight\s*—?\s*/i, "").trim();

  return (
    <div className={styles.card}>
      {typeFromLabel && (
        <div className={styles.header}>
          <span className={styles.typeTag}>{typeFromLabel}</span>
        </div>
      )}
      <p className={styles.value}>{detail}</p>
    </div>
  );
}
