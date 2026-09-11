import asyncio
import json
import re
from collections import Counter

import httpx

from openpip_backend import inbox_triage
from openpip_backend.models import ProposalStatus, SourceReference


def test_contact_storage_uses_visible_per_contact_paths() -> None:
    assert inbox_triage.contact_folder("people/c123") == "OpenPip/contacts/c123"
    assert inbox_triage.contact_interactions_folder("people/c123") == "OpenPip/contacts/c123/interactions"


def test_historical_label_requires_a_consistent_sender_pattern() -> None:
    labels = {"Label_Receipts": "Receipts", "Label_Other": "Other"}
    assert inbox_triage._historical_label(3, Counter({"Label_Receipts": 2}), labels) == ("Label_Receipts", "Receipts")
    assert inbox_triage._historical_label(3, Counter({"Label_Receipts": 1}), labels) is None


def test_no_reply_senders_do_not_get_drafts() -> None:
    assert inbox_triage._is_no_reply_sender("no-reply@example.com")
    assert inbox_triage._is_no_reply_sender("mailer-daemon@example.com")
    assert not inbox_triage._is_no_reply_sender("person@example.com")


def test_parse_classification_accepts_a_valid_disposition() -> None:
    raw = json.dumps({"disposition": "delete", "reason": "Routine promo, like the rest of the inbox."})

    assert inbox_triage._parse_classification(raw) == {
        "disposition": "delete", "reason": "Routine promo, like the rest of the inbox.",
    }


def test_parse_classification_rejects_unknown_dispositions_and_bad_text() -> None:
    assert inbox_triage._parse_classification(json.dumps({"disposition": "archive", "reason": "..."})) is None
    assert inbox_triage._parse_classification("The model said something unrelated.") is None
    assert inbox_triage._parse_classification("{not valid json") is None
    assert inbox_triage._parse_classification(json.dumps(["not", "a", "dict"])) is None


def test_build_classification_prompt_includes_body_category_and_peer_context() -> None:
    prompt = inbox_triage._build_classification_prompt(
        {
            "id": "gmail_plated",
            "from": "PLATED UP",
            "subject": "Warm grains, roasted veg, hearty protein.",
            "body": "Warm grains, roasted veg, hearty protein. Order again today.",
            "labelIds": ["UNREAD", "CATEGORY_PROMOTIONS"],
        },
        peers=[{"from": "A Friend", "subject": "Photos from the weekend", "fromEmail": "friend@example.com"}],
    )

    assert "gmail_plated" in prompt
    assert "Order again today" in prompt
    assert "CATEGORY_PROMOTIONS" in prompt
    assert "Photos from the weekend" in prompt
    # The prompt must ask for judgment against the rest of the inbox, not a
    # fixed keyword rule — this is the whole point of the rewrite.
    assert "never a rule by itself" in prompt.casefold()
    assert "durable historical insights" in prompt.casefold()
    assert "purchase cadence" in prompt.casefold()


def test_classify_message_makes_exactly_one_call_for_one_message() -> None:
    calls: list[str] = []

    class _CountingAgent:
        def __call__(self, prompt: str):
            calls.append(prompt)
            return _FakeAgentResult(json.dumps({"disposition": "task", "reason": "ok"}))

    result = asyncio.run(inbox_triage._classify_message(_CountingAgent(), {"id": "gmail_1", "subject": "Approve this"}, peers=[]))

    assert len(calls) == 1
    assert result == {"disposition": "task", "reason": "ok"}


