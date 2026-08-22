"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { AppHeader } from "@/components/app-header";
import { RecommendedJobCard } from "./RecommendedJobCard";
import { TimelineTile } from "./TimelineTile";
import { JobsBoard } from "./JobsBoard";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { CareerChatSessionModal } from "./CareerChatSessionModal";
import { idbListChatSessions, type ChatSession } from "@/lib/idb";
import { normalizeSkill } from "@/lib/skills";
import type { Job, JobStatus, JobSearchResult, TimelineEntry } from "@/types/career";
import styles from "./CareerDashboard.module.css";

type CareerDashboardProps = Readonly<{
  userName: string;
  userImage: string;

  showHistory?: boolean;
  showCalendar?: boolean;
}>;

type Recommendation = {
  company: string;
  role: string;
  why: string;
  url?: string;
};

export function CareerDashboard({ userName, userImage, showHistory = false, showCalendar = false }: CareerDashboardProps) {
  const router = useRouter();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [jobSearchId, setJobSearchId] = useState<string | null>(null);
  const searchTriggeredRef = useRef(false);
  const recommendationFetchedRef = useRef(false);

  const recommendationCache = useRef<{ recommendation: Recommendation | null; date: string } | null>(null);
  const localToday = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

  const firstName = userName.split(" ")[0] ?? userName;

  useEffect(() => {
    if (showHistory) {
      idbListChatSessions().then((all) => setChatSessions(all.filter((s) => normalizeSkill(s.skill) === "executive-coach"))).catch(() => {});
    }
  }, [showHistory]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await proxyFetch("/agent/career/jobs");
      if (!res.ok) return;
      const data = await res.json() as { jobs?: Job[] };
      setJobs(data.jobs ?? []);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await proxyFetch("/agent/career/timeline");
      if (!res.ok) return;
      const data = await res.json() as { entries?: TimelineEntry[] };
      setTimeline(data.entries ?? []);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchTimeline();
  }, [fetchJobs, fetchTimeline]);

  const fetchRecommendation = useCallback(async () => {
    setRecommendationLoading(true);
    try {
      const today = localToday();
      if (recommendationCache.current?.date === today) {
        setRecommendation(recommendationCache.current.recommendation);
        setRecommendationLoading(false);
        return;
      }
      const res = await proxyFetch("/agent/career/recommend-job", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ localDate: today }) });
      if (res.ok) {
        const data = await res.json() as { recommendation: Recommendation | null };
        setRecommendation(data.recommendation);
        recommendationCache.current = { recommendation: data.recommendation, date: today };
      }
    } catch { /* non-fatal */ } finally {
      setRecommendationLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!jobsLoading && !recommendationFetchedRef.current) {
      recommendationFetchedRef.current = true;
      fetchRecommendation();
    }
  }, [jobsLoading, fetchRecommendation]);

  // On /career page load: check job-results first.
  // If results exist for today, both pipelines have already run — skip them.
  // Otherwise fire Pipeline A (refresh-companies, silent) and Pipeline B (search-jobs, visible).
  useEffect(() => {
    if (searchTriggeredRef.current) return;
    searchTriggeredRef.current = true;

    (async () => {
      try {
        const res = await proxyFetch("/agent/career/job-results");
        if (res.ok) {
          const data = await res.json() as { results: JobSearchResult[] | null; scrapedAt: string | null };
          if (data.results && data.results.length > 0) return; // Recent scrape exists; pipelines already ran
        }
      } catch { /* non-fatal */ }

      // No results for today — fire both pipelines
      proxyFetch("/agent/career/refresh-companies", { method: "POST" }).catch(() => {});

      try {
        const startRes = await proxyFetch("/agent/career/search-jobs", { method: "POST" });
        if (!startRes.ok) return;
        const { jobId } = (await startRes.json()) as { jobId: string };
        setJobSearchId(jobId);
        const sw = await navigator.serviceWorker.ready;
        sw.active?.postMessage({ type: "START_JOB_SEARCH_POLL", jobId });
      } catch { /* non-fatal */ }
    })();
  }, []);

  const handleUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await proxyFetch("/agent/career/timeline", { method: "POST", body: form });
        if (res.ok) {
          const data = await res.json() as { entries?: TimelineEntry[] };
          if (data.entries) {
            setTimeline((prev) => [...prev, ...data.entries!]);
          }
        }
      }
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDeleteEntry = useCallback(async (id: string) => {
    setTimeline((prev) => prev.filter((e) => e.id !== id));
    await proxyFetch(`/agent/career/timeline/${id}`, { method: "DELETE" });
  }, []);

  const handleEditEntry = useCallback(async (id: string, patch: Partial<import("@/types/career").TimelineEntry>) => {
    setTimeline((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e));
    await proxyFetch(`/agent/career/timeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }, []);

  const handleStatusChange = useCallback(async (jobId: string, status: JobStatus) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status, updatedAt: new Date().toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }, []);

  const handleNotesChange = useCallback(async (jobId: string, notes: string) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, notes, updatedAt: new Date().toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }, []);

  const handleUrlChange = useCallback(async (jobId: string, url: string) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, url: url || undefined, updatedAt: new Date().toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url || null }),
    });
  }, []);

  const handleUrlVerifiedChange = useCallback(async (jobId: string, verified: boolean) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, urlVerified: verified, updatedAt: new Date().toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urlVerified: verified }),
    });
  }, []);

  const handleOverlapsChange = useCallback(async (jobId: string, overlaps: string) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, overlaps, updatedAt: new Date().toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overlaps }),
    });
  }, []);

  const handleJdChange = useCallback(async (jobId: string, jd: string) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, jd: jd || undefined, updatedAt: new Date().toISOString() } : j));
    await proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd: jd || null }),
    });
  }, []);

  const handleJobUpdate = useCallback((jobId: string, patch: Partial<import("@/types/career").Job>) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j));
    // Persist fields that aren't handled by their own dedicated endpoints
    proxyFetch(`/agent/career/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  const handleSkipCompany = useCallback(async (company: string) => {
    await proxyFetch("/agent/career/skip-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company }),
    }).catch(() => {});
  }, []);

  const handleCleanupJobs = useCallback(async () => {
    try {
      const startRes = await proxyFetch("/agent/career/jobs/cleanup", { method: "POST" });
      if (!startRes.ok) return null;
      const { jobId } = (await startRes.json()) as { jobId: string };

      // Poll until done
      while (true) {
        await new Promise((r) => setTimeout(r, 3000));
        const pollRes = await proxyFetch(`/agent/career/jobs/cleanup/${jobId}`);
        if (!pollRes.ok) break;
        const data = (await pollRes.json()) as { status: string; checked?: number; removed?: number; statusMessage?: string };
        if (data.status === "completed") return { checked: data.checked ?? 0, closed: data.removed ?? 0 };
        if (data.status === "failed") return null;
      }
      return null;
    } catch { return null; }
  }, []);

  const handleDeleteJob = useCallback(async (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    await proxyFetch(`/agent/career/jobs/${jobId}`, { method: "DELETE" }).catch(() => {});
  }, []);

  const handleAddJob = useCallback(async (company: string, role: string, url?: string) => {
    const res = await proxyFetch("/agent/career/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, role, url }),
    });
    if (res.ok) {
      const data = await res.json() as { job?: Job };
      if (data.job) setJobs((prev) => [...prev, data.job!]);
    }
  }, []);

  const handleFindPeople = useCallback((_company: string, _role: string) => {
    // Delegate to Trippy via the floating assistant — focus the input
    document.querySelector<HTMLInputElement>('input[placeholder*="Trippy"]')?.focus();
  }, []);

  const handleAddToBoard = useCallback((job: Pick<Job, "company" | "role" | "url">) => {
    handleAddJob(job.company, job.role, job.url);
  }, [handleAddJob]);

  const panelActive = showHistory || showCalendar;

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle={`${firstName}'s Career`} />
      <PageShell>
      <div style={{ position: "relative" }}>
        <div style={{ filter: panelActive ? "blur(4px)" : "none", transition: "filter 300ms" }}>
          {panelActive && (
            <div style={{ position: "fixed", inset: 0, zIndex: 30, cursor: "pointer" }} onClick={() => router.push("/career")} />
          )}

          <div className={styles.grid}>
              <RecommendedJobCard
                loading={recommendationLoading}
                recommendation={recommendation}
                savedJobs={jobs}
                onAddToBoard={handleAddToBoard}
                onFindPeople={handleFindPeople}
              />
              <TimelineTile
                entries={timeline}
                loading={timelineLoading}
                uploading={uploading}
                onUpload={handleUpload}
                onDelete={handleDeleteEntry}
                onEdit={handleEditEntry}
              />
              <JobsBoard
                jobs={jobs}
                loading={jobsLoading}
                onStatusChange={handleStatusChange}
                onNotesChange={handleNotesChange}
                onJdChange={handleJdChange}
                onOverlapsChange={handleOverlapsChange}
                onJobUpdate={handleJobUpdate}
                onUrlChange={handleUrlChange}
                onUrlVerifiedChange={handleUrlVerifiedChange}
                onAddJob={handleAddJob}
                onSkipCompany={handleSkipCompany}
                onDeleteJob={handleDeleteJob}
                onCleanupJobs={handleCleanupJobs}
                jobSearchId={jobSearchId}
              />
          </div>
        </div>

        {/* History panel (left) */}
        {showHistory && (
          <div style={{ position: "fixed", top: 64, bottom: 0, left: 0, width: 256, zIndex: 40, boxShadow: "var(--shadow-lg)", background: "var(--color-surface)", borderRight: "1px solid var(--color-border)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Chat History</span>
              <button type="button" onClick={() => router.push("/career")} style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)", background: "none", border: "none" }}>✕</button>
            </div>
            {chatSessions.length === 0 ? (
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", padding: "24px 16px" }}>No sessions yet.</p>
            ) : (
              <ul style={{ flex: 1, padding: "8px 0", listStyle: "none", margin: 0 }}>
                {chatSessions.map((s) => (
                  <li
                    key={s.id}
                    style={{ padding: "8px 16px", cursor: "pointer" }}
                    onClick={() => setSelectedSession(s)}
                  >
                    <p style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{s.title || "Career chat"}</p>
                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>{new Date(s.createdAt).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Calendar panel (right) */}
        {showCalendar && (
          <div style={{ position: "fixed", top: 64, bottom: 0, right: 0, width: 320, zIndex: 40, boxShadow: "var(--shadow-lg)" }}>
            <CalendarPanel closeHref="/career" />
          </div>
        )}
      </div>

      <FloatingAssistant
        
        onAgentAction={fetchJobs}
      />

      <CareerChatSessionModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
      </PageShell>
    </>
  );
}
