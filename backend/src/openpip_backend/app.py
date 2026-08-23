import os
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .agent import create_briefing
from .executor import ActionExecutor, MockActionExecutor
from .demo_data import demo_contacts, demo_request
from .models import BriefingRequest, BriefingResponse, Proposal, ProposalDecision, ProposalStatus, UserContext, UserPreferences
from .providers import connector_statuses
from .store import ProposalStore
from .google_workspace import (
    GoogleApiError,
    fetch_gmail_messages,
    fetch_google_calendars,
    fetch_google_drive_files,
    fetch_google_notebook_pages,
    fetch_google_tasks,
)
from .google_drive_store import read_drive_app_data, write_drive_app_data
from .google_oauth import (
    OAuthConfigError,
    OAuthSessionStore,
    _verify_state,
    build_authorization_url,
    exchange_code_for_tokens,
    issue_session_jwt,
    read_session_jwt,
    redirect_target_with_session,
    verify_google_id_token,
    verify_session_jwt,
)

app = FastAPI(title="OpenPip API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("OPENPIP_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
_database_path = os.getenv("OPENPIP_DATABASE_PATH", "./data/openpip.sqlite3")
store = ProposalStore(_database_path)
oauth_sessions = OAuthSessionStore(_database_path)
executor: ActionExecutor = MockActionExecutor()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "openpip-backend"}


# --- Google OAuth (Path B from docs/OAUTH_SETUP.md) -------------------------
#
# Entirely backend-owned: the frontend only ever proxies /auth/* verbatim
# (see frontend/server.js) to this service. No cookies anywhere. Google's own
# id_token (a signed JWT) is verified here rather than trusted blindly; this
# project's own session credential handed to the browser is likewise a JWT
# (issue_session_jwt/verify_session_jwt), sent back as the X-OpenPip-Session
# header. The real Google access/refresh tokens never leave the backend —
# only encrypted in oauth_sessions, referenced by the JWT's `sid` claim.


@app.get("/auth/login")
def auth_login(next: str = Query(default="/")) -> RedirectResponse:
    try:
        url = build_authorization_url(next_path=next)
    except OAuthConfigError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    return RedirectResponse(url, status_code=302)


@app.get("/auth/callback")
async def auth_callback(code: str | None = None, state: str | None = None, error: str | None = None) -> RedirectResponse:
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    state_claims = _verify_state(state)
    try:
        tokens = await exchange_code_for_tokens(code)
    except OAuthConfigError as oauth_error:
        raise HTTPException(status_code=500, detail=str(oauth_error)) from oauth_error
    access_token = tokens["access_token"]
    refresh_token = tokens.get("refresh_token")
    expires_in = int(tokens.get("expires_in", 3600))
    id_token = tokens.get("id_token")
    if not id_token:
        raise HTTPException(status_code=502, detail="Google did not return an id_token (openid scope missing?)")
    id_claims = verify_google_id_token(id_token)
    email = id_claims.get("email")
    name = id_claims.get("name")
    picture = id_claims.get("picture")
    session_id = oauth_sessions.create(
        email=email,
        name=name,
        picture=picture,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )
    session_jwt = issue_session_jwt(email=email, name=name, picture=picture, session_id=session_id)
    return RedirectResponse(redirect_target_with_session(state_claims.get("next", "/"), session_jwt), status_code=302)


