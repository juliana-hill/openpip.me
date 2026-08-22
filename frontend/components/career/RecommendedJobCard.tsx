import { ExternalLink, Bookmark } from "lucide-react";
import { TrippyIcon } from "@/components/TrippyIcon";
import { useState, useEffect } from "react";
import { useAgentIdentity } from "@/lib/agentIdentity";
import type { Job } from "@/types/career";
import styles from "./RecommendedJobCard.module.css";

type RecommendedJobCardProps = Readonly<{
  loading: boolean;
  recommendation: { company: string; role: string; why: string; url?: string } | null;
  savedJobs: Job[];
  onAddToBoard: (job: Pick<Job, "company" | "role" | "url">) => void;
  onFindPeople: (company: string, role: string) => void;
}>;

export function RecommendedJobCard({ loading, recommendation, savedJobs, onAddToBoard }: RecommendedJobCardProps) {
  const { name: agentName } = useAgentIdentity();
  const alreadySaved = recommendation
    ? savedJobs.some((j) => j.company === recommendation.company && j.role === recommendation.role)
    : false;
  const [bookmarked, setBookmarked] = useState(alreadySaved);
  useEffect(() => { if (alreadySaved) setBookmarked(true); }, [alreadySaved]);

  return (
    <div className={styles.card}>
      <div className={styles.topAccent} />

      <div className={styles.header}>
        <TrippyIcon sizeClass="h-10 w-10" />
        <div>
          <p className={styles.headerLabel}>{agentName}&apos;s Pick</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.skeletonStack}>
          <div className={styles.skel} style={{ height: 20, width: 128 }} />
          <div className={styles.skel} style={{ height: 28, width: 256 }} />
          <div className={styles.skel} style={{ height: 16, width: "100%" }} />
          <div className={styles.skel} style={{ height: 16, width: "85%" }} />
        </div>
      ) : recommendation ? (
        <div className={styles.body}>
          <div className={styles.titleRow}>
            <div className={styles.titleGroup}>
              <p className={styles.companyLabel}>{recommendation.company}</p>
              <p className={styles.roleRow}>
                {recommendation.role}
                {recommendation.url && (
                  <a href={recommendation.url} target="_blank" rel="noopener noreferrer" className={styles.extLink}>
                    <ExternalLink style={{ width: 16, height: 16 }} />
                  </a>
                )}
              </p>
            </div>
            <button
              type="button"
              title={bookmarked ? "Added to board" : "Add to board"}
              onClick={() => { if (!bookmarked) { onAddToBoard({ company: recommendation.company, role: recommendation.role, url: recommendation.url }); setBookmarked(true); } }}
              className={styles.bookmarkBtn}
            >
              <Bookmark
                style={{
                  width: 20,
                  height: 20,
                  fill: bookmarked ? "#f47560" : "none",
                  color: bookmarked ? "#f47560" : "var(--color-text-muted)",
                  opacity: bookmarked ? 1 : 0.5,
                }}
              />
            </button>
          </div>
          <p className={styles.why}>{recommendation.why}</p>
        </div>
      ) : (
        <div className={styles.empty}>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }}>
            Chat with {agentName} to get a personalised job recommendation based on your profile.
          </p>
          <div className={styles.emptyHint}>
            <TrippyIcon sizeClass="h-4 w-4" />
            <p className={styles.emptyHintLabel}>Start below to build your profile</p>
          </div>
        </div>
      )}
    </div>
  );
}
