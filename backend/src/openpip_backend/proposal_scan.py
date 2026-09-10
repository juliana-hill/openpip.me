"""Approval-first workspace proposal scan — the Dashboard's "assistant" card.

Distinct from the Inbox Assistant (see inbox_triage.py), which now also uses
agent judgment but only ever reads the user's unread Gmail — this scan reads
across Tasks, Calendar, Contacts, and recent Gmail history and has to weigh
which of them, if any, is actually worth a human's attention right now,
steered by the user's own Proactive Proposals guidelines (see agent.py's
load_context_documents). Neither pipeline drafts a reply on the other's
behalf: a drafted reply proposal (action="save_draft") only ever comes from
inbox_triage.py's own run, never from this scan.

Gmail history is the one source too large to hand the model in a single
prompt, so it's the only one batched (_EMAIL_BATCH_SIZE) — every batch is
still paired with the same Tasks/Calendar/Contacts facts (see
_build_static_context vs _build_email_batch_context), so a batch on its own
is always enough context to judge a task_complete or contact_track proposal.

Every proposal the model returns MUST cite one exact source id from the
sourceReferences it was actually given — never a fact it invented — and gets
dropped otherwise (see _parse_and_validate_proposals). Kept, validated
proposals become real pending Proposal rows in the user's own Drive (see
proposal_drive_store.py — add() there, deduplicated via
Proposal.idempotency_key so the same underlying task/contact/inbox-review
signal is never proposed twice, even across separate scans, even after the
user has already decided it).

This only ever creates proposals for review — it never executes anything.
Approving one here still goes through the approval executor; only an approved
``call_task`` with an authenticated session can reach the real CALL-E adapter.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import uuid4

from .agent import DEFAULT_AGENT_NAME, build_executive_assistant, extract_agent_text, load_context_documents
from .google_drive_store import read_drive_app_data
from .google_workspace import (
    fetch_gmail_messages,
    fetch_google_calendars,
    fetch_google_contacts,
    fetch_google_tasks,
)
from .channel_memory import list_channel_memories
from .insight_memory import list_insights
from .inbox_triage import get_saved_triage_details, read_contact_profile
from .models import Proposal, ProposalStatus, SourceReference
from . import proposal_drive_store
from .tools import build_lookup_channel_memory_tool, build_remember_channel_preference_tool

_SUPPORTED_KINDS = {
    "task_followup", "contact_followup", "inbox_pointer", "task_complete",
    "contact_track", "call_task",
}
_CONTACT_STALE_DAYS = 21
# 6 months, matching the precedent already set on the travel-agent project —
# 90 days was missing genuinely-relevant older threads (e.g. a still-open
# follow-up with a contact last emailed 4 months ago).
_HISTORICAL_WINDOW_DAYS = 180
# Forward-looking only, 6 months out — matching _HISTORICAL_WINDOW_DAYS'
# precedent. Calendar signals exist to catch unfinished tasks and propose
# scheduling something in (or reorganizing what's already booked) for the
# user's future, never to use a past event as "evidence" after the fact —
# see _calendar_signals.
_CALENDAR_LOOKAHEAD_DAYS = 180
# Same forward window, for tasks due later than today — see
# _open_task_signals' "upcoming" urgency.
_TASK_LOOKAHEAD_DAYS = 180
# "Connected multiple times / have an email thread with" — the minimum
# distinct-message count within the historical window before an untracked
# correspondent is worth proposing as a contact to track.
_FREQUENT_CORRESPONDENT_MIN_MESSAGES = 2
_MAX_PROPOSALS_PER_SCAN = 4
# A single one-shot prompt with the whole historical window stuffed in was
# both silently truncated (the raw JSON context was cut at a fixed character
# count — recentEmailSignals, listed after tasks/contacts/calendar, could
# lose its tail on an active inbox) and, before that, never even reached very
# far back — the fetch itself was capped at 100 messages, so a wider
# _HISTORICAL_WINDOW_DAYS changed nothing for an inbox with >100 messages in
# the newest slice of that window. Batching fixes both: fetch as many
# messages as the window actually contains (up to the ceiling below), then
# give the model one batch at a time so no single prompt is ever too large.
_HISTORICAL_MAX_MESSAGES = 300
_EMAIL_BATCH_SIZE = 50


def _explicit_phone(value: Any) -> str | None:
    """Return only a phone number explicitly present in source text."""
    match = re.search(r"\+\d{8,15}\b", str(value or ""))
    return match.group(0) if match else None

_jobs: dict[str, dict[str, Any]] = {}
_active_jobs: dict[str, str] = {}


def _owner(access_token: str) -> str:
    return hashlib.sha256(access_token.encode("utf-8")).hexdigest()[:24]


def _snapshot(job: dict[str, Any]) -> dict[str, Any]:
    return {**job, "events": list(job.get("events", []))}


def _event(job: dict[str, Any], event_type: str, title: str, detail: str | None = None) -> None:
    job.setdefault("events", []).append({
        "id": str(uuid4()),
        "type": event_type,
        "at": datetime.now(UTC).isoformat(),
        "title": title,
        **({"detail": detail} if detail else {}),
    })


# ---- Signal collection — each source degrades independently; one failing
# (e.g. Contacts Drive read) must never block proposals built from the rest.


_TASK_URGENCY_PRIORITY = {"overdue": 0, "due_today": 1, "asap": 2, "upcoming": 3}


async def _open_task_signals(access_token: str) -> list[dict[str, Any]]:
    """Overdue/due-today/ASAP tasks need action now. A task due further out
    (within _TASK_LOOKAHEAD_DAYS) is included too, tagged "upcoming" — not
    because it needs chasing yet, but because the scan can't match anything
    against a future-pinned task (e.g. a sale email against a "check out
    sale" task dated next month — see guideline_templates.py's
    GOALS_PROACTIVE_REVIEW_SAMPLE) unless that task is actually in context.
    task_followup's own prompt rule still restricts itself to
    overdue/ASAP/due-today only — "upcoming" tasks are visible context for
    other kinds (task_complete, task_followup once genuinely due), not
    something this signal alone proposes chasing. Overdue/due-today/ASAP
    tasks are sorted first so a long list of far-future tasks never crowds
    out what actually needs attention now."""
    tasks = await fetch_google_tasks(access_token)
    today = datetime.now(UTC).date()
    lookahead = today + timedelta(days=_TASK_LOOKAHEAD_DAYS)
    candidates: list[dict[str, Any]] = []
    for task in tasks:
        if task.get("completed") or not task.get("id"):
            continue
        due_raw = task.get("dueDate")
        urgency: str | None = None
        if due_raw:
            try:
                due = date.fromisoformat(str(due_raw))
                if due < today:
                    urgency = "overdue"
                elif due == today:
                    urgency = "due_today"
                elif due <= lookahead:
                    urgency = "upcoming"
            except ValueError:
                pass
        if urgency is None and task.get("priority") == "ASAP":
            urgency = "asap"
        if urgency:
            candidates.append({**task, "urgency": urgency})
    candidates.sort(key=lambda t: _TASK_URGENCY_PRIORITY.get(t["urgency"], 99))
    return candidates[:20]


async def _contact_followup_signals(access_token: str) -> list[dict[str, Any]]:
    google_contacts, app_data = await asyncio.gather(
        fetch_google_contacts(access_token),
        read_drive_app_data(access_token),
    )
    tracked = app_data.get("contacts") if isinstance(app_data.get("contacts"), dict) else {}
    now = datetime.now(UTC)
    candidates: list[dict[str, Any]] = []
    for resource_name in tracked:
        person = google_contacts.get(resource_name)
        if not person:
            continue  # tracked but dropped/merged in Google since — nothing to show
        try:
            profile = await read_contact_profile(access_token, resource_name, {})
        except Exception:
            continue
        last = profile.get("lastInteractionDate")
        stale = True
        if last:
            try:
                last_dt = datetime.fromisoformat(str(last).replace("Z", "+00:00"))
                if last_dt.tzinfo is None:
                    last_dt = last_dt.replace(tzinfo=UTC)
                stale = (now - last_dt).days >= _CONTACT_STALE_DAYS
            except ValueError:
                stale = True
        if stale:
            candidates.append({
                "resourceName": resource_name,
                "name": person.get("name"),
                "email": person.get("email"),
                "phone": person.get("phone"),
                "company": person.get("company"),
                "status": profile.get("status", "not_contacted"),
                "lastInteractionDate": last,
            })
    return candidates[:20]


async def _calendar_signals(access_token: str) -> list[dict[str, Any]]:
    """Forward-looking only. The point of handing the model calendar
    context is to catch unfinished tasks and propose scheduling something in
    — or reorganizing what's already on the calendar — for the user's
    future, never to treat a past event as "evidence" a task is already
    done after the fact (that read backward, which is exactly what this
    scan should not do). See _CALENDAR_LOOKAHEAD_DAYS."""
    calendars = await fetch_google_calendars(
        access_token, from_date=datetime.now(UTC).date().isoformat(), days=_CALENDAR_LOOKAHEAD_DAYS,
    )
    events = [
        {"calendarId": calendar.get("id"), **event}
        for calendar in calendars
        for event in calendar.get("events", [])
    ]
    return events[:20]


async def _historical_email_signals(access_token: str) -> list[dict[str, Any]]:
    """A bounded window of recent Gmail history — not just unread mail — so
    the scan can notice what the Inbox Assistant's unread-only triage never
    sees: a task actually already completed per an old confirmation email, a
    contact who already replied weeks ago. Read-only, same as everything else
    here; nothing is marked read or labeled by this scan.

    fetch_gmail_messages caps page_size at 100 internally, so reaching the
    full _HISTORICAL_MAX_MESSAGES ceiling means paging through it — Gmail's
    own default list order is newest-first, so page 1 alone was effectively
    the same fixed ~100 most-recent messages no matter how wide the day
    window was."""
    messages: list[dict[str, Any]] = []
    page = 1
    while len(messages) < _HISTORICAL_MAX_MESSAGES:
        batch, total = await fetch_gmail_messages(
            access_token,
            gmail_query=f"newer_than:{_HISTORICAL_WINDOW_DAYS}d",
            page=page,
            page_size=100,
        )
        if not batch:
            break
        messages.extend(batch)
        if len(messages) >= total or len(batch) < 100:
            break
        page += 1
    return messages[:_HISTORICAL_MAX_MESSAGES]


async def _google_contacts_and_tracked(access_token: str) -> tuple[dict[str, Any], dict[str, Any]]:
    """The same two reads _contact_followup_signals makes, exposed here too —
    _build_context needs them to cross-reference frequent email
    correspondents (see below) against real Google Contacts, which
    _contact_followup_signals' own fetch doesn't expose outward."""
    google_contacts, app_data = await asyncio.gather(
        fetch_google_contacts(access_token),
        read_drive_app_data(access_token),
    )
    tracked = app_data.get("contacts") if isinstance(app_data.get("contacts"), dict) else {}
    return google_contacts, tracked


async def _inbox_pointer_signal(access_token: str) -> dict[str, Any] | None:
    details = await get_saved_triage_details(access_token)
    current_run = details.get("currentRun") if isinstance(details, dict) else None
    if not isinstance(current_run, dict):
        return None
    suggestions = current_run.get("suggestions")
    if not isinstance(suggestions, list):
        return None
    unreviewed = [item for item in suggestions if isinstance(item, dict) and not item.get("appliedAction")]
    if not unreviewed:
        return None
    return {"count": len(unreviewed), "runId": current_run.get("id")}


async def _current_agent_name(access_token: str) -> str:
    try:
        data = await read_drive_app_data(access_token)
        user_data = data.get("userData") if isinstance(data.get("userData"), dict) else {}
        name = str(user_data.get("agentName") or "").strip()
        return name or DEFAULT_AGENT_NAME
    except Exception:
        return DEFAULT_AGENT_NAME


# ---- Context assembly: every source reference gets a stable id a proposal
# can cite; facts are the same data in a shape convenient for the prompt.


def _build_static_context(
    tasks: list[dict[str, Any]],
    contacts: list[dict[str, Any]],
    calendar_events: list[dict[str, Any]],
    inbox_pointer: dict[str, Any] | None,
    google_contacts: dict[str, Any] | None = None,
    channel_memories: list[dict[str, Any]] | None = None,
) -> tuple[dict[str, Any], list[dict[str, str]]]:
    """Everything except email history — small, and identical across every
    batch _run_scan hands the model (see _EMAIL_BATCH_SIZE)."""
    source_references: list[dict[str, str]] = []

    task_facts = []
    for task in tasks:
        source_id = f"task:{task['id']}"
        phone = _explicit_phone(task.get("notes"))
        source_references.append({
            "id": source_id, "kind": "task",
            "label": str(task.get("title") or "Untitled task"),
            "detail": f"{task.get('urgency')} · priority {task.get('priority')} · due {task.get('dueDate') or 'no date'}",
            **({"phone": phone} if phone else {}),
        })
        task_fact = {
            "sourceId": source_id, "title": task.get("title"),
            "notes": task.get("notes"), "priority": task.get("priority"),
            "dueDate": task.get("dueDate"), "urgency": task.get("urgency"),
            "projectName": task.get("projectName"),
            "phoneAvailable": bool(phone),
        }
        task_facts.append(task_fact)

    contact_facts = []
    for contact in contacts:
        source_id = f"contact:{contact['resourceName']}"
        source_references.append({
            "id": source_id, "kind": "contact",
            "label": str(contact.get("name") or "Unknown contact"),
            "detail": f"{contact.get('company') or 'no company on file'} · status {contact.get('status')} · last interaction {contact.get('lastInteractionDate') or 'never'}",
            **({"phone": str(contact.get("phone"))} if contact.get("phone") else {}),
        })
        contact_facts.append({
            "sourceId": source_id, "name": contact.get("name"),
            "email": contact.get("email"), "phone": contact.get("phone"),
            "company": contact.get("company"), "status": contact.get("status"),
            "lastInteractionDate": contact.get("lastInteractionDate"),
        })

    contacts_by_email = {
        str(person.get("email") or "").strip().lower(): person
        for person in (google_contacts or {}).values()
        if person.get("email")
    }
    calendar_facts = []
    for event in calendar_events:
        source_id = f"calendar:{event['id']}"
        phone = _explicit_phone(f"{event.get('description') or ''} {event.get('location') or ''}")
        attendee_name = None
        if not phone:
            attendee_phones = {
                str(contacts_by_email.get(str(attendee.get("email") or "").lower(), {}).get("phone") or "").strip()
                for attendee in event.get("attendees", [])
                if attendee.get("email")
            }
            attendee_phones.discard("")
            if len(attendee_phones) == 1:
                phone = next(iter(attendee_phones))
                matching_attendees = [
                    contacts_by_email.get(str(attendee.get("email") or "").lower(), {})
                    for attendee in event.get("attendees", [])
                    if attendee.get("email")
                ]
                attendee_name = next((person.get("name") for person in matching_attendees if person.get("name")), None)
        source_references.append({
            "id": source_id, "kind": "calendar_event",
            "label": str(event.get("title") or "Untitled event"),
            "detail": f"{event.get('start')}",
            "url": event.get("htmlLink"),
            "calendarId": str(event.get("calendarId") or ""),
            "eventId": str(event.get("id") or ""),
            **({"phone": phone} if phone else {}),
            **({"recipientName": attendee_name} if attendee_name else {}),
        })
        calendar_facts.append({
            "sourceId": source_id, "calendarId": event.get("calendarId"), "eventId": event.get("id"),
            "title": event.get("title"),
            "start": event.get("start"), "location": event.get("location"),
            "description": event.get("description"),
            "phoneAvailable": bool(phone),
            "contactName": attendee_name,
        })

    inbox_pointer_fact = None
    if inbox_pointer:
        source_id = "inbox_review"
        source_references.append({
            "id": source_id, "kind": "inbox_review",
            "label": "Inbox Assistant review",
            "detail": f"{inbox_pointer['count']} suggestion(s) awaiting your review",
        })
        inbox_pointer_fact = {"sourceId": source_id, **inbox_pointer}

    facts = {
        "openTasks": task_facts,
        "contactsNeedingFollowUp": contact_facts,
        "upcomingCalendarEvents": calendar_facts,
        "inboxAssistantPointer": inbox_pointer_fact,
        "knownChannelPreferences": channel_memories or [],
    }
    return facts, source_references


class _CorrespondentIndex:
    """Message counts must be tallied across the *whole* historical window to
    correctly judge "connected multiple times" — but each proposal can only
    cite a sourceId that's actually in the batch the model was shown. Built
    once from the full message list; _build_email_batch_context below then
    only ever surfaces a candidate via a sourceId present in that batch."""

    def __init__(self, historical_messages: list[dict[str, Any]], google_contacts: dict[str, Any], tracked_contacts: dict[str, Any]):
        self.tracked_contacts = tracked_contacts
        self.contacts_by_email = {
            str(person["email"]).strip().lower(): {"resourceName": resource_name, **person}
            for resource_name, person in google_contacts.items()
            if person.get("email")
        }
        self.message_count_by_email: dict[str, int] = {}
        for message in historical_messages:
            email = str(message.get("fromEmail") or "").strip().lower()
            if email:
                self.message_count_by_email[email] = self.message_count_by_email.get(email, 0) + 1

    def is_frequent_and_untracked(self, email: str) -> bool:
        person = self.contacts_by_email.get(email)
        return (
            self.message_count_by_email.get(email, 0) >= _FREQUENT_CORRESPONDENT_MIN_MESSAGES
            and person is not None
            and person["resourceName"] not in self.tracked_contacts
        )


def _build_email_batch_context(
    batch_messages: list[dict[str, Any]],
    index: _CorrespondentIndex,
) -> tuple[dict[str, Any], list[dict[str, str]]]:
    """recentEmailSignals + untrackedFrequentContacts for one batch. A
    frequent correspondent surfaces in every batch that contains at least one
    of their messages, each time citing that batch's own message — so
    whichever batch the model actually processes, the sourceId it might cite
    is always real and present."""
    source_references: list[dict[str, str]] = []
    email_facts = []
    seen_frequent_emails: set[str] = set()
    frequent_contact_facts = []
    for message in batch_messages:
        source_id = f"email:{message['id']}"
        from_email = str(message.get("fromEmail") or "").strip().lower()
        matched_person = index.contacts_by_email.get(from_email) if from_email else None
        phone = str((matched_person or {}).get("phone") or "").strip()
        source_references.append({
            "id": source_id, "kind": "email",
            "label": str(message.get("subject") or "(no subject)"),
            "detail": f"{message.get('from')} · {message.get('date')}",
            "url": message.get("gmailUrl"),
            **({"phone": phone} if phone else {}),
            **({"recipientName": str(matched_person.get("name"))} if matched_person and matched_person.get("name") else {}),
        })
        email_facts.append({
            "sourceId": source_id, "subject": message.get("subject"),
            "from": message.get("from"), "fromEmail": from_email,
            "date": message.get("date"), "snippet": message.get("snippet"),
            "matchedContact": (matched_person or {}).get("name"),
            "phoneAvailable": bool(phone),
        })

        if from_email and from_email not in seen_frequent_emails and index.is_frequent_and_untracked(from_email):
            seen_frequent_emails.add(from_email)
            person = index.contacts_by_email[from_email]
            frequent_contact_facts.append({
                "sourceId": source_id,
                "name": person.get("name"),
                "email": from_email,
                "phone": person.get("phone"),
                "messageCount": index.message_count_by_email[from_email],
            })

    facts = {"recentEmailSignals": email_facts, "untrackedFrequentContacts": frequent_contact_facts}
    return facts, source_references


def build_proposal_scan_prompt(
    facts: dict[str, Any],
    source_references: list[dict[str, str]],
    existing_pending: list[dict[str, str]],
) -> str:
    existing_block = (
        f"\n\nExisting pending proposals (do not propose anything with the same scope — propose only genuinely new actions):\n{json.dumps(existing_pending)}"
        if existing_pending else ""
    )
    return (
        "Review the JSON facts and source references below and propose up to "
        f"{_MAX_PROPOSALS_PER_SCAN} useful, bounded next actions for the user to "
        "approve. These are requests for permission to start work, not completed "
        "work — never claim anything has already happened. Do not invent tasks, "
        "contacts, emails, or calendar events not present below. Every proposal "
        "MUST cite one exact id from sourceReferences as sourceId — anything "
        "without a real, matching sourceId is discarded, not shown to the user.\n\n"
        'Return ONLY JSON exactly like: {"proposals":[{"kind":'
        '"task_followup|contact_followup|inbox_pointer|task_complete|contact_track|call_task"'
        ',"title":"...","rationale":"a specific fact from context","sourceId":'
        '"an exact id from sourceReferences", "recipientName":"...",'
        '"phone":"exact phone from sourceReferences", "goal":"...",'
        '"calendarUpdate":{"calendarId":"...","eventId":"...",'
        '"start":"...","end":"..."}}]}\n\n'
        "Rules:\n"
        "- task_followup: only for a specific overdue/ASAP/due-today task with a "
        "real, specific reason it needs attention now — not just because it exists.\n"
        "- contact_followup: only for a specific contact in contactsNeedingFollowUp "
        "with a real reason a follow-up would help now, not every stale contact at once.\n"
        "- inbox_pointer: only when inboxAssistantPointer is present in facts — at "
        "most one inbox_pointer proposal ever, pointing at that single sourceId.\n"
        "- task_complete: an item in openTasks looks already done, per a specific "
        "email in recentEmailSignals or event in upcomingCalendarEvents that is "
        "genuine evidence of it (a payment/order/booking confirmation, a calendar "
        "entry for the exact thing the task asked to schedule) — cite that "
        "evidence's own sourceId (the email or calendar event, not the task), and "
        "say in the title which task it completes and in the rationale exactly "
        "what the evidence shows. Never guess from a vague subject line alone.\n"
        "- contact_track: only for a person in untrackedFrequentContacts — propose "
        "adding them to tracked contacts, citing their sourceId (one of their "
        "actual emails) and naming them and the message count in the rationale.\n"
        "- call_task: only when an email, task, or calendar event explicitly "
        "requires a call/callback, or a calendar event needs rescheduling and "
        "the evidence indicates the provider is phone-only. "
        "The cited source must expose an explicit phone field. Use the exact "
        "phone from sourceReferences, never a guessed or invented number. "
        "If a usable email or booking link is the established channel, choose "
        "that channel instead and do not create a call_task unless the user "
        "explicitly asked for a phone call. "
        "Consult knownChannelPreferences when the person/business and situation "
        "match; a specific situation overrides a general preference. If the "
        "channel is unknown or the memory does not match, do not invent one. "
        "When an email, task, calendar event, or contact record explicitly "
        "establishes a channel preference, use remember_channel_preference to "
        "record it with the exact source id in the reason and source fields; "
        "update the existing subject/situation memory instead of duplicating it. "
        "Include a concrete bounded goal and the recipient name. If this is a "
        "phone-required reschedule of an existing calendar event, and the new "
        "start and end are explicit in the evidence, include calendarUpdate with "
        "the exact calendarId and eventId from sourceReferences plus that proposed "
        "start/end. Do not include calendarUpdate for a call that is not rescheduling "
        "an event.\n"
        "Never propose sending, applying, booking, or contacting anyone directly — "
        "every proposal is a request to look into or prepare something, never an "
        "action already taken. If nothing here genuinely warrants the user's "
        f"attention, return an empty proposals list.{existing_block}\n\n"
        # Batched now (see _EMAIL_BATCH_SIZE), so a single batch's context is
        # far smaller than the old single-shot dump of the whole window —
        # this is headroom, not the primary size control.
        f"Context:\n{json.dumps({'facts': facts, 'sourceReferences': source_references})[:40000]}"
    )


def _parse_and_validate_proposals(raw: str, source_references: list[dict[str, str]]) -> list[dict[str, Any]]:
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        return []
    try:
        parsed = json.loads(match.group(0))
    except ValueError:
        return []
    candidates = parsed.get("proposals") if isinstance(parsed, dict) else None
    if not isinstance(candidates, list):
        return []
    sources_by_id = {source["id"]: source for source in source_references}
    validated: list[dict[str, Any]] = []
    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        kind = candidate.get("kind")
        if kind not in _SUPPORTED_KINDS:
            continue
        title = str(candidate.get("title") or "").strip()
        rationale = str(candidate.get("rationale") or "").strip()
        source = sources_by_id.get(str(candidate.get("sourceId") or ""))
        if not title or not rationale or not source:
            continue
        item: dict[str, Any] = {
            "kind": kind, "title": title[:200], "rationale": rationale[:500], "source": source,
        }
        if kind == "call_task":
            source_phone = str(source.get("phone") or "").strip()
            candidate_phone = str(candidate.get("phone") or "").strip()
            goal = str(candidate.get("goal") or "").strip()
            recipient_name = str(candidate.get("recipientName") or "").strip()
            source_recipient_name = str(source.get("recipientName") or "").strip()
            if (
                not source_phone or candidate_phone != source_phone or not goal or not recipient_name
                or (source_recipient_name and recipient_name != source_recipient_name)
            ):
                continue
            item["call"] = {
                "recipientName": recipient_name[:160],
                "phone": source_phone,
                "goal": goal[:500],
                "region": str(candidate.get("region") or "").strip()[:8] or None,
                "locale": str(candidate.get("locale") or "").strip()[:32] or None,
            }
            calendar_update = candidate.get("calendarUpdate")
            if calendar_update is not None:
                if source.get("kind") != "calendar_event" or not isinstance(calendar_update, dict):
                    continue
                if (
                    str(calendar_update.get("calendarId") or "") != str(source.get("calendarId") or "")
                    or str(calendar_update.get("eventId") or "") != str(source.get("eventId") or "")
                    or not str(calendar_update.get("start") or "").strip()
                    or not str(calendar_update.get("end") or "").strip()
                ):
                    continue
                item["call"]["calendarUpdate"] = {
                    "action": "update_calendar_event",
                    "calendarId": str(source["calendarId"]),
                    "eventId": str(source["eventId"]),
                    "start": str(calendar_update["start"]).strip(),
                    "end": str(calendar_update["end"]).strip(),
                    **({"timeZone": str(calendar_update["timeZone"]).strip()} if calendar_update.get("timeZone") else {}),
                }
        validated.append(item)
    return validated[:_MAX_PROPOSALS_PER_SCAN]


async def _run_scan(access_token: str, job: dict[str, Any]) -> None:
    try:
        _event(job, "progress", "Reviewing tasks, contacts, calendar, and recent email")
        results = await asyncio.gather(
            _open_task_signals(access_token),
            _contact_followup_signals(access_token),
            _calendar_signals(access_token),
            _historical_email_signals(access_token),
            _inbox_pointer_signal(access_token),
            _google_contacts_and_tracked(access_token),
            list_channel_memories(access_token),
            list_insights(access_token),
            return_exceptions=True,
        )
        tasks, contacts, calendar_events, historical_messages, inbox_pointer, contacts_and_tracked, channel_memories, historical_insights = (
            result if not isinstance(result, BaseException) else (None if index in (4, 5) else [])
            for index, result in enumerate(results)
        )
        google_contacts, tracked_contacts = contacts_and_tracked or ({}, {})
        historical_messages = historical_messages or []

        static_facts, static_source_references = _build_static_context(
            tasks or [], contacts or [], calendar_events or [], inbox_pointer,
            google_contacts=google_contacts,
            channel_memories=channel_memories or [],
        )
        static_facts["historicalInsights"] = historical_insights or []
        correspondent_index = _CorrespondentIndex(historical_messages, google_contacts, tracked_contacts)
        batches = [
            historical_messages[i:i + _EMAIL_BATCH_SIZE]
            for i in range(0, len(historical_messages), _EMAIL_BATCH_SIZE)
        ] or [[]]  # always at least one pass, even with zero email history

        if not static_source_references and not historical_messages:
            job["created"] = 0
            job["status"] = "completed"
            _event(job, "completed", "Nothing new to propose right now.")
            return

        total_signals = len(static_source_references) + len(historical_messages)
        _event(job, "progress", f"Found {total_signals} signal(s) to consider")
        # agentName lives in the same small Drive app-data document as
        # theme/accent (see google_drive_store.py) — separate from the
        # Assistant Identity guideline document. Without this, the model
        # calls itself "OpenPip" (the project's name) in generated proposal
        # text regardless of what the user actually renamed their assistant.
        context_block, agent_name = await asyncio.gather(
            load_context_documents(access_token, include_proactive_review=True),
            _current_agent_name(access_token),
        )
        agent = build_executive_assistant(
            context_block,
            agent_name=agent_name,
            extra_tools=[
                build_lookup_channel_memory_tool(access_token),
                build_remember_channel_preference_tool(access_token),
            ],
        )

        created = 0
        for batch_index, batch_messages in enumerate(batches):
            if created >= _MAX_PROPOSALS_PER_SCAN:
                break
            batch_facts, batch_source_references = _build_email_batch_context(batch_messages, correspondent_index)
            facts = {**static_facts, **batch_facts}
            source_references = static_source_references + batch_source_references

            # Refreshed every batch — a proposal stored by an earlier batch
            # in *this* scan must also be excluded from later batches'
            # prompts, not just proposals left over from previous scans.
            existing_pending = [{"action": p.action, "title": p.title} for p in await proposal_drive_store.list_proposals(access_token, ProposalStatus.PENDING)]
            prompt = build_proposal_scan_prompt(facts, source_references, existing_pending)

            if len(batches) > 1:
                _event(job, "progress", f"Reviewing email batch {batch_index + 1} of {len(batches)}")
            else:
                _event(job, "progress", "Asking the assistant to identify source-backed proposals")
            result = agent(prompt)
            validated = _parse_and_validate_proposals(extract_agent_text(result), source_references)

            for candidate in validated:
                if created >= _MAX_PROPOSALS_PER_SCAN:
                    break
                source = candidate["source"]
                proposal = Proposal(
                    action=candidate["kind"],
                    title=candidate["title"],
                    rationale=candidate["rationale"],
                    payload={
                        "sourceId": source["id"],
                        **(candidate.get("call") or {}),
                    },
                    source=SourceReference(
                        kind=source["kind"], id=source["id"], title=source["label"],
                        url=source.get("url"), detail=source.get("detail"),
                    ),
                    idempotency_key=f"proposal_scan:{candidate['kind']}:{source['kind']}:{source['id']}",
                )
                stored = await proposal_drive_store.add(access_token, proposal)
                if stored.id == proposal.id:
                    created += 1

        job["created"] = created
        job["status"] = "completed"
        _event(
            job, "completed",
            f"Created {created} new proposal{'s' if created != 1 else ''} for review." if created
            else "Reviewed your workspace — nothing new needs approval right now.",
        )
    except Exception as error:
        job["status"] = "failed"
        job["error"] = str(error)
        _event(job, "failed", "The scan could not finish.", str(error))
    finally:
        if _active_jobs.get(_owner(access_token)) == job["id"]:
            _active_jobs.pop(_owner(access_token), None)


async def queue_proposal_scan(access_token: str) -> dict[str, Any]:
    owner = _owner(access_token)
    active_id = _active_jobs.get(owner)
    if active_id and active_id in _jobs:
        return _snapshot(_jobs[active_id])
    job: dict[str, Any] = {
        "id": str(uuid4()),
        "title": "Finding useful next actions",
        "status": "running",
        "createdAt": datetime.now(UTC).isoformat(),
        "created": 0,
        "events": [],
        "owner": owner,
    }
    _event(job, "queued", "Scan queued")
    _jobs[job["id"]] = job
    _active_jobs[owner] = job["id"]
    asyncio.create_task(_run_scan(access_token, job))
    return _snapshot(job)


def get_proposal_scan_progress(access_token: str, job_id: str) -> dict[str, Any] | None:
    job = _jobs.get(job_id)
    if not job or job.get("owner") != _owner(access_token):
        return None
    return _snapshot(job)
