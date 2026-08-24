"""execution_pipeline.tick — the client-polled unit of work that actually
drives approved proposals to execution. See its module docstring for why
this is polling rather than a server-side background loop."""

from __future__ import annotations

import asyncio

import httpx
import pytest

from openpip_backend import execution_pipeline, proposal_drive_store as pds
from openpip_backend.models import Proposal, ProposalStatus, SourceReference

from test_proposal_drive_store import _fake_drive, _proposal


class _FakeExecutor:
    async def execute(self, proposal: Proposal, access_token: str | None = None):
        from openpip_backend.executor import ExecutionResult
        return ExecutionResult(reference=f"mock://actions/{proposal.id}")


@pytest.fixture(autouse=True)
def _drive(monkeypatch):
    fake_send, files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)
    return files


def test_tick_with_nothing_approved_is_a_no_op() -> None:
    result = asyncio.run(execution_pipeline.tick("token", _FakeExecutor()))
    assert result == {
        "executing": None, "queuedCount": 0, "queued": [], "completed": [],
        "recoveredCount": 0, "retriedCount": 0,
    }


def test_tick_executes_the_oldest_approved_proposal() -> None:
    async def run():
        proposal = await pds.add("token", _proposal())
        await pds.decide("token", proposal.id, ProposalStatus.APPROVED)
        return await execution_pipeline.tick("token", _FakeExecutor())

    result = asyncio.run(run())
    assert result["executing"]["status"] == "executed"
    assert result["queuedCount"] == 0


def test_tick_lists_queued_oldest_first_and_completed_newest_first() -> None:
    async def run():
        for i in range(3):
            proposal = await pds.add("token", _proposal(
                title=f"Task {i}",
                idempotency_key=f"proposal_scan:task_followup:task:{i}",
                source=SourceReference(kind="task", id=f"task:{i}", title=f"Task {i}"),
            ))
            await pds.decide("token", proposal.id, ProposalStatus.APPROVED)
        first = await execution_pipeline.tick("token", _FakeExecutor())  # executes task 0
        second = await execution_pipeline.tick("token", _FakeExecutor())  # executes task 1
        return first, second

    first, second = asyncio.run(run())
    # First tick: task 0 claimed, tasks 1 and 2 still queued, oldest (1) first.
    assert first["executing"]["title"] == "Task 0"
    assert [q["title"] for q in first["queued"]] == ["Task 1", "Task 2"]
    # Second tick: task 1 claimed and (mocked executor) already finished
    # within this same tick, so completed already reflects both — newest first.
    assert second["executing"]["title"] == "Task 1"
    assert [q["title"] for q in second["queued"]] == ["Task 2"]
    assert [c["title"] for c in second["completed"]] == ["Task 1", "Task 0"]


def test_tick_only_claims_one_at_a_time() -> None:
    async def run():
        for i in range(3):
            proposal = await pds.add("token", _proposal(
                idempotency_key=f"proposal_scan:task_followup:task:{i}",
                source=SourceReference(kind="task", id=f"task:{i}", title=f"Task {i}"),
            ))
            await pds.decide("token", proposal.id, ProposalStatus.APPROVED)
        return await execution_pipeline.tick("token", _FakeExecutor())

    result = asyncio.run(run())
    # One executed this tick, two still waiting their turn.
    assert result["executing"]["status"] == "executed"
    assert result["queuedCount"] == 2


def test_tick_survives_a_lost_execution_claim_race() -> None:
    """Two overlapping ticks (e.g. two /review tabs, or the mount tick and
    the first interval tick landing close together) can both list the same
    APPROVED proposal before either claims it. The second one to actually
    call claim_execution must not crash the whole request — it just lost
    the race, there's nothing left for it to do this pass."""
    async def run():
        proposal = await pds.add("token", _proposal())
        await pds.decide("token", proposal.id, ProposalStatus.APPROVED)
        # Simulate the race directly: claim it out from under the tick.
        await pds.claim_execution("token", proposal.id)
        return await execution_pipeline._execute_one("token", proposal.id, _FakeExecutor())

    result = asyncio.run(run())
    assert result is None


def test_tick_surfaces_recovered_and_retried_counts() -> None:
    from datetime import UTC, datetime, timedelta

    async def run():
        proposal = await pds.add("token", _proposal())
        await pds.decide("token", proposal.id, ProposalStatus.APPROVED)
        claimed = await pds.claim_execution("token", proposal.id)
        claimed.execution_claimed_at = datetime.now(UTC) - timedelta(minutes=5)
        await pds._write("token", pds._ACCEPTED_FOLDER, claimed)
        return await execution_pipeline.tick("token", _FakeExecutor())

    result = asyncio.run(run())
    assert result["recoveredCount"] == 1
    # Reclaimed back to APPROVED, then this same tick executed it too.
    assert result["executing"]["status"] == "executed"