@app.get("/auth/me")
def auth_me(request: Request) -> dict[str, Any]:
    token = read_session_jwt(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")
    claims = verify_session_jwt(token)
    if not claims:
        raise HTTPException(status_code=401, detail="Session expired; please sign in again")
    return {"email": claims.get("sub"), "name": claims.get("name"), "picture": claims.get("picture")}


@app.post("/auth/logout")
@app.get("/auth/logout")
def auth_logout(request: Request) -> dict[str, bool]:
    """Revoke the underlying Google-token record server-side. The frontend is
    responsible for clearing its own sessionStorage — there is no cookie here
    to clear."""
    token = read_session_jwt(request)
    if token:
        claims = verify_session_jwt(token)
        if claims and claims.get("sid"):
            oauth_sessions.delete(claims["sid"])
    return {"ok": True}


async def get_google_token(
    request: Request,
    x_google_token: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> str:
    """Resolve a live Google access token for this request.

    Header-based raw-token auth (x-google-token / Authorization: Bearer) is
    checked first — useful for direct API testing — then falls back to this
    project's own signed session JWT (X-OpenPip-Session), refreshing the
    underlying Google token if it has expired. Never falls back to any other
    project's auth service, and never accepts a cookie.
    """
    if x_google_token:
        return x_google_token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    session_token = read_session_jwt(request)
    if session_token:
        claims = verify_session_jwt(session_token)
        if claims and claims.get("sid"):
            access_token = await oauth_sessions.resolve_access_token(claims["sid"])
            if access_token:
                return access_token
    raise HTTPException(status_code=401, detail="Google account is not connected")


def _google_error(error: GoogleApiError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.detail)


@app.post("/agent/briefing", response_model=BriefingResponse)
@app.post("/api/briefing", response_model=BriefingResponse)
def briefing(request: BriefingRequest) -> BriefingResponse:
    text, generated_by, proposals_created = create_briefing(request, store, store.get_user_context())
    return BriefingResponse(briefing=text, generated_by=generated_by, proposals_created=proposals_created)


@app.post("/api/demo/briefing", response_model=BriefingResponse)
def demo_briefing() -> BriefingResponse:
    """Run the complete local loop with sanitized fixture data."""
    request = demo_request()
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


@app.get("/api/connectors")
def connectors():
    """Expose connector readiness without exposing OAuth credentials or tokens."""
    return {"items": [status.__dict__ for status in connector_statuses()]}


@app.get("/agent/connectors/status")
def agent_connectors_status():
    """Compatibility shape for the active frontend, served by FastAPI only."""
    return connectors()


def _review_item(proposal: Proposal) -> dict[str, Any]:
    status = proposal.status.value
    return {
        "id": proposal.id,
        "kind": "proposal",
        "category": "Agent proposal",
        "title": proposal.title,
        "subtitle": proposal.action,
        "summary": proposal.rationale,
        "createdAt": proposal.created_at.isoformat(),
        "externalAction": {
            "occurred": status in {"executed", "failed"},
            "label": "Approval status",
            "detail": status.replace("_", " ").title(),
        },
        "data": {
            "proposal": {
                "id": proposal.id,
                "kind": "task_suggestions",
                "evidence": proposal.rationale,
                "payload": proposal.payload,
            }
        },
    }


@app.get("/agent/review")
def agent_review(status: ProposalStatus | None = Query(default=ProposalStatus.PENDING)):
    """Expose the Python proposal queue using the frontend review shape."""
    return {"items": [_review_item(item) for item in store.list(status)]}


@app.get("/agent/review/{proposal_id}")
def agent_review_item(proposal_id: str):
    proposal = store.get(proposal_id)
    if proposal is None:
        raise HTTPException(status_code=404, detail="Review item not found")
    return {"item": _review_item(proposal)}


@app.post("/agent/review/{proposal_id}/decision")
def agent_review_decision(proposal_id: str, payload: dict[str, Any] | None = None):
    decision = str((payload or {}).get("decision", "")).strip().lower()
    reason = (payload or {}).get("reason")
    if decision not in {"approved", "rejected"}:
        raise HTTPException(status_code=400, detail="decision must be approved or rejected")
    try:
        proposal = store.decide(proposal_id, ProposalStatus(decision), str(reason) if reason else None)
    except KeyError:
        raise HTTPException(status_code=404, detail="Review item not found") from None
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return {"item": _review_item(proposal)}


@app.get("/agent/scheduled-actions")
def agent_scheduled_actions():
    """Return only explicitly approved proposal work; execution remains gated."""
    actions = [_review_item(item) for item in store.list(ProposalStatus.APPROVED)]
    return {"actions": actions}


@app.post("/agent/proposals/scan")
def agent_proposals_scan():
    """Keep the dashboard pipeline Python-owned until a Strands scanner is wired."""
    return {"actions": [], "created": 0}


@app.get("/agent/user/data")
async def get_agent_user_data(token: str = Depends(get_google_token)):
    """Read OpenPip-owned assistant settings from the user's Drive app data."""
    try:
        data = await read_drive_app_data(token)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return data.get("userData", {})


@app.put("/agent/user/data")
async def save_agent_user_data(payload: dict[str, Any], token: str = Depends(get_google_token)):
    """Persist assistant settings in Drive, never in a legacy service store."""
    allowed = {"agentName", "agentIcon", "theme", "accent"}
    user_data = {key: value for key, value in payload.items() if key in allowed}
    try:
        data = await read_drive_app_data(token)
        data["userData"] = user_data
        await write_drive_app_data(token, data)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return user_data


@app.get("/agent/google/tasks")
@app.get("/api/google/tasks")
async def google_tasks(token: str = Depends(get_google_token)):
    try:
        tasks = await fetch_google_tasks(token)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"tasks": tasks}


@app.get("/agent/calendars")
@app.get("/api/google/calendars")
async def google_calendars(
    from_date: str | None = Query(default=None, alias="from"),
    days: int = Query(default=7, ge=1, le=90),
    token: str = Depends(get_google_token),
):
    try:
        calendars = await fetch_google_calendars(token, from_date=from_date, days=days)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"calendars": calendars}


