"""The one-time, resumable historical insight gathering pipeline."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from datetime import UTC, date, datetime, timedelta
from typing import Any, Awaitable, Callable
from uuid import uuid4

from .agent import DEFAULT_AGENT_NAME, build_executive_assistant, load_context_documents
from .google_drive_docs import delete_json_file, list_json_files, read_json_file, write_json_file
from .google_drive_store import read_drive_app_data
from .google_workspace import (
    GoogleApiError,
    fetch_gmail_messages,
    find_oldest_gmail_date,
    find_newest_gmail_date,
    fetch_google_calendars,
    fetch_google_contacts,
    fetch_google_drive_documents,
    list_google_spreadsheet_rows,
    fetch_google_tasks,
    find_oldest_calendar_date,
    find_newest_calendar_date,
    find_oldest_drive_document_date,
    find_newest_drive_document_date,
)
from .tools import (
    build_list_historical_sources_tool,
    build_lookup_insights_tool,
    build_read_historical_source_tool,
    build_remember_insight_tool,
    build_search_historical_sources_tool,
)

_FOLDER = "OpenPip/memory/insights_gathering"
_MANIFEST_FOLDER = f"{_FOLDER}/manifest"
_STATUS_FILE = "status.json"
_MANIFEST_FILE = "metadata.json"
# Five years is enough to recover durable relationships, providers, routines,
# and commitments without turning onboarding into an archival export.
_LOOKBACK_DAYS = 365 * 5
# Keep future commitments visible too, so a historical provider assignment can
# be connected to an appointment already on the calendar.
_LOOKAHEAD_DAYS = 365
_FETCH_WINDOW_DAYS = 90
# This is the agent page size, deliberately much smaller than the manifest.
# The agent sees one chronological page, never the complete history.
_BATCH_SIZE = 10
_WEIGHTS = {"history": 80, "aggregate": 20}
_STAGES = tuple(_WEIGHTS)
_COLLECTION_SOURCES = ("emails", "calendar", "contacts", "tasks", "documents")

_jobs: dict[str, asyncio.Task[None]] = {}
_active_jobs: dict[str, str] = {}
_start_locks: dict[str, asyncio.Lock] = {}
_logger = logging.getLogger(__name__)

TokenResolver = Callable[[], Awaitable[str | None]]


_PUBLIC_COLLECTION_MESSAGE = "Building your chronological history."


def _public_status_message(message: Any) -> str | None:
    value = str(message or "").strip()
    if not value:
        return None
    # Hide legacy and source-specific collection wording from persisted status
    # files as well as from newly-running workers.
    if value.startswith("Gathering ") or value.startswith("Reading Google Drive history") or value.startswith("Reading spreadsheet"):
        return _PUBLIC_COLLECTION_MESSAGE
    return value


def _owner(access_token: str, owner_key: str | None = None) -> str:
    return hashlib.sha256((owner_key or access_token).encode("utf-8")).hexdigest()[:24]


def _stage() -> dict[str, Any]:
    return {"status": "pending", "processed": 0, "total": 0}


def _collection_stage() -> dict[str, Any]:
    return {"status": "pending", "window": 0}


def _default_status() -> dict[str, Any]:
    return {
        "state": "not_started",
        "runId": None,
        "progress": 0,
        "currentStage": None,
        "currentDate": None,
        "statusMessage": None,
        "stages": {name: _stage() for name in _STAGES},
        "collection": {name: _collection_stage() for name in _COLLECTION_SOURCES},
        "oldestSourceDates": {},
        "newestSourceDates": {},
        "insightsWritten": 0,
        "events": [],
        "error": None,
    }


def _add_event(status: dict[str, Any], title: str, detail: str | None = None) -> None:
    status.setdefault("events", []).append({
        "id": str(uuid4()), "type": "pipeline", "at": datetime.now(UTC).isoformat(),
        "title": title, **({"detail": detail} if detail else {}),
    })
    status["events"] = status["events"][-30:]


def _progress(status: dict[str, Any]) -> int:
    def stage_fraction(name: str) -> float:
        stage = (status.get("stages") or {}).get(name) or {}
        if stage.get("status") == "completed":
            return 1.0
        total = int(stage.get("total") or 0)
        processed = int(stage.get("processed") or 0)
        return min(1.0, processed / total) if total else 0.0

    history_fraction = stage_fraction("history")
    oldest_values = [value for value in (status.get("oldestSourceDates") or {}).values() if value]
    newest_values = [value for value in (status.get("newestSourceDates") or {}).values() if value]
    current_value = status.get("currentDate")
    if current_value and oldest_values and newest_values and history_fraction < 1.0:
        try:
            oldest = min(date.fromisoformat(str(value)[:10]) for value in oldest_values)
            newest = max(date.fromisoformat(str(value)[:10]) for value in newest_values)
            current = date.fromisoformat(str(current_value)[:10])
            total_days = max(1, (newest - oldest).days + 1)
            completed_days = min(total_days, max(0, (current - oldest).days + 1))
            history_fraction = completed_days / total_days
        except (TypeError, ValueError):
            # Fall back to record progress while a partially-written boundary
            # checkpoint is being recovered.
            pass
    aggregate_fraction = stage_fraction("aggregate")
    return round(
        _WEIGHTS["history"] * min(1.0, history_fraction)
        + _WEIGHTS["aggregate"] * aggregate_fraction
    )


async def _read_status(access_token: str) -> dict[str, Any]:
    try:
        stored = await read_json_file(access_token, _FOLDER, _STATUS_FILE)
    except Exception:
        # Status polling must remain available when Drive is temporarily slow
        # or unavailable; the next poll can recover the persisted checkpoint.
        return _default_status()
    if not isinstance(stored, dict):
        return _default_status()
    result = _default_status()
    result.update(stored)
    result["stages"] = {name: {**_stage(), **(stored.get("stages", {}).get(name) or {})} for name in _STAGES}
    result["collection"] = {
        name: {**_collection_stage(), **(stored.get("collection", {}).get(name) or {})}
        for name in _COLLECTION_SOURCES
    }
    result["statusMessage"] = _public_status_message(result.get("statusMessage"))
    result["progress"] = _progress(result) if result.get("state") != "completed" else 100
    return result


async def _write_status(access_token: str, status: dict[str, Any]) -> None:
    status["progress"] = 100 if status.get("state") == "completed" else _progress(status)
    _logger.info(
        "historical insight gathering: state=%s stage=%s progress=%s message=%s",
        status.get("state"), status.get("currentStage"), status.get("progress"), status.get("statusMessage"),
    )
    await write_json_file(access_token, _FOLDER, _STATUS_FILE, status)


async def get_insight_gathering_status(
    access_token: str,
    *,
    owner_key: str | None = None,
    token_resolver: TokenResolver | None = None,
) -> dict[str, Any]:
    status = await _read_status(access_token)
    if status.get("state") in {"queued", "running"}:
        owner = _owner(access_token, owner_key)
        active_id = _active_jobs.get(owner)
        if not active_id or active_id not in _jobs:
            # The polling endpoint is allowed to recover a worker after the
            # API process has restarted. The login-only endpoint below is the
            # read-only path used to decide whether to show Study Me or Resume.
            if owner_key is None and token_resolver is None:
                return await start_insight_gathering(access_token)
            return await start_insight_gathering(
                access_token,
                owner_key=owner_key,
                token_resolver=token_resolver,
            )
    return status


async def get_insight_gathering_login_status(
    access_token: str,
    *,
    owner_key: str | None = None,
) -> dict[str, Any]:
    """Read the saved review state for the dashboard's post-login card.

    Login should never launch a worker. A saved incomplete run is exposed as
    paused so the card can offer an explicit Resume button.
    """
    status = await _read_status(access_token)
    if status.get("state") in {"queued", "running"}:
        owner = _owner(access_token, owner_key)
        active_id = _active_jobs.get(owner)
        if not active_id or active_id not in _jobs:
            status["state"] = "paused"
            status["statusMessage"] = "The historical review is ready to resume."
    return status


def _email_source(message: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    source_id = f"email:{message.get('id')}"
    reference = {
        "id": source_id, "kind": "email", "label": message.get("subject") or "(no subject)",
        "detail": f"{message.get('from') or 'Unknown sender'} · {message.get('date') or ''}",
        "url": message.get("gmailUrl"),
    }
    record = {
        "sourceId": source_id, "subject": message.get("subject"), "from": message.get("from"),
        "fromEmail": message.get("fromEmail"), "date": message.get("date"),
        "snippet": str(message.get("snippet") or "")[:600],
        "body": str(message.get("body") or "")[:1500],
    }
    return record, reference


def _chronology_key(entry: dict[str, Any]) -> str:
    record = entry.get("record") if isinstance(entry.get("record"), dict) else entry
    return str(
        record.get("date")
        or record.get("start")
        or record.get("modifiedTime")
        or record.get("dueDate")
        or "9999-12-31"
    )


def _chronological(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Present the oldest evidence first so later batches can refine it."""
    return sorted(entries, key=_chronology_key)


