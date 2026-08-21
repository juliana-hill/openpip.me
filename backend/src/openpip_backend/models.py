from datetime import datetime, timezone
from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def now() -> datetime:
    return datetime.now(timezone.utc)


class ProposalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTED = "executed"


class SourceReference(BaseModel):
    kind: str
    id: str
    title: str
    url: str | None = None


class Proposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    action: str
    title: str
    rationale: str
    payload: dict[str, Any] = Field(default_factory=dict)
    source: SourceReference
    status: ProposalStatus = ProposalStatus.PENDING
    created_at: datetime = Field(default_factory=now)
    decided_at: datetime | None = None


class BriefingRequest(BaseModel):
    tasks: list[dict[str, Any]] = Field(default_factory=list)
    events: list[dict[str, Any]] = Field(default_factory=list)
    messages: list[dict[str, Any]] = Field(default_factory=list)


class BriefingResponse(BaseModel):
    briefing: str
    generated_by: str
    proposals_created: int


class ProposalDecision(BaseModel):
    reason: str | None = None