def test_run_job_routes_each_disposition_through_the_full_pipeline(monkeypatch) -> None:
    """End-to-end replacement for the old regex-classification tests: an
    agent decides delete/task/reply/none (never a fixed keyword list), the
    deterministic historical-label check can still turn a delete into a
    filing suggestion, and a reply only gets drafted when there's enough
    sent-reply history to draft confidently in the user's own voice."""
    messages = [
        {"id": "gmail_promo", "fromEmail": "promo@example.com", "from": "Promo Co",
         "subject": "Big sale this week", "snippet": "Everything must go.", "date": "2026-08-20T10:00:00Z",
         "threadId": "t1", "labelIds": ["UNREAD", "CATEGORY_PROMOTIONS"]},
        {"id": "gmail_receipts", "fromEmail": "receipts@example.com", "from": "Receipts Co",
         "subject": "Your receipt", "snippet": "Thanks for your purchase.", "date": "2026-08-20T10:05:00Z",
         "threadId": "t2", "labelIds": ["UNREAD"]},
        {"id": "gmail_task", "fromEmail": "vendor@example.com", "from": "Vendor",
         "subject": "Please approve the quote", "snippet": "Can you approve by Friday?", "date": "2026-08-20T10:10:00Z",
         "threadId": "t3", "labelIds": ["UNREAD"]},
        {"id": "gmail_reply_ok", "fromEmail": "client@example.com", "from": "Client",
         "subject": "Question about the invoice", "snippet": "Could you clarify the total?", "date": "2026-08-20T10:15:00Z",
         "threadId": "t4", "labelIds": ["UNREAD"]},
        {"id": "gmail_reply_notone", "fromEmail": "newcontact@example.com", "from": "New Contact",
         "subject": "Quick question", "snippet": "Do you have a minute to chat?", "date": "2026-08-20T10:20:00Z",
         "threadId": "t5", "labelIds": ["UNREAD"]},
        {"id": "gmail_none", "fromEmail": "newsletter@example.com", "from": "Newsletter",
         "subject": "This week in review", "snippet": "Here's what happened.", "date": "2026-08-20T10:25:00Z",
         "threadId": "t6", "labelIds": ["UNREAD"]},
    ]
    messages_by_raw_id = {m["id"].removeprefix("gmail_"): m for m in messages}
    dispositions_by_id = {
        "gmail_promo": {"disposition": "delete", "reason": "Routine promo, like the rest of this batch."},
        "gmail_receipts": {"disposition": "delete", "reason": "Routine receipt."},
        "gmail_task": {"disposition": "task", "reason": "Needs approval by Friday."},
        "gmail_reply_ok": {"disposition": "reply", "reason": "Asks a direct question."},
        "gmail_reply_notone": {"disposition": "reply", "reason": "Asks a direct question."},
        "gmail_none": {"disposition": "none", "reason": "Informational only."},
    }
    added_proposals: list[object] = []
    written: dict[str, object] = {}

    class _FakeTriageAgent:
        """One call per unread email, not batched — the triage progress bar
        advances per message as each is actually classified, so a single
        batched call would defeat the point of the progress bar."""

        def __init__(self) -> None:
            self.calls: list[str] = []

        def __call__(self, prompt: str):
            self.calls.append(prompt)
            if "Draft a real, substantive reply" in prompt:
                return _FakeAgentResult("Hi Client,\n\nThe total is $42.\n\nBest,")
            match = re.search(r'"messageId": "(gmail_\w+)"', prompt)
            message_id = match.group(1) if match else ""
            payload = dispositions_by_id.get(message_id, {"disposition": "none", "reason": "unknown"})
            return _FakeAgentResult(json.dumps(payload))

    fake_agent = _FakeTriageAgent()
    captured_agent_context: dict[str, str] = {}

    async def fake_contacts(_token: str):
        return {}

    async def fake_read_app(_token: str):
        return {}

    async def fake_read_triage(_token: str, folder: str, _filename: str):
        return None

    async def fake_list_json(_token: str, _folder: str):
        return {}

    async def fake_write_triage(_token: str, _folder: str, _filename: str, data: dict[str, object]):
        written.update(data)

    async def fake_labels(_token: str):
        return [{"id": "Label_Receipts", "name": "Receipts"}]

    async def fake_history(_token: str, sender: str, _labels: dict[str, str]):
        if sender == "receipts@example.com":
            return 3, Counter({"Label_Receipts": 3})
        return 0, Counter()

    async def fake_tone(_token: str, sender: str):
        if sender == "client@example.com":
            return {"canDraft": "true", "greeting": "Hi", "closing": "Best", "verbosity": "concise"}
        return {}

    async def fake_fetch_message(_token: str, message_id: str):
        return messages_by_raw_id.get(message_id, {"id": f"gmail_{message_id}"})

    async def fake_context_documents(*_args, **_kwargs):
        return ""

    async def fake_list_insights(_token: str):
        return [{
            "category": "routine",
            "subject": "Grocery shopping",
            "fact": "The user usually orders groceries weekly; last observed order was 2026-08-20.",
            "confidence": "high",
        }]

    async def fake_add_proposal(_token: str, proposal):
        added_proposals.append(proposal)
        return proposal

    monkeypatch.setattr(inbox_triage, "fetch_google_contacts", fake_contacts)
    monkeypatch.setattr(inbox_triage, "read_drive_app_data", fake_read_app)
    monkeypatch.setattr(inbox_triage, "read_json_file", fake_read_triage)
    monkeypatch.setattr(inbox_triage, "list_json_files", fake_list_json)
    monkeypatch.setattr(inbox_triage, "write_json_file", fake_write_triage)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_labels", fake_labels)
    monkeypatch.setattr(inbox_triage, "_historical_sender_label_counts", fake_history)
    monkeypatch.setattr(inbox_triage, "_historical_sender_tone", fake_tone)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_message", fake_fetch_message)
    monkeypatch.setattr(inbox_triage, "load_context_documents", fake_context_documents)
    monkeypatch.setattr(inbox_triage, "list_insights", fake_list_insights)

    def fake_build_agent(context_block="", **_kwargs):
        captured_agent_context["context"] = context_block
        return fake_agent

    monkeypatch.setattr(inbox_triage, "build_executive_assistant", fake_build_agent)
    monkeypatch.setattr(inbox_triage.proposal_drive_store, "add", fake_add_proposal)

    job = {
        "id": "job-1", "status": "running", "total": len(messages), "attempted": 0,
        "processed": 0, "deleted": 0, "fileSuggestions": 0,
        "interactionsTracked": 0, "labelsApplied": 0, "labelFailures": 0,
        "readMarked": 0, "readFailures": 0,
        "tasksCreated": 0, "draftsCreated": 0,
        "draftedMessageIds": [], "failed": 0,
    }

    asyncio.run(inbox_triage._run_job("oauth-token", "owner-1", job, messages))

    assert job["status"] == "completed"
    assert "last observed order was 2026-08-20" in captured_agent_context["context"]
    suggestions = written["suggestions"]

    promo = suggestions["gmail_promo"]
    assert promo["kind"] == "file" and promo["deleteSuggested"] is True

    # The deterministic historical-label check still overrides an agent
    # "delete" verdict when this sender's mail is consistently filed.
    receipts = suggestions["gmail_receipts"]
    assert receipts["kind"] == "file" and receipts["deleteSuggested"] is False
    assert receipts["label"] == "Receipts"

    assert suggestions["gmail_task"]["kind"] == "task"

    reply_ok = suggestions["gmail_reply_ok"]
    assert reply_ok["kind"] == "reply"
    assert reply_ok["draft"] == "Hi Client,\n\nThe total is $42.\n\nBest,"

    # No established reply history for this sender — falls back to a task
    # instead of drafting blind.
    assert suggestions["gmail_reply_notone"]["kind"] == "task"

    # An explicit "none" verdict gets no suggestion at all.
    assert "gmail_none" not in suggestions

    assert job["fileSuggestions"] == 2
    assert job["tasksCreated"] == 2
    assert job["draftsCreated"] == 1
    assert job["draftedMessageIds"] == ["gmail_reply_ok"]

    # The second, independent approval surface — only the drafted reply
    # proposes saving to Gmail Drafts.
    assert len(added_proposals) == 1
    assert added_proposals[0].payload["messageId"] == "gmail_reply_ok"

    # One classification call per unread email (6), plus one draft call for
    # the single reply with enough tone history to draft — never a single
    # batched call for the whole inbox.
    assert len(fake_agent.calls) == len(messages) + 1


