from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.db.models import ATSType, Company, CrawlRun, CrawlStatus, Job
from app.services.maintenance import (
    deduplicate_jobs,
    expire_stale_jobs,
    normalize_location_for_dedupe,
    normalize_title_for_dedupe,
)

settings = get_settings()
test_engine = create_async_engine(
    settings.sift_test_database_url, echo=False, poolclass=NullPool
)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest_asyncio.fixture(autouse=True)
async def clean_test_db() -> None:
    async with test_engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE jobs, crawl_runs, companies CASCADE;"))


def test_normalization_helpers() -> None:
    """Verifies that punctuation and whitespace normalization functions correctly."""
    assert normalize_title_for_dedupe("Senior Software Engineer - Frontend (Remote)") == "senior software engineer frontend"
    assert normalize_title_for_dedupe("Backend  Engineer // Python") == "backend engineer python"
    assert normalize_location_for_dedupe("San Francisco", "US", None) == "san francisco:us"
    assert normalize_location_for_dedupe(None, None, "London, UK") == "london uk"


@pytest.mark.asyncio
async def test_deduplicate_jobs() -> None:
    """Verifies that duplicate postings across sources preserve the highest quality job and close copies."""
    async with TestSessionLocal() as session:
        company = Company(
            name="Stripe",
            slug="stripe",
            careers_url="https://stripe.com/jobs",
            ats_type=ATSType.GREENHOUSE,
            ats_token="stripe",
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        now = datetime.now(timezone.utc)

        # Job 1: Has enrichment and longer description (Canonical candidate)
        job1 = Job(
            company_id=company.id,
            external_id="stripe-1",
            title="Senior Infrastructure Engineer",
            description_text="Comprehensive long description with full details.",
            apply_url="https://stripe.com/apply/1",
            location_city="Seattle",
            location_country="US",
            is_open=True,
            enriched_at=now,
            first_seen_at=now - timedelta(days=2),
        )

        # Job 2: Duplicate title/location from secondary feed without enrichment
        job2 = Job(
            company_id=company.id,
            external_id="stripe-2",
            title="Senior Infrastructure Engineer (Remote)",
            description_text="Short description.",
            apply_url="https://stripe.com/apply/2",
            location_city="Seattle",
            location_country="US",
            is_open=True,
            enriched_at=None,
            first_seen_at=now - timedelta(days=1),
        )

        session.add_all([job1, job2])
        await session.commit()

        # Run dedupe pass
        res = await deduplicate_jobs(session)
        assert res["duplicate_clusters_found"] == 1
        assert res["duplicate_jobs_closed"] == 1

        session.expire_all()

        j1_fresh = (await session.execute(select(Job).where(Job.external_id == "stripe-1"))).scalar_one()
        j2_fresh = (await session.execute(select(Job).where(Job.external_id == "stripe-2"))).scalar_one()

        assert j1_fresh.is_open is True
        assert j2_fresh.is_open is False


@pytest.mark.asyncio
async def test_expire_stale_jobs_after_3_missed_crawls() -> None:
    """Verifies that jobs missing across 3 consecutive successful company crawls are closed."""
    async with TestSessionLocal() as session:
        company = Company(
            name="Notion",
            slug="notion",
            careers_url="https://notion.so/careers",
            ats_type=ATSType.LEVER,
            ats_token="notion",
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        base_time = datetime.now(timezone.utc) - timedelta(days=5)

        # Create job last seen 4 days ago
        job = Job(
            company_id=company.id,
            external_id="notion-arch",
            title="Systems Architect",
            description_text="Distributed document store architect.",
            apply_url="https://notion.so/jobs/1",
            is_open=True,
            last_seen_at=base_time,
        )
        session.add(job)

        # Add 3 successful crawl runs for Notion after base_time
        for i in range(1, 4):
            run = CrawlRun(
                company_id=company.id,
                status=CrawlStatus.SUCCESS,
                started_at=base_time + timedelta(days=i),
                finished_at=base_time + timedelta(days=i, hours=1),
                jobs_found=5,
            )
            session.add(run)

        await session.commit()

        # Run expiry pass with threshold = 3
        res = await expire_stale_jobs(session, missed_crawls_threshold=3)
        assert res["total_jobs_expired"] == 1

        session.expire_all()
        fresh_job = (await session.execute(select(Job).where(Job.external_id == "notion-arch"))).scalar_one()
        assert fresh_job.is_open is False
