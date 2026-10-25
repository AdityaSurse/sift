import pytest
import pytest_asyncio
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.db.models import (
    ATSType,
    Company,
    EmploymentType,
    Job,
    RemoteType,
)

settings = get_settings()
test_engine = create_async_engine(
    settings.sift_test_database_url, echo=False, poolclass=NullPool
)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest_asyncio.fixture(autouse=True)
async def prepare_test_db() -> None:
    """Cleans tables before each test run to ensure strict isolation."""
    async with test_engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE jobs, crawl_runs, companies CASCADE;"))


@pytest.mark.asyncio
async def test_company_and_job_creation() -> None:
    """Verifies standard insertion of company and child job record."""
    async with TestSessionLocal() as session:
        company = Company(
            name="Stripe",
            slug="stripe",
            careers_url="https://stripe.com/jobs",
            ats_type=ATSType.CUSTOM,
            industry="Fintech",
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        job = Job(
            company_id=company.id,
            external_id="stripe-infra-01",
            title="Infrastructure Engineer",
            description_text="Scale distributed ledger systems in Go.",
            apply_url="https://stripe.com/jobs/infra-01",
            remote_type=RemoteType.REMOTE,
            employment_type=EmploymentType.FULL_TIME,
            skills=["Go", "Kubernetes", "PostgreSQL"],
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)

        assert job.id is not None
        assert job.company_id == company.id
        assert job.is_open is True
        assert "Go" in job.skills


@pytest.mark.asyncio
async def test_job_unique_constraint_on_company_and_external_id() -> None:
    """Verifies that inserting two jobs with the same (company_id, external_id) violates the unique constraint."""
    async with TestSessionLocal() as session:
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

        # First job insertion succeeds
        job1 = Job(
            company_id=company.id,
            external_id="vercel-edge-100",
            title="Edge Network Engineer",
            description_text="Build global Anycast edge network with Rust.",
            apply_url="https://vercel.com/careers/edge-100",
        )
        session.add(job1)
        await session.commit()

        # Second job with same company_id and external_id must trigger IntegrityError
        job2 = Job(
            company_id=company.id,
            external_id="vercel-edge-100",
            title="Duplicate Title",
            description_text="Duplicate Description.",
            apply_url="https://vercel.com/careers/edge-100",
        )
        session.add(job2)
        with pytest.raises(IntegrityError):
            await session.commit()


@pytest.mark.asyncio
async def test_job_upsert_behavior() -> None:
    """Verifies idempotent PostgreSQL ON CONFLICT DO UPDATE upsert logic for re-crawled jobs."""
    async with TestSessionLocal() as session:
        company = Company(
            name="OpenAI",
            slug="openai",
            careers_url="https://openai.com/careers",
            ats_type=ATSType.GREENHOUSE,
            ats_token="openai",
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        # Initial crawl insertion
        stmt1 = (
            insert(Job)
            .values(
                company_id=company.id,
                external_id="oai-991",
                title="Member of Technical Staff",
                description_text="Initial posting description.",
                apply_url="https://openai.com/careers/991",
                is_open=True,
            )
            .on_conflict_do_update(
                constraint="uq_jobs_company_external_id",
                set_={
                    "title": "Member of Technical Staff",
                    "description_text": "Initial posting description.",
                    "is_open": True,
                },
            )
        )
        await session.execute(stmt1)
        await session.commit()

        # Re-crawl with updated title and last_seen timestamp
        stmt2 = (
            insert(Job)
            .values(
                company_id=company.id,
                external_id="oai-991",
                title="Staff Research Engineer - Alignment",
                description_text="Updated description with new focus.",
                apply_url="https://openai.com/careers/991",
                is_open=True,
            )
            .on_conflict_do_update(
                constraint="uq_jobs_company_external_id",
                set_={
                    "title": "Staff Research Engineer - Alignment",
                    "description_text": "Updated description with new focus.",
                    "is_open": True,
                },
            )
        )
        await session.execute(stmt2)
        await session.commit()

        # Verify only 1 row exists with the updated values
        result = await session.execute(
            select(Job).where(Job.company_id == company.id, Job.external_id == "oai-991")
        )
        jobs = result.scalars().all()
        assert len(jobs) == 1
        assert jobs[0].title == "Staff Research Engineer - Alignment"
        assert jobs[0].description_text == "Updated description with new focus."


@pytest.mark.asyncio
async def test_full_text_search_vector_generation() -> None:
    """Verifies that the generated search_vector column indexes title and description for full-text search."""
    async with TestSessionLocal() as session:
        company = Company(
            name="Anthropic",
            slug="anthropic",
            careers_url="https://anthropic.com/careers",
            ats_type=ATSType.GREENHOUSE,
            ats_token="anthropic",
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        job = Job(
            company_id=company.id,
            external_id="claude-eval-1",
            title="Interpretability & Safety Researcher",
            description_text="Research mechanistic interpretability and sparse autoencoders on transformer representations.",
            apply_url="https://anthropic.com/careers/eval-1",
        )
        session.add(job)
        await session.commit()

        # Query using PostgreSQL full-text search match operator @@
        query = select(Job).where(
            Job.search_vector.op("@@")(text("to_tsquery('english', 'interpretability & autoencoders')"))
        )
        result = await session.execute(query)
        matched_job = result.scalar_one_or_none()
        assert matched_job is not None
        assert matched_job.external_id == "claude-eval-1"


@pytest.mark.asyncio
async def test_pgvector_cosine_similarity() -> None:
    """Verifies that 768-dim embeddings can be saved and searched using pgvector cosine distance."""
    async with TestSessionLocal() as session:
        company = Company(
            name="Supabase",
            slug="supabase",
            careers_url="https://supabase.com/careers",
            ats_type=ATSType.ASHBY,
            ats_token="supabase",
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        # Vector 1: Simulated embedding centered around index 0
        vec1 = [1.0 if i == 0 else 0.0 for i in range(768)]
        # Vector 2: Simulated embedding centered around index 100
        vec2 = [1.0 if i == 100 else 0.0 for i in range(768)]

        job1 = Job(
            company_id=company.id,
            external_id="supa-01",
            title="Database Internals Engineer",
            description_text="Work on Postgres extensions and pgvector.",
            apply_url="https://supabase.com/jobs/01",
            embedding=vec1,
        )
        job2 = Job(
            company_id=company.id,
            external_id="supa-02",
            title="Frontend Designer",
            description_text="Design system components with React.",
            apply_url="https://supabase.com/jobs/02",
            embedding=vec2,
        )
        session.add_all([job1, job2])
        await session.commit()

        # Search with target vector close to vec1
        target_vec = [0.9 if i == 0 else 0.01 for i in range(768)]
        # Use pgvector cosine distance operator <=> in order_by
        query = select(Job).order_by(Job.embedding.cosine_distance(target_vec)).limit(1)
        result = await session.execute(query)
        closest_job = result.scalar_one()

        assert closest_job.external_id == "supa-01"
        assert closest_job.title == "Database Internals Engineer"
