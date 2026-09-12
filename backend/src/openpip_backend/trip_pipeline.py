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
    "uv index": "uv", "sun exposure": "uv", "extreme heat": "temperature", "extreme cold": "temperature",
    "heat": "temperature", "cold": "temperature", "altitude sickness": "altitude", "acclimatization": "altitude",
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


def _render_trip_prompt(record: dict[str, Any], focus: str) -> str:
    """Render the production prompt template without keeping a copy in code."""
    blocks = _prompt_blocks("trip-research-template.md")
    if len(blocks) < 3:
        raise RuntimeError("trip-research-template.md must contain three fenced blocks")
    template, normal_schema, itinerary_schema = blocks[:3]
    rendered_focus = str(focus or "").strip()
    replacements = {
        "{{destination}}": str(record.get("destination") or "").strip(),
        "{{start_date}}": str(record.get("startDate") or "flexible"),
        "{{end_date}}": str(record.get("endDate") or "flexible"),
        "{{activities}}": ", ".join(str(value) for value in record.get("activities") or []) or "general travel",
        "{{pace}}": str(record.get("pace") or "Balanced"),
        "{{focus}}": rendered_focus,
    }
    rendered = template
    for token, value in replacements.items():
        rendered = rendered.replace(token, value)
    schema = itinerary_schema if rendered_focus.startswith("a practical") else normal_schema
    return rendered.replace("Use this exact output shape:", f"Use this exact output shape: {schema}")


def _trip_prompt(record: dict[str, Any], focus: str) -> str:
    """Compatibility name for callers that used the production prompt builder."""
    return _render_trip_prompt(record, focus)


def _stage_focus(stage: str, missing_categories: list[str] | None = None) -> str:
    if stage == "gap":
        focus = _prompt_blocks(_STAGE_PROMPT_FILES[stage])[0]
        return focus.replace("{{missing_categories}}", ", ".join(missing_categories or []))
    if stage not in _STAGE_PROMPT_FILES:
        raise ValueError(f"Unknown travel prompt stage: {stage}")
    return _prompt_blocks(_STAGE_PROMPT_FILES[stage])[0]


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
    return source_by_key.get(candidate_key)


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
    """Run one bounded Nova Grounding call and return its raw text and citations."""
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
    return text, sources


def _json_objects(text: str) -> list[dict[str, Any]]:
    """Extract balanced JSON objects without asking a model to repair them."""
    objects: list[dict[str, Any]] = []
    start: int | None = None
    depth = 0
    in_string = False
    escaped = False
    for index, character in enumerate(text):
        if start is None:
            if character == "{":
                start = index
                depth = 1
            continue
        if in_string:
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == '"':
                in_string = False
            continue
        if character == '"':
            in_string = True
        elif character == "{":
            depth += 1
        elif character == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start:index + 1]
                try:
                    parsed = json.loads(candidate, strict=False)
                except (TypeError, ValueError):
                    parsed = None
                if isinstance(parsed, dict):
                    objects.append(parsed)
                start = None
    return objects


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


def _heading_category(title: str) -> str | None:
    normalized = re.sub(r"[^a-z0-9]+", " ", title.casefold()).strip()
    for category in sorted(_REQUIRED_SIGNAL_CATEGORIES, key=len, reverse=True):
        label = category.replace("_", " ")
        if normalized == label or label in normalized:
            return category
    for alias, category in sorted(_SIGNAL_CATEGORY_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
        if alias in normalized:
            return category
    return None


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
    items: list[dict[str, Any]] = []
    for raw in _bullet_items(text):
        url = next(iter(_urls_in_text(raw)), None)
        if not url:
            continue
        link_match = re.search(r"\[([^]]+)\]\((https?://[^)]+)\)", raw)
        if link_match:
            name = link_match.group(1).strip()
        else:
            bold_match = re.match(r"\*\*(.+?)\*\*\s*(?:[:\-–]\s*)?(.*)$", raw)
            name = bold_match.group(1).strip() if bold_match else raw.split(" - ", 1)[0].split(" — ", 1)[0].strip()
        detail = re.sub(r"\s+", " ", raw).strip()
        detail = detail.replace(url, "").strip(" -–:;")
        items.append({"name": name[:160] or "Verified recommendation", "detail": detail[:500], "sourceUrl": url})
    return items


def _parse_markdown_research(text: str, stage: str) -> dict[str, Any]:
    sections = _heading_sections(text)
    parsed: dict[str, Any] = {"overview": "", "signals": [], "preparation": []}
    for title, body in sections:
        category = _heading_category(title)
        if category:
            detail = re.sub(r"SOURCE URL:\s*https?://\S+", "", body, flags=re.IGNORECASE).strip()
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
                    "route": parsed.get("routeSummary", ""),
                    "conditions": "",
                })
            lowered = title.casefold()
            if any(word in lowered for word in ("stay", "accommodation", "lodging", "hotel", "hostel")):
                for item in _recommendation_items(body):
                    item.update({"area": "", "type": "other", "safety": ""})
                    parsed["stays"].append(item)
            if any(word in lowered for word in ("see", "do", "attraction", "place", "trail", "activity", "museum")):
                for item in _recommendation_items(body):
                    item.update({"type": "other", "route": ""})
                    parsed["places"].append(item)
        if not parsed["overview"]:
            parsed["overview"] = next((body for title, body in sections if title.casefold() == "overview"), "")[:800]
    return parsed


