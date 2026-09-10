import asyncio

from openpip_backend import insight_memory


def test_upsert_insight_edits_the_same_stable_memory(monkeypatch) -> None:
    saved: dict[str, dict] = {}

    async def fake_read(_token: str, _folder: str, filename: str):
        return saved.get(filename)

    async def fake_write(_token: str, _folder: str, filename: str, data: dict):
        saved[filename] = data

    monkeypatch.setattr(insight_memory, "read_json_file", fake_read)
    monkeypatch.setattr(insight_memory, "write_json_file", fake_write)

    async def run():
        first = await insight_memory.upsert_insight(
            "token", memory_key="routine:hair-appointments:rescheduling",
            category="routine", subject="Hair appointments",
            fact="Rescheduling this appointment is handled by phone.", confidence="high",
            source_references=[{"id": "calendar:event-1", "kind": "calendar"}],
        )
        second = await insight_memory.upsert_insight(
            "token", memory_key="routine:hair-appointments:rescheduling",
            category="routine", subject="Hair appointments",
            fact="Rescheduling this appointment is handled by phone during business hours.", confidence="high",
            source_references=[{"id": "email:gmail-2", "kind": "email"}],
        )
        return first, second

    first, second = asyncio.run(run())

    assert first["status"] == "saved"
    assert second["status"] == "updated"
    assert len(saved) == 1
    record = next(iter(saved.values()))
    assert record["fact"].endswith("business hours.")
    assert {item["id"] for item in record["evidence"]} == {"calendar:event-1", "email:gmail-2"}
