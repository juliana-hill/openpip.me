import asyncio
import os
import re
from typing import Any

import boto3

from .google_drive_docs import get_or_create_document
from .guideline_templates import (
    AGENT_MD_SAMPLE,
    GOALS_EXECUTIVE_ASSISTANT_SAMPLE,
    GOALS_PROACTIVE_REVIEW_SAMPLE,
    GOALS_TRAVEL_PLANNER_SAMPLE,
)
from . import proposal_drive_store
from .models import BriefingRequest, Proposal, SourceReference, UserContext
from .store import ProposalStore
from .tools import travel_agent


# Seed data for the `quotes` table (store.seed_quotes) — a starting pool so
# briefings have something to draw from before discover_quote_via_grounding()
# has ever added anything of its own. The pool grows from there; this tuple
# is never read directly by create_briefing() itself. The classical selections
# are short excerpts from public-domain translations/works; modern selections
# are limited to short, attributable excerpts. Existing user/discovered rows
# are intentionally preserved by store.seed_quotes()'s INSERT OR IGNORE logic.
DAILY_QUOTES = (
    # Marcus Aurelius — Meditations, trans. George Long.
    '> "The happiness of your life depends upon the quality of your thoughts." — Marcus Aurelius',
    '> "The soul becomes dyed with the colour of its thoughts." — Marcus Aurelius',
    '> "The universe is transformation: life is opinion." — Marcus Aurelius',
    '> "The best revenge is to be unlike him who performed the injury." — Marcus Aurelius',
    '> "The mind adapts and converts to its purposes the obstacle to our acting." — Marcus Aurelius',
    '> "The soul is never deprived of the present." — Marcus Aurelius',
    '> "Do every act of your life as though it were the very last act of your life." — Marcus Aurelius',
    '> "A man should be upright, not be kept upright." — Marcus Aurelius',
    '> "The art of living is more like wrestling than dancing." — Marcus Aurelius',
    '> "Remember that the nature of the whole delights in change." — Marcus Aurelius',
    '> "Look within. Within is the fountain of good, and it will ever bubble up." — Marcus Aurelius',
    '> "Nowhere can man find a quieter or more untroubled retreat than in his own soul." — Marcus Aurelius',
    '> "It is not fit that I should be angry with men." — Marcus Aurelius',
    '> "Everything that happens happens as it should." — Marcus Aurelius',
    '> "The object of life is not to be on the side of the majority, but to escape finding oneself in the ranks of the insane." — Marcus Aurelius',

    # Epictetus — The Enchiridion, trans. Elizabeth Carter.
    '> "Some things are in our control and others not." — Epictetus',
    '> "Men are disturbed, not by things, but by the principles and notions which they form concerning things." — Epictetus',
    '> "Don\'t demand that things happen as you wish, but wish that they happen as they do happen, and you will go on well." — Epictetus',
    '> "With every accident, ask yourself what abilities you have for making a proper use of it." — Epictetus',
    '> "Never say of anything, \"I have lost it\"; but, \"I have returned it.\"" — Epictetus',
    '> "If you want to improve, be content to be thought foolish and stupid with regard to external things." — Epictetus',
    '> "Exercise, therefore, what is in your control." — Epictetus',
    '> "No man is free who is not master of himself." — Epictetus',
    '> "First say to yourself what you would be; and then do what you have to do." — Epictetus',
    '> "It is impossible for a man to learn what he thinks he already knows." — Epictetus',
    '> "It is better to die with hunger, exempt from grief and fear, than to live in affluence with perturbation." — Epictetus',
    '> "It is not things themselves which disturb men, but their judgments about these things." — Epictetus',

    # Seneca — On the Shortness of Life and Moral Letters, public-domain texts.
    '> "It is not that we have a short time to live, but that we waste a great deal of it." — Seneca',
    '> "Life is long if you know how to use it." — Seneca',
    '> "We are not given a short life but we make it short." — Seneca',
    '> "While we are postponing, life speeds by." — Seneca',
    '> "Difficulties strengthen the mind, as labour does the body." — Seneca',
    '> "He who is brave is free." — Seneca',
    '> "No man was ever wise by chance." — Seneca',
    '> "Begin at once to live, and count each separate day as a separate life." — Seneca',
    '> "The greatest obstacle to living is expectancy, which depends upon to-morrow and loses to-day." — Seneca',
    '> "It is quality rather than quantity that matters." — Seneca',
    '> "Luck never made a man wise." — Seneca',
    '> "If one does not know to which port one is sailing, no wind is favorable." — Seneca',

    # Aristotle — Nicomachean Ethics and Politics, trans. W. D. Ross.
    '> "The good of man is an activity of soul in accordance with virtue." — Aristotle',
    '> "One swallow does not make a summer, nor does one day." — Aristotle',
    '> "We are not inquiring in order to know what virtue is, but in order to become good." — Aristotle',
    '> "It makes no small difference whether we form habits of one kind or of another from our very youth." — Aristotle',
    '> "For the things we have to learn before we can do them, we learn by doing them." — Aristotle',
    '> "We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts." — Aristotle',
    '> "Virtue, then, is of two kinds, intellectual and moral." — Aristotle',
    '> "Man is by nature a political animal." — Aristotle',

    # Socrates as recorded by Plato — Apology, trans. Benjamin Jowett.
    '> "The unexamined life is not worth living." — Socrates (Plato, Apology)',
    '> "I shall obey God rather than you." — Socrates (Plato, Apology)',
    '> "The greatest good of man is daily to converse about virtue." — Socrates (Plato, Apology)',
    '> "The difficulty, my friends, is not in avoiding death, but in avoiding unrighteousness." — Socrates (Plato, Apology)',
    '> "No evil can happen to a good man, either in life or after death." — Socrates (Plato, Apology)',
    '> "The easiest and noblest way is not to be crushing others, but to be improving yourselves." — Socrates (Plato, Apology)',

    # Sun Tzu — The Art of War, trans. Lionel Giles.
    '> "The art of war is of vital importance to the State." — Sun Tzu',
    '> "He who knows them will be victorious; he who knows them not will fail." — Sun Tzu',
    '> "Attack him where he is unprepared, appear where you are not expected." — Sun Tzu',
    '> "The general who wins a battle makes many calculations in his temple ere the battle is fought." — Sun Tzu',
    '> "In war, then, let your great object be victory, not lengthy campaigns." — Sun Tzu',
    '> "The skillful soldier does not raise a second levy." — Sun Tzu',
    '> "Whoever is first in the field and awaits the coming of the enemy, will be fresh for the fight." — Sun Tzu',
    '> "The clever combatant imposes his will on the enemy, but does not allow the enemy\'s will to be imposed on him." — Sun Tzu',
    '> "The art of war teaches us to rely not on the likelihood of the enemy\'s not coming, but on our own readiness." — Sun Tzu',

    # Laozi — Tao Te Ching / Dao De Jing, public-domain translations.
    '> "A journey of a thousand miles begins with a single step." — Laozi',
    '> "Knowing others is intelligence; knowing yourself is true wisdom." — Laozi',
    '> "He who knows others is wise; he who knows himself is enlightened." — Laozi',
    '> "Nature does not hurry, yet everything is accomplished." — Laozi',
    '> "The softest thing in the universe overcomes the hardest thing in the universe." — Laozi',
    '> "Those who know do not speak. Those who speak do not know." — Laozi',
    '> "To attain knowledge, add things every day. To attain wisdom, remove things every day." — Laozi',
    '> "The sage does not hoard. The more he helps others, the more he benefits himself." — Laozi',

    # Ralph Waldo Emerson — public-domain essays.
    '> "Nothing can bring you peace but yourself." — Ralph Waldo Emerson',
    '> "Whoso would be a man must be a nonconformist." — Ralph Waldo Emerson',
    '> "A foolish consistency is the hobgoblin of little minds." — Ralph Waldo Emerson',
    '> "The reward of a thing well done is having done it." — Ralph Waldo Emerson',
    '> "Every artist was first an amateur." — Ralph Waldo Emerson',
    '> "Adopt the pace of nature: her secret is patience." — Ralph Waldo Emerson',
    '> "Life consists in what a man is thinking of all day." — Ralph Waldo Emerson',

    # Henry David Thoreau — Walden, public domain.
    '> "The mass of men lead lives of quiet desperation." — Henry David Thoreau',
    '> "Simplify, simplify." — Henry David Thoreau',
    '> "Go confidently in the direction of your dreams! Live the life you\'ve imagined." — Henry David Thoreau',
    '> "Things do not change; we change." — Henry David Thoreau',
    '> "How vain it is to sit down to write when you have not stood up to live." — Henry David Thoreau',
    '> "The question is not what you look at, but what you see." — Henry David Thoreau',

    # Oscar Wilde — public-domain plays and novels.
    '> "We are all in the gutter, but some of us are looking at the stars." — Oscar Wilde',
    '> "Experience is simply the name we give our mistakes." — Oscar Wilde',
    '> "To live is the rarest thing in the world. Most people exist, that is all." — Oscar Wilde',
    '> "The truth is rarely pure and never simple." — Oscar Wilde',
    '> "With freedom, books, flowers, and the moon, who could not be happy?" — Oscar Wilde',

    # The Dalai Lama — short excerpts from the Office of His Holiness.
    '> "The basic source of all happiness is a sense of kindness and warm-heartedness towards others." — Dalai Lama',
    '> "The key to happiness is peace of mind." — Dalai Lama',
    '> "The purpose of life is to be happy." — Dalai Lama',
    '> "If you want others to be happy, practise compassion; if you want to be happy, practise compassion." — Dalai Lama',

    # Steve Jobs — Stanford commencement address, June 12, 2005.
    '> "Your time is limited, so don\'t waste it living someone else\'s life." — Steve Jobs',
    '> "Have the courage to follow your heart and intuition." — Steve Jobs',
    '> "Stay hungry. Stay foolish." — Steve Jobs',

    # Pablo Picasso — documented artist statements and quotations.
    '> "The purpose of art is washing the dust of daily life off our souls." — Pablo Picasso',
    '> "Every act of creation is first an act of destruction." — Pablo Picasso',
    '> "Everything is a miracle. It is a miracle that one does not dissolve in one\'s bath like a lump of sugar." — Pablo Picasso',

    # Andy Warhol — The Philosophy of Andy Warhol and documented statements.
    '> "They always say time changes things, but you actually have to change them yourself." — Andy Warhol',
    '> "Being good in business is the most fascinating kind of art." — Andy Warhol',
)

