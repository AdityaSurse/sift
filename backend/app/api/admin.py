from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.models import Company, CrawlRun, CrawlStatus, Job
from app.db.session import get_db

router = APIRouter(prefix="/admin", tags=["Admin & Operations"])
settings = get_settings()


async def verify_admin_token(
    x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token"),
    authorization: Optional[str] = Header(default=None),
) -> str:
    """Validates the incoming administrative token from headers.
    
    Why: Prevents public reconnaissance of internal ingestion errors,
    crawler health logs, and infrastructure metrics.
    """
    token = x_admin_token
    if not token and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    expected = settings.sift_admin_token
    if not token or token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


class AtsJobCount(BaseModel):
    ats: str
    count: int


class FailedCrawlItem(BaseModel):
    id: str
    company_name: str
    company_slug: str
    error_message: Optional[str]
    started_at: datetime
    jobs_found: int


class StaleCompanyItem(BaseModel):
    id: str
    name: str
    slug: str
    careers_url: str
    ats_type: str
    last_crawled_at: Optional[datetime]


class AdminSummary(BaseModel):
    total_companies: int
    total_jobs: int
    total_open_jobs: int
    total_enriched_jobs: int
    total_embeddings: int
    failed_crawls_7d_count: int


class AdminStatsResponse(BaseModel):
    summary: AdminSummary
    jobs_per_ats: List[AtsJobCount]
    failed_crawls_7d: List[FailedCrawlItem]
    stale_companies: List[StaleCompanyItem]


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Internal administrative discovery & crawler metrics",
    description="Returns aggregate health metrics, ATS distributions, 7-day crawl failures, and stale company boards.",
)
async def get_admin_stats(
    session: AsyncSession = Depends(get_db),
    _token: str = Depends(verify_admin_token),
) -> AdminStatsResponse:
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # 1. High-level counts
    total_companies = (await session.execute(select(func.count(Company.id)))).scalar_one()
    total_jobs = (await session.execute(select(func.count(Job.id)))).scalar_one()
    total_open_jobs = (
        await session.execute(select(func.count(Job.id)).where(Job.is_open.is_(True)))
    ).scalar_one()
    total_enriched_jobs = (
        await session.execute(
            select(func.count(Job.id)).where(Job.enriched_at.is_not(None))
        )
    ).scalar_one()
    total_embeddings = (
        await session.execute(
            select(func.count(Job.id)).where(Job.embedding.is_not(None))
        )
    ).scalar_one()

    # 2. Jobs per ATS type (grouped via Company.ats_type)
    ats_stmt = (
        select(Company.ats_type, func.count(Job.id))
        .join(Job, Job.company_id == Company.id)
        .where(Job.is_open.is_(True))
        .group_by(Company.ats_type)
        .order_by(func.count(Job.id).desc())
    )
    ats_res = await session.execute(ats_stmt)
    jobs_per_ats = [
        AtsJobCount(ats=row[0].value if hasattr(row[0], "value") else str(row[0]), count=row[1])
        for row in ats_res.all()
    ]

    # 3. Failed crawls in the last 7 days
    failed_stmt = (
        select(CrawlRun)
        .options(selectinload(CrawlRun.company))
        .where(
            CrawlRun.status == CrawlStatus.FAILED,
            CrawlRun.started_at >= seven_days_ago,
        )
        .order_by(CrawlRun.started_at.desc())
        .limit(50)
    )
    failed_res = await session.execute(failed_stmt)
    failed_runs = failed_res.scalars().all()

    failed_crawls_7d = [
        FailedCrawlItem(
            id=str(r.id),
            company_name=r.company.name if r.company else "Unknown",
            company_slug=r.company.slug if r.company else "unknown",
            error_message=r.error_message,
            started_at=r.started_at,
            jobs_found=r.jobs_found,
        )
        for r in failed_runs
    ]

    # 4. Stale companies: active companies never crawled or not crawled within 7 days
    stale_stmt = (
        select(Company)
        .where(
            Company.is_active.is_(True),
            (Company.last_crawled_at.is_(None)) | (Company.last_crawled_at < seven_days_ago),
        )
        .order_by(Company.last_crawled_at.asc().nullsfirst())
        .limit(50)
    )
    stale_res = await session.execute(stale_stmt)
    stale_companies_db = stale_res.scalars().all()

    stale_companies = [
        StaleCompanyItem(
            id=str(c.id),
            name=c.name,
            slug=c.slug,
            careers_url=c.careers_url,
            ats_type=c.ats_type.value if hasattr(c.ats_type, "value") else str(c.ats_type),
            last_crawled_at=c.last_crawled_at,
        )
        for c in stale_companies_db
    ]

    return AdminStatsResponse(
        summary=AdminSummary(
            total_companies=total_companies,
            total_jobs=total_jobs,
            total_open_jobs=total_open_jobs,
            total_enriched_jobs=total_enriched_jobs,
            total_embeddings=total_embeddings,
            failed_crawls_7d_count=len(failed_crawls_7d),
        ),
        jobs_per_ats=jobs_per_ats,
        failed_crawls_7d=failed_crawls_7d,
        stale_companies=stale_companies,
    )
