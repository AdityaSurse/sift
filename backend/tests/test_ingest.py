import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.crawlers.ashby import AshbyFetcher
from app.crawlers.base import RawJob
from app.crawlers.greenhouse import GreenhouseFetcher
from app.crawlers.lever import LeverFetcher
from app.db.models import ATSType, Company, CrawlStatus, EmploymentType, ExperienceLevel, Job, RemoteType
from app.services.ingest import ingest_company
from app.services.normalizer import clean_html_to_text, normalize_job, parse_location

settings = get_settings()
test_engine = create_async_engine(
    settings.sift_test_database_url, echo=False, poolclass=NullPool
)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest_asyncio.fixture(autouse=True)
async def clean_test_db() -> None:
    """Wipes test database tables before each test to guarantee isolated states."""
    async with test_engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE jobs, crawl_runs, companies CASCADE;"))


# ---------------------------------------------------------------------------
# Fetcher Unit Tests with Mocked HTTP Responses
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_greenhouse_fetcher_mocked_response() -> None:
    """Verifies that GreenhouseFetcher accurately transforms boards-api JSON into RawJob models."""
    company = Company(
        id=uuid.uuid4(),
        name="Linear",
        slug="linear",
        careers_url="https://linear.app/careers",
        ats_type=ATSType.GREENHOUSE,
        ats_token="linear",
    )

    mock_gh_response = {
        "jobs": [
            {
                "id": 101,
                "title": "Senior Product Designer",
                "content": "<p>Design high craft interfaces with <strong>Figma</strong>.</p>",
                "absolute_url": "https://boards.greenhouse.io/linear/jobs/101",
                "location": {"name": "San Francisco, CA or Remote"},
                "updated_at": "2026-10-20T12:00:00Z",
            }
        ]
    }

    mock_resp = httpx.Response(
        status_code=200,
        content=json.dumps(mock_gh_response).encode("utf-8"),
        request=httpx.Request("GET", "https://boards-api.greenhouse.io"),
    )

    client = httpx.AsyncClient()
    with patch.object(client, "get", new_callable=AsyncMock, return_value=mock_resp):
        fetcher = GreenhouseFetcher()
        jobs = await fetcher.fetch_jobs(company, client=client)

    assert len(jobs) == 1
    job = jobs[0]
    assert job.external_id == "101"
    assert job.title == "Senior Product Designer"
    assert "Design high craft interfaces" in job.description_html
    assert job.location_raw == "San Francisco, CA or Remote"
    assert job.apply_url == "https://boards.greenhouse.io/linear/jobs/101"


@pytest.mark.asyncio
async def test_lever_fetcher_mocked_response() -> None:
    """Verifies that LeverFetcher accurately parses api.lever.co array responses."""
    company = Company(
        id=uuid.uuid4(),
        name="Spotify",
        slug="spotify",
        careers_url="https://spotify.com/careers",
        ats_type=ATSType.LEVER,
        ats_token="spotify",
    )

    mock_lever_response = [
        {
            "id": "lever-999",
            "text": "Machine Learning Engineer - Personalization",
            "description": "<p>Build real-time recommendation graphs.</p>",
            "descriptionPlain": "Build real-time recommendation graphs.",
            "hostedUrl": "https://jobs.lever.co/spotify/lever-999",
            "createdAt": 1729000000000,
            "categories": {
                "location": "Stockholm, Sweden",
                "commitment": "Full-time",
                "team": "Core AI",
            },
        }
    ]

    mock_resp = httpx.Response(
        status_code=200,
        content=json.dumps(mock_lever_response).encode("utf-8"),
        request=httpx.Request("GET", "https://api.lever.co"),
    )

    client = httpx.AsyncClient()
    with patch.object(client, "get", new_callable=AsyncMock, return_value=mock_resp):
        fetcher = LeverFetcher()
        jobs = await fetcher.fetch_jobs(company, client=client)

    assert len(jobs) == 1
    job = jobs[0]
    assert job.external_id == "lever-999"
    assert job.title == "Machine Learning Engineer - Personalization"
    assert job.location_raw == "Stockholm, Sweden"
    assert job.employment_type_raw == "Full-time"
    assert job.department_raw == "Core AI"


@pytest.mark.asyncio
async def test_ashby_fetcher_mocked_response() -> None:
    """Verifies that AshbyFetcher accurately parses api.ashbyhq.com responses."""
    company = Company(
        id=uuid.uuid4(),
        name="Together AI",
        slug="together-ai",
        careers_url="https://together.ai/careers",
        ats_type=ATSType.ASHBY,
        ats_token="together",
    )

    mock_ashby_response = {
        "jobs": [
            {
                "id": "ashby-456",
                "title": "Kernel Optimization Engineer",
                "descriptionHtml": "<p>Write custom Triton and CUDA kernels.</p>",
                "descriptionPlain": "Write custom Triton and CUDA kernels.",
                "jobUrl": "https://jobs.ashbyhq.com/together/ashby-456",
                "location": "San Francisco, CA",
                "employmentType": "FullTime",
                "department": "Infrastructure",
                "publishedAt": "2026-10-22T08:00:00Z",
            }
        ]
    }

    mock_resp = httpx.Response(
        status_code=200,
        content=json.dumps(mock_ashby_response).encode("utf-8"),
        request=httpx.Request("GET", "https://api.ashbyhq.com"),
    )

    client = httpx.AsyncClient()
    with patch.object(client, "get", new_callable=AsyncMock, return_value=mock_resp):
        fetcher = AshbyFetcher()
        jobs = await fetcher.fetch_jobs(company, client=client)

    assert len(jobs) == 1
    job = jobs[0]
    assert job.external_id == "ashby-456"
    assert job.title == "Kernel Optimization Engineer"
    assert job.location_raw == "San Francisco, CA"


