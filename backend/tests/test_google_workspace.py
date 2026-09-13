import asyncio
import base64
import json
from email import message_from_bytes, policy

import httpx
from fastapi.testclient import TestClient

from openpip_backend.app import app
from openpip_backend.google_workspace import (
    _extract_gmail_content,
    _get_json,
    create_gmail_draft,
    modify_gmail_message_labels,
    update_google_calendar_event,
)


def test_google_reads_require_an_oauth_token() -> None:
    client = TestClient(app)

    response = client.get("/agent/google/tasks")

    assert response.status_code == 401
    assert response.json()["detail"] == "Google account is not connected"


def test_google_read_timeout_retries_before_failing(monkeypatch) -> None:
    calls = 0

    async def fake_get(self, url, **kwargs):
        nonlocal calls
        calls += 1
        if calls == 1:
            raise httpx.ReadTimeout("temporary Google timeout", request=httpx.Request("GET", url))
        return httpx.Response(200, json={"items": []}, request=httpx.Request("GET", url))

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    async def run() -> dict:
        async with httpx.AsyncClient() as client:
            return await _get_json(client, "https://example.test", "oauth-token")

    result = asyncio.run(run())

    assert result == {"items": []}
    assert calls == 2


def test_google_tasks_are_returned_from_the_oauth_adapter(monkeypatch) -> None:
    async def fake_fetch(_token: str):
        return [
            {
                "id": "task-1",
                "title": "Review calendar",
                "listId": "list-1",
                "listName": "Today",
                "priority": "MEDIUM",
                "dueDate": None,
            }
        ]

    monkeypatch.setattr("openpip_backend.app.fetch_google_tasks", fake_fetch)
    response = TestClient(app).get("/agent/google/tasks", headers={"x-google-token": "oauth-token"})

    assert response.status_code == 200
    assert response.json() == {
        "tasks": [
            {
                "id": "task-1",
                "title": "Review calendar",
                "listId": "list-1",
                "listName": "Today",
                "priority": "MEDIUM",
                "dueDate": None,
            }
        ]
    }


def test_calendar_window_validation_is_explicit() -> None:
    response = TestClient(app).get(
        "/agent/calendars?from=not-a-date",
        headers={"x-google-token": "oauth-token"},
    )

    assert response.status_code == 400
    assert "YYYY-MM-DD" in response.json()["detail"]


def test_notebook_pages_use_the_google_adapter(monkeypatch) -> None:
    async def fake_fetch(_token: str):
        return [{"id": "list-1", "title": "Today", "items": []}]

    monkeypatch.setattr("openpip_backend.app.fetch_google_notebook_pages", fake_fetch)
    response = TestClient(app).get("/agent/notebook/pages", headers={"Authorization": "Bearer oauth-token"})

    assert response.status_code == 200
    assert response.json() == {"pages": [{"id": "list-1", "title": "Today", "items": []}]}


def test_drive_files_use_the_google_adapter(monkeypatch) -> None:
    async def fake_fetch(_token: str, *, page_size=50):
        assert page_size == 10
        return [{"id": "file-1", "name": "Notes", "mimeType": "text/plain"}]

    monkeypatch.setattr("openpip_backend.app.fetch_google_drive_files", fake_fetch)
    response = TestClient(app).get(
        "/agent/drive/files?pageSize=10",
        headers={"x-google-token": "oauth-token"},
    )

    assert response.status_code == 200
    assert response.json() == {"files": [{"id": "file-1", "name": "Notes", "mimeType": "text/plain"}]}


def test_gmail_messages_are_exposed_as_gmail_only(monkeypatch) -> None:
    async def fake_fetch(_token: str, *, local_date=None, label_id=None, unread_only=False, page_size=50):
        assert local_date == "2026-08-21"
        assert label_id is None
        assert unread_only is False
        assert page_size == 25
        return ([{"id": "gmail-1", "source": "gmail", "unread": True}], 1)

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_messages", fake_fetch)
    async def fake_labels(_token: str):
        return [{"id": "Label_1", "name": "Needs reply", "color": "#f47560", "createdAt": "", "updatedAt": ""}]

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_labels", fake_labels)
    response = TestClient(app).get(
        "/agent/inbox/messages?source=gmail&localDate=2026-08-21&pageSize=25",
        headers={"x-google-token": "oauth-token"},
    )

    assert response.status_code == 200
    assert response.json()["messages"][0]["source"] == "gmail"
    assert response.json()["total"] == 1


