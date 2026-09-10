"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import { PromptModal } from "@/components/ui/PromptModal";
import { proxyFetch } from "@/lib/proxy";
import type { ReviewItem } from "./ReviewQueuePage";
import { SavedInsightCard } from "./SavedInsightCard";
import styles from "./ReviewDetailPage.module.css";

type Application = { id?: string; company: string; role: string; url?: string; jd?: string; coverLetter?: string; refinements?: { entryTitle: string; refinedBullets: string[] }[]; app_questions?: [string, string][]; analysis?: { positioning?: string }; updatedAt?: string };
type EmailDraft = { sender: string; senderEmail: string; subject: string; originalText: string; draft: string };
type Campaign = { id: string; recipientCount: number; templateId?: string; fromAddress?: string };
type ProposalSource = { kind: "email" | "calendar_event" | "conversation" | "insight" | "goal"; label: string; detail: string; href?: string };
type Proposal = { id: string; kind: "career_pipeline" | "networking_pipeline" | "trip_plan" | "campaign_prepare" | "task_suggestions"; action?: string; evidence: string; source?: ProposalSource; payload: Record<string, unknown> };

function getApplication(item: ReviewItem): Application | undefined { return (item as ReviewItem & { data?: { job?: Application } }).data?.job; }
function getEmail(item: ReviewItem): EmailDraft | undefined { return (item as ReviewItem & { data?: { draft?: EmailDraft } }).data?.draft; }
function getCampaign(item: ReviewItem): Campaign | undefined { return (item as ReviewItem & { data?: { campaign?: Campaign } }).data?.campaign; }
function getProposal(item: ReviewItem): Proposal | undefined { return (item as ReviewItem & { data?: { proposal?: Proposal } }).data?.proposal; }

