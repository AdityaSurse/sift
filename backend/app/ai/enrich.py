import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import GeminiClient
from app.db.models import EmploymentType, ExperienceLevel, Job, RemoteType

logger = logging.getLogger(__name__)

# Fixed list of canonical tech role categories
ROLE_CATEGORIES: list[str] = [
    "Backend Engineering",
    "Frontend Engineering",
    "Fullstack Engineering",
    "Mobile Engineering",
    "DevOps / Infrastructure / Cloud",
    "Data Engineering",
    "Machine Learning / AI",
    "Security Engineering",
    "Systems / Embedded Engineering",
    "QA / Test Engineering",
    "Product Management",
    "Product Design",
    "Developer Relations",
    "Engineering Management",
    "Other",
]


class EnrichedJob(BaseModel):
    """Pydantic schema enforcing structured validation of LLM-enriched job fields.
    
    Why: Strict schema validation prevents hallucinated enums from corrupting database columns.
    """

    employment_type: Optional[EmploymentType] = Field(
        default=None,
        description="Contract commitment tier (internship, full_time, part_time, contract). Return null if absent or uncertain.",
    )
    duration_months: Optional[int] = Field(
        default=None,
        description="Explicit tenure in months for internships or fixed-term positions. Return null if absent or permanent.",
    )
    experience_level: Optional[ExperienceLevel] = Field(
        default=None,
        description="Seniority tier (intern, entry, mid, senior). Return null if unspecified.",
    )
    role_category: Optional[str] = Field(
        default=None,
        description="Broad discipline from the allowed role categories list. Return null if no close match.",
    )
    skills: list[str] = Field(
        default_factory=list,
        max_length=12,
        description="Up to 12 canonical technical skills, frameworks, tools, or languages explicitly mentioned.",
    )
    remote_type: Optional[RemoteType] = Field(
        default=None,
        description="Workplace policy (onsite, hybrid, remote). Return null if not stated.",
    )


def compute_description_hash(description: str) -> str:
    """Computes a SHA-256 digest of clean job text to detect edits and prevent redundant LLM billing."""
    return hashlib.sha256(description.strip().encode("utf-8")).hexdigest()


SYSTEM_ENRICHMENT_PROMPT = f"""You are a precise job classification engine for Sift.
Analyze the provided job title and job description to extract structured attributes into valid JSON.

INVARIANTS:
1. Return null instead of guessing if an attribute is not explicitly mentioned or clearly stated.
2. For 'role_category', select strictly from the following categories, or null if none fit:
{ROLE_CATEGORIES}
3. For 'skills', extract up to 12 core technical skills, programming languages, libraries, or tools mentioned in the text.
4. For 'duration_months', only supply an integer if the posting explicitly states an internship or contract tenure (e.g. '6 month internship' -> 6). Never guess duration for full-time roles."""


async def enrich_job_content(
    title: str,
    description_text: str,
    client: Optional[GeminiClient] = None,
) -> EnrichedJob:
    """Enriches a single job opening with structured fields using Gemini with low temperature."""
    ai_client = client or GeminiClient()
    prompt = f"Job Title: {title}\n\nJob Description:\n{description_text[:6000]}"

    return await ai_client.generate_structured(
        prompt=prompt,
        schema=EnrichedJob,
        system_instruction=SYSTEM_ENRICHMENT_PROMPT,
        temperature=0.1,
    )


async def batch_enrich_jobs(
    session: AsyncSession,
    batch_size: int = 50,
    client: Optional[GeminiClient] = None,
) -> int:
    """Batches and enriches pending jobs where enriched_at is null or description_hash changed.
    
    Why: Skipping already-enriched rows protects API rate limits and keeps enrichment costs predictable.
    """
    ai_client = client or GeminiClient()

    # Query candidate jobs that lack enrichment timestamps or hashes
    query = (
        select(Job)
        .where(
            or_(
                Job.enriched_at.is_(None),
                Job.description_hash.is_(None),
            )
        )
        .limit(batch_size)
    )

    result = await session.execute(query)
    jobs = result.scalars().all()
    enriched_count = 0

    for job in jobs:
        current_hash = compute_description_hash(job.description_text)
        # Skip if description hash matches and job is already marked enriched
        if job.enriched_at is not None and job.description_hash == current_hash:
            continue

        try:
            enriched = await enrich_job_content(
                title=job.title,
                description_text=job.description_text,
                client=ai_client,
            )

            # Apply enriched attributes if extracted, falling back to existing data if null
            if enriched.employment_type is not None:
                job.employment_type = enriched.employment_type
            if enriched.duration_months is not None:
                job.duration_months = enriched.duration_months
            if enriched.experience_level is not None:
                job.experience_level = enriched.experience_level
            if enriched.role_category:
                job.role_category = enriched.role_category
            if enriched.skills:
                job.skills = enriched.skills
            if enriched.remote_type is not None:
                job.remote_type = enriched.remote_type

            job.description_hash = current_hash
            job.enriched_at = datetime.now(timezone.utc)
            enriched_count += 1
        except Exception as e:
            logger.warning("Failed to enrich job %s: %s", job.id, e)

    if enriched_count > 0:
        await session.commit()

    return enriched_count
