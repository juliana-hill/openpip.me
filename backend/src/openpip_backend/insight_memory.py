"""Drive-backed durable insights gathered from the user's existing history.

Insight records are keyed by a stable ``memoryKey``.  Updating that key replaces
the current fact and merges its evidence, so repeated scans or overlapping
source batches refine one memory instead of creating an ever-growing list of
duplicates.
"""

from __future__ import annotations

import hashlib
import re
from datetime import UTC, datetime
from typing import Any

from .google_drive_docs import list_json_files, read_json_file, write_json_file

_FOLDER = "OpenPip/memory/insights"
_KEY_RE = re.compile(r"^[a-z0-9][a-z0-9:_./-]{2,160}$")
_GENERIC_HOLIDAY_RE = re.compile(r"\b(?:public|national|federal|bank|religious)\s+holiday\b", re.IGNORECASE)
_PERSONAL_HOLIDAY_RE = re.compile(
    r"\b(?:user|my|their|appointment|meeting|party|travel|trip|reschedul|cancel|attend|host|action)\b",
    re.IGNORECASE,
)


def _filename(memory_key: str) -> str:
    digest = hashlib.sha256(memory_key.strip().lower().encode("utf-8")).hexdigest()[:32]
    return f"{digest}.json"


async def list_insights(access_token: str, query: str = "") -> list[dict[str, Any]]:
    records = await list_json_files(access_token, _FOLDER)
    normalized_query = query.strip().lower()
    values = [record for record in records.values() if isinstance(record, dict)]
    if normalized_query:
        values = [
            record for record in values
            if normalized_query in " ".join(
                str(record.get(field) or "")
                for field in ("memoryKey", "category", "subject", "fact")
            ).lower()
        ]
    values.sort(key=lambda record: str(record.get("updatedAt") or ""), reverse=True)
    return values[:50]


async def lookup_insights(access_token: str, query: str = "") -> list[dict[str, Any]]:
    return await list_insights(access_token, query)


async def upsert_insight(
    access_token: str,
    *,
    memory_key: str,
    category: str,
    subject: str,
    fact: str,
    confidence: str,
    source_references: list[dict[str, Any]],
    rationale: str = "",
) -> dict[str, Any]:
    key = memory_key.strip().lower()
    if not _KEY_RE.fullmatch(key):
        raise ValueError("memory_key must be a stable lowercase key (letters, numbers, :, ., /, or -)")
    category = category.strip().lower()
    if not category:
        raise ValueError("category must not be empty")
    if not subject.strip() or not fact.strip():
        raise ValueError("subject and fact must not be empty")
    if confidence.strip().lower() not in {"high", "medium", "low"}:
        raise ValueError("confidence must be high, medium, or low")
    now = datetime.now(UTC).isoformat()
    existing = await read_json_file(access_token, _FOLDER, _filename(key)) or {}
    evidence_by_id = {
        str(item.get("id")): item
        for item in existing.get("evidence", [])
        if isinstance(item, dict) and item.get("id")
    }
    for reference in source_references:
        if isinstance(reference, dict) and reference.get("id"):
            evidence_by_id[str(reference["id"])] = reference
    record = {
        "version": 1,
        "memoryKey": key,
        "category": category,
        "subject": subject.strip(),
        "fact": fact.strip(),
        "confidence": confidence.strip().lower(),
        "evidence": list(evidence_by_id.values())[-12:],
        "rationale": rationale.strip()[:500],
        "createdAt": existing.get("createdAt") or now,
        "updatedAt": now,
    }
    await write_json_file(access_token, _FOLDER, _filename(key), record)
    return {"status": "updated" if existing else "saved", **record}


def format_insight_context(insights: list[dict[str, Any]]) -> str:
    if not insights:
        return ""
    return "Durable historical insights (use as context, not as new facts):\n" + "\n".join(
        f"- [{item.get('category')}] {item.get('subject')}: {item.get('fact')} "
        f"(confidence: {item.get('confidence', 'medium')})"
        for item in insights[:30]
    )


def is_generic_holiday_insight(
    *, fact: str, source_references: list[dict[str, Any]],
) -> bool:
    """Reject an obvious calendar-fact restatement, not a personal holiday action."""
    if not source_references or any(not isinstance(reference, dict) for reference in source_references):
        return False
    if not all(str(reference.get("kind") or "").lower() == "calendar" for reference in source_references):
        return False
    return bool(_GENERIC_HOLIDAY_RE.search(fact)) and not bool(_PERSONAL_HOLIDAY_RE.search(fact))
