import logging
from datetime import datetime, timezone
from typing import List, Optional

import httpx

from app.core.config import get_settings
from app.crawlers.base import BaseFetcher, RawJob
from app.db.models import Company

logger = logging.getLogger(__name__)


class LeverFetcher(BaseFetcher):
    """Fetches public job postings from Lever Postings API (v0).
    
    Documentation: https://github.com/lever/postings-api
    Public Endpoint: GET https://api.lever.co/v0/postings/{company_token}?mode=json
    
    Why: Lever's unauthenticated v0 API provides published postings formatted as a
    structured JSON array, including plain text descriptions and category metadata.
    """

    BASE_URL = "https://api.lever.co/v0/postings"

    async def fetch_jobs(
        self, company: Company, client: Optional[httpx.AsyncClient] = None
    ) -> List[RawJob]:
        token = company.ats_token or company.slug
        url = f"{self.BASE_URL}/{token}"
        params = {"mode": "json"}
        settings = get_settings()
        headers = {"User-Agent": settings.sift_crawler_user_agent}

        logger.info(f"Fetching Lever postings for {company.name} (token: {token})")

        if client:
            resp = await client.get(url, params=params, headers=headers, timeout=15.0)
            data = resp.json() if resp.status_code == 200 else []
        else:
            async with httpx.AsyncClient(headers=headers, timeout=15.0) as session:
                resp = await session.get(url, params=params)
                data = resp.json() if resp.status_code == 200 else []

        if resp.status_code != 200 or not isinstance(data, list):
            logger.warning(f"Lever API returned HTTP {resp.status_code} for {token}")
            return []

        raw_jobs: List[RawJob] = []
        for item in data:
            job_id = str(item.get("id"))
            title = item.get("text", "").strip()
            apply_url = item.get("hostedUrl") or item.get("applyUrl") or ""
            if not job_id or not title or not apply_url:
                continue

            # Convert millisecond epoch timestamp if provided
            posted_at: Optional[datetime] = None
            if item.get("createdAt"):
                try:
                    posted_at = datetime.fromtimestamp(item["createdAt"] / 1000, tz=timezone.utc)
                except (ValueError, OSError):
                    posted_at = None

            categories = item.get("categories") or {}
            raw_jobs.append(
                RawJob(
                    external_id=job_id,
                    title=title,
                    description_html=item.get("description"),
                    description_text=item.get("descriptionPlain"),
                    apply_url=apply_url,
                    location_raw=categories.get("location"),
                    employment_type_raw=categories.get("commitment"),
                    department_raw=categories.get("team"),
                    posted_at=posted_at,
                    raw_payload=item,
                )
            )

        logger.info(f"Retrieved {len(raw_jobs)} Lever jobs for {company.name}")
        return raw_jobs
