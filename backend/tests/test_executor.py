"""executor.py — DefaultActionExecutor is mocked for everything except
save_draft, which really writes to Gmail. See its own docstring for why
that one action is the exception to "propose, never act"."""

from __future__ import annotations

import asyncio

from openpip_backend import executor as executor_module
from openpip_backend.executor import DefaultActionExecutor, MockActionExecutor
from openpip_backend.models import Proposal, SourceReference


def _proposal(action: str, **payload) -> Proposal:
    return Proposal(
        action=action, title="Save draft reply", rationale="A reply was drafted.",
        payload=payload, source=SourceReference(kind="email", id="email:gmail_1", title="Hi"),
    )


def test_save_draft_calls_the_real_gmail_api_when_a_token_is_present(monkeypatch) -> None:
    captured: dict[str, object] = {}

    async def fake_create_draft(_token: str, *, to, subject, body, thread_id=None):
        captured.update(to=to, subject=subject, body=body, thread_id=thread_id)
        return {"id": "draft-1"}

    monkeypatch.setattr(executor_module, "create_gmail_draft", fake_create_draft)
    proposal = _proposal("save_draft", to="a@example.com", subject="Re: Hi", body="Thanks!", threadId="thread-1")

    result = asyncio.run(DefaultActionExecutor().execute(proposal, "oauth-token"))

    assert result.reference == "gmail://drafts/draft-1"
    assert captured == {"to": "a@example.com", "subject": "Re: Hi", "body": "Thanks!", "thread_id": "thread-1"}


def test_save_draft_falls_back_to_mock_with_no_access_token(monkeypatch) -> None:
    async def fail_if_called(*_args, **_kwargs):
        raise AssertionError("must not call the real Gmail API with no token to authenticate with")

    monkeypatch.setattr(executor_module, "create_gmail_draft", fail_if_called)
    proposal = _proposal("save_draft", to="a@example.com", subject="Re: Hi", body="Thanks!")

    result = asyncio.run(DefaultActionExecutor().execute(proposal, None))

    assert result.reference == f"mock://actions/{proposal.id}"


def test_every_other_action_stays_mocked_regardless_of_token(monkeypatch) -> None:
    async def fail_if_called(*_args, **_kwargs):
        raise AssertionError("only save_draft should ever call the real Gmail API")

    monkeypatch.setattr(executor_module, "create_gmail_draft", fail_if_called)
    proposal = _proposal("task_followup")

    result = asyncio.run(DefaultActionExecutor().execute(proposal, "oauth-token"))

    assert result.reference == f"mock://actions/{proposal.id}"


def test_call_task_uses_calle_only_after_executor_is_given_a_session(monkeypatch) -> None:
    captured: dict[str, object] = {}

    async def fake_execute_call(**kwargs):
        captured.update(kwargs)
        return {"id": "call-1", "status": "completed"}

    monkeypatch.setattr(executor_module, "execute_call", fake_execute_call)
    proposal = _proposal(
        "call_task",
        recipientName="Maya Hair Studio",
        phone="+14155550101",
        goal="Ask whether Friday at 3 PM can move to Saturday at 11 AM.",
        region="US",
        locale="en-US",
    )

    result = asyncio.run(DefaultActionExecutor().execute(proposal, "oauth-token"))

    assert result.reference == "calle://calls/call-1?status=completed"
    assert captured["phone"] == "+14155550101"
    assert captured["proposal_id"] == proposal.id


def test_call_task_without_a_session_stays_mocked(monkeypatch) -> None:
    async def fail_if_called(**_kwargs):
        raise AssertionError("must not place a call without an authenticated session")

    monkeypatch.setattr(executor_module, "execute_call", fail_if_called)
    proposal = _proposal("call_task", phone="+14155550101", goal="Confirm the appointment")

    result = asyncio.run(DefaultActionExecutor().execute(proposal, None))

    assert result.reference == f"mock://actions/{proposal.id}"


def test_confirmed_call_updates_the_existing_calendar_event(monkeypatch) -> None:
    captured: dict[str, object] = {}

    async def fake_execute_call(**_kwargs):
        return {"id": "call-1", "status": "completed", "structured_result": {"outcome": "confirmed"}}

    async def fake_update(*args, **kwargs):
        captured["args"] = args
        captured["kwargs"] = kwargs
        return {"id": "event-1"}

    monkeypatch.setattr(executor_module, "execute_call", fake_execute_call)
    monkeypatch.setattr(executor_module, "update_google_calendar_event", fake_update)
    proposal = _proposal(
        "call_task",
        recipientName="Maya Hair Studio", phone="+14155550101",
        goal="Ask whether Friday at 3 PM can move to Saturday at 11 AM.",
        calendarUpdate={
            "action": "update_calendar_event", "calendarId": "primary", "eventId": "event-1",
            "start": "2026-09-12T11:00:00-07:00", "end": "2026-09-12T12:00:00-07:00",
        },
    )

    result = asyncio.run(DefaultActionExecutor().execute(proposal, "oauth-token"))

    assert result.reference == "calle://calls/call-1?status=completed&calendar=updated"
    assert captured["args"] == ("oauth-token", "primary", "event-1")
    assert captured["kwargs"]["start"] == "2026-09-12T11:00:00-07:00"


def test_unconfirmed_call_leaves_calendar_unchanged(monkeypatch) -> None:
    async def fake_execute_call(**_kwargs):
        return {"id": "call-2", "status": "completed", "structured_result": {"outcome": "declined"}}

    async def fail_if_updated(*_args, **_kwargs):
        raise AssertionError("calendar must not change when the provider declines")

    monkeypatch.setattr(executor_module, "execute_call", fake_execute_call)
    monkeypatch.setattr(executor_module, "update_google_calendar_event", fail_if_updated)
    proposal = _proposal(
        "call_task", recipientName="Maya Hair Studio", phone="+14155550101",
        goal="Ask whether Friday at 3 PM can move to Saturday at 11 AM.",
        calendarUpdate={
            "action": "update_calendar_event", "calendarId": "primary", "eventId": "event-1",
            "start": "2026-09-12T11:00:00-07:00", "end": "2026-09-12T12:00:00-07:00",
        },
    )

    result = asyncio.run(DefaultActionExecutor().execute(proposal, "oauth-token"))

    assert result.reference == "calle://calls/call-2?status=completed&calendar=unchanged"


def test_mock_action_executor_never_calls_gmail_even_for_save_draft(monkeypatch) -> None:
    async def fail_if_called(*_args, **_kwargs):
        raise AssertionError("MockActionExecutor must stay fully mocked")

    monkeypatch.setattr(executor_module, "create_gmail_draft", fail_if_called)
    proposal = _proposal("save_draft", to="a@example.com", subject="Re: Hi", body="Thanks!")

    result = asyncio.run(MockActionExecutor().execute(proposal, "oauth-token"))

    assert result.reference == f"mock://actions/{proposal.id}"
