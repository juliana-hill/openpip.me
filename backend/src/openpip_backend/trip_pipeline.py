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
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from uuid import uuid4

import boto3

from .google_drive_docs import list_json_files, write_json_file
from .insight_gathering import get_insight_gathering_login_status

_INPUT_FOLDER = "OpenPip/memory/insights_gathering/manifest"
_OUTPUT_FOLDER = "OpenPip/travel/trips"
_RUN_FOLDER = "OpenPip/travel/trips/manifest"
_logger = logging.getLogger(__name__)
_PROMPTS_DIR = Path(os.getenv("OPENPIP_PROMPTS_DIR", "/app/prompts"))
if not _PROMPTS_DIR.exists():
    _PROMPTS_DIR = Path(__file__).resolve().parents[3] / "prompts"
_STAGE_PROMPT_FILES = {
    "conditions": "stage-01-conditions.md",
    "health": "stage-02-health-and-hazards.md",
    "itinerary": "stage-03-itinerary.md",
    "gap": "gap-review.md",
}
_PROMPT_BLOCK_RE = re.compile(r"```(?:[A-Za-z0-9_-]+)?[ \t]*\n(.*?)```", re.DOTALL)
_URL_RE = re.compile(r"https?://[^\s<>)\]\"']+")
_DATE_HEADING_RE = re.compile(
    r"^(?:day\s+\d+\b|\d{4}-\d{2}-\d{2}\b|"
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|"
    r"dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?)\b",
    re.IGNORECASE,
)

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
_SIGNAL_CATEGORY_ALIASES = {
    "uv index": "uv", "uv exposure": "uv", "sun exposure": "uv", "extreme heat": "temperature", "extreme cold": "temperature",
    "heat": "temperature", "cold": "temperature", "altitude sickness": "altitude", "acclimatization": "altitude",
    "elevation": "altitude",
    "vaccination": "health", "entry requirements": "health", "disease exposure": "disease", "wildlife": "animals",
    "bear safety": "animals", "volcano": "volcanic_activity", "volcanic activity": "volcanic_activity",
    "volcanic eruption": "volcanic_activity", "volcanic ash": "volcanic_activity", "so2": "volcanic_activity",
    "earthquakes": "earthquake", "tsunami risk": "tsunami", "water scarcity": "water", "drought": "water",
    "wildfire": "fire", "air quality": "air_quality", "smoke": "air_quality", "equipment": "gear",
    "hiking gear": "gear", "trails": "route", "trail": "route", "route context": "route", "crime": "security",
    "personal safety": "security", "travel advisory": "security", "conflict": "security", "hostage": "kidnapping",
    "kidnapping risk": "kidnapping", "abduction": "kidnapping",
}
_TRACKING_QUERY_PREFIXES = ("utm_",)
_TRACKING_QUERY_KEYS = {"fbclid", "gclid", "mc_cid", "mc_eid"}
_STAY_TYPES = {"hotel", "hostel", "apartment", "camping", "neighborhood"}
_PLACE_TYPES = {"attraction", "hiking_trail", "viewpoint", "museum", "temple", "shrine", "park", "market"}


def _prompt_blocks(filename: str) -> tuple[str, ...]:
    """Load the prose blocks from one of the committed production prompts."""
    path = _PROMPTS_DIR / filename
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as error:
        raise RuntimeError(f"Travel prompt file is unavailable: {path}") from error
    blocks = tuple(match.group(1).strip() for match in _PROMPT_BLOCK_RE.finditer(text))
    if not blocks:
        raise RuntimeError(f"Travel prompt file has no fenced prompt block: {path}")
    return blocks


