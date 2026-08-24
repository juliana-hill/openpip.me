"""Asynchronous chat jobs for the FloatingAssistant.

The browser owns the polling loop.  Jobs live in this process only, like the
proposal-scan jobs, because the Google access token is supplied by the active
browser session and is never stored as durable backend state.  A job keeps the
Strands call off the request that starts it so the Express/FastAPI proxy can
return immediately.
"""

from __future__ import annotations

import asyncio
import hashlib
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from . import chat_history_store
from .agent import (
    DEFAULT_AGENT_NAME,
    build_executive_assistant,
    extract_agent_text,
    load_context_documents,
)
from .tools import build_get_chat_history_tool, build_search_chat_history_tool

_jobs: dict[str, dict[str, Any]] = {}


def _owner(access_token: str | None) -> str:
    if not access_token:
        return "anonymous"
    return hashlib.sha256(access_token.encode("utf-8")).hexdigest()[:24]


def _snapshot(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": job["id"],
        "status": job["status"],
        "createdAt": job["createdAt"],
        "sessionId": job["sessionId"],
        **({"reply": job["reply"]} if job.get("reply") is not None else {}),
        **({"error": job["error"]} if job.get("error") else {}),
    }


async def _run_chat(
    access_token: str | None,
    job: dict[str, Any],
    *,
    message: str,
    context: str,
    skill: str,
    agent_name: str,
) -> None:
    try:
        extra_tools: list[Any] = []
        recent_messages: list[dict[str, Any]] | None = None
        context_block = ""
        if access_token:
            context_block, recent_messages = await asyncio.gather(
                load_context_documents(access_token),
                chat_history_store.get_recent_messages(access_token, job["sessionId"]),
            )
            extra_tools = [
                build_get_chat_history_tool(access_token, job["sessionId"]),
                build_search_chat_history_tool(access_token),
            ]

        agent = build_executive_assistant(
            context_block,
            agent_name=agent_name,
            extra_tools=extra_tools,
            messages=recent_messages or None,
        )
        prompt = f"{context}\n\n{message}" if context else message
        result = await asyncio.to_thread(agent, prompt)
        reply = extract_agent_text(result)

        if access_token:
            title = message[:80]
            await chat_history_store.append_turn(
                access_token, job["sessionId"], skill, "user", message, title,
            )
            await chat_history_store.append_turn(
                access_token, job["sessionId"], skill, "assistant", reply, title,
            )

        job["reply"] = reply
        job["status"] = "completed"
    except Exception as error:
        job["status"] = "failed"
        job["error"] = str(error)


async def queue_chat(payload: dict[str, Any], access_token: str | None) -> dict[str, Any]:
    message = str(payload.get("message") or "").strip()
    if not message:
        raise ValueError("message must not be empty")

    session_id = str(payload.get("sessionId") or "") or str(uuid4())
    job: dict[str, Any] = {
        "id": str(uuid4()),
        "owner": _owner(access_token),
        "status": "running",
        "createdAt": datetime.now(UTC).isoformat(),
        "sessionId": session_id,
        "reply": None,
        "error": None,
    }
    _jobs[job["id"]] = job
    asyncio.create_task(_run_chat(
        access_token,
        job,
        message=message,
        context=str(payload.get("context") or "").strip(),
        skill=str(payload.get("skill") or "executive-assistant"),
        agent_name=str(payload.get("agentName") or "").strip() or DEFAULT_AGENT_NAME,
    ))
    return _snapshot(job)


def get_chat_progress(access_token: str | None, job_id: str) -> dict[str, Any] | None:
    job = _jobs.get(job_id)
    if not job or job.get("owner") != _owner(access_token):
        return None
    return _snapshot(job)
