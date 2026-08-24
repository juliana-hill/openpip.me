"""Working-memory tools for the Executive Assistant chat.

Short-term memory (the last several turns of the *current* session) is
seeded directly into the Strands Agent's own `messages` on every /agent/chat
call (see app.py, chat_history_store.get_recent_messages) — cheap, always-
available immediate context that needs no tool round-trip. These two tools
are for the model to call itself when it needs more than that: get_chat_
history for reading the rest of the current session in full, search_chat_
history for keyword recall across every past session and skill. Ported from
~/Projects/Personal/travel-agent's own get_chat_history / search_chat_
history MCP tools (see that project's src/mcp/task-tools.ts) — same
descriptions, same "nothing is auto-loaded, call this" framing.

Built as factories (build_get_chat_history_tool / build_search_chat_history_
tool), not bare module-level @tool functions, because each needs its own
request's access_token — and get_chat_history additionally needs the
current session_id — closed over per chat request rather than threaded
through as a tool argument the model would have to know to supply.

Neither of these is long-term memory — both only ever read the still-
existing chat-session transcripts these tools' own store holds. See
chat_history_store.py's module docstring for that distinction.
"""

from __future__ import annotations

import json
from typing import Any, Callable, TypeVar

from .. import chat_history_store

try:
    from strands import tool
except ImportError:  # Keep local fallback mode importable without Strands installed.
    F = TypeVar("F", bound=Callable[..., Any])

    def tool(func: F | None = None, **_kwargs: Any):  # type: ignore[no-untyped-def]
        def decorate(target: F) -> F:
            return target

        return decorate(func) if func is not None else decorate


def build_get_chat_history_tool(access_token: str, session_id: str | None) -> Any:
    @tool(
        name="get_chat_history",
        description=(
            "Read the FULL message history of this exact conversation session — "
            "every turn, no cap, no keyword needed, ordered NEWEST FIRST (most "
            "recent turn at the top). Only the most recent turns of this session "
            "are already in your context; call this when you need something "
            "earlier in this same conversation that isn't."
        ),
    )
    async def get_chat_history() -> str:
        if not session_id:
            return "No session ID available for this chat yet — this may be the first message of a new session."
        history = await chat_history_store.get_full_session_history(access_token, session_id)
        if not history:
            return "No messages found for this session yet."
        return json.dumps(history)

    return get_chat_history


def build_search_chat_history_tool(access_token: str) -> Any:
    @tool(
        name="search_chat_history",
        description=(
            "Search across EVERY past conversation (every skill, full history — "
            "not just this session's recent turns) for a keyword or topic. Use "
            "this when the user references something they told you before that "
            "isn't in your currently loaded context — a plan they described, a "
            "decision, specific details from an earlier conversation. Reaches "
            "into OTHER sessions instead of asking the user to repeat themselves "
            "or re-paste something they already gave you."
        ),
    )
    async def search_chat_history(query: str) -> str:
        results = await chat_history_store.search_chat_history(access_token, query)
        if not results:
            return f'No past conversation turns found mentioning "{query}".'
        return json.dumps(results)

    return search_chat_history
