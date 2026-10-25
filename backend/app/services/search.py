import logging
from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.client import GeminiClient
from app.ai.embed import embed_query_text
from app.ai.query_parser import SearchIntent, parse_query
from app.db.models import Job

logger = logging.getLogger(__name__)


class SearchResult(BaseModel):
    """Enriched search outcome containing job metadata, ranking score, and explainable match rationale.
    
    Why: Users and evaluators require transparent match reasons to understand why a job was surfaced.
    """

    job_id: str
    title: str
    company_name: str
    company_slug: str
    apply_url: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    remote_type: Optional[str] = None
    duration_months: Optional[int] = None
    skills: list[str] = Field(default_factory=list)
    score: float
    match_reasons: list[str]


def compute_match_reasons(
    job: Job,
    intent: SearchIntent,
    vector_sim: float,
    fts_rank: float,
) -> list[str]:
    """Generates human-readable badges explaining why this job matches the search criteria.
    
    Why: Explainable search builds user trust and makes hybrid relevance transparent.
    """
    reasons: list[str] = []

    # 1. Contract & Seniority match reasons
    if intent.employment_type and job.employment_type == intent.employment_type:
        reasons.append(f"Matches {job.employment_type.value} contract")
    if intent.max_duration_months and job.duration_months is not None:
        reasons.append(f"Tenure: {job.duration_months} mo (within <= {intent.max_duration_months} mo)")
    if intent.experience_level and job.experience_level == intent.experience_level:
        reasons.append(f"Seniority: {job.experience_level.value}")
    if intent.remote_type and job.remote_type == intent.remote_type:
        reasons.append(f"Work arrangement: {job.remote_type.value}")

    # 2. Location match
    if intent.location:
        loc_str = job.location_city or job.location_raw or ""
        if intent.location.lower() in loc_str.lower():
            reasons.append(f"Location matches '{intent.location}'")

    # 3. Matching skills
    if job.skills and intent.role_keywords:
        kw_tokens = set(intent.role_keywords.lower().split())
        matched_skills = [s for s in job.skills if s.lower() in kw_tokens or any(t in s.lower() for t in kw_tokens)]
        if matched_skills:
            reasons.append(f"Skills matched: {', '.join(matched_skills[:4])}")

    # 4. Semantic similarity
    if vector_sim > 0.65:
        reasons.append(f"Semantic match ({int(vector_sim * 100)}%)")
    elif fts_rank > 0.1:
        reasons.append("Exact keyword title match")

    if not reasons:
        reasons.append("Relevant opening match")

    return reasons


