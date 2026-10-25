import math
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.query_parser import SearchIntent
from app.api.schemas import (
    ErrorResponse,
    FilterCategoryItem,
    FilterLocationItem,
    FilterOptionItem,
    FilterOptionsResponse,
    JobDetailResponse,
    ParsedIntentResponse,
    SearchItem,
    SearchResponse,
)
from app.db.models import EmploymentType, ExperienceLevel, Job, RemoteType
from app.db.session import get_db
from app.services.search import search_jobs_paginated

router = APIRouter(tags=["Jobs & Discovery"])

# Human-readable UI display labels for enums
EMPLOYMENT_TYPE_LABELS = {
    EmploymentType.INTERNSHIP: "Internship",
    EmploymentType.FULL_TIME: "Full-Time",
    EmploymentType.PART_TIME: "Part-Time",
    EmploymentType.CONTRACT: "Contract / Freelance",
}

EXPERIENCE_LEVEL_LABELS = {
    ExperienceLevel.INTERN: "Intern",
    ExperienceLevel.ENTRY: "Entry Level / Fresher",
    ExperienceLevel.MID: "Mid Level",
    ExperienceLevel.SENIOR: "Senior / Lead",
}

REMOTE_TYPE_LABELS = {
    RemoteType.REMOTE: "Remote",
    RemoteType.HYBRID: "Hybrid",
    RemoteType.ONSITE: "Onsite",
}


