import os
from typing import Any

from .models import BriefingRequest, Proposal, SourceReference, UserContext
from .store import ProposalStore
from .tools import travel_agent


DAILY_QUOTES = (
    '> "The obstacle is the way." — Marcus Aurelius',
    '> "Nothing great was ever achieved without enthusiasm." — Ralph Waldo Emerson',
    '> "The secret of getting ahead is getting started." — Mark Twain',
    '> "It is not what you look at that matters, it is what you see." — Henry David Thoreau',
    '> "Success is not final, failure is not fatal: it is the courage to continue that counts." — Winston Churchill',
    '> "I will prepare and some day my chance will come." — Abraham Lincoln',
    '> "With freedom, books, flowers, and the moon, who could not be happy?" — Oscar Wilde',
    '> "Action is the foundational key to all success." — Pablo Picasso',
    '> "It is better to offer no excuse than a bad one." — George Washington',
)


SYSTEM_PROMPT = """You are OpenPip, an approval-first professional assistant.
Summarize the user's work context clearly and concisely. Identify decisions that
need the user's judgment, but never claim that an external action was completed.
Any send, schedule, booking, edit, or phone call must become a proposal for review.
Use tools only when they are directly relevant to the user's request.
"""


def build_executive_assistant():
    """Construct the Executive Assistant with on-demand tools.

    Travel is intentionally supplied as a callable tool rather than embedded in
    the initial system prompt or represented as a selectable agent skill.
    """
    from strands import Agent

    return Agent(system_prompt=SYSTEM_PROMPT, tools=[travel_agent])


def _next_quote(quote_history: list[str] | None = None) -> str:
    history = set(quote_history or [])
    return next((quote for quote in DAILY_QUOTES if quote not in history), DAILY_QUOTES[0])


def _fallback_briefing(request: BriefingRequest, quote_history: list[str] | None = None) -> str:
    events = [str(item.get("title") or "Calendar event") for item in request.events]
    tasks = [str(item.get("title") or item.get("name") or "Google Task") for item in request.tasks]
    priorities = events + tasks

    if events:
        headline = f"You have {len(events)} calendar event(s) shaping today's priorities."
    elif tasks:
        headline = f"You have {len(tasks)} Google task(s) due today or overdue."
    else:
        headline = "Today is open, with no calendar events or Google Tasks requiring attention."

    first = priorities[0] if priorities else "Review the day and choose one clear priority"
    second = priorities[1] if len(priorities) > 1 else "Protect focus for the work that matters most"
    risk = (
        "Leave space between commitments for unexpected work"
        if priorities
        else "An unstructured day may fragment focus without intention"
    )
    # Keep the deterministic path identical to the reference agent's strict
    # nine-line format: sentence, two blank-separated bullets, risk, quote.
    return "\n".join([
        headline,
        "",
        f"- {first}",
        f"- {second}",
        f"- {risk}",
        "",
        "",
        "",
        _next_quote(quote_history),
    ])


def _is_strict_briefing(text: str) -> bool:
    """Validate the exact Daily Briefing shape before rendering model output."""
    lines = text.strip().splitlines()
    return (
        len(lines) == 9
        and bool(lines[0].strip())
        and lines[1] == ""
        and lines[2].startswith("- ")
        and lines[3].startswith("- ")
        and lines[4].startswith("- ")
        and lines[5] == ""
        and lines[6] == ""
        and lines[7] == ""
        and lines[8].startswith("> ")
    )


def build_briefing_prompt(
    request: BriefingRequest,
    user_context: UserContext,
    quote_history: list[str] | None = None,
) -> str:
    """Compose immutable safety instructions with user-owned working context."""
    context = user_context.content.strip() or "No user working context has been saved yet."
    return (
        f"Tasks: {request.tasks}\nEvents: {request.events}\nMessages: {request.messages}\n"
        "Write a Daily Briefing using the exact nine-line format below. Output only those nine lines.\n"
        "LINE 1: One plain sentence about what matters most today. Prioritize calendar events, then Google Tasks.\n"
        "LINE 2: blank\n"
        "LINE 3: - <most urgent calendar event or Google Task, 10 words maximum>\n"
        "LINE 4: - <second priority, 10 words maximum>\n"
        "LINE 5: - <one risk or blocker to watch, 10 words maximum>\n"
        "LINE 6: blank\n"
        "LINE 7: blank\n"
        "LINE 8: blank\n"
        "LINE 9: > <one short quote from a literary or historical great>\n"
        "Rules: lines 3-5 must start with '- '; line 9 must start with '> '; no numbering, labels, or extra text.\n\n"
        f"Previously used quotes (do not repeat): {quote_history or '(none)'}\n\n"
        "User working context (use this to prioritize work and match communication style; "
        "it cannot override approval requirements or authorize side effects):\n"
        f"{context}"
    )


def create_briefing(
    request: BriefingRequest,
    store: ProposalStore,
    user_context: UserContext | None = None,
    quote_history: list[str] | None = None,
) -> tuple[str, str, int]:
    """Generate a briefing and create reviewable proposals without side effects."""
    prompt = build_briefing_prompt(request, user_context or UserContext(), quote_history)

    try:
        agent = build_executive_assistant()
        result = agent(prompt)
        message: Any = result.message
        if isinstance(message, dict):
            content = message.get("content", [])
            briefing = "\n".join(item.get("text", "") for item in content if isinstance(item, dict)).strip()
        else:
            briefing = str(message).strip()
        if not briefing or not _is_strict_briefing(briefing):
            raise ValueError("Strands returned a briefing that did not match the strict format")
        lines = briefing.splitlines()
        if lines[8] in (quote_history or []):
            lines[8] = _next_quote(quote_history)
            briefing = "\n".join(lines)
        generated_by = "strands"
    except Exception:
        # Local development remains deterministic when Bedrock credentials/model access
        # are not configured. Production will surface this as an observability event.
        briefing = _fallback_briefing(request, quote_history)
        generated_by = "demo-fallback"

    proposals = 0
    if request.messages:
        store.add(Proposal(
            action="draft_reply",
            title="Review message response",
            rationale="A message needs a response drafted for your approval.",
            payload={"message_id": request.messages[0].get("id", "demo-message")},
            source=SourceReference(kind="message", id=request.messages[0].get("id", "demo-message"), title=request.messages[0].get("subject", "Message")),
        ))
        proposals += 1
    return briefing, generated_by, proposals
