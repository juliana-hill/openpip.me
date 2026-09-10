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


def test_upsert_insight_accepts_schedule_category(monkeypatch) -> None:
    async def run():
        return await insight_memory.upsert_insight(
            "token", memory_key="schedule:work:event-2021-09-14",
            category="schedule", subject="Work event",
            fact="A work event was scheduled for September 14, 2021.", confidence="high",
            source_references=[{"id": "calendar:event-1", "kind": "calendar"}],
        )

    # The Drive write is intentionally not exercised here; the validator is
    # the regression covered by this test.
    async def fake_read(*_args):
        return None

    async def fake_write(*_args):
        return None

    monkeypatch.setattr(insight_memory, "read_json_file", fake_read)
    monkeypatch.setattr(insight_memory, "write_json_file", fake_write)
    result = asyncio.run(run())
    assert result["category"] == "schedule"


def test_lookup_matches_terms_across_stable_key_punctuation(monkeypatch) -> None:
    async def fake_list(_token: str, _folder: str):
        return {
            "old": {
                "memoryKey": "healthcare:provider:smith",
                "category": "healthcare",
                "subject": "Care coordination",
                "fact": "The user started seeing Dr. Smith.",
            },
            "other": {
                "memoryKey": "work:employer:acme",
                "category": "work",
                "subject": "Acme",
                "fact": "The user works at Acme.",
            },
        }

    monkeypatch.setattr(insight_memory, "list_json_files", fake_list)

    result = asyncio.run(insight_memory.lookup_insights("token", "healthcare provider"))

    assert [item["memoryKey"] for item in result] == ["healthcare:provider:smith"]


def test_generic_holiday_insight_is_not_user_specific() -> None:
    assert insight_memory.is_generic_holiday_insight(
        fact="Columbus Day is a public holiday on October 11, 2021.",
        source_references=[{"id": "calendar:event-1", "kind": "calendar"}],
    )
    assert not insight_memory.is_generic_holiday_insight(
        fact="The user has a hair appointment scheduled on a public holiday.",
        source_references=[{"id": "calendar:event-1", "kind": "calendar"}],
    )
