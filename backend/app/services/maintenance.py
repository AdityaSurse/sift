import logging
import re
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Company, CrawlRun, CrawlStatus, Job

logger = logging.getLogger(__name__)


def normalize_title_for_dedupe(title: str) -> str:
    """Normalizes job title by lowercasing, stripping punctuation, and removing excess whitespace.
    
    Why: Different ATS postings or aggregators often introduce cosmetic variations
    such as 'Senior Software Engineer - Remote' vs 'Senior Software Engineer (Remote)'.
    """
    if not title:
        return ""
    # Strip bracketed or parenthesized tags such as (Remote), (Hybrid), [Full-Time]
    cleaned = re.sub(r"[\(\[\{].*?[\)\]\}]", " ", title.lower())
    # Strip non-alphanumeric characters except basic spaces
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", cleaned)
    # Collapse multiple whitespaces
    return " ".join(cleaned.split())


def normalize_location_for_dedupe(city: Optional[str], country: Optional[str], raw: Optional[str]) -> str:
    """Combines and normalizes geographic markers into a canonical lookup key.
    
    Why: Prevents false mismatches when one feed specifies city only and another specifies raw string.
    """
    parts = []
    if city:
        parts.append(city.strip().lower())
    if country:
        parts.append(country.strip().lower())
    if not parts and raw:
        cleaned_raw = re.sub(r"[^a-zA-Z0-9\s]", " ", raw.lower())
        parts.append(" ".join(cleaned_raw.split()))
    return ":".join(parts) or "unknown"


async def deduplicate_jobs(session: AsyncSession) -> Dict[str, int]:
    """Identifies and closes duplicate active postings across multiple boards or duplicate ATS feeds.
    
    Why: When companies syndicate jobs or maintain legacy listings, job seekers see duplicate rows.
    We identify tuples of (company_id, normalized_title, normalized_location), preserve the highest
    quality or earliest record, and mark duplicates as is_open=False.
    """
    # 1. Fetch all currently open jobs
    stmt = (
        select(Job)
        .where(Job.is_open.is_(True))
        .order_by(Job.first_seen_at.asc())
    )
    result = await session.execute(stmt)
    open_jobs: List[Job] = list(result.scalars().all())

    # 2. Group into candidate duplicate clusters
    clusters: Dict[Tuple[str, str, str], List[Job]] = defaultdict(list)
    for job in open_jobs:
        norm_title = normalize_title_for_dedupe(job.title)
        norm_loc = normalize_location_for_dedupe(job.location_city, job.location_country, job.location_raw)
        key = (str(job.company_id), norm_title, norm_loc)
        clusters[key].append(job)

    closed_duplicates = 0
    duplicate_clusters_found = 0

    # 3. Process clusters with > 1 listing
    for key, job_list in clusters.items():
        if len(job_list) <= 1:
            continue

        duplicate_clusters_found += 1
        # Score jobs in cluster to pick the best canonical entry:
        # Priority: Has AI enrichment > longest description > earliest first_seen_at
        def score_canonical(j: Job) -> Tuple[int, int]:
            enrichment_score = 1 if j.enriched_at is not None else 0
            desc_len = len(j.description_text or "")
            return (enrichment_score, desc_len)

        sorted_jobs = sorted(job_list, key=score_canonical, reverse=True)
        canonical = sorted_jobs[0]
        duplicates_to_close = sorted_jobs[1:]

        for dup in duplicates_to_close:
            dup.is_open = False
            session.add(dup)
            closed_duplicates += 1
            logger.info(
                f"Deduplicated job '{dup.title}' (ID {dup.id}) in favor of canonical ID {canonical.id}"
            )

    if closed_duplicates > 0:
        await session.commit()

    return {
        "clusters_analyzed": len(clusters),
        "duplicate_clusters_found": duplicate_clusters_found,
        "duplicate_jobs_closed": closed_duplicates,
    }


async def expire_stale_jobs(
    session: AsyncSession,
    missed_crawls_threshold: int = 3,
) -> Dict[str, int]:
    """Closes active job listings that have been absent across N consecutive successful crawls for their company.
    
    Why: Company career feeds sometimes suffer temporary hiccups where an opening vanishes for a single
    fetch cycle. Requiring 3 missed successful crawls prevents prematurely closing live postings.
    """
    # 1. Fetch all companies with their successful crawl runs
    companies_stmt = select(Company).where(Company.is_active.is_(True))
    companies = (await session.execute(companies_stmt)).scalars().all()

    total_expired = 0

    for company in companies:
        # Fetch timestamps of successful crawl runs for this company, newest first
        runs_stmt = (
            select(CrawlRun.started_at)
            .where(
                CrawlRun.company_id == company.id,
                CrawlRun.status == CrawlStatus.SUCCESS,
            )
            .order_by(CrawlRun.started_at.desc())
        )
        crawl_dates = list((await session.execute(runs_stmt)).scalars().all())

        # If the company hasn't had at least threshold successful crawls, we cannot evaluate
        if len(crawl_dates) < missed_crawls_threshold:
            continue

        # The cutoff timestamp: a job must have been seen at or after this run date
        cutoff_date = crawl_dates[missed_crawls_threshold - 1]

        # Close jobs that are still marked open but have last_seen_at strictly before the cutoff
        expire_stmt = (
            update(Job)
            .where(
                Job.company_id == company.id,
                Job.is_open.is_(True),
                Job.last_seen_at < cutoff_date,
            )
            .values(is_open=False)
        )
        res = await session.execute(expire_stmt)
        expired_count = res.rowcount if res.rowcount and res.rowcount > 0 else 0
        if expired_count > 0:
            total_expired += expired_count
            logger.info(
                f"Expired {expired_count} stale jobs for company '{company.name}' (missed >= {missed_crawls_threshold} crawls)"
            )

    if total_expired > 0:
        await session.commit()

    return {
        "missed_crawls_threshold": missed_crawls_threshold,
        "total_jobs_expired": total_expired,
    }
