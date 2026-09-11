import asyncio
from datetime import UTC, datetime, timedelta

from openpip_backend import proposal_scan
from openpip_backend.models import ProposalStatus

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


def test_proposal_prompt_uses_durable_routine_memories_as_context() -> None:
    prompt = proposal_scan.build_proposal_scan_prompt(
        {
            "historicalInsights": [{
                "category": "routine",
                "subject": "Grocery shopping",
                "fact": "The user usually orders groceries weekly; last observed order was 2026-08-20.",
            }],
            "recentEmailSignals": [{"sourceId": "email:receipt-1", "subject": "Grocery order receipt"}],
        },
        [{"id": "email:receipt-1", "kind": "email", "label": "Grocery order receipt"}],
        [],
    )

    assert "historicalInsights is durable context" in prompt
    assert "grocery or purchase cadence" in prompt
    assert "Do not propose from a memory alone" in prompt


def test_parse_and_validate_proposals_accepts_the_new_kinds() -> None:
    raw = '{"proposals": [{"kind": "task_complete", "title": "x", "rationale": "y", "sourceId": "task:abc"}]}'

    result = proposal_scan._parse_and_validate_proposals(raw, SOURCE_REFS)

    assert result[0]["kind"] == "task_complete"


def test_parse_and_validate_proposals_requires_the_exact_explicit_phone_for_call_task() -> None:
    refs = [{
        "id": "calendar:event-1", "kind": "calendar_event", "label": "Hair appointment",
        "detail": "Friday 15:00", "phone": "+14155550101",
    }]
    raw = ('{"proposals": [{"kind": "call_task", "title": "Reschedule hair appointment", '
           '"rationale": "The salon is phone-only", "sourceId": "calendar:event-1", '
           '"recipientName": "Maya Hair Studio", "phone": "+14155550101", '
           '"goal": "Ask whether Friday at 3 PM can move to Saturday at 11 AM."}]}')

    result = proposal_scan._parse_and_validate_proposals(raw, refs)

    assert result[0]["call"]["phone"] == "+14155550101"
    assert result[0]["call"]["goal"].startswith("Ask whether")


def test_call_reschedule_carries_the_existing_event_update_only_when_grounded() -> None:
    refs = [{
        "id": "calendar:event-1", "kind": "calendar_event", "label": "Hair appointment",
        "detail": "Friday 15:00", "phone": "+14155550101", "calendarId": "primary", "eventId": "event-1",
    }]
    raw = ('{"proposals": [{"kind": "call_task", "title": "Reschedule hair appointment", '
           '"rationale": "The salon is phone-only", "sourceId": "calendar:event-1", '
           '"recipientName": "Maya Hair Studio", "phone": "+14155550101", '
           '"goal": "Ask whether Friday at 3 PM can move to Saturday at 11 AM.", '
           '"calendarUpdate": {"calendarId": "primary", "eventId": "event-1", '
           '"start": "2026-09-12T11:00:00-07:00", "end": "2026-09-12T12:00:00-07:00"}}]}')

    result = proposal_scan._parse_and_validate_proposals(raw, refs)

    assert result[0]["call"]["calendarUpdate"]["action"] == "update_calendar_event"
    assert result[0]["call"]["calendarUpdate"]["eventId"] == "event-1"


def test_parse_and_validate_proposals_drops_a_guessed_call_phone() -> None:
    refs = [{"id": "task:t1", "kind": "task", "label": "Call salon", "detail": "overdue"}]
    raw = ('{"proposals": [{"kind": "call_task", "title": "Call salon", '
           '"rationale": "Needs a call", "sourceId": "task:t1", '
           '"recipientName": "Salon", "phone": "+14155550101", '
           '"goal": "Confirm the appointment"}]}')

    assert proposal_scan._parse_and_validate_proposals(raw, refs) == []


def test_static_context_includes_situation_specific_channel_memories() -> None:
    facts, _ = proposal_scan._build_static_context(
        [], [], [], None,
        channel_memories=[{
            "subject": "Maya Hair Studio",
            "subjectKey": "maya hair studio",
            "preferences": [{
                "context": "reschedule appointment",
                "channel": "phone",
                "reason": "They do not accept email.",
            }],
        }],
    )

    assert facts["knownChannelPreferences"][0]["preferences"][0]["channel"] == "phone"


