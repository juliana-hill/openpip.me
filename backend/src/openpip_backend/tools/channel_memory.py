"""Agent tools for reading and explicitly recording channel preferences."""

from __future__ import annotations

import json
from typing import Any, Callable, TypeVar

from .. import channel_memory

try:
    from strands import tool
except ImportError:  # Keep local fallback mode importable without Strands installed.
    F = TypeVar("F", bound=Callable[..., Any])

    def tool(func: F | None = None, **_kwargs: Any):  # type: ignore[no-untyped-def]
        def decorate(target: F) -> F:
            return target

        return decorate(func) if func is not None else decorate


def build_lookup_channel_memory_tool(access_token: str) -> Any:
    @tool(
        name="lookup_channel_memory",
        description=(
            "Read the user's durable communication preference for a person or "
            "business. Use this before choosing whether a situation should use "
            "phone, email, text, or a booking system. Pass the exact person or "
            "business name/email as subject and the current situation as context; "
            "a specific context such as appointment rescheduling is more useful "
            "than a generic lookup. This is read-only."
        ),
    )
    async def lookup_channel_memory(subject: str, context: str = "") -> str:
        preferences = await channel_memory.lookup_channel_memory(access_token, subject, context)
        return json.dumps({"subject": subject, "context": context, "preferences": preferences})

    return lookup_channel_memory


def build_remember_channel_preference_tool(access_token: str) -> Any:
    @tool(
        name="remember_channel_preference",
        description=(
            "Save a durable communication preference for a person or business. "
            "If the same subject and situation already have a memory, update "
            "that memory instead of creating a duplicate. "
            "Use this only when the user explicitly states the preference or an "
            "actual completed interaction clearly establishes the channel; the "
            "same rule applies to explicit evidence in an email, calendar event, "
            "task, or contact record. Never save a guess. Include the exact "
            "subject, situation/context, channel (phone, email, booking_system, "
            "text, or unknown), short reason, and source reference when the fact "
            "came from workspace data. Saving memory does not contact anyone."
        ),
    )
    async def remember_channel_preference(
        subject: str,
        channel: str,
        reason: str,
        context: str = "general",
        source: str = "explicit_user_statement",
    ) -> str:
        record = await channel_memory.remember_channel_preference(
            access_token,
            subject,
            channel,
            reason,
            context,
            source,
        )
        return json.dumps(record)

    return remember_channel_preference
