import asyncio
import os
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .agent import DAILY_QUOTES, create_briefing, discover_quote_via_grounding
from .executor import ActionExecutor, MockActionExecutor
from .demo_data import demo_contacts, demo_request
from .models import BriefingRequest, BriefingResponse, Proposal, ProposalDecision, ProposalStatus, UserContext, UserPreferences
from .providers import connector_statuses
from .store import ProposalStore
from .google_workspace import (
    GoogleApiError,
    create_gmail_label,
    delete_gmail_label,
    fetch_gmail_message,
    fetch_gmail_labels,
    fetch_gmail_messages,
    modify_gmail_message_labels,
    trash_gmail_messages,
    update_gmail_label,
    fetch_google_calendars,
    fetch_google_contact,
    fetch_google_contacts,
    fetch_google_drive_files,
    fetch_google_notebook_pages,
    fetch_google_tasks,
)
from .google_drive_docs import (
    delete_json_file,
    get_or_create_document,
    list_json_files,
    read_json_file,
    write_json_file,
)
from .google_drive_store import read_drive_app_data, write_drive_app_data
from .guideline_templates import AGENT_MD_SAMPLE, GOALS_SAMPLES
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
store.seed_quotes(list(DAILY_QUOTES))
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


async def _resolve_google_token(
    request: Request,
    x_google_token: str | None,
    authorization: str | None,
) -> str | None:
    """Header-based raw-token auth (x-google-token / Authorization: Bearer) is
    checked first — useful for direct API testing — then falls back to this
    project's own signed session JWT (X-OpenPip-Session), refreshing the
    underlying Google token if it has expired. Never falls back to any other
    project's auth service, and never accepts a cookie. Returns None rather
    than raising — see get_google_token / get_google_token_optional below for
    the strict vs. permissive callers."""
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
    return None


async def get_google_token(
    request: Request,
    x_google_token: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> str:
    """Resolve a live Google access token for this request, or 401."""
    token = await _resolve_google_token(request, x_google_token, authorization)
    if token:
        return token
    raise HTTPException(status_code=401, detail="Google account is not connected")


async def get_google_token_optional(
    request: Request,
    x_google_token: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> str | None:
    """Same resolution as get_google_token, but None instead of a 401 when
    nothing resolves — for endpoints like /agent/briefing that have always
    worked without a connected Google account (the frontend already supplies
    tasks/events/messages in the request body) and should keep doing so;
    Google is only used here to optionally enrich the prompt with the user's
    own Agent & Guidelines documents when it's available."""
    return await _resolve_google_token(request, x_google_token, authorization)


def _google_error(error: GoogleApiError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.detail)


@app.post("/agent/briefing", response_model=BriefingResponse)
@app.post("/api/briefing", response_model=BriefingResponse)
async def briefing(request: BriefingRequest, token: str | None = Depends(get_google_token_optional)) -> BriefingResponse:
    text, generated_by, proposals_created = await create_briefing(request, store, store.get_user_context(), token)
    return BriefingResponse(briefing=text, generated_by=generated_by, proposals_created=proposals_created)


@app.post("/api/quotes/discover")
def discover_quote() -> dict[str, Any]:
    """Ask Nova (Web Grounding enabled) for one real, verifiable quote and add
    it to the pool if it's new. Deliberately a separate, manually-triggered
    endpoint — never called as part of a regular Daily Briefing request, so
    routine briefings never spend a grounding-enabled model call on this.
    """
    try:
        quote, sources = discover_quote_via_grounding()
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Quote discovery failed: {error}") from error
    is_new = store.add_quote_if_new(quote, sources)
    return {"quote": quote, "sources": sources, "is_new": is_new}


@app.post("/api/demo/briefing", response_model=BriefingResponse)
async def demo_briefing() -> BriefingResponse:
    """Run the complete local loop with sanitized fixture data."""
    request = demo_request()
    text, generated_by, proposals_created = await create_briefing(request, store, store.get_user_context())
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
    allowed = {
        "agentName", "agentIcon", "theme", "accent",
        "notificationSound", "notificationVolume", "notificationPitch",
        "addresses",
    }
    user_data = {key: value for key, value in payload.items() if key in allowed}
    try:
        data = await read_drive_app_data(token)
        data["userData"] = user_data
        await write_drive_app_data(token, data)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return user_data


@app.get("/agent/agent-file")
async def agent_file(token: str = Depends(get_google_token)):
    """Get-or-create "OpenPip/agent.md" in the user's real Drive and return
    its content + a link to open it there. See google_drive_docs.py — this is
    a real, visible file (drive.file scope), not the hidden appDataFolder
    /agent/user/data uses. Its content is also what load_context_documents()
    in agent.py folds into the Daily Briefing prompt as "Assistant Identity"."""
    try:
        drive_url, content = await get_or_create_document(token, "OpenPip", "agent.md", AGENT_MD_SAMPLE)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"driveUrl": drive_url, "content": content}


@app.get("/agent/goals-n-guidelines/{skill}")
async def goals_n_guidelines(skill: str, token: str = Depends(get_google_token)):
    """Get-or-create "OpenPip/goals-n-guidelines/{skill}.md". Only the skills
    the Settings page actually offers exist here — see guideline_templates.py."""
    sample = GOALS_SAMPLES.get(skill)
    if sample is None:
        raise HTTPException(status_code=404, detail=f"No guidelines document for skill '{skill}'")
    try:
        drive_url, content = await get_or_create_document(token, "OpenPip/goals-n-guidelines", f"{skill}.md", sample)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"driveUrl": drive_url, "content": content}


