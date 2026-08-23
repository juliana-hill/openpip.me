"""Starter content for the Agent & Guidelines documents (see google_drive_docs.py
and app.py's /agent/agent-file, /agent/goals-n-guidelines/{skill} routes).

Ported from ~/Projects/Personal/travel-agent's agent/skills/*/goals-n-guidelines/
sample.md and agent/skills/agent.sample.md — same starter templates, same
"OpenPip" Drive folder convention, reimplemented for this backend's Python/
FastAPI stack rather than that project's Node service. Proactive Proposals'
template is included for completeness even though nothing reads it back yet
(see agent.py's load_context_documents and app.py's /agent/proposals/scan).
"""

AGENT_MD_SAMPLE = """# Assistant Identity

## Personality & tone
<!-- How should your assistant communicate? What's the vibe?
     Examples: friendly and casual, direct and no-nonsense, warm and encouraging -->
[Describe the personality and tone you want]

## Behaviors
<!-- What should your assistant always do or never do?
     Examples: keep things light, be concise, push back when I'm off track -->
- [Example: Keep things light and go with the flow]
- [Example: Be direct — skip the filler]

## About you
<!-- A few sentences about who you are. Shared across all skills.
     Include: profession, where you live, your general situation. -->
- I am a [profession] based in [city/state]
- [Add any other basics your assistant should always know about you]

## Life context
<!-- Ongoing context that shapes how your assistant helps you.
     Examples: family situation, major projects, recurring commitments -->
- [Example: I travel frequently for work between X and Y]
- [Example: I'm currently focused on Z]
"""

GOALS_EXECUTIVE_ASSISTANT_SAMPLE = """# Executive Assistant — Goals & Guidelines

## What I'm focused on right now
<!-- Current priorities the assistant should be protecting and driving -->
- [Example: Getting on top of my inbox — it's gotten out of control]
- [Example: Clearing out tasks that have been sitting there for weeks]
- [Example: Finding more time in my week for the work that actually matters]

## How I work
<!-- Schedule preferences, energy patterns, communication style -->
- [Example: I do my best work in the morning — keep that time clear if possible]
- [Example: I'd rather have fewer, longer blocks than a day full of small interruptions]
- [Example: Tell me what to do, not why — I don't need the explanation]
- [Example: I check messages a few times a day, not constantly]

## Standing rules
<!-- How you want decisions made and what authority the assistant has -->
- [Example: If something can come off my list, tell me — don't just add more]
- [Example: Flag conflicts or blockers before they become a problem]
- [Example: Don't schedule me before 9am or during lunch]

## What to avoid
- [Example: Don't give me a list of options when one is clearly better — just pick it]
- [Example: Don't add things without flagging what should come off]
"""

GOALS_TRAVEL_PLANNER_SAMPLE = """# Travel Planner — Goals & Guidelines

## Who I am (travel context)
<!-- Where you're based, who you travel with, your situation -->
- [Example: I'm based in [city/state]]
- [Example: I regularly travel between [X] and [Y] for work]
- [Example: I travel occasionally with [partner/family/alone]]

## Accommodation & cost rules
<!-- How accommodation works for you — who pays, what you have access to -->
- [Example: I always pay for accommodation when traveling]
- [Example: I have a timeshare I can use for vacation travel — check availability there first]
- [Example: When visiting [city], I stay with [person] for free]

## Travel preferences
<!-- How you like to travel, what matters most -->
- [Example: I prefer the fastest option over the cheapest for work travel]
- [Example: I prefer driving over flying for anything under 4 hours]
- [Example: I avoid red-eyes — always prefer morning departures]
- [Example: Public transit and trains over rideshare when practical]

## Transport & cost assumptions
<!-- How the agent should think about getting around -->
- [Example: Assume I do not own a car — always factor in rental or rideshare cost]
- [Example: Include door-to-door cost in any route estimate]

## Vacation priorities
<!-- What good time off looks like for you -->
- [Example: I want real downtime on vacation — not just a change of location]
- [Example: I'm open to package deals when they save significant money]
"""

GOALS_PROACTIVE_REVIEW_SAMPLE = """# Proactive Review — Goals & Guidelines

## Which system owns which work
<!-- Where each kind of task lives, so proposals route completions and updates to the right place -->
- [Example: Tasks for my main project live in one specific tracker — never propose adding or completing them anywhere else]
- [Example: Personal errands go on my local task list]
- [Example: Shared household tasks live in Google Tasks]

## Email confirmations that matter
<!-- Which kinds of emails count as real evidence that a task is done or a contact moved forward -->
- [Example: Order and shipping confirmations mean the matching purchase task is done]
- [Example: Appointment or booking confirmations mean the matching scheduling task is done]
- [Example: A reply from someone I reached out to should update that contact's status]

## How eager to be
<!-- Proposal appetite — how much should reach the review queue -->
- [Example: Only propose when the evidence is unmistakable — I'd rather miss one than review noise]
- [Example: A couple of proposals per scan is plenty]
- [Example: Prefer proposals that clear something off my plate over ones that add to it]

## Never propose
<!-- Hard exclusions the scan must respect -->
- [Example: Never treat a promotional or automated digest email as evidence of anything]
- [Example: Never propose changes to tasks in a system I manage by hand]
- [Example: Never propose status changes for a contact I've marked as paused]
"""

GOALS_SAMPLES = {
    "travel-planner": GOALS_TRAVEL_PLANNER_SAMPLE,
    "executive-assistant": GOALS_EXECUTIVE_ASSISTANT_SAMPLE,
    "proactive-review": GOALS_PROACTIVE_REVIEW_SAMPLE,
}
