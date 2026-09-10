"""Tools used by the one-time historical insight gathering agent."""

from __future__ import annotations

import json
from typing import Any, Callable, TypeVar

from .. import insight_memory
from ..google_drive_docs import read_json_file
from ..google_workspace import (
    fetch_gmail_message,
    fetch_google_calendar_event,
    fetch_google_contact,
    fetch_google_drive_document,
    fetch_google_spreadsheet_row,
    fetch_google_task,
)

try:
    from strands import tool
except ImportError:  # pragma: no cover - keeps local tests importable
    F = TypeVar("F", bound=Callable[..., Any])

    def tool(func: F | None = None, **_kwargs: Any):  # type: ignore[no-untyped-def]
        def decorate(target: F) -> F:
            return target

        return decorate(func) if func is not None else decorate


def build_lookup_insights_tool(access_token: str, lookup_state: dict[str, Any] | None = None) -> Any:
    @tool(
        name="lookup_historical_insights",
        description=(
            "Read the user's existing durable historical memories before saving a related fact. "
            "Use a focused query such as a person's name, a business, or a preference. "
            "This is read-only and helps you update an existing memory instead of duplicating it. "
            "A focused lookup is mandatory immediately before every memory save; do not use an "
            "empty query."
        ),
    )
    async def lookup_historical_insights(query: str = "") -> str:
        normalized_query = query.strip()
        if not normalized_query:
            raise ValueError(
                "lookup_historical_insights requires a focused query before saving a historical insight"
            )
        insights = await insight_memory.lookup_insights(access_token, normalized_query) or []
        if not isinstance(insights, list):
            insights = []
        if lookup_state is not None:
            lookup_state["used"] = True
            lookup_state["available"] = int(lookup_state.get("available") or 0) + 1
            lookup_state["lastQuery"] = normalized_query
            # Keep the result available to the save gate and to diagnostics. An
            # empty result is still a valid lookup: it proves the agent checked
            # before deciding this is a new memory.
            lookup_state["lastResults"] = insights
            lookup_state.setdefault("queries", []).append(normalized_query)
        return json.dumps({"query": normalized_query, "insights": insights})

    return lookup_historical_insights


def build_read_historical_source_tool(
    access_token: str,
    source_entries: dict[str, dict[str, Any]],
) -> Any:
    """Let the agent fetch exactly one source's full content on demand."""
    @tool(
        name="read_historical_source",
        description=(
            "Read one complete historical source record by its exact sourceId. "
            "Use this during the final memory pass for a completed date when its brief index "
            "summary is not enough to support a precise durable memory. The source is fetched "
            "in memory only and is never stored in the manifest. For any calendar event, "
            "this grounding read includes the exact location and complete event fields; use "
            "that location to ground the event's real-world context. For a Work event, it can "
            "be correlated with a matching offer or onboarding email, but never infer a job "
            "title from the event name alone."
        ),
    )
    async def read_historical_source(source_id: str) -> str:
        item = source_entries.get(source_id)
        if not isinstance(item, dict):
            raise ValueError(f"unknown source id: {source_id}")
        kind = str(item.get("kind") or "")
        if kind == "email":
            message_id = source_id.removeprefix("email:").removeprefix("gmail_")
            payload = await fetch_gmail_message(access_token, message_id)
        elif kind == "google_doc":
            file_id = source_id.removeprefix("document:")
            payload = {"sourceId": source_id, "content": await fetch_google_drive_document(access_token, file_id)}
        elif kind == "google_sheet_row":
            row_parts = source_id.removeprefix("sheet:").rsplit(":", 1)
            file_parts = row_parts[0].split(":", 1) if len(row_parts) == 2 else []
            if len(file_parts) != 2:
                raise ValueError(f"invalid spreadsheet source id: {source_id}")
            file_id, sheet = file_parts
            row_number = row_parts[1]
            payload = await fetch_google_spreadsheet_row(access_token, file_id, sheet, int(row_number))
        elif kind == "calendar" and item.get("providerId"):
            event_id = source_id.removeprefix("calendar:")
            payload = await fetch_google_calendar_event(access_token, str(item["providerId"]), event_id)
        elif kind == "task" and item.get("providerId"):
            task_id = source_id.rsplit(":", 1)[-1]
            payload = await fetch_google_task(access_token, str(item["providerId"]), task_id)
        elif kind == "contact":
            payload = await fetch_google_contact(access_token, source_id.removeprefix("contact:"))
        else:
            # Calendar, task, and contact records are already represented by
            # the provider's compact metadata response for the current date.
            payload = item.get("record") or item
        return json.dumps(payload, default=str)

    return read_historical_source


