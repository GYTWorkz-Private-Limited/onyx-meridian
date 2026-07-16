"""Conversational KPI chat: pgvector schema retrieval -> text-to-SQL -> safe execute -> summarize.

Simplified single-process port of the Driver_safety convBI pattern (no LangGraph/Qdrant/Redis —
this app has one Postgres database and no multi-tenant routing, so a straight-line pipeline with
one retry-on-error step covers the same ground with far less infrastructure).
"""

import asyncio
import json
import os
import re
from collections.abc import AsyncIterator
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from openai import AsyncAzureOpenAI

from ..db import pool
from . import redis_session

EMBED_CLIENT = AsyncAzureOpenAI(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT_EMBED"],
    api_key=os.environ["AZURE_OPENAI_API_KEY_EMBED"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION_EMBED"],
)
EMBED_DEPLOYMENT = os.environ["AZURE_OPENAI_DEPLOYMENT_EMBED"]

CHAT_CLIENT = AsyncAzureOpenAI(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT_CHAT"],
    api_key=os.environ["AZURE_OPENAI_API_KEY_CHAT"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION_CHAT"],
)
CHAT_DEPLOYMENT = os.environ["AZURE_OPENAI_DEPLOYMENT_CHAT"]

TOP_K_TABLES = 6
MAX_RETRIES = 2
ROW_LIMIT = 200

BLOCKED_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b", re.IGNORECASE
)

SQL_SYSTEM_PROMPT = """You are a SQL analyst for the "onyx_meridian" Postgres database, which \
tracks KPIs, business units, goals, agents, tasks, workflows, risks, and related enterprise data.

You are given the schemas of the tables most relevant to the user's question (columns, types, \
sample values, foreign keys). Write a single read-only PostgreSQL query that answers the question.

Rules:
- Only a SELECT statement (CTEs with WITH are allowed). Never modify data.
- Use only the tables and columns shown below — do not invent columns.
- Quote identifiers that need it; join via the foreign keys shown.
- Return ONLY the raw SQL. No markdown fences, no explanation, no trailing semicolon commentary.

Relevant tables:
{schema_context}
"""

SUMMARIZE_SYSTEM_PROMPT = """You are a business analyst summarizing a KPI query result for a \
manufacturing enterprise dashboard. Given the user's question and the query result rows (JSON), \
write a concise 2-4 sentence natural-language answer. Reference concrete numbers from the data. \
Do not mention SQL, queries, or databases. If the result is empty, say no matching data was found."""

CHART_SYSTEM_PROMPT = """You decide whether a query result for a KPI dashboard chatbot deserves a \
chart, and if so, how to draw it. Given the user's question and the result rows (JSON), respond \
with ONLY a JSON object (no markdown fences):

{"type": "bar" | "line" | "pie" | "none", "xKey": "<column name>", "yKeys": ["<column name>", ...], "title": "<short title>"}

Rules:
- Use "none" if the result is a single row/scalar, or has no meaningful category/series to plot.
- "xKey" must be a column suited as the category/time axis (e.g. a name, slug, or date column).
- "yKeys" must be numeric columns to plot against xKey — usually just one, occasionally two or three.
- Prefer "line" for a time series, "bar" for comparing categories, "pie" only for parts-of-a-whole with <= 6 categories.
- Every column referenced in "xKey"/"yKeys" must be an exact key from the result rows."""


def _parse_chart_spec(raw: str, data: list[dict]) -> dict | None:
    try:
        spec = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(spec, dict) or spec.get("type") not in ("bar", "line", "pie"):
        return None
    columns = set(data[0].keys())
    if spec.get("xKey") not in columns:
        return None
    y_keys = [k for k in spec.get("yKeys", []) if k in columns]
    if not y_keys:
        return None
    return {"type": spec["type"], "xKey": spec["xKey"], "yKeys": y_keys, "title": spec.get("title", "")}


async def generate_chart_spec(question: str, data: list[dict]) -> dict | None:
    if len(data) < 2:
        return None
    response = await CHAT_CLIENT.chat.completions.create(
        model=CHAT_DEPLOYMENT,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": CHART_SYSTEM_PROMPT},
            {"role": "user", "content": f"Question: {question}\n\nResult rows: {json.dumps(data[:50], default=str)}"},
        ],
    )
    return _parse_chart_spec(response.choices[0].message.content, data)


def _jsonable(value: Any) -> Any:
    # Decimal must stay numeric (not str) or every chart axis downstream sees strings
    # and Recharts can't compute a Y-domain from them.
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (UUID, datetime, date)):
        return str(value)
    return value