def test_tone_profile_reuses_greeting_closing_and_length() -> None:
    profile = inbox_triage._tone_profile([
        {"body": "Hello Alex,\n\n" + ("Thanks for the detailed update. " * 30) + "\n\nRegards,"},
        {"body": "Hello Alex,\n\n" + ("I appreciate the thoughtful context. " * 30) + "\n\nRegards,"},
    ])
    assert profile == {"greeting": "Hello", "closing": "Regards", "verbosity": "detailed"}


class _FakeAgentResult:
    def __init__(self, text: str) -> None:
        self.message = {"content": [{"text": text}]}


class _FakeClassifyingAgent:
    """Classifies everything as "none" — nothing to suggest — so tests that
    aren't exercising classification itself can focus on what they actually
    care about (interaction tracking, label application, etc.)."""

    def __call__(self, _prompt: str):
        return _FakeAgentResult('{"classifications":[]}')


def test_triage_logs_new_contact_email_once(monkeypatch) -> None:
    app_data = {
        "contacts": {
            "people/contact-1": {
                "status": "connected",
                "interactions": [{"id": "gmail:gmail_old", "messageId": "gmail_old", "date": "2026-08-20T10:00:00Z"}],
            }
        }
    }
    saved_triage: dict[str, object] = {}
    writes: list[tuple[str, dict[str, object]]] = []
    interaction_writes: list[tuple[str, dict[str, object]]] = []
    label_writes: list[tuple[str, str]] = []
    messages = [
        {"id": "gmail_old", "fromEmail": "alex@example.com", "from": "Alex Morgan", "subject": "Old follow up", "snippet": "Can you review this?", "date": "2026-08-20T10:00:00Z"},
        {"id": "gmail_new", "fromEmail": "alex@example.com", "from": "Alex Morgan", "subject": "New follow up", "snippet": "Can you review this?", "date": "2026-08-22T10:00:00Z"},
    ]
    messages_by_raw_id = {m["id"].removeprefix("gmail_"): m for m in messages}

    async def fake_contacts(_token: str):
        return {"people/contact-1": {"email": "alex@example.com", "name": "Alex Morgan"}}

    async def fake_read_app(_token: str):
        return app_data

    async def fake_read_triage(_token: str, folder: str, _filename: str):
        if folder == inbox_triage.TRIAGE_FOLDER:
            return saved_triage
        return None

    async def fake_list_json(_token: str, _folder: str):
        return {}

    async def fake_write_triage(_token: str, _folder: str, _filename: str, data: dict[str, object]):
        writes.append(("triage", data))

    async def fake_write_interaction(_token: str, resource_name: str, interaction: dict[str, object]):
        interaction_writes.append((resource_name, interaction))

    async def fake_labels(_token: str):
        return []

    async def fake_modify_labels(_token: str, message_id: str, *, add_label_ids=None, remove_label_ids=None):
        label_writes.append((message_id, (add_label_ids or [""])[0]))

    async def fake_history(_token: str, _sender: str, _labels: dict[str, str]):
        return 0, {}

    async def fake_tone(_token: str, _sender: str):
        return {"canDraft": "true", "greeting": "Hello", "closing": "Regards", "verbosity": "concise"}

    async def fake_fetch_message(_token: str, message_id: str):
        return messages_by_raw_id.get(message_id, {"id": f"gmail_{message_id}"})

    async def fake_context_documents(*_args, **_kwargs):
        return ""

    monkeypatch.setattr(inbox_triage, "fetch_google_contacts", fake_contacts)
    monkeypatch.setattr(inbox_triage, "read_drive_app_data", fake_read_app)
    monkeypatch.setattr(inbox_triage, "read_json_file", fake_read_triage)
    monkeypatch.setattr(inbox_triage, "list_json_files", fake_list_json)
    monkeypatch.setattr(inbox_triage, "write_json_file", fake_write_triage)
    monkeypatch.setattr(inbox_triage, "write_contact_interaction", fake_write_interaction)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_labels", fake_labels)
    monkeypatch.setattr(inbox_triage, "modify_gmail_message_labels", fake_modify_labels)
    monkeypatch.setattr(inbox_triage, "_historical_sender_label_counts", fake_history)
    monkeypatch.setattr(inbox_triage, "_historical_sender_tone", fake_tone)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_message", fake_fetch_message)
    monkeypatch.setattr(inbox_triage, "load_context_documents", fake_context_documents)
    monkeypatch.setattr(inbox_triage, "build_executive_assistant", lambda *_a, **_k: _FakeClassifyingAgent())

    job = {
        "id": "job-1", "status": "running", "total": 2, "attempted": 0,
        "processed": 0, "deleted": 0, "fileSuggestions": 0,
        "interactionsTracked": 0, "labelsApplied": 0, "labelFailures": 0,
        "readMarked": 0, "readFailures": 0,
        "tasksCreated": 0, "draftsCreated": 0,
        "draftedMessageIds": [], "failed": 0,
    }

    asyncio.run(inbox_triage._run_job("oauth-token", "owner-1", job, messages))

    assert job["status"] == "completed"
    assert job["interactionsTracked"] == 1
    assert job["labelsApplied"] == 0
    assert label_writes == []
    assert job["readMarked"] == 0
    assert len(interaction_writes) == 1
    resource_name, interaction = interaction_writes[0]
    assert resource_name == "people/contact-1"
    assert interaction["messageId"] == "gmail_new"
    assert not any(kind == "app" for kind, _ in writes)


