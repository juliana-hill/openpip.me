import asyncio
from datetime import UTC, datetime, timedelta

from openpip_backend import proposal_scan
from openpip_backend.models import ProposalStatus
from openpip_backend.store import ProposalStore

SOURCE_REFS = [
    {"id": "task:abc", "kind": "task", "label": "Renew passport", "detail": "overdue"},
    {"id": "contact:people/c1", "kind": "contact", "label": "Alex Morgan", "detail": "stale"},
]


def test_parse_and_validate_proposals_keeps_only_real_sourced_proposals() -> None:
    raw = """Here are my proposals:
    {"proposals": [
      {"kind": "task_followup", "title": "Follow up on passport renewal", "rationale": "It is overdue", "sourceId": "task:abc"},
      {"kind": "made_up_kind", "title": "Should be dropped", "rationale": "bad kind", "sourceId": "task:abc"},
      {"kind": "contact_followup", "title": "No matching source", "rationale": "x", "sourceId": "task:does-not-exist"},
      {"kind": "contact_followup", "title": "", "rationale": "empty title dropped", "sourceId": "contact:people/c1"}
    ]}"""

    result = proposal_scan._parse_and_validate_proposals(raw, SOURCE_REFS)

    assert len(result) == 1
    assert result[0]["kind"] == "task_followup"
    assert result[0]["source"]["id"] == "task:abc"


def test_parse_and_validate_proposals_caps_at_max_and_handles_malformed_json() -> None:
    assert proposal_scan._parse_and_validate_proposals("not json at all", SOURCE_REFS) == []
    assert proposal_scan._parse_and_validate_proposals("{not valid json}", SOURCE_REFS) == []

    many = {"proposals": [
        {"kind": "task_followup", "title": f"t{i}", "rationale": "r", "sourceId": "task:abc"}
        for i in range(10)
    ]}
    import json
    result = proposal_scan._parse_and_validate_proposals(json.dumps(many), SOURCE_REFS)
    assert len(result) == proposal_scan._MAX_PROPOSALS_PER_SCAN


def test_open_task_signals_flags_overdue_due_today_and_asap(monkeypatch) -> None:
    today = datetime.now(UTC).date()
    tasks = [
        {"id": "t1", "title": "Overdue task", "dueDate": str(today - timedelta(days=2)), "priority": "MEDIUM", "completed": False},
        {"id": "t2", "title": "Due today task", "dueDate": str(today), "priority": "LOW", "completed": False},
        {"id": "t3", "title": "Future task", "dueDate": str(today + timedelta(days=10)), "priority": "MEDIUM", "completed": False},
        {"id": "t4", "title": "ASAP no date", "dueDate": None, "priority": "ASAP", "completed": False},
        {"id": "t5", "title": "Completed overdue", "dueDate": str(today - timedelta(days=5)), "priority": "HIGH", "completed": True},
    ]

    async def fake_fetch(_token: str):
        return tasks

    monkeypatch.setattr(proposal_scan, "fetch_google_tasks", fake_fetch)
    result = asyncio.run(proposal_scan._open_task_signals("token"))

    ids = {task["id"]: task["urgency"] for task in result}
    assert ids == {"t1": "overdue", "t2": "due_today", "t4": "asap"}


def test_contact_followup_signals_flags_only_stale_tracked_contacts(monkeypatch) -> None:
    now = datetime.now(UTC)
    stale_date = (now - timedelta(days=40)).isoformat()
    recent_date = (now - timedelta(days=2)).isoformat()

    async def fake_contacts(_token: str):
        return {
            "people/stale": {"name": "Stale Contact", "company": "Acme"},
            "people/recent": {"name": "Recent Contact", "company": "Beta"},
            "people/never": {"name": "Never Contacted", "company": "Gamma"},
        }

    async def fake_app_data(_token: str):
        return {"contacts": {"people/stale": {"tracked": True}, "people/recent": {"tracked": True}, "people/never": {"tracked": True}}}

    async def fake_profile(_token: str, resource_name: str, _fallback):
        return {
            "people/stale": {"status": "messaged", "lastInteractionDate": stale_date},
            "people/recent": {"status": "replied", "lastInteractionDate": recent_date},
            "people/never": {"status": "not_contacted"},
        }[resource_name]

    monkeypatch.setattr(proposal_scan, "fetch_google_contacts", fake_contacts)
    monkeypatch.setattr(proposal_scan, "read_drive_app_data", fake_app_data)
    monkeypatch.setattr(proposal_scan, "read_contact_profile", fake_profile)

    result = asyncio.run(proposal_scan._contact_followup_signals("token"))
    names = {contact["name"] for contact in result}
    assert names == {"Stale Contact", "Never Contacted"}


