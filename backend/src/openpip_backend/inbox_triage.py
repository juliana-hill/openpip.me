"""Approval-first Inbox Assistant triage.

The triage worker only reads unread Gmail messages and stores its suggestions
in the user's visible OpenPip Drive folder. It deliberately does not archive,
trash, send, or create Google Tasks: those are review-time actions.
"""

from __future__ import annotations

import asyncio
import hashlib
import re
from collections import Counter
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from .google_drive_docs import list_json_files, read_json_file, write_json_file
from .google_drive_store import read_drive_app_data
from .google_workspace import (
    fetch_gmail_labels,
    fetch_gmail_messages,
    fetch_gmail_message,
    fetch_google_contacts,
    modify_gmail_message_labels,
    trash_gmail_messages,
)

TRIAGE_FOLDER = "OpenPip/inbox"
TRIAGE_FILE = "triage.json"
TRIAGE_HISTORY_LIMIT = 10
CONTACTS_FOLDER = "OpenPip/contacts"
CONTACT_PROFILE_FILE = "profile.json"
PAGE_SIZE = 100
TRIAGE_LABEL_NAMES = {
    "file": "OpenPip/Triage/Filed",
    "reply": "OpenPip/Triage/Reply",
    "task": "OpenPip/Triage/Task",
}

_jobs: dict[str, dict[str, Any]] = {}
_active_jobs: dict[str, str] = {}

_REPLY_TERMS = re.compile(r"\b(reply|respond|question|could you|can you|let me know|available|meeting|schedule|follow up|following up|request)\b", re.I)
_FILE_TERMS = re.compile(r"\b(unsubscribe|newsletter|promotion|promotional|sale|offer|discount|coupon|promo|deal|receipt|order confirmation|shipping|tracking|notification|alert|marketing|rewards|membership|benefit|refund|refunded|price adjustment|credit received|uber|lyft|doordash)\b", re.I)
_TASK_TERMS = re.compile(
    r"\b(action required|deadline|due date|invoice due|payment due|renewal required|proposal|quote|review required|please review|approve|approval required|please confirm|confirm by|complete|submit|schedule (?:an?|your|the) appointment|book (?:an?|your|the) appointment|make (?:an?|your|the) appointment|follow[- ]up appointment)\b",
    re.I,
)

# Gmail's own ML categorizer (the Promotions/Updates inbox tabs) reads the
# full message, not just the subject/snippet _message_text() is limited to —
# real marketing copy is written to avoid literal words like "sale" or
# "discount" ("Warm grains, roasted veg, hearty protein." is still an ad),
# so keyword matching alone misses most of it. This is a fallback, checked
# only once none of the keyword patterns above already matched — a message
# Gmail categorized as promotional/updates that also reads like it needs a
# reply or contains a real deadline should keep being classified as that,
# not silently reclassified as filing because of its category.
_LOW_PRIORITY_CATEGORIES = frozenset({"CATEGORY_PROMOTIONS", "CATEGORY_UPDATES"})


def contact_id_from_resource(resource_name: str) -> str:
    contact_id = resource_name.removeprefix("people/").replace("/", "_")
    return contact_id


def contact_interactions_folder(resource_name: str) -> str:
    return f"{CONTACTS_FOLDER}/{contact_id_from_resource(resource_name)}/interactions"


def contact_folder(resource_name: str) -> str:
    """Return the visible Drive folder for one tracked Google Contact."""
    return f"{CONTACTS_FOLDER}/{contact_id_from_resource(resource_name)}"


async def read_contact_profile(
    access_token: str,
    resource_name: str,
    fallback: dict[str, Any] | None = None,
) -> dict[str, Any]:
    profile = await read_json_file(access_token, contact_folder(resource_name), CONTACT_PROFILE_FILE)
    if isinstance(profile, dict):
        return profile
    return dict(fallback or {})


