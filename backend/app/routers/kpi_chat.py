import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..db import pool
from ..kpi_chat.pipeline import execute_sql, run_kpi_chat, summarize

router = APIRouter(prefix="/api/kpi-chat", tags=["kpi-chat"])


class ChatRequest(BaseModel):
    question: str
    threadId: str


@router.post("/stream")
async def stream_chat(body: ChatRequest):
    async def event_stream():
        async for event in run_kpi_chat(body.question, body.threadId):
            yield f"data: {json.dumps(event, default=str)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


class SavedChatCreate(BaseModel):
    question: str
    answer: str
    sqlQuery: str | None = None
    resultData: list[dict] | None = None
    chartSpec: dict | None = None


SAVE_QUERY = """
    INSERT INTO kpi_saved_chats (question, answer, sql_query, result_data, chart_spec)
    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
    RETURNING id, question, answer, sql_query, result_data, chart_spec, created_at
"""
LIST_QUERY = """
    SELECT id, question, answer, sql_query, result_data, chart_spec, created_at
    FROM kpi_saved_chats
    ORDER BY created_at DESC
"""
GET_QUERY = """
    SELECT id, question, answer, sql_query, result_data, chart_spec, created_at
    FROM kpi_saved_chats
    WHERE id = $1
"""
DELETE_QUERY = "DELETE FROM kpi_saved_chats WHERE id = $1"
UPDATE_AFTER_REFRESH_QUERY = """
    UPDATE kpi_saved_chats
    SET answer = $2, result_data = $3::jsonb
    WHERE id = $1
    RETURNING id, question, answer, sql_query, result_data, chart_spec, created_at
"""


def _shape(row) -> dict:
    d = dict(row)
    d["id"] = str(d["id"])
    d["createdAt"] = d.pop("created_at").isoformat()
    d["sqlQuery"] = d.pop("sql_query", None)
    if "result_data" in d:
        raw = d.pop("result_data")
        d["resultData"] = json.loads(raw) if isinstance(raw, str) else raw
    if "chart_spec" in d:
        raw = d.pop("chart_spec")
        d["chartSpec"] = json.loads(raw) if isinstance(raw, str) else raw
    return d


@router.post("/saved", status_code=201)
async def save_chat(body: SavedChatCreate):
    row = await pool().fetchrow(
        SAVE_QUERY,
        body.question,
        body.answer,
        body.sqlQuery,
        json.dumps(body.resultData or []),
        json.dumps(body.chartSpec) if body.chartSpec else None,
    )
    return _shape(row)


@router.get("/saved")
async def list_saved_chats():
    rows = await pool().fetch(LIST_QUERY)
    return [_shape(r) for r in rows]


@router.get("/saved/{chat_id}")
async def get_saved_chat(chat_id: str):
    row = await pool().fetchrow(GET_QUERY, chat_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return _shape(row)


@router.delete("/saved/{chat_id}", status_code=204)
async def delete_saved_chat(chat_id: str):
    await pool().execute(DELETE_QUERY, chat_id)


@router.post("/saved/{chat_id}/refresh")
async def refresh_saved_chat(chat_id: str):
    row = await pool().fetchrow(GET_QUERY, chat_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    if not row["sql_query"]:
        raise HTTPException(status_code=400, detail="This pinned answer has no query to refresh.")

    try:
        data = await execute_sql(row["sql_query"])
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Refresh query failed: {exc}") from exc

    answer = await summarize(row["question"], row["sql_query"], data)
    updated = await pool().fetchrow(UPDATE_AFTER_REFRESH_QUERY, chat_id, answer, json.dumps(data))
    return _shape(updated)
