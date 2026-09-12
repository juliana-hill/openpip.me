from openpip_backend.trip_pipeline import _has_source_linked_recommendations, _normalize_output


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


def test_source_linked_recommendations_require_both_categories() -> None:
    assert not _has_source_linked_recommendations({"stays": [{"sourceUrl": "https://stay.example"}]})
    assert not _has_source_linked_recommendations({"stays": [{"sourceUrl": "https://stay.example"}], "places": [{"name": "Missing link"}]})
    assert _has_source_linked_recommendations({
        "stays": [{"sourceUrl": "https://stay.example"}],
        "places": [{"sourceUrl": "https://place.example"}],
    })
