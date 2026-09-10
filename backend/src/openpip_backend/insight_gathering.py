"""The one-time, resumable historical insight gathering pipeline."""

from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import uuid4

from .agent import DEFAULT_AGENT_NAME, build_executive_assistant, load_context_documents
from .google_drive_docs import read_json_file, write_json_file
from .google_drive_store import read_drive_app_data
from .google_workspace import (
    fetch_gmail_message,
    fetch_gmail_messages,
    fetch_google_calendars,
    fetch_google_contacts,
    fetch_google_drive_document,
    fetch_google_drive_documents,
    fetch_google_spreadsheet_rows,
    fetch_google_tasks,
)
from .tools import build_lookup_insights_tool, build_remember_insight_tool

_FOLDER = "OpenPip/memory/insight-gathering"
_STATUS_FILE = "status.json"
_MANIFEST_FILE = "manifest.json"
_MANIFEST_VERSION = 3
_STATUS_VERSION = 2
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

_jobs: dict[str, asyncio.Task[None]] = {}
_active_jobs: dict[str, str] = {}
_start_locks: dict[str, asyncio.Lock] = {}


def _owner(access_token: str) -> str:
    return hashlib.sha256(access_token.encode("utf-8")).hexdigest()[:24]


def _stage() -> dict[str, Any]:
    return {"status": "pending", "processed": 0, "total": 0}


