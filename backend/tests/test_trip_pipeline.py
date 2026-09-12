import asyncio

import openpip_backend.trip_pipeline as trip_pipeline
from openpip_backend.trip_pipeline import (
    _gap_focus,
    _grounded_response,
    _has_recommendations,
    _missing_output_requirements,
    _normalize_output,
    _parse_grounded_text,
    _prompt_blocks,
    _stage_focus,
    _trip_prompt,
)


def _record() -> dict[str, object]:
    return {
        "destination": "Tokyo, Japan",
        "startDate": "2026-09-30",
        "endDate": "2026-10-07",
        "activities": ["city", "hiking"],
        "pace": "Balanced",
    }


def test_prompt_files_render_the_production_stage_inputs() -> None:
    template, = _prompt_blocks("trip-research-template.md")
    markdown_formats = _prompt_blocks("markdown-output-format.md")

    assert _stage_focus("conditions").startswith("weather, extreme heat")
    assert _stage_focus("health").startswith("vaccination and entry")
    assert _stage_focus("itinerary").startswith("a practical real-trip")
    assert not _stage_focus("itinerary").startswith("text")

    itinerary_prompt = _trip_prompt(_record(), _stage_focus("itinerary"))
    assert itinerary_prompt.startswith(template.split("{{destination}}", 1)[0])
    assert "Destination: Tokyo, Japan" in itinerary_prompt
    assert "Dates: 2026-09-30 to 2026-10-07" in itinerary_prompt
    assert "Activities: city, hiking" in itinerary_prompt
    assert "Pace: Balanced" in itinerary_prompt
    assert "Return a grounded Markdown itinerary report only." in itinerary_prompt
    assert markdown_formats[1] in itinerary_prompt
    assert "This is the itinerary stage." in itinerary_prompt
    assert "do not repeat the full conditions" in itinerary_prompt
    assert "Return JSON" not in itinerary_prompt
    assert "Use this exact output shape" not in itinerary_prompt

    conditions_prompt = _trip_prompt(_record(), _stage_focus("conditions"), "conditions")
    assert "Return a grounded Markdown research report only." in conditions_prompt
    assert "Where to stay" not in conditions_prompt
    assert "What to see" not in conditions_prompt
    assert "Return a grounded Markdown itinerary report only." not in conditions_prompt
    assert "Return JSON" not in conditions_prompt

    health_prompt = _trip_prompt(_record(), _stage_focus("health"), "health")
    assert "Where to stay" not in health_prompt
    assert "What to see" not in health_prompt
    assert "Return a grounded Markdown itinerary report only." not in health_prompt


def test_later_stage_prompt_receives_python_assembled_context() -> None:
    existing = {
        "signals": [{"category": "weather", "title": "Weather", "detail": "Rain likely.", "severity": "info"}],
        "preparation": [{"title": "Rain shell", "detail": "Pack waterproof clothing."}],
        "sources": [{"url": "https://weather.example/tokyo"}],
    }

    prompt = _trip_prompt(_record(), _stage_focus("health"), "health", existing)

    assert "Already found research:" in prompt
    assert "[weather (info)] Weather: Rain likely." in prompt
    assert "- Rain shell: Pack waterproof clothing." in prompt
    assert "https://weather.example/tokyo" in prompt
    assert "Required signal categories still missing" in prompt
    assert "altitude" in prompt
    assert "investigate only information that is missing" in prompt