TASKS_FOLDER = "OpenPip/tasks"
TASK_SCHEDULES_FOLDER = f"{TASKS_FOLDER}/schedules"


@app.get("/agent/tasks/active")
async def get_active_task(token: str = Depends(get_google_token)):
    """The currently-flagged "Working On" task, if any — a singleton, unlike
    the per-task files below (only one task can be active at a time)."""
    try:
        active = await read_json_file(token, TASKS_FOLDER, "active.json")
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"active": active}


@app.put("/agent/tasks/active")
async def set_active_task(payload: dict[str, Any], token: str = Depends(get_google_token)):
    try:
        await write_json_file(token, TASKS_FOLDER, "active.json", payload)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"ok": True}


@app.delete("/agent/tasks/active")
async def clear_active_task(token: str = Depends(get_google_token)):
    try:
        await delete_json_file(token, TASKS_FOLDER, "active.json")
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"ok": True}


@app.get("/agent/tasks/schedules")
async def list_task_schedules(token: str = Depends(get_google_token)):
    """Every task's local record (accumulated timer elapsed-ms, and/or a
    manually-set scheduledFor/scheduledStartTime/scheduledEndTime) — one real
    Drive file per task (OpenPip/tasks/schedules/{taskId}.json), since tasks
    are an unbounded, ever-growing collection, unlike Settings' fixed set of
    fields in the single appDataFolder document."""
    try:
        entries = await list_json_files(token, TASK_SCHEDULES_FOLDER)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"schedules": entries}


@app.get("/agent/tasks/schedules/{task_id}")
async def get_task_schedule(task_id: str, token: str = Depends(get_google_token)):
    try:
        schedule = await read_json_file(token, TASK_SCHEDULES_FOLDER, f"{task_id}.json")
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"schedule": schedule}


@app.put("/agent/tasks/schedules/{task_id}")
async def patch_task_schedule(task_id: str, payload: dict[str, Any], token: str = Depends(get_google_token)):
    """Merges `payload` onto the task's existing record rather than replacing
    it outright — the timer (elapsedMs) and manual scheduling
    (scheduledFor/scheduledStartTime/scheduledEndTime) are set independently
    from different UI flows, and neither should clobber the other."""
    try:
        current = await read_json_file(token, TASK_SCHEDULES_FOLDER, f"{task_id}.json") or {}
        merged = {**current, **payload}
        await write_json_file(token, TASK_SCHEDULES_FOLDER, f"{task_id}.json", merged)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"schedule": merged}


@app.delete("/agent/tasks/schedules/{task_id}")
async def delete_task_schedule(task_id: str, token: str = Depends(get_google_token)):
    try:
        await delete_json_file(token, TASK_SCHEDULES_FOLDER, f"{task_id}.json")
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"ok": True}


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
    page_size: int = Query(default=20, alias="pageSize", ge=1, le=100),
    token: str = Depends(get_google_token),
):
    try:
        files = await fetch_google_drive_files(token, page_size=page_size)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"files": files}


def _contact_resource_name(contact_id: str) -> str:
    return contact_id if contact_id.startswith("people/") else f"people/{contact_id}"