def test_gmail_label_query_includes_read_and_archived_messages(monkeypatch) -> None:
    async def fake_fetch(_token: str, *, local_date=None, label_id=None, unread_only=False, page_size=50):
        assert local_date is None
        assert label_id == "Label_1"
        assert unread_only is False
        return ([{"id": "gmail-1", "source": "gmail", "unread": False, "labelIds": ["Label_1"]}], 1)

    async def fake_labels(_token: str):
        return [{"id": "Label_1", "name": "Receipts", "color": "#f47560", "createdAt": "", "updatedAt": ""}]

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_messages", fake_fetch)
    monkeypatch.setattr("openpip_backend.app.fetch_gmail_labels", fake_labels)
    response = TestClient(app).get(
        "/agent/inbox/messages?source=gmail&labelId=Label_1&pageSize=50",
        headers={"x-google-token": "oauth-token"},
    )

    assert response.status_code == 200
    assert response.json()["messages"] == [{
        "id": "gmail-1",
        "source": "gmail",
        "unread": False,
        "labelIds": ["Label_1"],
        "gmailDraft": False,
        "tags": ["Receipts"],
    }]


def test_gmail_drafts_are_exposed_as_a_mailbox_state(monkeypatch) -> None:
    async def fake_fetch(_token: str, *, local_date=None, label_id=None, unread_only=False, page_size=50):
        assert local_date is None
        assert label_id == "DRAFT"
        assert unread_only is False
        return ([{"id": "gmail-draft-1", "source": "gmail", "unread": False, "labelIds": ["DRAFT"]}], 1)

    async def fake_labels(_token: str):
        return []

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_messages", fake_fetch)
    monkeypatch.setattr("openpip_backend.app.fetch_gmail_labels", fake_labels)
    response = TestClient(app).get(
        "/agent/inbox/messages?source=gmail&labelId=DRAFT&pageSize=20",
        headers={"x-google-token": "oauth-token"},
    )

    assert response.status_code == 200
    assert response.json()["messages"][0]["gmailDraft"] is True
    assert response.json()["messages"][0]["tags"] == []


def test_gmail_unread_count_is_not_scoped_to_any_date(monkeypatch) -> None:
    # Same fix as Inbox's "Unread" tab: a date restriction here made unread
    # mail from before today invisible, silently reporting 0 for anyone with
    # an older backlog. Total unread count, no date filter at all.
    async def fake_fetch(_token: str, *, unread_only=False, page_size=100):
        assert unread_only is True
        assert page_size == 1
        return ([], 7)

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_messages", fake_fetch)
    response = TestClient(app).get(
        "/agent/inbox/count",
        headers={"x-google-token": "oauth-token"},
    )

    assert response.status_code == 200
    assert response.json() == {"unread": 7}


def test_gmail_message_detail_decodes_html_and_attachments() -> None:
    import base64

    encoded = base64.urlsafe_b64encode(b"<p>Full message body</p>").decode().rstrip("=")
    body, attachments = _extract_gmail_content({
        "mimeType": "multipart/alternative",
        "parts": [
            {"mimeType": "text/plain", "body": {"data": encoded}},
            {"mimeType": "text/html", "body": {"data": encoded}},
            {"mimeType": "application/pdf", "filename": "receipt.pdf", "body": {"attachmentId": "att-1"}},
        ],
    })

    assert body == "<p>Full message body</p>"
    assert attachments == [{"name": "receipt.pdf"}]


def test_gmail_message_detail_endpoint_returns_full_body(monkeypatch) -> None:
    async def fake_fetch(_token: str, message_id: str):
        assert message_id == "message-1"
        return {"id": "gmail_message-1", "source": "gmail", "body": "<p>Full body</p>", "tags": [], "labelIds": ["Label_1"]}

    async def fake_labels(_token: str):
        return [{"id": "Label_1", "name": "Needs reply", "color": "#f47560", "createdAt": "", "updatedAt": ""}]

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_message", fake_fetch)
    monkeypatch.setattr("openpip_backend.app.fetch_gmail_labels", fake_labels)
    response = TestClient(app).get("/agent/inbox/message/gmail_message-1", headers={"x-google-token": "oauth-token"})

    assert response.status_code == 200
    assert response.json()["message"]["body"] == "<p>Full body</p>"


