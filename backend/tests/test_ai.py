from unittest.mock import AsyncMock, patch

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.ai.client import GeminiClient
from app.ai.embed import embed_query_text, format_job_for_embedding
from app.ai.enrich import (
    ROLE_CATEGORIES,
    EnrichedJob,
    compute_description_hash,
    enrich_job_content,
)
from app.ai.query_parser import SearchIntent, fallback_regex_parse, parse_query
from app.core.config import get_settings
from app.db.models import ATSType, Company, EmploymentType, ExperienceLevel, Job, RemoteType
from app.services.search import compute_match_reasons, search_jobs

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
# Unit Tests: GeminiClient & In-Memory Cache
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_gemini_client_caching_and_privacy() -> None:
    """Verifies that GeminiClient caches responses in-memory and reuses them without extra API calls."""
    mock_vector = [0.1] * 768
    client = GeminiClient(api_key="test-key", rpm_limit=100)

    with patch.object(client, "_throttle", new_callable=AsyncMock):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_resp = httpx.Response(
                status_code=200,
                json={"embedding": {"values": mock_vector}},
                request=httpx.Request("POST", "https://generativelanguage.googleapis.com"),
            )
            mock_post.return_value = mock_resp

            # First invocation: triggers HTTP request
            vec1 = await client.embed_text("Senior Rust Engineer")
            assert len(vec1) == 768
            assert mock_post.call_count == 1

            # Second invocation with same text: retrieved from cache
            vec2 = await client.embed_text("Senior Rust Engineer")
            assert vec2 == vec1
            assert mock_post.call_count == 1  # No additional network request!


# ---------------------------------------------------------------------------
# Unit Tests: Enrichment & Hash Change Detection
# ---------------------------------------------------------------------------

def test_description_hash_stability() -> None:
    """Verifies that compute_description_hash generates consistent SHA-256 digests."""
    h1 = compute_description_hash("Build high craft web applications.")
    h2 = compute_description_hash("  Build high craft web applications. \n")
    assert h1 == h2
    assert len(h1) == 64


@pytest.mark.asyncio
async def test_enrich_job_content_mocked() -> None:
    """Verifies structured parsing into EnrichedJob with strict bounds."""
    client = GeminiClient(api_key="dummy_key")
    expected_enriched = EnrichedJob(
        employment_type=EmploymentType.INTERNSHIP,
        duration_months=6,
        experience_level=ExperienceLevel.INTERN,
        role_category="Systems / Embedded Engineering",
        skills=["C", "C++", "RTOS", "Linux Kernel"],
        remote_type=RemoteType.REMOTE,
    )

    with patch.object(client, "generate_structured", new_callable=AsyncMock, return_value=expected_enriched):
        res = await enrich_job_content(
            title="Firmware Engineering Intern",
            description_text="6 month firmware internship working on RTOS and Linux device drivers.",
            client=client,
        )

        assert res.employment_type == EmploymentType.INTERNSHIP
        assert res.duration_months == 6
        assert res.role_category in ROLE_CATEGORIES
        assert "RTOS" in res.skills
        assert res.remote_type == RemoteType.REMOTE


# ---------------------------------------------------------------------------
# Unit Tests: Embeddings Generation
# ---------------------------------------------------------------------------

def test_format_job_for_embedding() -> None:
    """Verifies that job components are properly composed and truncated to 1,000 characters."""
    formatted = format_job_for_embedding(
        title="Backend Engineer",
        role_category="Backend Engineering",
        skills=["Python", "PostgreSQL", "Docker"],
        description_text="A" * 2000,
    )

    assert "Title: Backend Engineer" in formatted
    assert "Category: Backend Engineering" in formatted
    assert "Skills: Python, PostgreSQL, Docker" in formatted
    # Lead description must be capped at 1000 characters
    assert len(formatted.split("Description: ")[1]) == 1000


@pytest.mark.asyncio
async def test_embed_query_text_mocked() -> None:
    """Verifies query text embedding returns 768-dimensional vector."""
    client = GeminiClient(api_key="dummy_key")
    mock_vec = [0.05] * 768

    with patch.object(client, "embed_text", new_callable=AsyncMock, return_value=mock_vec):
        vec = await embed_query_text("6 month internship", client=client)
        assert len(vec) == 768
        assert vec[0] == 0.05


# ---------------------------------------------------------------------------
# Unit Tests: Natural Language Query Parser
# ---------------------------------------------------------------------------

def test_query_parser_sample_query() -> None:
    """Verifies that the prompt's required test query parses accurately into all target fields."""
    query = "6 month embedded software internship in Bangalore, fresher"
    intent = fallback_regex_parse(query)

    assert intent.role_keywords == "embedded software"
    assert intent.employment_type == EmploymentType.INTERNSHIP
    assert intent.max_duration_months == 6
    assert intent.experience_level == ExperienceLevel.ENTRY
    assert intent.location == "Bangalore"
    assert intent.remote_type is None


