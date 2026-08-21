"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Loader2, X } from "lucide-react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
type Proposal = { id: string; action: string; title: string; rationale: string; source: { kind: string; id: string; title: string; url?: string | null }; status: string; failure_reason?: string | null };

export default function ReviewPage() {
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/proposals?status=pending`);
      if (!response.ok) throw new Error("Unable to load review queue");
      setItems((await response.json()).items as Proposal[]);
      setMessage(null);
    } catch { setMessage("Couldn’t reach OpenPip. Start the backend and try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function decide(proposal: Proposal, decision: "approve" | "reject") {
    setBusyId(proposal.id);
    setMessage(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/proposals/${proposal.id}/${decision}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!response.ok) throw new Error("Decision failed");
      if (decision === "approve") {
        const executeResponse = await fetch(`${apiBaseUrl}/api/proposals/${proposal.id}/execute`, { method: "POST" });
        if (!executeResponse.ok) throw new Error("Execution failed");
      }
      await load();
    } catch { setMessage("OpenPip couldn’t complete that decision. The proposal is still safe to review."); }
    finally { setBusyId(null); }
  }

  return (
    <main className="app-shell settings-page">
      <Link href="/" className="back-link">← Today</Link>
      <header className="settings-header"><p className="eyebrow">Review queue</p><h1>Decisions, not busywork.</h1><p className="muted">Every item below is a proposal. Nothing is sent, scheduled, changed, or called until you approve it.</p></header>
      {message && <p className="working-context-error" role="alert">{message}</p>}
      {loading ? <p className="review-loading"><Loader2 size={18} /> Loading proposals…</p> : items.length === 0 ? <section className="empty-review"><Check size={24} /><h2>You’re caught up.</h2><p className="muted">OpenPip will surface the next decision when your workspace changes.</p><Link href="/" className="settings-link">Back to Today</Link></section> : <div className="review-list">{items.map((proposal) => <article className="review-card" key={proposal.id}><div className="review-card-header"><span className="proposal-action">{proposal.action.replaceAll("_", " ")}</span><span className="proposal-status">Needs review</span></div><h2>{proposal.title}</h2><p>{proposal.rationale}</p><div className="proposal-source"><span>Source</span><strong>{proposal.source.title}</strong>{proposal.source.url && <a href={proposal.source.url} target="_blank" rel="noreferrer" aria-label="Open source"><ExternalLink size={15} /></a>}<small>{proposal.source.kind} · {proposal.source.id}</small></div><div className="review-actions"><button className="review-reject" type="button" onClick={() => void decide(proposal, "reject")} disabled={busyId === proposal.id}><X size={17} /> Reject</button><button className="review-approve" type="button" onClick={() => void decide(proposal, "approve")} disabled={busyId === proposal.id}>{busyId === proposal.id ? <Loader2 size={17} /> : <Check size={17} />} Approve &amp; run</button></div></article>)}</div>}
    </main>
  );
}