def test_correspondent_index_surfaces_untracked_frequent_correspondents() -> None:
    """Dr. Rana emailed twice but was never added as a tracked contact — this
    is the exact real-world miss that motivated the signal: the scan should
    propose tracking her, but not a one-off sender who only wrote once. The
    whole message list drives the count, but a batch can only cite a
    sourceId actually present in that same batch."""
    historical_messages = [
        {"id": "gmail_1", "subject": "Re: consult", "from": "Dr. Rana", "fromEmail": "rana@clinic.example", "date": "2026-05-01", "snippet": "", "gmailUrl": "https://mail.google.com/mail/u/0/#all/1"},
        {"id": "gmail_2", "subject": "Follow-up", "from": "Dr. Rana", "fromEmail": "rana@clinic.example", "date": "2026-06-01", "snippet": "", "gmailUrl": "https://mail.google.com/mail/u/0/#all/2"},
        {"id": "gmail_3", "subject": "Hi", "from": "One-timer", "fromEmail": "once@example.com", "date": "2026-06-01", "snippet": "", "gmailUrl": ""},
    ]
    google_contacts = {
        "people/c1": {"resourceName": "people/c1", "name": "Dr. Rana", "email": "rana@clinic.example"},
        "people/c2": {"resourceName": "people/c2", "name": "One-timer", "email": "once@example.com"},
    }
    index = proposal_scan._CorrespondentIndex(historical_messages, google_contacts, {})

    facts, source_references = proposal_scan._build_email_batch_context(historical_messages, index)

    names = {c["name"] for c in facts["untrackedFrequentContacts"]}
    assert names == {"Dr. Rana"}
    candidate = facts["untrackedFrequentContacts"][0]
    assert candidate["messageCount"] == 2
    # Always a real, already-listed source id — never an invented one the
    # model could cite but _parse_and_validate_proposals would reject.
    assert candidate["sourceId"] in {ref["id"] for ref in source_references}


def test_correspondent_index_excludes_already_tracked_contacts() -> None:
    historical_messages = [
        {"id": "gmail_1", "subject": "a", "from": "X", "fromEmail": "x@example.com", "date": "d", "snippet": "", "gmailUrl": ""},
        {"id": "gmail_2", "subject": "b", "from": "X", "fromEmail": "x@example.com", "date": "d", "snippet": "", "gmailUrl": ""},
    ]
    google_contacts = {"people/c1": {"resourceName": "people/c1", "name": "X", "email": "x@example.com"}}
    index = proposal_scan._CorrespondentIndex(historical_messages, google_contacts, {"people/c1": {}})

    facts, _ = proposal_scan._build_email_batch_context(historical_messages, index)

    assert facts["untrackedFrequentContacts"] == []


def test_email_batches_only_cite_sources_present_in_their_own_batch() -> None:
    """A frequent correspondent whose two messages land in different batches
    must still be proposable from either batch — each batch's own copy of
    the fact should cite that batch's own message, never the other batch's."""
    historical_messages = [
        {"id": "gmail_1", "subject": "a", "from": "Dr. Rana", "fromEmail": "rana@clinic.example", "date": "d1", "snippet": "", "gmailUrl": ""},
        {"id": "gmail_2", "subject": "b", "from": "Dr. Rana", "fromEmail": "rana@clinic.example", "date": "d2", "snippet": "", "gmailUrl": ""},
    ]
    google_contacts = {"people/c1": {"resourceName": "people/c1", "name": "Dr. Rana", "email": "rana@clinic.example"}}
    index = proposal_scan._CorrespondentIndex(historical_messages, google_contacts, {})

    batch1_facts, batch1_refs = proposal_scan._build_email_batch_context([historical_messages[0]], index)
    batch2_facts, batch2_refs = proposal_scan._build_email_batch_context([historical_messages[1]], index)

    assert batch1_facts["untrackedFrequentContacts"][0]["sourceId"] == "email:gmail_1"
    assert batch1_facts["untrackedFrequentContacts"][0]["messageCount"] == 2  # counted globally
    assert batch1_facts["untrackedFrequentContacts"][0]["sourceId"] in {r["id"] for r in batch1_refs}
    assert batch2_facts["untrackedFrequentContacts"][0]["sourceId"] == "email:gmail_2"
    assert batch2_facts["untrackedFrequentContacts"][0]["sourceId"] in {r["id"] for r in batch2_refs}


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