def _next_daily_page(entries: list[dict[str, Any]], offset: int) -> list[dict[str, Any]]:
    """Return one chronological day, capped for unusually busy days."""
    if offset >= len(entries):
        return []
    day = _chronology_key(entries[offset])[:10]
    page: list[dict[str, Any]] = []
    for entry in entries[offset:]:
        if page and _chronology_key(entry)[:10] != day:
            break
        page.append(entry)
        if len(page) == _BATCH_SIZE:
            break
    return page


def _date_filename(day: str) -> str:
    return f"{day}.json"


def _manifest_day(entry: dict[str, Any]) -> str:
    day = _chronology_key(entry)[:10]
    return "undated" if day == "9999-12-31" else day


def _is_default_holiday_calendar(calendar: dict[str, Any]) -> bool:
    """Exclude Google's built-in holiday calendars from personal history."""
    calendar_id = str(calendar.get("id") or "").lower()
    calendar_name = str(calendar.get("name") or "").strip().lower()
    return (
        calendar_id.endswith("#holiday")
        or calendar_name.startswith("holidays in ")
        or calendar_name in {"us holidays", "public holidays", "national holidays"}
        or "observances" in calendar_name
    )


def _entry_key(entry: dict[str, Any]) -> str:
    reference = entry.get("reference") if isinstance(entry.get("reference"), dict) else {}
    record = entry.get("record") if isinstance(entry.get("record"), dict) else {}
    return str(reference.get("id") or record.get("sourceId") or entry.get("sourceId") or "")


def _dedupe_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id: dict[str, dict[str, Any]] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        key = _entry_key(entry)
        if key:
            by_id[key] = entry
    return _chronological(list(by_id.values()))


async def _read_manifest_entries(access_token: str) -> list[dict[str, Any]]:
    files = await list_json_files(access_token, _MANIFEST_FOLDER)
    entries_by_id: dict[str, dict[str, Any]] = {}
    for data in files.values():
        if not isinstance(data, dict):
            continue
        for page in data.get("pages", []):
            if isinstance(page, dict) and isinstance(page.get("entries"), list):
                for item in page["entries"]:
                    if not isinstance(item, dict):
                        continue
                    normalized = _normalize_index_record(item)
                    if normalized:
                        entries_by_id[str(normalized["sourceId"])] = normalized
    return sorted(entries_by_id.values(), key=_chronology_key)


