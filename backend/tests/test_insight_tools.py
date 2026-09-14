import asyncio
import json

import pytest

from openpip_backend import insight_memory
from openpip_backend.tools.insights import (
    build_agentic_memory_status_tools,
    build_list_historical_sources_tool,
    build_lookup_insights_tool,
    build_read_historical_source_tool,
    build_remember_insight_tool,
)


def test_agentic_memory_topics_are_checkpointed_one_at_a_time() -> None:
    status = {"state": "pending", "currentTopic": None, "topics": []}
    writes: list[dict] = []

    async def persist(current: dict):
        writes.append(current.copy())

    list_topics, plan_topics, record_topic, complete_topic = build_agentic_memory_status_tools(
        status, persist, {"sourceIds": {"email:offer", "calendar:work"}},
    )

    async def run():
        initial = json.loads(await list_topics())
        planned = json.loads(await plan_topics(["Scout employment", "Learning goals"]))
        started = json.loads(await record_topic(
            "Scout employment",
            memory_key="work:employment:scout",
            rationale="Offer and scheduled work titles overlap.",
        ))
        completed = json.loads(await complete_topic(
            "Scout employment",
            memory_key="work:employment:scout",
            relevant_source_ids=["email:offer", "calendar:work"],
            completion_note="No more relevant indexed evidence found.",
        ))
        return initial, planned, started, completed

    initial, planned, started, completed = asyncio.run(run())

    assert initial["topics"] == []
    assert [item["topic"] for item in planned["topics"]] == ["Scout employment", "Learning goals"]
    assert started["topic"]["status"] == "in_progress"
    assert completed["topic"]["status"] == "completed"
    assert status["currentTopic"] is None
    assert status["topics"][0]["memoryKey"] == "work:employment:scout"
    assert status["topics"][0]["recordsRead"] == 2
    assert len(writes) == 3


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


def test_list_historical_sources_paginates_the_metadata_only_manifest() -> None:
    source_index = {
        "calendar:1": {
            "sourceId": "calendar:1", "kind": "calendar", "date": "2021-01-01",
            "label": "Work", "summary": "Work", "detail": "2021-01-01T09:00:00Z",
        },
        "document:1": {
            "sourceId": "document:1", "kind": "google_doc", "date": "2021-01-02",
            "label": "Brief Timeline", "summary": "Brief Timeline",
        },
    }
    list_sources = build_list_historical_sources_tool(source_index)

    first = json.loads(asyncio.run(list_sources(page=1, page_size=1)))
    second = json.loads(asyncio.run(list_sources(page=2, page_size=1)))

    assert first["total"] == 2
    assert first["nextPage"] == 2
    assert first["sources"][0]["summary"] == "Work"
    assert second["nextPage"] is None
    assert second["sources"][0]["sourceId"] == "document:1"


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


def test_remember_requires_read_source_before_write_when_enabled(monkeypatch) -> None:
    async def fake_upsert(*_args, **kwargs):
        return {"status": "saved", "memoryKey": kwargs["memory_key"]}

    monkeypatch.setattr(insight_memory, "upsert_insight", fake_upsert)
    references = {"calendar:1": {"id": "calendar:1", "kind": "calendar", "label": "Scout"}}
    search_state = {"used": True}
    lookup_state = {"used": True, "lastQuery": "Scout", "lastResults": []}
    read_state: dict = {}
    read = build_read_historical_source_tool("token", references, read_state)
    remember = build_remember_insight_tool(
        "token", references, search_state=search_state, lookup_state=lookup_state,
        read_state=read_state,
    )

    async def run():
        with pytest.raises(ValueError, match="read_historical_source"):
            await remember(
                "work:scout", "work", "Scout", "The user worked with Scout.",
                "high", ["calendar:1"],
            )
        await read("calendar:1")
        return await remember(
            "work:scout", "work", "Scout", "The user worked with Scout.",
            "high", ["calendar:1"],
        )

    payload = json.loads(asyncio.run(run()))
    assert payload == {"status": "saved", "memoryKey": "work:scout"}


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
