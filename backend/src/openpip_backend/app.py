from fastapi import FastAPI, HTTPException, Query

from .agent import create_briefing
from .models import BriefingRequest, BriefingResponse, ProposalDecision, ProposalStatus
from .store import ProposalStore

app = FastAPI(title="OpenPip API", version="0.1.0")
store = ProposalStore()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "openpip-backend"}


@app.post("/api/briefing", response_model=BriefingResponse)
def briefing(request: BriefingRequest) -> BriefingResponse:
    text, generated_by, proposals_created = create_briefing(request, store)
    return BriefingResponse(briefing=text, generated_by=generated_by, proposals_created=proposals_created)


@app.get("/api/proposals")
def proposals(status: ProposalStatus | None = Query(default=None)):
    return {"items": store.list(status)}


@app.post("/api/proposals/{proposal_id}/approve")
def approve(proposal_id: str, decision: ProposalDecision | None = None):
    proposal = store.get(proposal_id)
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal.status != ProposalStatus.PENDING:
        raise HTTPException(status_code=409, detail="Proposal is no longer pending")
    # Approval records intent. A separate executor will perform the side effect.
    return store.decide(proposal_id, ProposalStatus.APPROVED)


@app.post("/api/proposals/{proposal_id}/reject")
def reject(proposal_id: str, decision: ProposalDecision | None = None):
    proposal = store.get(proposal_id)
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal.status != ProposalStatus.PENDING:
        raise HTTPException(status_code=409, detail="Proposal is no longer pending")
    return store.decide(proposal_id, ProposalStatus.REJECTED)