async def _collect_manifest(access_token: str, status: dict[str, Any]) -> dict[str, Any]:
    """Create only the lazy crawl index.

    This function deliberately never reads source records.  It asks each
    provider for boundary metadata (oldest/newest dates) and stores those
    cursors in the small Drive metadata file. The worker fetches records for
    one date later, stores only their titles, and advances the cursor. Memory
    extraction happens only after the complete date range is indexed.
    """
    today = date.today()
    history_start = today - timedelta(days=_LOOKBACK_DAYS)
    history_end = today + timedelta(days=_LOOKAHEAD_DAYS + 1)
    status["currentStage"] = "finding history boundaries"
    status["statusMessage"] = "Finding the oldest and newest dates in each source."
    await _write_status(access_token, status)

    async def probe(name: str, operation: Any) -> date | None:
        try:
            return await operation()
        except Exception as error:
            _logger.warning("historical insight gathering: %s boundary probe failed: %s", name, error)
            return None

    oldest_values, newest_values = await asyncio.gather(
        asyncio.gather(
            probe("email oldest", lambda: find_oldest_gmail_date(access_token, start=history_start, end=today + timedelta(days=1))),
            probe("calendar oldest", lambda: find_oldest_calendar_date(access_token, start=history_start, end=history_end)),
            probe("document oldest", lambda: find_oldest_drive_document_date(access_token)),
        ),
        asyncio.gather(
            probe("email newest", lambda: find_newest_gmail_date(access_token, start=history_start, end=today + timedelta(days=1))),
            probe("calendar newest", lambda: find_newest_calendar_date(access_token, start=history_start, end=history_end)),
            probe("document newest", lambda: find_newest_drive_document_date(access_token)),
        ),
    )
    oldest = {
        "emails": oldest_values[0].isoformat() if oldest_values[0] else None,
        "calendar": oldest_values[1].isoformat() if oldest_values[1] else None,
        "documents": oldest_values[2].isoformat() if oldest_values[2] else None,
        # Tasks and contacts have no provider-side historical date cursor, so
        # their one-day boundary is today.
        "tasks": today.isoformat(),
        "contacts": today.isoformat(),
    }
    newest = {
        "emails": newest_values[0].isoformat() if newest_values[0] else None,
        "calendar": newest_values[1].isoformat() if newest_values[1] else None,
        "documents": newest_values[2].isoformat() if newest_values[2] else None,
        "tasks": today.isoformat(),
        "contacts": today.isoformat(),
    }
    status["oldestSourceDates"] = oldest
    status["newestSourceDates"] = newest
    status["collection"] = {
        source: {**_collection_stage(), "status": "completed"}
        for source in _COLLECTION_SOURCES
    }
    manifest = {
        "oldestSourceDates": oldest,
        "newestSourceDates": newest,
        # The crawl is one chronological daily pass, not one cursor per
        # source.  Source boundaries say which days are worth querying; the
        # single currentDate pointer is the recovery checkpoint.
        "oldestDate": min((value for value in oldest.values() if value), default=None),
        "newestDate": max((value for value in newest.values() if value), default=None),
        "currentDate": min((value for value in oldest.values() if value), default=None),
        "dates": [],
        "lastFetchedDate": None,
        "dateStates": {},
        "aggregateStatus": "pending",
        "warnings": [],
    }
    await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
    status["currentStage"] = None
    status["statusMessage"] = "History boundaries are ready; fetching the oldest records next."
    await _write_status(access_token, status)
    return manifest

