"""chat_history_store.py — per-user Drive-backed chat history, one file per
calendar day (see the module's own docstring for the short-term vs working
memory split). Fakes Drive at the httpx transport level, same as
test_proposal_drive_store.py — see that module for _fake_drive()."""

from __future__ import annotations

import asyncio

import httpx
import pytest

from openpip_backend import chat_history_store as chs

from test_proposal_drive_store import _fake_drive


@pytest.fixture(autouse=True)
def _drive(monkeypatch):
    fake_send, files = _fake_drive()
    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)
    return files


def test_get_recent_messages_is_empty_for_an_unknown_session() -> None:
    result = asyncio.run(chs.get_recent_messages("token", "no-such-session"))
    assert result == []


def test_append_turn_creates_the_session_on_its_first_call() -> None:
    async def run():
        await chs.append_turn("token", "s1", "executive-assistant", "user", "Hi there", "Hi there")
        return await chs.list_sessions("token")

    sessions = asyncio.run(run())
    assert len(sessions) == 1
    assert sessions[0]["id"] == "s1"
    assert sessions[0]["skill"] == "executive-assistant"
    assert sessions[0]["title"] == "Hi there"


def test_appending_a_second_turn_does_not_duplicate_the_session_or_overwrite_its_title() -> None:
    async def run():
        await chs.append_turn("token", "s1", "executive-assistant", "user", "First message here", "First message here")
        await chs.append_turn("token", "s1", "executive-assistant", "assistant", "A reply", "A reply")
        return await chs.list_sessions("token")

    sessions = asyncio.run(run())
    assert len(sessions) == 1
    assert sessions[0]["title"] == "First message here"


def test_get_recent_messages_returns_strands_shaped_messages_oldest_first() -> None:
    async def run():
        for i in range(3):
            await chs.append_turn("token", "s1", "executive-assistant", "user", f"user {i}", "t")
            await chs.append_turn("token", "s1", "executive-assistant", "assistant", f"assistant {i}", "t")
        return await chs.get_recent_messages("token", "s1", limit=10)

    result = asyncio.run(run())
    assert [m["role"] for m in result] == ["user", "assistant"] * 3
    assert result[0] == {"role": "user", "content": [{"text": "user 0"}]}
    assert result[-1] == {"role": "assistant", "content": [{"text": "assistant 2"}]}


def test_get_recent_messages_caps_at_the_requested_limit() -> None:
    async def run():
        for i in range(8):
            await chs.append_turn("token", "s1", "executive-assistant", "user", f"msg {i}", "t")
        return await chs.get_recent_messages("token", "s1", limit=3)

    result = asyncio.run(run())
    assert len(result) == 3
    assert [m["content"][0]["text"] for m in result] == ["msg 5", "msg 6", "msg 7"]


def test_get_full_session_history_is_unbounded_and_newest_first() -> None:
    async def run():
        for i in range(5):
            await chs.append_turn("token", "s1", "executive-assistant", "user", f"msg {i}", "t")
        return await chs.get_full_session_history("token", "s1")

    history = asyncio.run(run())
    assert len(history) == 5
    assert [h["content"] for h in history] == ["msg 4", "msg 3", "msg 2", "msg 1", "msg 0"]


def test_two_sessions_do_not_leak_into_each_others_history() -> None:
    async def run():
        await chs.append_turn("token", "s1", "executive-assistant", "user", "session one", "t")
        await chs.append_turn("token", "s2", "executive-assistant", "user", "session two", "t")
        return await chs.get_full_session_history("token", "s1")

    history = asyncio.run(run())
    assert len(history) == 1
    assert history[0]["content"] == "session one"


def test_search_chat_history_matches_case_insensitively_across_sessions() -> None:
    async def run():
        await chs.append_turn("token", "s1", "executive-assistant", "user", "Let's talk about YogaX", "t")
        await chs.append_turn("token", "s2", "executive-assistant", "assistant", "yogax pricing is $40/mo", "t")
        await chs.append_turn("token", "s3", "executive-assistant", "user", "unrelated message", "t")
        return await chs.search_chat_history("token", "YOGAX")

    results = asyncio.run(run())
    assert len(results) == 2
    assert {r["content"] for r in results} == {"Let's talk about YogaX", "yogax pricing is $40/mo"}


def test_search_chat_history_returns_nothing_for_no_match() -> None:
    async def run():
        await chs.append_turn("token", "s1", "executive-assistant", "user", "hello", "t")
        return await chs.search_chat_history("token", "nonexistent-keyword")

    assert asyncio.run(run()) == []


def test_list_sessions_sorts_newest_first() -> None:
    async def run():
        await chs.append_turn("token", "s1", "executive-assistant", "user", "first", "first")
        await chs.append_turn("token", "s2", "executive-assistant", "user", "second", "second")
        return await chs.list_sessions("token")

    sessions = asyncio.run(run())
    assert [s["id"] for s in sessions] == ["s2", "s1"]