def _context_value(value: Any, limit: int) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def _render_existing_research(research: dict[str, Any] | None) -> str:
    """Render prior stage results as bounded Markdown context for the next call."""
    if not isinstance(research, dict):
        return "No earlier stage research is available."

    lines: list[str] = []
    signals = research.get("signals") if isinstance(research.get("signals"), list) else []
    categories = {
        _signal_category(item.get("category"))
        for item in signals
        if isinstance(item, dict) and item.get("category")
    }
    missing_categories = sorted(_REQUIRED_SIGNAL_CATEGORIES - categories)
    if missing_categories:
        lines.extend(["### Required signal categories still missing", ", ".join(missing_categories)])

    overview = _context_value(research.get("overview"), 800)
    if overview:
        lines.extend(["### Existing overview", overview])

    if signals:
        lines.append("### Existing condition and safety signals")
        for item in signals[:32]:
            if not isinstance(item, dict):
                continue
            category = _context_value(item.get("category"), 60) or "signal"
            title = _context_value(item.get("title"), 120) or "Existing finding"
            detail = _context_value(item.get("detail"), 500)
            severity = _context_value(item.get("severity"), 20)
            source = _http_url(item.get("sourceUrl") or item.get("source_url") or item.get("url"))
            suffix = f" Source: {source}" if source else ""
            risk = f" ({severity})" if severity else ""
            lines.append(f"- [{category}{risk}] {title}: {detail}{suffix}")

    preparation = research.get("preparation") if isinstance(research.get("preparation"), list) else []
    if preparation:
        lines.append("### Existing preparation")
        for item in preparation[:12]:
            if not isinstance(item, dict):
                continue
            title = _context_value(item.get("title"), 120) or "Preparation item"
            detail = _context_value(item.get("detail"), 500)
            lines.append(f"- {title}: {detail}")

    route_summary = _context_value(research.get("routeSummary"), 500)
    if route_summary:
        lines.extend(["### Existing route context", route_summary])

    stays = research.get("stays") if isinstance(research.get("stays"), list) else []
    if stays:
        lines.append("### Existing stay recommendations")
        for item in stays[:8]:
            if not isinstance(item, dict):
                continue
            name = _context_value(item.get("name"), 160) or "Stay recommendation"
            detail = _context_value(item.get("detail"), 500)
            area = _context_value(item.get("area"), 120)
            safety = _context_value(item.get("safety"), 400)
            source = _http_url(item.get("sourceUrl") or item.get("source_url") or item.get("url"))
            suffix = f" Source: {source}" if source else ""
            safety_text = f" Safety: {safety}" if safety else ""
            lines.append(f"- {name} ({area}): {detail}{safety_text}{suffix}")

    places = research.get("places") if isinstance(research.get("places"), list) else []
    if places:
        lines.append("### Existing place recommendations")
        for item in places[:12]:
            if not isinstance(item, dict):
                continue
            name = _context_value(item.get("name"), 160) or "Place recommendation"
            detail = _context_value(item.get("detail"), 500)
            route = _context_value(item.get("route"), 400)
            source = _http_url(item.get("sourceUrl") or item.get("source_url") or item.get("url"))
            suffix = f" Source: {source}" if source else ""
            lines.append(f"- {name}: {detail} Route: {route}{suffix}")

    days = research.get("days") if isinstance(research.get("days"), list) else []
    if days:
        lines.append("### Existing itinerary days")
        for item in days[:7]:
            if not isinstance(item, dict):
                continue
            title = _context_value(item.get("title"), 120) or "Itinerary day"
            detail = _context_value(item.get("detail"), 800)
            route = _context_value(item.get("route"), 300)
            conditions = _context_value(item.get("conditions"), 400)
            route_text = f" Route: {route}" if route else ""
            conditions_text = f" Conditions: {conditions}" if conditions else ""
            lines.append(f"- {title}: {detail}{route_text}{conditions_text}")

    sources = research.get("sources") if isinstance(research.get("sources"), list) else []
    source_urls = list(dict.fromkeys(
        url
        for value in sources
        for url in [_http_url(value.get("url") if isinstance(value, dict) else value)]
        if url
    ))
    if source_urls:
        lines.append("### Existing grounded sources")
        lines.extend(f"- {url}" for url in source_urls[:20])

    if not lines:
        return "No earlier stage research is available."
    rendered = "\n".join(lines)
    return rendered[:24000] + ("\n[Earlier research truncated by the pipeline.]" if len(rendered) > 24000 else "")


def _render_trip_prompt(
    record: dict[str, Any],
    focus: str,
    stage: str | None = None,
    existing_research: dict[str, Any] | None = None,
) -> str:
    """Render the production prompt template without keeping a copy in code."""
    blocks = _prompt_blocks("trip-research-template.md")
    if not blocks:
        raise RuntimeError("trip-research-template.md must contain a fenced prompt block")
    template = blocks[0]
    markdown_formats = _prompt_blocks("markdown-output-format.md")
    if len(markdown_formats) < 2:
        raise RuntimeError("markdown-output-format.md must contain conditions and itinerary blocks")
    rendered_focus = str(focus or "").strip()
    replacements = {
        "{{destination}}": str(record.get("destination") or "").strip(),
        "{{start_date}}": str(record.get("startDate") or "flexible"),
        "{{end_date}}": str(record.get("endDate") or "flexible"),
        "{{activities}}": ", ".join(str(value) for value in record.get("activities") or []) or "general travel",
        "{{pace}}": str(record.get("pace") or "Balanced"),
        "{{focus}}": rendered_focus,
        "{{existing_research}}": _render_existing_research(existing_research),
    }
    rendered = template
    for token, value in replacements.items():
        rendered = rendered.replace(token, value)
    itinerary_stage = stage == "itinerary" or (stage is None and rendered_focus.startswith("a practical"))
    stage_boundary = (
        "This is the itinerary stage. Produce only the itinerary and recommendation sections below; do not repeat the full conditions, health, or hazard report."
        if itinerary_stage
        else "This is a conditions, health, or gap-review stage. Produce only the conditions, hazards, safety, and preparation sections below; do not produce lodging, attractions, route plans, or day-by-day itinerary content."
    )
    markdown_format = markdown_formats[1] if itinerary_stage else markdown_formats[0]
    return f"{rendered}\n\n{stage_boundary}\n\n{markdown_format}"