@pytest.mark.asyncio
async def test_parse_query_with_llm_mock() -> None:
    """Verifies parse_query routes through Gemini when valid API key is present."""
    client = GeminiClient(api_key="real-simulated-key")
    expected_intent = SearchIntent(
        role_keywords="react frontend",
        employment_type=EmploymentType.FULL_TIME,
        max_duration_months=None,
        experience_level=ExperienceLevel.SENIOR,
        location="London",
        remote_type=RemoteType.REMOTE,
    )

    with patch.object(client, "generate_structured", new_callable=AsyncMock, return_value=expected_intent):
        intent = await parse_query("Senior React frontend in London, remote", client=client)
        assert intent.experience_level == ExperienceLevel.SENIOR
        assert intent.location == "London"
        assert intent.remote_type == RemoteType.REMOTE


# ---------------------------------------------------------------------------
# Integration Tests: Hybrid Search & Match Reasons
# ---------------------------------------------------------------------------

def test_compute_match_reasons() -> None:
    """Verifies explainable match rationale formatting."""
    job = Job(
        title="Embedded Systems Intern",
        description_text="Embedded C firmware development",
        apply_url="https://example.com/apply",
        external_id="job-1",
        employment_type=EmploymentType.INTERNSHIP,
        duration_months=6,
        experience_level=ExperienceLevel.ENTRY,
        location_city="Bangalore",
        remote_type=RemoteType.ONSITE,
        skills=["C", "RTOS", "ARM"],
    )

    intent = SearchIntent(
        role_keywords="embedded systems",
        employment_type=EmploymentType.INTERNSHIP,
        max_duration_months=6,
        experience_level=ExperienceLevel.ENTRY,
        location="Bangalore",
        remote_type=RemoteType.ONSITE,
    )

    reasons = compute_match_reasons(job, intent, vector_sim=0.88, fts_rank=0.2)
    assert any("Matches internship contract" in r for r in reasons)
    assert any("Tenure: 6 mo" in r for r in reasons)
    assert any("Location matches 'Bangalore'" in r for r in reasons)
    assert any("Semantic match (88%)" in r for r in reasons)


@pytest.mark.asyncio
async def test_hybrid_search_end_to_end() -> None:
    """Verifies end-to-end hybrid search executing SQL filters and ranking against test database."""
    async with TestSessionLocal() as session:
        # Create company
        company = Company(
            name="Qualcomm",
            slug="qualcomm",
            careers_url="https://qualcomm.com/careers",
            ats_type=ATSType.CUSTOM,
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)

        # Create two jobs: one matching the filters and keywords, one irrelevant
        matching_job = Job(
            company_id=company.id,
            external_id="qc-embedded-01",
            title="Embedded Software Engineer Intern",
            description_text="Work on low level C firmware for Snapdragon processors in Bangalore.",
            apply_url="https://qualcomm.com/jobs/01",
            location_city="Bangalore",
            location_raw="Bangalore, India",
            employment_type=EmploymentType.INTERNSHIP,
            duration_months=6,
            experience_level=ExperienceLevel.ENTRY,
            remote_type=RemoteType.ONSITE,
            skills=["C", "ARM", "RTOS"],
            embedding=[0.05] * 768,
            is_open=True,
        )

        non_matching_job = Job(
            company_id=company.id,
            external_id="qc-hr-02",
            title="Senior HR Business Partner",
            description_text="Manage global talent acquisition in London.",
            apply_url="https://qualcomm.com/jobs/02",
            location_city="London",
            employment_type=EmploymentType.FULL_TIME,
            experience_level=ExperienceLevel.SENIOR,
            embedding=[-0.05] * 768,
            is_open=True,
        )

        session.add_all([matching_job, non_matching_job])
        await session.commit()

        client = GeminiClient(api_key="dummy_key")
        with patch.object(client, "embed_text", new_callable=AsyncMock, return_value=[0.05] * 768):
            results = await search_jobs(
                query="6 month embedded software internship in Bangalore, fresher",
                session=session,
                limit=10,
                client=client,
            )

            # Non-matching job must be filtered out by SQL constraints (location/employment_type)
            assert len(results) == 1
            top_hit = results[0]
            assert top_hit.title == "Embedded Software Engineer Intern"
            assert top_hit.company_name == "Qualcomm"
            assert "Matches internship contract" in top_hit.match_reasons
            assert "Location matches 'Bangalore'" in top_hit.match_reasons
            assert top_hit.score > 0.0
