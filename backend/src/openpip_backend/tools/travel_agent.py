"""On-demand travel planning tool for the Executive Assistant.

This is a tool, not an agent persona or a system-prompt skill. It currently
normalizes a travel request and reports connector readiness; it never searches,
books, edits, or claims that an external action occurred.

Takes a *list* of requests in one call, not one request per call — see
tools/__init__.py's docstring for the batched-tool-call convention (ported
from travel-agent's search_web_multi / schedule_linear_tasks). This tool
does no real external call yet (see its own "planning_only" result below),
so batching costs nothing today, but keeps the shape future search/booking
connectors inherit for free instead of needing a second migration once
they land.
"""

from __future__ import annotations

import json
from typing import Any, Callable, TypeVar

try:
    from strands import tool
except ImportError:  # Keep local fallback mode importable without Strands installed.
    F = TypeVar("F", bound=Callable[..., Any])

    def tool(func: F | None = None, **_kwargs: Any):  # type: ignore[no-untyped-def]
        def decorate(target: F) -> F:
            return target

        return decorate(func) if func is not None else decorate


def _plan_one(request: str) -> dict[str, Any]:
    cleaned = request.strip()
    if not cleaned:
        return {
            "status": "needs_details",
            "message": "Please provide a destination and any dates or constraints.",
        }
    return {
        "status": "planning_only",
        "request": cleaned,
        "live_search_available": False,
        "booking_available": False,
        "message": (
            "Travel planning is available on demand, but live search and booking "
            "connectors are not configured in the OpenPip backend. No external "
            "action was taken."
        ),
    }


def plan_requests(requests: list[str]) -> list[dict[str, Any]]:
    """The plain, directly-testable core — kept separate from the @tool-
    decorated function below because Strands wraps a decorated function into
    a DecoratedFunctionTool that isn't callable like a normal function
    anymore (no .func passthrough), so tests exercise this instead."""
    return [_plan_one(request) for request in requests]


@tool(
    name="travel_agent",
    description=(
        "Use only when the user asks for travel planning. Normalize one or more "
        "travel requests and identify missing details; never book or modify "
        "travel. Pass every request you need in one call (e.g. a flight leg and "
        "a hotel search together) — it counts as one tool call regardless of "
        "how many requests you pass, unlike calling this once per request."
    ),
)
def travel_agent(requests: list[str]) -> str:
    """Prepare travel-planning requests without taking an external action.

    Args:
        requests: The user's natural-language travel questions or itinerary
            requests, one entry per distinct request.

    Returns:
        A JSON array (one entry per request, same order) that the Executive
        Assistant can use to explain what is known and what still needs to be
        configured or clarified.
    """
    return json.dumps(plan_requests(requests))
