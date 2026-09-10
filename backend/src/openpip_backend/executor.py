"""The only boundary allowed to perform proposal side effects.

CALL-E is intentionally invoked here, after the proposal has been approved.
Proposal scans and agent tools never call it directly.
"""

from dataclasses import dataclass
from typing import Protocol

from .calle import execute_call
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
    """Execute only explicitly implemented, already-approved actions.

    Gmail drafts are private and reversible. CALL-E calls are real external
    side effects and therefore run only for an approved ``call_task`` with an
    authenticated session and configured CALL-E API key. Everything else stays
    mocked until its adapter is implemented.
    """

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
        if proposal.action == "call_task" and access_token:
            result = await execute_call(
                recipient_name=str(proposal.payload.get("recipientName") or ""),
                phone=str(proposal.payload.get("phone") or ""),
                goal=str(proposal.payload.get("goal") or ""),
                proposal_id=proposal.id,
                region=str(proposal.payload.get("region") or "") or None,
                locale=str(proposal.payload.get("locale") or "") or None,
            )
            call_id = str(result.get("id") or "")
            status = str(result.get("status") or "unknown")
            return ExecutionResult(reference=f"calle://calls/{call_id}?status={status}")
        return ExecutionResult(reference=f"mock://actions/{proposal.id}")
