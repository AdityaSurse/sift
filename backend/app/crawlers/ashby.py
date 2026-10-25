import logging
from datetime import datetime
from typing import List, Optional

import httpx

from app.core.config import get_settings
from app.crawlers.base import BaseFetcher, RawJob
from app.db.models import Company

logger = logging.getLogger(__name__)


class AshbyFetcher(BaseFetcher):
    """Fetches public job postings from Ashby Posting API.
    
    Documentation: https://developers.ashbyhq.com/reference/job-board-api
    Public Endpoint: GET https://api.ashbyhq.com/posting-api/job-board/{board_token}?includeCompensation=true
    
    Why: Ashby provides an unauthenticated JSON endpoint returning all currently active
    roles. Adding `includeCompensation=true` retrieves structured salary bands if configured.
    """

    BASE_URL = "https://api.ashbyhq.com/posting-api/job-board"

    async def fetch_jobs(
        self, company: Company, client: Optional[httpx.AsyncClient] = None
    ) -> List[RawJob]:
        token = company.ats_token or company.slug
        url = f"{self.BASE_URL}/{token}"
        params = {"includeCompensation": "true"}
        settings = get_settings()
        headers = {"User-Agent": settings.sift_crawler_user_agent}

        logger.info(f"Fetching Ashby postings for {company.name} (token: {token})")

        if client:
            resp = await client.get(url, params=params, headers=headers, timeout=15.0)
            data = resp.json() if resp.status_code == 200 else {}
        else:
            async with httpx.AsyncClient(headers=headers, timeout=15.0) as session:
                resp = await session.get(url, params=params)
                data = resp.json() if resp.status_code == 200 else {}

        if resp.status_code != 200:
            logger.warning(f"Ashby API returned HTTP {resp.status_code} for {token}")
            return []

        raw_jobs: List[RawJob] = []
        for item in data.get("jobs", []):
            job_id = str(item.get("id"))
            title = item.get("title", "").strip()
            apply_url = item.get("jobUrl") or item.get("applyUrl") or ""
            if not job_id or not title or not apply_url:
                continue

            posted_at: Optional[datetime] = None
            if item.get("publishedAt"):
                try:
                    posted_at = datetime.fromisoformat(item["publishedAt"].replace("Z", "+00:00"))
                except ValueError:
                    posted_at = None

            raw_jobs.append(
                RawJob(
                    external_id=job_id,
                    title=title,
                    description_html=item.get("descriptionHtml"),
                    description_text=item.get("descriptionPlain"),
                    apply_url=apply_url,
                    location_raw=item.get("location"),
                    employment_type_raw=item.get("employmentType"),
                    department_raw=item.get("department") or item.get("team"),
                    posted_at=posted_at,
                    raw_payload=item,
                )
            )

        logger.info(f"Retrieved {len(raw_jobs)} Ashby jobs for {company.name}")
        return raw_jobs