def test_gap_completion_is_another_llm_call_not_a_validation_error(monkeypatch) -> None:
    missing = {"altitude", "fire", "uv"}
    present = [
        {"category": category, "title": category, "detail": "Checked", "severity": "info"}
        for category in trip_pipeline._REQUIRED_SIGNAL_CATEGORIES - missing
    ]
    record = {
        **_record(),
        "agent-pipeline-stage-results": {
            "conditions": {"result": {"signals": present, "preparation": [{"title": "Layers", "detail": "Pack layers."}]}, "sources": ["https://weather.example"]},
            "health": {"result": {"signals": [], "preparation": []}, "sources": []},
            "itinerary": {
                "result": {
                    "overview": "Tokyo",
                    "routeSummary": "Use rail.",
                    "days": [{"date": "2026-09-30", "title": "City", "detail": "Explore.", "route": "Rail", "conditions": "Mild."}],
                    "stays": [{"name": "Central hotel"}],
                    "places": [{"name": "Mount Takao"}],
                },
                "sources": ["https://guide.example/tokyo"],
            },
        },
    }
    gap_calls: list[tuple[str, dict[str, object]]] = []
    itinerary_calls: list[tuple[str, dict[str, object]]] = []

    def fake_stage(_record, stage, focus, existing_research=None):
        if stage == "itinerary":
            itinerary_calls.append((focus, existing_research or {}))
            return {
                "stays": [{"name": "Central hotel", "sourceUrl": "https://stay.example/tokyo"}],
                "places": [{"name": "Mount Takao", "sourceUrl": "https://trail.example/takao"}],
            }, []
        assert stage == "gap"
        gap_calls.append((focus, existing_research or {}))
        category = sorted(missing)[len(gap_calls) - 1]
        return {"signals": [{"category": category, "title": category, "detail": "Checked", "severity": "info"}]}, [f"https://{category}.example"]

    monkeypatch.setattr(trip_pipeline, "_run_grounded_stage", fake_stage)

    async def persist() -> None:
        return None

    output = asyncio.run(trip_pipeline._research_trip(record, {}, persist))

    categories = {signal["category"] for signal in output["signals"]}
    assert missing <= categories
    assert len(gap_calls) == 3
    assert len(itinerary_calls) == 1
    assert "## Altitude" in gap_calls[0][0]
    existing_categories = {signal["category"] for signal in gap_calls[0][1]["signals"]}
    assert {signal["category"] for signal in present} <= existing_categories


def test_grounded_parser_extracts_markdown_without_json_repair() -> None:
    raw = "Grounded result:\n\n## Overview\nTokyo\n\n## Weather\nMild conditions.\n"

    assert _parse_grounded_text(raw, "conditions") == {
        "overview": "Tokyo",
        "signals": [{
            "category": "weather",
            "title": "Weather",
            "detail": "Mild conditions.",
            "severity": "info",
        }],
        "preparation": [],
    }


def test_markdown_heading_can_supply_multiple_signal_categories() -> None:
    parsed = _parse_grounded_text(
        "## Fire & Volcanic Activity\nMonitor official alerts.\n\n## Health and Disease\nReview travel guidance.",
        "conditions",
    )

    assert [signal["category"] for signal in parsed["signals"]] == [
        "volcanic_activity",
        "fire",
        "disease",
        "health",
    ]


def test_preparation_bullets_can_supply_missing_signal_categories() -> None:
    parsed = _parse_grounded_text(
        "## Preparation\n- **UV:** Use sun protection.\n- **Altitude:** Acclimatize gradually.\n- **Wildfire risk:** Check closures.",
        "conditions",
    )

    assert {signal["category"] for signal in parsed["signals"]} == {"uv", "altitude", "fire"}


def test_grounded_parser_extracts_markdown_signals_preparation_and_urls() -> None:
    raw = """
    ## Weather
    Rain is possible. https://weather.example/tokyo

    ## Preparation
    - **Rain shell:** Bring waterproof clothing.

    ## Where to stay
    - **Verified hotel:** Central and near transit. https://stay.example/tokyo

    ## What to see
    - **Verified trail:** Check the official route. https://trail.example/takao
    """

    parsed = _parse_grounded_text(raw, "itinerary")

    assert parsed["signals"][0]["category"] == "weather"
    assert parsed["preparation"] == [{"title": "Rain shell", "detail": "Bring waterproof clothing."}]
    assert parsed["stays"][0]["sourceUrl"] == "https://stay.example/tokyo"
    assert parsed["places"][0]["sourceUrl"] == "https://trail.example/takao"


def test_normalize_output_keeps_recommendations_without_source_links() -> None:
    output = _normalize_output(
        {
            "stays": [
                {"name": "Verified stay", "type": "hotel", "sourceUrl": "https://www.stay.example/lodging/?utm_source=nova#hotel"},
                {"name": "Uncited stay", "type": "hotel"},
            ],
            "places": [{"name": "Verified place", "type": "hiking_trail", "sourceUrl": "https://place.example/trail/"}],
        },
        ["https://stay.example/lodging", "https://place.example/trail"],
        {"destination": "Tokyo, Japan"},
    )

    assert [item["name"] for item in output["stays"]] == ["Verified stay", "Uncited stay"]
    assert output["stays"][0]["sourceUrl"] == "https://stay.example/lodging"
    assert output["places"][0]["sourceUrl"] == "https://place.example/trail"
    assert _has_recommendations(output)


