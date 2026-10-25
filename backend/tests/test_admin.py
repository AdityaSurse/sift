from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.db.models import ATSType, Company, CrawlRun, CrawlStatus, Job
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
    async with test_engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE jobs, crawl_runs, companies CASCADE;"))


@pytest.mark.asyncio
async def test_admin_stats_unauthorized() -> None:
    """Verifies that accessing /admin/stats without valid credentials rejects with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # No header
        resp1 = await client.get("/admin/stats")
        assert resp1.status_code == 401

        # Invalid token
        resp2 = await client.get("/admin/stats", headers={"X-Admin-Token": "invalid-token"})
        assert resp2.status_code == 401


@pytest.mark.asyncio
async def test_admin_stats_authorized() -> None:
    """Verifies that authorized access returns accurate ATS breakdown, crawl failures, and stale lists."""
    async with TestSessionLocal() as session:
        now = datetime.now(timezone.utc)

        # Active company with recent crawl
        co1 = Company(
            name="Figma",
            slug="figma",
            careers_url="https://figma.com/careers",
            ats_type=ATSType.GREENHOUSE,
            ats_token="figma",
            last_crawled_at=now - timedelta(hours=2),
        )
        # Stale company (never crawled)
        co2 = Company(
            name="Linear",
            slug="linear",
            careers_url="https://linear.app/careers",
            ats_type=ATSType.ASHBY,
            ats_token="linear",
            last_crawled_at=None,
        )
        session.add_all([co1, co2])
        await session.commit()
        await session.refresh(co1)
        await session.refresh(co2)

        # Open job under co1
        job1 = Job(
            company_id=co1.id,
            external_id="fig-1",
            title="Design Technologist",
            description_text="Build webgl canvas components.",
            apply_url="https://figma.com/apply/1",
            is_open=True,
        )
        # Failed crawl in last 7 days under co1
        failed_run = CrawlRun(
            company_id=co1.id,
            status=CrawlStatus.FAILED,
            started_at=now - timedelta(days=1),
            finished_at=now - timedelta(days=1, minutes=2),
            error_message="HTTP 502 Bad Gateway from ATS endpoint",
        )
        session.add_all([job1, failed_run])
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/admin/stats",
            headers={"X-Admin-Token": settings.sift_admin_token},
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["summary"]["total_companies"] == 2
        assert data["summary"]["total_open_jobs"] == 1
        assert data["summary"]["failed_crawls_7d_count"] == 1

        # Check ATS distribution
        ats_counts = {item["ats"]: item["count"] for item in data["jobs_per_ats"]}
        assert ats_counts.get("greenhouse") == 1

        # Check failed crawl
        assert len(data["failed_crawls_7d"]) == 1
        assert "502 Bad Gateway" in data["failed_crawls_7d"][0]["error_message"]

        # Check stale company list includes Linear
        stale_slugs = [c["slug"] for c in data["stale_companies"]]
        assert "linear" in stale_slugs
