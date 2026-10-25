# Sift

> **The jobs nobody posts.** A polite, AI-enriched job-discovery engine that aggregates openings directly from company career pages and ATS platforms, enriches them with LLMs, and lets users search in natural language with direct links to apply.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-0.8+-336791.svg)](https://github.com/pgvector/pgvector)
[![React 19](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)

---

## High-Level Architecture

Sift is split into an asynchronous crawler and enrichment pipeline feeding a high-performance hybrid search engine:

```mermaid
flowchart TD
    subgraph Sources ["1. Direct ATS Feeds"]
        GH["Greenhouse API"]
        LEV["Lever Postings API"]
        ASH["Ashby Posting API"]
        CUST["Career Page Scraper"]
    end

    subgraph Crawler ["2. Polite Crawler Core"]
        ROBOTS{"Robots.txt Allowed?"}
        RATE["Per-Domain Rate Limiter<br/>(1.5s delay / domain)"]
        NORM["Normalizer Pipeline<br/>(Clean HTML & Extract Metadata)"]
    end

    subgraph AI ["3. AI Enrichment & Vectors"]
        GEMINI_JSON["Gemini 1.5 Flash<br/>(Structured Pydantic Extraction)"]
        GEMINI_EMBED["Google text-embedding-004<br/>(768-dim Semantic Vector)"]
    end

    subgraph Storage ["4. Persistent Database"]
        PG[("PostgreSQL 16 + pgvector<br/>(Relational Data + HNSW Index)")]
    end

    subgraph API ["5. FastAPI Backend"]
        PARSER["Query Parser<br/>(Natural Language to Filters)"]
        HYBRID["Hybrid Search Engine<br/>(SQL Filters + Vector Similarity)"]
    end

    subgraph Frontend ["6. Editorial UI"]
        REACT["React 19 + TypeScript<br/>(Calm Editorial Interface)"]
    end

    subgraph Destination ["7. Direct Application"]
        APPLY["Canonical Company Apply Page<br/>(Zero Middleman / Zero Account Wall)"]
    end

    Sources --> ROBOTS
    ROBOTS -- Yes --> RATE --> NORM
    ROBOTS -- No (Disallowed) --> SKIP["Skip Crawl"]
    
    NORM --> GEMINI_JSON --> GEMINI_EMBED --> PG
    
    REACT <-->|"REST API (/api/search)"| PARSER --> HYBRID <--> PG
    REACT -->|"Click Apply"| APPLY
```

---

## Subsystem Flowcharts

### 1. Natural Language Search & Hybrid Ranking

How a natural language search query is parsed, evaluated with hybrid search, and returned to the user:

```mermaid
flowchart LR
    A["User Query<br/>'6 mo embedded internship in Bangalore'"] --> B["FastAPI /api/search"]
    B --> C["Gemini Query Parser"]
    
    C --> D["Structured SearchIntent<br/>• Role: Embedded<br/>• Type: Internship<br/>• Max Months: 6<br/>• Location: Bangalore"]
    C --> E["Query Vector<br/>(768-dim Embedding)"]
    
    D --> F["PostgreSQL Engine"]
    E --> F
    
    F --> G["Hybrid Search Formula<br/>0.8 × Cosine Sim + 0.2 × FTS Rank<br/>Filtered by SQL Constraints"]
    G --> H["Ranked Job Rows with Rationale<br/>('Matches 6 mo internship')"]
    H --> I["Editorial React UI"]
```

---

### 2. Polite Crawler Pipeline

Every external HTTP request adheres strictly to polite crawler ethics:

```mermaid
flowchart TD
    START["Start Ingestion Run"] --> FETCH_ROBOTS["Fetch & Cache robots.txt"]
    FETCH_ROBOTS --> CHECK_ROBOTS{"Path Disallowed?"}
    
    CHECK_ROBOTS -- Yes --> LOG_SKIP["Log Warning & Skip Crawl"]
    CHECK_ROBOTS -- No --> BUCKET["Domain Rate Limiter<br/>Token Bucket (Min 1.5s Gap)"]
    
    BUCKET --> FETCH_JOBS["Fetch Public ATS Feed<br/>(Greenhouse / Lever / Ashby)"]
    FETCH_JOBS --> DEDUPE_HASH{"Description Hash<br/>Changed or New?"}
    
    DEDUPE_HASH -- Identical --> TOUCH["Update last_crawled_at"]
    DEDUPE_HASH -- New / Modified --> SAVE_RAW["Persist to jobs Table"]
    SAVE_RAW --> QUEUE_ENRICH["Queue for AI Enrichment"]
```

---

### 3. AI Enrichment Pipeline

Raw job descriptions are enriched with structured metadata using Gemini 1.5 Flash in JSON mode:

```mermaid
flowchart TD
    RAW["Raw Job Listing<br/>(Title + Description HTML)"] --> CLEAN["Sanitize & Strip HTML"]
    CLEAN --> GEMINI["Gemini 1.5 Flash<br/>Prompt: 'Return null instead of guessing'"]
    
    GEMINI --> VALIDATE{"Pydantic Schema<br/>Validation"}
    
    VALIDATE -- Valid --> EXTRACTED["Structured Metadata<br/>• Employment Type<br/>• Duration (months)<br/>• Experience Level<br/>• Role Category<br/>• Skills (max 12)<br/>• Remote Type"]
    VALIDATE -- Error --> FALLBACK["Store with Raw Data Only"]
    
    EXTRACTED --> EMBED_GEN["text-embedding-004<br/>(Title + Category + Skills + First 1k Chars)"]
    EMBED_GEN --> STORE_VEC["Update jobs.embedding<br/>in PostgreSQL"]
```

---

### 4. Job Expiry & Deduplication (3-Strike Rule)

Keeping the index clean of ghost jobs and duplicate postings across syndication networks:

```mermaid
flowchart TD
    CRAWL_DONE["Company Crawl Completes"] --> COMPARE["Compare Live Feed vs Database"]
    
    COMPARE --> FOUND{"Active in Feed?"}
    FOUND -- Yes --> RESET_STRIKE["Set missed_crawls_count = 0"]
    FOUND -- No --> INC_STRIKE["Increment missed_crawls_count + 1"]
    
    INC_STRIKE --> CHECK_LIMIT{"missed_crawls >= 3?"}
    CHECK_LIMIT -- Yes --> CLOSE_JOB["Mark status = 'closed'<br/>(Eliminate Ghost Job)"]
    CHECK_LIMIT -- No --> KEEP_ACTIVE["Keep Active (Strike Recorded)"]
    
    CLOSE_JOB --> DEDUPE["Cross-Source Deduplication<br/>Cluster by normalized title + company + location"]
```

---

### 5. Deployment Architecture (Planned)

Target production topology with zero server maintenance overhead:

```mermaid
flowchart LR
    subgraph CDN ["Frontend Hosting"]
        VERCEL["Vercel<br/>(React 19 + Vite SPA)"]
    end

    subgraph Cloud ["Backend Hosting"]
        RENDER["Container Service<br/>(FastAPI / Uvicorn Docker)"]
    end

    subgraph Data ["Managed Database"]
        SUPABASE["Managed PostgreSQL 16<br/>(pgvector extension enabled)"]
    end

    subgraph Crons ["Scheduled Jobs"]
        GHA["GitHub Actions Cron<br/>(Nightly Crawl & Freshness Worker)"]
    end

    USER["User Browser"] --> VERCEL
    VERCEL -->|"API Requests (/api/*)"| RENDER
    RENDER <--> SUPABASE
    GHA -->|"Run CLI / Ingest"| SUPABASE
```

---

## Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS | Clean typography, editorial density, zero layout shift |
| **Backend API** | FastAPI, Python 3.12+, Uvicorn | Async I/O for high-concurrency ingestion and rapid search API responses |
| **Database & Vector** | PostgreSQL 16 + `pgvector` | Single source of truth combining relational ACID transactions with vector similarity |
| **AI / Structured Output** | Gemini 1.5 Flash | High throughput, strict JSON schema output, low latency |
| **Vector Embeddings** | Google `text-embedding-004` | 768-dimensional semantic representations for hybrid search |
| **Web Crawling** | HTTPX, BeautifulSoup4, Playwright | Polite async crawling, rate-limiting, and JS rendering when required |
| **Package Management** | `uv` (Python) & `npm` (Node) | Instant dependency synchronization and reproducible builds |

---

## Project Structure

```text
sift/
├── backend/
│   ├── app/
│   │   ├── ai/                 # Gemini enrichment, embeddings & query parser
│   │   ├── api/                # FastAPI routes (/search, /jobs, /filters, /admin)
│   │   ├── core/               # Settings, configuration & domain guardrails
│   │   ├── crawler/            # Polite crawler core, rate-limiter & robots parser
│   │   │   ├── connectors/     # Greenhouse, Lever, Ashby, and custom scrapers
│   │   │   ├── client.py       # Polite HTTP client with token bucket
│   │   │   └── robots.py       # Async robots.txt compliance checker
│   │   ├── db/                 # PostgreSQL models, pgvector migrations & session
│   │   ├── services/           # Hybrid search & maintenance services
│   │   ├── cli.py              # Administrative & crawler CLI commands
│   │   └── main.py             # ASGI entrypoint
│   ├── tests/                  # 50+ unit & integration tests
│   ├── Dockerfile              # Production container build
│   └── pyproject.toml          # uv project configuration
├── frontend/
│   ├── src/
│   │   ├── components/         # SearchBar, JobRow, FilterRail, Header, Drawer
│   │   ├── pages/              # LandingPage, SearchPage, SavedPage, AdminPage
│   │   ├── types/              # Strict TypeScript API definitions
│   │   └── index.css           # Editorial design tokens & typography
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── design-system.md        # UI tokens, typography & crawler ethics manifesto
├── .github/workflows/          # CI, nightly crawl & enrichment pipelines
├── CONTRIBUTING.md             # Guide: Add an ATS connector in <50 lines
├── .env.example                # Safe environment template
└── README.md
```

---

## Local Development

### Prerequisites

- Python 3.12+ with [`uv`](https://github.com/astral-sh/uv)
- Node.js 20+ with `npm`
- PostgreSQL 16 with `pgvector` extension

### 1. Clone & Configure

```bash
git clone https://github.com/AdityaSurse/sift.git
cd sift
cp .env.example .env
```

### 2. Start Backend

```bash
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

The API docs are available at `http://localhost:8000/docs`.

### 3. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The web application is available at `http://localhost:5173`.

### 4. Run Crawler & Maintenance CLI

```bash
cd ../backend

# Import seed company list
uv run python -m app.cli import-companies --csv-path data/companies_seed.csv

# Crawl all verified career pages
uv run python -m app.cli crawl --all --output-summary crawl_summary.json

# Enrich raw job postings with Gemini AI
uv run python -m app.cli enrich-and-embed --batch-size 50

# Run 3-strike ghost job expiry & deduplication
uv run python -m app.cli maintenance --missed-threshold 3
```

---

## Crawling Ethics

Sift is built on strict web citizenship principles:

1. **Strict Robots.txt Adherence**: Every domain's `robots.txt` is fetched, parsed, and cached. Any disallowed path is skipped immediately.
2. **Per-Domain Rate Limiting**: Minimum delay of 1.5 seconds between requests to the same host with a token bucket concurrency limit of 1.
3. **No Walled Gardens**: Sift **never** scrapes LinkedIn, Indeed, Glassdoor, or closed networks. We only index public ATS feeds and official career endpoints.
4. **Transparent Identity**: All HTTP requests identify clearly:  
   `User-Agent: SiftBot/1.0 (+https://siftjobs.com/bot; crawler@siftjobs.com)`
5. **Direct Apply Only**: Apply links always redirect users directly to the original career portal in a new tab. We never capture applicant data, lock jobs behind accounts, or monetize referrals.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for step-by-step instructions on implementing a new ATS connector in under 50 lines.

## License

This project is licensed under the [MIT License](LICENSE).
