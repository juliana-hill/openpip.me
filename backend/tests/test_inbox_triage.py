import asyncio
from collections import Counter

from openpip_backend import inbox_triage


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


def test_refund_notifications_are_filing_suggestions_not_tasks() -> None:
    suggestion = inbox_triage._suggestion({
        "id": "gmail_refund",
        "from": "Temu",
        "fromEmail": "orders@temu.com",
        "subject": "Your Temu order has been partially refunded due to price adjustment",
        "snippet": "Your refund has been issued.",
    })

    assert suggestion is not None
    assert suggestion["kind"] == "file"
    assert suggestion["deleteSuggested"] is True
    assert suggestion["action"] == "Review deletion suggestion"


def test_appointment_scheduling_is_a_task_suggestion() -> None:
    suggestion = inbox_triage._suggestion({
        "id": "gmail_appointment",
        "from": "Dr. Morgan's office",
        "fromEmail": "office@example.com",
        "subject": "Schedule your follow-up appointment",
        "snippet": "Please choose a time for your next visit.",
    })

    assert suggestion is not None
    assert suggestion["kind"] == "task"
    assert suggestion["taskSuggested"] is True


def test_message_text_ignores_sender_name_and_address(monkeypatch) -> None:
    # A sender address/name alone must never trigger a classification — only
    # actual message content (subject/snippet) should.
    suggestion = inbox_triage._suggestion({
        "id": "gmail_from_marketing_address",
        "from": "Rewards Program",
        "fromEmail": "marketing@agency.com",
        "subject": "Project update",
        "snippet": "Here is the status you asked for.",
    })
    assert suggestion is None


def test_gmail_promotions_category_is_a_filing_suggestion_even_with_no_keywords() -> None:
    # Real marketing copy avoids literal words like "sale"/"discount" — Gmail's
    # own categorizer (the Promotions tab) reads the full message and catches
    # this kind of thing far better than keyword matching against a snippet.
    suggestion = inbox_triage._suggestion({
        "id": "gmail_plated",
        "from": "PLATED UP",
        "fromEmail": "hello@platedup.com",
        "subject": "Warm grains, roasted veg, hearty protein.",
        "snippet": "Warm grains, roasted veg, hearty protein.",
        "labelIds": ["UNREAD", "CATEGORY_PROMOTIONS"],
    })
    assert suggestion is not None
    assert suggestion["kind"] == "file"
    assert suggestion["deleteSuggested"] is True


def test_gmail_updates_category_is_a_filing_suggestion() -> None:
    suggestion = inbox_triage._suggestion({
        "id": "gmail_porkbun",
        "from": "Porkbun",
        "fromEmail": "notify@porkbun.com",
        "subject": "porkbun.com | Domain Renewal Notice - expiration date approaching in 5 days or less",
        "snippet": "RENEWAL NOTICE Hi there! This is your friendly reminder that there are domains in your account expiring in 5 days or less.",
        "labelIds": ["UNREAD", "CATEGORY_UPDATES"],
    })
    assert suggestion is not None
    assert suggestion["kind"] == "file"
    assert suggestion["deleteSuggested"] is True


def test_category_fallback_never_overrides_an_actual_reply_or_task_keyword() -> None:
    # A message Gmail happens to categorize as Updates that also reads like it
    # needs a reply must still be classified as that, not silently filed.
    suggestion = inbox_triage._suggestion({
        "id": "gmail_needs_reply",
        "from": "A Person",
        "fromEmail": "person@example.com",
        "subject": "Could you confirm the meeting time?",
        "snippet": "Let me know if Tuesday works for you.",
        "labelIds": ["UNREAD", "CATEGORY_UPDATES"],
    })
    assert suggestion is not None
    assert suggestion["kind"] == "reply"


def test_ordinary_personal_email_with_no_category_is_not_suggested() -> None:
    suggestion = inbox_triage._suggestion({
        "id": "gmail_personal",
        "from": "A Friend",
        "fromEmail": "friend@example.com",
        "subject": "Photos from the weekend",
        "snippet": "Here are a few of my favorites!",
        "labelIds": ["UNREAD"],
    })
    assert suggestion is None


def test_tone_profile_reuses_greeting_closing_and_length() -> None:
    profile = inbox_triage._tone_profile([
        {"body": "Hello Alex,\n\n" + ("Thanks for the detailed update. " * 30) + "\n\nRegards,"},
        {"body": "Hello Alex,\n\n" + ("I appreciate the thoughtful context. " * 30) + "\n\nRegards,"},
    ])
    assert profile == {"greeting": "Hello", "closing": "Regards", "verbosity": "detailed"}


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

    job = {
        "id": "job-1", "status": "running", "total": 2, "attempted": 0,
        "processed": 0, "deleted": 0, "fileSuggestions": 0,
        "interactionsTracked": 0, "labelsApplied": 0, "labelFailures": 0,
        "readMarked": 0, "readFailures": 0,
        "tasksCreated": 0, "draftsCreated": 0,
        "draftedMessageIds": [], "failed": 0,
    }
    messages = [
        {"id": "gmail_old", "fromEmail": "alex@example.com", "from": "Alex Morgan", "subject": "Old follow up", "snippet": "Can you review this?", "date": "2026-08-20T10:00:00Z"},
        {"id": "gmail_new", "fromEmail": "alex@example.com", "from": "Alex Morgan", "subject": "New follow up", "snippet": "Can you review this?", "date": "2026-08-22T10:00:00Z"},
    ]

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