# ---------------------------------------------------------------------------
# Normalizer Unit Tests
# ---------------------------------------------------------------------------

def test_normalizer_html_cleaning_and_attributes() -> None:
    """Verifies that normalizer strips HTML tags and detects seniority, remote, and employment tiers."""
    raw = RawJob(
        external_id="gh-123",
        title="Senior Distributed Systems Intern",
        description_html="<div><p>Welcome to our team!<br/>We build <b>distributed databases</b> in Rust.</p></div>",
        apply_url="/jobs/apply/123",
        location_raw="Munich, Germany",
        employment_type_raw="Internship",
    )

    company_id = uuid.uuid4()
    norm = normalize_job(raw, company_id=company_id, base_careers_url="https://example.com/careers")

    assert norm["company_id"] == company_id
    assert norm["external_id"] == "gh-123"
    assert norm["apply_url"] == "https://example.com/jobs/apply/123"
    assert "Welcome to our team!" in norm["description_text"]
    assert "<b>" not in norm["description_text"]
    assert norm["location_city"] == "Munich"
    assert norm["location_country"] == "Germany"
    assert norm["employment_type"] == EmploymentType.INTERNSHIP
    assert norm["experience_level"] == ExperienceLevel.INTERN


# ---------------------------------------------------------------------------
# Full Pipeline: Upsert and Ghost Job Closure Test
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_upsert_and_ghost_job_closure_lifecycle() -> None:
    """Verifies that re-crawling updates active jobs and marks removed postings as is_open=False."""
    async with TestSessionLocal() as session:
        # Create company
        company = Company(
            name="Vercel",
            slug="vercel",
            careers_url="https://vercel.com/careers",
            ats_type=ATSType.GREENHOUSE,
            ats_token="vercel",
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        # Batch 1: Two open postings (Job A and Job B)
        raw_batch_1 = [
            RawJob(
                external_id="job-a",
                title="Frontend Infrastructure Engineer",
                description_text="Work on Next.js compiler.",
                apply_url="https://vercel.com/jobs/a",
                location_raw="Remote, US",
            ),
            RawJob(
                external_id="job-b",
                title="Turbopack Core Engineer",
                description_text="Work on Turbopack in Rust.",
                apply_url="https://vercel.com/jobs/b",
                location_raw="Remote, US",
            ),
        ]

        # Ingest Batch 1
        with patch("app.services.ingest.GreenhouseFetcher.fetch_jobs", new_callable=AsyncMock, return_value=raw_batch_1):
            run1 = await ingest_company(company, session=session)

        assert run1.status == CrawlStatus.SUCCESS
        assert run1.jobs_found == 2
        assert run1.jobs_new == 2
        assert run1.jobs_closed == 0

        # Verify both jobs are currently open in the database
        res1 = await session.execute(
            select(Job).where(Job.company_id == company.id).order_by(Job.external_id)
        )
        jobs1 = res1.scalars().all()
        assert len(jobs1) == 2
        assert all(j.is_open is True for j in jobs1)

        # Batch 2: Job B is removed from the ATS (filled/closed), and Job A is updated
        raw_batch_2 = [
            RawJob(
                external_id="job-a",
                title="Staff Frontend Infrastructure Engineer",  # Promoted title
                description_text="Work on Next.js compiler and Turbopack.",
                apply_url="https://vercel.com/jobs/a",
                location_raw="Remote, US",
            )
        ]

        # Ingest Batch 2
        with patch("app.services.ingest.GreenhouseFetcher.fetch_jobs", new_callable=AsyncMock, return_value=raw_batch_2):
            run2 = await ingest_company(company, session=session)

        assert run2.status == CrawlStatus.SUCCESS
        assert run2.jobs_found == 1
        assert run2.jobs_new == 0
        assert run2.jobs_closed == 1  # Job B was closed!

        comp_id = company.id
        # Expire identity map so subsequent selects read committed updates from PostgreSQL
        session.expire_all()

        # Verify Job A updated and remains open
        job_a_stmt = select(Job).where(Job.company_id == comp_id, Job.external_id == "job-a")
        job_a = (await session.execute(job_a_stmt)).scalar_one()
        assert job_a.title == "Staff Frontend Infrastructure Engineer"
        assert job_a.is_open is True

        # Verify Job B was marked closed (is_open=False)
        job_b_stmt = select(Job).where(Job.company_id == comp_id, Job.external_id == "job-b")
        job_b = (await session.execute(job_b_stmt)).scalar_one()
        assert job_b.is_open is False  # Successfully closed ghost job!
