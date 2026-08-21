import os

from fastapi import FastAPI, HTTPException, Query

from .agent import create_briefing
from .executor import ActionExecutor, MockActionExecutor
from .models import BriefingRequest, BriefingResponse, ProposalDecision, ProposalStatus, UserContext, UserPreferences
from .store import ProposalStore

app = FastAPI(title="OpenPip API", version="0.1.0")
store = ProposalStore(os.getenv("OPENPIP_DATABASE_PATH", "./data/openpip.sqlite3"))
executor: ActionExecutor = MockActionExecutor()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "openpip-backend"}


@app.post("/api/briefing", response_model=BriefingResponse)
def briefing(request: BriefingRequest) -> BriefingResponse:
    text, generated_by, proposals_created = create_briefing(request, store, store.get_user_context())
    return BriefingResponse(briefing=text, generated_by=generated_by, proposals_created=proposals_created)


@app.get("/api/proposals")
def proposals(status: ProposalStatus | None = Query(default=None)):
    return {"items": store.list(status)}


@app.get("/api/settings/working-context", response_model=UserContext)
def get_working_context() -> UserContext:
    """Return user-authored preferences only, never private system instructions."""
    return store.get_user_context()


@app.put("/api/settings/working-context", response_model=UserContext)
def save_working_context(context: UserContext) -> UserContext:
    """Persist context that guides prioritization and tone, not authorization."""
    return store.save_user_context(context)


@app.get("/api/settings/preferences", response_model=UserPreferences)
def get_preferences() -> UserPreferences:
    """Return user-facing identity and appearance settings only."""
    return store.get_preferences()


@app.put("/api/settings/preferences", response_model=UserPreferences)
def save_preferences(preferences: UserPreferences) -> UserPreferences:
    """Persist assistant name/icon and visual preferences, never system instructions."""
    return store.save_preferences(preferences)


@app.get("/api/proposals/{proposal_id}/audit")
def proposal_audit(proposal_id: str):
    if store.get(proposal_id) is None:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return {"items": store.audit_events(proposal_id)}


@app.post("/api/proposals/{proposal_id}/approve")
def approve(proposal_id: str, decision: ProposalDecision | None = None):
    try:
        return store.decide(proposal_id, ProposalStatus.APPROVED, decision.reason if decision else None)
    except KeyError:
        raise HTTPException(status_code=404, detail="Proposal not found") from None
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post("/api/proposals/{proposal_id}/reject")
def reject(proposal_id: str, decision: ProposalDecision | None = None):
    try:
        return store.decide(proposal_id, ProposalStatus.REJECTED, decision.reason if decision else None)
    except KeyError:
        raise HTTPException(status_code=404, detail="Proposal not found") from None
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post("/api/proposals/{proposal_id}/execute")
def execute(proposal_id: str):
    """Execute an approved proposal through the configured adapter only."""
    try:
        proposal = store.claim_execution(proposal_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Proposal not found") from None
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    try:
        result = executor.execute(proposal)
    except Exception as error:
        return store.mark_failed(proposal_id, str(error))
    return store.mark_executed(proposal_id, result.reference)


@app.post("/api/proposals/{proposal_id}/retry")
def retry(proposal_id: str):
    try:
        return store.retry(proposal_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Proposal not found") from None
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
