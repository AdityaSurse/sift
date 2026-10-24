import argparse
import asyncio
import csv
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlparse

import httpx
from sqlalchemy.dialects.postgresql import insert

from app.core.config import get_settings
from app.crawlers.detector import detect_ats
from app.db.models import ATSType, Company
from app.db.session import AsyncSessionLocal


def generate_slug(name: str) -> str:
    """Converts a company name to a URL-safe, predictable slug.
    
    Why: Stable primary identifiers avoid duplication across repeated CSV import runs.
    """
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower())
    return cleaned.strip("-")


class DomainRateLimiter:
    """Throttles outgoing HTTP requests to the same origin host.
    
    Why: Polite crawling requires ensuring we do not hammer a single company's
    web server with simultaneous or rapid requests during concurrent batch jobs.
    """

    def __init__(self, delay_sec: float = 1.5) -> None:
        self.delay_sec = delay_sec
        self.last_hit: Dict[str, float] = defaultdict(float)
        self.lock = asyncio.Lock()

    async def throttle(self, url: str) -> None:
        if not url:
            return
        domain = urlparse(url).netloc.lower()
        if not domain:
            return

        async with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_hit[domain]
            if elapsed < self.delay_sec:
                wait_time = self.delay_sec - elapsed
                await asyncio.sleep(wait_time)
            self.last_hit[domain] = time.monotonic()


async def process_company(
    row: dict,
    semaphore: asyncio.Semaphore,
    limiter: DomainRateLimiter,
    client: httpx.AsyncClient,
) -> dict:
    """Processes a single company row: detects ATS and upserts into database."""
    name = row.get("name", "").strip()
    careers_url = row.get("careers_url", "").strip()
    industry = row.get("industry", "").strip() or None
    hq_country = row.get("hq_country", "").strip() or None
    slug = generate_slug(name)

    async with semaphore:
        if careers_url:
            await limiter.throttle(careers_url)
            ats_type, ats_token = await detect_ats(careers_url, client=client)
        else:
            ats_type, ats_token = ATSType.UNKNOWN, None

    # Upsert into PostgreSQL
    async with AsyncSessionLocal() as session:
        stmt = (
            insert(Company)
            .values(
                name=name,
                slug=slug,
                careers_url=careers_url,
                ats_type=ats_type,
                ats_token=ats_token,
                industry=industry,
                hq_country=hq_country,
                is_active=True,
            )
            .on_conflict_do_update(
                index_elements=[Company.slug],
                set_={
                    "careers_url": careers_url,
                    "ats_type": ats_type,
                    "ats_token": ats_token,
                    "industry": industry,
                    "hq_country": hq_country,
                    "updated_at": datetime.now(timezone.utc),
                },
            )
        )
        await session.execute(stmt)
        await session.commit()

    return {
        "name": name,
        "slug": slug,
        "careers_url": careers_url,
        "ats_type": ats_type,
        "ats_token": ats_token,
    }


async def import_companies(csv_path: str, max_concurrency: int = 10, limit: Optional[int] = None) -> None:
    """Loads companies from CSV, detects ATS types concurrently, and persists to DB."""
    path = Path(csv_path)
    if not path.is_file():
        # Fall back to root-relative path if run from backend/
        alt_path = Path("..") / csv_path
        if alt_path.is_file():
            path = alt_path
        else:
            print(f"Error: CSV file not found at {csv_path} or {alt_path}")
            sys.exit(1)

    print(f"Reading companies from: {path.resolve()}")
    rows: List[dict] = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)

    if limit:
        rows = rows[:limit]

    total_companies = len(rows)
    print(f"Loaded {total_companies} companies for import (Max concurrency: {max_concurrency}).")

    semaphore = asyncio.Semaphore(max_concurrency)
    limiter = DomainRateLimiter(delay_sec=1.5)
    settings = get_settings()

    start_time = time.time()
    results: List[dict] = []

    async with httpx.AsyncClient(
        headers={"User-Agent": settings.sift_crawler_user_agent},
        timeout=10.0,
        follow_redirects=True,
    ) as client:
        tasks = [
            process_company(row, semaphore, limiter, client)
            for row in rows
        ]
        
        # Track progress as tasks complete
        for coro in asyncio.as_completed(tasks):
            res = await coro
            results.append(res)
            done = len(results)
            if done % 25 == 0 or done == total_companies:
                print(f"  Processed {done}/{total_companies} companies ({done / total_companies * 100:.1f}%)...")

    duration = time.time() - start_time
    print(f"\nImport completed in {duration:.2f} seconds ({len(results)} companies upserted).\n")

    # Summary table generation
    print_summary_table(results)


def print_summary_table(results: List[dict]) -> None:
    """Prints a structured summary breakdown of detected ATS platforms."""
    counts = Counter(r["ats_type"].value for r in results)
    total = len(results)

    print("+" + "-" * 22 + "+" + "-" * 10 + "+" + "-" * 12 + "+" + "-" * 32 + "+")
    print(f"| {'ATS Type':<20} | {'Count':<8} | {'Share':<10} | {'Sample Companies':<30} |")
    print("+" + "=" * 22 + "+" + "=" * 10 + "+" + "=" * 12 + "+" + "=" * 32 + "+")

    for ats_val, count in counts.most_common():
        pct = f"{(count / total) * 100:.1f}%"
        samples = [r["name"] for r in results if r["ats_type"].value == ats_val][:3]
        samples_str = ", ".join(samples)
        if len(samples_str) > 30:
            samples_str = samples_str[:27] + "..."
        print(f"| {ats_val:<20} | {count:<8} | {pct:<10} | {samples_str:<30} |")

    print("+" + "-" * 22 + "+" + "-" * 10 + "+" + "-" * 12 + "+" + "-" * 32 + "+")
    print(f"| {'TOTAL':<20} | {total:<8} | {'100.0%':<10} | {'':<30} |")
    print("+" + "-" * 22 + "+" + "-" * 10 + "+" + "-" * 12 + "+" + "-" * 32 + "+")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sift Company Registry & ATS Detection CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    import_parser = subparsers.add_parser("import-companies", help="Import companies from CSV and detect ATS")
    import_parser.add_argument(
        "--csv-path",
        default="data/companies_seed.csv",
        help="Path to companies CSV (default: data/companies_seed.csv)",
    )
    import_parser.add_argument(
        "--max-concurrency",
        type=int,
        default=10,
        help="Maximum concurrent network requests (default: 10)",
    )
    import_parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit on number of rows to process",
    )

    args = parser.parse_args()

    if args.command == "import-companies":
        asyncio.run(import_companies(args.csv_path, args.max_concurrency, args.limit))


if __name__ == "__main__":
    main()
