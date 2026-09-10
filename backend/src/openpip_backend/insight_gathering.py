"""The one-time, resumable historical insight gathering pipeline."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import uuid4

from .agent import DEFAULT_AGENT_NAME, build_executive_assistant, load_context_documents
from .google_drive_docs import list_json_files, read_json_file, write_json_file
from .google_drive_store import read_drive_app_data
from .google_workspace import (
    fetch_gmail_message,
    fetch_gmail_messages,
    find_oldest_gmail_date,
    find_newest_gmail_date,
    fetch_google_calendars,
    fetch_google_contacts,
    fetch_google_drive_document,
    fetch_google_drive_documents,
    fetch_google_spreadsheet_rows,
    fetch_google_spreadsheet_row,
    list_google_spreadsheet_rows,
    fetch_google_tasks,
    find_oldest_calendar_date,
    find_newest_calendar_date,
    find_oldest_drive_document_date,
    find_newest_drive_document_date,
)
from .tools import (
    build_lookup_insights_tool,
    build_read_historical_source_tool,
    build_remember_insight_tool,
    build_search_historical_sources_tool,
)

_FOLDER = "OpenPip/memory/insights_gathering"
_MANIFEST_FOLDER = f"{_FOLDER}/manifest"
_STATUS_FILE = "status.json"
_MANIFEST_FILE = "metadata.json"
_MANIFEST_VERSION = 6
_STATUS_VERSION = 2
_COLLECTION_CHECKPOINT_VERSION = 1
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
_WEIGHTS = {"history": 100}
_STAGES = tuple(_WEIGHTS)
_COLLECTION_SOURCES = ("emails", "calendar", "contacts", "tasks", "documents")

_jobs: dict[str, asyncio.Task[None]] = {}
_active_jobs: dict[str, str] = {}
_start_locks: dict[str, asyncio.Lock] = {}
_logger = logging.getLogger(__name__)


class _CheckpointReused(Exception):
    """Internal sentinel to skip a source whose durable checkpoint is done."""


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


def _owner(access_token: str) -> str:
    return hashlib.sha256(access_token.encode("utf-8")).hexdigest()[:24]


def _stage() -> dict[str, Any]:
    return {"status": "pending", "processed": 0, "total": 0}


def _collection_stage() -> dict[str, Any]:
    return {"status": "pending", "window": 0}


def _default_status() -> dict[str, Any]:
    return {
        "version": _STATUS_VERSION,
        "state": "not_started",
        "runId": None,
        "progress": 0,
        "currentStage": None,
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
    value = 0.0
    for name, weight in _WEIGHTS.items():
        stage = status["stages"].get(name, {})
        total = int(stage.get("total") or 0)
        processed = int(stage.get("processed") or 0)
        fraction = 1.0 if stage.get("status") == "completed" else (processed / total if total else 0)
        value += weight * min(1.0, fraction)
    return round(value)


async def _read_status(access_token: str) -> dict[str, Any]:
    try:
        stored = await read_json_file(access_token, _FOLDER, _STATUS_FILE)
    except Exception:
        # Status polling must remain available when Drive is temporarily slow
        # or unavailable; the next poll can recover the persisted checkpoint.
        return _default_status()
    if not isinstance(stored, dict) or stored.get("version") != _STATUS_VERSION:
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


async def get_insight_gathering_status(access_token: str) -> dict[str, Any]:
    status = await _read_status(access_token)
    if status.get("state") in {"queued", "running"}:
        owner = _owner(access_token)
        if owner not in _active_jobs:
            # The worker is intentionally in memory because the Google token
            # is never stored durably. If the API container restarts, the next
            # browser poll uses the Drive checkpoint to resume it.
            return await start_insight_gathering(access_token)
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
    record = entry.get("record") if isinstance(entry.get("record"), dict) else {}
    return str(record.get("date") or record.get("start") or record.get("dueDate") or "9999-12-31")


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


def _collection_filename(source: str) -> str:
    return f"collection-{source}.json"


async def _read_collection_checkpoint(access_token: str, source: str) -> list[dict[str, Any]]:
    data = await read_json_file(access_token, _MANIFEST_FOLDER, _collection_filename(source))
    if not isinstance(data, dict) or data.get("version") != _COLLECTION_CHECKPOINT_VERSION:
        return []
    entries = data.get("entries")
    return _dedupe_entries(entries) if isinstance(entries, list) else []


async def _write_collection_checkpoint(
    access_token: str, source: str, entries: list[dict[str, Any]],
) -> None:
    await write_json_file(access_token, _MANIFEST_FOLDER, _collection_filename(source), {
        "version": _COLLECTION_CHECKPOINT_VERSION,
        "source": source,
        "entries": _dedupe_entries(entries),
    })


def _manifest_day(entry: dict[str, Any]) -> str:
    day = _chronology_key(entry)[:10]
    return "undated" if day == "9999-12-31" else day


def _date_windows(start: date, end: date) -> list[tuple[date, date]]:
    windows: list[tuple[date, date]] = []
    cursor = start
    while cursor < end:
        window_end = min(end, cursor + timedelta(days=_FETCH_WINDOW_DAYS))
        windows.append((cursor, window_end))
        cursor = window_end
    return windows


def _build_timeline(sources: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    """Merge every source into one oldest-first historical timeline."""
    entries = [entry for values in sources.values() for entry in values if isinstance(entry, dict)]
    return _chronological(entries)


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
    return str(reference.get("id") or record.get("sourceId") or "")


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
    entries: list[dict[str, Any]] = []
    for data in files.values():
        if not isinstance(data, dict) or data.get("version") != _MANIFEST_VERSION:
            continue
        for page in data.get("pages", []):
            if isinstance(page, dict) and isinstance(page.get("entries"), list):
                entries.extend(item for item in page["entries"] if isinstance(item, dict))
    return _dedupe_entries(entries)


def _source_name(entry: dict[str, Any]) -> str | None:
    reference = entry.get("reference") if isinstance(entry.get("reference"), dict) else {}
    return {
        "email": "emails",
        "calendar": "calendar",
        "contact": "contacts",
        "task": "tasks",
        "google_doc": "documents",
        "google_sheet_row": "documents",
    }.get(str(reference.get("kind") or ""))


async def _write_manifest_pages(access_token: str, entries: list[dict[str, Any]]) -> None:
    entries_by_date: dict[str, list[dict[str, Any]]] = {}
    for entry in _dedupe_entries(entries):
        entries_by_date.setdefault(_manifest_day(entry), []).append(entry)
    for day, day_entries in entries_by_date.items():
        pages = [
            {"page": page_number, "entries": day_entries[offset:offset + _BATCH_SIZE]}
            for page_number, offset in enumerate(range(0, len(day_entries), _BATCH_SIZE), start=1)
        ]
        await write_json_file(access_token, _MANIFEST_FOLDER, _date_filename(day), {
            "version": _MANIFEST_VERSION,
            "date": day,
            "numberOfEntries": len(day_entries),
            "pages": pages,
        })


async def _collect_manifest(access_token: str, status: dict[str, Any]) -> dict[str, Any]:
    """Create only the lazy crawl index.

    This function deliberately never reads source records.  It asks each
    provider for boundary metadata (oldest/newest dates) and stores those
    cursors in the small Drive metadata file.  The worker fetches one cursor's
    records later, reviews them in memory, and advances the cursor.
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
        # Tasks and contacts have no provider-side historical date cursor.
        # They are read once at today's cursor, after dated sources finish.
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
    source_cursors = dict(oldest)
    status["oldestSourceDates"] = oldest
    status["newestSourceDates"] = newest
    status["collection"] = {
        source: {**_collection_stage(), "status": "completed"}
        for source in _COLLECTION_SOURCES
    }
    manifest = {
        "version": _MANIFEST_VERSION,
        "oldestSourceDates": oldest,
        "newestSourceDates": newest,
        "sourceCursors": source_cursors,
        "dates": [],
        "lastFetchedDate": None,
        "numberOfEntries": 0,
        "sources": {},
        "sourceCounts": {},
        "warnings": [],
    }
    await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
    status["currentStage"] = None
    status["statusMessage"] = "History boundaries are ready; fetching the oldest records next."
    await _write_status(access_token, status)
    return manifest

    # Kept below as historical reference while the lazy implementation is
    # rolled out.  It is unreachable by design: no source-wide collection or
    # collection checkpoint is allowed in the Study Me startup path.
    manifest: dict[str, Any] = {"version": _MANIFEST_VERSION, "sources": {}, "warnings": []}
    # Collection is independently checkpointed. A worker crash must resume at
    # the last completed source/window instead of starting Gmail at window 1.
    checkpoints = {
        source: await _read_collection_checkpoint(access_token, source)
        for source in _COLLECTION_SOURCES
    }
    manifest["sources"].update(checkpoints)
    status.setdefault("collection", {})
    today = date.today()
    history_start = today - timedelta(days=_LOOKBACK_DAYS)
    history_end = today + timedelta(days=_LOOKAHEAD_DAYS + 1)

    email_state = status["collection"].setdefault("emails", _collection_stage())
    if email_state.get("status") == "completed":
        _logger.info("historical insight gathering: reusing email checkpoint (%s entries)", len(checkpoints["emails"]))
    else:
      try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = "Gathering email, calendar, contact, task, and document records."
        await _write_status(access_token, status)
        messages_by_id: dict[str, dict[str, Any]] = {
            str(entry.get("record", {}).get("sourceId", "")).removeprefix("email:"): {
                **entry.get("record", {}),
                "id": str(entry.get("record", {}).get("sourceId", "")).removeprefix("email:"),
            }
            for entry in checkpoints["emails"]
            if isinstance(entry.get("record"), dict)
        }
        oldest_email = await find_oldest_gmail_date(
            access_token, start=history_start, end=today + timedelta(days=1),
        )
        email_start = oldest_email or today
        email_windows = _date_windows(email_start, today + timedelta(days=1))
        start_window = max(1, int(email_state.get("window") or 0) + 1)
        email_state.update({"status": "running", "total": len(email_windows)})
        await _write_status(access_token, status)
        if start_window > len(email_windows):
            manifest["sources"]["emails"] = checkpoints["emails"]
            email_state["status"] = "completed"
            await _write_status(access_token, status)
            raise _CheckpointReused
        for window_number, (window_start, window_end) in enumerate(email_windows[start_window - 1:], start=start_window):
            status["statusMessage"] = _PUBLIC_COLLECTION_MESSAGE
            await _write_status(access_token, status)
            # The one-day overlap prevents Gmail's exclusive after/before
            # search boundaries from dropping messages at a window edge.
            query_start = window_start - timedelta(days=1)
            query_end = window_end + timedelta(days=1)
            messages, total = await fetch_gmail_messages(
                access_token,
                gmail_query=f"after:{query_start:%Y/%m/%d} before:{query_end:%Y/%m/%d}",
                page=1,
                page_size=1000,
            )
            # fetch_gmail_messages follows Gmail's API pages, then applies a
            # local page. Walk those local pages too so every email in this
            # date window is included without fetching a thousand metadata
            # bodies concurrently.
            for page in range(2, (total + 999) // 1000 + 1):
                extra, _ = await fetch_gmail_messages(
                    access_token,
                    gmail_query=f"after:{query_start:%Y/%m/%d} before:{query_end:%Y/%m/%d}",
                    page=page,
                    page_size=1000,
                )
                messages.extend(extra)
            for message in messages:
                if message.get("id"):
                    messages_by_id[str(message["id"])] = message
            email_entries = []
            for message in messages_by_id.values():
                record, reference = _email_source(message)
                email_entries.append({"record": record, "reference": reference})
            checkpoints["emails"] = _dedupe_entries(email_entries)
            await _write_collection_checkpoint(access_token, "emails", checkpoints["emails"])
            email_state["window"] = window_number
            await _write_status(access_token, status)
            _add_event(status, "Collected email history window", f"through {window_end.isoformat()}")
            await _write_status(access_token, status)
        manifest["sources"]["emails"] = checkpoints["emails"]
        email_state["status"] = "completed"
        await _write_status(access_token, status)
      except _CheckpointReused:
        pass
      except Exception as error:
        manifest["warnings"].append(f"Email history unavailable: {error}")
        manifest["sources"]["emails"] = checkpoints["emails"]
        email_state["status"] = "failed"
        email_state["error"] = str(error)[:300]
        await _write_status(access_token, status)

    calendar_state = status["collection"].setdefault("calendar", _collection_stage())
    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = "Gathering calendar history and upcoming events."
        await _write_status(access_token, status)
        if calendar_state.get("status") == "completed":
            manifest["sources"]["calendar"] = checkpoints["calendar"]
            _logger.info("historical insight gathering: reusing calendar checkpoint (%s entries)", len(checkpoints["calendar"]))
            raise _CheckpointReused
        events_by_id: dict[str, dict[str, Any]] = {
            str(entry.get("record", {}).get("sourceId", "")).removeprefix("calendar:"): {
                **entry.get("record", {}),
                "id": str(entry.get("record", {}).get("sourceId", "")).removeprefix("calendar:"),
                "htmlLink": (entry.get("reference") or {}).get("url"),
            }
            for entry in checkpoints["calendar"]
            if isinstance(entry.get("record"), dict)
        }
        oldest_calendar = await find_oldest_calendar_date(
            access_token, start=history_start, end=history_end,
        )
        calendar_start = oldest_calendar or today
        calendar_windows = _date_windows(calendar_start, history_end)
        start_window = max(1, int(calendar_state.get("window") or 0) + 1)
        calendar_state.update({"status": "running", "total": len(calendar_windows)})
        await _write_status(access_token, status)
        if start_window > len(calendar_windows):
            manifest["sources"]["calendar"] = checkpoints["calendar"]
            calendar_state["status"] = "completed"
            await _write_status(access_token, status)
            raise _CheckpointReused
        for window_number, (window_start, window_end) in enumerate(calendar_windows[start_window - 1:], start=start_window):
            status["statusMessage"] = _PUBLIC_COLLECTION_MESSAGE
            await _write_status(access_token, status)
            calendars = await fetch_google_calendars(
                access_token,
                from_date=window_start.isoformat(),
                days=(window_end - window_start).days,
            )
            for event in (event for calendar in calendars for event in calendar.get("events", [])):
                if event.get("id"):
                    events_by_id[str(event["id"])] = event
            entries = []
            for event in events_by_id.values():
                source_id = f"calendar:{event.get('id')}"
                entries.append({"record": {"sourceId": source_id, **{key: event.get(key) for key in ("title", "description", "location", "attendees", "start", "end", "status")}}, "reference": {"id": source_id, "kind": "calendar", "label": event.get("title") or "Untitled event", "detail": event.get("start") or "", "url": event.get("htmlLink")}})
            checkpoints["calendar"] = _chronological(entries)
            await _write_collection_checkpoint(access_token, "calendar", checkpoints["calendar"])
            calendar_state["window"] = window_number
            await _write_status(access_token, status)
            _add_event(status, "Collected calendar history window", f"through {window_end.isoformat()}")
            await _write_status(access_token, status)
        events = list(events_by_id.values())
        entries = []
        holiday_event_ids = {
            str(event.get("id"))
            for calendar in calendars
            if _is_default_holiday_calendar(calendar)
            for event in calendar.get("events", [])
            if event.get("id")
        }
        for event in events:
            if str(event.get("id")) in holiday_event_ids:
                continue
            source_id = f"calendar:{event.get('id')}"
            entries.append({
                "record": {"sourceId": source_id, **{key: event.get(key) for key in ("title", "description", "location", "attendees", "start", "end", "status")}},
                "reference": {"id": source_id, "kind": "calendar", "label": event.get("title") or "Untitled event", "detail": event.get("start") or "", "url": event.get("htmlLink")},
            })
        manifest["sources"]["calendar"] = _chronological(entries)
        calendar_state["status"] = "completed"
        await _write_status(access_token, status)
    except _CheckpointReused:
        pass
    except Exception as error:
        manifest["warnings"].append(f"Calendar history unavailable: {error}")
        manifest["sources"]["calendar"] = checkpoints["calendar"]
        calendar_state["status"] = "failed"
        calendar_state["error"] = str(error)[:300]
        await _write_status(access_token, status)

    contacts_state = status["collection"].setdefault("contacts", _collection_stage())
    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = _PUBLIC_COLLECTION_MESSAGE
        await _write_status(access_token, status)
        if contacts_state.get("status") == "completed":
            manifest["sources"]["contacts"] = checkpoints["contacts"]
            raise _CheckpointReused
        contacts = await fetch_google_contacts(access_token)
        entries = []
        for resource_name, person in contacts.items():
            source_id = f"contact:{resource_name}"
            entries.append({
                "record": {"sourceId": source_id, **{key: person.get(key) for key in ("name", "email", "phone", "company", "role")}},
                "reference": {"id": source_id, "kind": "contact", "label": person.get("name") or "Contact", "detail": person.get("email") or "", "url": None},
            })
        manifest["sources"]["contacts"] = entries
        checkpoints["contacts"] = entries
        await _write_collection_checkpoint(access_token, "contacts", entries)
        contacts_state["status"] = "completed"
        await _write_status(access_token, status)
    except _CheckpointReused:
        pass
    except Exception as error:
        manifest["warnings"].append(f"Contacts unavailable: {error}")
        manifest["sources"]["contacts"] = checkpoints["contacts"]
        contacts_state["status"] = "failed"
        contacts_state["error"] = str(error)[:300]
        await _write_status(access_token, status)

    tasks_state = status["collection"].setdefault("tasks", _collection_stage())
    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = _PUBLIC_COLLECTION_MESSAGE
        await _write_status(access_token, status)
        if tasks_state.get("status") == "completed":
            manifest["sources"]["tasks"] = checkpoints["tasks"]
            raise _CheckpointReused
        tasks = await fetch_google_tasks(access_token, include_completed=True)
        entries = []
        for task in tasks:
            source_id = f"task:{task.get('source', 'google')}:{task.get('id')}"
            entries.append({
                "record": {"sourceId": source_id, **{key: task.get(key) for key in ("title", "notes", "completed", "dueDate", "projectName", "listName")}},
                "reference": {"id": source_id, "kind": "task", "label": task.get("title") or "Task", "detail": task.get("dueDate") or "", "url": None},
            })
        manifest["sources"]["tasks"] = _chronological(entries)
        checkpoints["tasks"] = manifest["sources"]["tasks"]
        await _write_collection_checkpoint(access_token, "tasks", checkpoints["tasks"])
        tasks_state["status"] = "completed"
        await _write_status(access_token, status)
    except _CheckpointReused:
        pass
    except Exception as error:
        manifest["warnings"].append(f"Tasks unavailable: {error}")
        manifest["sources"]["tasks"] = checkpoints["tasks"]
        tasks_state["status"] = "failed"
        tasks_state["error"] = str(error)[:300]
        await _write_status(access_token, status)

    documents_state = status["collection"].setdefault("documents", _collection_stage())
    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = _PUBLIC_COLLECTION_MESSAGE
        await _write_status(access_token, status)
        if documents_state.get("status") == "completed":
            manifest["sources"]["documents"] = checkpoints["documents"]
            raise _CheckpointReused
        documents = await fetch_google_drive_documents(access_token)
        oldest_document = await find_oldest_drive_document_date(access_token)
        if oldest_document:
            status.setdefault("oldestSourceDates", {})["documents"] = oldest_document.isoformat()
            await _write_status(access_token, status)
        entries = list(checkpoints["documents"])
        document_total = len(documents)
        async def report_document_progress(message: str) -> None:
            status["statusMessage"] = message
            await _write_status(access_token, status)

        for document_number, document in enumerate(documents, start=1):
            document_id = str(document.get("id") or "")
            await report_document_progress(_PUBLIC_COLLECTION_MESSAGE)
            if document.get("mimeType") == "application/vnd.google-apps.spreadsheet":
                for row in await fetch_google_spreadsheet_rows(
                    access_token,
                    document_id,
                    status_callback=report_document_progress,
                ):
                    source_id = f"sheet:{document_id}:{row['sheet']}:{row['rowNumber']}"
                    entries.append({
                        "record": {
                            "sourceId": source_id, "document": document.get("name"),
                            "sheet": row["sheet"], "rowNumber": row["rowNumber"], "values": row["values"],
                            "modifiedTime": document.get("modifiedTime"),
                        },
                        "reference": {
                            "id": source_id, "kind": "google_sheet_row",
                            "label": f"{document.get('name') or 'Spreadsheet'} · {row['sheet']} row {row['rowNumber']}",
                            "detail": document.get("modifiedTime") or "", "url": document.get("webViewLink"),
                        },
                    })
                checkpoints["documents"] = _dedupe_entries(entries)
                await _write_collection_checkpoint(access_token, "documents", checkpoints["documents"])
            elif document_id:
                source_id = f"document:{document_id}"
                entries.append({
                    "record": {
                        "sourceId": source_id, "name": document.get("name"),
                        "modifiedTime": document.get("modifiedTime"), "mimeType": document.get("mimeType"),
                    },
                    "reference": {
                        "id": source_id, "kind": "google_doc", "label": document.get("name") or "Untitled document",
                        "detail": document.get("modifiedTime") or "", "url": document.get("webViewLink"),
                    },
                })
                checkpoints["documents"] = _dedupe_entries(entries)
                await _write_collection_checkpoint(access_token, "documents", checkpoints["documents"])
        manifest["sources"]["documents"] = _chronological(entries)
        documents_state["status"] = "completed"
        await _write_status(access_token, status)
    except _CheckpointReused:
        pass
    except Exception as error:
        manifest["warnings"].append(f"Google Docs unavailable: {error}")
        manifest["sources"]["documents"] = checkpoints["documents"]
        documents_state["status"] = "failed"
        documents_state["error"] = str(error)[:300]
        await _write_status(access_token, status)

    timeline = _build_timeline(manifest["sources"])
    entries_by_date: dict[str, list[dict[str, Any]]] = {}
    for entry in timeline:
        day = _manifest_day(entry)
        entries_by_date.setdefault(day, []).append(entry)
    dates = sorted(entries_by_date)
    oldest_source_dates = {
        source: min((_manifest_day(entry) for entry in entries), default=None)
        for source, entries in manifest["sources"].items()
    }
    status["oldestSourceDates"] = oldest_source_dates
    oldest_date = min((day for day in oldest_source_dates.values() if day), default=None)
    _logger.info("historical insight gathering: oldest source dates=%s; review starts=%s", oldest_source_dates, oldest_date)
    for day, day_entries in entries_by_date.items():
        pages = [
            {"page": page_number, "entries": day_entries[offset:offset + _BATCH_SIZE]}
            for page_number, offset in enumerate(range(0, len(day_entries), _BATCH_SIZE), start=1)
        ]
        await write_json_file(access_token, _MANIFEST_FOLDER, _date_filename(day), {
            "version": _MANIFEST_VERSION,
            "date": day,
            "numberOfEntries": len(day_entries),
            "pages": pages,
        })
    # Keep metadata as a small checkpoint/index. Each date's records live in
    # its own manifest/<date>.json file, and the agent only receives one page.
    dated = [day for day in dates if day != "undated"]
    manifest = {
        "version": _MANIFEST_VERSION,
        "oldestEntryDate": dated[0] if dated else None,
        "newestEntryDate": dated[-1] if dated else None,
        "numberOfEntries": len(timeline),
        "dates": dates,
        "currentPointerDate": None,
        "currentPointerPage": None,
        "sourceCounts": {name: len(values) for name, values in manifest["sources"].items()},
        "warnings": manifest["warnings"],
    }
    for name in _STAGES:
        status["stages"][name]["total"] = len(timeline)
    status["currentStage"] = None
    status["statusMessage"] = "Historical records are ready for chronological review."
    await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
    return manifest


async def _read_date_page(access_token: str, day: str, page_number: int) -> list[dict[str, Any]]:
    date_file = await read_json_file(access_token, _MANIFEST_FOLDER, _date_filename(day))
    if not isinstance(date_file, dict) or date_file.get("version") != _MANIFEST_VERSION:
        return []
    pages = date_file.get("pages")
    if not isinstance(pages, list) or page_number < 1 or page_number > len(pages):
        return []
    page = pages[page_number - 1]
    entries = page.get("entries") if isinstance(page, dict) else None
    return entries if isinstance(entries, list) else []


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
        "the summaries for this date. For every source that may support a durable memory, call "
        "read_historical_source with its exact sourceId before saving; the full record is fetched only "
        "for this final date-processing pass. Do not read clearly irrelevant records. "
        "one memory. Prefer evidence from at least two independent sources when available, such as an email "
        "plus a calendar event, a contact plus a Google Doc, or a spreadsheet row plus an email. Cite every "
        "supporting source id used; do not save a source item merely because it exists. "
        "Group actions that serve the same project or initiative into one goal memory. For example, ordering books, "
        "reading those books, reviewing coaching sessions, and preparing for YogaX 2027 belong in one overarching "
        "YogaX goal memory, not separate memories for each activity. Use the project or initiative as the stable "
        "memoryKey and summarize the supporting milestones in its fact. Look for recurring relationships, routines, goals, preferences, communication habits, "
        "scheduled commitments, work history, and explicitly documented care coordination details. "
        "For employment history, group records for the same employer and role into one timeline memory. "
        "Use a stable key such as work:employment:<employer> and initially record the start date; if a "
        "later record shows that the user left, quit, or ended that job, update that same memory to include "
        "the end date. Never create a separate memory for each work shift, workday, payroll notice, or job "
        "departure when they describe the same employment relationship. Do not invent dates when the evidence "
        "only gives an approximate period. "
        "Do not save generic public or national holidays, religious observances, or default holiday-calendar "
        "entries; a holiday is only relevant when the user's own notes, attendees, or action make it personal. "
        "Also skip boilerplate reminders, ordinary workday blocks, invitations where the user's role is "
        "unknown, and one-off events that do not reveal an ongoing relationship, preference, routine, or "
        "future action. A date by itself is not a durable user fact. Do not save ephemeral details, secrets, "
        "passwords, or inferred diagnoses. "
        "Explicitly named care providers and appointment dates may be saved as factual care-coordination "
        "context; do not infer a diagnosis or treatment. A fact must be directly supported by one or "
        "more exact source ids below. Category guidance: use healthcare for named providers/care "
        "coordination, schedule for dated commitments, work for resumes/employment/job history, "
        "relationship for clients/investors/important people, preference for preferences, routine for "
        "recurring patterns, goal for intentions, communication for channel facts, and context for other "
        "durable facts. These are conventions, not validation constraints. "
        "Every memory save in this batch must be preceded by both a focused search_historical_sources call and a lookup_historical_insights call, even when the current evidence looks complete. After saving one memory, repeat both checks before saving another. Use search_historical_sources to find related records and lookup_historical_insights when a related memory may already "
        "exist, and use remember_historical_insight for each useful fact. Always reuse the same stable "
        "memoryKey for an existing fact so it is edited rather than duplicated. If nothing is durable, "
        "save nothing. Return a brief completion note after using the tools.\n\n"
        f"{existing_hint}\nSource references:\n{json.dumps(sources)}\nRecords:\n{json.dumps(records)}"
    )


