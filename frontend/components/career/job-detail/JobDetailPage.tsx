"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Job, JobStatus } from "@/types/career";
import { Trash2, EyeOff } from "lucide-react";
import { JobHeader } from "./JobHeader";
import { JobStatusBar } from "./JobStatusBar";
import { JobDescription } from "./JobDescription";
import { JobOverlaps } from "./JobOverlaps";
import { JobNotes } from "./JobNotes";
import { JobContacts } from "./JobContacts";
import { JobResumeReview } from "./JobResumeReview";
import { JobCoverLetter } from "./JobCoverLetter";
import { JobAppQuestions } from "./JobAppQuestions";
import btnStyles from "@/components/ui/Button.module.css";
import styles from "./JobDetailPage.module.css";

type JobDetailPageProps = Readonly<{ jobId: string }>;

export function JobDetailPage({ jobId }: JobDetailPageProps) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    proxyFetch("/agent/career/jobs")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { jobs?: Job[] } | null) => {
        const found = data?.jobs?.find((j) => j.id === jobId) ?? null;
        if (!found) setNotFound(true);
        else setJob(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [jobId]);

  const patch = useCallback(async (update: Partial<Job>) => {
    setJob((prev) => prev ? { ...prev, ...update } : prev);
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    }).catch(() => {});
  }, [jobId]);

  const handleDelete = useCallback(async () => {
    await proxyFetch(`/agent/career/jobs/${jobId}`, { method: "DELETE" }).catch(() => {});
    router.push("/career");
  }, [jobId, router]);

  const handleSkipCompany = useCallback(async () => {
    if (!job) return;
    await proxyFetch("/agent/career/skip-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: job.company }),
    }).catch(() => {});
    router.push("/career");
  }, [job, router]);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (notFound || !job) return <div className={styles.loading}>Job not found.</div>;

  return (
    <div className={styles.page}>
      {/* Sticky top: breadcrumb + header + status bar */}
      <div className={styles.stickyTop}>
        <JobHeader job={job} onPatch={patch} />
        <JobStatusBar
          status={job.status}
          onStatusChange={(status: JobStatus) => patch({ status })}
        />
      </div>

      {/* Dashboard grid */}
      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.left}>
          <JobDescription job={job} onPatch={patch} />
          {job.jd && (
            <JobOverlaps job={job} onPatch={patch} />
          )}
          {job.jd && job.overlaps && (
            <JobResumeReview job={job} onPatch={patch} />
          )}
          {job.jd && job.refinements && (
            <JobCoverLetter job={job} onPatch={patch} />
          )}
        </div>

        {/* Right column */}
        <div className={styles.right}>
          <JobNotes job={job} onPatch={patch} />
          <JobContacts job={job} />
          {!!((job as Record<string, unknown>).coverLetter) && job.refinements && (
            <JobAppQuestions job={job} onPatch={patch} />
          )}
          <div className={styles.dangerZone}>
            <button type="button" className={`${btnStyles.btn} ${btnStyles.danger} ${btnStyles.sm}`} onClick={handleDelete}>
              <Trash2 size={13} /> Delete job
            </button>
            <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={handleSkipCompany}>
              <EyeOff size={13} /> Skip company
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
