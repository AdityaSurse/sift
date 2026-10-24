from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional
import httpx
from pydantic import BaseModel, Field

from app.db.models import Company


class RawJob(BaseModel):
    """Normalized intermediate job payload extracted directly from ATS feeds or scrapers.
    
    Why: Decouples platform-specific ingestion schemas (Greenhouse JSON, Lever array,
    Ashby objects) from our internal storage model, allowing clean unit testing and
    safe transformation pipelines.
    """
    external_id: str = Field(description="Unique identifier assigned by the ATS or host portal")
    title: str = Field(description="Raw title string published by the hiring team")
    description_html: Optional[str] = Field(default=None, description="Raw HTML job description if available")
    description_text: Optional[str] = Field(default=None, description="Plaintext job description")
    apply_url: str = Field(description="Direct URL to view or apply for the job posting")
    location_raw: Optional[str] = Field(default=None, description="Raw location string reported by employer")
    employment_type_raw: Optional[str] = Field(default=None, description="Employment type (e.g. Full-time, Intern)")
    department_raw: Optional[str] = Field(default=None, description="Team or division name")
    posted_at: Optional[datetime] = Field(default=None, description="Publication timestamp if provided by ATS")
    raw_payload: Dict[str, Any] = Field(default_factory=dict, description="Original unaltered ATS JSON record")


class BaseFetcher(ABC):
    """Abstract interface defining the contract for all ATS and career page fetchers."""

    @abstractmethod
    async def fetch_jobs(
        self, company: Company, client: Optional[httpx.AsyncClient] = None
    ) -> List[RawJob]:
        """Fetches and extracts raw job postings for the given company.
        
        Why: Standardizes invocation across REST API connectors and headless browser scrapers.
        """
        pass
