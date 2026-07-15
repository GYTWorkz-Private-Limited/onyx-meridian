"""Embeds the schema template (produced by extract_schema.py) and stores it in pgvector.

Run: python -m kpi_builder.generate_embeddings
Requires: kpi_builder/schema/onyx_meridian_schema.json to already exist.
"""

import asyncio
import json
import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
SCHEMA_PATH = Path(__file__).parent / "schema" / "onyx_meridian_schema.json"

AZURE_ENDPOINT = os.environ["AZURE_OPENAI_ENDPOINT_EMBED"]
AZURE_API_KEY = os.environ["AZURE_OPENAI_API_KEY_EMBED"]
AZURE_DEPLOYMENT = os.environ["AZURE_OPENAI_DEPLOYMENT_EMBED"]
AZURE_API_VERSION = os.environ["AZURE_OPENAI_API_VERSION_EMBED"]

EMBEDDING_DIM = 3072  # text-embedding-3-large
TABLE_NAME = "kpi_schema_embeddings"
BATCH_SIZE = 16

CREATE_TABLE_SQL = f"""
    CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        table_name TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB NOT NULL,
        embedding VECTOR({EMBEDDING_DIM}) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
"""

# No ANN index (hnsw/ivfflat): pgvector caps indexable vectors at 2000 dims, below
# text-embedding-3-large's 3072. At table-schema scale (tens of rows) a sequential
# scan with the `<=>` cosine operator is fast enough, so no index is needed.

UPSERT_SQL = f"""
    INSERT INTO {TABLE_NAME} (table_name, content, metadata, embedding, updated_at)
    VALUES ($1, $2, $3::jsonb, $4::vector, now())
    ON CONFLICT (table_name) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding,
        updated_at = now()
"""


def build_searchable_content(table: dict) -> str:
    lines = [f"Table: {table['table_name']}"]
    if table.get("description"):
        lines.append(f"Description: {table['description']}")
    if table.get("primary_key"):
        lines.append(f"Primary Key: {', '.join(table['primary_key'])}")
    if table.get("foreign_keys"):
        fk_parts = [f"{fk['column']} -> {fk['references']['table']}.{fk['references']['column']}" for fk in table["foreign_keys"]]
        lines.append(f"Foreign Keys: {'; '.join(fk_parts)}")

    lines.append("Columns:")
    for col in table["columns"]:
        col_line = f"  - {col['column_name']} ({col['data_type']})"
        if col.get("description"):
            col_line += f": {col['description']}"
        if col.get("unique_values"):
            col_line += f" [sample values: {', '.join(str(v) for v in col['unique_values'][:10])}]"
        lines.append(col_line)

    if table.get("indexes"):
        idx_parts = [f"{idx['index_name']}({', '.join(idx['columns'])})" for idx in table["indexes"]]
        lines.append(f"Indexes: {'; '.join(idx_parts)}")

    return "\n".join(lines)


async def embed_batch(client: AsyncAzureOpenAI, texts: list[str]) -> list[list[float]]:
    response = await client.embeddings.create(model=AZURE_DEPLOYMENT, input=texts)
    return [item.embedding for item in response.data]


async def main():
    tables = json.loads(SCHEMA_PATH.read_text())["tables"]

    client = AsyncAzureOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        api_key=AZURE_API_KEY,
        api_version=AZURE_API_VERSION,
    )

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        await conn.execute(CREATE_TABLE_SQL)

        for i in range(0, len(tables), BATCH_SIZE):
            batch = tables[i : i + BATCH_SIZE]
            contents = [build_searchable_content(t) for t in batch]
            embeddings = await embed_batch(client, contents)

            for table, content, embedding in zip(batch, contents, embeddings):
                vector_literal = "[" + ",".join(str(v) for v in embedding) + "]"
                await conn.execute(
                    UPSERT_SQL,
                    table["table_name"],
                    content,
                    json.dumps(table),
                    vector_literal,
                )
                print(f"Embedded table: {table['table_name']}")
    finally:
        await conn.close()
        await client.close()

    print(f"\nStored embeddings for {len(tables)} tables in '{TABLE_NAME}'")


if __name__ == "__main__":
    asyncio.run(main())
