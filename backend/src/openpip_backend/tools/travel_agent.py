"""On-demand travel planning tool for the Executive Assistant.

This is a tool, not an agent persona or a system-prompt skill. It currently
normalizes a travel request and reports connector readiness; it never searches,
books, edits, or claims that an external action occurred.
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


@tool(
    name="travel_agent",
    description=(
        "Use only when the user asks for travel planning. Normalize the request "
        "and identify missing details; never book or modify travel."
    ),
)
def travel_agent(request: str) -> str:
    """Prepare a travel-planning request without taking an external action.

    Args:
        request: The user's natural-language travel question or itinerary request.

    Returns:
        A JSON string that the Executive Assistant can use to explain what is
        known and what still needs to be configured or clarified.
    """
    cleaned = request.strip()
    if not cleaned:
        return json.dumps({
            "status": "needs_details",
            "message": "Please provide a destination and any dates or constraints.",
        })

    return json.dumps({
        "status": "planning_only",
        "request": cleaned,
        "live_search_available": False,
        "booking_available": False,
        "message": (
            "Travel planning is available on demand, but live search and booking "
            "connectors are not configured in the OpenPip backend. No external "
            "action was taken."
        ),
    })