def _merge_contact(resource_name: str, person: dict[str, Any] | None, entry: dict[str, Any]) -> dict[str, Any]:
    """Combine a Google Contact's identity fields with our own CRM wrapper
    fields into the shape the frontend's Contact type expects. Identity
    (name/email/phone/company/role) always wins from Google; everything else
    (status/notes/interactions/...) always comes from the wrapper entry."""
    person = person or {}
    return {
        "id": resource_name.removeprefix("people/"),
        "name": person.get("name") or entry.get("name") or "Unknown",
        "role": person.get("role") or "",
        "company": person.get("company") or "",
        "email": person.get("email"),
        "phone": person.get("phone"),
        "photoUrl": person.get("photoUrl"),
        "preferredContact": entry.get("preferredContact"),
        "source": entry.get("source", "google_contacts"),
        "status": entry.get("status", "not_contacted"),
        "notes": entry.get("notes"),
        "lastInteractionDate": entry.get("lastInteractionDate"),
        "interactions": entry.get("interactions", []),
        "followUpCadence": entry.get("followUpCadence"),
        "addedAt": entry.get("addedAt"),
        "updatedAt": entry.get("updatedAt"),
    }


@app.get("/agent/career/contacts")
async def career_contacts(token: str = Depends(get_google_token)):
    """List the contacts currently being tracked — i.e. every Google Contact
    that has a CRM wrapper entry in Drive app data. This is deliberately not
    the user's whole address book: someone becomes "tracked" only once the
    agent proposes adding them (approved, then executed), never through a
    form here."""
    try:
        google_contacts, data = await asyncio.gather(
            fetch_google_contacts(token),
            read_drive_app_data(token),
        )
    except GoogleApiError as error:
        raise _google_error(error) from error
    wrapper = data.get("contacts", {})
    contacts = [
        _merge_contact(resource_name, google_contacts.get(resource_name), entry)
        for resource_name, entry in wrapper.items()
        if resource_name in google_contacts  # dropped/merged in Google since — nothing to show
    ]
    contacts.sort(key=lambda c: c.get("updatedAt") or "", reverse=True)
    return {"contacts": contacts}


@app.patch("/agent/career/contacts/{contact_id}")
async def update_career_contact(contact_id: str, payload: dict[str, Any], token: str = Depends(get_google_token)):
    """Update CRM wrapper fields only — status, notes, a logged interaction,
    preferred channel, follow-up cadence. Identity fields are never editable
    here; they live in Google Contacts."""
    resource_name = _contact_resource_name(contact_id)
    try:
        data = await read_drive_app_data(token)
        contacts = data.get("contacts", {})
        entry = contacts.get(resource_name)
        if entry is None:
            raise HTTPException(status_code=404, detail="Contact is not being tracked")
        now = datetime.now(UTC).isoformat()
        for field in ("status", "notes", "preferredContact", "followUpCadence"):
            if field in payload:
                entry[field] = payload[field]
        interaction = payload.get("addInteraction")
        if isinstance(interaction, dict):
            entry.setdefault("interactions", []).append(interaction)
            entry["lastInteractionDate"] = interaction.get("date") or now
        entry["updatedAt"] = now
        contacts[resource_name] = entry
        data["contacts"] = contacts
        await write_drive_app_data(token, data)
        person = await fetch_google_contact(token, resource_name)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"contact": _merge_contact(resource_name, person, entry)}


@app.delete("/agent/career/contacts/{contact_id}")
async def stop_tracking_contact(contact_id: str, token: str = Depends(get_google_token)):
    """Stop tracking a contact — removes the CRM wrapper entry only. The
    underlying Google Contact is never touched."""
    resource_name = _contact_resource_name(contact_id)
    try:
        data = await read_drive_app_data(token)
        contacts = data.get("contacts", {})
        if resource_name not in contacts:
            raise HTTPException(status_code=404, detail="Contact is not being tracked")
        del contacts[resource_name]
        data["contacts"] = contacts
        await write_drive_app_data(token, data)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"ok": True}


@app.get("/agent/inbox/messages")
@app.get("/api/google/gmail/messages")
async def google_gmail_messages(
    local_date: str | None = Query(default=None, alias="localDate"),
    label_id: str | None = Query(default=None, alias="labelId"),
    unread_only: bool = Query(default=False, alias="unreadOnly"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, alias="pageSize", ge=1, le=100),
    token: str = Depends(get_google_token),
):
    try:
        fetch_kwargs: dict[str, Any] = {
            "local_date": local_date,
            "label_id": label_id,
            "unread_only": unread_only,
            "page_size": page_size,
        }
        # Keep the default call shape compatible with lightweight adapters;
        # real Gmail pagination is applied when the client requests page 2+.
        if page > 1:
            fetch_kwargs["page"] = page
        messages, total = await fetch_gmail_messages(token, **fetch_kwargs)
        labels = await fetch_gmail_labels(token)
        labels_by_id = {str(label["id"]): str(label["name"]) for label in labels}
        for message in messages:
            message["tags"] = [
                labels_by_id[label_id]
                for label_id in message.get("labelIds", [])
                if label_id in labels_by_id
            ]
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"messages": messages, "total": total, "page": page, "pageSize": page_size}


