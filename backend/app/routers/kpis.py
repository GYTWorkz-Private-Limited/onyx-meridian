from fastapi import APIRouter, HTTPException

from ..db import pool
from ..kpi_calc.engine import compute_kpi, recompute_all

router = APIRouter(prefix="/api/kpis", tags=["kpis"])

RESOLVE_ID_QUERY = "SELECT id FROM kpis WHERE id::text = $1 OR external_id = $1 OR slug = $1"

LIST_QUERY = """
    SELECT k.id, k.external_id, k.slug, k.name, k.abbreviation, k.category, k.value, k.unit, k.target,
           k.trend, k.delta, k.variance, k.health_score, k.status, k.formula,
           k.data_source, k.update_frequency, k.forecast_next, k.ai_summary,
           k.business_unit_id, bu.slug AS business_unit_slug, p.name AS owner_name
    FROM kpis k
    JOIN business_units bu ON bu.id = k.business_unit_id
    LEFT JOIN people p ON p.id = k.owner_id
    ORDER BY k.name
"""

DETAIL_QUERY = LIST_QUERY.replace("ORDER BY k.name", "WHERE k.id::text = $1 OR k.external_id = $1 OR k.slug = $1")

DEPENDS_ON_QUERY = "SELECT kpi_id, depends_on_kpi_id FROM kpi_dependencies"
AGENT_LINKS_QUERY = "SELECT kpi_id, agent_id FROM kpi_agent_links"
GOAL_LINKS_QUERY = "SELECT kpi_id, goal_id FROM kpi_goal_links"
BU_LINKS_QUERY = """
    SELECT l.kpi_id, bu.slug
    FROM kpi_business_unit_links l
    JOIN business_units bu ON bu.id = l.business_unit_id
"""
ROOT_CAUSES_QUERY = """
    SELECT kpi_id, cause, confidence
    FROM kpi_root_causes
    ORDER BY sort_order, cause
"""


def _fmt(value, unit: str | None) -> str:
    if value is None:
        return ""
    text = f"{value:g}" if isinstance(value, float) else str(value)
    if not unit:
        return text
    return f"{text}{unit}" if unit == "%" else f"{text} {unit}"


def _shape(row, deps_on: dict, feeds: dict, goals: dict, agents: dict, bu_links: dict, root_causes: dict) -> dict:
    db_id = str(row["id"])
    public_id = row["external_id"] or row["slug"] or db_id
    delta_sign = "+" if row["delta"] is not None and float(row["delta"]) > 0 else ""
    return {
        "id": public_id,
        "name": row["name"],
        "abbreviation": row["abbreviation"],
        "fullName": row["name"],
        "category": row["category"],
        "value": _fmt(row["value"], row["unit"]),
        "target": _fmt(row["target"], row["unit"]),
        "trend": row["trend"],
        "delta": f"{delta_sign}{_fmt(row['delta'], row['unit'])}" if row["delta"] is not None else "",
        "variance": _fmt(row["variance"], row["unit"]),
        "healthScore": float(row["health_score"]),
        "status": row["status"],
        "owner": row["owner_name"] or "Unassigned",
        "buIds": bu_links.get(db_id) or [row["business_unit_slug"]],
        "linked": [str(a) for a in agents.get(db_id, [])],
        "formula": row["formula"] or "",
        "dataSource": row["data_source"] or "",
        "updateFrequency": row["update_frequency"] or "",
        "forecastNext": _fmt(row["forecast_next"], row["unit"]),
        "dependsOn": [str(d) for d in deps_on.get(db_id, [])],
        "feeds": [str(f) for f in feeds.get(db_id, [])],
        "goalIds": [str(g) for g in goals.get(db_id, [])],
        "rootCauses": root_causes.get(db_id, []),
        "aiSummary": row["ai_summary"] or "",
    }


async def _link_maps():
    p = pool()
    dep_rows = await p.fetch(DEPENDS_ON_QUERY)
    agent_rows = await p.fetch(AGENT_LINKS_QUERY)
    goal_rows = await p.fetch(GOAL_LINKS_QUERY)
    bu_rows = await p.fetch(BU_LINKS_QUERY)
    root_rows = await p.fetch(ROOT_CAUSES_QUERY)
    id_rows = await p.fetch("SELECT id, external_id, slug FROM kpis")

    # dependsOn/feeds must carry the same public id (external_id || slug || db id)
    # that every KPI is addressed by elsewhere in this API, not the raw internal uuid.
    public_id = {str(r["id"]): (r["external_id"] or r["slug"] or str(r["id"])) for r in id_rows}

    deps_on: dict[str, list] = {}
    feeds: dict[str, list] = {}
    for r in dep_rows:
        kpi_id, dep_id = str(r["kpi_id"]), str(r["depends_on_kpi_id"])
        deps_on.setdefault(kpi_id, []).append(public_id.get(dep_id, dep_id))
        feeds.setdefault(dep_id, []).append(public_id.get(kpi_id, kpi_id))

    agents: dict[str, list] = {}
    for r in agent_rows:
        agents.setdefault(str(r["kpi_id"]), []).append(r["agent_id"])

    goals: dict[str, list] = {}
    for r in goal_rows:
        goals.setdefault(str(r["kpi_id"]), []).append(r["goal_id"])

    bu_links: dict[str, list[str]] = {}
    for r in bu_rows:
        bu_links.setdefault(str(r["kpi_id"]), []).append(r["slug"])

    root_causes: dict[str, list[dict]] = {}
    for r in root_rows:
        root_causes.setdefault(str(r["kpi_id"]), []).append({
            "cause": r["cause"],
            "confidence": r["confidence"],
        })

    return deps_on, feeds, goals, agents, bu_links, root_causes


@router.get("")
async def list_kpis():
    rows = await pool().fetch(LIST_QUERY)
    deps_on, feeds, goals, agents, bu_links, root_causes = await _link_maps()
    return [_shape(r, deps_on, feeds, goals, agents, bu_links, root_causes) for r in rows]


@router.get("/{kpi_id}")
async def get_kpi(kpi_id: str):
    row = await pool().fetchrow(DETAIL_QUERY, kpi_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    deps_on, feeds, goals, agents, bu_links, root_causes = await _link_maps()
    return _shape(row, deps_on, feeds, goals, agents, bu_links, root_causes)


@router.post("/recompute-all")
async def recompute_all_kpis():
    results = await recompute_all()
    return {"recomputed": len(results), "values": results}


@router.post("/{kpi_id}/recompute")
async def recompute_one_kpi(kpi_id: str):
    real_id = await pool().fetchval(RESOLVE_ID_QUERY, kpi_id)
    if real_id is None:
        raise HTTPException(status_code=404, detail="Not found")
    value = await compute_kpi(str(real_id))
    if value is None:
        raise HTTPException(status_code=400, detail="This KPI has no definition or insufficient data to compute.")
    row = await pool().fetchrow(DETAIL_QUERY, kpi_id)
    deps_on, feeds, goals, agents, bu_links, root_causes = await _link_maps()
    return _shape(row, deps_on, feeds, goals, agents, bu_links, root_causes)