def test_gmail_delete_moves_selected_messages_to_trash(monkeypatch) -> None:
    captured: list[str] = []

    async def fake_trash(_token: str, message_ids: list[str]):
        captured.extend(message_ids)

    monkeypatch.setattr("openpip_backend.app.trash_gmail_messages", fake_trash)
    response = TestClient(app).request(
        "DELETE",
        "/agent/inbox/message",
        headers={"x-google-token": "oauth-token"},
        json={"ids": ["gmail_message-1", "gmail_message-2"]},
    )

    assert response.status_code == 200
    assert captured == ["message-1", "message-2"]
    assert response.json() == {"ok": True, "deleted": ["gmail_message-1", "gmail_message-2"]}


def test_gmail_delete_requires_message_ids() -> None:
    response = TestClient(app).request(
        "DELETE",
        "/agent/inbox/message",
        headers={"x-google-token": "oauth-token"},
        json={"ids": []},
    )

    assert response.status_code == 400


def test_inbox_tags_use_gmail_labels_and_message_modify(monkeypatch) -> None:
    labels: list[dict[str, object]] = []
    modified: list[dict[str, object]] = []

    async def fake_labels(_token: str):
        return labels

    async def fake_create(_token: str, name: str):
        tag = {"id": "Label_2", "name": name, "color": "#45dfa4", "createdAt": "", "updatedAt": ""}
        labels.append(tag)
        return tag

    async def fake_modify(_token: str, message_id: str, *, add_label_ids=None, remove_label_ids=None):
        modified.append({"message_id": message_id, "add": add_label_ids, "remove": remove_label_ids})

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_labels", fake_labels)
    monkeypatch.setattr("openpip_backend.app.create_gmail_label", fake_create)
    monkeypatch.setattr("openpip_backend.app.modify_gmail_message_labels", fake_modify)
    client = TestClient(app)
    headers = {"x-google-token": "oauth-token"}

    created = client.post("/agent/inbox/tags", headers=headers, json={"name": "Needs reply"})
    assert created.status_code == 200
    tag = created.json()
    assert tag["id"] == "Label_2"

    assigned = client.post(
        "/agent/inbox/messages/assign-tag",
        headers=headers,
        json={"messageId": "gmail_message-1", "tagId": tag["id"]},
    )
    assert assigned.status_code == 200
    assert modified[-1] == {"message_id": "message-1", "add": ["Label_2"], "remove": None}

    removed = client.post(
        "/agent/inbox/messages/remove-tag",
        headers=headers,
        json={"messageId": "gmail_message-1", "tagId": tag["id"]},
    )
    assert removed.status_code == 200
    assert modified[-1] == {"message_id": "message-1", "add": None, "remove": ["Label_2"]}

    listed = client.get("/agent/inbox/tags", headers=headers)
    assert listed.status_code == 200
    assert listed.json() == labels


def test_gmail_message_label_modify_uses_the_gmail_messages_endpoint(monkeypatch) -> None:
    calls: list[dict[str, object]] = []

    async def fake_request(self, method, url, **kwargs):
        calls.append({"method": method, "url": url, **kwargs})
        return httpx.Response(
            200,
            json={"id": "message-1", "labelIds": ["INBOX", "Label_2"]},
            request=httpx.Request(method, url),
        )

    monkeypatch.setattr(httpx.AsyncClient, "request", fake_request)

    modified = asyncio.run(modify_gmail_message_labels(
        "oauth-token",
        "message-1",
        add_label_ids=["Label_2"],
    ))

    assert modified == {"id": "message-1", "labelIds": ["INBOX", "Label_2"]}
    assert calls == [{
        "method": "POST",
        "url": "https://gmail.googleapis.com/gmail/v1/users/me/messages/message-1/modify",
        "json": {"addLabelIds": ["Label_2"], "removeLabelIds": []},
        "headers": {"Authorization": "Bearer oauth-token"},
    }]


