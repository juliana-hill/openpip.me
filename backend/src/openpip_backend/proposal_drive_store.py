"""Proposal storage, per-user in Drive — not a shared local database.

Replaces the earlier SQLite-backed ProposalStore. That design had no owner
column at all: every proposal from every user hitting this backend lived in
one shared local table. Fine for a single-user dev instance, wrong for
anything meant to be deployable for other people. Drive is already how every
other piece of user data in this app is stored (see google_drive_store.py,
inbox_triage.py's per-contact files, taskStorage.ts) — it's inherently
per-user (each read/write is scoped by the caller's own access token) and
survives regardless of which backend instance handles a request, so there's
nothing to get wrong about isolation.

Layout (all under the user's own visible "OpenPip" Drive folder, one file
per proposal, named "<id>.json" — mirrors OpenPip/contacts/<id>/profile.json
and OpenPip/tasks/schedules/<id>.json):

    OpenPip/review/<id>.json                    pending (not yet decided)
    OpenPip/review/rejected/<id>.json            rejected
    OpenPip/review/accepted/<id>.json            approved, not yet a
                                                  successfully finished
                                                  execution (approved,
                                                  executing, or failed —
                                                  status field within the
                                                  file tells you which)
    OpenPip/review/accepted/completed/<id>.json  executed successfully

Deciding, executing, and completing a proposal always means: read the file
from its current folder, update the JSON, write it to (possibly) a new
folder, delete the old copy. Drive gives no compare-and-swap the way a SQL
transaction would, so a claim here is best-effort, not airtight — acceptable
given the actual usage this protects: one signed-in user, acting through
their own browser tab(s), never a fleet of concurrent server workers. See
execution_pipeline.py for what actually calls claim_execution.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from .google_drive_docs import delete_json_file, list_json_files, read_json_file, write_json_file
from .models import Proposal, ProposalStatus, now

_REVIEW_FOLDER = "OpenPip/review"
_ACCEPTED_FOLDER = "OpenPip/review/accepted"
_COMPLETED_FOLDER = "OpenPip/review/accepted/completed"
_REJECTED_FOLDER = "OpenPip/review/rejected"

# Every status maps to exactly one folder except the two "still inside
# accepted/" substates (approved/executing/failed), which share a folder and
# are told apart by the status field within each file.
_FOLDER_BY_STATUS = {
    ProposalStatus.PENDING: _REVIEW_FOLDER,
    ProposalStatus.REJECTED: _REJECTED_FOLDER,
    ProposalStatus.APPROVED: _ACCEPTED_FOLDER,
    ProposalStatus.EXECUTING: _ACCEPTED_FOLDER,
    ProposalStatus.FAILED: _ACCEPTED_FOLDER,
    ProposalStatus.EXECUTED: _COMPLETED_FOLDER,
}
_ALL_FOLDERS = (_REVIEW_FOLDER, _ACCEPTED_FOLDER, _COMPLETED_FOLDER, _REJECTED_FOLDER)


def _filename(proposal_id: str) -> str:
    return f"{proposal_id}.json"


def _append_event(proposal: Proposal, event_type: str, detail: str | None) -> None:
    proposal.events.append({
        "id": str(uuid4()), "event_type": event_type, "detail": detail,
        "created_at": now().isoformat(),
    })


async def _write(access_token: str, folder: str, proposal: Proposal) -> None:
    await write_json_file(access_token, folder, _filename(proposal.id), proposal.model_dump(mode="json"))


async def _find(access_token: str, proposal_id: str, folders: tuple[str, ...] = _ALL_FOLDERS) -> tuple[Proposal, str] | None:
    """Proposals move between folders as they're decided/executed, so unlike
    a database lookup by primary key, finding one means checking every
    folder it could currently be in — done concurrently, not one at a time."""
    filename = _filename(proposal_id)
    results = await asyncio.gather(*(read_json_file(access_token, folder, filename) for folder in folders))
    for folder, data in zip(folders, results):
        if data is not None:
            return Proposal.model_validate(data), folder
    return None


async def get(access_token: str, proposal_id: str) -> Proposal | None:
    found = await _find(access_token, proposal_id)
    return found[0] if found else None


async def get_by_idempotency_key(access_token: str, key: str) -> Proposal | None:
    """Same folders, same reasoning as _find, just matched by a different
    field — needed so add() can refuse to create a duplicate regardless of
    which folder (i.e. which decision state) the original ended up in."""
    for folder in _ALL_FOLDERS:
        for data in (await list_json_files(access_token, folder)).values():
            if data.get("idempotency_key") == key:
                return Proposal.model_validate(data)
    return None


async def list_proposals(access_token: str, status: ProposalStatus | None = None) -> list[Proposal]:
    if status is not None:
        raw = (await list_json_files(access_token, _FOLDER_BY_STATUS[status])).values()
        proposals = [Proposal.model_validate(data) for data in raw]
        # accepted/ holds three substates in one folder.
        if status in (ProposalStatus.APPROVED, ProposalStatus.EXECUTING, ProposalStatus.FAILED):
            proposals = [p for p in proposals if p.status == status]
        return sorted(proposals, key=lambda p: p.created_at, reverse=True)
    all_folders = await asyncio.gather(*(list_json_files(access_token, folder) for folder in _ALL_FOLDERS))
    proposals = [Proposal.model_validate(data) for folder_files in all_folders for data in folder_files.values()]
    return sorted(proposals, key=lambda p: p.created_at, reverse=True)


async def list_decision_history(access_token: str, decision: str, limit: int = 10) -> list[Proposal]:
    """Past decisions for the Review page's History view. "accepted" means
    everything that was ever approved, regardless of what happened to it
    since — still approved, executing, failed, or successfully executed —
    since the decision itself (accept vs reject) is orthogonal to execution
    status. "rejected" is just the rejected folder. Sorted by decided_at
    (when the decision was made, not when the proposal was first created)
    and capped at `limit` — a recent-history view, not a full audit export."""
    if decision == "rejected":
        proposals = await list_proposals(access_token, ProposalStatus.REJECTED)
    elif decision == "accepted":
        folder_results = await asyncio.gather(
            list_json_files(access_token, _ACCEPTED_FOLDER),
            list_json_files(access_token, _COMPLETED_FOLDER),
        )
        proposals = [Proposal.model_validate(data) for files in folder_results for data in files.values()]
    else:
        raise ValueError("decision must be 'accepted' or 'rejected'")
    proposals.sort(key=lambda p: p.decided_at or p.created_at, reverse=True)
    return proposals[:limit]


async def add(access_token: str, proposal: Proposal) -> Proposal:
    """Refuses to create a second copy of the same idempotency_key,
    returning the existing one instead — same contract the old
    ProposalStore.add had, since proposal_scan.py depends on it to avoid
    re-proposing the same signal across separate scans."""
    if proposal.idempotency_key:
        existing = await get_by_idempotency_key(access_token, proposal.idempotency_key)
        if existing:
            return existing
    _append_event(proposal, "created", "Proposal created for review")
    await _write(access_token, _REVIEW_FOLDER, proposal)
    return proposal


async def decide(access_token: str, proposal_id: str, status: ProposalStatus, reason: str | None = None) -> Proposal:
    if status not in (ProposalStatus.APPROVED, ProposalStatus.REJECTED):
        raise ValueError("A decision must approve or reject a proposal")
    found = await _find(access_token, proposal_id, (_REVIEW_FOLDER,))
    if found is None:
        if await get(access_token, proposal_id) is not None:
            raise ValueError("Proposal is no longer pending")
        raise KeyError(proposal_id)
    proposal, _ = found
    proposal.status = status
    proposal.decided_at = now()
    _append_event(proposal, status.value, reason)
    await _write(access_token, _FOLDER_BY_STATUS[status], proposal)
    await delete_json_file(access_token, _REVIEW_FOLDER, _filename(proposal_id))
    return proposal


async def claim_execution(access_token: str, proposal_id: str) -> Proposal:
    found = await _find(access_token, proposal_id, (_ACCEPTED_FOLDER,))
    if found is None:
        if await get(access_token, proposal_id) is not None:
            raise ValueError("Only an approved proposal can execute")
        raise KeyError(proposal_id)
    proposal, _ = found
    if proposal.status != ProposalStatus.APPROVED:
        raise ValueError("Only an approved proposal can execute")
    proposal.status = ProposalStatus.EXECUTING
    proposal.execution_attempts += 1
    proposal.execution_claimed_at = now()
    _append_event(proposal, "execution_started", None)
    await _write(access_token, _ACCEPTED_FOLDER, proposal)
    return proposal


async def mark_executed(access_token: str, proposal_id: str, reference: str) -> Proposal:
    found = await _find(access_token, proposal_id, (_ACCEPTED_FOLDER,))
    if found is None:
        raise KeyError(proposal_id)
    proposal, _ = found
    if proposal.status != ProposalStatus.EXECUTING:
        raise ValueError("Only an executing proposal can record a result")
    proposal.status = ProposalStatus.EXECUTED
    proposal.executed_at = now()
    proposal.execution_claimed_at = None
    proposal.failure_reason = None
    _append_event(proposal, "executed", reference)
    await _write(access_token, _COMPLETED_FOLDER, proposal)
    await delete_json_file(access_token, _ACCEPTED_FOLDER, _filename(proposal_id))
    return proposal


async def mark_failed(access_token: str, proposal_id: str, reason: str) -> Proposal:
    found = await _find(access_token, proposal_id, (_ACCEPTED_FOLDER,))
    if found is None:
        raise KeyError(proposal_id)
    proposal, _ = found
    if proposal.status != ProposalStatus.EXECUTING:
        raise ValueError("Only an executing proposal can record a result")
    proposal.status = ProposalStatus.FAILED
    proposal.execution_claimed_at = None
    proposal.failure_reason = reason
    _append_event(proposal, "execution_failed", reason)
    await _write(access_token, _ACCEPTED_FOLDER, proposal)  # stays in accepted/ — eligible for retry
    return proposal


async def retry(access_token: str, proposal_id: str) -> Proposal:
    found = await _find(access_token, proposal_id, (_ACCEPTED_FOLDER,))
    if found is None:
        raise KeyError(proposal_id)
    proposal, _ = found
    if proposal.status != ProposalStatus.FAILED:
        raise ValueError("Only a failed proposal can be retried")
    proposal.status = ProposalStatus.APPROVED
    proposal.failure_reason = None
    _append_event(proposal, "retry_requested", None)
    await _write(access_token, _ACCEPTED_FOLDER, proposal)
    return proposal


async def reclaim_stale_executing(access_token: str, older_than_seconds: int) -> list[Proposal]:
    """A proposal still EXECUTING this long after being claimed almost
    certainly means whatever claimed it never got to finish — the user
    closed the tab, the request was interrupted, whatever. Reset to APPROVED
    so it's picked up again; execution_attempts already reflects the
    interrupted attempt, so one that keeps dying still hits the auto-retry
    cap eventually instead of being reclaimed forever."""
    cutoff = datetime.now(UTC) - timedelta(seconds=older_than_seconds)
    call_cutoff = datetime.now(UTC) - timedelta(seconds=max(older_than_seconds, 900))
    stuck = [
        p for p in await list_proposals(access_token, ProposalStatus.EXECUTING)
        if p.execution_claimed_at and p.execution_claimed_at < (
            call_cutoff if p.action == "call_task" else cutoff
        )
    ]
    reclaimed = []
    for proposal in stuck:
        proposal.status = ProposalStatus.APPROVED
        proposal.execution_claimed_at = None
        _append_event(proposal, "execution_recovered", "Reclaimed after appearing stuck")
        await _write(access_token, _ACCEPTED_FOLDER, proposal)
        reclaimed.append(proposal)
    return reclaimed


async def migrate_legacy_sqlite_proposals(access_token: str, legacy_store: Any) -> int:
    """One-time bootstrap for proposals created before this backend moved
    proposal storage to per-user Drive: they live in a shared local SQLite
    file with no owner at all (see ProposalStore). Copies each into the
    first authenticated caller's Drive — reasonable as a one-time move
    given that data was never really multi-tenant to begin with — and skips
    any id already present in Drive, so this is safe to call on every
    request rather than needing a separate migration step to remember to
    run once."""
    migrated = 0
    for proposal in legacy_store.list():
        if await get(access_token, proposal.id) is not None:
            continue
        await _write(access_token, _FOLDER_BY_STATUS[proposal.status], proposal)
        migrated += 1
    return migrated


async def auto_retry_failed(access_token: str, max_attempts: int) -> list[Proposal]:
    failed = await list_proposals(access_token, ProposalStatus.FAILED)
    retried = []
    for proposal in failed:
        if proposal.execution_attempts < max_attempts:
            retried.append(await retry(access_token, proposal.id))
    return retried
