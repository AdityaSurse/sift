import re
from typing import Optional, Tuple
from urllib.parse import parse_qs, urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.config import get_settings
from app.db.models import ATSType

# Regex patterns to extract organization tokens from ATS URLs
GREENHOUSE_URL_RE = re.compile(
    r"(?:boards|job-boards)\.greenhouse\.io/(?:embed/job_board\?for=|v1/boards/)?([a-zA-Z0-9_-]+)",
    re.IGNORECASE,
)
LEVER_URL_RE = re.compile(
    r"jobs\.lever\.co/([a-zA-Z0-9_-]+)",
    re.IGNORECASE,
)
ASHBY_URL_RE = re.compile(
    r"jobs\.ashbyhq\.com/([a-zA-Z0-9_-]+)",
    re.IGNORECASE,
)
WORKABLE_URL_RE = re.compile(
    r"(?:apply\.workable\.com/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)\.workable\.com)",
    re.IGNORECASE,
)
SMARTRECRUITERS_URL_RE = re.compile(
    r"(?:jobs|careers)\.smartrecruiters\.com/([a-zA-Z0-9_-]+)",
    re.IGNORECASE,
)

# Common generic paths to ignore as tokens
GENERIC_TOKENS = {
    "embed",
    "js",
    "job_board",
    "search",
    "jobs",
    "careers",
    "en",
    "apply",
    "privacy",
    "terms",
    "api",
}


def extract_ats_from_url(url: str) -> Tuple[Optional[ATSType], Optional[str]]:
    """Analyzes a URL string directly against known ATS domain formats.
    
    Why: Checking URL patterns first avoids redundant network roundtrips when the
    careers_url is already hosted directly on the ATS (e.g. jobs.lever.co/figma).
    """
    if not url:
        return None, None

    parsed = urlparse(url)
    host = parsed.netloc.lower()
    path = parsed.path.strip("/")
    query_params = parse_qs(parsed.query)

    # 1. Greenhouse
    if "greenhouse.io" in host:
        # Check query string first: ?for=token
        if "for" in query_params and query_params["for"]:
            return ATSType.GREENHOUSE, query_params["for"][0].lower()
        # Check path: /token or /embed/job_board?for=token
        segments = [s for s in path.split("/") if s and s not in GENERIC_TOKENS]
        if segments:
            return ATSType.GREENHOUSE, segments[0].lower()
        return ATSType.GREENHOUSE, None

    # 2. Lever
    if "lever.co" in host:
        segments = [s for s in path.split("/") if s and s not in GENERIC_TOKENS]
        if segments:
            return ATSType.LEVER, segments[0].lower()
        return ATSType.LEVER, None

    # 3. Ashby
    if "ashbyhq.com" in host:
        segments = [s for s in path.split("/") if s and s not in GENERIC_TOKENS]
        if segments:
            return ATSType.ASHBY, segments[0].lower()
        return ATSType.ASHBY, None

    # 4. Workable
    if "workable.com" in host:
        subdomain = host.split(".workable.com")[0]
        if subdomain and subdomain not in ("apply", "www", "resources"):
            return ATSType.WORKABLE, subdomain.lower()
        segments = [s for s in path.split("/") if s and s not in GENERIC_TOKENS]
        if segments:
            return ATSType.WORKABLE, segments[0].lower()
        return ATSType.WORKABLE, None

    # 5. SmartRecruiters
    if "smartrecruiters.com" in host:
        segments = [s for s in path.split("/") if s and s not in GENERIC_TOKENS]
        if segments:
            return ATSType.SMARTRECRUITERS, segments[0].lower()
        return ATSType.SMARTRECRUITERS, None

    return None, None


def extract_ats_from_html(html_content: str) -> Tuple[ATSType, Optional[str]]:
    """Inspects HTML source code for embedded iframes, script tags, and outbound links.
    
    Why: Modern career pages often wrap third-party ATS portals inside iframes or
    dynamic JavaScript loader scripts on a custom domain.
    """
    if not html_content:
        return ATSType.CUSTOM, None

    soup = BeautifulSoup(html_content, "html.parser")

    # Clue 1: Inspect <iframe> sources
    for iframe in soup.find_all("iframe", src=True):
        src = iframe["src"]
        ats, token = extract_ats_from_url(src)
        if ats:
            return ats, token

    # Clue 2: Inspect <script> tags for embedded loaders and configurations
    for script in soup.find_all("script"):
        src = script.get("src", "")
        if src:
            ats, token = extract_ats_from_url(src)
            if ats:
                return ats, token
            # Greenhouse embed script pattern: boards.greenhouse.io/embed/job_board/js?for=company
            gh_match = GREENHOUSE_URL_RE.search(src)
            if gh_match and gh_match.group(1).lower() not in GENERIC_TOKENS:
                return ATSType.GREENHOUSE, gh_match.group(1).lower()

        # Inline script inspection
        text = script.string or script.text or ""
        if "greenhouse.io" in text:
            m = re.search(r"['\"]?for['\"]?\s*[:=]\s*['\"]([a-zA-Z0-9_-]+)['\"]", text)
            if m and m.group(1).lower() not in GENERIC_TOKENS:
                return ATSType.GREENHOUSE, m.group(1).lower()

    # Clue 3: Inspect <a> links directing to external job applications
    for a in soup.find_all("a", href=True):
        href = a["href"]
        ats, token = extract_ats_from_url(href)
        if ats and token:
            return ats, token

    # If no recognized ATS signatures match, classify as custom career page
    return ATSType.CUSTOM, None


async def detect_ats(
    careers_url: str,
    client: Optional[httpx.AsyncClient] = None,
    timeout_sec: float = 10.0,
) -> Tuple[ATSType, Optional[str]]:
    """Detects ATS type and company token for a given careers URL.
    
    Why: Connectors require the exact ATS protocol and company board slug to pull
    structured job postings via official public APIs.
    """
    if not careers_url or not careers_url.strip():
        return ATSType.UNKNOWN, None

    clean_url = careers_url.strip()

    # Step 1: Immediate URL pattern match before making any network call
    ats, token = extract_ats_from_url(clean_url)
    if ats and token:
        return ats, token

    # Step 2: Fetch career page with polite redirects and timeout
    settings = get_settings()
    headers = {"User-Agent": settings.sift_crawler_user_agent}

    try:
        if client:
            resp = await client.get(
                clean_url, follow_redirects=True, timeout=timeout_sec, headers=headers
            )
            final_url = str(resp.url)
            html = resp.text
        else:
            async with httpx.AsyncClient(
                follow_redirects=True, timeout=timeout_sec, headers=headers
            ) as session:
                resp = await session.get(clean_url)
                final_url = str(resp.url)
                html = resp.text

        # Step 3: Check if final redirected URL resolved to an ATS
        redirected_ats, redirected_token = extract_ats_from_url(final_url)
        if redirected_ats and redirected_token:
            return redirected_ats, redirected_token

        # Step 4: Parse HTML clues (iframes, scripts, links)
        return extract_ats_from_html(html)

    except Exception:
        # Why: Unreachable domains or timeouts default to custom without halting crawl batch
        return ATSType.CUSTOM, None
