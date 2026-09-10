from __future__ import annotations

import asyncio
import json

import pytest

from openpip_backend import proposal_drive_store
from openpip_backend.models import Proposal
from openpip_backend.tools.proposals import build_create_proposal_tool, _validate_action


def test_call_proposal_requires_an_exact_e164_phone() -> None:
    with pytest.raises(ValueError, match="E.164"):
        _validate_action("call_task", {
            "recipientName": "Salon", "phone": "(415) 555-0101", "goal": "Reschedule",
        })


def test_chat_proposal_tool_persists_a_review_item(monkeypatch) -> None:
    captured: list[Proposal] = []

    async def fake_add(_token: str, proposal: Proposal) -> Proposal:
        captured.append(proposal)
        return proposal

    monkeypatch.setattr(proposal_drive_store, "add", fake_add)
    tool = build_create_proposal_tool("oauth-token", "session-1")
    result = asyncio.run(tool(
        action="call_task",
        title="Call dentist to move appointment",
        rationale="The provider requires a phone call to reschedule.",
        source_id="calendar:event-1",
        source_title="Dentist",
        source_kind="calendar_event",
        payload_json=json.dumps({
            "recipientName": "Dentist", "phone": "+14155550101", "goal": "Move the appointment",
            "calendarUpdate": {
                "action": "update_calendar_event", "calendarId": "primary", "eventId": "event-1",
                "start": "2026-09-13T09:00:00-07:00", "end": "2026-09-13T10:00:00-07:00",
            },
        }),
    ))

    assert json.loads(result)["status"] == "created"
    assert captured[0].action == "call_task"
    assert captured[0].status.value == "pending"
    assert captured[0].source.id == "calendar:event-1"
