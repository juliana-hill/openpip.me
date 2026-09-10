import asyncio

from openpip_backend import channel_memory


def test_remember_channel_preference_is_context_specific_and_overwrites_same_context(monkeypatch) -> None:
    saved: dict[str, dict] = {}

    async def fake_read(_token: str, _folder: str, filename: str):
        return saved.get(filename)

    async def fake_write(_token: str, _folder: str, filename: str, data: dict):
        saved[filename] = data

    monkeypatch.setattr(channel_memory, "read_json_file", fake_read)
    monkeypatch.setattr(channel_memory, "write_json_file", fake_write)

    async def run():
        await channel_memory.remember_channel_preference(
            "token", "Maya Hair Studio", "phone", "They do not accept email.", "reschedule appointment",
        )
        await channel_memory.remember_channel_preference(
            "token", "Maya Hair Studio", "booking_system", "New appointments use the online booking page.", "new appointment",
        )
        return await channel_memory.remember_channel_preference(
            "token", "Maya Hair Studio", "phone", "The stylist confirmed rescheduling by phone.", "reschedule appointment",
        )

    record = asyncio.run(run())

    assert len(record["preferences"]) == 2
    assert asyncio.run(channel_memory.lookup_channel_memory("token", "Maya Hair Studio", "reschedule appointment")) == [
        record["preferences"][1]
    ]
    assert asyncio.run(channel_memory.lookup_channel_memory("token", "Maya Hair Studio", "new appointment"))[0]["channel"] == "booking_system"


def test_remember_channel_preference_rejects_guesses_without_a_reason() -> None:
    async def run():
        return await channel_memory.remember_channel_preference(
            "token", "Maya Hair Studio", "phone", "", "reschedule appointment",
        )

    try:
        asyncio.run(run())
    except ValueError as error:
        assert str(error) == "reason must not be empty"
    else:  # pragma: no cover - assertion keeps the test readable on failure
        raise AssertionError("missing reason should be rejected")
