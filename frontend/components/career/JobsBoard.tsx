"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useRef, Fragment } from "react";
import { Plus, Bookmark, EyeOff, Building2, Sparkles } from "lucide-react";
import { CompaniesModal } from "./CompaniesModal";
import { JobCard } from "./JobCard";
import type { Job, JobStatus, JobSearchResult } from "@/types/career";
import styles from "./JobsBoard.module.css";
import btnStyles from "@/components/ui/Button.module.css";

type JobsBoardProps = Readonly<{
  jobs: Job[];
  loading: boolean;
  onStatusChange: (jobId: string, status: JobStatus) => void;
  onNotesChange: (jobId: string, notes: string) => void;
  onJdChange: (jobId: string, jd: string) => void;
  onOverlapsChange: (jobId: string, overlaps: string) => void;
  onJobUpdate: (jobId: string, patch: Partial<Job>) => void;
  onAddJob: (company: string, role: string, url?: string) => void;
  onSkipCompany: (company: string) => void;
  onDeleteJob: (jobId: string) => void;
  onUrlChange: (jobId: string, url: string) => void;
  onUrlVerifiedChange: (jobId: string, verified: boolean) => void;
  onCleanupJobs: () => Promise<{ checked: number; closed: number } | null>;
  jobSearchId?: string | null;
}>;

const STATUSES: JobStatus[] = ["saved", "applied", "interviewing"];

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interview",
  offer: "Offer",
  closed: "Closed",
  rejected: "Rejected",
};

