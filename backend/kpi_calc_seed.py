"""One-off setup for the KPI calculation engine: helper KPIs, dependency links,
raw fact data (business_results), and kpi_definitions rows.

Placeholder formulas — every assumption here (which metric_keys, which
aggregation, which scale) lives only in kpi_definitions and the seeded
business_results rows. Swapping in real formulas later means updating those
two things, not the calc engine or any API/UI code.

Run: python kpi_calc_seed.py
"""

import asyncio
import os

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

COMPANY_ID = "3efa96cb-b1b1-400b-95cb-069c5ea52145"
BU = {
    "production": "4e3add51-0d96-424e-9aa6-9abc061b0d82",
    "quality": "2f89dac9-2bab-402c-baa2-1612c62225c3",
    "supply-chain": "2d7d3cba-c8d4-4fbc-9726-0539f930853c",
    "maintenance": "9cbc0f63-1f24-4a26-9241-bcf320799da9",
    "safety-compliance": "e265e839-3ac6-4707-88d2-734e1ce57ec3",
}
MONTHS = ["2026-04", "2026-05", "2026-06"]

# ─── Raw fact seed data (business_results) ────────────────────────────────
# Each row: (metric_key, label, bu, unit, category, [value per month in MONTHS order])
FACTS = [
    ("units_passed", "Units Passed Without Rework", "quality", "units", "quality", [9640, 9833, 9447]),
    ("total_units", "Total Units Produced", "quality", "units", "quality", [10000, 10200, 9800]),
    ("on_time_shipments", "On-Time Shipments", "supply-chain", "shipments", "efficiency", [813, 854, 772]),
    ("total_shipments", "Total Shipments", "supply-chain", "shipments", "efficiency", [1000, 1050, 950]),
    ("uptime_hours", "Equipment Uptime Hours", "maintenance", "hrs", "efficiency", [824, 824, 824]),
    ("failure_count", "Equipment Failure Count", "maintenance", "count", "efficiency", [2, 2, 2]),
    ("recordable_incidents", "Recordable Safety Incidents", "safety-compliance", "count", "safety", [1, 1, 0]),
    ("hours_worked", "Total Hours Worked", "safety-compliance", "hrs", "safety", [155000, 155000, 155000]),
    ("availability_pct", "Equipment Availability", "production", "%", "efficiency", [93, 93, 93]),
    ("performance_pct", "Production Performance", "production", "%", "efficiency", [95, 94, 96]),
]

# ─── Helper KPIs needed for OEE's composite formula ────────────────────────
HELPER_KPIS = [
    {
        "slug": "equipment-availability",
        "name": "Equipment Availability",
        "abbreviation": "AVAIL",
        "category": "Production",
        "unit": "%",
        "business_unit": "production",
        "formula": "Equipment uptime as a % of scheduled production time",
        "data_source": "business_results (availability_pct)",
    },
    {
        "slug": "production-performance",
        "name": "Production Performance",
        "abbreviation": "PERF",
        "category": "Production",
        "unit": "%",
        "business_unit": "production",
        "formula": "Actual output rate as a % of designed/ideal rate",
        "data_source": "business_results (performance_pct)",
    },
]

# ─── kpi_definitions rows, keyed by kpi slug ───────────────────────────────
DEFINITIONS = {
    "equipment-availability": dict(
        metric_type="simple", numerator_metric_key="availability_pct", numerator_agg="avg",
        scale=1,
    ),
    "production-performance": dict(
        metric_type="simple", numerator_metric_key="performance_pct", numerator_agg="avg",
        scale=1,
    ),
    "first-pass-yield": dict(
        metric_type="ratio",
        numerator_metric_key="units_passed", numerator_agg="sum",
        denominator_metric_key="total_units", denominator_agg="sum",
        scale=100,
    ),
    "otd": dict(
        metric_type="ratio",
        numerator_metric_key="on_time_shipments", numerator_agg="sum",
        denominator_metric_key="total_shipments", denominator_agg="sum",
        scale=100,
    ),
    "mtbf": dict(
        metric_type="ratio",
        numerator_metric_key="uptime_hours", numerator_agg="sum",
        denominator_metric_key="failure_count", denominator_agg="sum",
        scale=1,
    ),
    "trir": dict(
        metric_type="ratio",
        numerator_metric_key="recordable_incidents", numerator_agg="sum",
        denominator_metric_key="hours_worked", denominator_agg="sum",
        scale=200000,
    ),
    # Composite: multiplies Availability x Performance x First Pass Yield (all 0-100
    # percentages) — scale corrects the double percent-of-percent multiplication
    # back down to a single percentage (1 / 100^2).
    "oee": dict(metric_type="composite", composite_operator="multiply", scale=0.0001),
}


