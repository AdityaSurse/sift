# Multi-stage production Dockerfile using official Astral uv image
# Why: Dramatically speeds up build times and produces small, secure container images

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

# Enable bytecode compilation for faster cold starts
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Install dependencies in a separate layer for maximum Docker cache utilization
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Final runtime image
FROM python:3.12-slim-bookworm AS runtime

WORKDIR /app

# Create non-privileged system user for container security
RUN groupadd -r appgroup && useradd -r -g appgroup -s /bin/false appuser

# Copy virtual environment and binary wrappers from builder stage
COPY --from=builder --chown=appuser:appgroup /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy application source and migrations
COPY --chown=appuser:appgroup alembic.ini ./
COPY --chown=appuser:appgroup alembic ./alembic
COPY --chown=appuser:appgroup app ./app

# Drop root privileges
USER appuser

EXPOSE 8000

# Non-root health check against /health probe endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; exit(0 if urllib.request.urlopen('http://localhost:8000/health').getcode() == 200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