export function ReviewDetailPage({ userName, userImage }: { userName: string; userImage: string }) {
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [item, setItem] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [promptModal, setPromptModal] = useState<{ open: boolean; decision: "approved" | "rejected" }>({ open: false, decision: "approved" });

  useEffect(() => {
    if (!id) return;
    let active = true;
    proxyFetch(`/agent/review/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const body = await response.json() as { item?: ReviewItem; error?: string };
        if (!response.ok) throw new Error(body.error ?? "This item is no longer available.");
        return body.item ?? null;
      })
      .then((next) => { if (active) setItem(next); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load this review item."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const openDecisionPrompt = (decision: "approved" | "rejected") => {
    setPromptModal({ open: true, decision });
  };

  const submitDecision = async (reason: string) => {
    const { decision } = promptModal;
    setPromptModal({ open: false, decision: "approved" });
    setWorking(true); setError("");
    try {
      const response = await proxyFetch(`/agent/review/${encodeURIComponent(id)}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, ...(reason.trim() ? { reason: reason.trim() } : {}) }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to save your decision.");
      if (decision === "approved" && item?.kind === "email") setMessage("Draft approved. Open Inbox whenever you are ready to make the final send.");
      else router.replace("/review");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save your decision."); }
    finally { setWorking(false); }
  };

  const sendCampaign = async () => {
    const campaign = item && getCampaign(item);
    if (!campaign) return;
    setWorking(true); setError("");
    try {
      const response = await proxyFetch(`/agent/campaigns/${campaign.id}/send`, { method: "POST" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to start the campaign.");
      router.replace("/review");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to start the campaign."); }
    finally { setWorking(false); }
  };

  const application = item && getApplication(item);
  const email = item && getEmail(item);
  const campaign = item && getCampaign(item);
  const proposal = item && getProposal(item);

  return (
    <div className={styles.shell}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} backHref="/review" backLabel="Review" />
      <main className={styles.page}>
        {loading ? <div className={styles.skeleton} /> : error && !item ? <section className={styles.error}><p>{error}</p><Link href="/review">Back to review</Link></section> : item && (
          <>
            <div className={`${styles.heading} ${item.kind === "application" ? styles.approvalHeading : ""}`}>
              <div>
                <p className={styles.eyebrow}>{proposal ? (item.category ?? "Agent proposal") : item.kind === "application" ? "Application draft" : item.kind === "campaign" ? "Campaign approval" : "Reply draft"}</p>
                <h1>{item.title}</h1>
                <p>{item.summary}</p>
              </div>
              {item.kind === "application" && <span className={styles.state}>Needs your approval</span>}
            </div>

            <section className={styles.externalAction} aria-label="External action status">
              <span>{item.externalAction.label}</span>
              <strong>{item.externalAction.detail}</strong>
            </section>

            {application && <ApplicationReview application={application} />}
            {email && <EmailReview email={email} />}
            {campaign && <CampaignReview campaign={campaign} />}
            {proposal && <ProposalReview proposal={proposal} />}

            {message && <p className={styles.success}>{message} <Link href="/inbox">Open Inbox</Link></p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
            {!message && <footer className={styles.actionFooter}>
              <p className={styles.actionsNote}>{proposal ? proposal.action === "call_task" ? "Approval authorizes one bounded CALL-E phone call after this review. Any calendar update afterward is separate." : "Approval adds this bounded work to Scheduled Actions. It does not send, apply, book, or contact anyone." : item.kind === "application" ? "Approval records your decision only. The agent does not submit this application." : item.kind === "campaign" ? "Approval starts the existing send process." : "Approval saves this draft for your final send in Inbox."}</p>
              <div className={styles.actions}>
                {item.kind !== "campaign" && <button className={styles.secondaryAction} disabled={working} onClick={() => openDecisionPrompt("rejected")}>{proposal ? "Decline proposal" : "Reject draft"}</button>}
                {item.kind === "application" && <button className={styles.primaryAction} disabled={working} onClick={() => openDecisionPrompt("approved")}>{working ? "Saving…" : "Approve application draft"}</button>}
                {item.kind === "email" && <button className={styles.primaryAction} disabled={working} onClick={() => openDecisionPrompt("approved")}>{working ? "Saving…" : "Approve reply draft"}</button>}
                {proposal && <button className={styles.primaryAction} disabled={working} onClick={() => openDecisionPrompt("approved")}>{working ? "Saving…" : proposal.action === "call_task" ? "Approve phone call" : "Approve & schedule"}</button>}
                {item.kind === "campaign" && <button className={styles.primaryAction} disabled={working} onClick={sendCampaign}>{working ? "Starting…" : "Approve & send campaign"}</button>}
              </div>
            </footer>}
          </>
        )}
      </main>
      <FloatingAssistant />
      <PromptModal
        open={promptModal.open}
        title={promptModal.decision === "rejected" ? "Why are you declining?" : "Additional instructions"}
        placeholder={promptModal.decision === "rejected" ? "Tell the agent why, or what to do instead…" : "Any specific instructions for this task…"}
        submitLabel={promptModal.decision === "rejected" ? "Decline" : "Approve"}
        cancelLabel="Skip"
        onSubmit={submitDecision}
        onCancel={() => { setPromptModal({ open: false, decision: "approved" }); void submitDecision(""); }}
      />
    </div>
  );
}

function ApplicationReview({ application }: { application: Application }) {
  const coverPreview = application.coverLetter?.slice(0, 760);
  return <div className={styles.applicationGrid}>
    <div className={styles.stack}>
      <section className={`${styles.card} ${styles.packet}`}>
        <h2>Your application packet</h2>
        <p className={styles.sectionNote}>Prepared from the role, your saved materials, and the job analysis. Nothing has been submitted.</p>
        <div className={styles.preparedRows}>
          {application.refinements?.length ? <PreparedRow title="Tailored résumé" detail={`Updated ${application.refinements.length} experience entr${application.refinements.length === 1 ? "y" : "ies"}.`} /> : null}
          {application.coverLetter ? <PreparedRow title="Cover letter" detail="Drafted for this role from your saved materials." /> : null}
          {application.app_questions?.length ? <PreparedRow title="Application answers" detail={`${application.app_questions.length} response${application.app_questions.length === 1 ? "" : "s"} ready for the form.`} /> : null}
        </div>
      </section>
      {application.coverLetter && <section className={`${styles.card} ${styles.letter}`}><h2>Cover letter preview</h2><pre>{coverPreview}{application.coverLetter.length > 760 ? "…" : ""}</pre>{application.coverLetter.length > 760 && <details><summary>Show full cover letter</summary><pre>{application.coverLetter}</pre></details>}</section>}
      {application.refinements?.length ? <details className={styles.materialDetails}><summary>Review résumé updates ({application.refinements.length})</summary>{application.refinements.map((refinement, index) => <div className={styles.material} key={`${refinement.entryTitle}-${index}`}><h3>{refinement.entryTitle}</h3><ul>{refinement.refinedBullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul></div>)}</details> : null}
      {application.app_questions?.length ? <details className={styles.materialDetails}><summary>Review application answers ({application.app_questions.length})</summary>{application.app_questions.map(([question, answer], index) => <div className={styles.material} key={index}><h3>{question}</h3><p>{answer}</p></div>)}</details> : null}
    </div>
    <aside className={styles.contextStack}>
      <section className={styles.card}><h2>{application.role}</h2><p className={styles.company}>{application.company}</p><dl className={styles.facts}><div><dt>Status</dt><dd>Draft only</dd></div><div><dt>Prepared</dt><dd>{application.updatedAt ? new Date(application.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently"}</dd></div><div><dt>Next step</dt><dd>Your review</dd></div></dl></section>
      <section className={styles.card}><h2>Why this was prepared</h2><p className={styles.contextText}>{application.analysis?.positioning ?? "The role matches your saved background and the materials the agent prepared for it."}</p></section>
    </aside>
  </div>;
}

function PreparedRow({ title, detail }: { title: string; detail: string }) {
  return <div className={styles.preparedRow}><div><strong>{title}</strong><span>{detail}</span></div><b>Ready</b></div>;
}

function EmailReview({ email }: { email: EmailDraft }) {
  return <div className={styles.applicationGrid}>
    <div className={styles.stack}>
      <section className={styles.card}><h2>Draft reply</h2><pre>{email.draft}</pre></section>
      <details className={styles.original}><summary>Show original message</summary><p>{email.originalText}</p></details>
    </div>
    <aside className={styles.contextStack}>
      <section className={styles.card}>
        <h2>Replying to</h2>
        <p className={styles.company}>{email.sender}</p>
        <dl className={styles.facts}>
          <div><dt>Email</dt><dd>{email.senderEmail}</dd></div>
          <div><dt>Subject</dt><dd>{email.subject || "(no subject)"}</dd></div>
          <div><dt>Status</dt><dd>Draft only</dd></div>
        </dl>
      </section>
    </aside>
  </div>;
}

function CampaignReview({ campaign }: { campaign: Campaign }) {
  return <div className={styles.applicationGrid}>
    <div className={styles.stack}>
      <section className={styles.card}>
        <h2>Sending scope</h2>
        <p className={styles.contextText}>Nothing has been sent. Approving starts the existing send process.</p>
      </section>
    </div>
    <aside className={styles.contextStack}>
      <section className={styles.card}>
        <h2>Campaign details</h2>
        <dl className={styles.facts}>
          <div><dt>Recipients</dt><dd>{campaign.recipientCount}</dd></div>
          <div><dt>Template</dt><dd>{campaign.templateId ?? "No template attached"}</dd></div>
          <div><dt>From</dt><dd>{campaign.fromAddress ?? "No sender configured"}</dd></div>
          <div><dt>Status</dt><dd>Pending approval</dd></div>
        </dl>
      </section>
    </aside>
  </div>;
}

/** Renders source.detail — uses SavedInsightCard for insight/goal sources, plain text otherwise. */
function SourceDetail({ detail, kind, label }: { detail: string; kind: string; label?: string }) {
  if (kind === "insight" || kind === "goal") {
    return <SavedInsightCard detail={detail} label={label} />;
  }
  return <p>{detail}</p>;
}

function ProposalReview({ proposal }: { proposal: Proposal }) {
  const label: Record<Proposal["kind"], string> = { career_pipeline: "Career research & job search", networking_pipeline: "Networking & career navigation", trip_plan: "Trip planning", campaign_prepare: "Campaign preparation", task_suggestions: "Task suggestions" };
  const isCall = proposal.action === "call_task";
  const scope = proposal.kind === "trip_plan" ? `${proposal.payload.origin ?? ""} → ${proposal.payload.destination ?? ""}` : proposal.kind === "campaign_prepare" ? String(proposal.payload.domain ?? "") : "";
  const phone = String(proposal.payload.phone ?? "");
  const maskedPhone = phone.length > 4 ? `${phone.slice(0, 4)}•••${phone.slice(-2)}` : "Phone number provided";
  const source = proposal.source;
  const sourceLabel = source?.kind === "conversation" ? "Based on previous conversations" : source?.kind === "insight" || source?.kind === "goal" ? "Based on saved context" : "Source";
  return <div className={styles.applicationGrid}>
    <div className={styles.stack}>
      <section className={styles.card}>
        <h2>{isCall ? "Phone call proposal" : label[proposal.kind]}</h2>
        <p className={styles.contextText}>{proposal.evidence}</p>
        {scope && <dl className={styles.facts}><div><dt>Scope</dt><dd>{scope}</dd></div></dl>}
        {isCall && <dl className={styles.facts}>
          <div><dt>Recipient</dt><dd>{String(proposal.payload.recipientName ?? "Specified contact")}</dd></div>
          <div><dt>Phone</dt><dd>{maskedPhone}</dd></div>
          <div><dt>Call goal</dt><dd>{String(proposal.payload.goal ?? "Bounded follow-up")}</dd></div>
        </dl>}
      </section>
      <section className={styles.card}>
        <h2>After your approval</h2>
        <p className={styles.contextText}>{isCall ? "OpenPip will place one CALL-E call to the masked number above and record the result. It will not silently reschedule the calendar event or take another action from the call." : "The existing background worker starts this bounded work only after you approve it. It does not send, apply, book, or contact anyone."}</p>
      </section>
    </div>
    <aside className={styles.contextStack}>
      {source && <section className={styles.card}>
        <h2>Context used</h2>
        <div className={styles.proposalSource}>
          <span>{sourceLabel}</span>
          <strong>{source.label}</strong>
          <SourceDetail detail={source.detail} kind={source.kind} label={source.label} />
        </div>
        {source.href && <Link href={source.href} target="_blank" rel="noreferrer" className={styles.jobLink}>Open source →</Link>}
      </section>}
      <section className={styles.card}>
        <h2>Proposal type</h2>
        <dl className={styles.facts}>
          <div><dt>Kind</dt><dd>{label[proposal.kind]}</dd></div>
          <div><dt>Status</dt><dd>Pending your decision</dd></div>
        </dl>
      </section>
    </aside>
  </div>;
}
