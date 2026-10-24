import html
import re
import uuid
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.crawlers.base import RawJob
from app.db.models import EmploymentType, ExperienceLevel, RemoteType


def clean_html_to_text(html_content: Optional[str]) -> str:
    """Strips HTML markup and formats whitespace into clean readable plaintext.
    
    Why: HTML tags introduce token bloat and noise into semantic embeddings and
    PostgreSQL full-text tsvector indexes. Clean text ensures accurate lexical matching.
    """
    if not html_content:
        return ""

    # Unescape HTML entities first
    unescaped = html.unescape(html_content)
    soup = BeautifulSoup(unescaped, "html.parser")

    # Remove non-content elements
    for element in soup(["script", "style", "svg", "noscript", "iframe"]):
        element.decompose()

    # Replace breaks and paragraph boundaries with newlines
    for br in soup.find_all(["br", "p", "div", "li"]):
        br.insert_after("\n")

    text = soup.get_text()
    # Normalize multiple spaces and excess newlines
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
    return text


def parse_location(location_str: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """Separates a composite location string into city and country.
    
    Why: Faceted search allows users to filter by city (e.g. 'Berlin') or country ('Germany')
    independently of company-specific raw phrasing.
    """
    if not location_str:
        return None, None

    cleaned = location_str.strip()
    if not cleaned:
        return None, None

    parts = [p.strip() for p in cleaned.split(",") if p.strip()]
    if len(parts) == 1:
        return parts[0], None
    elif len(parts) >= 2:
        return parts[0], parts[-1]

    return None, None


def infer_remote_type(location_str: Optional[str], title: str, description: str) -> Optional[RemoteType]:
    """Infers whether the role is onsite, hybrid, or remote from text clues."""
    combined = f"{location_str or ''} {title} {description[:300]}".lower()

    if "hybrid" in combined:
        return RemoteType.HYBRID
    if "remote" in combined or "anywhere" in combined or "distributed" in combined:
        return RemoteType.REMOTE
    if "onsite" in combined or "on-site" in combined or "in-office" in combined:
        return RemoteType.ONSITE

    return None


def infer_employment_type(raw_type: Optional[str], title: str) -> EmploymentType:
    """Classifies contract commitment type."""
    combined = f"{raw_type or ''} {title}".lower()

    if "intern" in combined:
        return EmploymentType.INTERNSHIP
    if "contract" in combined or "contractor" in combined:
        return EmploymentType.CONTRACT
    if "part-time" in combined or "part time" in combined:
        return EmploymentType.PART_TIME

    return EmploymentType.FULL_TIME


def infer_experience_level(title: str) -> ExperienceLevel:
    """Normalizes seniority level from title prefixes and suffixes."""
    title_lower = title.lower()

    if "intern" in title_lower:
        return ExperienceLevel.INTERN
    if any(k in title_lower for k in ["senior", "sr.", "sr ", "staff", "principal", "lead", "director", "head"]):
        return ExperienceLevel.SENIOR
    if any(k in title_lower for k in ["junior", "jr.", "entry", "associate", "new grad", "graduate"]):
        return ExperienceLevel.ENTRY

    return ExperienceLevel.MID


def normalize_job(
    raw: RawJob, company_id: uuid.UUID, base_careers_url: str
) -> Dict[str, Any]:
    """Transforms a RawJob into a normalized dictionary ready for PostgreSQL persistence.
    
    Why: Consolidates cleaning, relative URL resolution, location parsing, and
    metadata standardization into a single deterministic transformation.
    """
    # 1. Clean description text
    clean_desc = (
        raw.description_text.strip()
        if raw.description_text and len(raw.description_text.strip()) > 20
        else clean_html_to_text(raw.description_html)
    )
    if not clean_desc:
        clean_desc = f"{raw.title}. Direct posting on company career board."

    # 2. Fully qualify apply link
    apply_url = urljoin(base_careers_url, raw.apply_url.strip())

    # 3. Parse location attributes
    city, country = parse_location(raw.location_raw)
    remote_type = infer_remote_type(raw.location_raw, raw.title, clean_desc)
    employment_type = infer_employment_type(raw.employment_type_raw, raw.title)
    experience_level = infer_experience_level(raw.title)

    return {
        "company_id": company_id,
        "external_id": raw.external_id.strip(),
        "title": raw.title.strip(),
        "description_text": clean_desc,
        "apply_url": apply_url,
        "location_raw": raw.location_raw.strip() if raw.location_raw else None,
        "location_city": city,
        "location_country": country,
        "remote_type": remote_type,
        "employment_type": employment_type,
        "experience_level": experience_level,
        "role_category": raw.department_raw.strip() if raw.department_raw else None,
        "posted_at": raw.posted_at,
        "is_open": True,
        "raw_payload": raw.raw_payload,
    }
