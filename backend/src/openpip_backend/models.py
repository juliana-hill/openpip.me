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
    EXECUTING = "executing"
    EXECUTED = "executed"
    FAILED = "failed"


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
    executed_at: datetime | None = None
    failure_reason: str | None = None
    idempotency_key: str | None = None


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


class AuditEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    proposal_id: str
    event_type: str
    detail: str | None = None
    created_at: datetime = Field(default_factory=now)


class UserContext(BaseModel):
    """User-authored context that can steer recommendations, never permissions."""

    content: str = Field(default="", max_length=12_000)
    updated_at: datetime = Field(default_factory=now)


class UserPreferences(BaseModel):
    """User-facing identity and appearance settings; no system prompts or tools."""

    agent_name: str = Field(default="OpenPip", min_length=1, max_length=40)
    agent_icon: str | None = Field(default=None, max_length=400_000)
    theme: str = Field(default="system", pattern="^(light|dark|system)$")
    accent: str = Field(default="coral", pattern="^(coral|blue|green|red|lilac)$")
    updated_at: datetime = Field(default_factory=now)


class Contact(BaseModel):
    id: str
    name: str
    email: str
    last_interaction: str
    interaction_count: int = 0
    relationship_note: str = ""