async def _hydrate_page(access_token: str, stage: str, entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Load large source bodies only for the current small agent page."""
    async def hydrate(entry: dict[str, Any]) -> dict[str, Any]:
        record = dict(entry.get("record") or {})
        source_id = str(record.get("sourceId") or "")
        try:
            if source_id.startswith("email:"):
                message_id = source_id.removeprefix("email:").removeprefix("gmail_")
                message = await fetch_gmail_message(access_token, message_id)
                record["body"] = str(message.get("body") or "")[:1500]
            elif source_id.startswith("document:"):
                # The full document is allowed during this one-record pass so
                # the summary and any durable memory are grounded precisely.
                # It is never persisted in the manifest.
                record["content"] = await fetch_google_drive_document(access_token, source_id.removeprefix("document:"))
            elif source_id.startswith("sheet:"):
                row_parts = source_id.removeprefix("sheet:").rsplit(":", 1)
                file_parts = row_parts[0].split(":", 1) if len(row_parts) == 2 else []
                if len(file_parts) == 2:
                    row = await fetch_google_spreadsheet_row(
                        access_token, file_parts[0], file_parts[1], int(row_parts[1]),
                    )
                    record.update(row)
        except Exception:
            # Metadata remains useful if an individual body/export is no longer
            # accessible; one source should not stop the chronological pass.
            pass
        return {**entry, "record": record}

    return await asyncio.gather(*(hydrate(entry) for entry in entries))


def _indexed_date_entries(records: dict[str, dict[str, Any]], day: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for item in records.values():
        if item.get("date") != day or item.get("status") != "completed":
            continue
        source_id = str(item.get("sourceId") or "")
        reference = {
            "id": source_id,
            "kind": item.get("kind"),
            "label": item.get("label"),
            "detail": item.get("detail"),
            "url": item.get("url"),
        }
        entries.append({
            "record": {"sourceId": source_id, "date": day, "summary": item.get("summary") or ""},
            "reference": reference,
        })
    return entries


async def _fetch_lazy_day(
    access_token: str,
    day: date,
    manifest: dict[str, Any],
) -> list[dict[str, Any]]:
    """Fetch only the records at the current source cursors.

    The returned entries are intentionally ephemeral.  Callers must not write
    them to Drive; only the cursor metadata is durable.
    """
    entries: list[dict[str, Any]] = []
    cursors = manifest.setdefault("sourceCursors", {})
    end = date.fromisoformat(str(manifest.get("newestSourceDates", {}).get("calendar") or day)) + timedelta(days=1)

    if cursors.get("emails") == day.isoformat():
        _logger.info("historical insight gathering: fetching email records for oldest date=%s", day)
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

    if cursors.get("calendar") == day.isoformat():
        _logger.info("historical insight gathering: fetching calendar records for oldest date=%s", day)
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

    if cursors.get("documents") == day.isoformat():
        _logger.info("historical insight gathering: fetching Drive records for oldest date=%s", day)
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

    # Tasks and contacts do not expose an oldest-date query.  Read each only
    # at the single current-day cursor and then retire that cursor.
    if cursors.get("tasks") == day.isoformat():
        _logger.info("historical insight gathering: fetching task records for cursor date=%s", day)
        for task in await fetch_google_tasks(access_token, include_completed=True):
            source_id = f"task:{task.get('source', 'google')}:{task.get('id')}"
            entries.append({
                "record": {"sourceId": source_id, "date": task.get("dueDate") or day.isoformat(), "listId": task.get("listId"), **{key: task.get(key) for key in ("title", "notes", "completed", "dueDate", "projectName", "listName")}},
                "reference": {"id": source_id, "kind": "task", "label": task.get("title") or "Task", "detail": task.get("dueDate") or "", "url": None},
            })

    if cursors.get("contacts") == day.isoformat():
        _logger.info("historical insight gathering: fetching contact records for cursor date=%s", day)
        for resource_name, person in (await fetch_google_contacts(access_token)).items():
            source_id = f"contact:{resource_name}"
            entries.append({
                "record": {"sourceId": source_id, "date": day.isoformat(), **{key: person.get(key) for key in ("name", "email", "phone", "company", "role")}},
                "reference": {"id": source_id, "kind": "contact", "label": person.get("name") or "Contact", "detail": person.get("email") or "", "url": None},
            })

    indexed = manifest.get("sources") if isinstance(manifest.get("sources"), dict) else {}
    # Completed summaries are the recovery checkpoint; only pending records
    # are sent through the source-reading tool again.
    return [
        entry for entry in _dedupe_entries(entries)
        if (indexed.get(_entry_key(entry)) or {}).get("status") != "completed"
    ]


async def _advance_lazy_cursors(access_token: str, day: date, manifest: dict[str, Any]) -> None:
    """Move only source cursors; no source records are persisted."""
    cursors = manifest.setdefault("sourceCursors", {})
    newest = manifest.get("newestSourceDates", {})
    history_end = date.today() + timedelta(days=_LOOKAHEAD_DAYS + 1)
    if cursors.get("emails") == day.isoformat():
        next_day = await find_oldest_gmail_date(access_token, start=day + timedelta(days=1), end=date.today() + timedelta(days=1))
        newest_day = str(newest.get("emails") or "")
        if next_day and newest_day and next_day.isoformat() > newest_day:
            next_day = None
        cursors["emails"] = next_day.isoformat() if next_day else None
    if cursors.get("calendar") == day.isoformat():
        next_day = await find_oldest_calendar_date(access_token, start=day + timedelta(days=1), end=history_end)
        newest_day = str(newest.get("calendar") or "")
        if next_day and newest_day and next_day.isoformat() > newest_day:
            next_day = None
        cursors["calendar"] = next_day.isoformat() if next_day else None
    if cursors.get("documents") == day.isoformat():
        next_day = await find_oldest_drive_document_date(access_token, start=day + timedelta(days=1))
        newest_day = str(newest.get("documents") or "")
        if next_day and newest_day and next_day.isoformat() > newest_day:
            next_day = None
        cursors["documents"] = next_day.isoformat() if next_day else None
    if cursors.get("tasks") == day.isoformat():
        cursors["tasks"] = None
    if cursors.get("contacts") == day.isoformat():
        cursors["contacts"] = None
    manifest["lastFetchedDate"] = day.isoformat()
    manifest["nextDate"] = min((value for value in cursors.values() if value), default=None)
    manifest["newestSourceDates"] = newest


def _brief_record_summary(entry: dict[str, Any]) -> str:
    """Build a tiny searchable index value; never persist raw source content."""
    record = entry.get("record") if isinstance(entry.get("record"), dict) else {}
    reference = entry.get("reference") if isinstance(entry.get("reference"), dict) else {}
    kind = str(reference.get("kind") or "record")
    if kind == "email":
        value = f"{record.get('date', '')[:10]} email from {record.get('from') or 'unknown'}: {record.get('subject') or '(no subject)'}"
        detail = " ".join(str(record.get("body") or record.get("snippet") or "").split())
        if detail:
            value += f" — {detail[:150]}"
    elif kind == "calendar":
        value = f"{str(record.get('start') or '')[:10]} calendar: {record.get('title') or 'untitled'}"
        if record.get("location"):
            value += f" at {record['location']}"
    elif kind == "google_doc":
        value = f"{str(record.get('modifiedTime') or '')[:10]} document: {record.get('name') or 'untitled'}"
        detail = " ".join(str(record.get("content") or "").split())
        if detail:
            value += f" — {detail[:150]}"
    elif kind == "google_sheet_row":
        values = record.get("values") if isinstance(record.get("values"), dict) else {}
        compact = "; ".join(f"{key}: {str(value).strip()}" for key, value in list(values.items())[:3])
        value = f"{str(record.get('modifiedTime') or '')[:10]} spreadsheet {record.get('document') or 'untitled'}, {record.get('sheet') or 'sheet'} row {record.get('rowNumber')}: {compact}"
    elif kind == "task":
        value = f"{str(record.get('dueDate') or record.get('date') or '')[:10]} task: {record.get('title') or 'untitled'}"
    elif kind == "contact":
        value = f"contact: {record.get('name') or 'unknown'}"
        if record.get("company"):
            value += f" at {record['company']}"
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


async def _run_lazy(access_token: str, status: dict[str, Any], context_block: str, agent_name: str) -> None:
    """Review one oldest-date batch at a time while persisting only the index."""
    manifest = await read_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE)
    if not isinstance(manifest, dict) or manifest.get("version") != _MANIFEST_VERSION or not isinstance(manifest.get("sourceCursors"), dict):
        manifest = await _collect_manifest(access_token, status)
        for stage in status["stages"].values():
            stage.update({"status": "pending", "processed": 0, "total": 0})
    records = manifest.setdefault("sources", {})
    stage = status["stages"]["history"]
    stage["status"] = "running"

    while True:
        cursors = manifest.get("sourceCursors") if isinstance(manifest.get("sourceCursors"), dict) else {}
        active_dates = [str(value) for value in cursors.values() if value]
        if not active_dates:
            stage["status"] = "completed"
            status.update({"state": "completed", "currentStage": None, "completedAt": datetime.now(UTC).isoformat(), "error": None, "statusMessage": "Historical insights are ready."})
            await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
            _add_event(status, "Historical insights are ready")
            await _write_status(access_token, status)
            return

        day = date.fromisoformat(min(active_dates))
        status["currentStage"] = f"history · {day.isoformat()}"
        status["statusMessage"] = f"Fetching records for {day.isoformat()}."
        _logger.info("historical insight gathering: oldest crawl date=%s", day)
        await _write_status(access_token, status)
        entries = await _fetch_lazy_day(access_token, day, manifest)
        # Persist only source ids and tiny index metadata before the agent runs;
        # an interrupted batch can therefore be retried without losing place.
        for entry in entries:
            indexed = _manifest_record(entry, status="in_progress")
            records[indexed["sourceId"]] = indexed
        manifest["numberOfEntries"] = len(records)
        await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)

        # Deterministic crawl pass: read one record, derive a tiny index summary,
        # persist only that summary/status, and release the record.
        for record_number, entry in enumerate(entries, start=1):
            source_id = _entry_key(entry)
            status["statusMessage"] = f"Indexing record {record_number} of {len(entries)} from {day.isoformat()}."
            await _write_status(access_token, status)
            hydrated = (await _hydrate_page(access_token, "history", [entry]))[0]
            fallback = _brief_record_summary(hydrated)
            records[source_id].update({"status": "completed", "summary": fallback})
            stage["processed"] = int(stage.get("processed") or 0) + 1
            manifest["numberOfEntries"] = len(records)
            await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)

        # Only after every record for this date has a completed summary do we
        # give the complete date dataset to the memory-extraction agent.
        date_key = day.isoformat()
        date_states = manifest.setdefault("dateStates", {})
        date_entries = _indexed_date_entries(records, date_key)
        if date_entries and date_states.get(date_key) != "completed":
            date_states[date_key] = "memory_in_progress"
            await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
            references = {entry["reference"]["id"]: entry["reference"] for entry in date_entries}
            saved = 0

            def counted() -> None:
                nonlocal saved
                saved += 1

            search_state: dict[str, Any] = {}
            lookup_state: dict[str, Any] = {}
            memory_agent = build_executive_assistant(
                context_block,
                agent_name=agent_name,
                extra_tools=[
                    build_lookup_insights_tool(access_token, lookup_state),
                    build_read_historical_source_tool(access_token, records),
                    build_search_historical_sources_tool(
                        access_token, _MANIFEST_FOLDER, [], _MANIFEST_VERSION,
                        references, search_state, records,
                    ),
                    build_remember_insight_tool(access_token, references, counted, search_state, lookup_state),
                ],
            )
            status["statusMessage"] = f"Reading the complete {date_key} index for durable memories."
            await _write_status(access_token, status)
            await _stream_agent_page(memory_agent, _prompt(f"all summarized history for {date_key}", date_entries), status, access_token)
            date_states[date_key] = "completed"
            status["insightsWritten"] = int(status.get("insightsWritten") or 0) + saved

        await _advance_lazy_cursors(access_token, day, manifest)
        manifest.setdefault("dates", []).append(day.isoformat())
        manifest["dates"] = list(dict.fromkeys(manifest["dates"]))
        manifest["numberOfEntries"] = len(records)
        await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
        _add_event(status, f"Indexed history for {day.isoformat()}", f"{len(records)} source records indexed")
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


async def _run(access_token: str, run_id: str) -> None:
    owner = _owner(access_token)
    _logger.info("historical insight gathering: worker started run_id=%s", run_id)
    try:
        status = await _read_status(access_token)
        status.update({"state": "running", "runId": run_id, "startedAt": status.get("startedAt") or datetime.now(UTC).isoformat(), "error": None, "statusMessage": "Preparing the historical review."})
        _add_event(status, "Historical review started")
        await _write_status(access_token, status)
        app_data, context_block = await asyncio.gather(read_drive_app_data(access_token), load_context_documents(access_token))
        agent_name = str((app_data.get("userData") or {}).get("agentName") or DEFAULT_AGENT_NAME)
        await _run_lazy(access_token, status, context_block, agent_name)
        return
        manifest = await read_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE)
        collection_complete = all(
            status.get("collection", {}).get(source, {}).get("status") == "completed"
            for source in _COLLECTION_SOURCES
        )
        if not isinstance(manifest, dict) or manifest.get("version") != _MANIFEST_VERSION or not collection_complete:
            manifest = await _collect_manifest(access_token, status)
            collection_complete = all(
                status.get("collection", {}).get(source, {}).get("status") == "completed"
                for source in _COLLECTION_SOURCES
            )
            if not collection_complete:
                status.update({"state": "failed", "error": "One or more source collections did not complete."})
                _add_event(status, "Collection paused", "Resume to retry only the unfinished source.")
                await _write_status(access_token, status)
                return
            for stage in status["stages"].values():
                stage.update({"status": "pending", "processed": 0, "page": 0, "dateIndex": 0, "total": manifest.get("numberOfEntries", 0)})

        app_data, context_block = await asyncio.gather(read_drive_app_data(access_token), load_context_documents(access_token))
        agent_name = str((app_data.get("userData") or {}).get("agentName") or DEFAULT_AGENT_NAME)
        for stage_name in _STAGES:
            stage = status["stages"][stage_name]
            if stage.get("status") == "completed":
                continue
            dates = manifest.get("dates") if isinstance(manifest.get("dates"), list) else []
            total_records = int(manifest.get("numberOfEntries") or 0)
            stage.update({"status": "running", "total": total_records})
            status["currentStage"] = "history"
            await _write_status(access_token, status)
            offset = int(stage.get("processed") or 0)
            date_index = int(stage.get("dateIndex") or 0)
            page_number = int(stage.get("page") or 0) + 1
            while date_index < len(dates):
                page = await _read_date_page(access_token, str(dates[date_index]), page_number)
                if not page:
                    date_index += 1
                    page_number = 1
                    continue
                page_day = str(dates[date_index])
                batch = await _hydrate_page(access_token, stage_name, page)
                status["currentStage"] = f"history · {page_day}"
                manifest["currentPointerDate"] = page_day
                manifest["currentPointerPage"] = page_number
                await write_json_file(access_token, _MANIFEST_FOLDER, _MANIFEST_FILE, manifest)
                await _write_status(access_token, status)
                references = {entry["reference"]["id"]: entry["reference"] for entry in batch}
                saved = 0
                def counted() -> None:
                    nonlocal saved
                    saved += 1
                search_state: dict[str, Any] = {}
                lookup_state: dict[str, Any] = {}
                agent = build_executive_assistant(
                    context_block,
                    agent_name=agent_name,
                    extra_tools=[
                        build_lookup_insights_tool(access_token, lookup_state),
                        build_search_historical_sources_tool(
                            access_token, _MANIFEST_FOLDER, [str(day) for day in dates],
                            _MANIFEST_VERSION, references, search_state,
                        ),
                        build_remember_insight_tool(access_token, references, counted, search_state, lookup_state),
                    ],
                )
                status["statusMessage"] = f"Reviewing records from {page_day} and comparing them with existing memories."
                await _write_status(access_token, status)
                _logger.info("historical insight gathering: reviewing date=%s page=%s records=%s", page_day, page_number, len(batch))
                await _stream_agent_page(agent, _prompt(f"history for {page_day}", batch), status, access_token)
                stage["processed"] = offset + len(batch)
                stage["dateIndex"] = date_index
                stage["page"] = page_number
                status["insightsWritten"] = int(status.get("insightsWritten") or 0) + saved
                _add_event(status, f"Reviewed history for {page_day}", f"{stage['processed']} of {stage['total']} records")
                await _write_status(access_token, status)
                offset += len(batch)
                page_number += 1
            stage["status"] = "completed"
            await _write_status(access_token, status)
        status.update({"state": "completed", "currentStage": None, "completedAt": datetime.now(UTC).isoformat(), "error": None, "statusMessage": "Historical insights are ready."})
        _add_event(status, "Historical insights are ready")
        await _write_status(access_token, status)
        _logger.info("historical insight gathering: worker completed run_id=%s insights=%s", run_id, status.get("insightsWritten", 0))
    except Exception as error:
        _logger.exception("historical insight gathering: worker failed run_id=%s", run_id)
        status = await _read_status(access_token)
        status.update({"state": "failed", "error": str(error)[:500], "currentStage": status.get("currentStage")})
        _add_event(status, "Historical review paused", "You can resume it from the dashboard.")
        await _write_status(access_token, status)
    finally:
        _active_jobs.pop(owner, None)
        _jobs.pop(run_id, None)


async def start_insight_gathering(access_token: str) -> dict[str, Any]:
    owner = _owner(access_token)
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
        _jobs[run_id] = asyncio.create_task(_run(access_token, run_id))
        return status