def _trip_prompt(
    record: dict[str, Any],
    focus: str,
    stage: str | None = None,
    existing_research: dict[str, Any] | None = None,
) -> str:
    """Compatibility name for callers that used the production prompt builder."""
    return _render_trip_prompt(record, focus, stage, existing_research)


def _stage_focus(stage: str, missing_categories: list[str] | None = None) -> str:
    if stage == "gap":
        focus = _prompt_blocks(_STAGE_PROMPT_FILES[stage])[0]
        return focus.replace("{{missing_categories}}", ", ".join(missing_categories or []))
    if stage not in _STAGE_PROMPT_FILES:
        raise ValueError(f"Unknown travel prompt stage: {stage}")
    return _prompt_blocks(_STAGE_PROMPT_FILES[stage])[0]


def _category_label(category: str) -> str:
    return category.replace("_", " ").title()


def _gap_focus(missing_categories: list[str], missing_requirements: list[str] | None = None) -> str:
    """Create a targeted Markdown-only completion request for the next call."""
    targets = [_category_label(category) for category in missing_categories]
    targets.extend(requirement for requirement in (missing_requirements or []) if requirement not in targets)
    focus = _stage_focus("gap", missing_categories)
    target_text = ", ".join(targets) or "the missing preparation or source details"
    headings = "\n".join(f"## {_category_label(category)}" for category in missing_categories)
    heading_instruction = (
        f"Return one new Markdown section under each of these exact headings:\n{headings}"
        if headings
        else "Return only the new Markdown sections needed for the missing requirements listed above."
    )
    return (
        f"{focus}\n\n"
        f"This is a completion pass for: {target_text}. Use the existing research context and do not repeat any category already present. "
        f"{heading_instruction} Include a grounded source URL in every new section. Return Markdown only."
    )


def _itinerary_completion_focus(missing_requirements: list[str]) -> str:
    requirements = ", ".join(missing_requirements) or "the missing itinerary details"
    source_link_requirements = [
        requirement for requirement in missing_requirements if requirement.startswith("source links for ")
    ]
    source_link_instruction = (
        " For each existing recommendation missing a link, repeat only that recommendation with its exact existing name and add a full grounded URL on the same bullet using `Source: https://...`; do not add a new recommendation or invent a URL."
        if source_link_requirements
        else ""
    )
    return (
        f"{_stage_focus('itinerary')}\n\n"
        f"This is a completion pass. The Python aggregate already contains the itinerary content that was found. "
        f"Produce only the missing itinerary requirements: {requirements}. Do not repeat existing days, stays, places, or route content unless repeating one existing recommendation is necessary to attach its missing source URL.{source_link_instruction} Return Markdown only."
    )


def _http_url(value: Any) -> str | None:
    url = str(value or "").strip().rstrip(".,;:)")
    if not url.startswith(("https://", "http://")):
        return None
    return url[:2000]


def _url_key(value: Any) -> str | None:
    url = _http_url(value)
    if not url:
        return None
    try:
        parsed = urlsplit(url)
    except ValueError:
        return None
    hostname = (parsed.hostname or "").casefold()
    if hostname.startswith("www."):
        hostname = hostname[4:]
    if not hostname:
        return None
    port = parsed.port
    if port in {80, 443}:
        port = None
    netloc = hostname if port is None else f"{hostname}:{port}"
    query = urlencode(sorted(
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if not key.casefold().startswith(_TRACKING_QUERY_PREFIXES) and key.casefold() not in _TRACKING_QUERY_KEYS
    ))
    path = parsed.path.rstrip("/") or "/"
    return urlunsplit((parsed.scheme.casefold(), netloc, path, query, ""))


def _urls_in_text(text: str) -> list[str]:
    return list(dict.fromkeys(url for url in (_http_url(value) for value in _URL_RE.findall(text)) if url))


def _grounded_item_url(item: dict[str, Any], source_urls: list[str]) -> str | None:
    candidate = _http_url(item.get("sourceUrl") or item.get("source_url") or item.get("url"))
    if not candidate:
        candidate = next(iter(_urls_in_text(json.dumps(item, ensure_ascii=False))), None)
    if not candidate:
        return None
    candidate_key = _url_key(candidate)
    if not candidate_key:
        return None
    source_by_key = {_url_key(url): url for url in source_urls if _url_key(url)}
    # Preserve a URL supplied on the recommendation even when the grounding
    # provider returned its citation separately or omitted citation metadata.
    return source_by_key.get(candidate_key) or candidate