def test_normalize_output_preserves_item_urls_without_citation_metadata() -> None:
    output = _normalize_output(
        {
            "stays": [{"name": "Stay", "type": "hotel", "sourceUrl": "https://stay.example/tokyo"}],
            "places": [{"name": "Place", "type": "hiking_trail", "sourceUrl": "https://place.example/takao"}],
        },
        [],
        {"destination": "Tokyo, Japan"},
    )

    assert output["stays"][0]["sourceUrl"] == "https://stay.example/tokyo"
    assert output["places"][0]["sourceUrl"] == "https://place.example/takao"


def test_markdown_recommendations_keep_items_without_urls() -> None:
    parsed = _parse_grounded_text(
        """
        ## Where to stay
        - **Central hotel:** Near transit and useful for city days.

        ## What to see
        - **Mount Takao:** A marked trail with a direct train connection.
        """,
        "itinerary",
    )

    assert parsed["stays"] == [{
        "name": "Central hotel",
        "detail": "Near transit and useful for city days.",
        "area": "",
        "type": "hotel",
        "safety": "",
    }]
    assert parsed["places"] == [{
        "name": "Mount Takao",
        "detail": "A marked trail with a direct train connection.",
        "type": "hiking_trail",
        "route": "",
    }]


def test_markdown_recommendations_group_nested_fields_under_one_item() -> None:
    parsed = _parse_grounded_text(
        """
        ## Where to stay
        - **Shinjuku Area**
          - **Why it is a useful base:** Central, well-connected, and close to transit.
          - **Safety notes:** Stay aware in crowded areas. Source: https://stay.example/shinjuku

        ## What to see
        - **Mount Takao Trails**
          - **What to see or do:** Hike the marked trails.
          - **Route context:** Start at Takao Station. Source: https://trail.example/takao
        """,
        "itinerary",
    )

    assert parsed["stays"] == [{
        "name": "Shinjuku Area",
        "detail": "Central, well-connected, and close to transit.",
        "sourceUrl": "https://stay.example/shinjuku",
        "area": "",
        "type": "neighborhood",
        "safety": "Stay aware in crowded areas.",
    }]
    assert parsed["places"] == [{
        "name": "Mount Takao Trails",
        "detail": "Hike the marked trails.",
        "sourceUrl": "https://trail.example/takao",
        "type": "hiking_trail",
        "route": "Start at Takao Station.",
    }]


def test_markdown_recommendations_keep_source_url_on_the_same_item() -> None:
    parsed = _parse_grounded_text(
        """
        ## Where to stay
        - **Central hotel:** Near transit. Source: https://stay.example/tokyo

        ## What to see
        - **Mount Takao:** A marked trail. Source: https://trail.example/takao
        """,
        "itinerary",
    )

    assert parsed["stays"][0]["name"] == "Central hotel"
    assert parsed["stays"][0]["sourceUrl"] == "https://stay.example/tokyo"
    assert parsed["places"][0]["name"] == "Mount Takao"
    assert parsed["places"][0]["sourceUrl"] == "https://trail.example/takao"


def test_grounded_response_keeps_interleaved_citation_urls_with_recommendations(monkeypatch) -> None:
    class FakeBedrock:
        def converse(self, **_kwargs):
            return {
                "output": {
                    "message": {
                        "content": [
                            {"text": "## Where to stay\n- **Central hotel:** Near transit."},
                            {"citationsContent": {"citations": [{"location": {"web": {"url": "https://stay.example/tokyo"}}}]}},
                            {"text": "\n## What to see\n- **Mount Takao:** A marked trail."},
                            {"citationsContent": {"citations": [{"location": {"web": {"url": "https://trail.example/takao"}}}]}},
                        ]
                    }
                }
            }

    monkeypatch.setattr(trip_pipeline.boto3, "client", lambda *_args, **_kwargs: FakeBedrock())

    text, sources = _grounded_response("Find itinerary recommendations")
    parsed = _parse_grounded_text(text, "itinerary")

    assert sources == ["https://stay.example/tokyo", "https://trail.example/takao"]
    assert parsed["stays"][0]["sourceUrl"] == "https://stay.example/tokyo"
    assert parsed["places"][0]["sourceUrl"] == "https://trail.example/takao"


