"""The only boundary allowed to perform proposal side effects.

Real Google and CALL-E adapters will implement this interface later. The default
implementation is deliberately a mock for everything except saving a Gmail
draft — see DefaultActionExecutor below for why that one action is a real
write, not a mock, and google_workspace.create_gmail_draft for what it
actually calls.
"""

from dataclasses import dataclass
from typing import Protocol

from .google_workspace import create_gmail_draft
from .models import Proposal


@dataclass(frozen=True)
class ExecutionResult:
    reference: str


class ActionExecutor(Protocol):
    async def execute(self, proposal: Proposal, access_token: str | None = None) -> ExecutionResult: ...


class MockActionExecutor:
    """Fully mocked — cannot send, write, or call an external service no
    matter what the proposal is. Used by tests that want that guarantee
    absolute, and by any caller with no access_token to act with."""

    async def execute(self, proposal: Proposal, access_token: str | None = None) -> ExecutionResult:
        return ExecutionResult(reference=f"mock://actions/{proposal.id}")


class DefaultActionExecutor:
    """Mocked for every action except save_draft (see proposal_scan.py /
    inbox_triage.py for what creates that kind), which really does create a
    Gmail draft. That's the one proposal action safe enough to actually
    execute today: a draft is private and fully reversible, unlike sending —
    which stays proposal-gated for its own, deliberately separate, later
    step (see google_workspace.create_gmail_draft's docstring). Falls back
    to the mock behavior with no access_token, since there's nothing to
    authenticate the real Gmail call with."""

    async def execute(self, proposal: Proposal, access_token: str | None = None) -> ExecutionResult:
        if proposal.action == "save_draft" and access_token:
            payload = proposal.payload
            draft = await create_gmail_draft(
                access_token,
                to=str(payload.get("to") or ""),
                subject=str(payload.get("subject") or ""),
                body=str(payload.get("body") or ""),
                thread_id=str(payload.get("threadId") or "") or None,
            )
            return ExecutionResult(reference=f"gmail://drafts/{draft.get('id', '')}")
        return ExecutionResult(reference=f"mock://actions/{proposal.id}")