def build_search_historical_sources_tool(
    access_token: str,
    manifest_folder: str,
    dates: list[str],
    manifest_version: int,
    source_references: dict[str, dict[str, Any]],
    search_state: dict[str, Any] | None = None,
    source_index: dict[str, dict[str, Any]] | None = None,
) -> Any:
    @tool(
        name="search_historical_sources",
        description=(
        "Search the paged historical source records for corroborating evidence across email, calendar, "
        "contacts, Google Docs, spreadsheets, and tasks. Search by a person, employer, business, or "
            "topic before saving a memory; this search is required before a memory can be saved. Results are limited and include exact source ids that may be cited "
            "with remember_historical_insight; this tool does not load the entire history into the prompt."
        ),
    )
    async def search_historical_sources(query: str, limit: int = 20) -> str:
        terms = [term for term in query.strip().lower().split() if term]
        if not terms:
            return json.dumps({"sources": []})
        if search_state is not None:
            search_state["used"] = True
            search_state["available"] = int(search_state.get("available") or 0) + 1
            search_state.setdefault("queries", []).append(query.strip())
        matches: list[dict[str, Any]] = []
        if source_index is not None:
            indexed_entries = list(source_index.values())
        else:
            indexed_entries = []
            for day in dates:
                date_file = await read_json_file(access_token, manifest_folder, f"{day}.json")
                if not isinstance(date_file, dict) or date_file.get("version") != manifest_version:
                    continue
                for page in date_file.get("pages", []):
                    if isinstance(page, dict):
                        indexed_entries.extend(item for item in page.get("entries", []) if isinstance(item, dict))
        for item in indexed_entries:
            if item.get("sourceId"):
                # Current lazy date files contain index-only entries directly.
                # Keep the search result compact and never surface a legacy raw
                # record payload if one is encountered during recovery.
                record = {
                    "sourceId": item.get("sourceId"),
                    "date": item.get("date"),
                    "summary": item.get("summary") or "",
                }
                reference = {
                    "id": item.get("sourceId"),
                    "kind": item.get("kind"),
                    "label": item.get("label"),
                    "detail": item.get("detail"),
                    "url": item.get("url"),
                    **({"providerId": item["providerId"]} if item.get("providerId") else {}),
                }
            else:
                record = item.get("record") if isinstance(item.get("record"), dict) else item
                reference = item.get("reference") if isinstance(item.get("reference"), dict) else item
            searchable = json.dumps({"record": record, "reference": reference}, default=str).lower()
            if not all(term in searchable for term in terms):
                continue
            source_id = str(reference.get("id") or record.get("sourceId") or item.get("sourceId") or "")
            if source_id and source_id not in source_references:
                source_references[source_id] = reference
            compact_record = {key: value for key, value in record.items() if key not in {"body", "content", "values"}}
            matches.append({"record": compact_record, "reference": reference})
            if len(matches) >= max(1, min(limit, 50)):
                return json.dumps({"sources": matches})
        return json.dumps({"sources": matches})

    return search_historical_sources


