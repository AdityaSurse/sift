import logging
import re
from typing import Optional

from pydantic import BaseModel, Field

from app.ai.client import GeminiClient
from app.db.models import EmploymentType, ExperienceLevel, RemoteType

logger = logging.getLogger(__name__)


class SearchIntent(BaseModel):
    """Pydantic model representing structured query parameters parsed from natural language.
    
    Why: Extracting exact filters (internship, location, remote) isolates hard constraints
    from semantic vector search, eliminating irrelevant search results.
    """

    role_keywords: Optional[str] = Field(
        default=None,
        description="Core functional role or technical keywords (e.g. 'embedded software', 'react engineer').",
    )
    employment_type: Optional[EmploymentType] = Field(
        default=None,
        description="Contract commitment tier (internship, full_time, part_time, contract). Return null if absent.",
    )
    max_duration_months: Optional[int] = Field(
        default=None,
        description="Tenure ceiling in months for internships or contracts. Return null if absent.",
    )
    experience_level: Optional[ExperienceLevel] = Field(
        default=None,
        description="Seniority tier (intern, entry, mid, senior). Map 'fresher' or 'junior' to entry. Return null if absent.",
    )
    location: Optional[str] = Field(
        default=None,
        description="Geographic city, state, or country name (e.g. 'Bangalore', 'London'). Return null if absent.",
    )
    remote_type: Optional[RemoteType] = Field(
        default=None,
        description="Work arrangement policy (onsite, hybrid, remote). Return null if absent.",
    )


SYSTEM_INTENT_PROMPT = """You are a natural language query parser for Sift, a job search engine.
Convert the user's natural language search query into a structured SearchIntent JSON object.

RULES:
1. Return null instead of guessing if an attribute is not explicitly mentioned or clearly implied in the query.
2. For 'employment_type': Recognize 'internship'/'intern', 'full_time'/'full time', 'part_time'/'part time', 'contract'.
3. For 'max_duration_months': Extract numbers preceding 'month', 'months', or 'mo' (e.g., '6 month' -> 6).
4. For 'experience_level':
   - 'fresher', 'entry level', 'junior', 'new grad' -> 'entry'
   - 'intern' -> 'intern'
   - 'mid', 'intermediate' -> 'mid'
   - 'senior', 'staff', 'principal', 'lead' -> 'senior'
5. For 'remote_type': 'remote'/'wfh' -> 'remote', 'hybrid' -> 'hybrid', 'onsite'/'in office' -> 'onsite'.
6. For 'location': Extract the target city, state, or country.
7. For 'role_keywords': Extract the primary role or domain stripped of the location, duration, and seniority attributes."""


def fallback_regex_parse(query: str) -> SearchIntent:
    """Heuristic fallback parser used for offline testing or when LLM API quota is unavailable.
    
    Why: High-availability search engines must provide graceful degradation even during third-party LLM outages.
    """
    q = query.strip()
    q_lower = q.lower()

    # 1. Employment Type
    emp_type: Optional[EmploymentType] = None
    if "internship" in q_lower or "intern" in q_lower:
        emp_type = EmploymentType.INTERNSHIP
    elif "part time" in q_lower or "part-time" in q_lower:
        emp_type = EmploymentType.PART_TIME
    elif "contract" in q_lower or "freelance" in q_lower:
        emp_type = EmploymentType.CONTRACT
    elif "full time" in q_lower or "full-time" in q_lower:
        emp_type = EmploymentType.FULL_TIME

    # 2. Duration (e.g., "6 month", "3-month")
    duration: Optional[int] = None
    dur_match = re.search(r"(\d+)\s*(?:month|mo|months)", q_lower)
    if dur_match:
        duration = int(dur_match.group(1))

    # 3. Experience Level
    exp_level: Optional[ExperienceLevel] = None
    if any(k in q_lower for k in ["fresher", "entry level", "entry-level", "junior", "new grad"]):
        exp_level = ExperienceLevel.ENTRY
    elif "senior" in q_lower or "lead" in q_lower or "staff" in q_lower:
        exp_level = ExperienceLevel.SENIOR
    elif "mid" in q_lower or "intermediate" in q_lower:
        exp_level = ExperienceLevel.MID
    elif emp_type == EmploymentType.INTERNSHIP and not exp_level:
        exp_level = ExperienceLevel.INTERN

    # 4. Remote Type
    rem_type: Optional[RemoteType] = None
    if "remote" in q_lower or "wfh" in q_lower:
        rem_type = RemoteType.REMOTE
    elif "hybrid" in q_lower:
        rem_type = RemoteType.HYBRID
    elif "onsite" in q_lower or "in office" in q_lower:
        rem_type = RemoteType.ONSITE

    # 5. Location Extraction (e.g. "in Bangalore", "in London")
    loc: Optional[str] = None
    loc_match = re.search(r"\bin\s+([A-Za-z\s]+?)(?:,|$|\s+(?:fresher|junior|senior|remote|hybrid|onsite))", q, re.IGNORECASE)
    if loc_match:
        loc = loc_match.group(1).strip()
    elif "usa" in q_lower:
        loc = "USA"

    # 6. Role Keywords: Strip detected tokens from query
    clean_q = q
    tokens_to_remove = [
        r"\b\d+\s*(?:month|mo|months)\b",
        r"\binternship\b",
        r"\bintern\b",
        r"\bfull[\s-]time\b",
        r"\bpart[\s-]time\b",
        r"\bcontract\b",
        r"\bfresher\b",
        r"\bentry[\s-]level\b",
        r"\bjunior\b",
        r"\bsenior\b",
        r"\blead\b",
        r"\bstaff\b",
        r"\bmid\b",
        r"\bremote\b",
        r"\bhybrid\b",
        r"\bonsite\b",
        r"\bin\s+[A-Za-z\s]+",
        r"\bUSA\b",
    ]
    for pattern in tokens_to_remove:
        clean_q = re.sub(pattern, " ", clean_q, flags=re.IGNORECASE)

    clean_q = re.sub(r"[,;]+", " ", clean_q)
    clean_q = re.sub(r"\s+", " ", clean_q).strip()

    return SearchIntent(
        role_keywords=clean_q if clean_q else None,
        employment_type=emp_type,
        max_duration_months=duration,
        experience_level=exp_level,
        location=loc,
        remote_type=rem_type,
    )


async def parse_query(
    query: str,
    client: Optional[GeminiClient] = None,
) -> SearchIntent:
    """Parses a natural-language job search query into structured SearchIntent.
    
    Why: Combines the semantic understanding of Gemini with an instant heuristic fallback
    to guarantee sub-second responses and fault tolerance.
    """
    clean_query = query.strip()
    if not clean_query:
        return SearchIntent()

    ai_client = client or GeminiClient()

    # If Gemini API key is missing, immediately utilize the heuristic parser
    if not ai_client.api_key or ai_client.api_key.startswith("dummy"):
        return fallback_regex_parse(clean_query)

    try:
        return await ai_client.generate_structured(
            prompt=f"User Query: {clean_query}",
            schema=SearchIntent,
            system_instruction=SYSTEM_INTENT_PROMPT,
            temperature=0.0,
        )
    except Exception as e:
        logger.warning("LLM query parsing failed (%s), falling back to rule-based parser", e)
        return fallback_regex_parse(clean_query)
