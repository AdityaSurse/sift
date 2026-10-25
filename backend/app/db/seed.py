import asyncio
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import insert

from app.db.models import (
    ATSType,
    Company,
    EmploymentType,
    ExperienceLevel,
    Job,
    RemoteType,
)
from app.db.session import AsyncSessionLocal

SAMPLE_COMPANIES = [
    {
        "name": "Linear",
        "slug": "linear",
        "careers_url": "https://linear.app/careers",
        "ats_type": ATSType.GREENHOUSE,
        "ats_token": "linear",
        "industry": "Developer Tools",
        "hq_country": "US",
        "is_active": True,
    },
    {
        "name": "Together AI",
        "slug": "together-ai",
        "careers_url": "https://www.together.ai/careers",
        "ats_type": ATSType.ASHBY,
        "ats_token": "together",
        "industry": "Artificial Intelligence",
        "hq_country": "US",
        "is_active": True,
    },
    {
        "name": "Figma",
        "slug": "figma",
        "careers_url": "https://www.figma.com/careers",
        "ats_type": ATSType.LEVER,
        "ats_token": "figma",
        "industry": "Design Software",
        "hq_country": "US",
        "is_active": True,
    },
]


async def seed_companies() -> list[Company]:
    """Idempotently seeds sample tech companies into PostgreSQL.
    
    Why: Provides deterministic starting companies across Greenhouse, Ashby, and Lever
    for crawler workers and search verification without manual dashboard entry.
    """
    seeded_companies: list[Company] = []
    async with AsyncSessionLocal() as session:
        for comp_data in SAMPLE_COMPANIES:
            stmt = (
                insert(Company)
                .values(**comp_data)
                .on_conflict_do_update(
                    index_elements=[Company.slug],
                    set_={
                        "careers_url": comp_data["careers_url"],
                        "ats_type": comp_data["ats_type"],
                        "ats_token": comp_data["ats_token"],
                        "industry": comp_data["industry"],
                        "hq_country": comp_data["hq_country"],
                        "is_active": comp_data["is_active"],
                    },
                )
                .returning(Company)
            )
            result = await session.execute(stmt)
            company = result.scalar_one()
            seeded_companies.append(company)

        # Seed sample job for Linear to prove foreign keys and full-text vector generation
        linear = next((c for c in seeded_companies if c.slug == "linear"), None)
        if linear:
            sample_embedding = [0.01 * (i % 50) for i in range(768)]
            job_stmt = (
                insert(Job)
                .values(
                    company_id=linear.id,
                    external_id="gh-4920194",
                    title="Senior Distributed Systems Engineer",
                    description_text="Build low-latency sync engine and real-time multiplayer architecture with Rust and TypeScript.",
                    apply_url="https://boards.greenhouse.io/linear/jobs/4920194",
                    location_raw="San Francisco, CA or Remote (US/EU)",
                    location_city="San Francisco",
                    location_country="US",
                    remote_type=RemoteType.REMOTE,
                    employment_type=EmploymentType.FULL_TIME,
                    experience_level=ExperienceLevel.SENIOR,
                    role_category="Backend Engineering",
                    skills=["Rust", "TypeScript", "Distributed Systems", "WebSockets"],
                    posted_at=datetime.now(timezone.utc),
                    is_open=True,
                    embedding=sample_embedding,
                )
                .on_conflict_do_update(
                    constraint="uq_jobs_company_external_id",
                    set_={
                        "title": "Senior Distributed Systems Engineer",
                        "description_text": "Build low-latency sync engine and real-time multiplayer architecture with Rust and TypeScript.",
                        "is_open": True,
                        "last_seen_at": datetime.now(timezone.utc),
                    },
                )
            )
            await session.execute(job_stmt)

        await session.commit()

    return seeded_companies


if __name__ == "__main__":
    companies = asyncio.run(seed_companies())
    print(f"Successfully seeded {len(companies)} companies into Supabase / PostgreSQL:")
    for c in companies:
        print(f" - {c.name} ({c.slug}) | ATS: {c.ats_type.value} | Token: {c.ats_token}")