_PRIVATE_REASONING_BLOCK_RE = re.compile(
    r"<(?P<tag>thinking|analysis|reasoning)\b[^>]*>.*?</(?P=tag)\s*>",
    re.IGNORECASE | re.DOTALL,
)
_UNCLOSED_PRIVATE_REASONING_RE = re.compile(
    r"<(?:thinking|analysis|reasoning)\b[^>]*>.*$",
    re.IGNORECASE | re.DOTALL,
)

# Amazon Nova Web Grounding (docs.aws.amazon.com/nova/latest/nova2-userguide/web-grounding.html)
# is only available on specific cross-region inference profiles, US only.
# nova-premier-v1:0 is LEGACY on this account (AWS-side, confirmed via
# `aws bedrock list-foundation-models`) and access to it must not be
# re-requested — nova-2-lite-v1:0 is the current, active replacement.
NOVA_GROUNDING_MODEL_ID = "us.amazon.nova-2-lite-v1:0"

# Bedrock requires Nova Pro to be invoked through the US cross-region
# inference profile in production; the bare foundation-model id fails with
# "on-demand throughput isn't supported" during long tool-calling passes.
# Keep this overrideable for another account/region, while defaulting to the
# production-compatible profile used by the historical aggregate worker.
EXECUTIVE_ASSISTANT_MODEL_ID = os.getenv(
    "OPENPIP_EXECUTIVE_ASSISTANT_MODEL_ID", "us.amazon.nova-pro-v1:0"
)


