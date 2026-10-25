import uuid
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.db.models import ATSType, Company, EmploymentType, ExperienceLevel, Job, RemoteType
from app.db.session import get_db
from app.main import app

settings = get_settings()
test_engine = create_async_engine(
    settings.sift_test_database_url, echo=False, poolclass=NullPool
)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def clean_test_db() -> None:
    """Wipes test database tables before each test to guarantee isolated states."""
    async with test_engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE jobs, crawl_runs, companies CASCADE;"))


@pytest.fixture
def anyio_backend():
    return "asyncio"


# ---------------------------------------------------------------------------
# Test Fixtures Helper
# ---------------------------------------------------------------------------

async def seed_sample_jobs() -> tuple[Company, list[Job]]:
    """Seeds verified test company and multi-attribute jobs for API tests."""
    async with TestSessionLocal() as session:
        company = Company(
            name="Stripe",
            slug="stripe",
            careers_url="https://stripe.com/jobs",
            ats_type=ATSType.CUSTOM,
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        job1 = Job(
            company_id=company.id,
            external_id="stripe-01",
            title="Embedded Software Engineer Intern",
            description_text="Write low level C firmware for Stripe payment terminal hardware in Bangalore.",
            apply_url="https://stripe.com/jobs/01",
            location_city="Bangalore",
            location_raw="Bangalore, India",
            employment_type=EmploymentType.INTERNSHIP,
            duration_months=6,
            experience_level=ExperienceLevel.ENTRY,
            remote_type=RemoteType.ONSITE,
            role_category="Systems / Embedded Engineering",
            skills=["C", "RTOS", "ARM"],
            embedding=[0.05] * 768,
            is_open=True,
        )

        job2 = Job(
            company_id=company.id,
            external_id="stripe-02",
            title="Senior Frontend Infrastructure Engineer",
            description_text="Scale React design systems and TypeScript tooling in London.",
            apply_url="https://stripe.com/jobs/02",
            location_city="London",
            location_raw="London, UK",
            employment_type=EmploymentType.FULL_TIME,
            experience_level=ExperienceLevel.SENIOR,
            remote_type=RemoteType.REMOTE,
            role_category="Frontend Engineering",
            skills=["React", "TypeScript", "Next.js"],
            embedding=[-0.05] * 768,
            is_open=True,
        )

        job3 = Job(
            company_id=company.id,
            external_id="stripe-03",
            title="Closed Hardware Role",
            description_text="Closed opening that should not be visible in search.",
            apply_url="https://stripe.com/jobs/03",
            location_city="Bangalore",
            employment_type=EmploymentType.INTERNSHIP,
            is_open=False,
        )

        session.add_all([job1, job2, job3])
        await session.commit()
        await session.refresh(job1)
        await session.refresh(job2)

        return company, [job1, job2, job3]


# ---------------------------------------------------------------------------
# API Route Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_search_with_query_parser() -> None:
    """Verifies that GET /search parses natural-language queries into filters and returns matches."""
    await seed_sample_jobs()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.services.search.embed_query_text", new_callable=AsyncMock, return_value=[0.05] * 768):
            response = await client.get(
                "/search",
                params={"q": "6 month embedded software internship in Bangalore, fresher"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert data["page"] == 1
            assert len(data["items"]) == 1

            top_job = data["items"][0]
            assert top_job["title"] == "Embedded Software Engineer Intern"
            assert top_job["company_name"] == "Stripe"
            assert top_job["employment_type"] == "internship"
            assert "Matches internship contract" in top_job["match_reasons"]
            assert data["parsed_intent"]["role_keywords"] == "embedded software"
            assert data["parsed_intent"]["location"] == "Bangalore"


@pytest.mark.asyncio
async def test_search_explicit_param_overrides_parsed_query() -> None:
    """Verifies that explicit query parameters override parsed natural-language attributes."""
    await seed_sample_jobs()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.services.search.embed_query_text", new_callable=AsyncMock, return_value=[0.05] * 768):
            # Query mentions 'internship', but explicit type override is 'full_time'
            response = await client.get(
                "/search",
                params={
                    "q": "embedded software internship in Bangalore",
                    "type": "full_time",
                },
            )

            assert response.status_code == 200
            data = response.json()
            # The embedded job is an internship, so full_time filter yields 0 matches
            assert data["total"] == 0
            assert len(data["items"]) == 0


@pytest.mark.asyncio
async def test_search_pagination() -> None:
    """Verifies that search respects page and page_size parameters."""
    await seed_sample_jobs()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/search", params={"page": 1, "page_size": 1})
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 1
        assert data["total"] == 2  # Two open jobs
        assert data["total_pages"] == 2
        assert len(data["items"]) == 1


@pytest.mark.asyncio
async def test_get_job_by_id_success_and_not_found() -> None:
    """Verifies retrieval of a job opening by UUID and 404 for nonexistent/closed jobs."""
    _, jobs = await seed_sample_jobs()
    open_job = jobs[0]
    closed_job = jobs[2]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Success case
        resp = await client.get(f"/jobs/{open_job.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(open_job.id)
        assert data["title"] == "Embedded Software Engineer Intern"
        assert data["company_name"] == "Stripe"
        assert data["company_slug"] == "stripe"
        assert "RTOS" in data["skills"]

        # 2. Closed job returns 404
        closed_resp = await client.get(f"/jobs/{closed_job.id}")
        assert closed_resp.status_code == 404
        err_data = closed_resp.json()
        assert err_data["error"]["code"] == "NOT_FOUND"

        # 3. Non-existent ID returns 404
        random_id = uuid.uuid4()
        not_found_resp = await client.get(f"/jobs/{random_id}")
        assert not_found_resp.status_code == 404
        assert not_found_resp.json()["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_validation_error_format() -> None:
    """Verifies that invalid URL parameters yield structured ErrorResponse bodies."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid UUID in path
        resp = await client.get("/jobs/not-a-valid-uuid")
        assert resp.status_code == 422
        data = resp.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert "details" in data["error"]


@pytest.mark.asyncio
async def test_get_filter_options() -> None:
    """Verifies that GET /filters/options returns distinct facet counts for active jobs."""
    await seed_sample_jobs()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/filters/options")
        assert resp.status_code == 200
        data = resp.json()

        assert data["total_open_jobs"] == 2

        # Check employment types breakdown
        emp_values = {item["value"]: item["count"] for item in data["employment_types"]}
        assert emp_values.get("internship") == 1
        assert emp_values.get("full_time") == 1

        # Check experience levels breakdown
        exp_values = {item["value"]: item["count"] for item in data["experience_levels"]}
        assert exp_values.get("entry") == 1
        assert exp_values.get("senior") == 1

        # Check remote types breakdown
        rem_values = {item["value"]: item["count"] for item in data["remote_types"]}
        assert rem_values.get("onsite") == 1
        assert rem_values.get("remote") == 1


@pytest.mark.asyncio
async def test_health_check_database_connected() -> None:
    """Verifies that /health checks database connectivity and returns HTTP 200."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_cors_headers() -> None:
    """Verifies that requests from allowed frontend origins receive CORS access control headers."""
    transport = ASGITransport(app=app)
    headers = {"Origin": "http://localhost:5173"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health", headers=headers)
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