def test_inbox_pointer_signal_only_when_unreviewed_suggestions_exist(monkeypatch) -> None:
    async def fake_details_with_unreviewed(_token: str):
        return {"currentRun": {"id": "run-1", "suggestions": [{"messageId": "m1"}, {"messageId": "m2", "appliedAction": "reviewed"}]}}

    monkeypatch.setattr(proposal_scan, "get_saved_triage_details", fake_details_with_unreviewed)
    result = asyncio.run(proposal_scan._inbox_pointer_signal("token"))
    assert result == {"count": 1, "runId": "run-1"}

    async def fake_details_all_reviewed(_token: str):
        return {"currentRun": {"id": "run-1", "suggestions": [{"messageId": "m1", "appliedAction": "deleted"}]}}

    monkeypatch.setattr(proposal_scan, "get_saved_triage_details", fake_details_all_reviewed)
    assert asyncio.run(proposal_scan._inbox_pointer_signal("token")) is None

    async def fake_details_no_run(_token: str):
        return {}

    monkeypatch.setattr(proposal_scan, "get_saved_triage_details", fake_details_no_run)
    assert asyncio.run(proposal_scan._inbox_pointer_signal("token")) is None


def test_run_scan_creates_deduplicated_pending_proposals(monkeypatch, tmp_path) -> None:
    store = ProposalStore(str(tmp_path / "test.sqlite3"))

    async def fake_tasks(_token: str):
        return []

    async def fake_contacts_followup(_token: str):
        return []

    async def fake_calendar(_token: str):
        return []

    async def fake_historical(_token: str):
        return []

    async def fake_pointer(_token: str):
        return {"count": 2, "runId": "run-1"}

    async def fake_context_documents(_token: str, **_kwargs):
        return "some guidelines"

    class FakeAgentResult:
        def __init__(self, text: str):
            self.message = {"content": [{"text": text}]}

    class FakeAgent:
        def __call__(self, _prompt: str):
            return FakeAgentResult(
                '{"proposals": [{"kind": "inbox_pointer", "title": "Review inbox suggestions", '
                '"rationale": "2 suggestions awaiting review", "sourceId": "inbox_review"}]}'
            )

    monkeypatch.setattr(proposal_scan, "_open_task_signals", fake_tasks)
    monkeypatch.setattr(proposal_scan, "_contact_followup_signals", fake_contacts_followup)
    monkeypatch.setattr(proposal_scan, "_calendar_signals", fake_calendar)
    monkeypatch.setattr(proposal_scan, "_historical_email_signals", fake_historical)
    monkeypatch.setattr(proposal_scan, "_inbox_pointer_signal", fake_pointer)
    monkeypatch.setattr(proposal_scan, "load_context_documents", fake_context_documents)
    monkeypatch.setattr(proposal_scan, "build_executive_assistant", lambda _context_block="": FakeAgent())

    # queue_proposal_scan fires the scan as a background task — wait for it.
    async def wait_for_completion(job_id: str):
        for _ in range(50):
            current = proposal_scan.get_proposal_scan_progress("token", job_id)
            if current["status"] in ("completed", "failed"):
                return current
            await asyncio.sleep(0.01)
        raise AssertionError("scan job never completed")

    async def run_and_wait():
        job = await proposal_scan.queue_proposal_scan("token", store)
        return await wait_for_completion(job["id"])

    finished = asyncio.run(run_and_wait())
    assert finished["status"] == "completed"
    assert finished["created"] == 1

    pending = store.list(ProposalStatus.PENDING)
    assert len(pending) == 1
    assert pending[0].action == "inbox_pointer"
    assert pending[0].source.id == "inbox_review"

    # A second scan with the same inbox pointer signal must not create a duplicate.
    finished2 = asyncio.run(run_and_wait())
    assert finished2["created"] == 0
    assert len(store.list(ProposalStatus.PENDING)) == 1
