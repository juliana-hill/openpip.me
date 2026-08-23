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

    async def fake_create_label(_token: str, name: str):
        return {"id": f"label-{name.rsplit('/', 1)[-1].lower()}"}

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
    monkeypatch.setattr(inbox_triage, "create_gmail_label", fake_create_label)
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
    assert job["labelsApplied"] == 2
    assert len([entry for entry in label_writes if entry[1]]) == 2
    assert job["readMarked"] == 2
    assert len(interaction_writes) == 1
    resource_name, interaction = interaction_writes[0]
    assert resource_name == "people/contact-1"
    assert interaction["messageId"] == "gmail_new"
    assert not any(kind == "app" for kind, _ in writes)
