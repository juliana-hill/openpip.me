"""Chat history storage for the FloatingAssistant, per-user in Drive.

Ported from ~/Projects/Personal/travel-agent's storage.ts / user-data.ts /
agent.ts chat-history functions, adapted from that project's local-disk-or-
Drive-toggle to this project's Drive-only, per-user-token model (same
pattern as proposal_drive_store.py and inbox_triage.py's per-contact files
— see those modules' own docstrings for why storage lives in the user's own
visible Drive rather than a local database).

Layout (under the user's own visible "OpenPip" Drive folder, one file per
calendar day, keyed by each session's own creation date so a session's
turns always land in one file even if the conversation runs past midnight):

    OpenPip/chat-sessions/<YYYY-MM-DD>.json   {"sessions": [...], "messages": [...]}

Two memory mechanisms sit on top of this store so far:

  - Short-term memory: the most recent turns of the *current* session,
    fetched by get_recent_messages() and seeded directly into the Strands
    Agent's own `messages` before every /agent/chat call (see app.py) — no
    tool round-trip needed for ordinary immediate continuity.
  - Working memory: everything else still on record, deliberately NOT
    injected into the prompt. get_full_session_history() and
    search_chat_history() back the two Strands tools in
    tools/chat_history.py that the model calls itself, on demand, exactly
    the way travel-agent's own get_chat_history / search_chat_history tools
    work.

Neither of these is long-term memory. Both read raw transcripts out of this
same store, so both go away with a session — deleting a session's turns
(not yet a feature here, but see travel-agent's handleDeleteChatSession)
would take a fact learned in it down too. Real long-term memory — durable
facts the assistant keeps knowing about the user on purpose, on record even
after the conversation that surfaced them is gone — is a distinct,
deliberately-curated store (see travel-agent's agent-memory.json /
save_insight / get_insights for the shape that takes there) and hasn't been
built here yet.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from .google_drive_docs import delete_json_file, list_json_files, read_json_file, write_json_file

_CHAT_SESSIONS_FOLDER = "OpenPip/chat-sessions"
# travel-agent's own search_chat_history cap — bounded by match count, not
# recency, so an old but relevant turn is still findable without unbounded
# growth of what gets handed back to the model.
_SEARCH_RESULT_LIMIT = 30


def _day_key(timestamp_ms: int) -> str:
    return datetime.fromtimestamp(timestamp_ms / 1000, tz=UTC).strftime("%Y-%m-%d")


def _now_ms() -> int:
    return int(datetime.now(UTC).timestamp() * 1000)


async def _read_day_file(access_token: str, day: str) -> dict[str, list[dict[str, Any]]]:
    data = await read_json_file(access_token, _CHAT_SESSIONS_FOLDER, f"{day}.json")
    if not isinstance(data, dict):
        return {"sessions": [], "messages": []}
    sessions = data.get("sessions") if isinstance(data.get("sessions"), list) else []
    messages = data.get("messages") if isinstance(data.get("messages"), list) else []
    return {"sessions": sessions, "messages": messages}


async def _all_day_files(access_token: str) -> list[dict[str, list[dict[str, Any]]]]:
    files = await list_json_files(access_token, _CHAT_SESSIONS_FOLDER)
    results: list[dict[str, list[dict[str, Any]]]] = []
    for data in files.values():
        if not isinstance(data, dict):
            continue
        sessions = data.get("sessions") if isinstance(data.get("sessions"), list) else []
        messages = data.get("messages") if isinstance(data.get("messages"), list) else []
        results.append({"sessions": sessions, "messages": messages})
    return results


async def _find_session_day(access_token: str, session_id: str) -> str | None:
    """Every existing chat-sessions/<day>.json is small (one calendar day's
    worth of conversation for this one user), so scanning all of them to
    find which day a session lives under is the same trade travel-agent's
    own readAllChatSessions/getFullSessionHistory make — simplicity over a
    separate session_id -> day index that would need to stay in sync."""
    files = await list_json_files(access_token, _CHAT_SESSIONS_FOLDER)
    for day, data in files.items():
        if not isinstance(data, dict):
            continue
        for session in data.get("sessions", []) or []:
            if isinstance(session, dict) and session.get("id") == session_id:
                return day
    return None


async def ensure_session(access_token: str, session_id: str, skill: str, title: str) -> None:
    """Record a session's existence on its first turn — creates the
    {id, skill, createdAt, title} entry get_full_session_history and
    search_chat_history both key off. A no-op if the session is already
    recorded (append_turn calls this before every turn, not just the
    first)."""
    if await _find_session_day(access_token, session_id):
        return
    day = _day_key(_now_ms())
    data = await _read_day_file(access_token, day)
    data["sessions"].append({
        "id": session_id, "skill": skill, "createdAt": _now_ms(),
        "title": title[:80],
    })
    await write_json_file(access_token, _CHAT_SESSIONS_FOLDER, f"{day}.json", data)


async def append_turn(access_token: str, session_id: str, skill: str, role: str, message: str, title: str) -> None:
    """Append one turn (user or assistant) to its session's day-file. Safe
    to call for a brand-new session — ensure_session() records the session
    itself first if this is its first turn."""
    await ensure_session(access_token, session_id, skill, title)
    day = await _find_session_day(access_token, session_id)
    if day is None:  # pragma: no cover - ensure_session above guarantees this
        day = _day_key(_now_ms())
    data = await _read_day_file(access_token, day)
    index = sum(1 for m in data["messages"] if isinstance(m, dict) and m.get("sessionId") == session_id)
    data["messages"].append({
        "id": str(uuid4()), "sessionId": session_id, "index": index,
        "role": role, "createdAt": _now_ms(), "message": message,
    })
    await write_json_file(access_token, _CHAT_SESSIONS_FOLDER, f"{day}.json", data)


async def get_recent_messages(access_token: str, session_id: str, limit: int = 10) -> list[dict[str, Any]]:
    """The last `limit` turns of one session, oldest-first, already shaped
    as Strands Message dicts — seeded directly into Agent(messages=...) for
    short-term memory. Unlike get_full_session_history (working memory,
    newest-first, unbounded), this is meant to sit directly in the prompt,
    so it stays small and in natural reading order."""
    day = await _find_session_day(access_token, session_id)
    if day is None:
        return []
    data = await _read_day_file(access_token, day)
    turns = sorted(
        (m for m in data["messages"] if isinstance(m, dict) and m.get("sessionId") == session_id),
        key=lambda m: m.get("index", 0),
    )
    recent = turns[-limit:]
    return [
        {"role": turn.get("role"), "content": [{"text": str(turn.get("message") or "")}]}
        for turn in recent
        if turn.get("role") in ("user", "assistant")
    ]


async def get_full_session_history(access_token: str, session_id: str) -> list[dict[str, Any]]:
    """Full, unbounded read of one exact session — every turn, no cap, no
    keyword required, newest-first (most recent context reads first). This
    backs the get_chat_history tool; never injected into the prompt
    directly."""
    day = await _find_session_day(access_token, session_id)
    if day is None:
        return []
    data = await _read_day_file(access_token, day)
    turns = [m for m in data["messages"] if isinstance(m, dict) and m.get("sessionId") == session_id]
    turns.sort(key=lambda m: m.get("createdAt", 0), reverse=True)
    return [{"role": t.get("role"), "content": t.get("message"), "ts": t.get("createdAt")} for t in turns]


async def search_chat_history(access_token: str, query: str) -> list[dict[str, Any]]:
    """Keyword search across every stored conversation (every session,
    every skill) — for recall beyond the current session or the last
    _SEARCH_RESULT_LIMIT turns any other helper here surfaces. Deliberately
    unbounded by recency, bounded by match count instead, so an old but
    relevant turn is still findable. Backs the search_chat_history tool."""
    needle = query.casefold()
    matches: list[dict[str, Any]] = []
    for data in await _all_day_files(access_token):
        for message in data["messages"]:
            if not isinstance(message, dict):
                continue
            text = str(message.get("message") or "")
            if needle in text.casefold():
                matches.append(message)
    matches.sort(key=lambda m: m.get("createdAt", 0))
    return [
        {"role": m.get("role"), "content": m.get("message"), "ts": m.get("createdAt")}
        for m in matches[-_SEARCH_RESULT_LIMIT:]
    ]


async def list_sessions(access_token: str) -> list[dict[str, Any]]:
    """Every recorded session across every day-file, newest-first — for a
    future "Past conversations" list once the frontend actually reads real
    data instead of the dead IndexedDB stub it reads today."""
    sessions: list[dict[str, Any]] = []
    for data in await _all_day_files(access_token):
        sessions.extend(s for s in data["sessions"] if isinstance(s, dict))
    sessions.sort(key=lambda s: s.get("createdAt", 0), reverse=True)
    return sessions


async def get_session(access_token: str, session_id: str) -> dict[str, Any] | None:
    """Return one session plus its stored turns in display order."""
    day = await _find_session_day(access_token, session_id)
    if day is None:
        return None
    data = await _read_day_file(access_token, day)
    session = next(
        (s for s in data["sessions"] if isinstance(s, dict) and s.get("id") == session_id),
        None,
    )
    if session is None:
        return None
    messages = [
        message for message in data["messages"]
        if isinstance(message, dict) and message.get("sessionId") == session_id
    ]
    messages.sort(key=lambda message: message.get("index", 0))
    return {"session": session, "messages": messages}


async def delete_session(access_token: str, session_id: str) -> bool:
    """Delete one session's transcript while leaving other days/sessions intact."""
    day = await _find_session_day(access_token, session_id)
    if day is None:
        return False
    data = await _read_day_file(access_token, day)
    data["sessions"] = [
        session for session in data["sessions"]
        if not isinstance(session, dict) or session.get("id") != session_id
    ]
    data["messages"] = [
        message for message in data["messages"]
        if not isinstance(message, dict) or message.get("sessionId") != session_id
    ]
    filename = f"{day}.json"
    if data["sessions"] or data["messages"]:
        await write_json_file(access_token, _CHAT_SESSIONS_FOLDER, filename, data)
    else:
        await delete_json_file(access_token, _CHAT_SESSIONS_FOLDER, filename)
    return True