DEFAULT_AGENT_NAME = "OpenPip"


def _system_prompt(agent_name: str) -> str:
    """"OpenPip" is this project's name, not necessarily the assistant's —
    the user can rename their assistant in Settings (agentName, in the same
    Drive app-data document as theme/accent), and the model needs to actually
    call itself that, not the literal string "OpenPip" every time regardless."""
    return (
        f"You are {agent_name}, an approval-first professional assistant.\n"
        "Summarize the user's work context clearly and concisely. Identify decisions that\n"
        "need the user's judgment, but never claim that an external action was completed.\n"
        "Any phone call must become a proposal for review. In chat, use create_proposal for a\n"
        "call when it is available, and only when the user or workspace evidence says phone is\n"
        "required; do not assume every calendar event needs a call. Creating the proposal asks\n"
        "the user for approval; after approval, you perform the approved call. Never tell the\n"
        "user to place that call themselves, and never claim it ran before approval. Email and\n"
        "direct Calendar changes belong to their own channel-specific workflows.\n"
        "When choosing how a person or business should be contacted, use the "
        "lookup_channel_memory tool when it is available and the subject or "
        "situation matters. Use remember_channel_preference only when the user "
        "explicitly states a preference, a completed interaction clearly "
        "establishes the channel, or an email, calendar event, task, or contact "
        "record explicitly establishes it; never save an inference. Include the specific "
        "situation in the memory so one business can have different channels for "
        "different kinds of work, and include the source id in the reason when "
        "the memory came from workspace data. When updating a known subject and situation, "
        "edit the existing memory rather than creating a duplicate. These memory "
        "tools do not contact anyone.\n"
        "Use tools only when they are directly relevant to the user's request.\n"
    )


