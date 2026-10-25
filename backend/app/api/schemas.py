import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Error Schemas
# ---------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    """Normalized error detail model ensuring consistent API error contracts."""
    code: str = Field(description="Machine-readable error classification code")
    message: str = Field(description="Human-readable explanation of the error condition")
    details: Optional[Any] = Field(default=None, description="Optional diagnostic details or validation failures")


class ErrorResponse(BaseModel):
    """Uniform root error response container."""
    error: ErrorDetail


# ---------------------------------------------------------------------------
# Job Detail Schema
# ---------------------------------------------------------------------------

class JobDetailResponse(BaseModel):
    """Full detail specification of an individual job opening."""
    id: uuid.UUID
    external_id: str
    title: str
    company_name: str
    company_slug: str
    company_careers_url: str
    apply_url: str
    description_text: str
    location_raw: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    remote_type: Optional[str] = None
    employment_type: Optional[str] = None
    duration_months: Optional[int] = None
    experience_level: Optional[str] = None
    role_category: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    posted_at: Optional[datetime] = None
    first_seen_at: datetime
    is_open: bool


# ---------------------------------------------------------------------------
# Search Schemas
# ---------------------------------------------------------------------------

class SearchItem(BaseModel):
    """Individual ranked search match with explainability metadata."""
    job_id: str
    title: str
    company_name: str
    company_slug: str
    apply_url: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    remote_type: Optional[str] = None
    duration_months: Optional[int] = None
    skills: list[str] = Field(default_factory=list)
    score: float
    match_reasons: list[str] = Field(default_factory=list)


class ParsedIntentResponse(BaseModel):
    """Structured search intent extracted from natural-language query text."""
    role_keywords: Optional[str] = None
    employment_type: Optional[str] = None
    max_duration_months: Optional[int] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    remote_type: Optional[str] = None


class SearchResponse(BaseModel):
    """Paginated search response with total counts and parsed intent diagnostics."""
    items: list[SearchItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    parsed_intent: Optional[ParsedIntentResponse] = None


# ---------------------------------------------------------------------------
# Filter Options Schemas
# ---------------------------------------------------------------------------

class FilterOptionItem(BaseModel):
    """Facet item containing enum value, display label, and active count."""
    value: str
    label: str
    count: int


class FilterCategoryItem(BaseModel):
    """Role category facet with active job count."""
    value: str
    count: int


class FilterLocationItem(BaseModel):
    """Location facet with city, country, and active job count."""
    city: str
    country: Optional[str] = None
    count: int


class FilterOptionsResponse(BaseModel):
    """Aggregated facet counts across all active job postings."""
    employment_types: list[FilterOptionItem]
    experience_levels: list[FilterOptionItem]
    remote_types: list[FilterOptionItem]
    role_categories: list[FilterCategoryItem]
    locations: list[FilterLocationItem]
    total_open_jobs: int


# ---------------------------------------------------------------------------
# System Schemas
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """System health check payload verifying database and runtime status."""
    status: str
    environment: str
    database: str
    version: str