def test_inbox_tag_route_returns_gmail_label_state_without_drive_wrapper(monkeypatch) -> None:
    async def fake_labels(_token: str):
        return [{"id": "Label_2", "name": "Needs reply"}]

    async def fake_modify(_token: str, message_id: str, *, add_label_ids=None, remove_label_ids=None):
        assert message_id == "message-1"
        assert add_label_ids == ["Label_2"]
        assert remove_label_ids is None
        return {"id": "message-1", "labelIds": ["INBOX", "Label_2"]}

    async def fail_drive(*_args, **_kwargs):
        raise AssertionError("inbox tag assignment must not use Drive app data")

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_labels", fake_labels)
    monkeypatch.setattr("openpip_backend.app.modify_gmail_message_labels", fake_modify)
    monkeypatch.setattr("openpip_backend.app.read_drive_app_data", fail_drive)
    monkeypatch.setattr("openpip_backend.app.write_drive_app_data", fail_drive)

    response = TestClient(app).post(
        "/agent/inbox/messages/assign-tag",
        headers={"x-google-token": "oauth-token"},
        json={"messageId": "gmail_message-1", "tagId": "Label_2"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "ok": True,
        "messageId": "gmail_message-1",
        "labelIds": ["INBOX", "Label_2"],
    }


def test_agent_user_data_is_stored_in_drive_app_data(monkeypatch) -> None:
    app_data = {"version": 1, "tags": [], "messageTags": {}, "userData": {}}

    async def fake_read(_token: str):
        return app_data

    async def fake_write(_token: str, data):
        saved = dict(data)
        app_data.clear()
        app_data.update(saved)
        return saved

    monkeypatch.setattr("openpip_backend.app.read_drive_app_data", fake_read)
    monkeypatch.setattr("openpip_backend.app.write_drive_app_data", fake_write)
    client = TestClient(app)
    headers = {"x-google-token": "oauth-token"}

    saved = client.put(
        "/agent/user/data",
        headers=headers,
        json={"agentName": "Pip", "agentIcon": "data:image/png;base64,abc", "ignored": "nope"},
    )
    assert saved.status_code == 200
    assert saved.json() == {"agentName": "Pip", "agentIcon": "data:image/png;base64,abc"}

    loaded = client.get("/agent/user/data", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json() == saved.json()


def test_create_gmail_draft_posts_a_correctly_encoded_message(monkeypatch) -> None:
    """The one write this app makes beyond labels/trash — worth verifying
    the raw message is actually a valid, correctly-addressed RFC822
    message, not just that some request was sent."""
    captured: dict[str, object] = {}

    async def fake_send(self, request, **kwargs):
        assert request.method == "POST"
        assert str(request.url).startswith("https://gmail.googleapis.com/gmail/v1/users/me/drafts")
        body = json.loads(request.content)
        captured["body"] = body
        return httpx.Response(200, json={"id": "draft-1"}, request=request)

    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    result = asyncio.run(create_gmail_draft(
        "oauth-token", to="client@example.com", subject="Re: Invoice",
        body="Thanks for reaching out.", thread_id="thread-abc",
    ))

    assert result == {"id": "draft-1"}
    raw = captured["body"]["message"]["raw"]
    parsed = message_from_bytes(base64.urlsafe_b64decode(raw), policy=policy.default)
    assert parsed["To"] == "client@example.com"
    assert parsed["Subject"] == "Re: Invoice"
    assert parsed.get_content().strip() == "Thanks for reaching out."
    assert captured["body"]["message"]["threadId"] == "thread-abc"


def test_create_gmail_draft_omits_thread_id_when_not_replying(monkeypatch) -> None:
    captured: dict[str, object] = {}

    async def fake_send(self, request, **kwargs):
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"id": "draft-2"}, request=request)

    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    asyncio.run(create_gmail_draft("oauth-token", to="a@example.com", subject="Hi", body="Hello"))

    assert "threadId" not in captured["body"]["message"]


def test_confirmed_reschedule_patches_only_the_existing_calendar_event(monkeypatch) -> None:
    captured: dict[str, object] = {}

    async def fake_send(self, request, **kwargs):
        captured["method"] = request.method
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"id": "event-1"}, request=request)

    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)

    result = asyncio.run(update_google_calendar_event(
        "oauth-token", "primary", "event-1",
        start="2026-09-13T09:00:00-07:00", end="2026-09-13T10:00:00-07:00",
        timezone_name="America/Los_Angeles",
    ))

    assert result == {"id": "event-1"}
    assert captured["method"] == "PATCH"
    assert captured["url"].endswith("/calendars/primary/events/event-1")
    assert captured["body"] == {
        "start": {"dateTime": "2026-09-13T09:00:00-07:00", "timeZone": "America/Los_Angeles"},
        "end": {"dateTime": "2026-09-13T10:00:00-07:00", "timeZone": "America/Los_Angeles"},
    }