def _executive_assistant_model():
    """Use OpenPip's app-scoped Bedrock credentials when configured."""
    from strands.models import BedrockModel

    region = os.getenv("AWS_REGION", "us-east-1")
    access_key = os.environ.get("AWS_APP_ACCESS_KEY_ID") or os.environ.get(
        "AWS_ACCESS_KEY_ID"
    )
    secret_key = os.environ.get("AWS_APP_SECRET_ACCESS_KEY") or os.environ.get(
        "AWS_SECRET_ACCESS_KEY"
    )
    if access_key and secret_key:
        session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        return BedrockModel(model_id=EXECUTIVE_ASSISTANT_MODEL_ID, boto_session=session)
    return BedrockModel(model_id=EXECUTIVE_ASSISTANT_MODEL_ID, region_name=region)


def build_executive_assistant(
    context_block: str = "",
    agent_name: str = DEFAULT_AGENT_NAME,
    *,
    extra_tools: list[Any] | None = None,
    messages: list[dict[str, Any]] | None = None,
):
    """Construct the Executive Assistant with on-demand tools.

    Travel is intentionally supplied as a callable tool rather than embedded in
    the initial system prompt or represented as a selectable agent skill.

    Strands' Agent takes two distinct prompting inputs: `system_prompt` (set
    once here — our own standing instructions for how the assistant behaves)
    and the per-call user prompt (whatever the caller later passes to
    `agent(...)` — literally what the user is asking for that turn). The
    optional `context_block` — the user's Assistant Identity / Executive
    Assistant / Travel guideline documents from load_context_documents() — is
    persistent, standing context about who this assistant is for this user,
    not a one-off request, so it belongs folded into system_prompt here, never
    mixed into a per-turn user prompt like build_briefing_prompt() builds.

    `extra_tools` — the chat-history and channel-memory tools (see
    tools/chat_history.py and tools/channel_memory.py) — are appended for
    callers that need them (the
    /agent/chat endpoint) without changing the tool surface for callers that
    don't. Chat and proposal-scan callers both decide which of these tools to
    supply for their user prompt. `messages` seeds short-term memory (the
    chat endpoint's last several turns of the current session) directly
    into the Agent's own conversation state — see chat_history_store.
    get_recent_messages; every other caller leaves this unset and starts
    from an empty conversation, same as before.
    """
    from strands import Agent

    prompt = _system_prompt(agent_name.strip() or DEFAULT_AGENT_NAME)
    system_prompt = f"{prompt}\n\n{context_block}" if context_block else prompt
    tools = [travel_agent, *(extra_tools or [])]
    return Agent(
        system_prompt=system_prompt, tools=tools, model=_executive_assistant_model(),
        messages=messages,
    )