def test_open_task_signals_flags_overdue_due_today_asap_and_upcoming(monkeypatch) -> None:
    """A task due further out is still surfaced (tagged "upcoming", not
    chased) — the scan can't match a sale email against a future-pinned
    "check out sale" task (see GOALS_PROACTIVE_REVIEW_SAMPLE) unless that
    task is actually in context. Overdue/due-today/ASAP still sort first."""
    today = datetime.now(UTC).date()
    tasks = [
        {"id": "t1", "title": "Overdue task", "dueDate": str(today - timedelta(days=2)), "priority": "MEDIUM", "completed": False},
        {"id": "t2", "title": "Due today task", "dueDate": str(today), "priority": "LOW", "completed": False},
        {"id": "t3", "title": "Future task", "dueDate": str(today + timedelta(days=10)), "priority": "MEDIUM", "completed": False},
        {"id": "t4", "title": "ASAP no date", "dueDate": None, "priority": "ASAP", "completed": False},
        {"id": "t5", "title": "Completed overdue", "dueDate": str(today - timedelta(days=5)), "priority": "HIGH", "completed": True},
        {"id": "t6", "title": "Too far out", "dueDate": str(today + timedelta(days=proposal_scan._TASK_LOOKAHEAD_DAYS + 1)), "priority": "MEDIUM", "completed": False},
    ]

    async def fake_fetch(_token: str):
        return tasks

    monkeypatch.setattr(proposal_scan, "fetch_google_tasks", fake_fetch)
    result = asyncio.run(proposal_scan._open_task_signals("token"))

    ids = {task["id"]: task["urgency"] for task in result}
    assert ids == {"t1": "overdue", "t2": "due_today", "t3": "upcoming", "t4": "asap"}
    # Overdue/due-today/ASAP sort ahead of upcoming, regardless of Google's
    # own list order — a long list of far-future tasks must never crowd out
    # what actually needs attention now.
    assert [task["id"] for task in result] == ["t1", "t2", "t4", "t3"]


def test_calendar_signals_only_look_forward(monkeypatch) -> None:
    """Calendar signals exist to catch unfinished tasks and propose
    scheduling something in — or reorganizing what's on the calendar — for
    the user's future, never to use a past event as after-the-fact
    "evidence" a task is already done. See _calendar_signals' docstring."""
    captured: dict[str, object] = {}

    async def fake_fetch(_token: str, *, from_date, days):
        captured.update(from_date=from_date, days=days)
        return []

    monkeypatch.setattr(proposal_scan, "fetch_google_calendars", fake_fetch)
    asyncio.run(proposal_scan._calendar_signals("token"))

    assert captured["from_date"] == datetime.now(UTC).date().isoformat()
    assert captured["days"] == proposal_scan._CALENDAR_LOOKAHEAD_DAYS == 180


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
    # In-memory fake of proposal_drive_store's async interface — _run_scan
    # is Drive-backed now (see proposal_drive_store.py), so a real
    # ProposalStore/SQLite instance is no longer what it talks to.
    saved: dict[str, object] = {}

    async def fake_add(_token: str, proposal):
        if proposal.idempotency_key:
            for existing in saved.values():
                if existing.idempotency_key == proposal.idempotency_key:
                    return existing
        saved[proposal.id] = proposal
        return proposal

    async def fake_list_proposals(_token: str, status=None):
        return [p for p in saved.values() if status is None or p.status == status]

    monkeypatch.setattr(proposal_scan.proposal_drive_store, "add", fake_add)
    monkeypatch.setattr(proposal_scan.proposal_drive_store, "list_proposals", fake_list_proposals)

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

    async def fake_channel_memories(_token: str):
        return []

    async def fake_historical_insights(_token: str):
        return []

    async def fake_context_documents(_token: str, **_kwargs):
        return "some guidelines"

    async def fake_agent_name(_token: str):
        return "TestBot"

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
    monkeypatch.setattr(proposal_scan, "list_channel_memories", fake_channel_memories)
    monkeypatch.setattr(proposal_scan, "list_insights", fake_historical_insights)
    monkeypatch.setattr(proposal_scan, "load_context_documents", fake_context_documents)
    monkeypatch.setattr(proposal_scan, "_current_agent_name", fake_agent_name)
    monkeypatch.setattr(
        proposal_scan,
        "build_executive_assistant",
        lambda _context_block="", agent_name="OpenPip", **_kwargs: FakeAgent(),
    )

    # queue_proposal_scan fires the scan as a background task — wait for it.
    async def wait_for_completion(job_id: str):
        for _ in range(50):
            current = proposal_scan.get_proposal_scan_progress("token", job_id)
            if current["status"] in ("completed", "failed"):
                return current
            await asyncio.sleep(0.01)
        raise AssertionError("scan job never completed")

    async def run_and_wait():
        job = await proposal_scan.queue_proposal_scan("token")
        return await wait_for_completion(job["id"])

    finished = asyncio.run(run_and_wait())
    assert finished["status"] == "completed"
    assert finished["created"] == 1

    pending = [p for p in saved.values() if p.status == ProposalStatus.PENDING]
    assert len(pending) == 1
    assert pending[0].action == "inbox_pointer"
    assert pending[0].source.id == "inbox_review"

    # A second scan with the same inbox pointer signal must not create a duplicate.
    finished2 = asyncio.run(run_and_wait())
    assert finished2["created"] == 0
    assert len([p for p in saved.values() if p.status == ProposalStatus.PENDING]) == 1
