from fastapi.testclient import TestClient

from openpip_backend.app import app, store


def setup_function() -> None:
    store._proposals.clear()


def test_briefing_creates_pending_proposal_for_message() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/briefing",
        json={"messages": [{"id": "message-1", "subject": "Client follow-up"}]},
    )

    assert response.status_code == 200
    assert response.json()["proposals_created"] == 1
    items = client.get("/api/proposals?status=pending").json()["items"]
    assert len(items) == 1
    assert items[0]["status"] == "pending"


def test_approval_is_explicit_and_cannot_be_repeated() -> None:
    client = TestClient(app)
    client.post(
        "/api/briefing",
        json={"messages": [{"id": "message-2", "subject": "Approve this draft"}]},
    )
    proposal = client.get("/api/proposals").json()["items"][0]

    approved = client.post(f"/api/proposals/{proposal['id']}/approve", json={})
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"

    repeated = client.post(f"/api/proposals/{proposal['id']}/approve", json={})
    assert repeated.status_code == 409
