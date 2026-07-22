// Per-ABU Executive Command data. The CXO's dashboard (dashboard-data.ts) is
// a single enterprise-wide dataset; this file exists so every ABU Head sees
// numbers scoped to their own business unit instead of everyone seeing the
// same figures. Where real per-BU data already exists (BU_LIST, BU_INTELLIGENCE,
// ANOMALIES) it's reused directly; the rest is generated deterministically
// per BU (hashed off the BU id, no Math.random/Date.now) so each ABU has a
// distinct but stable-across-renders series.
import { BU_LIST, BU_INTELLIGENCE, ANOMALIES } from "@/data/enterprise-data";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function s(i: number, offset: number, amp: number, base: number) {
  return base + amp * (Math.sin(i * 0.42 + offset) * 0.5 + 0.5);
}
function round(v: number, d = 0) {
  return parseFloat(v.toFixed(d));
}

const DAYS = Array.from({ length: 30 }, (_, i) => `D${i + 1}`);

function parseMonthlyCost(costStr: string): number {
  // "$148K/mo" -> 148000
  const n = parseFloat(costStr.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 100 : n * 1000;
}

export function abuCostSeries(buId: string): { day: string; Cost: number }[] {
  const bu = BU_LIST.find((b) => b.id === buId);
  const monthly = bu ? parseMonthlyCost(bu.cost) : 100000;
  const daily = monthly / 30;
  const h = hashString(buId);
  return DAYS.map((day, i) => ({
    day,
    Cost: round(s(i, h % 6, daily * 0.35, daily) + i * (daily * 0.01)),
  }));
}

export function abuValueSeries(buId: string): { day: string; Value: number }[] {
  const bu = BU_LIST.find((b) => b.id === buId);
  const base = bu ? bu.hoursSaved * 22 : 40000; // rough $/hr-saved proxy, BU-specific magnitude
  const h = hashString(buId + "value");
  return DAYS.map((day, i) => ({
    day,
    Value: round(s(i, h % 6, base * 0.4, base) + i * (base * 0.02)),
  }));
}

export function abuRevenueSnapshot(buId: string) {
  const bu = BU_LIST.find((b) => b.id === buId);
  const h = hashString(buId + "rev");
  const monthlyBase = bu ? bu.hoursSaved * 30 : 500000;
  const today = Math.round(monthlyBase / 28);
  const quarterly = Math.round(monthlyBase * 2.9);
  const fmt = (n: number) => n >= 1_000_000 ? `$${round(n / 1_000_000, 1)}M` : `$${Math.round(n / 1000)}K`;
  return {
    today: fmt(today),
    todayTrend: `${h % 2 === 0 ? "↑" : "↓"}${2 + (h % 6)}%`,
    monthly: fmt(monthlyBase),
    monthlyTrend: `↑${4 + (h % 9)}%`,
    quarterly: fmt(quarterly),
    quarterlyTrend: `↑${3 + (h % 7)}%`,
  };
}

export function abuStockSnapshot(buId: string) {
  const bu = BU_LIST.find((b) => b.id === buId);
  const h = hashString(buId + "stock");
  const base = bu ? bu.hoursSaved * 8 : 200000;
  const fmt = (n: number) => n >= 1_000_000 ? `$${round(n / 1_000_000, 1)}M` : `$${Math.round(n / 1000)}K`;
  return { value: fmt(base), trend: `${h % 3 === 0 ? "↑" : "↓"}${1 + (h % 5)}%` };
}

export function abuCompliance(buId: string): number {
  const h = hashString(buId + "compliance");
  return 92 + (h % 8); // 92-99%, deterministic per BU
}

export function abuExpenses(buId: string): { today: string; todayTrend: string; monthly: string; monthlyTrend: string } {
  const bu = BU_LIST.find((b) => b.id === buId);
  const monthly = bu ? parseMonthlyCost(bu.cost) : 100000;
  const today = Math.round(monthly / 30);
  const h = hashString(buId + "expenses");
  return {
    today: `$${today.toLocaleString()}`,
    todayTrend: `${h % 2 === 0 ? "↑" : "↓"}${2 + (h % 6)}%`,
    monthly: bu?.cost.replace("/mo", "") ?? `$${monthly.toLocaleString()}`,
    monthlyTrend: `↑${1 + (h % 5)}%`,
  };
}

export function abuTaskCounts(buId: string) {
  const bu = BU_LIST.find((b) => b.id === buId);
  const pending = bu?.openTasks ?? 12;
  const h = hashString(buId + "tasks");
  const done = (bu?.workflows ?? 20) * 4 + (h % 40);
  return { done, pending };
}

export function abuDeptPerf(buId: string): { dept: string; score: number }[] {
  const bu = BU_LIST.find((b) => b.id === buId);
  if (!bu) return [];
  return bu.departments.map((d, i) => {
    const h = hashString(d.id);
    const base = bu.automationPct - 10 + (h % 24);
    return { dept: d.name, score: Math.max(40, Math.min(100, base)) };
  }).sort((a, b) => b.score - a.score);
}

const INSIGHT_STYLE: Record<string, { icon: string; color: string }> = {
  critical: { icon: "⚠", color: "text-red-500" },
  warning: { icon: "⚡", color: "text-amber-500" },
  positive: { icon: "✓", color: "text-emerald-500" },
};

export function abuExecInsights(buId: string): { icon: string; color: string; text: string }[] {
  const intel = BU_INTELLIGENCE[buId];
  if (!intel) return [];
  return intel.insights.map((ins) => ({
    icon: INSIGHT_STYLE[ins.type]?.icon ?? "•",
    color: INSIGHT_STYLE[ins.type]?.color ?? "text-muted-foreground",
    text: ins.title,
  }));
}

export function abuAlerts(buId: string): { severity: "CRITICAL" | "HIGH" | "MEDIUM"; title: string; source: string; time: string }[] {
  const fromAnomalies = ANOMALIES.filter((a) => a.buId === buId).map((a) => ({
    severity: (a.severity === "critical" ? "CRITICAL" : a.severity === "warning" ? "HIGH" : "MEDIUM") as "CRITICAL" | "HIGH" | "MEDIUM",
    title: a.title,
    source: a.context.split(" · ")[0],
    time: a.age,
  }));
  const intel = BU_INTELLIGENCE[buId];
  const fromInsights = (intel?.insights ?? [])
    .filter((i) => i.type === "critical" || i.type === "warning")
    .map((i) => ({
      severity: (i.type === "critical" ? "CRITICAL" : "HIGH") as "CRITICAL" | "HIGH",
      title: i.title,
      source: i.detail.split(" · ")[0],
      time: "Today",
    }));
  return [...fromAnomalies, ...fromInsights];
}