async def upsert_helper_kpis(conn) -> dict[str, str]:
    slugs = {}
    for k in HELPER_KPIS:
        existing = await conn.fetchval("SELECT id FROM kpis WHERE company_id = $1 AND slug = $2", COMPANY_ID, k["slug"])
        if existing:
            slugs[k["slug"]] = str(existing)
            print(f"Helper KPI already exists: {k['slug']}")
            continue
        new_id = await conn.fetchval(
            """
            INSERT INTO kpis (company_id, business_unit_id, slug, name, abbreviation, category, value, unit,
                               target, trend, health_score, status, formula, data_source, update_frequency)
            VALUES ($1, $2, $3, $4, $5, $6, 0, $7, 90, 'flat', 0, 'on-track', $8, $9, 'monthly')
            RETURNING id
            """,
            COMPANY_ID, BU[k["business_unit"]], k["slug"], k["name"], k["abbreviation"],
            k["category"], k["unit"], k["formula"], k["data_source"],
        )
        slugs[k["slug"]] = str(new_id)
        print(f"Created helper KPI: {k['slug']} -> {new_id}")
    return slugs


async def link_oee_dependencies(conn, helper_ids: dict[str, str]):
    oee_id = await conn.fetchval("SELECT id FROM kpis WHERE company_id = $1 AND slug = 'oee'", COMPANY_ID)
    fpy_id = await conn.fetchval("SELECT id FROM kpis WHERE company_id = $1 AND slug = 'first-pass-yield'", COMPANY_ID)
    deps = [helper_ids["equipment-availability"], helper_ids["production-performance"], str(fpy_id)]
    for dep_id in deps:
        exists = await conn.fetchval(
            "SELECT 1 FROM kpi_dependencies WHERE kpi_id = $1 AND depends_on_kpi_id = $2", oee_id, dep_id
        )
        if not exists:
            await conn.execute(
                "INSERT INTO kpi_dependencies (kpi_id, depends_on_kpi_id) VALUES ($1, $2)", oee_id, dep_id
            )
    print(f"OEE depends on: {deps}")


async def seed_business_results(conn):
    for metric_key, label, bu, unit, category, values in FACTS:
        for month, value in zip(MONTHS, values):
            await conn.execute(
                """
                INSERT INTO business_results (company_id, business_unit_id, metric, metric_key, value, unit, period, category)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """,
                COMPANY_ID, BU[bu], label, metric_key, value, unit, month, category,
            )
    print(f"Seeded {len(FACTS) * len(MONTHS)} business_results rows")


async def seed_kpi_definitions(conn):
    for slug, defn in DEFINITIONS.items():
        kpi_id = await conn.fetchval("SELECT id FROM kpis WHERE company_id = $1 AND slug = $2", COMPANY_ID, slug)
        if kpi_id is None:
            print(f"WARNING: no kpi found for slug={slug}, skipping definition")
            continue
        await conn.execute(
            """
            INSERT INTO kpi_definitions (kpi_id, metric_type, numerator_metric_key, numerator_agg,
                                          denominator_metric_key, denominator_agg, composite_operator, scale)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (kpi_id) DO UPDATE SET
                metric_type = EXCLUDED.metric_type,
                numerator_metric_key = EXCLUDED.numerator_metric_key,
                numerator_agg = EXCLUDED.numerator_agg,
                denominator_metric_key = EXCLUDED.denominator_metric_key,
                denominator_agg = EXCLUDED.denominator_agg,
                composite_operator = EXCLUDED.composite_operator,
                scale = EXCLUDED.scale
            """,
            kpi_id,
            defn["metric_type"],
            defn.get("numerator_metric_key"),
            defn.get("numerator_agg"),
            defn.get("denominator_metric_key"),
            defn.get("denominator_agg"),
            defn.get("composite_operator"),
            defn["scale"],
        )
    print(f"Seeded {len(DEFINITIONS)} kpi_definitions rows")


async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        helper_ids = await upsert_helper_kpis(conn)
        await link_oee_dependencies(conn, helper_ids)
        await seed_business_results(conn)
        await seed_kpi_definitions(conn)
    finally:
        await conn.close()
    print("\nDone. Next: call POST /api/kpis/recompute-all (or restart the backend) to compute values.")


if __name__ == "__main__":
    asyncio.run(main())
