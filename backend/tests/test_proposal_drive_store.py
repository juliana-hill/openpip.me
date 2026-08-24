"""proposal_drive_store.py replaces the old SQLite ProposalStore for real
usage — it has no owner column at all, so every proposal from every user
hitting this backend lived in one shared local table. This is per-user Drive
storage instead (see the module's own docstring for the folder layout).

Fakes Drive at the httpx transport level (same pattern as
test_google_drive_docs.py / test_google_drive_store.py) rather than mocking
the store's own functions, so these tests exercise the real folder-routing
logic (pending -> accepted/rejected -> accepted/completed).
"""

from __future__ import annotations

import asyncio
import json
import re
from datetime import UTC, datetime, timedelta

import httpx

from openpip_backend import proposal_drive_store as pds
from openpip_backend.models import Proposal, ProposalStatus, SourceReference
from openpip_backend.store import ProposalStore


def _fake_drive():
    """folders: (parent_id, name) -> id. files: (parent_id, name) -> {id, content}."""
    folders: dict[tuple[str, str], str] = {}
    files: dict[tuple[str, str], dict[str, str]] = {}
    next_id = [0]

    def new_id(prefix: str) -> str:
        next_id[0] += 1
        return f"{prefix}-{next_id[0]}"

    async def fake_send(self, request, **kwargs):
        method, url = request.method, str(request.url)
        parsed = httpx.URL(url)
        query = dict(httpx.QueryParams(parsed.query))
        body = request.content.decode("utf-8", "ignore") if request.content else ""

        if method == "GET" and parsed.path == "/drive/v3/files" and "q" in query:
            q = query["q"]
            name_match = re.search(r"name = '((?:[^'\\]|\\.)*)'", q)
            parent_match = re.search(r"'([^']*)' in parents", q)
            parent = parent_match.group(1) if parent_match else "root"
            if "mimeType = " in q and name_match:
                fid = folders.get((parent, name_match.group(1)))
                return httpx.Response(200, json={"files": [{"id": fid}]} if fid else {"files": []}, request=request)
            if name_match:
                f = files.get((parent, name_match.group(1)))
                return httpx.Response(200, json={"files": [{"id": f["id"]}]} if f else {"files": []}, request=request)
            # list_json_files: all "*.json" files under this parent.
            matches = [{"id": f["id"], "name": name} for (p, name), f in files.items() if p == parent and name.endswith(".json")]
            return httpx.Response(200, json={"files": matches}, request=request)

        if method == "POST" and parsed.path == "/drive/v3/files":
            payload = json.loads(body)
            fid = new_id("folder")
            folders[(payload["parents"][0], payload["name"])] = fid
            return httpx.Response(200, json={"id": fid}, request=request)

        if method == "POST" and parsed.path == "/upload/drive/v3/files":
            meta_match = re.search(r"Content-Type: application/json.*?\r\n\r\n(\{.*?\})\r\n--", body, re.S)
            meta = json.loads(meta_match.group(1))
            content_match = re.search(r"Content-Type: [\w/]+\r\n\r\n(.*?)\r\n--[^-]", body, re.S)
            content = content_match.group(1) if content_match else ""
            fid = new_id("file")
            files[(meta["parents"][0], meta["name"])] = {"id": fid, "content": content}
            return httpx.Response(200, json={"id": fid}, request=request)

        if method == "PATCH" and parsed.path.startswith("/upload/drive/v3/files/"):
            fid = parsed.path.rsplit("/", 1)[-1]
            for f in files.values():
                if f["id"] == fid:
                    f["content"] = body
                    return httpx.Response(200, json={"id": fid}, request=request)
            return httpx.Response(404, json={"error": "not found"}, request=request)

        if method == "GET" and parsed.path.startswith("/drive/v3/files/") and query.get("alt") == "media":
            fid = parsed.path.rsplit("/", 1)[-1]
            for f in files.values():
                if f["id"] == fid:
                    return httpx.Response(200, text=f["content"], request=request)
            return httpx.Response(404, json={"error": "not found"}, request=request)

        if method == "DELETE" and parsed.path.startswith("/drive/v3/files/"):
            fid = parsed.path.rsplit("/", 1)[-1]
            for key, f in list(files.items()):
                if f["id"] == fid:
                    del files[key]
                    break
            return httpx.Response(204, request=request)

        return httpx.Response(404, json={"error": f"unhandled {method} {parsed.path} q={query}"}, request=request)

    return fake_send, files


def _proposal(**overrides) -> Proposal:
    defaults = dict(
        action="task_followup", title="Renew passport", rationale="It is overdue",
        source=SourceReference(kind="task", id="task:abc", title="Renew passport"),
        idempotency_key="proposal_scan:task_followup:task:abc",
    )
    return Proposal(**{**defaults, **overrides})


