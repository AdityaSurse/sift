import asyncio
import urllib.robotparser
from typing import Dict, Optional
from urllib.parse import urlparse
import httpx
from app.core.config import get_settings


class RobotsChecker:
    """Async robots.txt compliance checker with in-memory domain caching.
    
    Why: Good web citizenship mandates checking robots.txt before indexing.
    Caching per domain prevents spamming the host's root server on every page request.
    """

    def __init__(self, timeout_sec: float = 8.0) -> None:
        self._timeout_sec = timeout_sec
        self._cache: Dict[str, urllib.robotparser.RobotFileParser] = {}
        self._lock = asyncio.Lock()
        self._settings = get_settings()

    async def get_parser(self, url: str) -> urllib.robotparser.RobotFileParser:
        """Retrieves or fetches the cached RobotFileParser for the URL's origin host."""
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"

        async with self._lock:
            if origin in self._cache:
                return self._cache[origin]

        # Fetch outside lock to avoid blocking other domains during network I/O
        parser = urllib.robotparser.RobotFileParser()
        robots_url = f"{origin}/robots.txt"

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout_sec,
                follow_redirects=True,
                headers={"User-Agent": self._settings.sift_crawler_user_agent},
            ) as client:
                resp = await client.get(robots_url)
                if resp.status_code == 200:
                    parser.parse(resp.text.splitlines())
                elif resp.status_code in (401, 403):
                    # Why: Explicit 403 on robots.txt signals webmaster disallows automated agents
                    parser.disallow_all = True
                else:
                    # Why: 404 means the domain does not restrict crawling
                    parser.allow_all = True
        except Exception:
            # Why: Network errors or timeouts should default to permissive crawling for public career pages
            parser.allow_all = True

        async with self._lock:
            self._cache[origin] = parser

        return parser

    async def is_allowed(self, url: str, user_agent: Optional[str] = None) -> bool:
        """Determines whether Sift is allowed to crawl the specified path."""
        ua = user_agent or self._settings.sift_crawler_user_agent
        parser = await self.get_parser(url)
        return parser.can_fetch(ua, url)

    async def get_crawl_delay(self, url: str, user_agent: Optional[str] = None) -> Optional[float]:
        """Returns the Crawl-delay specified in robots.txt if present."""
        ua = user_agent or self._settings.sift_crawler_user_agent
        parser = await self.get_parser(url)
        delay = parser.crawl_delay(ua)
        return float(delay) if delay is not None else None


# Global singleton instance for use across crawler modules
robots_checker = RobotsChecker()