def _default_status() -> dict[str, Any]:
    return {
        "version": _STATUS_VERSION,
        "state": "not_started",
        "runId": None,
        "progress": 0,
        "currentStage": None,
        "statusMessage": None,
        "stages": {name: _stage() for name in _STAGES},
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
    stored = await read_json_file(access_token, _FOLDER, _STATUS_FILE)
    if not isinstance(stored, dict) or stored.get("version") != _STATUS_VERSION:
        return _default_status()
    result = _default_status()
    result.update(stored)
    result["stages"] = {name: {**_stage(), **(stored.get("stages", {}).get(name) or {})} for name in _STAGES}
    result["progress"] = _progress(result) if result.get("state") != "completed" else 100
    return result


async def _write_status(access_token: str, status: dict[str, Any]) -> None:
    status["progress"] = 100 if status.get("state") == "completed" else _progress(status)
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


async def _collect_manifest(access_token: str, status: dict[str, Any]) -> dict[str, Any]:
    manifest: dict[str, Any] = {"version": _MANIFEST_VERSION, "sources": {}, "warnings": []}
    today = date.today()
    history_start = today - timedelta(days=_LOOKBACK_DAYS)
    history_end = today + timedelta(days=_LOOKAHEAD_DAYS + 1)

    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = "Gathering email, calendar, contact, task, and document records."
        await _write_status(access_token, status)
        messages_by_id: dict[str, dict[str, Any]] = {}
        for window_start, window_end in _date_windows(history_start, today + timedelta(days=1)):
            # The one-day overlap prevents Gmail's exclusive after/before
            # search boundaries from dropping messages at a window edge.
            query_start = window_start - timedelta(days=1)
            query_end = window_end + timedelta(days=1)
            messages, total = await fetch_gmail_messages(
                access_token,
                gmail_query=f"after:{query_start:%Y/%m/%d} before:{query_end:%Y/%m/%d}",
                page=1,
                page_size=100,
            )
            # fetch_gmail_messages follows Gmail's API pages, then applies a
            # local page. Walk those local pages too so every email in this
            # date window is included without fetching a thousand metadata
            # bodies concurrently.
            for page in range(2, (total + 99) // 100 + 1):
                extra, _ = await fetch_gmail_messages(
                    access_token,
                    gmail_query=f"after:{query_start:%Y/%m/%d} before:{query_end:%Y/%m/%d}",
                    page=page,
                    page_size=100,
                )
                messages.extend(extra)
            for message in messages:
                if message.get("id"):
                    messages_by_id[str(message["id"])] = message
            _add_event(status, "Collected email history window", f"through {window_end.isoformat()}")
            await _write_status(access_token, status)
        email_entries = []
        for message in messages_by_id.values():
            record, reference = _email_source(message)
            email_entries.append({"record": record, "reference": reference})
        manifest["sources"]["emails"] = _chronological(email_entries)
    except Exception as error:
        manifest["warnings"].append(f"Email history unavailable: {error}")
        manifest["sources"]["emails"] = []

    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = "Gathering calendar history and upcoming events."
        await _write_status(access_token, status)
        events_by_id: dict[str, dict[str, Any]] = {}
        for window_start, window_end in _date_windows(history_start, history_end):
            calendars = await fetch_google_calendars(
                access_token,
                from_date=window_start.isoformat(),
                days=(window_end - window_start).days,
            )
            for event in (event for calendar in calendars for event in calendar.get("events", [])):
                if event.get("id"):
                    events_by_id[str(event["id"])] = event
            _add_event(status, "Collected calendar history window", f"through {window_end.isoformat()}")
            await _write_status(access_token, status)
        events = list(events_by_id.values())
        entries = []
        for event in events:
            source_id = f"calendar:{event.get('id')}"
            entries.append({
                "record": {"sourceId": source_id, **{key: event.get(key) for key in ("title", "description", "location", "attendees", "start", "end", "status")}},
                "reference": {"id": source_id, "kind": "calendar", "label": event.get("title") or "Untitled event", "detail": event.get("start") or "", "url": event.get("htmlLink")},
            })
        manifest["sources"]["calendar"] = _chronological(entries)
    except Exception as error:
        manifest["warnings"].append(f"Calendar history unavailable: {error}")
        manifest["sources"]["calendar"] = []

    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = "Gathering contacts to connect people to historical activity."
        await _write_status(access_token, status)
        contacts = await fetch_google_contacts(access_token)
        entries = []
        for resource_name, person in contacts.items():
            source_id = f"contact:{resource_name}"
            entries.append({
                "record": {"sourceId": source_id, **{key: person.get(key) for key in ("name", "email", "phone", "company", "role")}},
                "reference": {"id": source_id, "kind": "contact", "label": person.get("name") or "Contact", "detail": person.get("email") or "", "url": None},
            })
        manifest["sources"]["contacts"] = entries
    except Exception as error:
        manifest["warnings"].append(f"Contacts unavailable: {error}")
        manifest["sources"]["contacts"] = []

    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = "Gathering tasks and commitments."
        await _write_status(access_token, status)
        tasks = await fetch_google_tasks(access_token, include_completed=True)
        entries = []
        for task in tasks:
            source_id = f"task:{task.get('source', 'google')}:{task.get('id')}"
            entries.append({
                "record": {"sourceId": source_id, **{key: task.get(key) for key in ("title", "notes", "completed", "dueDate", "projectName", "listName")}},
                "reference": {"id": source_id, "kind": "task", "label": task.get("title") or "Task", "detail": task.get("dueDate") or "", "url": None},
            })
        manifest["sources"]["tasks"] = _chronological(entries)
    except Exception as error:
        manifest["warnings"].append(f"Tasks unavailable: {error}")
        manifest["sources"]["tasks"] = []

    try:
        status["currentStage"] = "collecting history"
        status["statusMessage"] = "Gathering Google Docs and spreadsheet rows."
        await _write_status(access_token, status)
        documents = await fetch_google_drive_documents(access_token)
        entries = []
        for document in documents:
            document_id = str(document.get("id") or "")
            if document.get("mimeType") == "application/vnd.google-apps.spreadsheet":
                for row in await fetch_google_spreadsheet_rows(access_token, document_id):
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
        manifest["sources"]["documents"] = _chronological(entries)
    except Exception as error:
        manifest["warnings"].append(f"Google Docs unavailable: {error}")
        manifest["sources"]["documents"] = []

    manifest["timeline"] = _build_timeline(manifest["sources"])
    for name in _STAGES:
        status["stages"][name]["total"] = len(manifest["timeline"])
    status["currentStage"] = None
    status["statusMessage"] = "Historical records are ready for chronological review."
    await write_json_file(access_token, _FOLDER, _MANIFEST_FILE, manifest)
    return manifest


def _prompt(stage: str, entries: list[dict[str, Any]], existing_hint: str = "") -> str:
    sources = {entry["reference"]["id"]: entry["reference"] for entry in entries}
    records = [entry["record"] for entry in entries]
    return (
        f"You are performing the one-time historical insight review, currently reviewing {stage}. "
        "Extract only durable, useful facts about the user that would help an executive assistant "
        "later. Look for recurring relationships, routines, goals, preferences, communication habits, "
        "scheduled commitments, work history, and explicitly documented care coordination details. "
        "and important context. Do not save ephemeral details, secrets, passwords, or inferred diagnoses. "
        "Explicitly named care providers and appointment dates may be saved as factual care-coordination "
        "context; do not infer a diagnosis or treatment. A fact must be directly supported by one or "
        "more exact source ids below. Category guidance: use healthcare for named providers/care "
        "coordination, schedule for dated commitments, work for resumes/employment/job history, "
        "relationship for clients/investors/important people, preference for preferences, routine for "
        "recurring patterns, goal for intentions, communication for channel facts, and context for other "
        "durable facts. These are conventions, not validation constraints. "
        "Use lookup_historical_insights when a related memory may already "
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
                message = await fetch_gmail_message(access_token, source_id.removeprefix("email:"))
                record["body"] = str(message.get("body") or "")[:1500]
            elif source_id.startswith("document:"):
                record["content"] = (await fetch_google_drive_document(access_token, source_id.removeprefix("document:")))[:5000]
        except Exception:
            # Metadata remains useful if an individual body/export is no longer
            # accessible; one source should not stop the chronological pass.
            pass
        return {**entry, "record": record}

    return await asyncio.gather(*(hydrate(entry) for entry in entries))


async def _stream_agent_page(agent: Any, prompt: str, status: dict[str, Any], access_token: str) -> None:
    """Run one page while translating agent tool activity into safe status text."""
    async for event in agent.stream_async(prompt):
        if not isinstance(event, dict):
            continue
        tool_use = event.get("current_tool_use")
        tool_name = tool_use.get("name") if isinstance(tool_use, dict) else None
        message = {
            "lookup_historical_insights": "Checking existing memories for related facts.",
            "remember_historical_insight": "Saving a durable insight with its source evidence.",
        }.get(str(tool_name))
        if message and status.get("statusMessage") != message:
            status["statusMessage"] = message
            await _write_status(access_token, status)


async def _run(access_token: str, run_id: str) -> None:
    owner = _owner(access_token)
    try:
        status = await _read_status(access_token)
        status.update({"state": "running", "runId": run_id, "startedAt": status.get("startedAt") or datetime.now(UTC).isoformat(), "error": None, "statusMessage": "Preparing the historical review."})
        _add_event(status, "Historical review started")
        await _write_status(access_token, status)
        manifest = await read_json_file(access_token, _FOLDER, _MANIFEST_FILE)
        if not isinstance(manifest, dict) or manifest.get("version") != _MANIFEST_VERSION:
            manifest = await _collect_manifest(access_token, status)

        app_data, context_block = await asyncio.gather(read_drive_app_data(access_token), load_context_documents(access_token))
        agent_name = str((app_data.get("userData") or {}).get("agentName") or DEFAULT_AGENT_NAME)
        for stage_name in _STAGES:
            stage = status["stages"][stage_name]
            entries = manifest.get("timeline", [])
            if stage.get("status") == "completed":
                continue
            stage.update({"status": "running", "total": len(entries)})
            status["currentStage"] = "history"
            await _write_status(access_token, status)
            offset = int(stage.get("processed") or 0)
            while offset < len(entries):
                page = _next_daily_page(entries, offset)
                page_day = _chronology_key(page[0])[:10] if page else ""
                batch = await _hydrate_page(access_token, stage_name, page)
                status["currentStage"] = f"history · {page_day}"
                await _write_status(access_token, status)
                references = {entry["reference"]["id"]: entry["reference"] for entry in batch}
                saved = 0
                def counted() -> None:
                    nonlocal saved
                    saved += 1
                agent = build_executive_assistant(
                    context_block,
                    agent_name=agent_name,
                    extra_tools=[build_lookup_insights_tool(access_token), build_remember_insight_tool(access_token, references, counted)],
                )
                status["statusMessage"] = f"Reviewing records from {page_day} and comparing them with existing memories."
                await _write_status(access_token, status)
                await _stream_agent_page(agent, _prompt(f"history for {page_day}", batch), status, access_token)
                stage["processed"] = offset + len(batch)
                stage["page"] = int(stage.get("page") or 0) + 1
                status["insightsWritten"] = int(status.get("insightsWritten") or 0) + saved
                _add_event(status, f"Reviewed history for {page_day}", f"{stage['processed']} of {stage['total']} records")
                await _write_status(access_token, status)
                offset += len(batch)
            stage["status"] = "completed"
            await _write_status(access_token, status)
        status.update({"state": "completed", "currentStage": None, "completedAt": datetime.now(UTC).isoformat(), "error": None, "statusMessage": "Historical insights are ready."})
        _add_event(status, "Historical insights are ready")
        await _write_status(access_token, status)
    except Exception as error:
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