def test_apply_triage_changes_requires_explicit_selection(monkeypatch) -> None:
    saved = {
        "currentRun": {
            "id": "run-1",
            "suggestions": [
                {"messageId": "gmail_delete", "deleteSuggested": True, "kind": "file"},
                {"messageId": "gmail_file", "deleteSuggested": False, "kind": "file", "label": "Orders"},
            ],
        },
        "history": [],
        "suggestions": {},
    }
    writes: list[dict[str, object]] = []
    trashed: list[list[str]] = []
    modified: list[tuple[str, list[str], list[str]]] = []

    async def fake_read(_token: str, _folder: str, _filename: str):
        return saved

    async def fake_write(_token: str, _folder: str, _filename: str, data: dict[str, object]):
        writes.append(data)

    async def fake_labels(_token: str):
        return [{"id": "label-orders", "name": "Orders"}]

    async def fake_trash(_token: str, message_ids: list[str]):
        trashed.append(message_ids)

    async def fake_modify(_token: str, message_id: str, *, add_label_ids=None, remove_label_ids=None):
        modified.append((message_id, add_label_ids or [], remove_label_ids or []))

    monkeypatch.setattr(inbox_triage, "read_json_file", fake_read)
    monkeypatch.setattr(inbox_triage, "write_json_file", fake_write)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_labels", fake_labels)
    monkeypatch.setattr(inbox_triage, "trash_gmail_messages", fake_trash)
    monkeypatch.setattr(inbox_triage, "modify_gmail_message_labels", fake_modify)

    result = asyncio.run(inbox_triage.apply_saved_triage_changes(
        "oauth-token",
        {"runId": "run-1", "messageIds": ["gmail_delete", "gmail_file"]},
    ))

    assert result["ok"] is True
    assert {entry["action"] for entry in result["applied"]} == {"deleted", "labeled"}
    assert trashed == [["delete"]]
    assert ("file", ["label-orders"], []) in modified
    assert ("delete", [], ["UNREAD"]) in modified
    assert ("file", [], ["UNREAD"]) in modified
    assert writes


