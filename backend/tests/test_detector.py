from pathlib import Path

from app.crawlers.detector import (
    extract_ats_from_html,
    extract_ats_from_url,
)
from app.db.models import ATSType

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def read_fixture(filename: str) -> str:
    """Helper to load HTML fixture files from disk."""
    return (FIXTURES_DIR / filename).read_text(encoding="utf-8")


def test_url_pattern_detection_greenhouse() -> None:
    """Verifies direct URL detection for Greenhouse job boards."""
    ats, token = extract_ats_from_url("https://boards.greenhouse.io/datadog")
    assert ats == ATSType.GREENHOUSE
    assert token == "datadog"

    ats, token = extract_ats_from_url("https://boards.greenhouse.io/embed/job_board?for=linear")
    assert ats == ATSType.GREENHOUSE
    assert token == "linear"


def test_url_pattern_detection_lever() -> None:
    """Verifies direct URL detection for Lever postings."""
    ats, token = extract_ats_from_url("https://jobs.lever.co/figma")
    assert ats == ATSType.LEVER
    assert token == "figma"


def test_url_pattern_detection_ashby() -> None:
    """Verifies direct URL detection for Ashby job boards."""
    ats, token = extract_ats_from_url("https://jobs.ashbyhq.com/together")
    assert ats == ATSType.ASHBY
    assert token == "together"


def test_url_pattern_detection_workable() -> None:
    """Verifies direct URL detection for Workable applications."""
    ats, token = extract_ats_from_url("https://apply.workable.com/huggingface")
    assert ats == ATSType.WORKABLE
    assert token == "huggingface"


def test_url_pattern_detection_smartrecruiters() -> None:
    """Verifies direct URL detection for SmartRecruiters portals."""
    ats, token = extract_ats_from_url("https://jobs.smartrecruiters.com/WesternDigital")
    assert ats == ATSType.SMARTRECRUITERS
    assert token == "westerndigital"


def test_html_clue_detection_greenhouse_iframe() -> None:
    """Verifies HTML detection when Greenhouse is embedded via an iframe."""
    html = read_fixture("greenhouse_iframe.html")
    ats, token = extract_ats_from_html(html)
    assert ats == ATSType.GREENHOUSE
    assert token == "linear"


def test_html_clue_detection_greenhouse_script() -> None:
    """Verifies HTML detection when Greenhouse is loaded via a script tag."""
    html = read_fixture("greenhouse_script.html")
    ats, token = extract_ats_from_html(html)
    assert ats == ATSType.GREENHOUSE
    assert token == "stripe"


def test_html_clue_detection_lever_links() -> None:
    """Verifies HTML detection when Lever job links are present in anchors."""
    html = read_fixture("lever_links.html")
    ats, token = extract_ats_from_html(html)
    assert ats == ATSType.LEVER
    assert token == "figma"


def test_html_clue_detection_ashby_iframe() -> None:
    """Verifies HTML detection when Ashby is embedded in an iframe."""
    html = read_fixture("ashby_iframe.html")
    ats, token = extract_ats_from_html(html)
    assert ats == ATSType.ASHBY
    assert token == "together"


def test_html_clue_detection_workable_links() -> None:
    """Verifies HTML detection when Workable job links are present."""
    html = read_fixture("workable_links.html")
    ats, token = extract_ats_from_html(html)
    assert ats == ATSType.WORKABLE
    assert token == "huggingface"


def test_html_clue_detection_smartrecruiters_iframe() -> None:
    """Verifies HTML detection when SmartRecruiters is embedded in an iframe."""
    html = read_fixture("smartrecruiters_iframe.html")
    ats, token = extract_ats_from_html(html)
    assert ats == ATSType.SMARTRECRUITERS
    assert token == "westerndigital"


def test_html_clue_detection_custom_portal() -> None:
    """Verifies that pages without ATS signatures are classified as CUSTOM."""
    html = read_fixture("custom_portal.html")
    ats, token = extract_ats_from_html(html)
    assert ats == ATSType.CUSTOM
    assert token is None
