import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import GeminiClient
from app.db.models import Job

logger = logging.getLogger(__name__)


def format_job_for_embedding(
    title: str,
    role_category: Optional[str],
    skills: Optional[list[str]],
    description_text: str,
) -> str:
    """Formats structured job attributes into a compact document representation for semantic embedding.
    
    Why: Weighting the title, category, and skills alongside the lead description text
    ensures high semantic retrieval recall for both general and skill-specific queries.
    """
    category_str = role_category or "General"
    skills_str = ", ".join(skills) if skills else "None specified"
    lead_description = description_text[:1000].strip()

    return f"Title: {title}\nCategory: {category_str}\nSkills: {skills_str}\nDescription: {lead_description}"


async def embed_job_record(
    job: Job,
    client: Optional[GeminiClient] = None,
) -> list[float]:
    """Generates a 768-dimensional embedding vector for an individual job record."""
    ai_client = client or GeminiClient()
    content = format_job_for_embedding(
        title=job.title,
        role_category=job.role_category,
        skills=job.skills,
        description_text=job.description_text,
    )
    return await ai_client.embed_text(content)


async def embed_query_text(
    query: str,
    client: Optional[GeminiClient] = None,
) -> list[float]:
    """Generates an embedding vector for user search queries or keywords."""
    ai_client = client or GeminiClient()
    return await ai_client.embed_text(query.strip())


async def batch_embed_jobs(
    session: AsyncSession,
    batch_size: int = 50,
    client: Optional[GeminiClient] = None,
) -> int:
    """Populates missing embedding vectors for jobs in the database.
    
    Why: Batching embeddings minimizes network roundtrips and populates pgvector HNSW indexes.
    """
    ai_client = client or GeminiClient()

    query = select(Job).where(Job.embedding.is_(None)).limit(batch_size)
    result = await session.execute(query)
    jobs = result.scalars().all()
    embedded_count = 0

    for job in jobs:
        try:
            vector = await embed_job_record(job, client=ai_client)
            job.embedding = vector
            embedded_count += 1
        except Exception as e:
            logger.warning("Failed to generate embedding for job %s: %s", job.id, e)

    if embedded_count > 0:
        await session.commit()

    return embedded_count
