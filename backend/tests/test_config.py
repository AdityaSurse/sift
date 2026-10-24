import pytest
from pydantic import ValidationError
from app.config import Settings, get_settings


def test_default_settings_load_successfully() -> None:
    """Verifies that default settings instantiate cleanly with polite crawler parameters."""
    settings = get_settings()
    assert settings.sift_crawler_default_delay_sec >= 1.0
    assert "SiftBot" in settings.sift_crawler_user_agent
    assert "linkedin.com" in settings.blacklisted_domains
    assert "indeed.com" in settings.blacklisted_domains


def test_crawler_rejects_aggressive_rate_limit() -> None:
    """Verifies that setting a delay under 1.0s raises a validation error to prevent aggressive crawling."""
    with pytest.raises(ValidationError):
        Settings(sift_crawler_default_delay_sec=0.2)


def test_crawler_rejects_anonymous_user_agent() -> None:
    """Verifies that an empty or contact-free User-Agent is rejected."""
    with pytest.raises(ValidationError):
        Settings(sift_crawler_user_agent="GenericBot")