def test_apply_triage_changes_reviews_unlabeled_reply_and_task_without_creating_a_label(monkeypatch) -> None:
    """reply/task suggestions with no historical label have nothing to file
    under — applying them must never create an OpenPip-owned Gmail label."""
    saved = {
        "currentRun": {
            "id": "run-1",
            "suggestions": [
                {"messageId": "gmail_reply", "kind": "reply"},
                {"messageId": "gmail_task", "kind": "task"},
            ],
        },
        "history": [],
        "suggestions": {},
    }
    modified: list[tuple[str, list[str], list[str]]] = []

    async def fake_read(_token: str, _folder: str, _filename: str):
        return saved

    async def fake_write(_token: str, _folder: str, _filename: str, data: dict[str, object]):
        pass

    async def fake_labels(_token: str):
        return []

    async def fake_modify(_token: str, message_id: str, *, add_label_ids=None, remove_label_ids=None):
        modified.append((message_id, add_label_ids or [], remove_label_ids or []))

    monkeypatch.setattr(inbox_triage, "read_json_file", fake_read)
    monkeypatch.setattr(inbox_triage, "write_json_file", fake_write)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_labels", fake_labels)
    monkeypatch.setattr(inbox_triage, "modify_gmail_message_labels", fake_modify)

    result = asyncio.run(inbox_triage.apply_saved_triage_changes(
        "oauth-token",
        {"runId": "run-1", "messageIds": ["gmail_reply", "gmail_task"]},
    ))

    assert result["ok"] is True
    assert {entry["action"] for entry in result["applied"]} == {"reviewed"}
    # Only ever an UNREAD removal — no add_label_ids call for either message.
    assert all(not add for _message_id, add, _remove in modified)
    assert ("reply", [], ["UNREAD"]) in modified
    assert ("task", [], ["UNREAD"]) in modified