@app.get("/agent/inbox/message/{message_id}")
@app.get("/api/google/gmail/message/{message_id}")
async def google_gmail_message(message_id: str, token: str = Depends(get_google_token)):
    """Fetch one Gmail message with its complete readable MIME body."""
    raw_id = message_id.removeprefix("gmail_")
    if not raw_id:
        raise HTTPException(status_code=400, detail="Gmail message id is required")
    try:
        message = await fetch_gmail_message(token, raw_id)
        labels = await fetch_gmail_labels(token)
        labels_by_id = {str(label["id"]): str(label["name"]) for label in labels}
        message["tags"] = [
            labels_by_id[label_id]
            for label_id in message.get("labelIds", [])
            if label_id in labels_by_id
        ]
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"message": message}


@app.delete("/agent/inbox/message")
@app.delete("/api/google/gmail/message")
async def delete_gmail_messages(payload: dict[str, Any], token: str = Depends(get_google_token)):
    """Move the selected Gmail inbox messages to Trash."""
    ids = payload.get("ids")
    if not isinstance(ids, list) or not ids or not all(isinstance(item, str) and item.strip() for item in ids):
        raise HTTPException(status_code=400, detail="ids must be a non-empty array of message ids")
    gmail_ids = [item.strip().removeprefix("gmail_") for item in ids]
    if not all(gmail_ids):
        raise HTTPException(status_code=400, detail="Gmail message ids are required")
    try:
        await trash_gmail_messages(token, gmail_ids)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"ok": True, "deleted": ids}


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
@app.get("/api/google/gmail/labels")
async def inbox_tags(token: str = Depends(get_google_token)):
    try:
        return await fetch_gmail_labels(token)
    except GoogleApiError as error:
        raise _google_error(error) from error


@app.post("/agent/inbox/tags")
@app.post("/api/google/gmail/labels")
async def create_inbox_tag(payload: dict[str, Any], token: str = Depends(get_google_token)):
    name = str(payload.get("name", "")).strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name is required")
    try:
        labels = await fetch_gmail_labels(token)
        if any(str(label.get("name", "")).casefold() == name.casefold() for label in labels):
            raise HTTPException(status_code=409, detail="A Gmail label with that name already exists")
        return await create_gmail_label(token, name)
    except GoogleApiError as error:
        raise _google_error(error) from error


@app.put("/agent/inbox/tags/{tag_id}")
@app.put("/api/google/gmail/labels/{tag_id}")
async def update_inbox_tag(tag_id: str, payload: dict[str, Any], token: str = Depends(get_google_token)):
    name = str(payload.get("name", "")).strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name is required")
    try:
        labels = await fetch_gmail_labels(token)
        if not any(str(label.get("id")) == tag_id for label in labels):
            raise HTTPException(status_code=404, detail="Gmail label not found")
        if any(str(label.get("id")) != tag_id and str(label.get("name", "")).casefold() == name.casefold() for label in labels):
            raise HTTPException(status_code=409, detail="A Gmail label with that name already exists")
        return await update_gmail_label(token, tag_id, name)
    except GoogleApiError as error:
        raise _google_error(error) from error


@app.delete("/agent/inbox/tags/{tag_id}")
@app.delete("/api/google/gmail/labels/{tag_id}")
async def delete_inbox_tag(tag_id: str, token: str = Depends(get_google_token)):
    try:
        labels = await fetch_gmail_labels(token)
        if not any(str(label.get("id")) == tag_id for label in labels):
            raise HTTPException(status_code=404, detail="Gmail label not found")
        await delete_gmail_label(token, tag_id)
    except GoogleApiError as error:
        raise _google_error(error) from error
    return {"ok": True}


async def _set_message_tag(payload: dict[str, Any], token: str, *, remove: bool) -> dict[str, bool]:
    message_id = str(payload.get("messageId", "")).strip()
    tag_id = str(payload.get("tagId", "")).strip()
    if not message_id or not tag_id:
        raise HTTPException(status_code=400, detail="messageId and tagId are required")
    raw_message_id = message_id.removeprefix("gmail_")
    if not raw_message_id:
        raise HTTPException(status_code=400, detail="A Gmail message id is required")
    try:
        labels = await fetch_gmail_labels(token)
        if not any(str(label.get("id")) == tag_id for label in labels):
            raise HTTPException(status_code=404, detail="Gmail label not found")
        await modify_gmail_message_labels(
            token,
            raw_message_id,
            remove_label_ids=[tag_id] if remove else None,
            add_label_ids=[tag_id] if not remove else None,
        )
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
