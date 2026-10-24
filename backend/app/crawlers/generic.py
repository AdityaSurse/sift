import hashlib
import json
import logging
from typing import List, Optional
from urllib.parse import urljoin

import httpx

from app.core.config import get_settings
from app.crawlers.base import BaseFetcher, RawJob
from app.crawlers.robots import robots_checker
from app.db.models import Company

logger = logging.getLogger(__name__)


class GenericPlaywrightFetcher(BaseFetcher):
    """Fallback crawler for companies utilizing proprietary or unstandardized career pages.
    
    Why: Over 40% of organizations use custom portals or enterprise suites (Workday,
    Oracle Taleo) without uniform public JSON APIs. Playwright executes JavaScript to
    render the DOM, after which an LLM structures the raw HTML text and links into
    standard job entities.
    """

    MAX_PAGES_PER_COMPANY = 1
    PAGE_TIMEOUT_MS = 15000

    async def fetch_jobs(
        self, company: Company, client: Optional[httpx.AsyncClient] = None
    ) -> List[RawJob]:
        if not company.careers_url:
            return []

        # Step 1: Strict robots.txt compliance
        is_allowed = await robots_checker.is_allowed(company.careers_url)
        if not is_allowed:
            logger.warning(f"Robots.txt disallows crawling for {company.careers_url}. Skipping.")
            return []

        settings = get_settings()
        logger.info(f"Launching Playwright scraper for custom career site: {company.name}")

        page_text: str = ""
        page_links: List[dict] = []

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=settings.sift_crawler_user_agent,
                    viewport={"width": 1280, "height": 800},
                )
                page = await context.new_page()
                page.set_default_timeout(self.PAGE_TIMEOUT_MS)

                try:
                    await page.goto(company.careers_url, wait_until="domcontentloaded")
                    await page.wait_for_timeout(1000)  # Brief delay for client hydration
                except Exception as e:
                    logger.warning(f"Navigation error for {company.careers_url}: {e}")

                # Extract rendered visible text
                page_text = await page.inner_text("body")
                # Truncate to avoid context window explosion
                page_text = page_text[:12000]

                # Extract anchor tags with hrefs
                raw_links = await page.evaluate(
                    """() => {
                        const anchors = Array.from(document.querySelectorAll('a[href]'));
                        return anchors.map(a => ({
                            text: a.innerText.trim(),
                            href: a.href
                        })).filter(a => a.text.length > 2 && a.href.startsWith('http'));
                    }"""
                )
                page_links = raw_links[:80]
                await browser.close()

        except Exception as e:
            logger.error(f"Playwright execution failed for {company.name}: {e}")
            return []

        if not page_text and not page_links:
            return []

        # Step 2: Use LLM to extract structured job postings from rendered content
        extracted_jobs = await self._extract_jobs_with_llm(
            company_name=company.name,
            careers_url=company.careers_url,
            page_text=page_text,
            links=page_links,
            client=client,
        )

        raw_jobs: List[RawJob] = []
        for item in extracted_jobs:
            title = item.get("title", "").strip()
            apply_url = item.get("apply_url", "").strip()
            location = item.get("location", "").strip() or None

            if not title or not apply_url:
                continue

            # Fully qualify relative apply URLs
            full_apply_url = urljoin(company.careers_url, apply_url)
            # Create stable deterministic external ID from target URL
            ext_id = hashlib.sha256(full_apply_url.encode("utf-8")).hexdigest()[:16]

            raw_jobs.append(
                RawJob(
                    external_id=f"custom-{ext_id}",
                    title=title,
                    description_text=f"Role at {company.name}: {title}. Apply directly via company portal.",
                    apply_url=full_apply_url,
                    location_raw=location,
                    raw_payload=item,
                )
            )

        logger.info(f"Extracted {len(raw_jobs)} custom jobs via LLM for {company.name}")
        return raw_jobs

    async def _extract_jobs_with_llm(
        self,
        company_name: str,
        careers_url: str,
        page_text: str,
        links: List[dict],
        client: Optional[httpx.AsyncClient] = None,
    ) -> List[dict]:
        """Prompts LLM to structure job titles, locations, and apply URLs from page text and links."""
        settings = get_settings()

        prompt = f"""
You are an expert career page parser. Extract all distinct open job postings from the text and links below for {company_name}.
Return ONLY a valid JSON list of objects matching this exact schema:
[
  {{"title": "Job Title", "location": "City, Country or Remote", "apply_url": "URL to apply"}}
]
If no open positions are found, return [].

Careers URL: {careers_url}

Sample Outbound Links:
{json.dumps(links[:40], indent=2)}

Page Text Snippet:
{page_text[:4000]}
"""

        # If no Gemini API key configured, gracefully fallback to heuristic link extraction
        if not settings.gemini_api_key:
            return self._heuristic_fallback(links, company_name)

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.sift_llm_model}:generateContent?key={settings.gemini_api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            }

            if client:
                resp = await client.post(url, json=payload, timeout=20.0)
            else:
                async with httpx.AsyncClient(timeout=20.0) as s:
                    resp = await s.post(url, json=payload)

            if resp.status_code == 200:
                data = resp.json()
                text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text_out)
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}. Using fallback.")
                return self._heuristic_fallback(links, company_name)

        except Exception as e:
            logger.warning(f"LLM extraction error: {e}. Using fallback.")
            return self._heuristic_fallback(links, company_name)

    def _heuristic_fallback(self, links: List[dict], company_name: str) -> List[dict]:
        """Heuristic fallback identifying job openings from anchor link keywords when LLM is unavailable."""
        jobs = []
        job_keywords = ["engineer", "developer", "designer", "manager", "lead", "director", "intern", "researcher"]
        for link in links:
            text_lower = link["text"].lower()
            if any(k in text_lower for k in job_keywords) and len(link["text"]) < 80:
                jobs.append({
                    "title": link["text"],
                    "location": "See posting",
                    "apply_url": link["href"],
                })
        return jobs