@router.get(
    "/search",
    response_model=SearchResponse,
    summary="Hybrid job search",
    description="Performs hybrid search combining natural-language query parsing, explicit SQL filters, vector similarity, and keyword ranking.",
    responses={
        422: {"model": ErrorResponse, "description": "Validation error on search parameters"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
)
async def search_endpoint(
    q: Optional[str] = Query(
        default=None,
        description="Natural-language search query (e.g. '6 month embedded software internship in Bangalore, fresher')",
    ),
    type: Optional[EmploymentType] = Query(
        default=None,
        description="Explicit contract type override (internship, full_time, part_time, contract)",
    ),
    max_months: Optional[int] = Query(
        default=None,
        ge=1,
        le=36,
        description="Explicit maximum contract or internship duration in months",
    ),
    level: Optional[ExperienceLevel] = Query(
        default=None,
        description="Explicit experience tier override (intern, entry, mid, senior)",
    ),
    location: Optional[str] = Query(
        default=None,
        description="Explicit city, state, or country substring filter",
    ),
    remote: Optional[RemoteType] = Query(
        default=None,
        description="Explicit remote arrangement override (remote, hybrid, onsite)",
    ),
    page: int = Query(default=1, ge=1, description="Page number for pagination"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_db),
) -> SearchResponse:
    """Executes a hybrid search query with explicit parameter precedence and pagination."""
    # Build explicit overrides container
    explicit_intent = SearchIntent(
        employment_type=type,
        max_duration_months=max_months,
        experience_level=level,
        location=location,
        remote_type=remote,
    )

    results, total, parsed_intent = await search_jobs_paginated(
        session=session,
        query=q,
        explicit_intent=explicit_intent,
        page=page,
        page_size=page_size,
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    items = [
        SearchItem(
            job_id=r.job_id,
            title=r.title,
            company_name=r.company_name,
            company_slug=r.company_slug,
            apply_url=r.apply_url,
            location=r.location,
            employment_type=r.employment_type,
            experience_level=r.experience_level,
            remote_type=r.remote_type,
            duration_months=r.duration_months,
            skills=r.skills,
            score=r.score,
            match_reasons=r.match_reasons,
        )
        for r in results
    ]

    parsed_intent_model = (
        ParsedIntentResponse(
            role_keywords=parsed_intent.role_keywords,
            employment_type=parsed_intent.employment_type.value if parsed_intent.employment_type else None,
            max_duration_months=parsed_intent.max_duration_months,
            experience_level=parsed_intent.experience_level.value if parsed_intent.experience_level else None,
            location=parsed_intent.location,
            remote_type=parsed_intent.remote_type.value if parsed_intent.remote_type else None,
        )
        if q
        else None
    )

    return SearchResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        parsed_intent=parsed_intent_model,
    )


@router.get(
    "/jobs/{id}",
    response_model=JobDetailResponse,
    summary="Retrieve job details by ID",
    description="Fetches full position details including full description, requirements, skills, and direct apply link.",
    responses={
        404: {"model": ErrorResponse, "description": "Job opening not found or no longer active"},
        422: {"model": ErrorResponse, "description": "Invalid UUID format"},
    },
)
async def get_job_by_id(
    id: uuid.UUID = Path(..., description="Unique UUID identifier of the job opening"),
    session: AsyncSession = Depends(get_db),
) -> JobDetailResponse:
    """Returns complete metadata and text for a verified active job opening."""
    stmt = (
        select(Job)
        .options(selectinload(Job.company))
        .where(Job.id == id, Job.is_open.is_(True))
    )
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job opening with ID '{id}' was not found or is closed.",
        )

    return JobDetailResponse(
        id=job.id,
        external_id=job.external_id,
        title=job.title,
        company_name=job.company.name if job.company else "Unknown",
        company_slug=job.company.slug if job.company else "",
        company_careers_url=job.company.careers_url if job.company else "",
        apply_url=job.apply_url,
        description_text=job.description_text,
        location_raw=job.location_raw,
        location_city=job.location_city,
        location_country=job.location_country,
        remote_type=job.remote_type.value if job.remote_type else None,
        employment_type=job.employment_type.value if job.employment_type else None,
        duration_months=job.duration_months,
        experience_level=job.experience_level.value if job.experience_level else None,
        role_category=job.role_category,
        skills=job.skills or [],
        posted_at=job.posted_at,
        first_seen_at=job.first_seen_at,
        is_open=job.is_open,
    )


@router.get(
    "/filters/options",
    response_model=FilterOptionsResponse,
    summary="Retrieve active filter facets",
    description="Aggregates distinct filter options and live job counts across active openings for UI facet generation.",
)
async def get_filter_options(
    session: AsyncSession = Depends(get_db),
) -> FilterOptionsResponse:
    """Computes facet counts for employment types, experience levels, remote policies, and categories."""
    # 1. Total active jobs
    total_open_stmt = select(func.count(Job.id)).where(Job.is_open.is_(True))
    total_open_jobs = (await session.execute(total_open_stmt)).scalar_one()

    # 2. Employment types breakdown
    emp_stmt = (
        select(Job.employment_type, func.count(Job.id))
        .where(Job.is_open.is_(True), Job.employment_type.is_not(None))
        .group_by(Job.employment_type)
        .order_by(func.count(Job.id).desc())
    )
    emp_rows = (await session.execute(emp_stmt)).all()
    employment_types = [
        FilterOptionItem(
            value=val.value,
            label=EMPLOYMENT_TYPE_LABELS.get(val, val.value.title()),
            count=cnt,
        )
        for val, cnt in emp_rows
    ]

    # 3. Experience levels breakdown
    exp_stmt = (
        select(Job.experience_level, func.count(Job.id))
        .where(Job.is_open.is_(True), Job.experience_level.is_not(None))
        .group_by(Job.experience_level)
        .order_by(func.count(Job.id).desc())
    )
    exp_rows = (await session.execute(exp_stmt)).all()
    experience_levels = [
        FilterOptionItem(
            value=val.value,
            label=EXPERIENCE_LEVEL_LABELS.get(val, val.value.title()),
            count=cnt,
        )
        for val, cnt in exp_rows
    ]

    # 4. Remote types breakdown
    rem_stmt = (
        select(Job.remote_type, func.count(Job.id))
        .where(Job.is_open.is_(True), Job.remote_type.is_not(None))
        .group_by(Job.remote_type)
        .order_by(func.count(Job.id).desc())
    )
    rem_rows = (await session.execute(rem_stmt)).all()
    remote_types = [
        FilterOptionItem(
            value=val.value,
            label=REMOTE_TYPE_LABELS.get(val, val.value.title()),
            count=cnt,
        )
        for val, cnt in rem_rows
    ]

    # 5. Role categories breakdown
    cat_stmt = (
        select(Job.role_category, func.count(Job.id))
        .where(Job.is_open.is_(True), Job.role_category.is_not(None))
        .group_by(Job.role_category)
        .order_by(func.count(Job.id).desc())
    )
    cat_rows = (await session.execute(cat_stmt)).all()
    role_categories = [
        FilterCategoryItem(value=val, count=cnt)
        for val, cnt in cat_rows
    ]

    # 6. Top locations breakdown
    loc_stmt = (
        select(Job.location_city, Job.location_country, func.count(Job.id))
        .where(Job.is_open.is_(True), Job.location_city.is_not(None))
        .group_by(Job.location_city, Job.location_country)
        .order_by(func.count(Job.id).desc())
        .limit(20)
    )
    loc_rows = (await session.execute(loc_stmt)).all()
    locations = [
        FilterLocationItem(city=city, country=country, count=cnt)
        for city, country, cnt in loc_rows
    ]

    return FilterOptionsResponse(
        employment_types=employment_types,
        experience_levels=experience_levels,
        remote_types=remote_types,
        role_categories=role_categories,
        locations=locations,
        total_open_jobs=total_open_jobs,
    )