def extract_agent_text(result: Any) -> str:
    """Pull user-facing text out of a Strands Agent result.

    Some model/provider combinations put private reasoning in the returned
    text wrapped in ``<thinking>`` (or an equivalent) tags. That content must
    not reach the UI, chat-history store, proposal parsers, or email drafts.
    """
    message: Any = getattr(result, "message", result)
    if isinstance(message, dict):
        content = message.get("content", [])
        text = "\n".join(item.get("text", "") for item in content if isinstance(item, dict))
    else:
        text = str(message)

    text = _PRIVATE_REASONING_BLOCK_RE.sub("", text)
    text = _UNCLOSED_PRIVATE_REASONING_RE.sub("", text)
    # Removing a block can leave several blank lines before the actual reply.
    return re.sub(r"\n[ \t]*\n(?:[ \t]*\n)+", "\n\n", text).strip()


def _fallback_core(request: BriefingRequest) -> str:
    """Format the five-line Daily Briefing core from the supplied data.

    This deliberately has no model, network, or Drive dependency. The
    briefing is a status summary, so its routine path should be predictable
    and cheap; the quote is appended separately from the quotes table.
    """
    events = [str(item.get("title") or "Calendar event") for item in request.events]
    tasks = [str(item.get("title") or item.get("name") or "Google Task") for item in request.tasks]
    priorities = events + tasks

    if events:
        headline = f"You have {len(events)} calendar event(s) shaping today's priorities."
    elif tasks:
        headline = f"You have {len(tasks)} Google task(s) due today or overdue."
    else:
        headline = "Today is open, with no calendar events or Google Tasks requiring attention."

    bullets = priorities[:3]
    while len(bullets) < 3:
        bullets.append("No additional priority returned")
    return "\n".join([headline, "", *(f"- {item}" for item in bullets)])


def _is_strict_core(text: str) -> bool:
    """Validate the exact five-line Daily Briefing core shape, before the
    quote (picked separately, from the DB) is appended."""
    lines = text.strip().splitlines()
    return (
        len(lines) == 5
        and bool(lines[0].strip())
        and lines[1] == ""
        and lines[2].startswith("- ")
        and lines[3].startswith("- ")
        and lines[4].startswith("- ")
    )