def test_apply_triage_changes_saves_a_reply_draft_to_gmail(monkeypatch) -> None:
    """The one place applying a suggestion writes beyond a label — checking
    a reply suggestion and hitting Save in the modal is the explicit human
    selection this app requires before ever touching Gmail Drafts."""
    saved = {
        "currentRun": {
            "id": "run-1",
            "suggestions": [{
                "messageId": "gmail_reply", "kind": "reply",
                "subject": "Question about the invoice", "fromEmail": "client@example.com",
                "threadId": "thread-abc", "draft": "Hi there,\n\nThanks for reaching out...",
            }],
        },
        "history": [],
        "suggestions": {},
    }
    created_drafts: list[dict[str, object]] = []

    async def fake_read(_token: str, _folder: str, _filename: str):
        return saved

    async def fake_write(_token: str, _folder: str, _filename: str, data: dict[str, object]):
        pass

    async def fake_labels(_token: str):
        return []

    async def fake_modify(_token: str, message_id: str, *, add_label_ids=None, remove_label_ids=None):
        pass

    async def fake_create_draft(_token: str, *, to, subject, body, thread_id=None):
        created_drafts.append({"to": to, "subject": subject, "body": body, "thread_id": thread_id})
        return {"id": "draft-1"}

    async def fake_get_by_key(_token: str, _key: str):
        return None  # no matching proposal from the other approval surface

    monkeypatch.setattr(inbox_triage, "read_json_file", fake_read)
    monkeypatch.setattr(inbox_triage, "write_json_file", fake_write)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_labels", fake_labels)
    monkeypatch.setattr(inbox_triage, "modify_gmail_message_labels", fake_modify)
    monkeypatch.setattr(inbox_triage, "create_gmail_draft", fake_create_draft)
    monkeypatch.setattr(inbox_triage.proposal_drive_store, "get_by_idempotency_key", fake_get_by_key)

    result = asyncio.run(inbox_triage.apply_saved_triage_changes(
        "oauth-token", {"runId": "run-1", "messageIds": ["gmail_reply"]},
    ))

    assert result["ok"] is True
    assert result["applied"] == [{"messageId": "gmail_reply", "action": "drafted"}]
    assert created_drafts == [{
        "to": "client@example.com", "subject": "Re: Question about the invoice",
        "body": "Hi there,\n\nThanks for reaching out...", "thread_id": "thread-abc",
    }]