async def ensure_contact_profile(
    access_token: str,
    resource_name: str,
    fallback: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Read a profile and migrate legacy app-data wrapper fields on demand."""
    profile = await read_json_file(access_token, contact_folder(resource_name), CONTACT_PROFILE_FILE)
    if isinstance(profile, dict):
        return profile
    profile = {key: value for key, value in (fallback or {}).items() if key != "interactions"}
    await write_contact_profile(access_token, resource_name, profile)
    return profile


async def write_contact_profile(access_token: str, resource_name: str, profile: dict[str, Any]) -> None:
    """Persist wrapper fields Google Contacts does not own in profile.json."""
    await write_json_file(access_token, contact_folder(resource_name), CONTACT_PROFILE_FILE, profile)


async def read_contact_interactions(
    access_token: str,
    resource_name: str,
    fallback: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    chunks = await list_json_files(access_token, contact_interactions_folder(resource_name))
    interactions = [
        chunk["interaction"]
        for chunk in chunks.values()
        if isinstance(chunk, dict) and isinstance(chunk.get("interaction"), dict)
    ]
    if interactions:
        return sorted(interactions, key=lambda item: str(item.get("date") or ""))
    # One-time compatibility for interactions created before per-contact files
    # existed. The next new event is still written to the per-event path.
    return [item for item in (fallback or []) if isinstance(item, dict)]


async def ensure_contact_interactions(
    access_token: str,
    resource_name: str,
    fallback: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Read the interaction directory, migrating legacy inline events once."""
    chunks = await list_json_files(access_token, contact_interactions_folder(resource_name))
    interactions = [
        chunk["interaction"]
        for chunk in chunks.values()
        if isinstance(chunk, dict) and isinstance(chunk.get("interaction"), dict)
    ]
    if interactions:
        return sorted(interactions, key=lambda item: str(item.get("date") or ""))
    legacy = [item for item in (fallback or []) if isinstance(item, dict)]
    if legacy:
        await asyncio.gather(*(
            write_contact_interaction(access_token, resource_name, interaction)
            for interaction in legacy
        ))
    return sorted(legacy, key=lambda item: str(item.get("date") or ""))


async def write_contact_interaction(access_token: str, resource_name: str, interaction: dict[str, Any]) -> None:
    """Persist one bounded interaction at contacts/<id>/interactions/<timestamp>.json."""
    timestamp = datetime.now(UTC).isoformat(timespec="microseconds").replace(":", "-")
    await write_json_file(
        access_token,
        contact_interactions_folder(resource_name),
        f"{timestamp}.json",
        {"version": 1, "contactId": resource_name, "interaction": interaction},
    )


def _owner(access_token: str) -> str:
    return hashlib.sha256(access_token.encode("utf-8")).hexdigest()[:24]


def _snapshot(job: dict[str, Any]) -> dict[str, Any]:
    return {**job, "draftedMessageIds": list(job.get("draftedMessageIds", []))}


async def _all_unread_messages(access_token: str) -> list[dict[str, Any]]:
    first_page, total = await fetch_gmail_messages(
        access_token,
        unread_only=True,
        page=1,
        page_size=PAGE_SIZE,
    )
    messages = list(first_page)
    page_count = (total + PAGE_SIZE - 1) // PAGE_SIZE
    for page in range(2, page_count + 1):
        page_messages, _ = await fetch_gmail_messages(
            access_token,
            unread_only=True,
            page=page,
            page_size=PAGE_SIZE,
        )
        messages.extend(page_messages)
    return messages


def _message_text(message: dict[str, Any]) -> str:
    # Only the actual content — a sender address or display name containing a
    # bare classification word (e.g. "marketing@agency.com", a "Rewards"
    # program) must not by itself make an otherwise ordinary message look
    # promotional, actionable, or reply-worthy.
    return " ".join(
        str(message.get(field) or "")
        for field in ("subject", "snippet")
    ).strip()


def _first_name(value: str) -> str:
    clean = re.sub(r"<[^>]+>", "", value).strip().strip('"')
    return clean.split()[0] if clean else "there"


def _draft_reply(message: dict[str, Any], tone: dict[str, str] | None = None) -> str:
    name = _first_name(str(message.get("from") or "there"))
    subject = str(message.get("subject") or "your message")
    tone = tone or {}
    greeting = tone.get("greeting") or "Hi"
    closing = tone.get("closing") or "Best"
    if tone.get("verbosity") == "detailed":
        body = (
            f"Thanks for reaching out about {subject}. I appreciate the context and am reviewing the details now. "
            "I’ll follow up shortly with next steps."
        )
    else:
        body = f"Thanks for reaching out about {subject}. I’m reviewing this and will follow up shortly."
    return (
        f"{greeting} {name},\n\n"
        f"{body}\n\n"
        f"{closing},\nJuliana"
    )


def _tone_profile(messages: list[dict[str, Any]]) -> dict[str, str]:
    """Infer a small, explainable tone profile from the user's sent replies."""
    greetings: Counter[str] = Counter()
    closings: Counter[str] = Counter()
    word_counts: list[int] = []
    greeting_terms = {"hi", "hello", "hey", "dear"}
    closing_terms = {"best", "thanks", "thank you", "regards", "warmly", "cheers", "sincerely", "talk soon"}
    for message in messages:
        body = str(message.get("body") or message.get("snippet") or "")
        words = re.findall(r"\b[\w’'-]+\b", body)
        if words:
            word_counts.append(len(words))
        lines = [line.strip() for line in body.splitlines() if line.strip()]
        if lines:
            first_word = lines[0].split(maxsplit=1)[0].rstrip(",:!").casefold()
            if first_word in greeting_terms:
                greetings[first_word] += 1
            for line in reversed(lines[-5:]):
                normalized = line.rstrip(",:!.").casefold()
                if normalized in closing_terms:
                    closings[normalized] += 1
                    break
    profile: dict[str, str] = {}
    if greetings:
        profile["greeting"] = greetings.most_common(1)[0][0].capitalize()
    if closings:
        profile["closing"] = closings.most_common(1)[0][0].capitalize()
    if word_counts and sum(word_counts) / len(word_counts) >= 110:
        profile["verbosity"] = "detailed"
    else:
        profile["verbosity"] = "concise"
    return profile


def _is_no_reply_sender(sender_email: str) -> bool:
    return bool(re.search(r"(?:^|[._-])(no[-_.]?reply|donotreply|do[-_.]?not[-_.]?reply|mailer-daemon)(?:$|[+@._-])", sender_email.casefold()))


async def _historical_sender_tone(access_token: str, sender_email: str) -> dict[str, str]:
    """Build a tone profile from up to five previous sent replies to a sender."""
    if not sender_email or _is_no_reply_sender(sender_email):
        return {}
    sent_messages, _ = await fetch_gmail_messages(
        access_token,
        gmail_query=f"from:me to:{sender_email} -in:drafts",
        page=1,
        page_size=5,
    )
    full_messages: list[dict[str, Any]] = []
    for message in sent_messages[:5]:
        message_id = str(message.get("id") or "").removeprefix("gmail_")
        if not message_id:
            continue
        full_messages.append(await fetch_gmail_message(access_token, message_id))
    # A single historical message is not enough to establish the user's normal
    # reply behavior. Without a pattern, leave the inbox untouched instead of
    # inventing a reply.
    if len(full_messages) < 2:
        return {}
    profile = _tone_profile(full_messages)
    profile["canDraft"] = "true"
    return profile


def _suggestion(message: dict[str, Any]) -> dict[str, Any] | None:
    text = _message_text(message)
    if not text:
        return None
    message_id = str(message.get("id") or "")
    if not message_id:
        return None
    context = {
        "messageId": message_id,
        "subject": str(message.get("subject") or "(no subject)"),
        "sender": str(message.get("from") or message.get("fromEmail") or "Unknown sender"),
        "fromEmail": str(message.get("fromEmail") or ""),
        "date": str(message.get("date") or ""),
    }
    # Transactional/promotional mail wins over generic action words such as
    # "due" or "confirm" so receipts and refunds do not become tasks.
    if _FILE_TERMS.search(text):
        return {
            **context,
            "kind": "file",
            "action": "Review deletion suggestion",
            "reason": "This looks like a receipt, notification, promotion, or other low-priority update that may no longer be needed.",
            "deleteSuggested": True,
            "createdAt": datetime.now(UTC).isoformat(),
        }
    if _TASK_TERMS.search(text):
        return {
            **context,
            "kind": "task",
            "action": "Review task suggestion",
            "reason": "This message appears to contain an action, deadline, approval, or follow-up.",
            "createdAt": datetime.now(UTC).isoformat(),
            "taskSuggested": True,
        }
    if _REPLY_TERMS.search(text):
        return {
            **context,
            "kind": "reply",
            "action": "Review reply suggestion",
            "reason": "This message appears to contain a question, request, or follow-up that may need a response.",
            "createdAt": datetime.now(UTC).isoformat(),
            "draft": _draft_reply(message),
            "taskSuggested": bool(_TASK_TERMS.search(text)),
        }
    label_ids = {str(label_id) for label_id in message.get("labelIds", []) if label_id}
    if label_ids & _LOW_PRIORITY_CATEGORIES:
        return {
            **context,
            "kind": "file",
            "action": "Review deletion suggestion",
            "reason": "Gmail categorizes this as promotional or updates mail, which is usually safe to clear out.",
            "deleteSuggested": True,
            "createdAt": datetime.now(UTC).isoformat(),
        }
    return None


async def _historical_sender_label_counts(
    access_token: str,
    sender_email: str,
    user_labels: dict[str, str],
) -> tuple[int, Counter[str]]:
    """Return read-message label history for one sender.

    Gmail is queried by sender rather than downloading the whole mailbox. Only
    user labels are counted; system labels and OpenPip's own fallback labels
    are not treated as evidence of the user's filing habits.
    """
    if not sender_email:
        return 0, Counter()
    first_page, total = await fetch_gmail_messages(
        access_token,
        gmail_query=f"from:{sender_email} -is:unread",
        page=1,
        page_size=100,
    )
    messages = list(first_page)
    page_count = (total + 99) // 100
    for page in range(2, page_count + 1):
        page_messages, _ = await fetch_gmail_messages(
            access_token,
            gmail_query=f"from:{sender_email} -is:unread",
            page=page,
            page_size=100,
        )
        messages.extend(page_messages)
    counts: Counter[str] = Counter()
    for message in messages:
        for label_id in message.get("labelIds", []):
            label_id = str(label_id)
            if label_id in user_labels:
                counts[label_id] += 1
    return len(messages), counts


def _historical_label(
    message_count: int,
    label_counts: Counter[str],
    user_labels: dict[str, str],
) -> tuple[str, str] | None:
    """Choose a label only when the sender's past treatment is consistent."""
    if message_count < 2 or not label_counts:
        return None
    label_id, count = label_counts.most_common(1)[0]
    if count < 2 or count / message_count < 0.6:
        return None
    return label_id, user_labels[label_id]


async def _run_job(access_token: str, owner: str, job: dict[str, Any], messages: list[dict[str, Any]]) -> None:
    try:
        saved = await read_json_file(access_token, TRIAGE_FOLDER, TRIAGE_FILE) or {}
        previous_suggestions = saved.get("suggestions") if isinstance(saved.get("suggestions"), dict) else {}
        saved_history = saved.get("history") if isinstance(saved.get("history"), list) else []
        previous_current_run = saved.get("currentRun") if isinstance(saved.get("currentRun"), dict) else None
        # A run is its own review snapshot. Keep the prior snapshot in history
        # rather than merging it into the new run's details.
        suggestions: dict[str, dict[str, Any]] = {}
        drafts = saved.get("drafts") if isinstance(saved.get("drafts"), dict) else {}
        # Networking is a Drive-backed CRM overlay on top of Google Contacts.
        # A failure to read it should not prevent inbox suggestions from being
        # produced; interaction logging is deliberately best-effort.
        try:
            google_contacts, app_data = await asyncio.gather(
                fetch_google_contacts(access_token),
                read_drive_app_data(access_token),
            )
            tracked_contacts = app_data.get("contacts") if isinstance(app_data.get("contacts"), dict) else {}
        except Exception:
            google_contacts, tracked_contacts, app_data = {}, {}, {}
        suggestions_by_message: dict[str, dict[str, Any]] = {}
        for candidate in messages:
            candidate_suggestion = _suggestion(candidate)
            candidate_id = str(candidate.get("id") or "")
            if candidate_id and candidate_suggestion:
                suggestions_by_message[candidate_id] = candidate_suggestion
        try:
            label_catalog = await fetch_gmail_labels(access_token)
            user_labels = {
                str(label.get("id") or ""): str(label.get("name") or "")
                for label in label_catalog
                if label.get("id") and label.get("name")
                and str(label.get("name")) not in TRIAGE_LABEL_NAMES.values()
            }
        except Exception:
            user_labels = {}
        sender_history: dict[str, tuple[int, Counter[str]]] = {}
        sender_tones: dict[str, dict[str, str]] = {}
        contacts_by_email: dict[str, tuple[str, dict[str, Any], dict[str, Any]]] = {}
        contact_interactions: dict[str, list[dict[str, Any]]] = {}
        for resource_name, entry in tracked_contacts.items():
            if not isinstance(entry, dict):
                continue
            person = google_contacts.get(resource_name)
            email = str((person or {}).get("email") or "").strip().lower()
            if email:
                try:
                    profile = await read_contact_profile(access_token, resource_name, entry)
                    contact_interactions[resource_name] = await read_contact_interactions(
                        access_token,
                        resource_name,
                        profile.get("interactions") if isinstance(profile.get("interactions"), list) else entry.get("interactions"),
                    )
                except Exception:
                    profile = entry
                    contact_interactions[resource_name] = [
                        item for item in profile.get("interactions", [])
                        if isinstance(item, dict)
                    ]
                contacts_by_email[email] = (resource_name, profile, person or {})

        new_interactions: list[tuple[str, dict[str, Any]]] = []
        changed_profiles: dict[str, dict[str, Any]] = {}

        for message in messages:
            try:
                message_id = str(message.get("id") or "")
                suggestion = suggestions_by_message.get(message_id)
                if suggestion:
                    sender_email = str(message.get("fromEmail") or "").strip().lower()
                    if suggestion.get("kind") == "reply":
                        if sender_email not in sender_tones:
                            try:
                                sender_tones[sender_email] = await _historical_sender_tone(access_token, sender_email)
                            except Exception:
                                sender_tones[sender_email] = {}
                        tone = sender_tones[sender_email]
                        if tone.get("canDraft") != "true":
                            if suggestion.get("taskSuggested"):
                                suggestion = {
                                    key: value
                                    for key, value in suggestion.items()
                                    if key not in {"draft", "kind", "action", "label"}
                                }
                                suggestion.update({
                                    "kind": "task",
                                    "action": "Review task suggestion",
                                })
                            else:
                                suggestion = None
                        else:
                            suggestion["draft"] = _draft_reply(message, tone)
                            suggestion["toneSource"] = "sender_history"
                    if suggestion is None:
                        suggestions.pop(message_id, None)
                        drafts.pop(message_id, None)
                    else:
                        message_id = suggestion["messageId"]
                        history_label = None
                        if sender_email not in sender_history:
                            try:
                                sender_history[sender_email] = await _historical_sender_label_counts(
                                    access_token,
                                    sender_email,
                                    user_labels,
                                )
                            except Exception:
                                sender_history[sender_email] = (0, Counter())
                        history_count, history_counts = sender_history[sender_email]
                        history_label = _historical_label(history_count, history_counts, user_labels)
                        if history_label and suggestion.get("kind") == "file":
                            label_id, label_name = history_label
                            suggestion["label"] = label_name
                            suggestion["labelSource"] = "sender_history"
                            if suggestion.get("deleteSuggested"):
                                suggestion["deleteSuggested"] = False
                                suggestion["action"] = "Review filing suggestion"
                                suggestion["reason"] = f"You usually keep messages from this sender under the “{label_name}” label."
                        suggestions[message_id] = suggestion
                        if suggestion.get("kind") == "file":
                            job["fileSuggestions"] += 1
                        if suggestion.get("kind") == "task" or suggestion.get("taskSuggested"):
                            job["tasksCreated"] += 1
                        if suggestion.get("kind") == "reply":
                            drafts[message_id] = suggestion["draft"]
                            job["draftsCreated"] += 1
                            job["draftedMessageIds"].append(message_id)

                # Every unread email from a tracked networking contact is an
                # interaction event. Include the Gmail message id so a later
                # triage run can prove it has already been recorded rather
                # than appending the same event again.
                sender_email = str(message.get("fromEmail") or "").strip().lower()
                tracked = contacts_by_email.get(sender_email)
                if tracked:
                    resource_name, contact_entry, _person = tracked
                    interactions = contact_interactions.setdefault(resource_name, [])
                    already_logged = any(
                        isinstance(interaction, dict)
                        and (interaction.get("messageId") == message_id or interaction.get("id") == f"gmail:{message_id}")
                        for interaction in interactions
                    )
                    if not already_logged:
                        interaction_date = str(message.get("date") or datetime.now(UTC).isoformat())
                        interaction = {
                            "id": f"gmail:{message_id}",
                            "messageId": message_id,
                            "date": interaction_date,
                            "notes": f"Received email: {message.get('subject') or '(no subject)'}",
                            "source": "gmail",
                        }
                        interactions.append(interaction)
                        new_interactions.append((resource_name, interaction))
                        contact_entry["lastInteractionDate"] = interaction_date
                        contact_entry["updatedAt"] = datetime.now(UTC).isoformat()
                        changed_profiles[resource_name] = contact_entry
                        job["interactionsTracked"] += 1
                job["processed"] += 1
                # An email with no recommendation was not completed. Keep it
                # unread so the user can see it again on the next run.
                # Suggestions are approval requests. The message remains
                # unread until the user saves a selected deletion or label
                # change through apply_saved_triage_changes.
            except Exception:
                job["failed"] += 1
            finally:
                job["attempted"] += 1

        completed_at = datetime.now(UTC).isoformat()
        current_suggestions = [
            suggestion for suggestion in suggestions.values()
            if isinstance(suggestion, dict)
        ]
        current_run = {
            "id": str(job["id"]),
            "completedAt": completed_at,
            "status": "failed" if job["failed"] else "completed",
            "total": job["total"],
            "processed": job["processed"],
            "fileSuggestions": job["fileSuggestions"],
            "tasksCreated": job["tasksCreated"],
            "draftsCreated": job["draftsCreated"],
            "labelsApplied": job["labelsApplied"],
            "readMarked": job["readMarked"],
            "suggestions": current_suggestions,
        }
        history = [
            item for item in saved_history
            if isinstance(item, dict) and item.get("id") != current_run["id"]
        ]
        # Migrate the pre-history format once, so the first History view still
        # exposes the suggestions that were previously merged into triage.json.
        if not history:
            legacy = previous_current_run
            if not legacy and previous_suggestions:
                legacy = {
                    "id": f"legacy-{hashlib.sha256(str(saved.get('updatedAt', '')).encode('utf-8')).hexdigest()[:12]}",
                    "completedAt": saved.get("updatedAt") or completed_at,
                    "status": "completed",
                    "total": len(previous_suggestions),
                    "processed": len(previous_suggestions),
                    "suggestions": [item for item in previous_suggestions.values() if isinstance(item, dict)],
                }
            if legacy and legacy.get("suggestions"):
                history.append(legacy)
        history = [current_run, *history][:TRIAGE_HISTORY_LIMIT]
        await write_json_file(
            access_token,
            TRIAGE_FOLDER,
            TRIAGE_FILE,
            {
                "version": 2,
                "updatedAt": completed_at,
                "currentRun": current_run,
                "history": history,
                "suggestions": suggestions,
                "drafts": drafts,
            },
        )
        if new_interactions:
            await asyncio.gather(*(
                write_contact_interaction(access_token, resource_name, interaction)
                for resource_name, interaction in new_interactions
            ))
            await asyncio.gather(*(
                write_contact_profile(
                    access_token,
                    resource_name,
                    {key: value for key, value in profile.items() if key != "interactions"},
                )
                for resource_name, profile in changed_profiles.items()
            ))
        job["status"] = "failed" if job["failed"] else "completed"
        if job["failed"]:
            job["error"] = f"{job['failed']} email{'' if job['failed'] == 1 else 's'} could not be reviewed"
    except Exception as error:
        job["status"] = "failed"
        job["error"] = str(error)
    finally:
        if _active_jobs.get(owner) == job["id"]:
            _active_jobs.pop(owner, None)


async def queue_unread_inbox_triage(access_token: str) -> dict[str, Any]:
    owner = _owner(access_token)
    active_id = _active_jobs.get(owner)
    if active_id and active_id in _jobs:
        return _snapshot(_jobs[active_id])
    messages = await _all_unread_messages(access_token)
    job = {
        "id": str(uuid4()),
        "status": "running",
        "total": len(messages),
        "attempted": 0,
        "processed": 0,
        "deleted": 0,
        "fileSuggestions": 0,
        "labelsApplied": 0,
        "labelFailures": 0,
        "readMarked": 0,
        "readFailures": 0,
        "interactionsTracked": 0,
        "tasksCreated": 0,
        "draftsCreated": 0,
        "draftedMessageIds": [],
        "failed": 0,
    }
    _jobs[job["id"]] = job
    _active_jobs[owner] = job["id"]
    asyncio.create_task(_run_job(access_token, owner, job, messages))
    return _snapshot(job)


def get_inbox_triage_progress(access_token: str, job_id: str) -> dict[str, Any] | None:
    job = _jobs.get(job_id)
    if not job:
        return None
    # Job ids are intentionally bound to the token owner without exposing the
    # token itself in the job payload.
    if job_id not in _jobs or _owner(access_token) != next((owner for owner, active in _active_jobs.items() if active == job_id), _owner(access_token)):
        # Completed jobs are still readable by their owner in this process. The
        # owner marker is attached when the job is first created below.
        if job.get("owner") != _owner(access_token):
            return None
    return _snapshot(job)


def _attach_owner(job: dict[str, Any], access_token: str) -> None:
    job["owner"] = _owner(access_token)


async def queue_and_attach(access_token: str) -> dict[str, Any]:
    result = await queue_unread_inbox_triage(access_token)
    job = _jobs.get(result["id"])
    if job:
        _attach_owner(job, access_token)
    return result


async def list_saved_draft_ids(access_token: str) -> list[str]:
    saved = await read_json_file(access_token, TRIAGE_FOLDER, TRIAGE_FILE) or {}
    drafts = saved.get("drafts") if isinstance(saved.get("drafts"), dict) else {}
    return [str(message_id) for message_id in drafts]


async def get_saved_draft(access_token: str, message_id: str) -> str | None:
    saved = await read_json_file(access_token, TRIAGE_FOLDER, TRIAGE_FILE) or {}
    drafts = saved.get("drafts") if isinstance(saved.get("drafts"), dict) else {}
    draft = drafts.get(message_id)
    return str(draft) if isinstance(draft, str) else None


async def get_saved_triage_details(access_token: str) -> dict[str, Any]:
    saved = await read_json_file(access_token, TRIAGE_FOLDER, TRIAGE_FILE) or {}
    current_run = saved.get("currentRun") if isinstance(saved.get("currentRun"), dict) else None
    if current_run is None:
        suggestions = saved.get("suggestions") if isinstance(saved.get("suggestions"), dict) else {}
        current_run = {
            "id": "latest",
            "completedAt": saved.get("updatedAt"),
            "status": "completed",
            "total": len(suggestions),
            "processed": len(suggestions),
            "suggestions": [item for item in suggestions.values() if isinstance(item, dict)],
        }
    history = [item for item in (saved.get("history") if isinstance(saved.get("history"), list) else []) if isinstance(item, dict)]
    return {"currentRun": current_run, "history": history[1:] if history and history[0].get("id") == current_run.get("id") else history}


async def apply_saved_triage_changes(access_token: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Apply only the suggestions explicitly checked in the review modal."""
    run_id = str(payload.get("runId") or "latest")
    raw_ids = payload.get("messageIds")
    if not isinstance(raw_ids, list) or not raw_ids or not all(isinstance(item, str) and item.strip() for item in raw_ids):
        raise ValueError("messageIds must be a non-empty array of message ids")

    saved = await read_json_file(access_token, TRIAGE_FOLDER, TRIAGE_FILE) or {}
    current_run = saved.get("currentRun") if isinstance(saved.get("currentRun"), dict) else None
    history = saved.get("history") if isinstance(saved.get("history"), list) else []
    if run_id == "latest":
        run_id = str(current_run.get("id") if current_run else "latest")
    target_run = current_run if current_run and str(current_run.get("id")) == run_id else next(
        (item for item in history if isinstance(item, dict) and str(item.get("id")) == run_id),
        None,
    )
    if not target_run:
        raise ValueError("Triage review not found")

    suggestions = {
        str(item.get("messageId")): item
        for item in target_run.get("suggestions", [])
        if isinstance(item, dict) and item.get("messageId")
    }
    labels = await fetch_gmail_labels(access_token)
    labels_by_name = {
        str(label.get("name") or "").casefold(): str(label.get("id") or "")
        for label in labels
        if label.get("name") and label.get("id")
    }
    async def apply_one(message_id: str) -> dict[str, Any]:
        suggestion = suggestions.get(message_id)
        if not suggestion:
            return {"messageId": message_id, "ok": False, "error": "Suggestion not found in this review"}
        if suggestion.get("appliedAction"):
            return {"messageId": message_id, "ok": False, "error": "This suggestion was already applied"}
        try:
            raw_message_id = message_id.removeprefix("gmail_")
            label_name = str(suggestion.get("label") or "").strip()
            if suggestion.get("deleteSuggested"):
                await trash_gmail_messages(access_token, [raw_message_id])
                action = "deleted"
            elif label_name:
                # A label is only ever assigned from a sender's own existing,
                # historically-consistent Gmail label (see _historical_label)
                # — this never creates a new OpenPip-owned label.
                label_id = labels_by_name.get(label_name.casefold())
                if not label_id:
                    raise ValueError(f"Gmail label not found: {label_name}")
                await modify_gmail_message_labels(access_token, raw_message_id, add_label_ids=[label_id])
                action = "labeled"
            else:
                # "reply"/"task" suggestions with no historical label have no
                # filing action to take — actually replying or creating a task
                # happens through their own explicit UI (the Reply button,
                # Google Tasks), never invented here. Applying just
                # acknowledges the review.
                action = "reviewed"
            await modify_gmail_message_labels(access_token, raw_message_id, remove_label_ids=["UNREAD"])
            suggestion["appliedAction"] = action
            suggestion["appliedAt"] = datetime.now(UTC).isoformat()
            return {"messageId": message_id, "ok": True, "action": action}
        except Exception as error:
            return {"messageId": message_id, "ok": False, "error": str(error)}

    # Each message's Gmail calls are independent of every other message's, so
    # run them concurrently rather than one round trip at a time.
    results = await asyncio.gather(*(
        apply_one(message_id) for message_id in dict.fromkeys(str(item).strip() for item in raw_ids)
    ))
    applied: list[dict[str, Any]] = [{"messageId": r["messageId"], "action": r["action"]} for r in results if r["ok"]]
    failures: list[dict[str, str]] = [{"messageId": r["messageId"], "error": r["error"]} for r in results if not r["ok"]]

    if applied:
        suggestions_by_id = {str(item.get("messageId")): item for item in target_run.get("suggestions", []) if isinstance(item, dict)}
        target_run["suggestions"] = list(suggestions_by_id.values())
        target_run["lastAppliedAt"] = datetime.now(UTC).isoformat()
        if current_run and str(current_run.get("id")) == run_id:
            for index, item in enumerate(history):
                if isinstance(item, dict) and str(item.get("id")) == run_id:
                    history[index] = current_run.copy()
                    break
        await write_json_file(
            access_token,
            TRIAGE_FOLDER,
            TRIAGE_FILE,
            {
                **saved,
                "updatedAt": datetime.now(UTC).isoformat(),
                "currentRun": current_run,
                "history": history,
                "suggestions": saved.get("suggestions") if isinstance(saved.get("suggestions"), dict) else {},
            },
        )
    return {"ok": not failures, "runId": run_id, "applied": applied, "failures": failures, "readMarked": len(applied)}
