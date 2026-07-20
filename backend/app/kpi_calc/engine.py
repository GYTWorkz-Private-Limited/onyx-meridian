"""Computes a KPI's value from its kpi_definitions row.

Three metric_type shapes:
- simple: one aggregation (sum/avg/count/latest) over a single business_results
  metric_key, scoped to the KPI's business unit and a trailing period window.
- ratio: two simple aggregations divided (numerator / denominator), then scaled.
- composite: combines the KPI's own kpi_dependencies (other KPIs' current
  values) via multiply or sum, then scaled.

Every placeholder assumption (which metric_key, which aggregation, which scale)
lives in the kpi_definitions row and the seeded business_results data — this
engine has no KPI-specific logic to change when the real formulas arrive.
"""

import re
from datetime import date

from ..db import pool

DEFINITION_QUERY = """
    SELECT metric_type, numerator_metric_key, numerator_agg,
           denominator_metric_key, denominator_agg, composite_operator, scale, period_window
    FROM kpi_definitions
    WHERE kpi_id = $1
"""
KPI_BU_QUERY = "SELECT business_unit_id FROM kpis WHERE id = $1"
DEPENDENCY_IDS_QUERY = "SELECT depends_on_kpi_id FROM kpi_dependencies WHERE kpi_id = $1"
KPI_VALUE_QUERY = "SELECT value FROM kpis WHERE id = $1"
UPDATE_KPI_VALUE_QUERY = "UPDATE kpis SET value = $2 WHERE id = $1"
ALL_KPI_IDS_QUERY = "SELECT kpi_id, metric_type FROM kpi_definitions"

AGG_ROWS_QUERY = """
    SELECT value, period FROM business_results
    WHERE business_unit_id = $1 AND metric_key = $2 AND period = ANY($3::text[])
"""


def _trailing_periods(window: str, as_of: date | None = None) -> list[str]:
    """'last_N_months' -> the N calendar months strictly before the current month."""
    match = re.match(r"last_(\d+)_months?", window)
    n = int(match.group(1)) if match else 3
    today = as_of or date.today()
    periods = []
    year, month = today.year, today.month
    for _ in range(n):
        month -= 1
        if month == 0:
            month, year = 12, year - 1
        periods.append(f"{year:04d}-{month:02d}")
    return periods


def _apply_agg(agg: str, rows: list[tuple[float, str]]) -> float | None:
    values = [float(r["value"]) for r in rows]
    if not values:
        return None
    if agg == "sum":
        return sum(values)
    if agg == "avg":
        return sum(values) / len(values)
    if agg == "count":
        return float(len(values))
    if agg == "latest":
        return float(max(rows, key=lambda r: r["period"])["value"])
    raise ValueError(f"Unknown aggregation: {agg}")


async def _aggregate(business_unit_id: str, metric_key: str, agg: str, periods: list[str]) -> float | None:
    rows = await pool().fetch(AGG_ROWS_QUERY, business_unit_id, metric_key, periods)
    return _apply_agg(agg, rows)


async def compute_kpi(kpi_id: str) -> float | None:
    defn = await pool().fetchrow(DEFINITION_QUERY, kpi_id)
    if defn is None:
        return None

    value: float | None
    if defn["metric_type"] == "composite":
        dep_rows = await pool().fetch(DEPENDENCY_IDS_QUERY, kpi_id)
        dep_values = []
        for r in dep_rows:
            v = await pool().fetchval(KPI_VALUE_QUERY, r["depends_on_kpi_id"])
            if v is not None:
                dep_values.append(float(v))
        if not dep_values:
            value = None
        elif defn["composite_operator"] == "multiply":
            value = 1.0
            for v in dep_values:
                value *= v
        else:  # sum
            value = sum(dep_values)
    else:
        bu_id = await pool().fetchval(KPI_BU_QUERY, kpi_id)
        periods = _trailing_periods(defn["period_window"])
        numerator = await _aggregate(bu_id, defn["numerator_metric_key"], defn["numerator_agg"], periods)
        if defn["metric_type"] == "simple":
            value = numerator
        else:  # ratio
            denominator = await _aggregate(bu_id, defn["denominator_metric_key"], defn["denominator_agg"], periods)
            value = (numerator / denominator) if numerator is not None and denominator else None

    if value is None:
        return None
    value *= float(defn["scale"])
    await pool().execute(UPDATE_KPI_VALUE_QUERY, kpi_id, value)
    return value


async def recompute_all() -> dict[str, float | None]:
    """Non-composite KPIs first, so composite KPIs read fresh dependency values."""
    rows = await pool().fetch(ALL_KPI_IDS_QUERY)
    ordered = sorted(rows, key=lambda r: r["metric_type"] == "composite")
    results: dict[str, float | None] = {}
    for r in ordered:
        results[str(r["kpi_id"])] = await compute_kpi(str(r["kpi_id"]))
    return results