def _prompt(stage: str, entries: list[dict[str, Any]], existing_hint: str = "") -> str:
    sources = {entry["reference"]["id"]: entry["reference"] for entry in entries}
    records = [entry["record"] for entry in entries]
    return (
        f"You are performing the one-time historical insight review, currently reviewing {stage}. "
        "Treat the records below as evidence to synthesize, not as a checklist where every item becomes "
        "a memory. Extract only durable, useful facts that are specifically about the user and would "
        "change how an executive assistant helps them later. Before saving, ask whether the fact is "
        "user-specific, durable beyond this source item, and useful for future assistance; if not, save "
        "nothing. Do not create one memory per email, event, task, contact, document, or spreadsheet row. "
        "Prefer one refined memory supported by multiple records over many restatements of individual items. "
        "For each potentially useful person, employer, business, book, purchase, or topic, search_historical_sources first "
        "to find related records on other dates and in other source types, then combine the evidence into "
        "one coherent chronological narrative about that one topic. For every source that may support a durable memory, call "
        "read_historical_source with its exact sourceId before saving; the full record is fetched only "
        "for this final aggregate pass. For every calendar event, use that grounding read when "
        "the event's location or complete fields matter, regardless of category. Do not read clearly "
        "irrelevant records. Synthesize related evidence into one refined chronological narrative. Prefer evidence from at least "
        "two independent sources when available, such as an email "
        "plus a calendar event, a contact plus a Google Doc, or a spreadsheet row plus an email, but do not "
        "discard a durable fact when one authoritative source is sufficient. Cite every "
        "supporting source id used; do not save a source item merely because it exists. "
        "Group actions that serve the same project or initiative into one goal memory. For example, ordering books, "
        "reading those books, reviewing coaching sessions, and preparing for YogaX 2027 belong in one overarching "
        "YogaX goal memory, not separate memories for each activity. Use the project or initiative as the stable "
        "memoryKey and summarize the supporting milestones in its fact. Look for recurring relationships, routines, goals, preferences, communication habits, "
        "scheduled commitments, work history, shopping patterns, purchase cadence, and explicitly "
        "documented care coordination details. Receipts, order confirmations, shipping updates, and "
        "sale messages are useful evidence when they reveal a durable shopping pattern. Repeated "
        "purchases from the same retailer, grocery service, restaurant, or delivery marketplace may "
        "support a concise shopping preference such as where the user regularly shops or which sale "
        "periods they use. Do not create one memory per receipt, and do not call one isolated purchase "
        "a preference unless the user explicitly states it. When repeated dated receipts or orders "
        "support it, record the most recent observed purchase date and a cautious cadence such as weekly, "
        "monthly, every few days, or about every six months. Use a stable key for the underlying pattern, "
        "for example shopping:merchant:<merchant> for a retailer or shopping:grocery:routine for grocery "
        "timing, and update that same memory as later evidence changes the merchant, last date, sale pattern, "
        "or cadence. Merchant names are examples, not a fixed allowlist: include grocery stores, Instacart, "
        "DoorDash, Uber, or any other service only when the records support the relationship. Never store "
        "payment credentials, full card numbers, or unnecessary order details. The same pattern applies "
        "beyond groceries: repeated purchases can establish a routine for items such as running shoes, "
        "household supplies, or other recurring needs. Preserve the last observed purchase date and an "
        "approximate interval when the evidence supports one, so a later proposal can be timed when the "
        "routine is due. Similarly, repeated dated appointments with the same care provider may support a "
        "healthcare visit routine with the last observed visit and approximate cadence; do not infer a "
        "diagnosis or need for care from the cadence alone. Repeated research, reading, or document work "
        "on a subject such as computer science may support a durable learning interest when the pattern is "
        "clear or the user states it explicitly; do not turn every document topic into an interest memory. "
        "A current syllabus, course schedule, or other authoritative planning document may support one "
        "concise learning or schedule memory with the course, relevant due dates, and the latest version "
        "date. Group related due dates under the same course or syllabus key and update it when the syllabus "
        "changes; do not create one memory per assignment row. These memories can help chat and proposal "
        "review recognize upcoming study work. "
        "For employment history, group records for the same employer and role into one timeline memory. "
        "Use a stable key such as work:employment:<employer> and initially record the start date; if a "
        "later record shows that the user left, quit, or ended that job, update that same memory to include "
        "the end date. Never create a separate memory for each work shift, workday, payroll notice, or job "
        "departure when they describe the same employment relationship. Calendar events titled Work, Office, "
        "Shift, Workday, or similar are valid employment evidence when they include a real location. Do not "
        "save each work block as its own memory. Group matching location events into one stable employment "
        "memory, using the earliest event as the observed start and the latest event as the observed end of "
        "the available calendar evidence. If later evidence explicitly shows the user left, use that as the "
        "end date; otherwise describe the span as continuing through the latest observed date rather than "
        "claiming a termination. Write a concise fact such as `The user started working at <location> on "
        "<start date> and was still working there on <latest observed date>.` Do not invent dates when the "
        "evidence only gives an approximate period. When a calendar Work event supplies a location but not "
        "the job title, search the indexed history for an offer letter, hiring, acceptance, or onboarding "
        "email that names the same employer/location, then use read_historical_source on that email before "
        "recording the exact title. The calendar location grounds the employment span, but does not by itself "
        "establish a job title. Also preserve explicit, durable personal profile facts that help tailor future "
        "assistance, including self-described personality, communication style, strengths, values, preferences, "
        "official assessment or test results, certifications, evaluations, awards, and other documented "
        "outcomes. Use categories such as personality, assessment, profile, or context. One authoritative "
        "source can be sufficient for an official result. Update the same stable memory when a result changes. "
        "Do not infer personality traits, diagnoses, or other sensitive conclusions solely from behavior. "
        "Do not save generic public or national holidays, religious observances, or default holiday-calendar "
        "entries; a holiday is only relevant when the user's own notes, attendees, or action make it personal. "
        "Also skip boilerplate reminders and invitations where the user's role is unknown. Do not save "
        "ordinary workday blocks individually; use them as grouped evidence for an employment span when they "
        "share a location. Skip one-off events that do not reveal an ongoing relationship, preference, routine, or "
        "future action. A date by itself is not a durable user fact. Do not save ephemeral details, secrets, "
        "passwords, or inferred diagnoses. "
        "Explicitly named care providers and appointment dates may be saved as factual care-coordination "
        "context; do not infer a diagnosis or treatment. A fact must be directly supported by one or "
        "more exact source ids below. Category guidance: use healthcare for named providers/care "
        "coordination, schedule for dated commitments, work for resumes/employment/job history, "
        "relationship for clients/investors/important people, preference for preferences, routine for "
        "recurring patterns, goal for intentions, learning or interest for durable study topics, "
        "education or schedule for syllabus/course due dates, communication for channel facts, and context for other "
        "durable facts. These are conventions, not validation constraints. "
        "For each candidate memory, first call search_historical_sources and then call "
        "lookup_historical_insights before reading full source records; after those checks, "
        "read any exact sources needed and call remember_historical_insight. The save tool also "
        "rechecks existing memories if the explicit lookup was omitted. Every memory save in this batch must be preceded by both a focused "
        "search_historical_sources call and a focused lookup_historical_insights call, even when the "
        "current evidence looks complete or you think no memory exists yet. The lookup must name the "
        "person, provider, employer, business, project, or other entity involved; an empty lookup is not "
        "allowed. For a possible correction, query the broader stable relationship or category as well as "
        "any new name (for example, search both `healthcare provider` and `Dr. Jones`, because the new "
        "provider's name may not appear in the older memory). Inspect the returned existing memories before deciding what to save. After saving one "
        "memory, repeat both checks before saving another. Use search_historical_sources to find related "
        "records and lookup_historical_insights to find the current durable fact. If a returned memory "
        "describes the same underlying fact, reuse its exact stable memoryKey and rewrite that memory to "
        "the newest supported truth instead of creating a second key. For example, if an existing memory "
        "says the user started seeing Dr. Smith on an earlier date, and a later email says they were switched "
        "to Dr. Jones because Dr. Smith left, update the same healthcare memory to include that change; if a "
        "still later record schedules an appointment with Dr. Jones, update that same care-coordination "
        "memory with the appointment when it belongs to the same ongoing fact. Preserve the useful timeline "
        "and cite the new source ids. If nothing is durable, "
        "save nothing. Return a brief completion note after using the tools.\n\n"
        f"{existing_hint}\nSource references:\n{json.dumps(sources)}\nRecords:\n{json.dumps(records)}"
    )