def test_apply_triage_changes_resolves_the_matching_pending_proposal_when_saving_a_reply(monkeypatch) -> None:
    """The two approval surfaces (see _propose_saving_draft) must reconcile:
    saving a reply directly from this modal must not leave a stale
    save_draft proposal sitting PENDING in the Review queue afterward — see
    the user's own report of exactly that happening."""
    from test_proposal_drive_store import _fake_drive, _proposal

    fake_send, _files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    saved = {
        "currentRun": {
            "id": "run-1",
            "suggestions": [{
                "messageId": "gmail_reply", "kind": "reply",
                "subject": "Question about the invoice", "fromEmail": "client@example.com",
                "threadId": "thread-abc", "draft": "Hi there,\n\nThanks for reaching out...",
            }],
        },
        "history": [],
        "suggestions": {},
    }

    async def fake_read(_token: str, _folder: str, _filename: str):
        return saved

    async def fake_write(_token: str, _folder: str, _filename: str, data: dict[str, object]):
        pass

    async def fake_labels(_token: str):
        return []

    async def fake_modify(_token: str, message_id: str, *, add_label_ids=None, remove_label_ids=None):
        pass

    async def fake_create_draft(_token: str, *, to, subject, body, thread_id=None):
        return {"id": "draft-999"}

    monkeypatch.setattr(inbox_triage, "read_json_file", fake_read)
    monkeypatch.setattr(inbox_triage, "write_json_file", fake_write)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_labels", fake_labels)
    monkeypatch.setattr(inbox_triage, "modify_gmail_message_labels", fake_modify)
    monkeypatch.setattr(inbox_triage, "create_gmail_draft", fake_create_draft)

    async def run():
        proposal = await inbox_triage.proposal_drive_store.add("oauth-token", _proposal(
            action="save_draft", title="Save draft reply to Client Name",
            source=SourceReference(kind="email", id="email:gmail_reply", title="Question about the invoice"),
            idempotency_key=inbox_triage._save_draft_idempotency_key("gmail_reply"),
            payload={
                "to": "client@example.com", "subject": "Re: Question about the invoice",
                "body": "Hi there,\n\nThanks for reaching out...", "threadId": "thread-abc",
                "messageId": "gmail_reply",
            },
        ))
        result = await inbox_triage.apply_saved_triage_changes(
            "oauth-token", {"runId": "run-1", "messageIds": ["gmail_reply"]},
        )
        resolved = await inbox_triage.proposal_drive_store.get("oauth-token", proposal.id)
        return result, resolved

    result, resolved = asyncio.run(run())

    assert result["ok"] is True
    assert result["applied"] == [{"messageId": "gmail_reply", "action": "drafted"}]
    assert resolved is not None
    assert resolved.status == ProposalStatus.EXECUTED
    assert resolved.events[-1]["detail"] == "gmail://drafts/draft-999"