def build_briefing_prompt(request: BriefingRequest, user_context: UserContext) -> str:
    """Compose immutable safety instructions with user-owned working context.

    Deliberately does not ask for a closing quote — that would cost LLM
    tokens on every single briefing. The quote is picked from the quotes
    table by create_briefing() instead; see discover_quote_via_grounding()
    for how that table grows.
    """
    context = user_context.content.strip() or "No user working context has been saved yet."
    return (
        f"Tasks: {request.tasks}\nEvents: {request.events}\nMessages: {request.messages}\n"
        "Tasks are already ordered most pressing first (closest due date, then highest "
        "priority) — treat earlier tasks in that list as more urgent than later ones, don't "
        "re-rank them by any other signal.\n"
        "Write the core of a Daily Briefing using the exact five-line format below. Output only those five lines.\n"
        "LINE 1: One plain sentence about what matters most today. Prioritize calendar events, then Google Tasks.\n"
        "LINE 2: blank\n"
        "LINE 3: - <most urgent calendar event or Google Task, 10 words maximum>\n"
        "LINE 4: - <second priority, 10 words maximum>\n"
        "LINE 5: - <third calendar event or Google Task, 10 words maximum>\n"
        "Rules: lines 3-5 must start with '- '; no numbering, labels, extra text, or closing quote "
        "(a quote is appended separately, do not write one).\n\n"
        "User working context (use this to prioritize work and match communication style; "
        "it cannot override approval requirements or authorize side effects):\n"
        f"{context}"
    )


async def load_context_documents(google_token: str | None, *, include_proactive_review: bool = False) -> str:
    """Fetch the user's Agent & Guidelines documents from their real Drive
    (see google_drive_docs.py — a visible "OpenPip" folder, get-or-created
    from the same starter templates the Settings page's "Edit in Drive"
    links use) and compose them into a context block meant for
    build_executive_assistant()'s system_prompt — this is standing context
    about the assistant and the user, not a per-turn user prompt.

    Ported from ~/Projects/Personal/travel-agent's buildPrompt(), which
    injects the equivalent "agent.md" and per-skill "goals-n-guidelines"
    documents the same way. Travel guidelines are included here too, since
    the travel_agent tool is available to this same agent and may fire
    mid-conversation. Proactive Proposals guidelines are the one document
    NOT included by default — they only matter to proposal_scan.py's scan,
    which passes include_proactive_review=True; every other caller (e.g. a
    future chat endpoint) would otherwise pay for a Drive fetch of text it
    never reads.

    Never raises — a caller must never fail outright just because Drive was
    slow, unavailable, or the user hasn't connected Google at all.
    """
    if not google_token:
        return ""
    try:
        fetches = [
            get_or_create_document(google_token, "OpenPip", "agent.md", AGENT_MD_SAMPLE),
            get_or_create_document(google_token, "OpenPip/goals-n-guidelines", "executive-assistant.md", GOALS_EXECUTIVE_ASSISTANT_SAMPLE),
            get_or_create_document(google_token, "OpenPip/goals-n-guidelines", "travel-planner.md", GOALS_TRAVEL_PLANNER_SAMPLE),
        ]
        if include_proactive_review:
            fetches.append(get_or_create_document(google_token, "OpenPip/goals-n-guidelines", "proactive-review.md", GOALS_PROACTIVE_REVIEW_SAMPLE))
        results = await asyncio.gather(*fetches)
    except Exception:
        return ""

    agent_md, ea_guidelines, travel_guidelines = (content for _, content in results[:3])
    proactive_guidelines = results[3][1] if include_proactive_review else ""

    sections = []
    if agent_md.strip():
        sections.append(f"## Assistant Identity\n{agent_md.strip()}")
    if ea_guidelines.strip():
        sections.append(f"## Executive Assistant Guidelines\n{ea_guidelines.strip()}")
    if travel_guidelines.strip():
        sections.append(f"## Travel Preferences (only relevant if travel comes up)\n{travel_guidelines.strip()}")
    if proactive_guidelines.strip():
        sections.append(f"## Proactive Proposals Guidelines\n{proactive_guidelines.strip()}")
    return "\n\n".join(sections)