def test_full_lifecycle_moves_between_folders(monkeypatch) -> None:
    fake_send, files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    async def run():
        proposal = await pds.add("token", _proposal())
        assert proposal.status == ProposalStatus.PENDING
        assert (await pds.list_proposals("token", ProposalStatus.PENDING))[0].id == proposal.id

        decided = await pds.decide("token", proposal.id, ProposalStatus.APPROVED, "looks good")
        assert decided.status == ProposalStatus.APPROVED
        assert await pds.list_proposals("token", ProposalStatus.PENDING) == []
        assert (await pds.list_proposals("token", ProposalStatus.APPROVED))[0].id == proposal.id

        claimed = await pds.claim_execution("token", proposal.id)
        assert claimed.status == ProposalStatus.EXECUTING
        assert claimed.execution_attempts == 1

        executed = await pds.mark_executed("token", proposal.id, "mock://actions/1")
        assert executed.status == ProposalStatus.EXECUTED
        assert await pds.list_proposals("token", ProposalStatus.APPROVED) == []
        assert (await pds.list_proposals("token", ProposalStatus.EXECUTED))[0].id == proposal.id
        assert [e["event_type"] for e in executed.events] == ["created", "approved", "execution_started", "executed"]

    asyncio.run(run())
    # Ends up in exactly one file, at the completed path — never duplicated
    # across the folders it passed through on the way.
    assert len(files) == 1
    assert list(files.keys())[0][0] != ""  # sanity: has a real parent id


def test_idempotency_key_blocks_a_duplicate_proposal(monkeypatch) -> None:
    fake_send, _files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    async def run():
        first = await pds.add("token", _proposal())
        second = await pds.add("token", _proposal(title="Renew passport (again)"))
        return first, second

    first, second = asyncio.run(run())
    assert first.id == second.id
    assert second.title == "Renew passport"  # the original, not the would-be duplicate


def test_only_an_approved_proposal_can_be_claimed(monkeypatch) -> None:
    fake_send, _files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    async def run():
        proposal = await pds.add("token", _proposal())
        try:
            await pds.claim_execution("token", proposal.id)
            return "did not raise"
        except ValueError as error:
            return str(error)

    assert asyncio.run(run()) == "Only an approved proposal can execute"


def test_failed_execution_stays_in_accepted_for_retry(monkeypatch) -> None:
    fake_send, _files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    async def run():
        proposal = await pds.add("token", _proposal())
        await pds.decide("token", proposal.id, ProposalStatus.APPROVED)
        await pds.claim_execution("token", proposal.id)
        failed = await pds.mark_failed("token", proposal.id, "provider unavailable")
        assert failed.status == ProposalStatus.FAILED
        assert failed.failure_reason == "provider unavailable"
        # Still in accepted/, not moved to completed/ — mark_failed is a
        # dead end otherwise, since only APPROVED can be claimed again.
        assert (await pds.list_proposals("token", ProposalStatus.FAILED))[0].id == proposal.id

        retried = await pds.retry("token", proposal.id)
        assert retried.status == ProposalStatus.APPROVED
        assert retried.failure_reason is None

    asyncio.run(run())


def test_reclaim_stale_executing_resets_to_approved(monkeypatch) -> None:
    fake_send, _files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    async def run():
        proposal = await pds.add("token", _proposal())
        await pds.decide("token", proposal.id, ProposalStatus.APPROVED)
        claimed = await pds.claim_execution("token", proposal.id)
        # Simulate a claim from 5 minutes ago — the process that made it
        # never got to call mark_executed/mark_failed.
        claimed.execution_claimed_at = datetime.now(UTC) - timedelta(minutes=5)
        await pds._write("token", pds._ACCEPTED_FOLDER, claimed)

        reclaimed = await pds.reclaim_stale_executing("token", older_than_seconds=120)
        assert len(reclaimed) == 1
        assert reclaimed[0].status == ProposalStatus.APPROVED
        assert reclaimed[0].execution_claimed_at is None
        # A fresh claim right now must NOT be reclaimed.
        fresh = await pds.add("token", _proposal(idempotency_key="proposal_scan:task_followup:task:def", source=SourceReference(kind="task", id="task:def", title="Other")))
        await pds.decide("token", fresh.id, ProposalStatus.APPROVED)
        await pds.claim_execution("token", fresh.id)
        assert await pds.reclaim_stale_executing("token", older_than_seconds=120) == []

    asyncio.run(run())


def test_auto_retry_failed_respects_the_attempt_cap(monkeypatch) -> None:
    fake_send, _files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    async def run():
        proposal = await pds.add("token", _proposal())
        await pds.decide("token", proposal.id, ProposalStatus.APPROVED)
        for _ in range(3):
            await pds.claim_execution("token", proposal.id)
            await pds.mark_failed("token", proposal.id, "still broken")
            retried = await pds.auto_retry_failed("token", max_attempts=3)
            if retried:
                assert retried[0].status == ProposalStatus.APPROVED

        # 3 attempts already made — a 4th auto-retry must not happen,
        # leaving it FAILED for a human to look at instead of retrying forever.
        still_failed = await pds.list_proposals("token", ProposalStatus.FAILED)
        assert len(still_failed) == 1
        assert still_failed[0].execution_attempts == 3
        assert await pds.auto_retry_failed("token", max_attempts=3) == []

    asyncio.run(run())


def test_migrate_legacy_sqlite_proposals_is_idempotent(monkeypatch, tmp_path) -> None:
    fake_send, _files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)
    legacy = ProposalStore(str(tmp_path / "legacy.sqlite3"))
    legacy.add(_proposal(idempotency_key=None))

    async def run():
        first = await pds.migrate_legacy_sqlite_proposals("token", legacy)
        second = await pds.migrate_legacy_sqlite_proposals("token", legacy)
        return first, second

    first_count, second_count = asyncio.run(run())
    assert first_count == 1
    assert second_count == 0  # already migrated — running it again is a no-op
