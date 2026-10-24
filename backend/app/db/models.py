import enum
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Computed,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy 2.0 models."""
    pass


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class ATSType(str, enum.Enum):
    """Supported Applicant Tracking Systems and career page protocols."""
    GREENHOUSE = "greenhouse"
    LEVER = "lever"
    ASHBY = "ashby"
    WORKABLE = "workable"
    SMARTRECRUITERS = "smartrecruiters"
    CUSTOM = "custom"
    UNKNOWN = "unknown"


class RemoteType(str, enum.Enum):
    """Workplace presence policy extracted from job descriptions."""
    ONSITE = "onsite"
    HYBRID = "hybrid"
    REMOTE = "remote"


class EmploymentType(str, enum.Enum):
    """Contract and commitment model for the opening."""
    INTERNSHIP = "internship"
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"


class ExperienceLevel(str, enum.Enum):
    """Career seniority tier normalized across varied corporate naming schemes."""
    INTERN = "intern"
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"


class CrawlStatus(str, enum.Enum):
    """State machine status for asynchronous crawler batch executions."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class Company(Base):
    """Represents a company or organization whose career board is indexed by Sift."""
    __tablename__ = "companies"

    # Primary key UUID avoids integer enumeration attacks and facilitates distributed generation
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Display name of the employer (e.g. "Linear", "Figma")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # URL-friendly slug used for routing and deduplication (e.g. "linear")
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    # Canonical career page URL where users and crawlers can locate active postings
    careers_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    # ATS classification directing the polite crawler to the appropriate connector logic
    ats_type: Mapped[ATSType] = mapped_column(
        Enum(ATSType, name="ats_type_enum"),
        default=ATSType.UNKNOWN,
        nullable=False,
    )
    # Company identifier token on the ATS (e.g., 'linear' in boards-api.greenhouse.io/v1/boards/linear)
    ats_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Industry categorization for faceted discovery (e.g., "Developer Tools", "AI / ML")
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # ISO country code or headquarters nation (e.g., "US", "DE")
    hq_country: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    # Flag to pause crawling inactive or defunct companies without deleting history
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Timestamp of the most recent crawl attempt for scheduling frequency algorithms
    last_crawled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Record creation audit timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # Record last modification audit timestamp
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    jobs: Mapped[List["Job"]] = relationship(
        "Job", back_populates="company", cascade="all, delete-orphan"
    )
    crawl_runs: Mapped[List["CrawlRun"]] = relationship(
        "CrawlRun", back_populates="company", cascade="all, delete-orphan"
    )


class Job(Base):
    """Represents an active or historic job opening normalized from an ATS."""
    __tablename__ = "jobs"

    # Primary key UUID for stable cross-session references and privacy
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Foreign key linking the job to its verified hiring company
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # ATS-specific posting identifier (e.g., Greenhouse job ID '5123910')
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    # Normalized position title (e.g. "Senior Distributed Systems Engineer")
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    # Clean text-only job description with HTML tags stripped for token efficiency and search
    description_text: Mapped[str] = mapped_column(Text, nullable=False)
    # Canonical direct application link leading to the company's ATS form
    apply_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    # Raw location string as published by the employer (e.g. "San Francisco, CA or Remote (US)")
    location_raw: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Parsed primary city for geographic filtering (e.g. "San Francisco")
    location_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # Parsed country code for international filtering (e.g. "US")
    location_country: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Work arrangement classification (onsite, hybrid, or fully remote)
    remote_type: Mapped[Optional[RemoteType]] = mapped_column(
        Enum(RemoteType, name="remote_type_enum"), nullable=True
    )
    # Employment contract type (internship, full_time, part_time, contract)
    employment_type: Mapped[Optional[EmploymentType]] = mapped_column(
        Enum(EmploymentType, name="employment_type_enum"), nullable=True
    )
    # Fixed duration in months for internships or fixed-term contracts
    duration_months: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Normalized seniority tier extracted from title and qualifications
    experience_level: Mapped[Optional[ExperienceLevel]] = mapped_column(
        Enum(ExperienceLevel, name="experience_level_enum"), nullable=True
    )
    # Broad functional discipline (e.g. "Backend Engineering", "AI Research")
    role_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # Normalized skills array extracted via LLM (e.g. ["Python", "Rust", "PostgreSQL"])
    skills: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    # Published date reported by the ATS if available
    posted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Timestamp when Sift first detected this job opening
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    # Timestamp when Sift last confirmed this posting remains open on the ATS
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    # Liveness indicator set to False when posting disappears from company career board
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # 768-dimensional semantic embedding vector generated via Google text-embedding-004
    embedding: Mapped[Optional[Any]] = mapped_column(Vector(768), nullable=True)
    # Raw unaltered JSON payload stored for auditing and debugging parser changes
    raw_payload: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    # Generated PostgreSQL tsvector column combining title and description for full-text search
    search_vector: Mapped[Optional[Any]] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description_text, ''))",
            persisted=True,
        ),
        nullable=True,
    )

    # Relationship to owning company
    company: Mapped["Company"] = relationship("Company", back_populates="jobs")

    # Constraints and Indexes
    __table_args__ = (
        # Natural composite unique key preventing duplicate ingestion of the same ATS posting
        UniqueConstraint("company_id", "external_id", name="uq_jobs_company_external_id"),
        # GIN index for accelerated array containment queries (e.g. skills @> ARRAY['Rust'])
        Index("idx_jobs_skills_gin", "skills", postgresql_using="gin"),
        # Composite B-tree index optimizing active job filtering by employment type
        Index("idx_jobs_is_open_employment_type", "is_open", "employment_type"),
        # HNSW approximate nearest neighbor index for fast vector cosine similarity search
        Index(
            "idx_jobs_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        # GIN index for high-speed lexical full-text search matches
        Index("idx_jobs_search_vector_gin", "search_vector", postgresql_using="gin"),
    )


class CrawlRun(Base):
    """Audit log tracking individual crawler execution runs against an ATS."""
    __tablename__ = "crawl_runs"

    # Primary key UUID for crawl run execution tracking
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Foreign key referencing the company board being scanned
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Timestamp when the crawler worker initiated the HTTP request batch
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    # Timestamp when crawling and persistence completed
    finished_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Execution lifecycle status (pending, running, success, failed)
    status: Mapped[CrawlStatus] = mapped_column(
        Enum(CrawlStatus, name="crawl_status_enum"),
        default=CrawlStatus.PENDING,
        nullable=False,
    )
    # Total count of job postings found on the target ATS board during this run
    jobs_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Number of newly discovered postings inserted into Sift during this run
    jobs_new: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Number of previously known postings that were marked closed during this run
    jobs_closed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Detailed error diagnostics or exception stacktrace if crawler encountered failures
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship to owning company
    company: Mapped["Company"] = relationship("Company", back_populates="crawl_runs")
