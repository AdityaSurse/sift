import logging
from datetime import datetime, timezone
from typing import Optional, Set

import httpx
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.crawlers.ashby import AshbyFetcher
from app.crawlers.base import BaseFetcher
from app.crawlers.generic import GenericPlaywrightFetcher
from app.crawlers.greenhouse import GreenhouseFetcher
from app.crawlers.lever import LeverFetcher
from app.db.models import ATSType, Company, CrawlRun, CrawlStatus, Job
from app.services.normalizer import normalize_job

logger = logging.getLogger(__name__)


def get_fetcher_for_company(company: Company) -> BaseFetcher:
    """Selects the designated ATS fetcher based on company classification.
    
    Why: Keeps crawler dispatch logic localized and extensible without coupling
    individual fetcher implementations to storage mechanics.
    """
    if company.ats_type == ATSType.GREENHOUSE:
        return GreenhouseFetcher()
    elif company.ats_type == ATSType.LEVER:
        return LeverFetcher()
    elif company.ats_type == ATSType.ASHBY:
        return AshbyFetcher()
    else:
        # Fallback to generic Playwright renderer for custom portals and unclassified boards
        return GenericPlaywrightFetcher()


async def ingest_company(
    company: Company,
    session: AsyncSession,
    client: Optional[httpx.AsyncClient] = None,
) -> CrawlRun:
    """Orchestrates fetch, upsert, and ghost job closure for a single company board.
    
    Why: Crawling individual companies in isolated transactions ensures that a
    single broken feed or network timeout never fails the broader batch run.
    """
    now = datetime.now(timezone.utc)

    # 1. Initialize audit crawl run
    crawl_run = CrawlRun(
        company_id=company.id,
        status=CrawlStatus.RUNNING,
        started_at=now,
    )
    session.add(crawl_run)
    await session.commit()
    await session.refresh(crawl_run)

    fetcher = get_fetcher_for_company(company)

    try:
        # 2. Fetch raw postings
        raw_jobs = await fetcher.fetch_jobs(company, client=client)
        active_external_ids: Set[str] = set()
        jobs_new = 0

        # 3. Upsert active postings
        for raw in raw_jobs:
            active_external_ids.add(raw.external_id)
            norm = normalize_job(raw, company.id, company.careers_url)

            # Check if this external_id already exists to track new openings
            check_stmt = select(Job.id).where(
                Job.company_id == company.id, Job.external_id == raw.external_id
            )
            existing = await session.execute(check_stmt)
            if existing.scalar_one_or_none() is None:
                jobs_new += 1

            # PostgreSQL atomic upsert
            upsert_stmt = (
                insert(Job)
                .values(**norm, last_seen_at=now)
                .on_conflict_do_update(
                    constraint="uq_jobs_company_external_id",
                    set_={
                        "title": norm["title"],
                        "description_text": norm["description_text"],
                        "apply_url": norm["apply_url"],
                        "location_raw": norm["location_raw"],
                        "location_city": norm["location_city"],
                        "location_country": norm["location_country"],
                        "remote_type": norm["remote_type"],
                        "employment_type": norm["employment_type"],
                        "experience_level": norm["experience_level"],
                        "role_category": norm["role_category"],
                        "is_open": True,
                        "last_seen_at": now,
                        "raw_payload": norm["raw_payload"],
                    },
                )
            )
            await session.execute(upsert_stmt)

        # 4. Mark missing jobs as closed (Ghost Job detection)
        # Any job previously marked open that was NOT present in the latest ATS feed is marked is_open=False
        if active_external_ids:
            close_stmt = (
                update(Job)
                .where(
                    Job.company_id == company.id,
                    Job.is_open.is_(True),
                    Job.external_id.not_in(active_external_ids),
                )
                .values(is_open=False)
            )
        else:
            # If 0 jobs found and company has postings, only close if ATS reported valid empty board
            close_stmt = (
                update(Job)
                .where(Job.company_id == company.id, Job.is_open.is_(True))
                .values(is_open=False)
            )

        close_res = await session.execute(close_stmt)
        jobs_closed = close_res.rowcount if close_res.rowcount and close_res.rowcount > 0 else 0

        # 5. Update company metadata and crawl audit record
        company.last_crawled_at = now
        session.add(company)

        crawl_run.status = CrawlStatus.SUCCESS
        crawl_run.finished_at = datetime.now(timezone.utc)
        crawl_run.jobs_found = len(raw_jobs)
        crawl_run.jobs_new = jobs_new
        crawl_run.jobs_closed = jobs_closed
        await session.commit()

        logger.info(
            f"Completed crawl for {company.name}: found={len(raw_jobs)}, new={jobs_new}, closed={jobs_closed}"
        )
        return crawl_run

    except Exception as e:
        logger.exception(f"Crawl failed for {company.name}: {e}")
        await session.rollback()

        # Record failure state without raising to protect caller loop
        crawl_run.status = CrawlStatus.FAILED
        crawl_run.finished_at = datetime.now(timezone.utc)
        crawl_run.error_message = str(e)
        session.add(crawl_run)
        await session.commit()
        return crawl_run
