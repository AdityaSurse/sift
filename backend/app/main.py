from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Sift API",
    description="Polite job-discovery engine API aggregating direct company career postings.",
    version="0.1.0",
)

# Why: Enable seamless development between Vite frontend (port 5173) and FastAPI backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    """Returns application health and runtime environment.
    
    Why: Used by Docker health checks, CI workflows, and frontend status checks.
    """
    return {
        "status": "healthy",
        "environment": settings.sift_env,
        "version": "0.1.0",
    }
