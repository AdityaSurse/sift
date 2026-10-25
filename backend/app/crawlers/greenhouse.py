import logging
from datetime import datetime
from typing import List, Optional

import httpx

from app.core.config import get_settings
from app.crawlers.base import BaseFetcher, RawJob
from app.db.models import Company

logger = logging.getLogger(__name__)


class GreenhouseFetcher(BaseFetcher):
    """Fetches public job postings from Greenhouse Job Board API.
    
    Documentation: https://developers.greenhouse.io/job-board.html
    Public Endpoint: GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
    
    Why: The public Greenhouse API returns all active jobs for an organization in a single
    lightweight JSON payload. Passing `content=true` includes full HTML job descriptions,
    eliminating the need for secondary per-job network requests.
    """

    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    async def fetch_jobs(
        self, company: Company, client: Optional[httpx.AsyncClient] = None
    ) -> List[RawJob]:
        token = company.ats_token or company.slug
        url = f"{self.BASE_URL}/{token}/jobs"
        params = {"content": "true"}
        settings = get_settings()
        headers = {"User-Agent": settings.sift_crawler_user_agent}

        logger.info(f"Fetching Greenhouse postings for {company.name} (token: {token})")

        if client:
            resp = await client.get(url, params=params, headers=headers, timeout=15.0)
            data = resp.json() if resp.status_code == 200 else {}
        else:
            async with httpx.AsyncClient(headers=headers, timeout=15.0) as session:
                resp = await session.get(url, params=params)
                data = resp.json() if resp.status_code == 200 else {}

        if resp.status_code != 200:
            logger.warning(f"Greenhouse API returned HTTP {resp.status_code} for {token}")
            return []

        raw_jobs: List[RawJob] = []
        for item in data.get("jobs", []):
            job_id = str(item.get("id"))
            title = item.get("title", "").strip()
            apply_url = item.get("absolute_url", "")
            if not job_id or not title or not apply_url:
                continue

            # Parse optional updated_at timestamp
            posted_at: Optional[datetime] = None
            if item.get("updated_at"):
                try:
                    posted_at = datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00"))
                except ValueError:
                    posted_at = None

            raw_jobs.append(
                RawJob(
                    external_id=job_id,
                    title=title,
                    description_html=item.get("content", ""),
                    apply_url=apply_url,
                    location_raw=item.get("location", {}).get("name") if item.get("location") else None,
                    posted_at=posted_at,
                    raw_payload=item,
                )
            )

        logger.info(f"Retrieved {len(raw_jobs)} Greenhouse jobs for {company.name}")
        return raw_jobs