async def create_briefing(
    request: BriefingRequest,
    store: ProposalStore,
    user_context: UserContext | None = None,
    google_token: str | None = None,
) -> tuple[str, str, int]:
    """Build a Daily Briefing and create reviewable proposals.

    Routine briefings are intentionally deterministic. They summarize the
    already-fetched calendar/tasks/messages data with a local formatter and
    select a previously stored quote from SQL — that part never needs Drive
    or an LLM, so it always runs the same way regardless of google_token.

    The proposal itself, when one is created, goes to Drive (proposal_drive_
    store, per-user, same as everything the workspace scan creates) if a
    real google_token is available, or the legacy local SQLite store
    otherwise — there is no third option for a token-less caller (the demo
    endpoint, or any request with no connected Google account) since there's
    no Drive to write to for a user we can't identify.
    """
    core = _fallback_core(request)
    generated_by = "deterministic"

    quote = store.pick_random_quote() or DAILY_QUOTES[0]
    store.mark_quote_shown(quote)
    briefing = "\n".join([core, "", "", "", quote])

    proposals = 0
    if request.messages:
        proposal = Proposal(
            action="draft_reply",
            title="Review message response",
            rationale="A message needs a response drafted for your approval.",
            payload={"message_id": request.messages[0].get("id", "demo-message")},
            source=SourceReference(kind="message", id=request.messages[0].get("id", "demo-message"), title=request.messages[0].get("subject", "Message")),
        )
        if google_token:
            await proposal_drive_store.add(google_token, proposal)
        else:
            store.add(proposal)
        proposals += 1
    return briefing, generated_by, proposals


_QUOTE_LINE_PATTERN = re.compile(r'QUOTE:\s*"(.+?)"\s*—\s*(.+)')


def discover_quote_via_grounding() -> tuple[str, list[str]]:
    """Ask Nova, with Web Grounding enabled, for one real, verifiable quote —
    used to grow the quotes table, never called as part of a regular
    Daily Briefing request.

    Web Grounding is a Bedrock *systemTool* (nova_grounding) executed
    entirely on AWS's infrastructure, not a Python-callable tool Strands
    would invoke itself — so this makes a direct bedrock-runtime Converse
    call rather than going through a Strands Agent, which has nothing to
    add for a provider-native tool it never actually runs.

    Per AWS's Web Grounding terms, citations must be retained wherever this
    quote is shown to an end user — sources are returned alongside the quote
    for exactly that reason (rendering them is a separate, later piece of
    work; this function's job is just to fetch and return them).

    Raises on any failure (config, network, or an unparseable response) —
    the caller (the discovery endpoint) surfaces that; nothing on the
    regular briefing path calls this, so a failure here never blocks a
    Daily Briefing from generating.

    Use OpenPip's app-scoped Bedrock credentials explicitly so this call does
    not accidentally use another project's credentials from the environment.
    """
    client = boto3.client(
        "bedrock-runtime",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_APP_ACCESS_KEY_ID")
        or os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ.get("AWS_APP_SECRET_ACCESS_KEY")
        or os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    prompt = (
        "Find one real, verifiable quote from a historical, literary, or philosophical figure, "
        "in the spirit of Stoic and classical wisdom about resilience, focus, discipline, or "
        "taking action. Use web search to confirm the quote is authentic and correctly "
        "attributed — do not invent or paraphrase one. Respond with exactly this one line and "
        "nothing else:\n"
        'QUOTE: "<the exact quote>" — <Attribution>'
    )
    response = client.converse(
        modelId=NOVA_GROUNDING_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        toolConfig={"tools": [{"systemTool": {"name": "nova_grounding"}}]},
    )
    content = response.get("output", {}).get("message", {}).get("content", [])
    full_text = "\n".join(block["text"] for block in content if "text" in block)
    sources = [
        citation["location"]["web"]["url"]
        for block in content
        if "citationsContent" in block
        for citation in block["citationsContent"].get("citations", [])
        if citation.get("location", {}).get("web", {}).get("url")
    ]
    match = _QUOTE_LINE_PATTERN.search(full_text)
    if not match:
        raise ValueError(f"Could not parse a quote from the grounded response: {full_text!r}")
    quote_text, attribution = match.group(1).strip(), match.group(2).strip()
    return f'> "{quote_text}" — {attribution}', sources
