# Batched tool calls

A Strands tool that can plausibly be asked to do more than one thing in a
single agent turn should accept a list, not a single item — one tool call
(one round trip to the model) instead of N. Ported from
`~/Projects/Personal/travel-agent`'s own convention (see that project's
`src/mcp/travel-tools.ts`, specifically `search_web_multi` and
`schedule_linear_tasks`), which states the intent directly in the tool's own
description: *"...it counts as one tool call regardless of how many queries
you pass"* / *"...one atomic pass instead of N sequential writes"*.

This is **not** the same thing as concurrency. Strands' `Agent` already
defaults to a `ConcurrentToolExecutor` (`strands.agent.agent.Agent.__init__`:
`self.tool_executor = tool_executor or ConcurrentToolExecutor()`) — if the
model decides to call two *different* tools in one turn, they already run
concurrently, no code needed. Batching is about the model needing fewer
turns in the first place: instead of calling `search_chat_history` three
times for three keywords (three separate model round trips, three separate
inference calls), it calls it once with all three.

## Two distinct reasons a tool ends up batched

Worth keeping straight, since they lead to different designs:

- **Batching an expensive/rate-limited/lock-contending external call.**
  travel-agent's `search_web_multi` (loops sequentially with randomized
  delays between searches, to avoid bot detection) and
  `schedule_linear_tasks` ("one file-lock pass instead of N sequential
  writes"). The win here is fewer model round trips, not necessarily faster
  execution — the tool may still do its own work item-by-item internally.
  OpenPip's `travel_agent` and `search_chat_history` (below) are this
  flavor.
- **Batching a pure computation that's inherently whole-list.**
  travel-agent's `sort_routes`, `calculate_travel_cost`,
  `estimate_completion`, `schedule_tasks` (the focus-window packer) all
  take an array because the *algorithm* operates over the whole set at
  once (sorting, packing, totaling) — there's no "one call per item"
  version that would even make sense, independent of round-trip cost.
  OpenPip has no tools of this flavor yet.

## What OpenPip does today

- **`travel_agent`** (`backend/src/openpip_backend/tools/travel_agent.py`)
  — `travel_agent(requests: list[str])`, returns a JSON array, one entry
  per request in order. No live search/booking connector exists yet (see
  the tool's own `"planning_only"` result), so batching costs nothing
  today and means a future connector inherits the batched shape for free
  instead of needing a second migration.
- **`search_chat_history`** (`backend/src/openpip_backend/tools/chat_history.py`)
  — `search_chat_history(queries: list[str])`, returns results keyed by
  query. Loops sequentially over `chat_history_store.search_chat_history`
  per query — same trade as `search_web_multi`.

Both tools' actual logic lives in a plain, undecorated module-level
function (`plan_requests`, `search_queries`) that the `@tool`-decorated
function just calls. This is a testability requirement, not a style
choice: Strands wraps a decorated function into a `DecoratedFunctionTool`
object that can no longer be called like a normal Python function (no
`.func` passthrough), so `backend/tests/test_tools.py` exercises the plain
core directly instead. Importing that plain core from a test also needs
`importlib.import_module("openpip_backend.tools.<name>")` rather than a
normal `import` — `tools/__init__.py` does
`from .travel_agent import travel_agent`, which rebinds the `travel_agent`
attribute on the `tools` package to the tool object itself, shadowing the
submodule of the same name.

Both tools are wired into the Executive Assistant via `agent.py`'s
`build_executive_assistant(..., extra_tools=[...])` param, built per
request in `chat.py`'s `_run_chat` (they need a request-scoped
`access_token`, and `get_chat_history` additionally needs the current
`session_id` — see `tools/chat_history.py`'s own docstring for why these
are factories, not bare `@tool` functions).

## Where this pattern does *not* apply

Not every agent-driven loop in this codebase is a tool call, and the
pattern only applies where a tool actually exists to batch:

- **`proposal_scan.py`**'s per-batch scan loop and **`inbox_triage.py`**'s
  per-message classification loop both call a Strands `Agent` **directly**,
  once per item, inside their own Python `for` loops — no tool sits
  between the model and that call, so there is nothing to batch.
- `inbox_triage.py`'s loop is one call per unread email **deliberately** —
  the triage progress bar's granularity depends on it (see the loop's own
  comment in `_run_job`). Collapsing it into fewer, larger calls would
  regress that, not just be redundant.
- `proposal_scan.py`'s batches are genuinely sequential for a different
  reason: each batch's prompt re-reads `existing_pending` proposals
  created by *earlier batches of the same scan*, specifically so a later
  batch won't re-propose something an earlier batch already created.
  Parallelizing or merging batches would drop that same-scan dedup.

## Adding a new batched tool

1. Write the plain, undecorated core as a module-level function taking a
   `list[...]` — this is what tests call directly.
2. Wrap it in a thin `@tool`-decorated function (or factory, if it needs
   request-scoped state — see `tools/chat_history.py`).
3. State the batching explicitly in the tool's own `description`, in
   travel-agent's own phrasing: *"...counts as one tool call regardless of
   how many `<x>` you pass"*.
4. Add it to `agent.py`'s `build_executive_assistant`'s `tools=[...]` list
   (or pass it via `extra_tools` from a specific caller, if it needs
   per-request state).

**Forward-pointer, not yet built:** a future tool that lets the
executive-assistant chat or workspace scan actually create/schedule Google
Tasks (e.g. for the seasonal-sale-matching proposal signal — see
`guideline_templates.py`'s `GOALS_PROACTIVE_REVIEW_SAMPLE`) should follow
`schedule_linear_tasks`' exact precedent from day one: accept a list of
task specs and write them in one pass, never one task per call.
