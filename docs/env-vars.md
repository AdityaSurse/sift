# Environment Variable Reference

This document provides a comprehensive specification of all environment variables used across Sift backend services, ingestion workers, and frontend clients.

---

## 1. Backend Server Runtime

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SIFT_ENV` | `string` | `development` | Operating environment (`development`, `test`, `production`). Enables debug logs and controls CORS. |
| `SIFT_HOST` | `string` | `0.0.0.0` | Network binding interface for the Uvicorn ASGI server. |
| `SIFT_PORT` | `integer` | `8000` | Port on which the FastAPI application listens. |
| `SIFT_FRONTEND_ORIGIN` | `string` | `http://localhost:5173` | Explicit allowed origin for CORS requests from the React frontend. |
| `SIFT_API_RATE_LIMIT_PER_MINUTE` | `integer` | `60` | Sliding window rate limit cap enforced per IP address on public endpoints. |
| `SIFT_ADMIN_TOKEN` | `string` | `sift-secret-admin-token` | Secret bearer token required in `X-Admin-Token` to query `/admin/stats`. |
| `SIFT_SENTRY_DSN` | `string` (optional) | `None` | Sentry DSN for structured production error reporting and uncaught exception capture. |

---

## 2. PostgreSQL & pgvector Database

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` / `SIFT_DATABASE_URL` | `string` | `postgresql+asyncpg://adityasurse@localhost:5432/sift_dev` | Async connection string for primary database (PostgreSQL 16 + pgvector). |
| `SIFT_TEST_DATABASE_URL` | `string` | `postgresql+asyncpg://adityasurse@localhost:5432/sift_test` | Dedicated isolated database string used exclusively during `pytest` runs. |

---

## 3. Polite Crawler & Etiquette Settings

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SIFT_CRAWLER_USER_AGENT` | `string` | `SiftBot/1.0 (+https://siftjobs.com/bot; crawler@siftjobs.com)` | Public bot identifier header containing contact URL and team contact email. |
| `SIFT_CRAWLER_DEFAULT_DELAY_SEC` | `float` | `1.5` | Minimum polite delay enforced between consecutive requests to the same domain host. Enforces $\ge 1.0\text{s}$. |
| `SIFT_CRAWLER_TIMEOUT_SEC` | `float` | `15.0` | HTTP network timeout ceiling in seconds to eliminate hanging connections. |
| `SIFT_CRAWLER_MAX_CONCURRENCY_PER_DOMAIN` | `integer` | `1` | Strict concurrency cap per domain to avoid hammering any single career host. |

---

## 4. AI Enrichment & Embeddings (Gemini)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SIFT_LLM_PROVIDER` | `string` | `gemini` | Chosen LLM provider (`gemini`, `openai`, `anthropic`). |
| `SIFT_LLM_MODEL` | `string` | `gemini-1.5-flash` | Gemini model name used for low-temperature structured job extraction. |
| `SIFT_EMBEDDING_MODEL` | `string` | `text-embedding-004` | 768-dimensional embedding model name used for semantic search vectors. |
| `SIFT_LLM_RPM_LIMIT` | `integer` | `15` | Client-side rate limiter preventing Google Cloud API 429 quota exhaustion. |
| `GEMINI_API_KEY` | `string` | `""` | Google Gemini Cloud API secret key. |

---

## 5. Frontend Client (`frontend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `string` | `/api` | Base URL for API requests. In local dev, Vite proxies `/api` to `http://localhost:8000`. |
