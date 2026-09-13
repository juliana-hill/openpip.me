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
    assert "Do not repeat the full conditions" in itinerary_prompt
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
    recommendation_calls: list[tuple[str, dict[str, object]]] = []

    def fake_stage(_record, stage, focus, existing_research=None):
        if stage == "recommendations":
            recommendation_calls.append((focus, existing_research or {}))
            return {
                "stays": [{"name": "Central hotel", "type": "hotel", "neighborhood": "Shinjuku", "description": "Near transit.", "sourceUrl": "https://stay.example/tokyo"}],
                "places": [{"name": "Mount Takao", "type": "hiking_trail", "description": "A marked trail.", "sourceUrl": "https://trail.example/takao"}],
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
    assert len(recommendation_calls) == 1
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


def test_preparation_schema_labels_become_specific_titles() -> None:
    parsed = _parse_grounded_text(
        """
        ## Preparation
        - **Preparation item:** Pack layers for variable temperatures and rain gear for typhoon season.
        - **Preparation item:** Download local emergency apps for real-time earthquake, tsunami, and volcanic alerts.
        - **Preparation item:** Check air quality before prolonged outdoor activity; carry a mask if sensitive.
        - **Travel Insurance:** Covering natural disaster disruptions and medical needs.
        """,
        "conditions",
    )

    assert [item["title"] for item in parsed["preparation"]] == [
        "Layers",
        "Local emergency apps",
        "Air quality",
        "Travel Insurance",
    ]
    assert all(item["title"].casefold() != "preparation item" for item in parsed["preparation"])


def test_grounded_parser_extracts_markdown_signals_preparation_and_urls() -> None:
    raw = """
    ## Weather
    Rain is possible. https://weather.example/tokyo

    ## Preparation
    - **Rain shell:** Bring waterproof clothing.

    ## Where to stay
    - **Verified hotel:** Category: hotel. Neighborhood: Shinjuku. Description: Central and near transit. https://stay.example/tokyo

    ## What to see
    - **Verified trail:** Category: hiking trail. Description: Check the official route. https://trail.example/takao
    """

    parsed = _parse_grounded_text(raw, "recommendations")

    assert parsed["signals"][0]["category"] == "weather"
    assert parsed["preparation"] == [{"title": "Rain shell", "detail": "Bring waterproof clothing."}]
    assert parsed["stays"][0]["sourceUrl"] == "https://stay.example/tokyo"
    assert parsed["places"][0]["sourceUrl"] == "https://trail.example/takao"


def test_normalize_output_filters_recommendations_without_required_fields() -> None:
    output = _normalize_output(
        {
            "stays": [
                {"name": "Verified stay", "type": "hotel", "neighborhood": "Shinjuku", "description": "Near transit.", "sourceUrl": "https://www.stay.example/lodging/?utm_source=nova#hotel"},
                {"name": "Uncited stay", "type": "hotel", "neighborhood": "Shinjuku"},
            ],
            "places": [{"name": "Verified place", "type": "hiking_trail", "description": "A marked trail.", "sourceUrl": "https://place.example/trail/"}, {"name": "Uncited place", "type": "museum"}],
        },
        ["https://stay.example/lodging", "https://place.example/trail"],
        {"destination": "Tokyo, Japan"},
    )

    assert [item["name"] for item in output["stays"]] == ["Verified stay"]
    assert output["stays"][0]["neighborhood"] == "Shinjuku"
    assert output["stays"][0]["sourceUrl"] == "https://stay.example/lodging"
    assert output["places"][0]["sourceUrl"] == "https://place.example/trail"
    assert _has_recommendations(output)


def test_normalize_output_keeps_inclusive_departure_day() -> None:
    days = [
        {"date": f"2026-10-{day:02d}", "title": f"Day {day}", "detail": "Explore."}
        for day in range(1, 8)
    ]
    days.insert(0, {"date": "2026-09-30", "title": "Arrival", "detail": "Arrive."})

    normalized = _normalize_output(
        {"days": days},
        [],
        {"destination": "Tokyo, Japan", "startDate": "2026-09-30", "endDate": "2026-10-07"},
    )

    assert len(normalized["days"]) == 8
    assert normalized["days"][0]["date"] == "2026-09-30"
    assert normalized["days"][-1]["date"] == "2026-10-07"


def test_normalize_output_preserves_item_urls_without_citation_metadata() -> None:
    output = _normalize_output(
        {
            "stays": [{"name": "Stay", "type": "hotel", "neighborhood": "Downtown", "description": "Near transit.", "sourceUrl": "https://stay.example/tokyo"}],
            "places": [{"name": "Place", "type": "hiking_trail", "description": "A marked trail.", "sourceUrl": "https://place.example/takao"}],
        },
        [],
        {"destination": "Tokyo, Japan"},
    )

    assert output["stays"][0]["sourceUrl"] == "https://stay.example/tokyo"
    assert output["places"][0]["sourceUrl"] == "https://place.example/takao"


def test_markdown_recommendations_require_explicit_categories_and_sources() -> None:
    parsed = _parse_grounded_text(
        """
        ## Where to stay
        - **Central hotel:** Near transit and useful for city days.

        ## What to see
        - **Mount Takao:** A marked trail with a direct train connection.
        """,
        "recommendations",
    )

    assert parsed["stays"] == []
    assert parsed["places"] == []


def test_markdown_recommendations_group_nested_fields_under_one_item() -> None:
    parsed = _parse_grounded_text(
        """
        ## Where to stay
        - **Park Hyatt Tokyo**
          Category: Hotel
          Neighborhood: Shinjuku
          - **Description:** Central, well-connected, and close to transit.
          - **Why it is a useful base:** Central, well-connected, and close to transit.
          - **Safety notes:** Stay aware in crowded areas. Source: https://stay.example/shinjuku

        ## What to see
        - **Mount Takao Trails**
          Category: Hiking trail
          - **Description:** Hike the marked trails.
          - **What to see or do:** Hike the marked trails.
          - **Route context:** Start at Takao Station. Source: https://trail.example/takao
        """,
        "recommendations",
    )

    assert parsed["stays"] == [{
        "name": "Park Hyatt Tokyo",
        "description": "Central, well-connected, and close to transit.",
        "sourceUrl": "https://stay.example/shinjuku",
        "neighborhood": "Shinjuku",
        "type": "hotel",
        "safety": "Stay aware in crowded areas.",
    }]
    assert parsed["places"] == [{
        "name": "Mount Takao Trails",
        "description": "Hike the marked trails.",
        "sourceUrl": "https://trail.example/takao",
        "type": "hiking_trail",
        "route": "Start at Takao Station.",
    }]


def test_generic_schema_titles_do_not_collapse_recommendations() -> None:
    parsed = _parse_grounded_text(
        """
        ## Where to stay
        - **Accommodation property:**
          - Category: Hotel
          - Neighborhood: Shinjuku
          - Description: Centrally located hotel near transit.
          - Source: https://www.keio.plaza-hotel.co.jp/en/
        - **Accommodation property:**
          - Category: Ryokan
          - Neighborhood: Asakusa
          - Description: Traditional Japanese inn near Senso-ji.
          - Source: https://www.hankyu-hotel.com/asakusa/

        ## What to see
        - **Place or activity:**
          - Category: Temple
          - Description: Historic Senso-ji Temple.
          - Source: https://place.example/sensoji
        - **Place or activity:**
          - Category: Hiking
          - Description: Mount Takao hiking trails.
          - Source: https://place.example/takao
        - **Place or activity:**
          - Category: Landmark
          - Description: Shibuya Crossing.
          - Source: https://place.example/shibuya
        """,
        "recommendations",
    )

    assert [item["name"] for item in parsed["stays"]] == ["Keio Plaza Hotel", "Hankyu Hotel"]
    assert [item["name"] for item in parsed["places"]] == ["Senso-ji Temple", "Mount Takao hiking trails", "Shibuya Crossing"]
    assert parsed["stays"][0]["description"] == "Centrally located hotel near transit."
    assert [item["type"] for item in parsed["places"]] == ["temple", "hiking_trail", "attraction"]


def test_markdown_recommendations_keep_source_url_on_the_same_item() -> None:
    parsed = _parse_grounded_text(
        """
        ## Where to stay
        - **Central hotel:** Category: hotel. Neighborhood: Shinjuku. Description: Near transit. Source: https://stay.example/tokyo

        ## What to see
        - **Mount Takao:** Category: hiking trail. Description: A marked trail. Source: https://trail.example/takao
        """,
        "recommendations",
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
                            {"text": "## Where to stay\n- **Central hotel:** Category: hotel. Neighborhood: Shinjuku. Description: Near transit."},
                            {"citationsContent": {"citations": [{"location": {"web": {"url": "https://stay.example/tokyo"}}}]}},
                            {"text": "\n## What to see\n- **Mount Takao:** Category: hiking trail. Description: A marked trail."},
                            {"citationsContent": {"citations": [{"location": {"web": {"url": "https://trail.example/takao"}}}]}},
                        ]
                    }
                }
            }

    monkeypatch.setattr(trip_pipeline.boto3, "client", lambda *_args, **_kwargs: FakeBedrock())

    text, sources = _grounded_response("Find itinerary recommendations")
    parsed = _parse_grounded_text(text, "recommendations")

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
        if stage == "recommendations":
            return {
                "stays": [{"name": "Central hotel", "type": "hotel", "neighborhood": "Shinjuku", "description": "Near transit.", "sourceUrl": "https://stay.example/tokyo"}],
                "places": [{"name": "Mount Takao", "type": "hiking_trail", "description": "A marked trail.", "sourceUrl": "https://trail.example/takao"}],
            }, ["https://guide.example/tokyo"]
        if stage == "itinerary":
            return {
                "overview": "Tokyo",
                "routeSummary": "Transit to each researched area.",
                "days": [{"date": "2026-09-30", "title": "City day", "detail": "Explore.", "route": "Train", "conditions": "Mild."}],
            }, ["https://guide.example/tokyo"]
        assert stage == "gap"
        category = sorted(missing)[len([stage for stage in called if stage == "gap"]) - 1]
        return {"signals": [{"category": category, "title": category, "detail": "Checked", "severity": "info"}]}, [f"https://{category}.example"]

    monkeypatch.setattr(trip_pipeline, "_run_grounded_stage", fake_stage)
    persisted: list[str] = []

    async def persist() -> None:
        persisted.append(str(record.get("agent-pipeline-stage")))

    output = asyncio.run(trip_pipeline._research_trip(record, {}, persist))

    assert called == ["health", "recommendations", "itinerary"]
    assert contexts["health"]["signals"] == all_categories
    assert contexts["itinerary"]["preparation"] == [
        {"title": "Layers", "detail": "Pack layers."},
        {"title": "Health kit", "detail": "Pack essentials."},
    ]
    assert output["stays"] == [{
        "name": "Central hotel",
        "neighborhood": "Shinjuku",
        "type": "hotel",
        "description": "Near transit.",
        "sourceUrl": "https://stay.example/tokyo",
    }]
    assert output["places"][0]["name"] == "Mount Takao"
    assert output["places"][0]["sourceUrl"] == "https://trail.example/takao"
    assert persisted[0] == "health and hazards"


def test_recommendations_require_categories_neighborhoods_and_source_links() -> None:
    assert not _has_recommendations({"stays": [{"name": "Stay"}]})
    assert not _has_recommendations({
        "stays": [{"name": "Stay"}],
        "places": [],
    })
    assert not _has_recommendations({
        "stays": [{"name": "Stay", "type": "hotel", "neighborhood": "Downtown", "description": "Near transit."}],
        "places": [{"name": "Place", "type": "museum", "description": "An exhibit.", "sourceUrl": "https://place.example"}],
    })
    assert _has_recommendations({
        "stays": [{"name": "Stay", "type": "hotel", "neighborhood": "Downtown", "description": "Near transit.", "sourceUrl": "https://stay.example"}],
        "places": [{"name": "Place", "type": "museum", "description": "An exhibit.", "sourceUrl": "https://place.example"}],
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
