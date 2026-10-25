from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()

# Why: asyncpg driver provides non-blocking PostgreSQL I/O required for high-throughput FastAPI routes
engine: AsyncEngine = create_async_engine(
    settings.sift_database_url,
    echo=False,
    pool_pre_ping=True,  # Why: Verifies liveness before leasing connections from pool
    pool_size=10,
    max_overflow=20,
)

# Why: expire_on_commit=False avoids lazy loads after commit in async contexts
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session scoped per request.
    
    Why: Automatically commits or rolls back transactions and closes the connection
    at the end of the HTTP request lifecycle.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