@app.get("/agent/notebook/pages")
@app.get("/api/google/notebook/pages")
async def google_notebook_pages(token: str = Depends(get_google_token)):
    try:
        pages = await fetch_google_notebook_pages(token)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"pages": pages}


@app.get("/agent/drive/files")
@app.get("/api/google/drive/files")
async def google_drive_files(
    page_size: int = Query(default=50, alias="pageSize", ge=1, le=100),
    token: str = Depends(get_google_token),
):
    try:
        files = await fetch_google_drive_files(token, page_size=page_size)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"files": files}


@app.get("/agent/inbox/messages")
@app.get("/api/google/gmail/messages")
async def google_gmail_messages(
    local_date: str | None = Query(default=None, alias="localDate"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, alias="pageSize", ge=1, le=100),
    token: str = Depends(get_google_token),
):
    try:
        messages, total = await fetch_gmail_messages(token, local_date=local_date, page_size=page_size)
        # Gmail remains readable if the optional OpenPip app-data document has
        # not been created yet or Drive is temporarily unavailable. In that
        # case messages simply have no app-owned tags yet.
        try:
            app_data = await read_drive_app_data(token)
        except Exception:
            app_data = {"tags": [], "messageTags": {}}
        tags_by_id = {
            str(tag.get("id")): str(tag.get("name"))
            for tag in app_data.get("tags", [])
            if isinstance(tag, dict) and tag.get("id") and tag.get("name")
        }
        message_tags = app_data.get("messageTags", {})
        for message in messages:
            message["tags"] = [
                tags_by_id[tag_id]
                for tag_id in message_tags.get(message.get("id", ""), [])
                if tag_id in tags_by_id
            ]
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"messages": messages, "total": total, "page": page, "pageSize": page_size}


@app.get("/agent/inbox/count")
@app.get("/api/google/gmail/count")
async def google_gmail_count(
    local_date: str | None = Query(default=None, alias="localDate"),
    token: str = Depends(get_google_token),
):
    try:
        messages, _ = await fetch_gmail_messages(token, local_date=local_date, page_size=100)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"unread": sum(1 for message in messages if message["unread"])}


@app.get("/agent/inbox/tags")
async def inbox_tags(token: str = Depends(get_google_token)):
    try:
        data = await read_drive_app_data(token)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return [tag for tag in data.get("tags", []) if isinstance(tag, dict)]