def _signal_category(value: Any) -> str:
    normalized = re.sub(r"[^a-z0-9]+", " ", str(value or "").casefold()).strip()
    compact = normalized.replace(" ", "_")
    if compact in _REQUIRED_SIGNAL_CATEGORIES:
        return compact
    for alias, category in sorted(_SIGNAL_CATEGORY_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
        if alias in normalized:
            return category
    return compact


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


def _has_recommendations(output: Any) -> bool:
    if not isinstance(output, dict):
        return False
    stays = [item for item in (output.get("stays") or []) if isinstance(item, dict)]
    places = [item for item in (output.get("places") or []) if isinstance(item, dict)]
    return bool(stays) and bool(places)


def _missing_output_requirements(output: dict[str, Any], missing_categories: list[str]) -> list[str]:
    requirements = (
        ("days", "itinerary days"),
        ("preparation", "preparation guidance"),
        ("signals", "condition and safety signals"),
        ("sources", "grounded sources"),
        ("stays", "places to stay"),
        ("places", "places to see"),
    )
    missing = [label for key, label in requirements if not output.get(key)]
    stays = output.get("stays") if isinstance(output.get("stays"), list) else []
    if stays and any(
        not _grounded_item_url(item, [])
        for item in stays
        if isinstance(item, dict)
    ):
        missing.append("source links for places to stay")
    places = output.get("places") if isinstance(output.get("places"), list) else []
    if places and any(
        not _grounded_item_url(item, [])
        for item in places
        if isinstance(item, dict)
    ):
        missing.append("source links for places to see")
    if missing_categories:
        missing.append("signal categories: " + ", ".join(missing_categories))
    return missing


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


def _grounded_response(prompt: str) -> tuple[str, list[str]]:
    """Run one bounded Nova Grounding call and keep citations beside their text.

    Nova returns grounded output as interleaved ``text`` and
    ``citationsContent`` blocks. The citation blocks are not part of the
    model's Markdown text, so simply joining every text block drops the URLs
    before the recommendation parser can attach them to a stay or place.
    """
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
    text_parts: list[str] = []
    sources: list[str] = []
    for block in content:
        if not isinstance(block, dict):
            continue
        if isinstance(block.get("text"), str):
            text_parts.append(block["text"])
        citations_content = block.get("citationsContent")
        if not isinstance(citations_content, dict):
            continue
        for citation in citations_content.get("citations", []):
            url = _http_url(citation.get("location", {}).get("web", {}).get("url")) if isinstance(citation, dict) else None
            if not url:
                continue
            sources.append(url)
            text_parts.append(f" Source: {url}")
    return "\n".join(text_parts), list(dict.fromkeys(sources))


def _heading_sections(text: str) -> list[tuple[str, str]]:
    sections: list[tuple[str, str]] = []
    title: str | None = None
    body: list[str] = []

    def flush() -> None:
        if title is not None:
            sections.append((title, "\n".join(body).strip()))

    for line in text.splitlines():
        stripped = line.strip()
        is_heading = stripped.startswith(("#", "**", "__"))
        if is_heading:
            candidate = re.sub(r"^#{1,6}\s*", "", stripped).strip()
            candidate = re.sub(r"^(?:\*\*|__)(.*?)(?:\*\*|__)\s*:?[ \t]*$", r"\1", candidate).strip()
            if candidate and len(candidate) <= 140:
                flush()
                title = candidate
                body = []
                continue
        body.append(line)
    flush()
    return sections


def _heading_categories(title: str) -> list[str]:
    normalized = re.sub(r"[^a-z0-9]+", " ", title.casefold()).strip()
    categories: list[str] = []
    for category in sorted(_REQUIRED_SIGNAL_CATEGORIES, key=len, reverse=True):
        label = category.replace("_", " ")
        if normalized == label or label in normalized:
            categories.append(category)
    for alias, category in sorted(_SIGNAL_CATEGORY_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
        if alias in normalized and category not in categories:
            categories.append(category)
    return categories


def _heading_category(title: str) -> str | None:
    """Return the first category for compatibility with existing callers."""
    return next(iter(_heading_categories(title)), None)


def _severity(text: str) -> str:
    lowered = text.casefold()
    if any(word in lowered for word in ("urgent", "emergency", "immediately", "do not travel")):
        return "urgent"
    if any(word in lowered for word in ("warning", "caution", "risk", "avoid", "danger")):
        return "caution"
    return "info"


def _bullet_items(text: str) -> list[str]:
    items: list[str] = []
    current: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if re.match(r"^(?:[-*•]|\d+[.)])\s+", stripped):
            if current:
                items.append(" ".join(current).strip())
            current = [re.sub(r"^(?:[-*•]|\d+[.)])\s+", "", stripped)]
        elif current and stripped:
            current.append(stripped)
    if current:
        items.append(" ".join(current).strip())
    if items:
        return items
    return [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]


def _recommendation_items(text: str) -> list[dict[str, Any]]:
    """Parse only top-level recommendation bullets into structured items.

    Nova sometimes expands the requested one-line format into nested bullets.
    Those nested bullets are fields on the parent recommendation, not new
    recommendations. Keep the grouping deterministic here instead of asking
    the model to emit JSON.
    """
    grouped: list[str] = []
    current: list[str] = []
    for line in text.splitlines():
        if re.match(r"^(?:[-*•]|\d+[.)])\s+", line):
            if current:
                grouped.append("\n".join(current).strip())
            current = [re.sub(r"^(?:[-*•]|\d+[.)])\s+", "", line).strip()]
        elif current and line.strip():
            current.append(line.strip())
    if current:
        grouped.append("\n".join(current).strip())

    items: list[dict[str, Any]] = []
    for raw in grouped or _bullet_items(text):
        raw = re.sub(r"\s+", " ", raw).strip()
        url = next(iter(_urls_in_text(raw)), None)
        link_match = re.search(r"\[([^]]+)\]\((https?://[^)]+)\)", raw)
        if link_match:
            name = link_match.group(1).strip()
            detail = raw
        else:
            bold_match = re.match(r"\*\*(.+?)\*\*\s*(?:[:\-–]\s*)?(.*)$", raw)
            if bold_match:
                name = bold_match.group(1).rstrip(":").strip()
                detail = bold_match.group(2)
            else:
                name = raw.split(" - ", 1)[0].split(" — ", 1)[0].strip()
                detail = raw
        detail = re.sub(r"\s+", " ", detail).strip()
        if url:
            detail = detail.replace(url, "")
        detail = re.sub(r"\s*\*\*Source\*\*\s*:? *$", "", detail, flags=re.IGNORECASE)
        detail = re.sub(r"\s*Source\s*:? *$", "", detail, flags=re.IGNORECASE)
        detail = detail.strip(" -–:;")
        item = {"name": name[:160] or "Recommendation", "detail": detail[:500]}
        if url:
            item["sourceUrl"] = url

        # Convert nested Markdown fields into the JSON fields used by the UI.
        # This also prevents labels such as "Source" from becoming item names.
        fields: dict[str, str] = {}
        for label in ("Why it is a useful base", "Safety notes", "What to see or do", "Route context"):
            field_match = re.search(
                rf"(?:^|\s)(?:-\s*)?\*\*{re.escape(label)}\s*:?\*\*\s*:?\s*(.*?)(?=\s+-\s*\*\*[^*]+?(?::\*\*|\*\*:)\s*|$)",
                detail,
                flags=re.IGNORECASE,
            )
            if field_match:
                fields[label.casefold()] = field_match.group(1).strip()
        if fields:
            item["detail"] = fields.get("why it is a useful base", fields.get("what to see or do", detail))[:500]
            if "safety notes" in fields:
                item["safety"] = fields["safety notes"][:400]
            if "route context" in fields:
                item["route"] = fields["route context"][:400]
        items.append(item)
    return items


def _recommendation_type(name: str, detail: str, kind: str) -> str | None:
    """Assign a display category from parsed recommendation text."""
    text = f"{name} {detail}".casefold()
    if kind == "stay":
        for marker, category in (
            ("hotel", "hotel"),
            ("hostel", "hostel"),
            ("apartment", "apartment"),
            ("camp", "camping"),
            ("neighborhood", "neighborhood"),
            ("area", "neighborhood"),
        ):
            if marker in text:
                return category
        return None
    for marker, category in (
        ("trail", "hiking_trail"),
        ("hike", "hiking_trail"),
        ("temple", "temple"),
        ("shrine", "shrine"),
        ("museum", "museum"),
        ("park", "park"),
        ("market", "market"),
        ("viewpoint", "viewpoint"),
        ("skytree", "attraction"),
        ("asakusa", "attraction"),
        ("kamakura", "attraction"),
    ):
        if marker in text:
            return category
    return None


def _parse_markdown_research(text: str, stage: str) -> dict[str, Any]:
    sections = _heading_sections(text)
    parsed: dict[str, Any] = {"overview": "", "signals": [], "preparation": []}
    for title, body in sections:
        if title.casefold() == "overview":
            parsed["overview"] = body[:800]
        categories = _heading_categories(title)
        if categories:
            detail = re.sub(r"SOURCE URL:\s*https?://\S+", "", body, flags=re.IGNORECASE).strip()
            for category in categories:
                parsed["signals"].append({
                    "category": category,
                    "title": title,
                    "detail": detail[:500] or "Verify current conditions with the cited source.",
                    "severity": _severity(detail),
                })
        if any(word in title.casefold() for word in ("preparation", "gear", "what to bring", "pack")):
            for item in _bullet_items(body):
                match = re.match(r"\*\*(.+?):\*\*\s*(.*)$", item) or re.match(
                    r"\*\*(.+?)\*\*\s*[:\-–]\s*(.*)$", item
                )
                if match:
                    item_title, detail = match.groups()
                else:
                    item_title, detail = "Preparation item", item
                parsed["preparation"].append({"title": item_title[:120], "detail": detail[:500]})
                for category in _heading_categories(item_title):
                    parsed["signals"].append({
                        "category": category,
                        "title": item_title[:120],
                        "detail": detail[:500] or "Verify current conditions with the cited source.",
                        "severity": _severity(detail),
                    })

        lowered = title.casefold()
        if stage == "itinerary" and any(word in lowered for word in ("route", "overview")):
            parsed["routeSummary"] = body[:500]

    if stage == "itinerary":
        parsed.setdefault("routeSummary", "")
        parsed["stays"] = []
        parsed["places"] = []
        parsed["days"] = []
        for title, body in sections:
            if _DATE_HEADING_RE.match(title.strip()):
                parsed["days"].append({
                    "date": _date_part(title) if re.match(r"\d{4}-", title) else None,
                    "title": title,
                    "detail": body[:800],
                    "route": "",
                    "conditions": "",
                })
            lowered = title.casefold()
            if any(word in lowered for word in ("stay", "accommodation", "lodging", "hotel", "hostel")):
                for item in _recommendation_items(body):
                    item_type = _recommendation_type(item["name"], item.get("detail", ""), "stay")
                    if item_type not in _STAY_TYPES:
                        continue
                    item.update({
                        "area": "",
                        "type": item_type,
                        "safety": item.get("safety", ""),
                    })
                    parsed["stays"].append(item)
            if any(word in lowered for word in ("see", "do", "attraction", "place", "trail", "activity", "museum")):
                for item in _recommendation_items(body):
                    item_type = _recommendation_type(item["name"], item.get("detail", ""), "place")
                    if item_type not in _PLACE_TYPES:
                        continue
                    item.update({
                        "type": item_type,
                        "route": item.get("route", ""),
                    })
                    parsed["places"].append(item)
        if not parsed["overview"]:
            parsed["overview"] = next((body for title, body in sections if title.casefold() == "overview"), "")[:800]
    return parsed


def _parse_grounded_text(text: str, stage: str) -> dict[str, Any]:
    """Parse Nova's grounded Markdown locally; the model never formats JSON."""
    return _parse_markdown_research(str(text), stage)


def _trip_agent_model():
    from strands.models import BedrockModel

    region = os.getenv("AWS_REGION", "us-east-1")
    access_key = os.getenv("AWS_APP_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_APP_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY")
    if access_key and secret_key:
        session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        return BedrockModel(model_id=os.getenv("OPENPIP_TRIP_AGENT_MODEL_ID", "amazon.nova-pro-v1:0"), boto_session=session)
    return BedrockModel(model_id=os.getenv("OPENPIP_TRIP_AGENT_MODEL_ID", "amazon.nova-pro-v1:0"), region_name=region)


def _run_grounded_stage(
    record: dict[str, Any],
    stage: str,
    focus: str,
    existing_research: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    """Run one deterministic stage through Strands, retaining the tool's raw output."""
    from strands import Agent, tool

    system_prompt = _trip_prompt(record, focus, stage, existing_research)
    captured: dict[str, Any] = {"text": "", "sources": []}

    @tool
    def research_grounded_stage() -> str:
        """Run the Nova Grounding research call and return its raw text unchanged."""
        text, sources = _grounded_response(system_prompt)
        captured["text"] = text
        captured["sources"] = sources
        return text

    try:
        agent = Agent(
            model=_trip_agent_model(),
            tools=[research_grounded_stage],
            system_prompt=system_prompt,
            name=f"OpenPip {stage} research",
        )
        agent("Use the grounding tool once and return its raw response unchanged.", limits={"turns": 2})
    except Exception:
        _logger.exception("Strands travel stage failed before returning grounded output: %s", stage)

    if not captured["text"]:
        captured["text"], captured["sources"] = _grounded_response(system_prompt)
    raw_text = str(captured["text"])
    sources = list(dict.fromkeys([*captured["sources"], *_urls_in_text(raw_text)]))
    parsed = _parse_grounded_text(raw_text, "itinerary" if stage == "itinerary" else stage)
    if not isinstance(parsed, dict):
        raise ValueError(f"Nova returned no parseable {stage} research")
    return parsed, sources


def _normalize_output(output: dict[str, Any], sources: list[str], record: dict[str, Any]) -> dict[str, Any]:
    grounded_sources = list(dict.fromkeys(url for url in (_http_url(value) for value in sources) if url))
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
        {"category": _signal_category(item.get("category")) or "travel conditions", "title": str(item.get("title") or "Review current conditions")[:120], "detail": str(item.get("detail") or "Verify this signal with the linked source.")[:500], "severity": str(item.get("severity") or "info")[:20]}
        for item in signals[:32]
        if isinstance(item, dict)
    ]
    stays = output.get("stays") if isinstance(output.get("stays"), list) else []
    normalized_stays = [
        normalized
        for item in stays[:8]
        if isinstance(item, dict)
        and str(item.get("type") or "").strip().casefold().replace("-", "_") in _STAY_TYPES
        for normalized in [{
            "name": str(item.get("name") or "Unverified stay option")[:160],
            "area": str(item.get("area") or "Area requires confirmation")[:120],
            "type": str(item.get("type"))[:40],
            "detail": str(item.get("detail") or "Verify this lodging option before relying on it.")[:500],
            "safety": str(item.get("safety") or "Review current neighborhood and access conditions.")[:400],
            "sourceUrl": _grounded_item_url(item, grounded_sources),
        }]
    ]
    places = output.get("places") if isinstance(output.get("places"), list) else []
    normalized_places = [
        normalized
        for item in places[:12]
        if isinstance(item, dict)
        and str(item.get("type") or "").strip().casefold().replace("-", "_") in _PLACE_TYPES
        for normalized in [{
            "name": str(item.get("name") or "Unverified place")[:160],
            "type": str(item.get("type"))[:40],
            "detail": str(item.get("detail") or "Verify this place before relying on it.")[:500],
            "route": str(item.get("route") or "Route context requires confirmation.")[:400],
            "sourceUrl": _grounded_item_url(item, grounded_sources),
        }]
    ]
    return {
        "overview": str(output.get("overview") or f"Preparation plan for {record.get('destination')}.")[:800],
        "routeSummary": str(output.get("routeSummary") or "Confirm the route and save an offline fallback before departure.")[:500],
        "stays": normalized_stays,
        "places": normalized_places,
        "days": normalized_days,
        "preparation": normalized_preparation,
        "signals": normalized_signals,
        "sources": [{"url": url, "retrievedAt": datetime.now(UTC).isoformat()} for url in grounded_sources[:20]],
    }


_RESEARCH_STAGE_PLAN = (
    ("conditions", "conditions"),
    ("health", "health and hazards"),
    ("itinerary", "itinerary"),
)


def _empty_research_assembly() -> dict[str, Any]:
    return {"days": [], "preparation": [], "signals": [], "sources": [], "stays": [], "places": []}


def _append_stage_result(assembled: dict[str, Any], stage: str, result: dict[str, Any], sources: list[str]) -> None:
    """Append one parsed Markdown result in Python; no model merges stage data."""
    if stage == "itinerary":
        assembled["days"].extend(result.get("days") or [])
        assembled["routeSummary"] = result.get("routeSummary")
        assembled["overview"] = result.get("overview")
        assembled["stays"].extend(result.get("stays") or [])
        assembled["places"].extend(result.get("places") or [])
        if result.get("routeSummary"):
            assembled["signals"].append({
                "category": "route",
                "title": "Route context",
                "detail": result["routeSummary"],
                "severity": "info",
            })
    assembled["preparation"].extend(result.get("preparation") or [])
    assembled["signals"].extend(result.get("signals") or [])
    assembled["sources"].extend(sources)


def _merge_recommendation_items(
    existing: list[Any],
    addition: list[Any],
) -> list[Any]:
    """Merge repeated completion bullets into the existing named item."""
    merged = [dict(item) for item in existing if isinstance(item, dict)]
    for item in addition:
        if not isinstance(item, dict):
            continue
        name = re.sub(r"\s+", " ", str(item.get("name") or "")).strip().casefold()
        match = next(
            (
                current for current in merged
                if name and re.sub(r"\s+", " ", str(current.get("name") or "")).strip().casefold() == name
            ),
            None,
        )
        if match is None:
            merged.append(dict(item))
            continue
        for key, value in item.items():
            if key == "sourceUrl":
                url = _http_url(value)
                if url:
                    match[key] = url
            elif not match.get(key) and value:
                match[key] = value
    return merged


def _merge_stage_result(existing: dict[str, Any], addition: dict[str, Any]) -> dict[str, Any]:
    """Merge a completion response in Python while preserving prior findings."""
    merged = dict(existing)
    for key in ("signals", "preparation", "stays", "places", "days"):
        prior = existing.get(key) if isinstance(existing.get(key), list) else []
        new = addition.get(key) if isinstance(addition.get(key), list) else []
        if new:
            merged[key] = (
                _merge_recommendation_items(prior, new)
                if key in {"stays", "places"}
                else [*prior, *new]
            )
    for key in ("overview", "routeSummary"):
        if addition.get(key):
            merged[key] = addition[key]
    return merged


def _assemble_research_stages(
    stage_results: dict[str, Any],
    gap_results: list[Any],
) -> dict[str, Any]:
    """Build the combined research object deterministically from stage checkpoints."""
    assembled = _empty_research_assembly()
    for stage, _ in _RESEARCH_STAGE_PLAN:
        checkpoint = stage_results.get(stage)
        if not isinstance(checkpoint, dict):
            continue
        result = checkpoint.get("result")
        if not isinstance(result, dict):
            continue
        sources = checkpoint.get("sources")
        _append_stage_result(assembled, stage, result, sources if isinstance(sources, list) else [])
    for checkpoint in gap_results:
        if not isinstance(checkpoint, dict) or not isinstance(checkpoint.get("result"), dict):
            continue
        sources = checkpoint.get("sources")
        _append_stage_result(assembled, "gap", checkpoint["result"], sources if isinstance(sources, list) else [])
    return assembled


_MAX_COMPLETION_RESEARCH_CALLS = 12


async def _research_trip(record: dict[str, Any], job: dict[str, Any], persist) -> dict[str, Any]:
    """Resume stages and ask the model for missing output before completing."""
    stage_results = record.get("agent-pipeline-stage-results")
    if not isinstance(stage_results, dict):
        stage_results = {}
    gap_results = record.get("agent-pipeline-gap-results")
    if not isinstance(gap_results, list):
        gap_results = []

    for stage, display_stage in _RESEARCH_STAGE_PLAN:
        if isinstance(stage_results.get(stage), dict):
            continue
        focus = _stage_focus(stage)
        job["stage"] = display_stage
        record["agent-pipeline-stage"] = display_stage
        await persist()
        existing_research = _assemble_research_stages(stage_results, gap_results)
        result, sources = await asyncio.to_thread(
            _run_grounded_stage,
            record,
            stage,
            focus,
            existing_research,
        )
        stage_results[stage] = {"result": result, "sources": list(dict.fromkeys(sources))}
        record["agent-pipeline-stage-results"] = stage_results
        record["agent-pipeline-stage"] = display_stage
        await persist()

    for _ in range(_MAX_COMPLETION_RESEARCH_CALLS):
        combined = _assemble_research_stages(stage_results, gap_results)
        output = _normalize_output(combined, list(dict.fromkeys(combined["sources"])), record)
        categories = {_signal_category(item.get("category")) for item in output["signals"] if isinstance(item, dict)}
        missing_categories = sorted(_REQUIRED_SIGNAL_CATEGORIES - categories)
        missing_requirements = _missing_output_requirements(output, missing_categories)
        if not missing_requirements:
            return output

        if missing_categories:
            next_stage = "gap"
            next_focus = _gap_focus(missing_categories, missing_requirements)
            display_stage = "gap review: " + ", ".join(missing_categories[:4])
        elif any(
            requirement in missing_requirements
            for requirement in (
                "itinerary days",
                "places to stay",
                "places to see",
                "source links for places to stay",
                "source links for places to see",
            )
        ):
            next_stage = "itinerary"
            next_focus = _itinerary_completion_focus(missing_requirements)
            display_stage = "itinerary completion: " + ", ".join(missing_requirements[:3])
        else:
            next_stage = "gap"
            next_focus = _gap_focus([], missing_requirements)
            display_stage = "completion: " + ", ".join(missing_requirements[:3])

        job["stage"] = display_stage
        record["agent-pipeline-stage"] = display_stage
        await persist()
        result, sources = await asyncio.to_thread(
            _run_grounded_stage,
            record,
            next_stage,
            next_focus,
            combined,
        )
        if next_stage == "gap":
            gap_results.append({"result": result, "sources": list(dict.fromkeys(sources))})
            record["agent-pipeline-gap-results"] = gap_results
        else:
            checkpoint = stage_results.get(next_stage)
            prior_result = checkpoint.get("result") if isinstance(checkpoint, dict) and isinstance(checkpoint.get("result"), dict) else {}
            prior_sources = checkpoint.get("sources") if isinstance(checkpoint, dict) and isinstance(checkpoint.get("sources"), list) else []
            stage_results[next_stage] = {
                "result": _merge_stage_result(prior_result, result),
                "sources": list(dict.fromkeys([*prior_sources, *sources])),
            }
            record["agent-pipeline-stage-results"] = stage_results
        await persist()

    combined = _assemble_research_stages(stage_results, gap_results)
    output = _normalize_output(combined, list(dict.fromkeys(combined["sources"])), record)
    _logger.warning(
        "Travel-planning completion calls exhausted with remaining requirements: %s",
        ", ".join(_missing_output_requirements(
            output,
            sorted(_REQUIRED_SIGNAL_CATEGORIES - {
                _signal_category(item.get("category"))
                for item in output["signals"]
                if isinstance(item, dict)
            }),
        )),
    )
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
        if not record.get("agent-pipeline-stage-results"):
            record["agent-pipeline-stage"] = "starting"

        async def persist() -> None:
            await write_json_file(access_token, _OUTPUT_FOLDER, f"{trip_id}.json", record)

        await persist()
        output = await _research_trip(record, job, persist)
        record["agent-pipeline-output"] = output
        record["agent-pipeline"] = "complete"
        record["agent-pipeline-stage"] = "complete"
        record["agent-pipeline-completed-at"] = datetime.now(UTC).isoformat()
        record.pop("agent-pipeline-stage-results", None)
        record.pop("agent-pipeline-gap-results", None)
        await persist()
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


async def queue_trip_agent_pipeline(access_token: str, trip_id: str, force: bool = False) -> dict[str, Any]:
    """Queue the travel-planning pipeline, optionally starting from scratch."""
    files = await list_json_files(access_token, _OUTPUT_FOLDER)
    record = files.get(trip_id)
    if not isinstance(record, dict) or not record.get("destination"):
        raise KeyError(trip_id)
    if not force and record.get("agent-pipeline") == "complete" and _has_recommendations(record.get("agent-pipeline-output")):
        return {"id": None, "status": "complete", "trip": _public_trip(record)}

    current_run_id = str(record.get("agent-pipeline-run-id") or "")
    current_job = _agent_pipeline_jobs.get(current_run_id)
    if current_job and current_job.get("status") in {"queued", "running"}:
        return {key: value for key, value in {**current_job, "trip": _public_trip(record)}.items() if key != "task"}

    if force:
        for key in (
            "agent-pipeline-output",
            "agent-pipeline-error",
            "agent-pipeline-completed-at",
            "agent-pipeline-stage-results",
            "agent-pipeline-gap-results",
        ):
            record.pop(key, None)
        record["agent-pipeline-stage"] = "starting"
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
