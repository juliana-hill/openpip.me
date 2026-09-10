"""Tools that can be called by the OpenPip agents.

Tools are deliberately kept separate from agent instructions. An agent receives
the tool definitions at construction time and decides when a tool is relevant.

Batched tool calls: every tool here that can plausibly be given more than one
thing to do in a single turn should accept a list, not a single item — one
tool call (one round trip to the model) instead of N. Ported from
~/Projects/Personal/travel-agent's own convention (see that project's
src/mcp/travel-tools.ts, search_web_multi and schedule_linear_tasks in
particular). Two distinct reasons a tool ends up batched, worth keeping
straight since they lead to different designs:

  - Batching an expensive/rate-limited/lock-contending external call
    (travel_agent, search_chat_history here) — the win is fewer model round
    trips, not necessarily faster execution; the tool may still loop
    sequentially internally. State this explicitly in the tool's own
    description, travel-agent's own phrasing: "...counts as one tool call
    regardless of how many queries you pass" / "...one atomic pass instead
    of N sequential writes."
  - Batching a pure computation that's inherently whole-list (sorting,
    packing, totaling — travel-agent's sort_routes, schedule_tasks) — an
    array input is just the natural shape of the computation, independent
    of round-trip cost.

Not every agent-driven loop in this codebase is a tool call, and this
convention only applies where a tool actually exists to batch. proposal_scan.py
and inbox_triage.py both call a Strands Agent directly, once per item, inside
their own Python loops — no tool sits between the model and that call, so
there's nothing here to batch. inbox_triage.py's loop is one call per unread
email deliberately (the triage progress bar depends on that granularity), not
an oversight.

Forward-pointer, not yet built: a future tool that lets the executive-assistant
chat or workspace scan actually create/schedule Google Tasks (e.g. for the
seasonal-sale-matching proposal signal — see guideline_templates.py's
GOALS_PROACTIVE_REVIEW_SAMPLE) should follow schedule_linear_tasks' exact
precedent from day one: accept a list of task specs and write them in one
pass, never one task per call.
"""

from .chat_history import build_get_chat_history_tool, build_search_chat_history_tool
from .channel_memory import build_lookup_channel_memory_tool, build_remember_channel_preference_tool
from .insights import build_lookup_insights_tool, build_read_historical_source_tool, build_remember_insight_tool, build_search_historical_sources_tool
from .travel_agent import travel_agent

__all__ = [
    "travel_agent",
    "build_get_chat_history_tool",
    "build_search_chat_history_tool",
    "build_lookup_channel_memory_tool",
    "build_remember_channel_preference_tool",
    "build_lookup_insights_tool",
    "build_read_historical_source_tool",
    "build_remember_insight_tool",
    "build_search_historical_sources_tool",
]
