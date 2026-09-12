"""Build a durable trip library from the completed Study Me index.

The historical insight pipeline owns collection and indexing. This module is
the intentionally separate, downstream pass: it reads only the metadata-only
manifest after Study Me is complete and writes user-facing trip records to a
different Drive directory.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
from datetime import UTC, date, datetime
from typing import Any
from uuid import uuid4

import boto3

from .google_drive_docs import list_json_files, write_json_file
from .insight_gathering import get_insight_gathering_login_status

_INPUT_FOLDER = "OpenPip/memory/insights_gathering/manifest"
_OUTPUT_FOLDER = "OpenPip/travel/trips"
_RUN_FOLDER = "OpenPip/travel/trips/manifest"
_logger = logging.getLogger(__name__)

_TRIP_TERMS = {
    "airport", "boarding", "car rental", "check-in", "confirmation", "flight",
    "hotel", "itinerary", "lodging", "reservation", "rental car", "rail", "train",
    "travel", "trip",
}
_IATA_ROUTE_RE = re.compile(r"\b([A-Z]{3})\s*(?:-|→|to)\s*([A-Z]{3})\b", re.IGNORECASE)
_agent_pipeline_jobs: dict[str, dict[str, Any]] = {}
_NOVA_GROUNDING_MODEL_ID = "us.amazon.nova-2-lite-v1:0"
_REQUIRED_SIGNAL_CATEGORIES = {
    "weather", "temperature", "uv", "altitude", "health", "disease", "animals",
    "volcanic_activity", "earthquake", "tsunami", "water", "fire", "air_quality",
    "gear", "route", "security", "kidnapping",
}


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
        for key in ("id", "kind", "destination", "startDate", "endDate", "timezone", "activities", "pace", "confidence", "evidence", "sources", "createdAt", "updatedAt", "agent-pipeline", "agent-pipeline-stage", "agent-pipeline-run-id", "agent-pipeline-started-at", "agent-pipeline-completed-at", "agent-pipeline-error", "agent-pipeline-output")
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


def _grounded_json(prompt: str) -> tuple[dict[str, Any], list[str]]:
    """Run one bounded Nova Grounding research stage and parse its JSON."""
    client = boto3.client(
        "bedrock-runtime",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_APP_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_APP_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    response = client.converse(
        modelId=_NOVA_GROUNDING_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        toolConfig={"tools": [{"systemTool": {"name": "nova_grounding"}}]},
    )
    content = response.get("output", {}).get("message", {}).get("content", [])
    text = "\n".join(block["text"] for block in content if isinstance(block, dict) and "text" in block)
    sources = list(dict.fromkeys(
        citation["location"]["web"]["url"]
        for block in content
        if isinstance(block, dict) and isinstance(block.get("citationsContent"), dict)
        for citation in block["citationsContent"].get("citations", [])
        if citation.get("location", {}).get("web", {}).get("url")
    ))
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("Nova did not return a JSON research stage")
    parsed = json.loads(text[start:end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("Nova research stage was not an object")
    return parsed, sources


def _trip_prompt(record: dict[str, Any], focus: str) -> str:
    destination = str(record.get("destination") or "").strip()
    dates = f"{record.get('startDate') or 'flexible'} to {record.get('endDate') or 'flexible'}"
    activities = ", ".join(str(value) for value in record.get("activities") or []) or "general travel"
    is_itinerary_stage = focus.startswith("a practical")
    schema = (
        '{"overview":"short summary","signals":[{"category":"weather|temperature|uv|altitude|health|disease|animals|water|fire|volcanic_activity|earthquake|tsunami|air_quality|gear|route|security|kidnapping","title":"...","detail":"...","severity":"info|caution|urgent"}],"preparation":[{"title":"...","detail":"..."}]}'
        if not is_itinerary_stage
        else '{"overview":"short summary","routeSummary":"route context and what still needs confirmation","stays":[{"name":"...","area":"...","type":"hotel|hostel|camping|other","detail":"why this is a useful base","safety":"access and safety notes"}],"places":[{"name":"...","type":"attraction|trail|viewpoint|museum|other","detail":"what to see or do","route":"how it fits the route"}],"days":[{"date":"YYYY-MM-DD or null","title":"...","detail":"...","route":"...","conditions":"..."}],"signals":[{"category":"gear|route","title":"...","detail":"...","severity":"info|caution|urgent"}],"preparation":[{"title":"...","detail":"..."}]}'
    )
    return (
        "You are a stage in a travel-planning agent pipeline. Use Nova web "
        "grounding to research current, public, source-verifiable information.\n"
        f"Destination: {destination}\nDates: {dates}\nActivities: {activities}\n"
        f"Pace: {record.get('pace') or 'Balanced'}\nFocus: {focus}\n\n"
        "Treat these as required checks when relevant: extreme heat/cold and "
        "temperature illness; weather and UV; sleeping altitude and altitude sickness; "
        "vaccinations, entry, and disease; animals and wildlife deterrence such as bear "
        "spray or bear bells where relevant, lawful, and recommended; volcanic eruptions, ash, SO2, and "
        "respiratory protection; earthquakes and tsunamis; drought, water scarcity, "
        "fire, and air quality; route hazards and closures; and activity-specific gear "
        "such as water, moisture-wicking layers, warm water-resistant clothing, tents, "
        "and hiking/climbing gloves; and neighborhood-level personal safety, including high-crime areas around "
        "hotels and hostels, tourist-targeted pickpocketing and theft patterns, and common hotspots such as transit "
        "hubs, crowded attractions, markets, nightlife, and hotel or hostel approaches; and current official country- or "
        "region-level travel advisories for U.S. citizens, including conflict, terrorism, kidnapping, arbitrary detention, "
        "hostage-taking, sanctions, and entry constraints. For hiking and climbing, explicitly check whether outdoor "
        "travelers face kidnapping or hostage risk in conflict, border, or otherwise restricted areas, and whether permits, "
        "escorts, route closures, or no-go guidance apply. Do not skip a category merely because it seems "
        "unlikely—report it as low/unknown risk with a source or explain that coverage "
        "is unavailable. For hiking routes, require evidence that the route is a real "
        "marked or maintained trail from an official land manager or reputable trail "
        "source; explicitly check for drainage systems, washes, gullies, service roads, "
        "and informal paths that could be misidentified.\n\n"
        "For a real trip proposal, research several source-verifiable places to stay "
        "or safe lodging areas and several things to see or do. Give reasons, access "
        "context, and safety notes; these are recommendations only, never bookings or "
        "guarantees of availability. If a place or route cannot be verified, say so and "
        "do not invent it.\n\n"
        "Return JSON only. Do not book, purchase, or invent availability. Do not "
        "use private email, calendar, passport, or medical data. Tie warnings to "
        "grounded sources and describe uncertainty. This is preparation guidance, "
        "not medical diagnosis or a guarantee that a route or facility is safe/open. "
        f"Use this exact output shape: {schema}"
    )


def _normalize_output(output: dict[str, Any], sources: list[str], record: dict[str, Any]) -> dict[str, Any]:
    days = output.get("days") if isinstance(output.get("days"), list) else []
    normalized_days = []
    for index, item in enumerate(days[:7], start=1):
        if not isinstance(item, dict):
            continue
        normalized_days.append({
            "day": index,
            "date": item.get("date"),
            "title": str(item.get("title") or f"Day {index}")[:120],
            "detail": str(item.get("detail") or "Review local conditions before committing to this day.")[:800],
            "route": str(item.get("route") or "Route details require a confirmed origin and route.")[:300],
            "conditions": str(item.get("conditions") or "Current conditions will be checked before departure.")[:500],
        })
    preparation = output.get("preparation") if isinstance(output.get("preparation"), list) else []
    normalized_preparation = [
        {"title": str(item.get("title") or "Preparation item")[:120], "detail": str(item.get("detail") or "Verify before departure.")[:500]}
        for item in preparation[:12]
        if isinstance(item, dict)
    ]
    signals = output.get("signals") if isinstance(output.get("signals"), list) else []
    normalized_signals = [
        {"category": str(item.get("category") or "travel conditions")[:60], "title": str(item.get("title") or "Review current conditions")[:120], "detail": str(item.get("detail") or "Verify this signal with the linked source.")[:500], "severity": str(item.get("severity") or "info")[:20]}
        for item in signals[:16]
        if isinstance(item, dict)
    ]
    stays = output.get("stays") if isinstance(output.get("stays"), list) else []
    normalized_stays = [
        {
            "name": str(item.get("name") or "Unverified stay option")[:160],
            "area": str(item.get("area") or "Area requires confirmation")[:120],
            "type": str(item.get("type") or "other")[:40],
            "detail": str(item.get("detail") or "Verify this lodging option before relying on it.")[:500],
            "safety": str(item.get("safety") or "Review current neighborhood and access conditions.")[:400],
        }
        for item in stays[:8]
        if isinstance(item, dict)
    ]
    places = output.get("places") if isinstance(output.get("places"), list) else []
    normalized_places = [
        {
            "name": str(item.get("name") or "Unverified place")[:160],
            "type": str(item.get("type") or "other")[:40],
            "detail": str(item.get("detail") or "Verify this place before relying on it.")[:500],
            "route": str(item.get("route") or "Route context requires confirmation.")[:400],
        }
        for item in places[:12]
        if isinstance(item, dict)
    ]
    return {
        "overview": str(output.get("overview") or f"Preparation plan for {record.get('destination')}.")[:800],
        "routeSummary": str(output.get("routeSummary") or "Confirm the route and save an offline fallback before departure.")[:500],
        "stays": normalized_stays,
        "places": normalized_places,
        "days": normalized_days,
        "preparation": normalized_preparation,
        "signals": normalized_signals,
        "sources": [{"url": url, "retrievedAt": datetime.now(UTC).isoformat()} for url in sources[:20]],
    }


async def _research_trip(record: dict[str, Any], job: dict[str, Any]) -> dict[str, Any]:
    """Run separate grounded stages and validate the assembled output."""
    combined: dict[str, Any] = {"days": [], "preparation": [], "signals": [], "sources": [], "stays": [], "places": []}
    stages = [
        ("conditions", "weather, extreme heat and cold, wind chill, frostbite, heat stroke, hyperthermia, hypothermia, UV, altitude, water availability, wildfire, volcanic activity, ash and volcanic gas such as SO2, earthquakes, tsunami risk and alerts, air quality, and official closures or exclusion zones"),
        ("health and hazards", "vaccination and entry guidance, disease exposure, animals and wildlife deterrence such as bear spray or bear bells where relevant and lawful, heat stroke and hyperthermia precautions, hypothermia and cold-exposure precautions, volcanic-ash and gas health precautions, earthquake and tsunami preparedness, neighborhood-level crime and personal safety around hotels and hostels, tourist-targeted pickpocketing and theft hotspots near transit hubs and attractions, current official travel advisories for U.S. citizens including Do Not Travel or higher-risk designations, conflict, terrorism, kidnapping and hostage-taking risks for hikers and rock-climbers, arbitrary detention, sanctions, entry constraints, permits, escorts, route restrictions, security, and emergency considerations"),
        ("itinerary", "a practical real-trip proposal with a day-by-day itinerary, route context, several source-verifiable places to stay or safe lodging areas, and several verified things to see or do; propose recommendations only, never bookings; verify real marked hiking trails using official park or land-manager maps, trailhead information, and a reputable trail dataset; do not mistake a drainage channel, wash, gully, service road, social path, or terrain line that merely looks like a trail for a maintained route, and flag any route that cannot be verified; for camping assess water carrying and tent conditions, moisture-wicking layers, warm layers, and water-resistant clothing; for hiking or climbing assess hiking gloves and route-specific equipment such as cable or exposed-rock sections, using Half Dome in Yosemite only as an example and never assuming it applies without verifying the route; where wildlife risk warrants it, include bear spray, bear bells, food storage, and local rules rather than assuming those items are universally appropriate"),
    ]
    for stage, focus in stages:
        job["stage"] = stage
        result, sources = await asyncio.to_thread(_grounded_json, _trip_prompt(record, focus))
        if stage == "itinerary":
            combined["days"].extend(result.get("days") or [])
            combined["routeSummary"] = result.get("routeSummary")
            combined["overview"] = result.get("overview")
            combined["stays"].extend(result.get("stays") or [])
            combined["places"].extend(result.get("places") or [])
        combined["preparation"].extend(result.get("preparation") or [])
        combined["signals"].extend(result.get("signals") or [])
        combined["sources"].extend(sources)
        if stage == "itinerary" and result.get("routeSummary"):
            combined["signals"].append({"category": "route", "title": "Route context", "detail": result["routeSummary"], "severity": "info"})
    for attempt in range(2):
        categories = {str(item.get("category") or "").strip().casefold() for item in combined["signals"] if isinstance(item, dict)}
        missing = sorted(_REQUIRED_SIGNAL_CATEGORIES - categories)
        if not missing:
            break
        job["stage"] = "gap review: " + ", ".join(missing[:4])
        result, sources = await asyncio.to_thread(_grounded_json, _trip_prompt(record, "explicitly fill these missing required categories: " + ", ".join(missing)))
        combined["preparation"].extend(result.get("preparation") or [])
        combined["signals"].extend(result.get("signals") or [])
        combined["sources"].extend(sources)
    output = _normalize_output(combined, list(dict.fromkeys(combined["sources"])), record)
    categories = {str(item.get("category") or "").strip().casefold() for item in output["signals"] if isinstance(item, dict)}
    missing = sorted(_REQUIRED_SIGNAL_CATEGORIES - categories)
    if not output["days"] or not output["preparation"] or not output["signals"] or not output["sources"] or not output["stays"] or not output["places"] or missing:
        raise ValueError("Travel-planning pipeline is missing required categories: " + ", ".join(missing))
    return output


async def _run_trip_agent_pipeline(access_token: str, trip_id: str, run_id: str) -> None:
    job = _agent_pipeline_jobs[run_id]
    try:
        job["status"] = "running"
        files = await list_json_files(access_token, _OUTPUT_FOLDER)
        record = files.get(trip_id)
        if not isinstance(record, dict) or not record.get("destination"):
            raise KeyError(trip_id)
        record["agent-pipeline"] = "running"
        record["agent-pipeline-stage"] = "starting"
        await write_json_file(access_token, _OUTPUT_FOLDER, f"{trip_id}.json", record)
        output = await _research_trip(record, job)
        record["agent-pipeline-output"] = output
        record["agent-pipeline"] = "complete"
        record["agent-pipeline-stage"] = "complete"
        record["agent-pipeline-completed-at"] = datetime.now(UTC).isoformat()
        await write_json_file(access_token, _OUTPUT_FOLDER, f"{trip_id}.json", record)
        job.update({"status": "complete", "stage": "complete", "trip": _public_trip(record)})
    except Exception as error:
        _logger.exception("Travel-planning pipeline failed for trip %s", trip_id)
        job.update({"status": "failed", "stage": "failed", "error": str(error)[:500]})
        try:
            files = await list_json_files(access_token, _OUTPUT_FOLDER)
            record = files.get(trip_id)
            if isinstance(record, dict):
                record["agent-pipeline"] = "failed"
                record["agent-pipeline-stage"] = "failed"
                record["agent-pipeline-error"] = str(error)[:500]
                await write_json_file(access_token, _OUTPUT_FOLDER, f"{trip_id}.json", record)
        except Exception:
            pass
    finally:
        job["finishedAt"] = datetime.now(UTC).isoformat()


async def queue_trip_agent_pipeline(access_token: str, trip_id: str) -> dict[str, Any]:
    """Queue the travel-planning pipeline for a trip missing completion."""
    files = await list_json_files(access_token, _OUTPUT_FOLDER)
    record = files.get(trip_id)
    if not isinstance(record, dict) or not record.get("destination"):
        raise KeyError(trip_id)
    if record.get("agent-pipeline") == "complete" and record.get("agent-pipeline-output"):
        return {"id": None, "status": "complete", "trip": _public_trip(record)}

    current_run_id = str(record.get("agent-pipeline-run-id") or "")
    current_job = _agent_pipeline_jobs.get(current_run_id)
    if current_job and current_job.get("status") in {"queued", "running"}:
        return {key: value for key, value in {**current_job, "trip": _public_trip(record)}.items() if key != "task"}

    run_id = uuid4().hex
    record["agent-pipeline"] = "queued"
    record["agent-pipeline-run-id"] = run_id
    record["agent-pipeline-started-at"] = datetime.now(UTC).isoformat()
    await write_json_file(access_token, _OUTPUT_FOLDER, f"{trip_id}.json", record)
    job = {"id": run_id, "tripId": trip_id, "status": "queued", "stage": "queued", "trip": _public_trip(record)}
    _agent_pipeline_jobs[run_id] = job
    job["task"] = asyncio.create_task(_run_trip_agent_pipeline(access_token, trip_id, run_id))
    return {key: value for key, value in {**job, "trip": _public_trip(record)}.items() if key != "task"}


async def get_trip_agent_pipeline(access_token: str, trip_id: str, run_id: str) -> dict[str, Any]:
    """Return the current status for one queued travel-planning run."""
    job = _agent_pipeline_jobs.get(run_id)
    if job is not None:
        return {key: value for key, value in job.items() if key != "task"}
    files = await list_json_files(access_token, _OUTPUT_FOLDER)
    record = files.get(trip_id)
    if not isinstance(record, dict) or not record.get("destination"):
        raise KeyError(trip_id)
    return {"id": run_id, "tripId": trip_id, "status": record.get("agent-pipeline", "queued"), "trip": _public_trip(record)}


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
