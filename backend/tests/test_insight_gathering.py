import asyncio

from openpip_backend import insight_gathering


def test_agent_pages_are_oldest_first_and_do_not_mix_days() -> None:
    entries = [
        {"record": {"sourceId": "email:old-2", "date": "2022-01-01T12:00:00Z"}, "reference": {"id": "email:old-2"}},
        {"record": {"sourceId": "email:new", "date": "2022-01-02T09:00:00Z"}, "reference": {"id": "email:new"}},
        {"record": {"sourceId": "email:old-1", "date": "2022-01-01T08:00:00Z"}, "reference": {"id": "email:old-1"}},
    ]
    ordered = insight_gathering._chronological(entries)

    first = insight_gathering._next_daily_page(ordered, 0)
    second = insight_gathering._next_daily_page(ordered, len(first))

    assert [item["record"]["sourceId"] for item in first] == ["email:old-1", "email:old-2"]
    assert [item["record"]["sourceId"] for item in second] == ["email:new"]


def test_start_is_idempotent_after_completion(monkeypatch) -> None:
    completed = {
        "version": insight_gathering._STATUS_VERSION, "state": "completed", "runId": "run-1", "stages": {},
        "progress": 100, "insightsWritten": 4, "events": [],
    }

    async def fake_read(_token: str, _folder: str, _filename: str):
        return completed

    monkeypatch.setattr(insight_gathering, "read_json_file", fake_read)

    result = asyncio.run(insight_gathering.start_insight_gathering("token"))

    assert result["state"] == "completed"
    assert result["runId"] == "run-1"
    assert not insight_gathering._jobs
