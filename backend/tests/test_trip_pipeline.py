import openpip_backend.trip_pipeline as trip_pipeline
from openpip_backend.trip_pipeline import _grounded_json, _has_source_linked_recommendations, _missing_output_requirements, _normalize_output


def test_normalize_output_keeps_only_recommendations_with_grounded_source_urls() -> None:
    output = _normalize_output(
        {
            "stays": [
                {"name": "Verified stay", "sourceUrl": "https://stay.example/"},
                {"name": "Uncited stay", "sourceUrl": "https://uncited.example"},
            ],
            "places": [{"name": "Verified place", "sourceUrl": "https://place.example"}],
        },
        ["https://stay.example", "https://place.example"],
        {"destination": "Tokyo, Japan"},
    )

    assert [item["name"] for item in output["stays"]] == ["Verified stay"]
    assert output["stays"][0]["sourceUrl"] == "https://stay.example"
    assert output["places"][0]["sourceUrl"] == "https://place.example"


def test_grounded_source_matching_ignores_canonical_url_variants() -> None:
    output = _normalize_output(
        {
            "stays": [{"name": "Verified stay", "sourceUrl": "https://www.stay.example/lodging/?utm_source=nova#hotel"}],
            "places": [{"name": "Verified place", "sourceUrl": "https://place.example/trail/"}],
        },
        ["https://stay.example/lodging", "https://place.example/trail"],
        {"destination": "Tokyo, Japan"},
    )

    assert output["stays"][0]["sourceUrl"] == "https://stay.example/lodging"
    assert output["places"][0]["sourceUrl"] == "https://place.example/trail"


def test_source_linked_recommendations_require_both_categories() -> None:
    assert not _has_source_linked_recommendations({"stays": [{"sourceUrl": "https://stay.example"}]})
    assert not _has_source_linked_recommendations({"stays": [{"sourceUrl": "https://stay.example"}], "places": [{"name": "Missing link"}]})
    assert _has_source_linked_recommendations({
        "stays": [{"sourceUrl": "https://stay.example"}],
        "places": [{"sourceUrl": "https://place.example"}],
    })


def test_missing_output_requirements_reports_sections_when_categories_are_complete() -> None:
    missing = _missing_output_requirements(
        {"signals": [{"category": "weather"}], "sources": [{"url": "https://example.com"}]},
        [],
    )

    assert missing == [
        "itinerary days",
        "preparation guidance",
        "source-linked places to stay",
        "source-linked places to see",
    ]


def test_malformed_json_uses_an_un_grounded_repair_call(monkeypatch) -> None:
    class FakeClient:
        def __init__(self):
            self.calls = []

        def converse(self, **kwargs):
            self.calls.append(kwargs)
            if len(self.calls) == 1:
                return {
                    "output": {"message": {"content": [
                        {
                            "text": '{"overview":"Broken", "signals":[{"category":"weather" "title":"Missing comma"}]}',
                            "citationsContent": {"citations": [{"location": {"web": {"url": "https://source.example"}}}]},
                        },
                    ]}},
                }
            return {"output": {"message": {"content": [{"text": '{"overview":"Repaired"}'}]}}}

    client = FakeClient()
    monkeypatch.setattr(trip_pipeline.boto3, "client", lambda *_, **__: client)

    parsed, sources = _grounded_json("research")

    assert parsed == {"overview": "Repaired"}
    assert sources == ["https://source.example"]
    assert "toolConfig" in client.calls[0]
    assert "toolConfig" not in client.calls[1]