@app.post("/agent/inbox/tags")
async def create_inbox_tag(payload: dict[str, Any], token: str = Depends(get_google_token)):
    name = str(payload.get("name", "")).strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name is required")
    now = datetime.now(UTC).isoformat()
    tag = {
        "id": f"tag_{uuid4().hex}",
        "name": name,
        "color": str(payload.get("color") or "#f47560"),
        "createdAt": now,
        "updatedAt": now,
    }
    try:
        data = await read_drive_app_data(token)
        tags = [item for item in data.get("tags", []) if isinstance(item, dict)]
        if any(str(item.get("name", "")).casefold() == name.casefold() for item in tags):
            raise HTTPException(status_code=409, detail="A tag with that name already exists")
        data["tags"] = [*tags, tag]
        await write_drive_app_data(token, data)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return tag


@app.put("/agent/inbox/tags/{tag_id}")
async def update_inbox_tag(tag_id: str, payload: dict[str, Any], token: str = Depends(get_google_token)):
    name = str(payload.get("name", "")).strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name is required")
    try:
        data = await read_drive_app_data(token)
        tags = [item for item in data.get("tags", []) if isinstance(item, dict)]
        tag = next((item for item in tags if str(item.get("id")) == tag_id), None)
        if tag is None:
            raise HTTPException(status_code=404, detail="Tag not found")
        if any(str(item.get("id")) != tag_id and str(item.get("name", "")).casefold() == name.casefold() for item in tags):
            raise HTTPException(status_code=409, detail="A tag with that name already exists")
        tag.update({"name": name, "color": str(payload.get("color") or tag.get("color") or "#f47560"), "updatedAt": datetime.now(UTC).isoformat()})
        data["tags"] = tags
        await write_drive_app_data(token, data)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return tag


@app.delete("/agent/inbox/tags/{tag_id}")
async def delete_inbox_tag(tag_id: str, token: str = Depends(get_google_token)):
    try:
        data = await read_drive_app_data(token)
        tags = [item for item in data.get("tags", []) if isinstance(item, dict)]
        if not any(str(item.get("id")) == tag_id for item in tags):
            raise HTTPException(status_code=404, detail="Tag not found")
        data["tags"] = [item for item in tags if str(item.get("id")) != tag_id]
        data["messageTags"] = {
            message_id: [item for item in tag_ids if item != tag_id]
            for message_id, tag_ids in data.get("messageTags", {}).items()
        }
        await write_drive_app_data(token, data)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"ok": True}


async def _set_message_tag(payload: dict[str, Any], token: str, *, remove: bool) -> dict[str, bool]:
    message_id = str(payload.get("messageId", "")).strip()
    tag_id = str(payload.get("tagId", "")).strip()
    if not message_id or not tag_id:
        raise HTTPException(status_code=400, detail="messageId and tagId are required")
    try:
        data = await read_drive_app_data(token)
        valid_ids = {str(item.get("id")) for item in data.get("tags", []) if isinstance(item, dict)}
        if tag_id not in valid_ids:
            raise HTTPException(status_code=404, detail="Tag not found")
        message_tags = data.setdefault("messageTags", {})
        current = [str(item) for item in message_tags.get(message_id, [])]
        if remove:
            message_tags[message_id] = [item for item in current if item != tag_id]
        elif tag_id not in current:
            message_tags[message_id] = [*current, tag_id]
        await write_drive_app_data(token, data)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"ok": True}


@app.post("/agent/inbox/messages/assign-tag")
async def assign_inbox_tag(payload: dict[str, Any], token: str = Depends(get_google_token)):
    return await _set_message_tag(payload, token, remove=False)


@app.post("/agent/inbox/messages/remove-tag")
async def remove_inbox_tag(payload: dict[str, Any], token: str = Depends(get_google_token)):
    return await _set_message_tag(payload, token, remove=True)


@app.get("/api/demo/contacts")
def demo_contacts_endpoint():
    return {"items": demo_contacts()}


@app.get("/api/demo/workspace")
def demo_workspace():
    return demo_request().model_dump()


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
