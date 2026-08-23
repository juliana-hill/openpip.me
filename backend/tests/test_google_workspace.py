from fastapi.testclient import TestClient

from openpip_backend.app import app


def test_google_reads_require_an_oauth_token() -> None:
    client = TestClient(app)

    response = client.get("/agent/google/tasks")

    assert response.status_code == 401
    assert response.json()["detail"] == "Google account is not connected"


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
    async def fake_fetch(_token: str, *, local_date=None, page_size=50):
        assert local_date == "2026-08-21"
        assert page_size == 25
        return ([{"id": "gmail-1", "source": "gmail", "unread": True}], 1)

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_messages", fake_fetch)
    response = TestClient(app).get(
        "/agent/inbox/messages?source=gmail&localDate=2026-08-21&pageSize=25",
        headers={"x-google-token": "oauth-token"},
    )

    assert response.status_code == 200
    assert response.json()["messages"][0]["source"] == "gmail"
    assert response.json()["total"] == 1


def test_gmail_unread_count_honors_the_local_date(monkeypatch) -> None:
    async def fake_fetch(_token: str, *, local_date=None, page_size=100):
        assert local_date == "2026-08-22"
        assert page_size == 100
        return ([{"id": "gmail-1", "unread": True}], 1)

    monkeypatch.setattr("openpip_backend.app.fetch_gmail_messages", fake_fetch)
    response = TestClient(app).get(
        "/agent/inbox/count?localDate=2026-08-22",
        headers={"x-google-token": "oauth-token"},
    )

    assert response.status_code == 200
    assert response.json() == {"unread": 1}


def test_inbox_tags_are_stored_in_drive_app_data(monkeypatch) -> None:
    app_data = {"version": 1, "tags": [], "messageTags": {}}

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

    created = client.post("/agent/inbox/tags", headers=headers, json={"name": "Needs reply"})
    assert created.status_code == 200
    tag = created.json()

    assigned = client.post(
        "/agent/inbox/messages/assign-tag",
        headers=headers,
        json={"messageId": "gmail-1", "tagId": tag["id"]},
    )
    assert assigned.status_code == 200
    assert app_data["messageTags"] == {"gmail-1": [tag["id"]]}

    listed = client.get("/agent/inbox/tags", headers=headers)
    assert listed.status_code == 200
    assert listed.json() == [tag]


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
