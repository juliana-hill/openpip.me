import asyncio
import json

import pytest

from openpip_backend import insight_memory
from openpip_backend.tools.insights import (
    build_lookup_insights_tool,
    build_remember_insight_tool,
)


def test_lookup_requires_a_focused_query_and_records_the_result(monkeypatch) -> None:
    async def fake_lookup(_token: str, query: str):
        return [{"memoryKey": "healthcare:provider:smith", "fact": f"query={query}"}]

    monkeypatch.setattr(insight_memory, "lookup_insights", fake_lookup)
    state: dict = {}
    lookup = build_lookup_insights_tool("token", state)

    async def run():
        with pytest.raises(ValueError, match="focused query"):
            await lookup()
        return await lookup("Dr. Smith")

    payload = json.loads(asyncio.run(run()))

    assert payload["query"] == "Dr. Smith"
    assert payload["insights"][0]["memoryKey"] == "healthcare:provider:smith"
    assert state["lastQuery"] == "Dr. Smith"
    assert state["lastResults"] == payload["insights"]


def test_remember_requires_lookup_and_consumes_both_gates(monkeypatch) -> None:
    async def fake_upsert(*_args, **kwargs):
        return {"status": "updated", "memoryKey": kwargs["memory_key"]}

    monkeypatch.setattr(insight_memory, "upsert_insight", fake_upsert)
    references = {"email:1": {"id": "email:1", "kind": "email"}}
    search_state = {"used": True}
    lookup_state = {"used": False}
    remember = build_remember_insight_tool(
        "token", references, search_state=search_state, lookup_state=lookup_state,
    )

    async def run():
        with pytest.raises(ValueError, match="lookup_historical_insights"):
            await remember(
                "healthcare:provider:smith", "healthcare", "Care", "The user sees Dr. Smith.",
                "high", ["email:1"],
            )
        search_state["used"] = True
        lookup_state.update({"used": True, "lastQuery": "Dr. Smith", "lastResults": []})
        return await remember(
            "healthcare:provider:smith", "healthcare", "Care", "The user sees Dr. Smith.",
            "high", ["email:1"],
        )

    payload = json.loads(asyncio.run(run()))

    assert payload == {"status": "updated", "memoryKey": "healthcare:provider:smith"}
    assert search_state["used"] is False
    assert lookup_state["used"] is False
    assert lookup_state["lastQuery"] == ""
    assert lookup_state["lastResults"] == []


def test_skipped_memory_also_consumes_lookup_gate() -> None:
    references = {"calendar:holiday": {"id": "calendar:holiday", "kind": "calendar"}}
    search_state = {"used": True}
    lookup_state = {"used": True, "lastQuery": "holiday", "lastResults": []}
    remember = build_remember_insight_tool(
        "token", references, search_state=search_state, lookup_state=lookup_state,
    )

    async def run():
        return await remember(
            "context:holiday", "context", "Holiday", "This is a public holiday.",
            "high", ["calendar:holiday"],
        )

    payload = json.loads(asyncio.run(run()))

    assert payload["status"] == "skipped"
    assert search_state["used"] is False
    assert lookup_state["used"] is False
    assert lookup_state["lastQuery"] == ""
