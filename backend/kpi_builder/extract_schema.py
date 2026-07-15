"""Introspects the onyx_meridian Postgres schema and writes it as a JSON semantic template.

Run: python -m kpi_builder.extract_schema
Output: kpi_builder/schema/onyx_meridian_schema.json
"""

import asyncio
import json
import os
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
DB_NAME = os.environ.get("DB_NAME", "unknown")
OUTPUT_PATH = Path(__file__).parent / "schema" / "onyx_meridian_schema.json"

MAX_UNIQUE_VALUES = 25
SAMPLE_LIMIT = 500
CATEGORICAL_TYPES = {"text", "character varying", "USER-DEFINED", "boolean"}

# kpi_schema_embeddings is this pipeline's own output table — exclude it so we don't
# embed the embeddings store into itself.
EXCLUDED_TABLES = ("kpi_schema_embeddings",)

TABLES_QUERY = """
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name != ALL($1::text[])
    ORDER BY table_name
"""

TABLE_COMMENT_QUERY = "SELECT obj_description(($1)::regclass::oid) AS description"

COLUMNS_QUERY = """
    SELECT
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        col_description(('"' || c.table_schema || '"."' || c.table_name || '"')::regclass::oid, c.ordinal_position) AS description
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = $1
    ORDER BY c.ordinal_position
"""

PRIMARY_KEY_QUERY = """
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY kcu.ordinal_position
"""

FOREIGN_KEY_QUERY = """
    SELECT
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'
"""

INDEX_QUERY = """
    SELECT
        i.relname AS index_name,
        array_agg(a.attname ORDER BY x.n) AS columns,
        ix.indisunique AS is_unique,
        ix.indisprimary AS is_primary
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN unnest(ix.indkey) WITH ORDINALITY AS x(attnum, n) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
    WHERE n.nspname = 'public' AND t.relname = $1
    GROUP BY i.relname, ix.indisunique, ix.indisprimary
    ORDER BY i.relname
"""


def _jsonable(value):
    """asyncpg returns driver-native types (UUID, Decimal, datetime, ...) that json can't serialize directly."""
    if isinstance(value, (UUID, Decimal, datetime, date)):
        return str(value)
    return value


async def fetch_unique_values(conn, table_name: str, column_name: str, data_type: str):
    if data_type not in CATEGORICAL_TYPES:
        return None
    try:
        count = await conn.fetchval(
            f'SELECT COUNT(DISTINCT "{column_name}") '
            f'FROM (SELECT "{column_name}" FROM "{table_name}" LIMIT {SAMPLE_LIMIT}) t'
        )
        if not count or count > MAX_UNIQUE_VALUES:
            return None
        rows = await conn.fetch(
            f'SELECT DISTINCT "{column_name}" FROM "{table_name}" '
            f'WHERE "{column_name}" IS NOT NULL LIMIT {MAX_UNIQUE_VALUES}'
        )
        return [_jsonable(r[0]) for r in rows]
    except Exception:
        return None


async def extract_table(conn, table_name: str) -> dict:
    table_comment = await conn.fetchval(TABLE_COMMENT_QUERY, table_name)
    columns_rows = await conn.fetch(COLUMNS_QUERY, table_name)
    pk_rows = await conn.fetch(PRIMARY_KEY_QUERY, table_name)
    fk_rows = await conn.fetch(FOREIGN_KEY_QUERY, table_name)
    index_rows = await conn.fetch(INDEX_QUERY, table_name)

    columns = []
    for row in columns_rows:
        data_type = row["udt_name"] if row["data_type"] == "USER-DEFINED" else row["data_type"]
        unique_values = await fetch_unique_values(conn, table_name, row["column_name"], row["data_type"])
        column = {
            "column_name": row["column_name"],
            "data_type": data_type,
            "is_nullable": row["is_nullable"] == "YES",
            "description": row["description"],
        }
        if unique_values:
            column["unique_values"] = unique_values
        columns.append(column)

    foreign_keys = [
        {
            "column": r["column_name"],
            "references": {"table": r["referenced_table"], "column": r["referenced_column"]},
        }
        for r in fk_rows
    ]

    indexes = [
        {"index_name": r["index_name"], "columns": list(r["columns"]), "is_unique": r["is_unique"]}
        for r in index_rows
        if not r["is_primary"]
    ]

    return {
        "table_name": table_name,
        "description": table_comment,
        "primary_key": [r["column_name"] for r in pk_rows],
        "foreign_keys": foreign_keys,
        "columns": columns,
        "indexes": indexes,
    }


async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        table_rows = await conn.fetch(TABLES_QUERY, list(EXCLUDED_TABLES))
        tables = []
        for row in table_rows:
            table_name = row["table_name"]
            print(f"Extracting schema for table: {table_name}")
            tables.append(await extract_table(conn, table_name))
    finally:
        await conn.close()

    output = {
        "database": DB_NAME,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "tables": tables,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2, default=str))
    print(f"\nWrote schema for {len(tables)} tables to {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