async def _fetch_lazy_day(
    access_token: str,
    day: date,
    manifest: dict[str, Any],
    indexed: dict[str, dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Fetch only the records belonging to this exact crawl date.

    The source payloads are intentionally ephemeral. Callers persist only the
    resulting index records in the current day's manifest file.
    """
    entries: list[dict[str, Any]] = []
    indexed = indexed or {}
    oldest = manifest.get("oldestSourceDates") if isinstance(manifest.get("oldestSourceDates"), dict) else {}
    newest = manifest.get("newestSourceDates") if isinstance(manifest.get("newestSourceDates"), dict) else {}

    def source_has_records(source: str) -> bool:
        """Return whether this exact day is inside a source's boundaries."""
        try:
            source_oldest = date.fromisoformat(str(oldest.get(source))[:10])
            source_newest = date.fromisoformat(str(newest.get(source))[:10])
        except (TypeError, ValueError):
            return False
        return source_oldest <= day <= source_newest

    if source_has_records("emails"):
        _logger.info("historical insight gathering: fetching email records for date=%s", day)
        messages, total = await fetch_gmail_messages(
            access_token, local_date=day.isoformat(), page=1, page_size=100,
            fetch_all_pages=False,
        )
        for page in range(2, (total + 99) // 100 + 1):
            page_messages, _ = await fetch_gmail_messages(
                access_token, local_date=day.isoformat(), page=page, page_size=100,
                fetch_all_pages=False,
            )
            messages.extend(page_messages)
        for message in messages:
            if message.get("id"):
                record, reference = _email_source(message)
                entries.append({"record": record, "reference": reference})

    if source_has_records("calendar"):
        _logger.info("historical insight gathering: fetching calendar records for date=%s", day)
        calendars = await fetch_google_calendars(access_token, from_date=day.isoformat(), days=1)
        for calendar in calendars:
            if _is_default_holiday_calendar(calendar):
                continue
            for event in calendar.get("events", []):
                source_id = f"calendar:{event.get('id')}"
                if not event.get("id"):
                    continue
                entries.append({
                    "record": {"sourceId": source_id, "calendarId": calendar.get("id"), **{key: event.get(key) for key in ("title", "description", "location", "attendees", "start", "end", "status")}},
                    "reference": {"id": source_id, "kind": "calendar", "label": event.get("title") or "Untitled event", "detail": event.get("start") or "", "url": event.get("htmlLink")},
                })

    if source_has_records("documents"):
        _logger.info("historical insight gathering: fetching Drive records for date=%s", day)
        documents = await fetch_google_drive_documents(
            access_token, modified_start=day, modified_end=day + timedelta(days=1), page_size=100,
        )
        for document in documents:
            document_id = str(document.get("id") or "")
            if not document_id:
                continue
            if document.get("mimeType") == "application/vnd.google-apps.spreadsheet":
                rows = await list_google_spreadsheet_rows(access_token, document_id)
                for row in rows:
                    source_id = f"sheet:{document_id}:{row['sheet']}:{row['rowNumber']}"
                    entries.append({
                        "record": {"sourceId": source_id, "document": document.get("name"), "sheet": row["sheet"], "rowNumber": row["rowNumber"], "modifiedTime": document.get("modifiedTime")},
                        "reference": {"id": source_id, "kind": "google_sheet_row", "label": f"{document.get('name') or 'Spreadsheet'} · {row['sheet']} row {row['rowNumber']}", "detail": document.get("modifiedTime") or "", "url": document.get("webViewLink")},
                    })
            else:
                source_id = f"document:{document_id}"
                entries.append({
                    "record": {"sourceId": source_id, "name": document.get("name"), "modifiedTime": document.get("modifiedTime"), "mimeType": document.get("mimeType")},
                    "reference": {"id": source_id, "kind": "google_doc", "label": document.get("name") or "Untitled document", "detail": document.get("modifiedTime") or "", "url": document.get("webViewLink")},
                })

    # Tasks and contacts do not expose an oldest-date query. Their boundary
    # probes use today, so they are fetched only when the daily pass reaches
    # that exact date.
    if source_has_records("tasks"):
        _logger.info("historical insight gathering: fetching task records for date=%s", day)
        for task in await fetch_google_tasks(access_token, include_completed=True):
            source_id = f"task:{task.get('source', 'google')}:{task.get('id')}"
            entries.append({
                # Tasks have no provider-side historical date. They are
                # intentionally indexed on today's boundary date, while
                # retaining their own dueDate as record detail.
                "record": {"sourceId": source_id, "date": day.isoformat(), "listId": task.get("listId"), **{key: task.get(key) for key in ("title", "notes", "completed", "dueDate", "projectName", "listName")}},
                "reference": {"id": source_id, "kind": "task", "label": task.get("title") or "Task", "detail": task.get("dueDate") or "", "url": None},
            })

    if source_has_records("contacts"):
        _logger.info("historical insight gathering: fetching contact records for date=%s", day)
        for resource_name, person in (await fetch_google_contacts(access_token)).items():
            source_id = f"contact:{resource_name}"
            entries.append({
                "record": {"sourceId": source_id, "date": day.isoformat(), **{key: person.get(key) for key in ("name", "email", "phone", "company", "role")}},
                "reference": {"id": source_id, "kind": "contact", "label": person.get("name") or "Contact", "detail": person.get("email") or "", "url": None},
            })

    # Completed summaries are the recovery checkpoint; only pending records
    # are sent through the source-reading tool again.
    return [
        entry for entry in _dedupe_entries(entries)
        if (indexed.get(_entry_key(entry)) or {}).get("status") != "completed"
    ]


def _advance_daily_date(day: date, manifest: dict[str, Any]) -> None:
    """Advance exactly one day after that day's index and memory pass finish."""
    try:
        newest = date.fromisoformat(str(manifest.get("newestDate"))[:10])
    except (TypeError, ValueError):
        newest_values = [value for value in (manifest.get("newestSourceDates") or {}).values() if value]
        newest = max((date.fromisoformat(str(value)[:10]) for value in newest_values), default=day)
    next_day = day + timedelta(days=1)
    manifest["lastFetchedDate"] = day.isoformat()
    manifest["currentDate"] = next_day.isoformat() if next_day <= newest else None


def _brief_record_summary(entry: dict[str, Any]) -> str:
    """Return only the source's title for the metadata-only daily index."""
    record = entry.get("record") if isinstance(entry.get("record"), dict) else {}
    reference = entry.get("reference") if isinstance(entry.get("reference"), dict) else {}
    kind = str(reference.get("kind") or "record")
    if kind == "email":
        value = str(record.get("subject") or reference.get("label") or "(no subject)")
    elif kind == "calendar":
        value = str(record.get("title") or reference.get("label") or "Untitled event")
    elif kind == "google_doc":
        value = str(record.get("name") or reference.get("label") or "Untitled document")
    elif kind == "google_sheet_row":
        value = str(reference.get("label") or record.get("document") or "Spreadsheet row")
    elif kind == "task":
        value = str(record.get("title") or reference.get("label") or "Untitled task")
    elif kind == "contact":
        value = str(record.get("name") or reference.get("label") or "Unknown contact")
    else:
        value = str(reference.get("label") or record.get("sourceId") or kind)
    return " ".join(value.split())[:240]


def _manifest_record(entry: dict[str, Any], *, status: str, summary: str = "") -> dict[str, Any]:
    """Return index-only metadata, explicitly excluding raw record fields."""
    record = entry.get("record") if isinstance(entry.get("record"), dict) else {}
    reference = entry.get("reference") if isinstance(entry.get("reference"), dict) else {}
    source_id = str(reference.get("id") or record.get("sourceId") or "")
    return {
        "sourceId": source_id,
        "kind": reference.get("kind"),
        "date": _chronology_key(entry)[:10],
        "label": reference.get("label"),
        "detail": reference.get("detail"),
        "url": reference.get("url"),
        "providerId": record.get("calendarId") or record.get("listId"),
        "status": status,
        "summary": summary,
    }


async def _write_lazy_date_index(
    access_token: str,
    manifest: dict[str, Any],
    day: str,
    records: dict[str, dict[str, Any]],
) -> None:
    """Persist the current day's index without storing any source payload."""
    day_entries = sorted(
        (
            normalized
            for item in records.values()
            if isinstance(item, dict)
            for normalized in [_normalize_index_record(item)]
            if normalized and str(normalized.get("date") or "") == day
        ),
        key=lambda item: str(item.get("sourceId") or ""),
    )
    if not day_entries:
        # Empty crawl dates are checkpointed in metadata.json through
        # dateStates/currentDate. Do not create one mostly-empty JSON file per
        # day just to represent that no source records were found.
        await delete_json_file(access_token, _MANIFEST_FOLDER, _date_filename(day))
        return
    pages = [
        {"page": page_number, "entries": day_entries[offset:offset + _BATCH_SIZE]}
        for page_number, offset in enumerate(range(0, len(day_entries), _BATCH_SIZE), start=1)
    ]
    date_states = manifest.get("dateStates") if isinstance(manifest.get("dateStates"), dict) else {}
    await write_json_file(access_token, _MANIFEST_FOLDER, _date_filename(day), {
        "date": day,
        "status": date_states.get(day) or "indexing",
        "numberOfEntries": len(day_entries),
        "completedEntries": sum(item.get("status") == "completed" for item in day_entries),
        "pages": pages,
    })


def _normalize_index_record(item: dict[str, Any]) -> dict[str, Any] | None:
    """Normalize a date-file entry while dropping any legacy raw payload."""
    if item.get("sourceId"):
        return {
            key: item.get(key)
            for key in ("sourceId", "kind", "date", "label", "detail", "url", "providerId", "status", "summary")
        }
    record = item.get("record") if isinstance(item.get("record"), dict) else {}
    reference = item.get("reference") if isinstance(item.get("reference"), dict) else {}
    source_id = str(reference.get("id") or record.get("sourceId") or "")
    if not source_id:
        return None
    return _manifest_record(
        item,
        status=str(item.get("status") or "in_progress"),
        summary=str(item.get("summary") or _brief_record_summary(item)),
    )


async def _read_lazy_date_index(
    access_token: str,
    day: str,
) -> dict[str, dict[str, Any]]:
    date_file = await read_json_file(access_token, _MANIFEST_FOLDER, _date_filename(day))
    if not isinstance(date_file, dict):
        return {}
    result: dict[str, dict[str, Any]] = {}
    pages = date_file.get("pages") if isinstance(date_file.get("pages"), list) else []
    for page in pages:
        entries = page.get("entries") if isinstance(page, dict) else None
        if not isinstance(entries, list):
            continue
        for item in entries:
            if not isinstance(item, dict):
                continue
            normalized = _normalize_index_record(item)
            if normalized:
                result[str(normalized["sourceId"])] = normalized
    return result


async def _run_lazy(access_token: str, status: dict[str, Any], context_block: str, agent_name: str) -> None:
    """Build the daily title index, then run the global agentic memory pass."""
    manifest = await read_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE)
    if not isinstance(manifest, dict):
        manifest = await _collect_manifest(access_token, status)
    else:
        for stage in status["stages"].values():
            stage.update({"status": "pending", "processed": 0, "total": 0})
    # Older v6 checkpoints used one cursor per source.  Preserve their
    # currentDate for recovery, but translate the bounds to the daily-pass
    # shape before doing any more work.
    source_oldest = manifest.get("oldestSourceDates") if isinstance(manifest.get("oldestSourceDates"), dict) else {}
    source_newest = manifest.get("newestSourceDates") if isinstance(manifest.get("newestSourceDates"), dict) else {}
    if not manifest.get("oldestDate"):
        oldest_values = [value for value in source_oldest.values() if value]
        manifest["oldestDate"] = min(oldest_values, default=manifest.get("oldestEntryDate"))
    if not manifest.get("newestDate"):
        newest_values = [value for value in source_newest.values() if value]
        manifest["newestDate"] = max(newest_values, default=manifest.get("newestEntryDate"))
    if not manifest.get("currentDate"):
        manifest["currentDate"] = manifest.get("currentPointerDate") or manifest.get("oldestDate")
    manifest.pop("sourceCursors", None)
    manifest.pop("nextDate", None)
    # Older v6 checkpoints briefly kept all index records in metadata.json.
    # Move those index-only records into their date files before continuing;
    # metadata.json remains pointers-only after this migration.
    had_legacy_fields = any(key in manifest for key in ("sources", "numberOfEntries", "sourceCounts"))
    legacy_records = manifest.pop("sources", {})
    if isinstance(legacy_records, dict) and legacy_records:
        legacy_by_day: dict[str, dict[str, dict[str, Any]]] = {}
        for item in legacy_records.values():
            if not isinstance(item, dict):
                continue
            normalized = _normalize_index_record(item)
            if normalized:
                legacy_by_day.setdefault(str(normalized.get("date") or "undated"), {})[
                    str(normalized["sourceId"])
                ] = normalized
        for legacy_day, day_records in legacy_by_day.items():
            await _write_lazy_date_index(access_token, manifest, legacy_day, day_records)
    manifest.pop("numberOfEntries", None)
    manifest.pop("sourceCounts", None)
    if had_legacy_fields:
        await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
    stage = status["stages"]["history"]
    if stage.get("status") != "completed":
        stage["status"] = "running"

        while True:
            try:
                day = date.fromisoformat(str(manifest.get("currentDate"))[:10])
                newest = date.fromisoformat(str(manifest.get("newestDate"))[:10])
            except (TypeError, ValueError):
                stage["status"] = "completed"
                manifest["currentDate"] = None
                await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
                break
            if day > newest:
                stage["status"] = "completed"
                manifest["currentDate"] = None
                await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
                break

            status["currentStage"] = f"history · {day.isoformat()}"
            status["currentDate"] = day.isoformat()
            status["statusMessage"] = f"Fetching records for {day.isoformat()}."
            _logger.info("historical insight gathering: crawling date=%s", day)
            await _write_status(access_token, status)
            date_key = day.isoformat()
            date_records = await _read_lazy_date_index(access_token, date_key)
            entries = await _fetch_lazy_day(access_token, day, manifest, date_records)
            # Persist only source ids and tiny index metadata before indexing;
            # an interrupted day can therefore be retried without losing place.
            for entry in entries:
                indexed = _manifest_record(entry, status="in_progress")
                date_records[indexed["sourceId"]] = indexed
            manifest["currentDate"] = date_key
            await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
            await _write_lazy_date_index(access_token, manifest, date_key, date_records)

            # Deterministic crawl pass: use the metadata already returned by
            # the provider and persist only a title/status index. No source
            # body or document content is read during indexing.
            for record_number, entry in enumerate(entries, start=1):
                source_id = _entry_key(entry)
                status["statusMessage"] = f"Indexing record {record_number} of {len(entries)} from {day.isoformat()}."
                await _write_status(access_token, status)
                date_records[source_id].update({"status": "completed", "summary": _brief_record_summary(entry)})
                stage["processed"] = int(stage.get("processed") or 0) + 1
                await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
                await _write_lazy_date_index(access_token, manifest, date_key, date_records)

            # Memory extraction is intentionally deferred until every date has
            # been indexed. This keeps the daily crawl fast and gives the final
            # pass a coherent cross-date catalog.
            date_states = manifest.setdefault("dateStates", {})
            date_states[date_key] = "completed"
            await _write_lazy_date_index(access_token, manifest, date_key, date_records)

            _advance_daily_date(day, manifest)
            manifest.setdefault("dates", []).append(day.isoformat())
            manifest["dates"] = list(dict.fromkeys(manifest["dates"]))
            status["currentDate"] = manifest.get("currentDate")
            await _write_lazy_date_index(access_token, manifest, date_key, date_records)
            await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
            _add_event(status, f"Indexed history for {day.isoformat()}", f"{len(date_records)} source records indexed")
            await _write_status(access_token, status)

    await _run_aggregate(access_token, status, manifest, context_block, agent_name)
    status.update({
        "state": "completed",
        "currentStage": None,
        "currentDate": None,
        "completedAt": datetime.now(UTC).isoformat(),
        "error": None,
        "statusMessage": "Historical insights are ready.",
    })
    _add_event(status, "Historical insights are ready")
    await _write_status(access_token, status)
    _logger.info("historical insight gathering: completed history and aggregate memory pass")


def _aggregate_prompt(total: int) -> str:
    """Tell the sole LLM phase to build a global evidence model first."""
    return (
        _prompt("the complete indexed history", [])
        + "\n\n"
        + f"This is the sole agentic phase after deterministic indexing; the manifest contains {total} indexed materials. "
        + "The daily crawl did not make any LLM calls and intentionally stored only dates, source metadata, and titles. "
        + "First call list_historical_sources repeatedly from page 1 until nextPage is null. Treat that catalog as the "
        + "complete scope of this pass. Then crawl every catalog item and read_historical_source for each source before "
        + "saving. This is intentionally the only full-content phase; titles alone are not enough for ownership, "
        + "employment, roles, or relationships. "
        + "Do not save memories while you are still discovering the catalog. Build a cross-date evidence ledger in your "
        + "working context, then synthesize and save only after the full catalog has been inspected.\n\n"
        + "Use lookup_historical_insights and search_historical_sources while investigating. Once you have established "
        + "a correct, coherent narrative, use remember_historical_insight as the write tool to create or update exactly "
        + "one durable memory with the supporting source ids. The `fact` argument is the memory's canonical output and "
        + "will be injected into future Strands system prompts: write it as a self-contained chronology from earliest "
        + "known event to latest known state, with dated events or explicitly bounded time ranges whenever available. "
        + "Explain causal links and role changes, resolve contradictions, and state what remains uncertain. When updating "
        + "a memory, rewrite the entire narrative so it remains coherent; never append a disconnected latest event. Do "
        + "not write provisional memories.\n\n"
        + "Resolve identity and role before writing. A source saying the user has a startup or works with a project does "
        + "not prove the user owns it. If another source identifies a manager, founder, owner, employer, or offer recipient, "
        + "reconcile those roles using the complete source records. Likewise, connect an offer or job decision to the actual "
        + "company and initiative instead of creating a separate employer memory from a brand name alone. Treat existing "
        + "memories as hypotheses: look them up by the relevant entity, correct contradictory facts under their existing "
        + "stable memoryKey when supported, and consolidate duplicate memories rather than adding another variant. "
        + "In particular, never preserve both sides of an ownership or employment contradiction just because they came from "
        + "different dates. Keep source evidence on the final consolidated memory and avoid unsupported assumptions."
        + " For example, if one record loosely describes Scout as the user's startup but other records identify Chad as "
        + "an owner and connect the user's job or Chase-offer decision to Scout, write one dated Scout role/employment "
        + "narrative that preserves those distinctions; do not write that the user owns Scout unless the complete evidence "
        + "actually establishes it."
    )


def _index_reference(item: dict[str, Any]) -> dict[str, Any]:
    return {
        key: item.get(key)
        for key in ("sourceId", "kind", "label", "detail", "url", "providerId")
        if item.get(key) is not None
    }


async def _run_aggregate(
    access_token: str,
    status: dict[str, Any],
    manifest: dict[str, Any],
    context_block: str,
    agent_name: str,
) -> None:
    """Run the only agentic phase over the complete metadata-only manifest."""
    stage = status["stages"]["aggregate"]
    if stage.get("status") == "completed" and manifest.get("aggregateStatus") == "completed":
        return

    entries = await _read_manifest_entries(access_token)
    source_index = {
        str(item["sourceId"]): item
        for item in entries
        if item.get("sourceId")
    }
    stage.update({"status": "running", "processed": 0, "total": len(source_index)})
    status.update({
        "currentStage": "aggregate",
        "currentDate": None,
        "statusMessage": "Building coherent memories from the indexed history.",
    })
    manifest["aggregateStatus"] = "in_progress"
    await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
    await _write_status(access_token, status)

    saved = 0
    if source_index:
        references = {source_id: _index_reference(item) for source_id, item in source_index.items()}

        def counted() -> None:
            nonlocal saved
            saved += 1

        search_state: dict[str, Any] = {}
        lookup_state: dict[str, Any] = {}
        read_state: dict[str, Any] = {}
        aggregate_agent = build_executive_assistant(
            context_block,
            agent_name=agent_name,
            extra_tools=[
                build_list_historical_sources_tool(source_index),
                build_lookup_insights_tool(access_token, lookup_state),
                build_read_historical_source_tool(access_token, source_index, read_state),
                build_search_historical_sources_tool(
                    access_token, _MANIFEST_FOLDER, [],
                    references, search_state, source_index,
                ),
                build_remember_insight_tool(
                    access_token, references, counted, search_state, lookup_state, read_state,
                ),
            ],
        )
        # Strands manages the multi-turn/tool workflow here; this is not a
        # single completion. The agent chooses which indexed sources to read,
        # searches for corroboration, and saves memories as its evidence model
        # becomes coherent.
        await _stream_agent_page(aggregate_agent, _aggregate_prompt(len(source_index)), status, access_token)

    stage.update({"status": "completed", "processed": len(source_index), "total": len(source_index)})
    manifest["aggregateStatus"] = "completed"
    status["insightsWritten"] = int(status.get("insightsWritten") or 0) + saved
    await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
    _add_event(status, "Built coherent historical memories", f"Reviewed {len(source_index)} indexed source records")
    await _write_status(access_token, status)


async def _stream_agent_page(agent: Any, prompt: str, status: dict[str, Any], access_token: str) -> None:
    """Run one page while translating agent tool activity into safe status text."""
    async for event in agent.stream_async(prompt):
        if not isinstance(event, dict):
            continue
        tool_use = event.get("current_tool_use")
        tool_name = tool_use.get("name") if isinstance(tool_use, dict) else None
        message = {
            "read_historical_source": "Reading the full source record for this pass.",
            "lookup_historical_insights": "Checking existing memories for related facts.",
            "search_historical_sources": "Searching related email, calendar, document, and contact evidence.",
            "remember_historical_insight": "Saving a durable insight with its source evidence.",
        }.get(str(tool_name))
        if message and status.get("statusMessage") != message:
            status["statusMessage"] = message
            await _write_status(access_token, status)


async def _run(
    access_token: str,
    run_id: str,
    *,
    owner_key: str | None = None,
    token_resolver: TokenResolver | None = None,
) -> None:
    owner = _owner(access_token, owner_key)
    _logger.info("historical insight gathering: worker started run_id=%s", run_id)
    try:
        status = await _read_status(access_token)
        # Do not reset currentDate here.  The manifest's currentDate is the
        # durable daily-crawl checkpoint used when a worker is restarted.
        status.update({"state": "running", "runId": run_id, "startedAt": status.get("startedAt") or datetime.now(UTC).isoformat(), "error": None, "statusMessage": "Preparing the historical review."})
        _add_event(status, "Historical review started")
        await _write_status(access_token, status)
        refresh_attempts = 0
        while True:
            try:
                app_data, context_block = await asyncio.gather(
                    read_drive_app_data(access_token), load_context_documents(access_token),
                )
                agent_name = str((app_data.get("userData") or {}).get("agentName") or DEFAULT_AGENT_NAME)
                await _run_lazy(access_token, status, context_block, agent_name)
                return
            except GoogleApiError as error:
                if error.status_code not in {401, 403} or token_resolver is None or refresh_attempts >= 2:
                    raise
                try:
                    refreshed_token = await token_resolver()
                except Exception as refresh_error:  # pragma: no cover - provider/network dependent
                    _logger.warning("historical insight gathering: token refresh failed: %s", refresh_error)
                    refreshed_token = None
                if not refreshed_token or refreshed_token == access_token:
                    raise
                refresh_attempts += 1
                access_token = refreshed_token
                status = await _read_status(access_token)
                status.update({
                    "state": "running", "runId": run_id, "error": None,
                    "statusMessage": "Google access refreshed; resuming the historical review.",
                })
                _add_event(status, "Google access refreshed", "Resuming from the saved history checkpoint.")
                await _write_status(access_token, status)
    except Exception as error:
        _logger.exception("historical insight gathering: worker failed run_id=%s", run_id)
        status = await _read_status(access_token)
        status.update({"state": "failed", "error": str(error)[:500], "currentStage": status.get("currentStage")})
        _add_event(status, "Historical review paused", "You can resume it from the dashboard.")
        try:
            await _write_status(access_token, status)
        except Exception as status_error:
            # If the access token itself is invalid and cannot be refreshed,
            # do not mask the original worker failure with a second unhandled
            # exception while attempting to persist the failure state.
            _logger.warning("historical insight gathering: unable to persist failure state: %s", status_error)
    finally:
        _active_jobs.pop(owner, None)
        _jobs.pop(run_id, None)


async def start_insight_gathering(
    access_token: str,
    *,
    owner_key: str | None = None,
    token_resolver: TokenResolver | None = None,
) -> dict[str, Any]:
    owner = _owner(access_token, owner_key)
    lock = _start_locks.setdefault(owner, asyncio.Lock())
    async with lock:
        status = await _read_status(access_token)
        if status.get("state") == "completed":
            return status
        active_id = _active_jobs.get(owner)
        if active_id and active_id in _jobs:
            return status
        run_id = str(status.get("runId") or uuid4())
        status.update({"state": "queued", "runId": run_id, "error": None, "statusMessage": "Resuming the historical review."})
        _add_event(status, "Historical review queued")
        await _write_status(access_token, status)
        _active_jobs[owner] = run_id
        _jobs[run_id] = asyncio.create_task(
            _run(access_token, run_id, owner_key=owner_key, token_resolver=token_resolver),
        )
        return status
