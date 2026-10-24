import urllib.robotparser
import pytest
from app.crawlers.robots import RobotsChecker


@pytest.mark.asyncio
async def test_robots_checker_parsing_and_rules() -> None:
    """Verifies that RobotsChecker accurately respects Disallow and Allow directives."""
    checker = RobotsChecker()
    parser = urllib.robotparser.RobotFileParser()

    mock_rules = [
        "User-agent: SiftBot",
        "Disallow: /admin/",
        "Disallow: /private/",
        "Crawl-delay: 2",
        "Allow: /careers/",
    ]
    parser.parse(mock_rules)
    # Cache under the origin host so no live network call is made
    checker._cache["https://example.com"] = parser

    # Allowed path
    assert await checker.is_allowed("https://example.com/careers/engineering", user_agent="SiftBot") is True
    # Disallowed path
    assert await checker.is_allowed("https://example.com/admin/settings", user_agent="SiftBot") is False
    # Crawl delay
    assert await checker.get_crawl_delay("https://example.com/careers", user_agent="SiftBot") == 2.0


@pytest.mark.asyncio
async def test_robots_checker_caching() -> None:
    """Verifies that second request to same domain hits the cache."""
    checker = RobotsChecker()
    dummy_parser = urllib.robotparser.RobotFileParser()
    checker._cache["https://testdomain.org"] = dummy_parser

    p1 = await checker.get_parser("https://testdomain.org/jobs")
    p2 = await checker.get_parser("https://testdomain.org/about")
    assert p1 is dummy_parser
    assert p2 is dummy_parser