def test_research_resumes_from_saved_stage_results(monkeypatch) -> None:
    all_categories = [
        {"category": category, "title": category, "detail": "Checked", "severity": "info"}
        for category in trip_pipeline._REQUIRED_SIGNAL_CATEGORIES
    ]
    record = {
        **_record(),
        "agent-pipeline-stage-results": {
            "conditions": {
                "result": {"signals": all_categories, "preparation": [{"title": "Layers", "detail": "Pack layers."}]},
                "sources": ["https://weather.example/tokyo"],
            },
        },
    }
    called: list[str] = []
    contexts: dict[str, dict[str, object]] = {}

    def fake_stage(_record, stage, _focus, _existing_research=None):
        called.append(stage)
        contexts[stage] = _existing_research or {}
        if stage == "health":
            return {"preparation": [{"title": "Health kit", "detail": "Pack essentials."}]}, []
        return {
            "overview": "Tokyo",
            "routeSummary": "Transit to each researched area.",
            "days": [{"date": "2026-09-30", "title": "City day", "detail": "Explore.", "route": "Train", "conditions": "Mild."}],
                "stays": [{"name": "Central hotel", "type": "hotel", "sourceUrl": "https://stay.example/tokyo"}],
                "places": [{"name": "Mount Takao", "type": "hiking_trail", "sourceUrl": "https://trail.example/takao"}],
        }, ["https://guide.example/tokyo"]

    monkeypatch.setattr(trip_pipeline, "_run_grounded_stage", fake_stage)
    persisted: list[str] = []

    async def persist() -> None:
        persisted.append(str(record.get("agent-pipeline-stage")))

    output = asyncio.run(trip_pipeline._research_trip(record, {}, persist))

    assert called == ["health", "itinerary"]
    assert contexts["health"]["signals"] == all_categories
    assert contexts["itinerary"]["preparation"] == [
        {"title": "Layers", "detail": "Pack layers."},
        {"title": "Health kit", "detail": "Pack essentials."},
    ]
    assert output["stays"] == [{
        "name": "Central hotel",
        "area": "Area requires confirmation",
        "type": "other",
        "detail": "Verify this lodging option before relying on it.",
        "safety": "Review current neighborhood and access conditions.",
        "sourceUrl": "https://stay.example/tokyo",
    }]
    assert output["places"][0]["name"] == "Mount Takao"
    assert output["places"][0]["sourceUrl"] == "https://trail.example/takao"
    assert persisted[0] == "health and hazards"


def test_recommendations_require_both_categories_but_not_source_links() -> None:
    assert not _has_recommendations({"stays": [{"name": "Stay"}]})
    assert not _has_recommendations({
        "stays": [{"name": "Stay"}],
        "places": [],
    })
    assert _has_recommendations({
        "stays": [{"name": "Stay"}],
        "places": [{"name": "Place"}],
    })


def test_missing_output_requirements_reports_missing_sections() -> None:
    missing = _missing_output_requirements(
        {"signals": [{"category": "weather"}], "sources": [{"url": "https://example.com"}]},
        [],
    )

    assert missing == [
        "itinerary days",
        "preparation guidance",
        "places to stay",
        "places to see",
    ]


def test_missing_output_requirements_reports_missing_recommendation_links() -> None:
    missing = _missing_output_requirements(
        {
            "stays": [{"name": "Central hotel", "sourceUrl": None}],
            "places": [{"name": "Mount Takao", "sourceUrl": "https://trail.example/takao"}],
        },
        [],
    )

    assert "source links for places to stay" in missing
    assert "source links for places to see" not in missing


def test_recommendation_completion_merges_source_url_into_existing_item() -> None:
    merged = trip_pipeline._merge_stage_result(
        {"stays": [{"name": "Central hotel", "detail": "Near transit.", "sourceUrl": None}]},
        {"stays": [{"name": "Central hotel", "sourceUrl": "https://stay.example/tokyo"}]},
    )

    assert merged["stays"] == [{
        "name": "Central hotel",
        "detail": "Near transit.",
        "sourceUrl": "https://stay.example/tokyo",
    }]


def test_strands_stage_receives_the_file_backed_prompt_as_system_prompt(monkeypatch) -> None:
    import strands

    captured: dict[str, object] = {}
    raw = "## Overview\nTokyo\n"

    class FakeAgent:
        def __init__(self, **kwargs):
            captured.update(kwargs)

        def __call__(self, *_args, **_kwargs):
            return self

    monkeypatch.setattr(strands, "Agent", FakeAgent)
    monkeypatch.setattr(
        trip_pipeline,
        "_grounded_response",
        lambda _prompt: (raw, ["https://source.example"]),
    )

    parsed, sources = trip_pipeline._run_grounded_stage(
        _record(), "conditions", _stage_focus("conditions")
    )

    assert captured["system_prompt"] == _trip_prompt(_record(), _stage_focus("conditions"))
    assert parsed["overview"] == "Tokyo"
    assert sources == ["https://source.example"]