async def search_jobs_paginated(
    session: AsyncSession,
    query: Optional[str] = None,
    explicit_intent: Optional[SearchIntent] = None,
    page: int = 1,
    page_size: int = 20,
    client: Optional[GeminiClient] = None,
) -> tuple[list[SearchResult], int, SearchIntent]:
    """Executes a paginated hybrid search combining explicit filters, parsed query intent, vector cosine similarity, and FTS rank.
    
    Why: Explicit URL parameters override LLM-parsed attributes so user UI selections take strict precedence.
    """
    clean_query = query.strip() if query else ""
    ai_client = client or GeminiClient()

    # Step 1: Resolve SearchIntent from query text or explicit overrides
    if clean_query:
        intent = await parse_query(clean_query, client=ai_client)
        if explicit_intent:
            if explicit_intent.employment_type is not None:
                intent.employment_type = explicit_intent.employment_type
            if explicit_intent.max_duration_months is not None:
                intent.max_duration_months = explicit_intent.max_duration_months
            if explicit_intent.experience_level is not None:
                intent.experience_level = explicit_intent.experience_level
            if explicit_intent.location is not None:
                intent.location = explicit_intent.location
            if explicit_intent.remote_type is not None:
                intent.remote_type = explicit_intent.remote_type
            if explicit_intent.role_keywords is not None:
                intent.role_keywords = explicit_intent.role_keywords
    else:
        intent = explicit_intent.model_copy() if explicit_intent else SearchIntent()

    # Step 2: Generate embedding vector if search text or keywords are present
    query_vector: Optional[list[float]] = None
    embed_input = intent.role_keywords or clean_query
    if embed_input:
        try:
            query_vector = await embed_query_text(embed_input, client=ai_client)
        except Exception as e:
            logger.info("Could not generate query embedding (%s); proceeding with lexical/filter search", e)

    # Step 3: Construct SQL predicate conditions from SearchIntent
    conditions = [Job.is_open.is_(True)]

    if intent.employment_type is not None:
        conditions.append(Job.employment_type == intent.employment_type)

    if intent.max_duration_months is not None:
        conditions.append(
            or_(
                Job.duration_months.is_(None),
                Job.duration_months <= intent.max_duration_months,
            )
        )

    if intent.experience_level is not None:
        conditions.append(Job.experience_level == intent.experience_level)

    if intent.remote_type is not None:
        conditions.append(Job.remote_type == intent.remote_type)

    if intent.location is not None:
        loc_term = f"%{intent.location}%"
        conditions.append(
            or_(
                Job.location_city.ilike(loc_term),
                Job.location_country.ilike(loc_term),
                Job.location_raw.ilike(loc_term),
            )
        )

    # Step 4: Calculate total matching count
    count_stmt = select(func.count(Job.id)).where(*conditions)
    total_count = (await session.execute(count_stmt)).scalar_one()

    if total_count == 0:
        return [], 0, intent

    # Step 5: Construct hybrid scoring expression
    text_to_search = intent.role_keywords or clean_query
    if text_to_search:
        fts_rank_expr = func.coalesce(
            func.ts_rank_cd(Job.search_vector, func.plainto_tsquery("english", text_to_search)),
            0.0,
        )
    else:
        fts_rank_expr = func.coalesce(0.0, 0.0)

    if query_vector is not None:
        cosine_distance_expr = Job.embedding.cosine_distance(query_vector)
        vector_sim_expr = func.greatest(0.0, 1.0 - cosine_distance_expr)
        score_expr = func.coalesce((vector_sim_expr * 0.8) + (func.least(fts_rank_expr, 1.0) * 0.2), 0.0)
        order_clause = score_expr.desc()
    elif text_to_search:
        vector_sim_expr = func.coalesce(0.0, 0.0)
        score_expr = fts_rank_expr
        order_clause = score_expr.desc()
    else:
        vector_sim_expr = func.coalesce(0.0, 0.0)
        score_expr = func.coalesce(1.0, 1.0)
        order_clause = Job.first_seen_at.desc()

    # Step 6: Execute paginated query with company relationship loaded
    offset = max(0, (page - 1) * page_size)
    stmt = (
        select(Job, score_expr.label("hybrid_score"), vector_sim_expr.label("v_sim"), fts_rank_expr.label("f_rank"))
        .options(selectinload(Job.company))
        .where(*conditions)
        .order_by(order_clause)
        .offset(offset)
        .limit(page_size)
    )

    result = await session.execute(stmt)
    rows = result.all()

    results: list[SearchResult] = []
    for job, score, v_sim, f_rank in rows:
        reasons = compute_match_reasons(
            job=job,
            intent=intent,
            vector_sim=float(v_sim or 0.0),
            fts_rank=float(f_rank or 0.0),
        )

        results.append(
            SearchResult(
                job_id=str(job.id),
                title=job.title,
                company_name=job.company.name if job.company else "Unknown",
                company_slug=job.company.slug if job.company else "",
                apply_url=job.apply_url,
                location=job.location_raw or job.location_city,
                employment_type=job.employment_type.value if job.employment_type else None,
                experience_level=job.experience_level.value if job.experience_level else None,
                remote_type=job.remote_type.value if job.remote_type else None,
                duration_months=job.duration_months,
                skills=job.skills or [],
                score=round(float(score or 0.0), 3),
                match_reasons=reasons,
            )
        )

    return results, total_count, intent


async def search_jobs(
    query: str,
    session: AsyncSession,
    limit: int = 50,
    client: Optional[GeminiClient] = None,
) -> list[SearchResult]:
    """Compatibility wrapper preserving the single-page search interface."""
    results, _, _ = await search_jobs_paginated(
        session=session,
        query=query,
        page=1,
        page_size=limit,
        client=client,
    )
    return results

