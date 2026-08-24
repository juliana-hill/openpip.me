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


def test_mock_action_executor_never_calls_gmail_even_for_save_draft(monkeypatch) -> None:
    async def fail_if_called(*_args, **_kwargs):
        raise AssertionError("MockActionExecutor must stay fully mocked")

    monkeypatch.setattr(executor_module, "create_gmail_draft", fail_if_called)
    proposal = _proposal("save_draft", to="a@example.com", subject="Re: Hi", body="Thanks!")

    result = asyncio.run(MockActionExecutor().execute(proposal, "oauth-token"))

    assert result.reference == f"mock://actions/{proposal.id}"
