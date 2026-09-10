from openpip_backend import calle


def test_api_key_accepts_the_existing_project_env_name(monkeypatch) -> None:
    monkeypatch.delenv("CALLE_API_KEY", raising=False)
    monkeypatch.setenv("CALL_E_API_KEY", "configured-but-not-read-here")

    assert calle._api_key() == "configured-but-not-read-here"


def test_api_key_accepts_the_official_alias(monkeypatch) -> None:
    monkeypatch.delenv("CALL_E_API_KEY", raising=False)
    monkeypatch.setenv("CALLE_API_KEY", "configured-but-not-read-here")

    assert calle._api_key() == "configured-but-not-read-here"


def test_missing_api_key_is_clear(monkeypatch) -> None:
    monkeypatch.delenv("CALL_E_API_KEY", raising=False)
    monkeypatch.delenv("CALLE_API_KEY", raising=False)

    try:
        calle._api_key()
    except calle.CalleError as error:
        assert str(error) == "CALL_E_API_KEY or CALLE_API_KEY is not configured"
    else:  # pragma: no cover - assertion keeps the test readable on failure
        raise AssertionError("missing CALL-E credentials should be rejected")
