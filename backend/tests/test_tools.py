"""tools/ — batched-tool-call convention (see tools/__init__.py's own
docstring). Exercises the plain, undecorated core of each batched tool
directly, since Strands wraps an @tool-decorated function into a
DecoratedFunctionTool that can't be called like a normal function anymore
(see travel_agent.py's / chat_history.py's own comments on why these
helpers exist)."""

from __future__ import annotations

import asyncio
import importlib

# tools/__init__.py does `from .travel_agent import travel_agent`, which
# rebinds the `travel_agent` attribute on the `openpip_backend.tools`
# package to the @tool-decorated function itself — shadowing the submodule
# of the same name. `import openpip_backend.tools.travel_agent` would
# silently resolve to that shadowed attribute instead of the module, so
# import explicitly via sys.modules (importlib.import_module) to get the
# real submodule and its plain, directly-testable helpers.
chat_history_tools = importlib.import_module("openpip_backend.tools.chat_history")
travel_agent_tools = importlib.import_module("openpip_backend.tools.travel_agent")


def test_plan_requests_returns_one_entry_per_request_in_order() -> None:
    result = travel_agent_tools.plan_requests(["Flight SFO to LAX in April", "Hotel in Cabo for 5 nights"])

    assert len(result) == 2
    assert [entry["request"] for entry in result] == ["Flight SFO to LAX in April", "Hotel in Cabo for 5 nights"]
    assert all(entry["status"] == "planning_only" for entry in result)


def test_plan_requests_flags_a_blank_request_without_dropping_the_others() -> None:
    result = travel_agent_tools.plan_requests(["", "Flight SFO to LAX"])

    assert result[0]["status"] == "needs_details"
    assert result[1]["status"] == "planning_only"
    assert result[1]["request"] == "Flight SFO to LAX"


def test_plan_requests_handles_a_single_request_same_as_a_batch() -> None:
    result = travel_agent_tools.plan_requests(["Flight SFO to LAX"])

    assert len(result) == 1
    assert result[0]["status"] == "planning_only"


def test_search_queries_runs_every_query_and_keys_results_by_query(monkeypatch) -> None:
    calls: list[str] = []

    async def fake_search(_access_token: str, query: str):
        calls.append(query)
        return [{"role": "user", "content": f"match for {query}"}] if query == "YogaX" else []

    monkeypatch.setattr(chat_history_tools.chat_history_store, "search_chat_history", fake_search)

    result = asyncio.run(chat_history_tools.search_queries("token", ["YogaX", "unrelated"]))

    # One call to the store per query — sequential batching, not a single
    # combined query — same as travel-agent's own search_web_multi.
    assert calls == ["YogaX", "unrelated"]
    assert result == {
        "YogaX": [{"role": "user", "content": "match for YogaX"}],
        "unrelated": [],
    }


def test_search_queries_handles_a_single_query_same_as_a_batch(monkeypatch) -> None:
    async def fake_search(_access_token: str, query: str):
        return [{"role": "user", "content": query}]

    monkeypatch.setattr(chat_history_tools.chat_history_store, "search_chat_history", fake_search)

    result = asyncio.run(chat_history_tools.search_queries("token", ["one query"]))

    assert result == {"one query": [{"role": "user", "content": "one query"}]}
