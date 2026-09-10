"""Tools used by the one-time historical insight gathering agent."""

from __future__ import annotations

import json
from typing import Any, Callable, TypeVar

from .. import insight_memory
from ..google_drive_docs import read_json_file

try:
    from strands import tool
except ImportError:  # pragma: no cover - keeps local tests importable
    F = TypeVar("F", bound=Callable[..., Any])

    def tool(func: F | None = None, **_kwargs: Any):  # type: ignore[no-untyped-def]
        def decorate(target: F) -> F:
            return target

        return decorate(func) if func is not None else decorate


def build_lookup_insights_tool(access_token: str) -> Any:
    @tool(
        name="lookup_historical_insights",
        description=(
            "Read the user's existing durable historical memories before saving a related fact. "
            "Use a focused query such as a person's name, a business, or a preference. "
            "This is read-only and helps you update an existing memory instead of duplicating it."
        ),
    )
    async def lookup_historical_insights(query: str = "") -> str:
        return json.dumps({"insights": await insight_memory.lookup_insights(access_token, query)})

    return lookup_historical_insights


def build_search_historical_sources_tool(
    access_token: str,
    manifest_folder: str,
    dates: list[str],
    manifest_version: int,
    source_references: dict[str, dict[str, Any]],
) -> Any:
    @tool(
        name="search_historical_sources",
        description=(
            "Search the paged historical source records for corroborating evidence across email, calendar, "
            "contacts, Google Docs, spreadsheets, and tasks. Search by a person, employer, business, or "
            "topic before saving a memory. Results are limited and include exact source ids that may be cited "
            "with remember_historical_insight; this tool does not load the entire history into the prompt."
        ),
    )
    async def search_historical_sources(query: str, limit: int = 20) -> str:
        terms = [term for term in query.strip().lower().split() if term]
        if not terms:
            return json.dumps({"sources": []})
        matches: list[dict[str, Any]] = []
        for day in dates:
            date_file = await read_json_file(access_token, manifest_folder, f"{day}.json")
            if not isinstance(date_file, dict) or date_file.get("version") != manifest_version:
                continue
            for page in date_file.get("pages", []):
                for entry in page.get("entries", []) if isinstance(page, dict) else []:
                    if not isinstance(entry, dict):
                        continue
                    record = entry.get("record") if isinstance(entry.get("record"), dict) else {}
                    reference = entry.get("reference") if isinstance(entry.get("reference"), dict) else {}
                    searchable = json.dumps({"record": record, "reference": reference}, default=str).lower()
                    if not all(term in searchable for term in terms):
                        continue
                    source_id = str(reference.get("id") or record.get("sourceId") or "")
                    if source_id and source_id not in source_references:
                        source_references[source_id] = reference
                    compact_record = {key: value for key, value in record.items() if key not in {"body", "content"}}
                    if isinstance(compact_record.get("values"), list):
                        compact_record["values"] = compact_record["values"][:40]
                    matches.append({"record": compact_record, "reference": reference})
                    if len(matches) >= max(1, min(limit, 50)):
                        return json.dumps({"sources": matches})
        return json.dumps({"sources": matches})

    return search_historical_sources


def build_remember_insight_tool(
    access_token: str,
    source_references: dict[str, dict[str, Any]],
    on_saved: Callable[[], None] | None = None,
) -> Any:
    @tool(
        name="remember_historical_insight",
        description=(
            "Save one durable, source-backed fact about the user. Use a stable lowercase memoryKey "
            "for the underlying fact so later batches update the same memory. Only save useful facts "
            "that are supported by the supplied sourceReferences; never infer sensitive information, "
            "secrets, or an ephemeral detail. sourceIds must exactly match supplied sourceReferences. "
            "Choose any descriptive category that fits the fact; categories are metadata, not a fixed list. "
            "Use healthcare for explicitly named care providers and care coordination, schedule for dated "
            "appointments/events/commitments, work for resumes/employment/job history, relationship for "
            "clients/investors/important people, preference for user preferences, routine for recurring "
            "patterns, goal for intentions, communication for contact-channel facts, and context for other "
            "durable facts. For employment, use one stable key per employer and role and update that memory "
            "with an end date when later evidence shows the user left; do not save each work-related record "
            "as its own memory. Generic holiday restatements are skipped."
        ),
    )
    async def remember_historical_insight(
        memory_key: str,
        category: str,
        subject: str,
        fact: str,
        confidence: str,
        source_ids: list[str],
        rationale: str = "",
    ) -> str:
        if not source_ids:
            raise ValueError("source_ids must contain at least one exact source id")
        missing = [source_id for source_id in source_ids if source_id not in source_references]
        if missing:
            raise ValueError(f"unknown source ids: {', '.join(missing)}")
        if insight_memory.is_generic_holiday_insight(fact=fact, source_references=[source_references[source_id] for source_id in source_ids]):
            return json.dumps({"status": "skipped", "reason": "Generic holiday facts are not user-specific memories."})
        record = await insight_memory.upsert_insight(
            access_token,
            memory_key=memory_key,
            category=category,
            subject=subject,
            fact=fact,
            confidence=confidence,
            source_references=[source_references[source_id] for source_id in source_ids],
            rationale=rationale,
        )
        if on_saved:
            on_saved()
        return json.dumps({"status": record["status"], "memoryKey": record["memoryKey"]})

    return remember_historical_insight