def _rows_to_json(records) -> list[dict]:
    return [{k: _jsonable(v) for k, v in dict(r).items()} for r in records]


async def _embed(text: str) -> list[float]:
    response = await EMBED_CLIENT.embeddings.create(model=EMBED_DEPLOYMENT, input=[text])
    return response.data[0].embedding


async def retrieve_schema_context(question: str) -> str:
    embedding = await _embed(question)
    vector_literal = "[" + ",".join(str(v) for v in embedding) + "]"
    rows = await pool().fetch(
        """
        SELECT content FROM kpi_schema_embeddings
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        """,
        vector_literal,
        TOP_K_TABLES,
    )
    return "\n\n".join(r["content"] for r in rows)


async def generate_sql(question: str, schema_context: str, history: list[dict]) -> str:
    messages = [{"role": "system", "content": SQL_SYSTEM_PROMPT.format(schema_context=schema_context)}]
    messages += history
    messages.append({"role": "user", "content": question})

    response = await CHAT_CLIENT.chat.completions.create(
        model=CHAT_DEPLOYMENT, messages=messages, temperature=0
    )
    sql = response.choices[0].message.content.strip()
    return re.sub(r"^```sql\s*|^```\s*|```$", "", sql, flags=re.MULTILINE).strip()


def _is_safe_select(sql: str) -> bool:
    stripped = sql.strip().rstrip(";").strip()
    if not re.match(r"^(SELECT|WITH)\b", stripped, re.IGNORECASE):
        return False
    return not BLOCKED_KEYWORDS.search(stripped)


async def execute_sql(sql: str) -> list[dict]:
    if not _is_safe_select(sql):
        raise ValueError("Generated query was not a safe read-only SELECT statement.")
    bounded_sql = f"SELECT * FROM ({sql.rstrip(';')}) AS _kpi_chat_result LIMIT {ROW_LIMIT}"
    async with pool().acquire() as conn:
        async with conn.transaction():
            await conn.execute("SET LOCAL statement_timeout = '10000'")
            records = await conn.fetch(bounded_sql)
    return _rows_to_json(records)


async def summarize(question: str, sql: str, data: list[dict]) -> str:
    payload = json.dumps(data[:50], default=str)
    response = await CHAT_CLIENT.chat.completions.create(
        model=CHAT_DEPLOYMENT,
        temperature=0.2,
        messages=[
            {"role": "system", "content": SUMMARIZE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Question: {question}\n\nQuery result ({len(data)} rows): {payload}"},
        ],
    )
    return response.choices[0].message.content.strip()


async def run_kpi_chat(question: str, thread_id: str) -> AsyncIterator[dict]:
    history = await redis_session.get_history(thread_id)

    yield {"type": "stage", "stage": "retrieving_schema"}
    schema_context = await retrieve_schema_context(question)

    yield {"type": "stage", "stage": "generating_sql"}
    sql = await generate_sql(question, schema_context, history)

    last_error: str | None = None
    data: list[dict] | None = None
    for attempt in range(MAX_RETRIES + 1):
        yield {"type": "stage", "stage": "executing_sql", "attempt": attempt + 1}
        try:
            data = await execute_sql(sql)
            break
        except Exception as exc:  # noqa: BLE001 - surfaced to the debugger retry below
            last_error = str(exc)
            if attempt >= MAX_RETRIES:
                break
            yield {"type": "stage", "stage": "fixing_sql"}
            sql = await generate_sql(
                question,
                schema_context,
                history
                + [
                    {"role": "assistant", "content": sql},
                    {"role": "user", "content": f"That query failed with error: {last_error}. Fix it and return corrected SQL only."},
                ],
            )

    if data is None:
        answer = f"I couldn't answer that — the query kept failing: {last_error}"
        await redis_session.append_messages(
            thread_id, [{"role": "user", "content": question}, {"role": "assistant", "content": answer}]
        )
        yield {"type": "final", "answer": answer, "sql": sql, "data": [], "chart": None}
        return

    yield {"type": "stage", "stage": "summarizing"}
    answer, chart = await asyncio.gather(
        summarize(question, sql, data), generate_chart_spec(question, data)
    )

    await redis_session.append_messages(
        thread_id, [{"role": "user", "content": question}, {"role": "assistant", "content": answer}]
    )
    yield {"type": "final", "answer": answer, "sql": sql, "data": data, "chart": chart}
