"""Redis-backed conversation history for KPI chat threads.

Mirrors Driver_safety's redis_session.py: one list per thread_id, 24h TTL,
capped to the most recent turns so prompts stay bounded.
"""

import json
import os

import redis.asyncio as redis

TTL_SECONDS = 24 * 60 * 60
MAX_MESSAGES = 20

_client: redis.Redis | None = None


def _get_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.Redis(
            host=os.environ.get("REDIS_HOST", "localhost"),
            port=int(os.environ.get("REDIS_PORT", 6379)),
            password=os.environ.get("REDIS_PASSWORD") or None,
            db=int(os.environ.get("REDIS_DB", 0)),
            decode_responses=True,
        )
    return _client


def _key(thread_id: str) -> str:
    return f"kpi_chat:{thread_id}"


async def get_history(thread_id: str) -> list[dict]:
    raw = await _get_client().lrange(_key(thread_id), 0, -1)
    return [json.loads(r) for r in raw]


async def append_messages(thread_id: str, messages: list[dict]) -> None:
    client = _get_client()
    key = _key(thread_id)
    pipe = client.pipeline()
    for m in messages:
        pipe.rpush(key, json.dumps(m))
    pipe.ltrim(key, -MAX_MESSAGES, -1)
    pipe.expire(key, TTL_SECONDS)
    await pipe.execute()
