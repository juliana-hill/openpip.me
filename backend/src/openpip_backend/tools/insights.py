"""Tools used by the one-time historical insight gathering agent."""

from __future__ import annotations

import json
from typing import Any, Callable, TypeVar

from .. import insight_memory

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
            "secrets, or an ephemeral detail. sourceIds must exactly match supplied sourceReferences."
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
