import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { InsightGatheringStatus } from "@/components/dashboard/StudyMeCard";
import styles from "./RoutesPage.module.css";

type Props = Readonly<{
  agentName: string;
  status: InsightGatheringStatus | null;
  statusLoading: boolean;
  hasLibrary: boolean;
  building: boolean;
  onBuild: () => void;
}>;

export function TravelPlanningGateCard({ agentName, status, statusLoading, hasLibrary, building, onBuild }: Props) {
  const running = status?.state === "queued" || status?.state === "running";
  const ready = status?.state === "completed";
  const progress = Math.max(0, Math.min(100, status?.progress ?? 0));
  const title = running
    ? `Waiting for ${agentName} to finish studying you…`
    : statusLoading
      ? "Checking Study Me before travel planning starts"
      : ready
        ? hasLibrary ? "Your trip library is ready" : "Build your trip library"
        : "Study Me needs to finish first";
  const copy = running
    ? "Once the historical index is complete, I’ll organize your past, current, and future trips from that shared context."
    : statusLoading
      ? "Checking whether your indexed history is ready."
      : ready
        ? hasLibrary
          ? "Your saved trips are ready to review and prepare."
          : "Use the completed Study Me index as the starting point for a separate, read-only trip library."
        : "The trip library is gated until Study Me has finished building your indexed history.";

  return (
    <Card className={styles.travelGateCard} aria-live="polite">
      <CardContent className={styles.travelGateContent}>
        <div className={styles.travelGateCopy}>
          <p className={styles.eyebrow}><span aria-hidden="true">✦</span> {agentName} travel planning</p>
          <h2 className={styles.travelGateTitle}>{title}</h2>
          <p className={styles.travelGateDescription}>{copy}</p>
          {running && <p className={styles.travelGateMeta}>{status?.progress == null ? "Studying your history…" : `${progress}% complete`} · Trip planning is waiting</p>}
        </div>
        <div className={styles.travelGateActions}>
          {running || statusLoading ? (
            <div className={styles.travelGateWaiting}>
              {running && <div className={styles.travelGateProgress} aria-label="Trip planning is waiting for Study Me">
                <div className={styles.travelGateProgressFill} style={{ width: `${progress}%` }} />
              </div>}
              <span className={styles.travelGateActionLabel}>{running ? "Waiting for Study Me" : "Checking Study Me…"}</span>
            </div>
          ) : ready ? (
            <Button type="button" size="lg" onClick={onBuild} disabled={building}>
              {building ? "Building…" : hasLibrary ? "Refresh trip library" : "Build trip library"}
            </Button>
          ) : (
            <span className={styles.travelGateActionLabel}>Waiting for Study Me</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
