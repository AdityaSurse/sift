import asyncio
import collections
import hashlib
import json
import logging
import time
from typing import Any, Optional, Type, TypeVar

import httpx
from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Legacy model name translation for Gemini API changes
MODEL_ALIASES: dict[str, str] = {
    "gemini-1.5-flash": "gemini-3.5-flash-lite",
    "gemini-2.5-flash": "gemini-3.5-flash-lite",
    "gemini-flash": "gemini-3.5-flash-lite",
    "text-embedding-004": "gemini-embedding-001",
}


def clean_gemini_schema(schema_dict: dict[str, Any]) -> dict[str, Any]:
    """Inlines Pydantic $defs and $ref definitions for Gemini REST API compatibility.
    
    Why: The Gemini REST API responseSchema rejects OpenAPI $defs and $ref pointers with
    HTTP 400 Bad Request, requiring a dereferenced and inlined schema hierarchy.
    """
    defs = schema_dict.pop("$defs", {})
    if not defs:
        defs = schema_dict.pop("definitions", {})

    def resolve(node: Any) -> Any:
        if isinstance(node, dict):
            if "$ref" in node:
                ref_key = node["$ref"].split("/")[-1]
                if ref_key in defs:
                    return resolve(defs[ref_key].copy())
            return {
                k: resolve(v)
                for k, v in node.items()
                if k not in ["title", "default", "$defs"]
            }
        elif isinstance(node, list):
            return [resolve(x) for x in node]
        return node

    return resolve(schema_dict)


class GeminiClient:
    """Client for Google Gemini REST API supporting structured output and vector embeddings.
    
    Why: Using direct HTTP client avoids complex SDK version thrashing while providing
    deterministic rate limiting, response caching, and zero user data leakage.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        embedding_model: Optional[str] = None,
        rpm_limit: Optional[int] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.gemini_api_key
        raw_model = model or settings.sift_llm_model
        self.model = MODEL_ALIASES.get(raw_model, raw_model)
        raw_embedding = embedding_model or settings.sift_embedding_model
        self.embedding_model = MODEL_ALIASES.get(raw_embedding, raw_embedding)
        self.rpm_limit = rpm_limit or settings.sift_llm_rpm_limit
        self._external_client = http_client
        self._base_url = "https://generativelanguage.googleapis.com/v1beta"

        # Rate limiting: Sliding window queue of request timestamps
        self._request_timestamps: collections.deque[float] = collections.deque()
        self._rate_lock = asyncio.Lock()

        # In-memory LRU-like response cache to eliminate redundant LLM calls
        self._cache: dict[str, Any] = {}
        self._cache_max_size = 2000

    async def _throttle(self) -> None:
        """Enforces sliding-window rate limiting to respect API quotas without crashing."""
        async with self._rate_lock:
            now = time.monotonic()
            # Evict timestamps older than 60 seconds
            while self._request_timestamps and now - self._request_timestamps[0] >= 60.0:
                self._request_timestamps.popleft()

            if len(self._request_timestamps) >= self.rpm_limit:
                # Sleep until the oldest request falls outside the 60s window
                wait_time = 60.0 - (now - self._request_timestamps[0]) + 0.05
                if wait_time > 0:
                    logger.debug("Rate limit reached; pausing for %.2fs", wait_time)
                    await asyncio.sleep(wait_time)
                # Re-clean after sleep
                now = time.monotonic()
                while self._request_timestamps and now - self._request_timestamps[0] >= 60.0:
                    self._request_timestamps.popleft()

            self._request_timestamps.append(time.monotonic())

    def _cache_key(self, prefix: str, payload: Any) -> str:
        """Computes deterministic hash key to preserve memory safety."""
        serialized = json.dumps(payload, sort_keys=True)
        return f"{prefix}:{hashlib.sha256(serialized.encode('utf-8')).hexdigest()}"

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
    ) -> T:
        """Invokes Gemini with JSON Mode constrained to validate against the specified Pydantic schema.
        
        Why: Strict JSON schema enforcement eliminates hallucinated markdown wrapping
        and produces guaranteed parseable payloads.
        """
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured. Add it to .env or pass api_key to GeminiClient."
            )

        cache_key = self._cache_key(
            "gen",
            {"prompt": prompt, "schema": schema.__name__, "sys": system_instruction},
        )
        if cache_key in self._cache:
            return schema.model_validate(self._cache[cache_key])

        await self._throttle()

        url = f"{self._base_url}/models/{self.model}:generateContent"
        params = {"key": self.api_key}

        # Privacy: Send only the prompt and extraction instructions, never user metadata
        body: dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
            },
        }

        if system_instruction:
            body["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        # Provide JSON Schema definition to guide structured generation
        json_schema = clean_gemini_schema(schema.model_json_schema())
        body["generationConfig"]["responseSchema"] = json_schema

        headers = {"Content-Type": "application/json"}

        client = self._external_client or httpx.AsyncClient(timeout=30.0)
        try:
            response = await client.post(url, params=params, json=body, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Extract generated text from Gemini response structure
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError(f"Gemini API returned no candidates: {data}")

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts or "text" not in parts[0]:
                raise RuntimeError(f"Gemini candidate has no text part: {candidates[0]}")

            raw_text = parts[0]["text"]
            validated = schema.model_validate_json(raw_text)

            # Store validated payload in memory cache
            if len(self._cache) >= self._cache_max_size:
                self._cache.pop(next(iter(self._cache)))
            self._cache[cache_key] = validated.model_dump()

            return validated
        finally:
            if not self._external_client:
                await client.aclose()

    async def embed_text(self, text: str) -> list[float]:
        """Generates a 768-dimensional semantic embedding vector using text-embedding-004.
        
        Why: 768 dimensions align precisely with pgvector column definitions while
        capturing dense semantic similarity across job descriptions and search queries.
        """
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured. Add it to .env or pass api_key to GeminiClient."
            )

        cache_key = self._cache_key("embed", {"text": text, "model": self.embedding_model})
        if cache_key in self._cache:
            return self._cache[cache_key]

        await self._throttle()

        url = f"{self._base_url}/models/{self.embedding_model}:embedContent"
        params = {"key": self.api_key}
        body = {
            "model": f"models/{self.embedding_model}",
            "content": {"parts": [{"text": text}]},
            "outputDimensionality": 768,
        }
        headers = {"Content-Type": "application/json"}

        client = self._external_client or httpx.AsyncClient(timeout=30.0)
        try:
            response = await client.post(url, params=params, json=body, headers=headers)
            response.raise_for_status()
            data = response.json()

            embedding_values = data.get("embedding", {}).get("values")
            if not embedding_values or len(embedding_values) != 768:
                raise RuntimeError(
                    f"Unexpected embedding dimensions received: {len(embedding_values) if embedding_values else 0}"
                )

            # Cache successful embedding
            if len(self._cache) >= self._cache_max_size:
                self._cache.pop(next(iter(self._cache)))
            self._cache[cache_key] = embedding_values

            return embedding_values
        finally:
            if not self._external_client:
                await client.aclose()

    async def batch_embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Generates embeddings for a batch of texts sequentially or via batched requests."""
        results: list[list[float]] = []
        for text in texts:
            vector = await self.embed_text(text)
            results.append(vector)
        return results