def test_apply_triage_changes_skips_a_second_draft_when_the_proposal_already_executed(monkeypatch) -> None:
    """The reverse direction: the matching save_draft proposal was already
    approved and executed from the Review page — Save in this modal must
    not create a second, duplicate Gmail draft for the same reply."""
    from test_proposal_drive_store import _fake_drive, _proposal

    fake_send, _files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    saved = {
        "currentRun": {
            "id": "run-1",
            "suggestions": [{
                "messageId": "gmail_reply", "kind": "reply",
                "subject": "Question about the invoice", "fromEmail": "client@example.com",
                "threadId": "thread-abc", "draft": "Hi there,\n\nThanks for reaching out...",
            }],
        },
        "history": [],
        "suggestions": {},
    }

    async def fake_read(_token: str, _folder: str, _filename: str):
        return saved

    async def fake_write(_token: str, _folder: str, _filename: str, data: dict[str, object]):
        pass

    async def fake_labels(_token: str):
        return []

    async def fake_modify(_token: str, message_id: str, *, add_label_ids=None, remove_label_ids=None):
        pass

    async def fail_if_called(*_args, **_kwargs):
        raise AssertionError("must not create a second Gmail draft for an already-executed proposal")

    monkeypatch.setattr(inbox_triage, "read_json_file", fake_read)
    monkeypatch.setattr(inbox_triage, "write_json_file", fake_write)
    monkeypatch.setattr(inbox_triage, "fetch_gmail_labels", fake_labels)
    monkeypatch.setattr(inbox_triage, "modify_gmail_message_labels", fake_modify)
    monkeypatch.setattr(inbox_triage, "create_gmail_draft", fail_if_called)

    async def run():
        proposal = await inbox_triage.proposal_drive_store.add("oauth-token", _proposal(
            action="save_draft", title="Save draft reply to Client Name",
            source=SourceReference(kind="email", id="email:gmail_reply", title="Question about the invoice"),
            idempotency_key=inbox_triage._save_draft_idempotency_key("gmail_reply"),
            payload={
                "to": "client@example.com", "subject": "Re: Question about the invoice",
                "body": "Hi there,\n\nThanks for reaching out...", "threadId": "thread-abc",
                "messageId": "gmail_reply",
            },
        ))
        approved = await inbox_triage.proposal_drive_store.decide("oauth-token", proposal.id, ProposalStatus.APPROVED)
        claimed = await inbox_triage.proposal_drive_store.claim_execution("oauth-token", approved.id)
        await inbox_triage.proposal_drive_store.mark_executed("oauth-token", claimed.id, "gmail://drafts/draft-already")
        return await inbox_triage.apply_saved_triage_changes(
            "oauth-token", {"runId": "run-1", "messageIds": ["gmail_reply"]},
        )

    result = asyncio.run(run())

    assert result["ok"] is True
    assert result["applied"] == [{"messageId": "gmail_reply", "action": "drafted"}]


def test_run_job_proposes_saving_every_drafted_reply(monkeypatch) -> None:
    """_propose_saving_draft is the second, independent approval surface
    (see proposal_drive_store.py / executor.py's DefaultActionExecutor) —
    approving it there saves to Gmail Drafts too, without the triage modal
    ever needing to be open."""
    added: list[object] = []

    async def fake_add(_token: str, proposal):
        added.append(proposal)
        return proposal

    monkeypatch.setattr(inbox_triage.proposal_drive_store, "add", fake_add)

    message = {
        "id": "gmail_reply", "gmailUrl": "https://mail.google.com/mail/u/0/#all/reply",
    }
    suggestion = {
        "messageId": "gmail_reply", "subject": "Question about the invoice", "sender": "Client Name",
        "fromEmail": "client@example.com", "date": "2026-01-01", "threadId": "thread-abc",
        "draft": "Hi there,\n\nThanks...",
    }

    asyncio.run(inbox_triage._propose_saving_draft("oauth-token", message, suggestion))

    assert len(added) == 1
    proposal = added[0]
    assert proposal.action == "save_draft"
    assert proposal.payload["to"] == "client@example.com"
    assert proposal.payload["subject"] == "Re: Question about the invoice"
    assert proposal.payload["threadId"] == "thread-abc"
    assert proposal.source.url == "https://mail.google.com/mail/u/0/#all/reply"
    assert proposal.idempotency_key == "inbox_triage:save_draft:gmail_reply"
