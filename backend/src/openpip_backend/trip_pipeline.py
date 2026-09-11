"""Build a durable trip library from the completed Study Me index.

The historical insight pipeline owns collection and indexing. This module is
the intentionally separate, downstream pass: it reads only the metadata-only
manifest after Study Me is complete and writes user-facing trip records to a
different Drive directory.
"""

from __future__ import annotations

import hashlib
import re
from datetime import UTC, date, datetime
from typing import Any
from uuid import uuid4

from .google_drive_docs import list_json_files, write_json_file
from .insight_gathering import get_insight_gathering_login_status

_INPUT_FOLDER = "OpenPip/memory/insights_gathering/manifest"
_OUTPUT_FOLDER = "OpenPip/travel/trips"
_RUN_FOLDER = "OpenPip/travel/trips/manifest"

_TRIP_TERMS = {
    "airport", "boarding", "car rental", "check-in", "confirmation", "flight",
    "hotel", "itinerary", "lodging", "reservation", "rental car", "rail", "train",
    "travel", "trip",
}
_IATA_ROUTE_RE = re.compile(r"\b([A-Z]{3})\s*(?:-|→|to)\s*([A-Z]{3})\b", re.IGNORECASE)


def _date_part(value: Any) -> str | None:
    text = str(value or "").strip()
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        try:
            return date.fromisoformat(text[:10]).isoformat()
        except ValueError:
            return None
    return None


def _tokens(text: str) -> set[str]:
    return {value for value in re.findall(r"[a-z0-9]{3,}", text.casefold()) if value not in {"the", "and", "from", "with"}}


def _destination(text: str) -> str:
    route = _IATA_ROUTE_RE.search(text)
    if route:
        return f"{route.group(1).upper()} → {route.group(2).upper()}"
    for marker in (" to ", " in ", " at ", " — ", " - ", ": "):
        if marker in text.casefold():
            value = text.casefold().split(marker, 1)[1].strip(" .:-")
            if value:
                return value[:80].strip().title()
    return text.strip()[:80] or "Trip details need review"


def _has_trip_term(text: str) -> bool:
    lowered = text.casefold()
    return any(term in lowered for term in _TRIP_TERMS)


def _source(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(item.get("sourceId") or ""),
        "kind": str(item.get("kind") or "source"),
        "label": str(item.get("label") or item.get("summary") or "Indexed source"),
        "detail": item.get("detail"),
        "url": item.get("url"),
    }


