"""Drives approved proposals to execution, one at a time, only while the
user who owns them is actually present.

This backend never stores a user's Google token — no cookies, no refresh
tokens, nothing persisted server-side (see server.js's "No cookies,
anywhere" and google_drive_store.py). That means a perpetual background
worker per user is not just unnecessary, it's impossible: there is no
credential to act with for a user who isn't mid-request right now. So
instead of a server-side loop, `tick` is a bounded unit of work — reclaim
anything stuck, retry anything failed under its budget, then execute at most
one approved proposal — meant to be called repeatedly by the client (see
InboxTab.tsx's pollTriage / DashboardPage.tsx's pollScan for the same
pattern) for as long as the Review page is open and there's something to do.
Approving a proposal itself stays instant either way — nothing here blocks
that response; ticking is what actually drains the queue afterward.
"""

from __future__ import annotations

from typing import Any

from . import proposal_drive_store as store
from .executor import ActionExecutor
from .models import ProposalStatus

# A tick's own claim -> execute -> mark_* has no awaited I/O gap in the
# middle for the mocked executor, so anything still EXECUTING this long
# after being claimed means the request that claimed it never got to
# finish — the tab closed, the request was cut off, whatever.
STALE_EXECUTING_SECONDS = 120
MAX_AUTO_RETRY_ATTEMPTS = 3
# How many just-finished proposals the "View Progress" modal shows —
# unbounded would mean listing every proposal this account has ever
# executed, which isn't "progress" for the current queue anymore.
RECENTLY_COMPLETED_LIMIT = 10


async def tick(access_token: str, executor: ActionExecutor) -> dict[str, Any]:
    """One bounded pass: recover, retry, execute at most one. Returns enough
    for the caller to know whether to keep polling, and everything the
    "View Progress" modal needs to show what's queued / executing /
    recently completed without a separate fetch."""
    reclaimed = await store.reclaim_stale_executing(access_token, STALE_EXECUTING_SECONDS)
    retried = await store.auto_retry_failed(access_token, MAX_AUTO_RETRY_ATTEMPTS)

    executing = await store.list_proposals(access_token, ProposalStatus.EXECUTING)
    approved = await store.list_proposals(access_token, ProposalStatus.APPROVED)
    if not executing and approved:
        # Oldest first — list_proposals itself sorts newest-first.
        next_up = approved[-1]
        claimed = await _execute_one(access_token, next_up.id, executor)
        if claimed:
            executing = [claimed]
            approved = approved[:-1]

    completed = await store.list_proposals(access_token, ProposalStatus.EXECUTED)
    return {
        "executing": _summarize(executing[0]) if executing else None,
        "queuedCount": len(approved),
        "queued": [_summarize(p) for p in reversed(approved)],  # oldest (next up) first
        "completed": [_summarize(p) for p in completed[:RECENTLY_COMPLETED_LIMIT]],  # already newest-first
        "recoveredCount": len(reclaimed),
        "retriedCount": len(retried),
    }


async def _execute_one(access_token: str, proposal_id: str, executor: ActionExecutor):
    """None means "nothing to do" — someone else (an overlapping tick, e.g.
    two browser tabs both open on /review) already claimed or otherwise
    changed this proposal between this tick's own list_proposals read and
    this claim; that's not a failure, just a lost race, so the next tick
    picks up whatever's actually still APPROVED instead of crashing."""
    try:
        proposal = await store.claim_execution(access_token, proposal_id)
    except (KeyError, ValueError):
        return None
    try:
        result = executor.execute(proposal)
    except Exception as error:  # noqa: BLE001 - any executor failure must still be recorded, not raised
        return await store.mark_failed(access_token, proposal_id, str(error))
    return await store.mark_executed(access_token, proposal_id, result.reference)


def _summarize(proposal) -> dict[str, Any]:
    return {
        "id": proposal.id,
        "title": proposal.title,
        "action": proposal.action,
        "status": proposal.status.value,
        "attempt": proposal.execution_attempts,
    }
