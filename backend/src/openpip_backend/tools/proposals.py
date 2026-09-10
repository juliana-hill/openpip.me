"""Call-proposal and calendar-context tools for the conversational assistant."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import UTC, datetime
from typing import Any, Callable, TypeVar

from .. import proposal_drive_store
from ..google_workspace import fetch_google_calendars
from ..models import Proposal, SourceReference

try:
    from strands import tool
except ImportError:  # Keep local fallback mode importable without Strands installed.
    F = TypeVar("F", bound=Callable[..., Any])

    def tool(func: F | None = None, **_kwargs: Any):  # type: ignore[no-untyped-def]
        def decorate(target: F) -> F:
            return target

        return decorate(func) if func is not None else decorate


_ALLOWED_ACTIONS = {"call_task"}
_SOURCE_KINDS = {"conversation", "calendar_event", "email", "task", "contact"}
_PHONE_PATTERN = re.compile(r"^\+\d{8,15}$")


def _compact_event(calendar: dict[str, Any], event: dict[str, Any]) -> dict[str, Any]:
    event_id = str(event.get("id") or "")
    return {
        "sourceId": f"calendar:{event_id}",
        "calendarId": calendar.get("id"),
        "title": event.get("title") or "Untitled event",
        "description": event.get("description"),
        "location": event.get("location"),
        "attendees": event.get("attendees") or [],
        "start": event.get("start"),
        "end": event.get("end"),
        "htmlLink": event.get("htmlLink"),
        "status": event.get("status"),
    }


def build_find_calendar_events_tool(access_token: str) -> Any:
    @tool(
        name="find_calendar_events",
        description=(
            "Find upcoming Google Calendar events to ground a phone-call proposal "
            "when the user refers to an existing event. Returns exact sourceId, "
            "calendarId, eventId, times, attendees, and location. Never invent an "
            "event id, phone number, or time, and do not assume every event needs "
            "a phone call."
        ),
    )
    async def find_calendar_events(query: str = "", days: int = 180) -> str:
        bounded_days = max(1, min(int(days), 180))
        calendars = await fetch_google_calendars(
            access_token,
            from_date=datetime.now(UTC).date().isoformat(),
            days=bounded_days,
        )
        needle = str(query or "").strip().casefold()
        events = [
            _compact_event(calendar, event)
            for calendar in calendars
            for event in calendar.get("events", [])
            if not needle or needle in json.dumps(event, sort_keys=True).casefold()
        ]
        return json.dumps({"events": events[:50]})

    return find_calendar_events


def _parse_payload(payload_json: str) -> dict[str, Any]:
    try:
        payload = json.loads(payload_json)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError("payload_json must be valid JSON") from error
    if not isinstance(payload, dict):
        raise ValueError("payload_json must contain a JSON object")
    return payload


def _validate_action(action: str, payload: dict[str, Any]) -> None:
    if action not in _ALLOWED_ACTIONS:
        raise ValueError(f"unsupported proposal action: {action}")
    if action == "call_task":
        for field in ("recipientName", "phone", "goal"):
            if not str(payload.get(field) or "").strip():
                raise ValueError(f"call proposals require {field}")
        if not _PHONE_PATTERN.fullmatch(str(payload["phone"]).strip()):
            raise ValueError("call proposals require an E.164 phone number")
        calendar_update = payload.get("calendarUpdate")
        if calendar_update is not None:
            if not isinstance(calendar_update, dict) or str(calendar_update.get("action") or "") != "update_calendar_event":
                raise ValueError("calendarUpdate must describe an existing event reschedule")
            for field in ("calendarId", "eventId", "start", "end"):
                if not str(calendar_update.get(field) or "").strip():
                    raise ValueError(f"calendarUpdate requires {field}")


def build_create_proposal_tool(access_token: str, session_id: str) -> Any:
    @tool(
        name="create_proposal",
        description=(
            "Create one exact phone-call proposal for the user to review and approve. "
            "Creating the proposal does not place the call; after approval, OpenPip "
            "places the approved CALL-E call. Never tell the user to make it themselves. "
            "Use this only when the user or the workspace evidence says a phone call "
            "is required; do not assume every calendar event needs one. The phone must "
            "be the exact number from the user or a read tool, in E.164 form. For an "
            "existing calendar event, include its exact sourceId from find_calendar_events. "
            "Pass payload_json as a JSON object. The only supported action is call_task. "
            "For a phone-required calendar reschedule, include calendarUpdate with the "
            "existing calendarId/eventId and the proposed start/end; the event is updated "
            "only if the call completes and the provider confirms the new time."
        ),
    )
    async def create_proposal(
        action: str,
        title: str,
        rationale: str,
        source_id: str,
        source_title: str,
        payload_json: str,
        source_kind: str = "conversation",
        source_detail: str = "",
        source_url: str = "",
    ) -> str:
        normalized_action = str(action or "").strip()
        payload = _parse_payload(payload_json)
        _validate_action(normalized_action, payload)
        normalized_source_kind = str(source_kind or "conversation").strip()
        if normalized_source_kind not in _SOURCE_KINDS:
            raise ValueError(f"unsupported source kind: {normalized_source_kind}")
        title_value = str(title or "").strip()
        rationale_value = str(rationale or "").strip()
        source_id_value = str(source_id or "").strip()
        source_title_value = str(source_title or "").strip()
        if not title_value or not rationale_value or not source_id_value or not source_title_value:
            raise ValueError("proposal title, rationale, source_id, and source_title are required")
        source = SourceReference(
            kind=normalized_source_kind,
            id=source_id_value,
            title=source_title_value,
            detail=str(source_detail or "").strip() or None,
            url=str(source_url or "").strip() or None,
        )
        fingerprint = json.dumps(
            {"session": session_id, "action": normalized_action, "source": source_id_value, "payload": payload},
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        proposal = Proposal(
            action=normalized_action,
            title=title_value[:200],
            rationale=rationale_value[:500],
            payload=payload,
            source=source,
            idempotency_key=f"chat:{hashlib.sha256(fingerprint).hexdigest()}",
        )
        stored = await proposal_drive_store.add(access_token, proposal)
        return json.dumps({
            "status": "created",
            "proposalId": stored.id,
            "message": "Proposal is ready for the user to review. It has not run yet.",
        })

    return create_proposal
