import { Building2 } from "lucide-react";
import type { Job, JobStatus } from "@/types/career";
import styles from "./JobCard.module.css";

type JobCardProps = Readonly<{
  job: Job;
  onClick?: (job: Job) => void;
}>;

const STATUS_CLASS: Record<JobStatus, string> = {
  saved: styles.statusSaved,
  applied: styles.statusApplied,
  interviewing: styles.statusInterviewing,
  offer: styles.statusOffer,
  closed: styles.statusClosed,
  rejected: styles.statusRejected,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""} ago`;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const handleClick = () => {
    if (onClick) { onClick(job); return; }
    window.open(`/career/jobs/${job.id}`, "_blank");
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      {/* Row 1: Icon + Title/Company + Status badge */}
      <div className={styles.row}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrap}>
            <Building2 style={{ width: 16, height: 16 }} />
          </div>
          <div className={styles.textStack}>
            <h4 className={styles.role}>{job.role}</h4>
            <p className={styles.company}>{job.company}</p>
          </div>
        </div>
        <span className={`${styles.statusBadge} ${STATUS_CLASS[job.status]}`}>
          {job.status}
        </span>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerMeta}>Added {timeAgo(job.addedAt)}</p>
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={styles.viewLink}
          >
            View Details
          </a>
        ) : (
          <button type="button" className={styles.viewLink}>
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