def _promote_item_urls(output: dict[str, Any]) -> dict[str, Any]:
    for key in ("stays", "places"):
        items = output.get(key)
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, dict) and not item.get("sourceUrl"):
                url = next(iter(_urls_in_text(json.dumps(item, ensure_ascii=False))), None)
                if url:
                    item["sourceUrl"] = url
    return output


def _parse_grounded_text(text: str, stage: str) -> dict[str, Any]:
    """Parse Nova's raw grounded text locally; no model is used for formatting."""
    objects = [_promote_item_urls(item) for item in _json_objects(text)]
    if stage == "itinerary":
        for item in reversed(objects):
            if any(key in item for key in ("days", "stays", "places", "routeSummary")):
                return item
    else:
        for item in reversed(objects):
            if "signals" in item or "preparation" in item:
                return item
    if objects:
        return objects[-1]
    return _parse_markdown_research(text, stage)


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


def _run_grounded_stage(record: dict[str, Any], stage: str, focus: str) -> tuple[dict[str, Any], list[str]]:
    """Run one deterministic stage through Strands, retaining the tool's raw output."""
    from strands import Agent, tool

    system_prompt = _trip_prompt(record, focus)
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


def _grounded_json(prompt: str) -> tuple[dict[str, Any], list[str]]:
    """Compatibility helper for direct callers; parsing stays local and bounded."""
    text, sources = _grounded_response(prompt)
    parsed = _parse_grounded_text(text, "conditions")
    if not isinstance(parsed, dict):
        raise ValueError("Nova returned no parseable research stage")
    return parsed, list(dict.fromkeys([*sources, *_urls_in_text(text)]))


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
        for normalized in [{
            "name": str(item.get("name") or "Unverified stay option")[:160],
            "area": str(item.get("area") or "Area requires confirmation")[:120],
            "type": str(item.get("type") or "other")[:40],
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
        for normalized in [{
            "name": str(item.get("name") or "Unverified place")[:160],
            "type": str(item.get("type") or "other")[:40],
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


async def _research_trip(record: dict[str, Any], job: dict[str, Any]) -> dict[str, Any]:
    """Run separate grounded stages and validate the assembled output."""
    combined: dict[str, Any] = {"days": [], "preparation": [], "signals": [], "sources": [], "stays": [], "places": []}
    for stage, prompt_stage in (("conditions", "conditions"), ("health and hazards", "health"), ("itinerary", "itinerary")):
        focus = _stage_focus(prompt_stage)
        job["stage"] = stage
        result, sources = await asyncio.to_thread(_run_grounded_stage, record, prompt_stage, focus)
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
    for attempt in range(4):
        categories = {_signal_category(item.get("category")) for item in combined["signals"] if isinstance(item, dict)}
        missing = sorted(_REQUIRED_SIGNAL_CATEGORIES - categories)
        if not missing:
            break
        job["stage"] = "gap review: " + ", ".join(missing[:4])
        result, sources = await asyncio.to_thread(
            _run_grounded_stage,
            record,
            "gap",
            _stage_focus("gap", missing),
        )
        combined["preparation"].extend(result.get("preparation") or [])
        combined["signals"].extend(result.get("signals") or [])
        combined["sources"].extend(sources)
    output = _normalize_output(combined, list(dict.fromkeys(combined["sources"])), record)
    categories = {_signal_category(item.get("category")) for item in output["signals"] if isinstance(item, dict)}
    missing = sorted(_REQUIRED_SIGNAL_CATEGORIES - categories)
    missing_requirements = _missing_output_requirements(output, missing)
    if missing_requirements:
        raise ValueError("Travel-planning pipeline is missing required output: " + ", ".join(missing_requirements))
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
    if record.get("agent-pipeline") == "complete" and _has_recommendations(record.get("agent-pipeline-output")):
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
