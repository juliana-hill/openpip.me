"""The only boundary allowed to perform proposal side effects.

Real Google and CALL-E adapters will implement this interface later. The default
implementation is deliberately a mock, so local development cannot send, write,
or call an external service.
"""

from dataclasses import dataclass
from typing import Protocol

from .models import Proposal


@dataclass(frozen=True)
class ExecutionResult:
    reference: str


class ActionExecutor(Protocol):
    def execute(self, proposal: Proposal) -> ExecutionResult: ...


class MockActionExecutor:
    def execute(self, proposal: Proposal) -> ExecutionResult:
        return ExecutionResult(reference=f"mock://actions/{proposal.id}")
