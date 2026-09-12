import json

import openpip_backend.trip_pipeline as trip_pipeline
from openpip_backend.trip_pipeline import (
    _grounded_json,
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
    template, normal_schema, itinerary_schema = _prompt_blocks("trip-research-template.md")

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
    assert f"Use this exact output shape: {itinerary_schema}" in itinerary_prompt
    assert normal_schema not in itinerary_prompt


def test_grounded_parser_extracts_json_embedded_in_grounding_prose() -> None:
    raw = 'Grounded result:\n{"overview":"Tokyo","signals":[],"preparation":[]}\nSources follow.'

    assert _parse_grounded_text(raw, "conditions") == {
        "overview": "Tokyo",
        "signals": [],
        "preparation": [],
    }


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
                {"name": "Verified stay", "sourceUrl": "https://www.stay.example/lodging/?utm_source=nova#hotel"},
                {"name": "Uncited stay"},
            ],
            "places": [{"name": "Verified place", "sourceUrl": "https://place.example/trail/"}],
        },
        ["https://stay.example/lodging", "https://place.example/trail"],
        {"destination": "Tokyo, Japan"},
    )

    assert [item["name"] for item in output["stays"]] == ["Verified stay", "Uncited stay"]
    assert output["stays"][0]["sourceUrl"] == "https://stay.example/lodging"
    assert output["places"][0]["sourceUrl"] == "https://place.example/trail"
    assert _has_recommendations(output)


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


def test_grounded_json_parses_raw_response_without_repair_call(monkeypatch) -> None:
    calls: list[dict[str, object]] = []

    class FakeClient:
        def converse(self, **kwargs):
            calls.append(kwargs)
            return {
                "output": {"message": {"content": [{
                    "text": "Grounded text: {\"overview\":\"Tokyo\",\"signals\":[],\"preparation\":[]}",
                    "citationsContent": {"citations": [{"location": {"web": {"url": "https://source.example"}}}]},
                }]}},
            }

    monkeypatch.setattr(trip_pipeline.boto3, "client", lambda *_, **__: FakeClient())

    parsed, sources = _grounded_json("research")

    assert parsed["overview"] == "Tokyo"
    assert sources == ["https://source.example"]
    assert len(calls) == 1
    assert "toolConfig" in calls[0]


def test_strands_stage_receives_the_file_backed_prompt_as_system_prompt(monkeypatch) -> None:
    import strands

    captured: dict[str, object] = {}
    raw = json.dumps({"overview": "Tokyo", "signals": [], "preparation": []})

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
