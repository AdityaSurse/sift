# Contributing to Sift

Thank you for your interest in expanding Sift! We welcome contributions that maintain our core engineering values: **polite crawling**, **strict type safety**, **editorial design discipline**, and **modular single-purpose components**.

---

## Adding a New ATS Fetcher in Under 50 Lines

Sift is designed so that adding support for any public ATS API (e.g., Workable, SmartRecruiters, Jobvite, Pinpoint) takes **less than 50 lines of code**.

### Step 1: Create the Fetcher Module

Create a new file in `backend/app/crawlers/` (for example, `workable.py`):

```python
# backend/app/crawlers/workable.py
from typing import List, Optional
import httpx
from app.core.config import get_settings
from app.crawlers.base import BaseFetcher, RawJob
from app.db.models import Company

class WorkableFetcher(BaseFetcher):
    """Fetches public jobs from Workable's career board API in < 50 lines."""
    BASE_URL = "https://apply.workable.com/api/v3/accounts"

    async def fetch_jobs(
        self, company: Company, client: Optional[httpx.AsyncClient] = None
    ) -> List[RawJob]:
        token = company.ats_token or company.slug
        url = f"{self.BASE_URL}/{token}/jobs"
        headers = {"User-Agent": get_settings().sift_crawler_user_agent}

        # Use shared client session for polite connection pooling
        http_client = client or httpx.AsyncClient(headers=headers, timeout=15.0)
        try:
            resp = await http_client.get(url, headers=headers)
            if resp.status_code != 200:
                return []
            data = resp.json()
        finally:
            if not client:
                await http_client.aclose()

        jobs: List[RawJob] = []
        for item in data.get("results", []):
            shortcode = item.get("shortcode")
            title = item.get("title", "").strip()
            if not shortcode or not title:
                continue

            jobs.append(
                RawJob(
                    external_id=str(shortcode),
                    title=title,
                    description_text=item.get("description", ""),
                    apply_url=f"https://apply.workable.com/{token}/j/{shortcode}/",
                    location_raw=f"{item.get('city', '')}, {item.get('country', '')}".strip(", "),
                    raw_payload=item,
                )
            )
        return jobs
```

### Step 2: Register the ATS Type & Fetcher Factory

1. **Add to `ATSType` enum** in `backend/app/db/models.py`:
   ```python
   class ATSType(str, enum.Enum):
       GREENHOUSE = "greenhouse"
       LEVER = "lever"
       ASHBY = "ashby"
       WORKABLE = "workable"  # <-- New ATS
   ```

2. **Add to factory router** in `backend/app/services/ingest.py`:
   ```python
   from app.crawlers.workable import WorkableFetcher

   def get_fetcher_for_company(company: Company) -> BaseFetcher:
       if company.ats_type == ATSType.GREENHOUSE:
           return GreenhouseFetcher()
       elif company.ats_type == ATSType.WORKABLE:
           return WorkableFetcher()  # <-- Register
   ```

### Step 3: Write a Unit Test with Mocked Data

Add a unit test in `backend/tests/test_ingest.py` testing the JSON parsing against a mocked response:

```python
@pytest.mark.asyncio
async def test_workable_fetcher_parses_jobs() -> None:
    company = Company(name="Acme", slug="acme", ats_type=ATSType.WORKABLE, ats_token="acme")
    mock_payload = {"results": [{"shortcode": "A1B2C3", "title": "Software Engineer", "city": "Berlin"}]}

    with patch.object(httpx.AsyncClient, "get") as mock_get:
        mock_get.return_value = httpx.Response(200, json=mock_payload, request=httpx.Request("GET", "https://test"))
        fetcher = WorkableFetcher()
        jobs = await fetcher.fetch_jobs(company)
        assert len(jobs) == 1
        assert jobs[0].external_id == "A1B2C3"
```

---

## Crawler Etiquette Checklist

When implementing or modifying crawler logic:
- Respect `robots.txt` before fetching non-API career pages.
- Never crawl faster than 1 request per 1.5 seconds per domain (`DomainRateLimiter`).
- Always pass `get_settings().sift_crawler_user_agent` with contact info.
- **Never scrape walled aggregators** (LinkedIn, Indeed, Glassdoor are strictly blacklisted).

---

## Pull Request Guidelines

1. Run the linter and test suite before submitting:
   ```bash
   # Backend
   cd backend && uv run ruff check . && uv run pytest

   # Frontend
   cd frontend && npm run lint && npm run build
   ```
2. Keep PRs scoped to a single feature or fix.
3. Include brief inline comments explaining **WHY**, not what.