def _read_index_records(files: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for filename, payload in files.items():
        if filename in {"metadata", "status"} or not isinstance(payload, dict):
            continue
        for page in payload.get("pages", []):
            if not isinstance(page, dict):
                continue
            for item in page.get("entries", []):
                if not isinstance(item, dict) or not item.get("sourceId"):
                    continue
                normalized = {
                    "sourceId": str(item.get("sourceId")),
                    "kind": str(item.get("kind") or "source"),
                    "date": _date_part(item.get("date")),
                    "label": str(item.get("label") or ""),
                    "detail": item.get("detail"),
                    "url": item.get("url"),
                    "summary": str(item.get("summary") or ""),
                    "providerId": item.get("providerId"),
                }
                context = " ".join(str(normalized.get(key) or "") for key in ("label", "detail", "summary"))
                if normalized["date"] and _has_trip_term(context):
                    records.append(normalized)
    return records


def _close(first: str, second: str, days: int = 4) -> bool:
    try:
        return abs((date.fromisoformat(first) - date.fromisoformat(second)).days) <= days
    except ValueError:
        return False


def _candidates(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: list[dict[str, Any]] = []
    for record in sorted(records, key=lambda item: str(item.get("date") or "9999-12-31")):
        destination = _destination(f"{record.get('label') or ''} {record.get('summary') or ''}")
        match = next(
            (
                group for group in grouped
                if _close(str(group["startDate"]), str(record["date"]))
                and _tokens(str(group["destination"])) & _tokens(destination)
            ),
            None,
        )
        if match is None:
            grouped.append({
                "destination": destination,
                "startDate": record["date"],
                "endDate": record["date"],
                "sources": [_source(record)],
            })
            continue
        match["endDate"] = max(str(match["endDate"]), str(record["date"]))
        match["sources"].append(_source(record))

    candidates: list[dict[str, Any]] = []
    for group in grouped:
        source_kinds = {str(source.get("kind")) for source in group["sources"]}
        confidence = "confirmed" if {"email", "calendar"}.issubset(source_kinds) else "needs review"
        source_ids = sorted(str(source.get("id")) for source in group["sources"] if source.get("id"))
        stable_id = "trip-" + hashlib.sha256("|".join(source_ids).encode("utf-8")).hexdigest()[:24]
        candidates.append({
            "id": stable_id,
            "kind": "detected",
            "destination": group["destination"],
            "startDate": group["startDate"],
            "endDate": group["endDate"],
            "confidence": confidence,
            "evidence": "Calendar + Gmail" if {"email", "calendar"}.issubset(source_kinds) else ", ".join(sorted(source_kinds)).title(),
            "sources": group["sources"],
            "activities": [],
            "pace": "Balanced",
        })
    return candidates


def _phase(start_date: str | None, end_date: str | None) -> str:
    today = date.today().isoformat()
    if end_date and end_date < today:
        return "past"
    if start_date and start_date > today:
        return "upcoming"
    return "current"


def _public_trip(record: dict[str, Any]) -> dict[str, Any]:
    start_date = _date_part(record.get("startDate"))
    end_date = _date_part(record.get("endDate")) or start_date
    return {
        key: record.get(key)
        for key in ("id", "kind", "destination", "startDate", "endDate", "timezone", "activities", "pace", "confidence", "evidence", "sources", "createdAt", "updatedAt")
        if record.get(key) is not None
    } | {"phase": _phase(start_date, end_date)}


async def list_trips(access_token: str) -> dict[str, Any]:
    files = await list_json_files(access_token, _OUTPUT_FOLDER)
    trips = [_public_trip(record) for record in files.values() if isinstance(record, dict) and record.get("destination")]
    trips.sort(key=lambda item: str(item.get("startDate") or "9999-12-31"), reverse=True)
    groups = {phase: [trip for trip in trips if trip["phase"] == phase] for phase in ("past", "current", "upcoming")}
    run = await list_json_files(access_token, _RUN_FOLDER)
    status = run.get("status") if isinstance(run, dict) else None
    return {"trips": trips, "groups": groups, "pipeline": status or {"state": "not_run"}}


async def save_trip(access_token: str, payload: dict[str, Any]) -> dict[str, Any]:
    destination = str(payload.get("destination") or "").strip()
    if not destination:
        raise ValueError("destination is required")
    start_date = _date_part(payload.get("startDate"))
    end_date = _date_part(payload.get("endDate")) or start_date
    if end_date and start_date and end_date < start_date:
        raise ValueError("endDate must be on or after startDate")
    trip_id = str(payload.get("id") or f"trip-{uuid4().hex[:24]}")
    if not re.fullmatch(r"[a-zA-Z0-9_-]{3,80}", trip_id):
        raise ValueError("invalid trip id")
    existing_files = await list_json_files(access_token, _OUTPUT_FOLDER)
    existing = existing_files.get(trip_id) or {}
    now = datetime.now(UTC).isoformat()
    record = {
        "version": 1,
        "id": trip_id,
        "kind": str(payload.get("kind") or "scratch") if str(payload.get("kind") or "scratch") in {"scratch", "detected"} else "scratch",
        "destination": destination[:200],
        "startDate": start_date,
        "endDate": end_date,
        "timezone": str(payload.get("timezone") or "")[:80] or None,
        "activities": [str(item)[:40] for item in (payload.get("activities") or []) if str(item).strip()][:12],
        "pace": str(payload.get("pace") or "Balanced")[:40],
        "confidence": str(payload.get("confidence") or ("confirmed" if payload.get("kind") == "scratch" else "needs review")),
        "evidence": str(payload.get("evidence") or ("New plan" if payload.get("kind") == "scratch" else "Indexed history"))[:120],
        "sources": [source for source in (payload.get("sources") or []) if isinstance(source, dict)][:20],
        "createdAt": existing.get("createdAt") or now,
        "updatedAt": now,
    }
    await write_json_file(access_token, _OUTPUT_FOLDER, f"{trip_id}.json", record)
    return _public_trip(record)


async def sync_trip_library(access_token: str) -> dict[str, Any]:
    study_status = await get_insight_gathering_login_status(access_token)
    if study_status.get("state") != "completed":
        current = await list_trips(access_token)
        return {
            **current,
            "ready": False,
            "studyMeState": study_status.get("state", "not_started"),
            "message": "Complete Study Me before building the trip library.",
        }

    input_files = await list_json_files(access_token, _INPUT_FOLDER)
    candidates = _candidates(_read_index_records(input_files))
    existing_files = await list_json_files(access_token, _OUTPUT_FOLDER)
    run_id = uuid4().hex
    saved: list[dict[str, Any]] = []
    for candidate in candidates:
        existing = existing_files.get(str(candidate["id"])) or {}
        record = {
            "version": 1,
            **candidate,
            "createdAt": existing.get("createdAt") or datetime.now(UTC).isoformat(),
            "updatedAt": datetime.now(UTC).isoformat(),
            "pipelineRunId": run_id,
        }
        await write_json_file(access_token, _OUTPUT_FOLDER, f"{candidate['id']}.json", record)
        saved.append(_public_trip(record))

    status = {
        "state": "completed",
        "runId": run_id,
        "source": "insights_gathering_manifest",
        "outputFolder": _OUTPUT_FOLDER,
        "recordsWritten": len(saved),
        "completedAt": datetime.now(UTC).isoformat(),
    }
    await write_json_file(access_token, _RUN_FOLDER, "status.json", status)
    current = await list_trips(access_token)
    return {**current, "ready": True, "studyMeState": "completed", "message": "Trip library updated from the completed Study Me index."}