export function JobsBoard({ jobs, loading, onJobUpdate: _onJobUpdate, onAddJob, onSkipCompany, onDeleteJob, onCleanupJobs, jobSearchId, onStatusChange: _1, onNotesChange: _2, onJdChange: _3, onOverlapsChange: _4, onUrlChange: _5, onUrlVerifiedChange: _6 }: JobsBoardProps) {
  const PAGE_SIZE = 20;
  const [activeStatus, setActiveStatus] = useState<JobStatus | "all">("all");
  const [jobsPage, setJobsPage] = useState(1);
  const [addingJob, setAddingJob] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [searchResults, setSearchResults] = useState<JobSearchResult[]>([]);
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [skippedCompanies, setSkippedCompanies] = useState<Set<string>>(new Set());
  const [showCompanies, setShowCompanies] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchElapsed, setSearchElapsed] = useState(0);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ checked: number; closed: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const isSearchingRef = useRef(false);

  const [scrapedAt, setScrapedAt] = useState<string | null>(null);

  const [resultsVisible, setResultsVisible] = useState(true);

  const fetchResultsPage = (page: number) => {
    setResultsLoading(true);
    setResultsVisible(false);
    proxyFetch(`/agent/career/job-results?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { results: JobSearchResult[] | null; total: number; page: number; scrapedAt: string | null } | null) => {
        if (data?.results && data.results.length > 0) {
          setSearchResults(data.results);
          setResultsTotal(data.total);
          setResultsPage(page);
          setScrapedAt(data.scrapedAt ?? null);
        }
      })
      .catch(() => {})
      .finally(() => { setResultsLoading(false); setResultsVisible(true); });
  };

  useEffect(() => { fetchResultsPage(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!jobSearchId) return;

    isSearchingRef.current = true;
    setSearchStatus("Starting job search...");
    setSearchElapsed(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => setSearchElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);

    const channel = new BroadcastChannel("route-jobs");

    channel.onmessage = async (event) => {
      const msg = event.data;
      if (msg.type !== "JOB_SEARCH_UPDATE" || msg.jobId !== jobSearchId) return;

      if (msg.statusMessage) setSearchStatus(msg.statusMessage);
      if (msg.results && msg.results.length > 0) {
        setSearchResults(msg.results.slice(0, PAGE_SIZE));
        setResultsTotal(msg.results.length);
        setResultsPage(1);
      }

      if (msg.status === "failed") {
        if (timerRef.current) clearInterval(timerRef.current);
        setSearchStatus(null);
        setSearchError(msg.error ?? "Search failed — upload a resume to build your profile.");
        channel.close();
      }

      if (msg.status === "completed") {
        if (timerRef.current) clearInterval(timerRef.current);
        fetchResultsPage(1);
        setSearchStatus(null);
        isSearchingRef.current = false;
        navigator.serviceWorker.controller?.postMessage({ type: "STOP_JOB_SEARCH_POLL", jobId: jobSearchId });
        channel.close();
      }
    };

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      channel.close();
    };
  }, [jobSearchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissResult = (id: string) => {
    setSearchResults((prev) => prev.filter((r) => r.id !== id));
    setResultsTotal((t) => Math.max(0, t - 1));
    proxyFetch("/agent/career/dismiss-result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
  };

  const activeJobCount = jobs.filter((j) => j.status === "saved" || j.status === "applied" || j.status === "interviewing" || j.status === "offer").length;
  const filtered = activeStatus === "all" ? [] : jobs.filter((j) => j.status === activeStatus);
  const filteredSorted = activeStatus === "saved"
    ? [...filtered.filter((j) => j.urlVerified), ...filtered.filter((j) => !j.urlVerified)]
    : filtered;
  const pagedJobs = filteredSorted.slice(0, jobsPage * PAGE_SIZE);
  const verifiedCount = activeStatus === "saved" ? filtered.filter((j) => j.urlVerified).length : 0;
  const savedUrls = new Set(jobs.map((j) => j.url).filter(Boolean) as string[]);
  const visibleResults = searchResults.filter((r) => !skippedCompanies.has(r.company) && (!r.url || !savedUrls.has(r.url)));
  const hasMoreResults = resultsPage * PAGE_SIZE < resultsTotal;

  const handleCleanup = async () => {
    setCleanupRunning(true);
    setCleanupResult(null);
    const result = await onCleanupJobs();
    setCleanupResult(result);
    setCleanupRunning(false);
  };

  const handleSkipCompany = (company: string) => {
    setSkippedCompanies((prev) => new Set(prev).add(company));
    onSkipCompany(company);
  };

  const handleAddSubmit = () => {
    if (!newCompany.trim() || !newRole.trim()) return;
    onAddJob(newCompany.trim(), newRole.trim(), newUrl.trim() || undefined);
    setNewCompany("");
    setNewRole("");
    setNewUrl("");
    setAddingJob(false);
  };

  return (
    <div className={styles.board}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.heading}>Jobs</h2>
          <div className={styles.subRow}>
            {jobs.length > 0 && <span className={styles.pulse} />}
            <p className={styles.subLabel}>
              {activeJobCount} Active {activeJobCount === 1 ? "Tracked Job" : "Tracked Jobs"}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleCleanup}
            disabled={cleanupRunning}
            className={styles.actionBtn}
            title={cleanupResult ? `Checked ${cleanupResult.checked}, closed ${cleanupResult.closed}` : "Check job URLs for 404s and closures"}
          >
            <Sparkles style={{ width: 14, height: 14 }} /> {cleanupRunning ? "Checking…" : "Clean up"}
          </button>
          <button
            type="button"
            onClick={() => setShowCompanies(true)}
            className={styles.actionBtn}
          >
            <Building2 style={{ width: 14, height: 14 }} /> Companies
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => { setActiveStatus("all"); setJobsPage(1); }}
          className={`${styles.tab} ${activeStatus === "all" ? styles.tabActive : ""}`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setActiveStatus(s); setJobsPage(1); }}
            className={`${styles.tab} ${activeStatus === s ? styles.tabActive : ""}`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : (
        <>
          {searchError ? (
            <div className={styles.errorMsg}>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>{searchError}</p>
            </div>
          ) : searchStatus ? (
            <div className={styles.statusMsg}>
              <span className={styles.spinner} />
              <p className={styles.statusText}>{searchStatus}</p>
              {searchElapsed != null && searchElapsed > 0 && (
                <span className={styles.elapsed}>
                  {Math.floor(searchElapsed / 60)}:{String(searchElapsed % 60).padStart(2, "0")}
                </span>
              )}
            </div>
          ) : null}

          {/* Add Opportunity */}
          {!addingJob ? (
            <div className={styles.addPrompt} onClick={() => setAddingJob(true)}>
              <div className={styles.addIcon}>
                <Plus style={{ width: 16, height: 16 }} />
              </div>
              <p className={styles.addLabel}>Add Opportunity</p>
            </div>
          ) : (
            <div className={styles.addForm}>
              <div className={styles.addFields}>
                <input autoFocus type="text" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company" className={styles.addInput} />
                <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role title" className={styles.addInput} />
                <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddSubmit(); if (e.key === "Escape") { setAddingJob(false); setNewCompany(""); setNewRole(""); setNewUrl(""); } }} placeholder="Job posting URL (optional)" className={styles.addInput} />
              </div>
              <div className={styles.addBtns}>
                <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={handleAddSubmit} disabled={!newCompany.trim() || !newRole.trim()}>Add</button>
                <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={() => { setAddingJob(false); setNewCompany(""); setNewRole(""); setNewUrl(""); }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Job cards */}
          {pagedJobs.length > 0 && (
            <>
              <div className={styles.jobGrid}>
                {pagedJobs.map((job, i) => (
                  <Fragment key={job.id}>
                    {activeStatus === "saved" && i === verifiedCount && verifiedCount > 0 && verifiedCount < pagedJobs.length && (
                      <div className={styles.separator}>
                        <div className={styles.sepLine} />
                        <span className={styles.sepLabel}>Unverified URL</span>
                        <div className={styles.sepLine} />
                      </div>
                    )}
                    <div style={{ animation: `fadeSlideUp 300ms ease-out ${i * 40}ms both`, minWidth: 0 }}>
                      <JobCard job={job} />
                    </div>
                  </Fragment>
                ))}
              </div>
              {filtered.length > pagedJobs.length && (
                <button type="button" onClick={() => setJobsPage((p) => p + 1)} className={styles.loadMoreBtn}>
                  Load more ({filtered.length - pagedJobs.length} remaining)
                </button>
              )}
            </>
          )}

          {/* Empty state */}
          {filtered.length === 0 && !searchStatus && !searchError && visibleResults.length === 0 && activeStatus === "all" && (
            <div className={styles.emptyState}>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>No discovered jobs yet — search is running.</p>
            </div>
          )}
          {filtered.length === 0 && activeStatus !== "all" && (
            <div className={styles.emptyState}>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>No {activeStatus} jobs.</p>
            </div>
          )}

          {/* Discovered job results from background search */}
          {activeStatus === "all" && searchResults && searchResults.length > 0 && (
            <div className={styles.discoveredSection}>
              <p className={styles.discoveredHeader}>
                {`Discovered — ${resultsTotal} ${resultsTotal === 1 ? "result" : "results"}`}
                <span className={styles.discoveredMeta}>
                  {`${(resultsPage - 1) * PAGE_SIZE + 1}–${Math.min(resultsPage * PAGE_SIZE, resultsTotal)}`}
                  {scrapedAt && ` · ${scrapedAt}`}
                </span>
              </p>
              <div className={`${styles.resultsGrid} ${resultsVisible ? styles.resultsGridVisible : styles.resultsGridHidden}`}>
                {visibleResults.map((result, i) => {
                  const isNew = !seenIdsRef.current.has(result.id);
                  seenIdsRef.current.add(result.id);
                  return (
                    <div key={result.id} className={styles.resultCard} style={{ animationDelay: `${i * 40}ms` }}>
                      <div className={styles.resultTop}>
                        <div style={{ minWidth: 0 }}>
                          {result.url ? (
                            <a href={result.url} target="_blank" rel="noopener noreferrer" className={styles.resultTitle}>
                              {result.title}
                            </a>
                          ) : (
                            <p className={styles.resultTitle}>{result.title}</p>
                          )}
                          <p className={styles.resultCompany}>
                            {result.company}{result.location ? ` · ${result.location.length > 40 ? result.location.slice(0, 40) + "…" : result.location}` : ""}
                            {result.score != null && (
                              <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "var(--font-size-xs)", color: `hsl(${Math.round((result.score / 10) * 120)}, 72%, 40%)`, opacity: 0.85 }}>
                                {result.score}/10
                              </span>
                            )}
                          </p>
                        </div>
                        <div className={styles.resultBtns}>
                          <button
                            type="button"
                            onClick={() => onAddJob(result.company, result.title, result.url)}
                            className={styles.resultIconBtn}
                            title="Save to board"
                          >
                            <Bookmark style={{ width: 16, height: 16 }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => dismissResult(result.id)}
                            className={`${styles.resultIconBtn} ${styles.resultIconBtnDanger}`}
                            title="Dismiss this listing"
                          >
                            <EyeOff style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </div>
                      {result.snippet && (
                        <p className={styles.resultSnippet}>{result.snippet}</p>
                      )}
                      {(result.salary || result.postedDate) && (
                        <p className={styles.resultMeta}>
                          {[result.salary, result.postedDate].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {(resultsPage > 1 || hasMoreResults) && (
                <div className={styles.pagination}>
                  <button type="button" disabled={resultsLoading || resultsPage <= 1} onClick={() => fetchResultsPage(resultsPage - 1)} className={styles.pageBtn}>
                    ← Prev
                  </button>
                  <span className={styles.pageInfo}>
                    {`page ${resultsPage} of ${Math.ceil(resultsTotal / PAGE_SIZE)}`}
                  </span>
                  <button type="button" disabled={resultsLoading || !hasMoreResults} onClick={() => fetchResultsPage(resultsPage + 1)} className={styles.pageBtn}>
                    {resultsLoading ? "Loading…" : "Next →"}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <CompaniesModal open={showCompanies} onOpenChange={setShowCompanies} />
    </div>
  );
}
