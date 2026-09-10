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


def test_lookup_normalizes_null_memory_directory(monkeypatch) -> None:
    async def fake_lookup(_token: str, _query: str):
        return None

    monkeypatch.setattr(insight_memory, "lookup_insights", fake_lookup)
    state: dict = {}
    lookup = build_lookup_insights_tool("token", state)

    payload = json.loads(asyncio.run(lookup("learning activities")))

    assert payload == {"query": "learning activities", "insights": []}
    assert state["used"] is True
    assert state["lastResults"] == []


def test_remember_auto_checks_existing_memories_when_model_omits_lookup(monkeypatch) -> None:
    async def fake_upsert(*_args, **kwargs):
        return {"status": "updated", "memoryKey": kwargs["memory_key"]}

    async def fake_lookup(_token: str, query: str):
        assert query == "Care"
        return []

    monkeypatch.setattr(insight_memory, "upsert_insight", fake_upsert)
    monkeypatch.setattr(insight_memory, "lookup_insights", fake_lookup)
    references = {"email:1": {"id": "email:1", "kind": "email"}}
    search_state = {"used": True}
    lookup_state = {"used": False}
    remember = build_remember_insight_tool(
        "token", references, search_state=search_state, lookup_state=lookup_state,
    )

    async def run():
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


def test_remember_keeps_prerequisites_after_a_failed_payload(monkeypatch) -> None:
    async def fake_upsert(*_args, **kwargs):
        return {"status": "saved", "memoryKey": kwargs["memory_key"]}

    monkeypatch.setattr(insight_memory, "upsert_insight", fake_upsert)
    references = {"email:1": {"id": "email:1", "kind": "email"}}
    search_state = {"used": True}
    lookup_state = {"used": True, "lastQuery": "learning", "lastResults": []}
    remember = build_remember_insight_tool(
        "token", references, search_state=search_state, lookup_state=lookup_state,
    )

    async def run():
        with pytest.raises(ValueError, match="unknown source ids"):
            await remember(
                "context:learning", "context", "Learning", "The user studies calculus.",
                "high", ["document:missing"],
            )
        assert search_state["used"] is True
        assert lookup_state["used"] is True
        return await remember(
            "context:learning", "context", "Learning", "The user studies calculus.",
            "high", ["email:1"],
        )

    payload = json.loads(asyncio.run(run()))
    assert payload == {"status": "saved", "memoryKey": "context:learning"}


def test_remember_consumes_separate_prerequisite_credits_for_parallel_saves(monkeypatch) -> None:
    async def fake_upsert(*_args, **kwargs):
        await asyncio.sleep(0)
        return {"status": "saved", "memoryKey": kwargs["memory_key"]}

    monkeypatch.setattr(insight_memory, "upsert_insight", fake_upsert)
    references = {
        "email:1": {"id": "email:1", "kind": "email"},
        "email:2": {"id": "email:2", "kind": "email"},
    }
    search_state = {"used": True, "available": 2}
    lookup_state = {"used": True, "available": 2, "lastQuery": "learning", "lastResults": []}
    remember = build_remember_insight_tool(
        "token", references, search_state=search_state, lookup_state=lookup_state,
    )

    async def run():
        return await asyncio.gather(
            remember("context:learning", "context", "Learning", "The user studies calculus.", "high", ["email:1"]),
            remember("context:venture", "context", "Venture", "The user joined a venture.", "high", ["email:2"]),
        )

    payloads = [json.loads(payload) for payload in asyncio.run(run())]

    assert {payload["memoryKey"] for payload in payloads} == {"context:learning", "context:venture"}
    assert search_state["available"] == 0
    assert search_state["used"] is False
    assert lookup_state["available"] == 0
    assert lookup_state["used"] is False
    assert lookup_state["lastQuery"] == ""


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


def test_work_calendar_span_is_saved_instead_of_filtered(monkeypatch) -> None:
    async def fake_upsert(*_args, **kwargs):
        return {"status": "saved", "memoryKey": kwargs["memory_key"]}

    monkeypatch.setattr(insight_memory, "upsert_insight", fake_upsert)
    references = {
        "calendar:first": {"id": "calendar:first", "kind": "calendar", "label": "Work"},
        "calendar:last": {"id": "calendar:last", "kind": "calendar", "label": "Work"},
    }
    remember = build_remember_insight_tool(
        "token",
        references,
        search_state={"used": True},
        lookup_state={"used": True, "lastQuery": "Acme", "lastResults": []},
    )

    payload = json.loads(asyncio.run(remember(
        "work:employment:acme",
        "work",
        "Acme employment",
        "The user started working at Acme on January 2, 2021 and was still working there on March 8, 2021.",
        "high",
        ["calendar:first", "calendar:last"],
    )))

    assert payload == {"status": "saved", "memoryKey": "work:employment:acme"}
