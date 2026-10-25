from functools import lru_cache
from typing import Set

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables.
    
    Why: Centralizing configuration prevents secret leakage, enables reproducible
    deployments across dev/prod, and enforces crawler etiquette invariants early.
    """
    model_config = SettingsConfigDict(
        # Search parent directories so config resolves whether commands run from root or backend/
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server Runtime
    sift_env: str = Field(default="development", description="Runtime environment: development or production")
    sift_host: str = Field(default="0.0.0.0", description="Host address for API server")
    sift_port: int = Field(default=8000, description="Port for API server")

    # Storage
    sift_database_url: str = Field(
        default="postgresql+asyncpg://adityasurse@localhost:5432/sift_dev",
        validation_alias=AliasChoices("sift_database_url", "database_url"),
        description="Async database connection string for Supabase / PostgreSQL"
    )
    sift_test_database_url: str = Field(
        default="postgresql+asyncpg://adityasurse@localhost:5432/sift_test",
        validation_alias=AliasChoices("sift_test_database_url", "test_database_url", "database_url"),
        description="Async database connection string for test runs"
    )

    # Polite Crawler Configuration
    sift_crawler_user_agent: str = Field(
        default="SiftBot/1.0 (+https://siftjobs.com/bot; crawler@siftjobs.com)",
        description="Transparent User-Agent identifying Sift to career site webmasters"
    )
    sift_crawler_default_delay_sec: float = Field(
        default=1.5,
        description="Minimum polite delay between consecutive requests to the same host"
    )
    sift_crawler_timeout_sec: float = Field(
        default=15.0,
        description="Network request timeout to prevent hanging connections"
    )
    sift_crawler_max_concurrency_per_domain: int = Field(
        default=1,
        description="Strict concurrency cap per domain to avoid overloading host servers"
    )

    # Forbidden domains crawler guardrail
    # Why: Sift strictly indexes official company career portals and public ATS endpoints.
    # Walled-garden aggregator platforms are blacklisted at the configuration boundary.
    blacklisted_domains: Set[str] = {
        "linkedin.com",
        "www.linkedin.com",
        "indeed.com",
        "www.indeed.com",
        "glassdoor.com",
        "www.glassdoor.com",
    }

    # LLM Enrichment Settings
    sift_llm_provider: str = Field(default="gemini", description="LLM provider: gemini | openai | anthropic")
    sift_llm_model: str = Field(default="gemini-1.5-flash", description="Model name for job extraction")
    gemini_api_key: str = Field(default="", description="Google Gemini API key")
    openai_api_key: str = Field(default="", description="OpenAI API key")
    anthropic_api_key: str = Field(default="", description="Anthropic API key")

    @field_validator("sift_crawler_default_delay_sec")
    @classmethod
    def validate_min_delay(cls, v: float) -> float:
        # Why: Enforcing a minimum delay of 1.0s in code prevents accidental aggressive scraping
        if v < 1.0:
            raise ValueError("Polite crawling requires a minimum delay of at least 1.0 second per domain.")
        return v

    @field_validator("sift_crawler_user_agent")
    @classmethod
    def validate_user_agent(cls, v: str) -> str:
        # Why: Good web citizenship requires transparent contact info in User-Agent header
        if not v or "http" not in v:
            raise ValueError("Crawler User-Agent must identify the bot and contain a valid contact URL.")
        return v


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Returns a cached singleton of application settings.
    
    Why: Reading and parsing environment variables on every request or task
    introduces unnecessary I/O overhead.
    """
    return Settings()
