"""Small, durable communication-channel memories stored in the user's Drive.

These are deliberately narrower than a general agent-memory system. A record
answers one practical question: for this person or business, in this kind of
situation, which channel has the user explicitly preferred or actually used?

The memory is visible under ``OpenPip/memory/channel-preferences`` and is
separate from raw chat transcripts. A preference is only written by an
explicit agent tool call (or another clearly observed application event); the
agent must never turn a guess into a durable preference.
"""

from __future__ import annotations

import hashlib
import re
from datetime import UTC, datetime
from typing import Any

from .google_drive_docs import list_json_files, read_json_file, write_json_file

CHANNEL_MEMORY_FOLDER = "OpenPip/memory/channel-preferences"
VALID_CHANNELS = {"phone", "email", "booking_system", "text", "unknown"}
_MAX_PREFERENCES_PER_SUBJECT = 12


def normalize_subject(subject: str) -> str:
    """Create a stable, human-readable match key without storing secrets."""
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9@.+_-]+", " ", subject.casefold())).strip()


def _filename(subject_key: str) -> str:
    digest = hashlib.sha256(subject_key.encode("utf-8")).hexdigest()[:32]
    return f"{digest}.json"


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _valid_record(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    subject = str(value.get("subject") or "").strip()
    subject_key = str(value.get("subjectKey") or "").strip()
    preferences = value.get("preferences")
    if not subject or not subject_key or not isinstance(preferences, list):
        return None
    cleaned = [
        preference for preference in preferences
        if isinstance(preference, dict)
        and str(preference.get("channel") or "") in VALID_CHANNELS
        and str(preference.get("context") or "").strip()
    ]
    return {
        "version": 1,
        "subject": subject,
        "subjectKey": subject_key,
        "preferences": cleaned[-_MAX_PREFERENCES_PER_SUBJECT:],
        "updatedAt": str(value.get("updatedAt") or ""),
    }


async def list_channel_memories(access_token: str) -> list[dict[str, Any]]:
    """Return all valid channel memories, newest records first."""
    files = await list_json_files(access_token, CHANNEL_MEMORY_FOLDER)
    records = [record for value in files.values() if (record := _valid_record(value))]
    records.sort(key=lambda record: record.get("updatedAt", ""), reverse=True)
    return records


async def lookup_channel_memory(
    access_token: str,
    subject: str,
    context: str = "",
) -> list[dict[str, Any]]:
    """Find preferences for one subject, optionally narrowed to a context."""
    subject_key = normalize_subject(subject)
    context_key = normalize_subject(context) if context.strip() else ""
    record = await read_json_file(access_token, CHANNEL_MEMORY_FOLDER, _filename(subject_key))
    validated = _valid_record(record)
    if not validated or validated["subjectKey"] != subject_key:
        return []
    if not context_key:
        return validated["preferences"]
    return [
        preference for preference in validated["preferences"]
        if normalize_subject(str(preference.get("context") or "")) == context_key
    ]


async def remember_channel_preference(
    access_token: str,
    subject: str,
    channel: str,
    reason: str,
    context: str = "general",
    source: str = "explicit_user_statement",
) -> dict[str, Any]:
    """Upsert one explicit or observed preference and return the saved record.

    The subject file is stable, and a matching normalized context is replaced
    in place. Different contexts remain separate intentionally.
    """
    clean_subject = subject.strip()[:160]
    subject_key = normalize_subject(clean_subject)
    clean_channel = channel.strip().casefold()
    clean_context = context.strip()[:160] or "general"
    clean_reason = reason.strip()[:500]
    if not clean_subject:
        raise ValueError("subject must not be empty")
    if clean_channel not in VALID_CHANNELS:
        raise ValueError(f"channel must be one of: {', '.join(sorted(VALID_CHANNELS))}")
    if not clean_reason:
        raise ValueError("reason must not be empty")

    existing = _valid_record(
        await read_json_file(access_token, CHANNEL_MEMORY_FOLDER, _filename(subject_key))
    ) or {
        "version": 1,
        "subject": clean_subject,
        "subjectKey": subject_key,
        "preferences": [],
        "updatedAt": "",
    }
    preferences = [
        preference for preference in existing["preferences"]
        if normalize_subject(str(preference.get("context") or "")) != normalize_subject(clean_context)
    ]
    preferences.append({
        "context": clean_context,
        "channel": clean_channel,
        "reason": clean_reason,
        "source": source.strip()[:80] or "explicit_user_statement",
        "recordedAt": _now(),
    })
    saved = {
        "version": 1,
        "subject": existing.get("subject") or clean_subject,
        "subjectKey": subject_key,
        "preferences": preferences[-_MAX_PREFERENCES_PER_SUBJECT:],
        "updatedAt": _now(),
    }
    await write_json_file(access_token, CHANNEL_MEMORY_FOLDER, _filename(subject_key), saved)
    return saved


def format_channel_memory_context(records: list[dict[str, Any]]) -> str:
    """Format durable memories for an agent system prompt without extra prose."""
    if not records:
        return ""
    return (
        "## Known communication channel preferences\n"
        "Use these only when the person/business and situation match. A more "
        "specific context overrides general. If the evidence does not match, "
        "do not apply the memory.\n"
        f"{records}"
    )
