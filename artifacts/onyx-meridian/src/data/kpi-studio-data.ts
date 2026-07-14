import { KPI_CATALOG, type KpiEntry } from "@/data/enterprise-data";

// ─── Forecast Center ────────────────────────────────────────────
// Deterministic multi-horizon projection derived from a KPI's current
// value + trend direction — no backend, just a plausible extrapolation
// so every KPI has a populated forecast without hand-authoring 200+
// data points.

export interface ForecastPoint {
  horizon: string;
  value: string;
  confidence: number;
}

const HORIZONS: { label: string; step: number; confidence: number }[] = [
  { label: "Next Shift", step: 0.15, confidence: 96 },
  { label: "Tomorrow", step: 0.35, confidence: 93 },
  { label: "Next Week", step: 1, confidence: 88 },
  { label: "Next Month", step: 2.2, confidence: 80 },
  { label: "Quarter", step: 4.5, confidence: 68 },
  { label: "Year", step: 9, confidence: 55 },
];

export function forecastHorizons(kpi: KpiEntry): ForecastPoint[] {
  const match = kpi.value.match(/-?[\d,]+\.?\d*/);
  if (!match) return HORIZONS.map((h) => ({ horizon: h.label, value: kpi.value, confidence: h.confidence }));

  const numStr = match[0];
  const num = parseFloat(numStr.replace(/,/g, ""));
  const prefix = kpi.value.slice(0, match.index);
  const suffix = kpi.value.slice((match.index ?? 0) + numStr.length);
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  const dir = kpi.trend === "up" ? 1 : -1;
  // "Improving" KPIs (health >= 78) keep moving toward target; struggling
  // ones (health < 78) recover a little slower but still trend positive
  // relative to their own direction — mirrors the recovery arc implied by
  // each KPI's aiSummary/rootCauses.
  const magnitude = Math.max(0.15, (100 - kpi.healthScore) / 100) * Math.abs(num) * 0.012;

  return HORIZONS.map((h) => {
    const projected = num + dir * magnitude * h.step;
    const formatted = Math.abs(projected) >= 1000
      ? projected.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
      : projected.toFixed(decimals);
    return { horizon: h.label, value: `${prefix}${formatted}${suffix}`, confidence: h.confidence };
  });
}

// ─── Business Event Timeline ────────────────────────────────────

export type BusinessEventKind =
  | "shutdown" | "maintenance" | "installation" | "supplier" | "erp"
  | "expansion" | "launch" | "strike" | "holiday" | "power";

export interface BusinessEvent {
  id: string;
  kind: BusinessEventKind;
  title: string;
  detail: string;
  buId: string | null;
  date: string;
  impact: "info" | "watch" | "critical";
}

export const BUSINESS_EVENTS: BusinessEvent[] = [
  { id: "ev1", kind: "maintenance", title: "Line 7 Planned Maintenance Window", detail: "4-hour bearing replacement on MX-0441 during shift changeover.", buId: "manufacturing", date: "2026-07-15", impact: "watch" },
  { id: "ev2", kind: "supplier", title: "Tier-1 Supplier Delay — Continuity Risk", detail: "3 flagged vendors extending lead time by up to 18 days.", buId: "procurement", date: "2026-07-13", impact: "critical" },
  { id: "ev3", kind: "erp", title: "ERP Upgrade — Finance Module v4.1", detail: "Scheduled off-hours cutover; close-cycle automation gains expected after.", buId: "finance", date: "2026-07-20", impact: "info" },
  { id: "ev4", kind: "expansion", title: "Warehouse 3 Capacity Expansion", detail: "Additional 40K sq ft coming online to absorb APAC demand surge.", buId: "supply-chain", date: "2026-08-01", impact: "info" },
  { id: "ev5", kind: "launch", title: "New SKU Line Launch — Q3 Product Refresh", detail: "Production ramp begins on Line 4; throughput dip expected week one.", buId: "manufacturing", date: "2026-07-28", impact: "watch" },
  { id: "ev6", kind: "installation", title: "New Vision Inspection Camera Install", detail: "Upgrades Quality Inspector coverage on Lines 5–6.", buId: "manufacturing", date: "2026-07-18", impact: "info" },
  { id: "ev7", kind: "power", title: "Grid Maintenance — Partial Power Reduction", detail: "Utility-scheduled 2-hour reduced-capacity window overnight.", buId: "manufacturing", date: "2026-07-22", impact: "watch" },
  { id: "ev8", kind: "holiday", title: "Regional Holiday — APAC Facilities", detail: "Reduced staffing; automated monitoring coverage only.", buId: "supply-chain", date: "2026-07-25", impact: "info" },
  { id: "ev9", kind: "shutdown", title: "Planned Plant Shutdown — Annual Turnaround", detail: "72-hour full-facility maintenance shutdown, all lines.", buId: "manufacturing", date: "2026-09-05", impact: "critical" },
  { id: "ev10", kind: "strike", title: "Logistics Partner Labor Action (Watch)", detail: "Regional carrier labor dispute could affect outbound lead times.", buId: "supply-chain", date: "2026-07-30", impact: "watch" },
];

// ─── KPI Builder palette ─────────────────────────────────────────

export const BUILDER_METRICS = KPI_CATALOG.map((k) => ({ id: k.id, label: k.abbreviation ?? k.name, sub: k.fullName }));
export const BUILDER_DIMENSIONS = [
  { id: "dim-bu", label: "Business Unit" },
  { id: "dim-category", label: "Category" },
  { id: "dim-time", label: "Time Period" },
  { id: "dim-owner", label: "Owner" },
];
export const BUILDER_OPERATORS = ["+", "-", "×", "÷", "%", "( )"];
export const BUILDER_FUNCTIONS = ["SUM", "AVG", "DELTA", "TARGET_GAP", "MOVING_AVG", "YoY"];
export const BUILDER_TEMPLATES = [
  { id: "tmpl-ratio", label: "Ratio", formula: "SUM(Metric A) ÷ SUM(Metric B)" },
  { id: "tmpl-variance", label: "Variance vs Target", formula: "TARGET_GAP(Metric A)" },
  { id: "tmpl-composite", label: "Weighted Composite", formula: "(Metric A × 0.5) + (Metric B × 0.5)" },
];

// ─── Ask AI canned Q&A seeds (keyword-routed, same technique OnyxCopilot
// already uses for navigation — no live reasoning, just data-backed text) ──

export const ASK_AI_SUGGESTIONS = [
  "Why did OEE decrease?",
  "Which business unit has the highest downtime?",
  "Compare Manufacturing vs Supply Chain health",
  "Predict next month's throughput",
  "Which KPIs threaten the EEI goal?",
  "What's driving Cost per Unit up?",
];