def build_remember_insight_tool(
    access_token: str,
    source_references: dict[str, dict[str, Any]],
    on_saved: Callable[[], None] | None = None,
    search_state: dict[str, Any] | None = None,
    lookup_state: dict[str, Any] | None = None,
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
            "patterns, goal for intentions, communication for contact-channel facts, personality for explicit "
            "personality or communication-style facts, assessment for official tests or evaluations, profile "
            "for durable background facts, and context for other durable facts. Search related historical "
            "sources and look up existing memories before every save. For goals, use one stable key for the "
            "overarching project or initiative—not one key per task or sub-activity—and update that memory as "
            "new supporting actions are found. For employment, use one stable key per employer and role and "
            "update that memory with an end date when later evidence shows the user left; do not save each "
            "work-related record as its own memory. Repeated calendar work blocks are evidence for one "
            "employment-span memory, not separate memories. Generic holiday restatements are skipped. A focused existing-memory lookup "
            "must complete before this call; if the model omitted that lookup, the save tool performs it "
            "automatically using the subject or memory key. If a related memory is returned, update its "
            "exact memoryKey instead of creating a second key. Calendar work events may support an "
            "employment memory even when their title is only Work, Office, Shift, or Workday; use the "
            "earliest and latest matching location events as the observed employment span and cite those "
            "events, while using offer, hiring, acceptance, or onboarding evidence to identify the exact "
            "employer or job title when available."
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
        consumed_prerequisites = False
        try:
            if not source_ids:
                raise ValueError("source_ids must contain at least one exact source id")
            search_available = int((search_state or {}).get("available") or 0)
            if search_available < 1 and (search_state or {}).get("used"):
                # Preserve compatibility with callers that initialized the
                # pre-credit boolean gate before this tool was upgraded.
                search_available = 1
            if search_state is None or search_available < 1:
                raise ValueError("search_historical_sources must be called before saving a historical insight")
            lookup_available = int((lookup_state or {}).get("available") or 0)
            if lookup_available < 1 and (lookup_state or {}).get("used") and str(
                (lookup_state or {}).get("lastQuery") or ""
            ).strip():
                # Preserve compatibility with callers that initialized the
                # pre-credit boolean gate before this tool was upgraded.
                lookup_available = 1
            if lookup_state is None or lookup_available < 1 or not str(
                (lookup_state or {}).get("lastQuery") or ""
            ).strip():
                # Keep the safety invariant even when the model skips the
                # explicit tool call: never write until the current durable
                # memory directory has been checked. An empty result is valid
                # for a first-run user and still satisfies the prerequisite.
                lookup_query = str(subject or memory_key).strip()
                if not lookup_query:
                    raise ValueError("a subject or memory_key is required for the existing-memory lookup")
                existing = await insight_memory.lookup_insights(access_token, lookup_query) or []
                if not isinstance(existing, list):
                    existing = []
                if lookup_state is not None:
                    lookup_state["used"] = True
                    lookup_state["available"] = lookup_available + 1
                    lookup_state["lastQuery"] = lookup_query
                    lookup_state["lastResults"] = existing
                    lookup_state.setdefault("queries", []).append(lookup_query)
            missing = [source_id for source_id in source_ids if source_id not in source_references]
            if missing:
                raise ValueError(f"unknown source ids: {', '.join(missing)}")
            if insight_memory.is_generic_holiday_insight(
                fact=fact,
                source_references=[source_references[source_id] for source_id in source_ids],
            ):
                consumed_prerequisites = True
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
            consumed_prerequisites = True
            if on_saved:
                on_saved()
            return json.dumps({"status": record["status"], "memoryKey": record["memoryKey"]})
        finally:
            # A successful or intentionally skipped memory consumes both
            # prerequisites. Validation/provider failures do not: no memory was
            # written, so the agent can correct the payload and retry without
            # being told to repeat checks it already completed.
            if consumed_prerequisites:
                if search_state is not None:
                    current_search = int(search_state.get("available") or 0)
                    if current_search < 1 and search_state.get("used"):
                        current_search = 1
                    remaining_search = max(0, current_search - 1)
                    search_state["available"] = remaining_search
                    search_state["used"] = remaining_search > 0
                if lookup_state is not None:
                    current_lookup = int(lookup_state.get("available") or 0)
                    if current_lookup < 1 and lookup_state.get("used") and str(
                        lookup_state.get("lastQuery") or ""
                    ).strip():
                        current_lookup = 1
                    remaining_lookup = max(0, current_lookup - 1)
                    lookup_state["available"] = remaining_lookup
                    lookup_state["used"] = remaining_lookup > 0
                    if remaining_lookup == 0:
                        lookup_state["lastQuery"] = ""
                        lookup_state["lastResults"] = []

    return remember_historical_insight
