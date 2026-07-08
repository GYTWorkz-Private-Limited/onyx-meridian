import { HeaderBar } from "@/components/shared/HeaderBar";
import { LineChart, Line, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, YAxis, CartesianGrid } from "recharts";
import { KpiCard } from "@/components/shared/KpiCard";
import { TrendingUp, Award, Target, ArrowUp, ArrowDown, DollarSign, RefreshCw, Bot, ShieldCheck, UserCheck, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { BU_LIST } from "@/data/enterprise-data";
import { UNIT_OF_WORK_CATALOG, effectivenessFor } from "@/data/unit-of-work-data";

const IMPROVEMENT_STATS = {
  agentsImproved: 4,
  agentsReplaced: 1,
  agentsRetrained: 2,
  violationsPrevented: 18,
  humanOverrides: 7,
  businessValueGenerated: "$3.4M",
};

const IMPROVEMENT_TIMELINE = [
  { month: "Apr", improved: 1, replaced: 0, retrained: 0, violations: 3 },
  { month: "May", improved: 2, replaced: 0, retrained: 1, violations: 5 },
  { month: "Jun", improved: 3, replaced: 1, retrained: 1, violations: 4 },
  { month: "Jul", improved: 4, replaced: 1, retrained: 2, violations: 6 },
];

const AGENT_IMPROVEMENT_LOG = [
  { name: "Deal Closer AI", from: "Learning", to: "Improving", accuracy: "+8%", period: "Jun–Jul", impact: "Revenue close rate +12%" },
  { name: "Maintenance AI", from: "Stable", to: "Improving", accuracy: "+5%", period: "May–Jul", impact: "MTTR reduced by 22%" },
  { name: "Finance Reconciler", from: "Improving", to: "Stable", accuracy: "+3%", period: "Apr–Jun", impact: "Close cycle -2.1 days" },
  { name: "Logistics Optimizer", from: "Stable", to: "Stable", accuracy: "+1%", period: "Ongoing", impact: "$42K/wk route savings" },
  { name: "Contract AI", from: "Degrading", to: "Replacement Recommended", accuracy: "-14%", period: "May–Jul", impact: "Blocked 4 compliance risks" },
];

const METRICS = {
  learningMetrics: { accuracy: 94.2, driftDetection: 2.1, reliability: 97.8, costEfficiency: 91.4, goalCompletion: 88.6 },
  eeiTrend: [
    { date: "2026-04-01", value: 74 }, { date: "2026-04-15", value: 76 }, { date: "2026-05-01", value: 78 },
    { date: "2026-05-15", value: 79 }, { date: "2026-06-01", value: 81 }, { date: "2026-06-15", value: 83 }, { date: "2026-06-26", value: 84 },
  ],
};

const RESULTS = [
  { id: "r1", metric: "Revenue Pipeline Conversion", businessUnit: "Revenue Intelligence",      category: "revenue", value: 1200000, unit: "USD",      change: 12, period: "Jun 2026" },
  { id: "r2", metric: "Invoice Approval Cycle Time",  businessUnit: "Finance Intelligence",     category: "ops",     value: 14,      unit: "% faster", change: 14, period: "Jun 2026" },
  { id: "r3", metric: "OEE Improvement",              businessUnit: "Manufacturing Intelligence", category: "ops",   value: 4.2,     unit: "pts",      change: 5,  period: "Jun 2026" },
  { id: "r4", metric: "Procurement Cost Savings",     businessUnit: "Procurement Intelligence", category: "cost",    value: 920000,  unit: "USD",      change: 9,  period: "Jun 2026" },
  { id: "r5", metric: "Churn Risk Reduction",         businessUnit: "Revenue Intelligence",     category: "ops",     value: 6,       unit: "% fewer",  change: 6,  period: "Jun 2026" },
  { id: "r6", metric: "Route Optimisation Savings",   businessUnit: "Supply Chain Intelligence", category: "cost",   value: 168000,  unit: "USD/mo",   change: 8,  period: "Jun 2026" },
];

export default function Outcomes() {
  const metrics = METRICS;
  const results = RESULTS;

  const buRollup = BU_LIST.map((bu: any) => {
    const uows = UNIT_OF_WORK_CATALOG.filter((u) => u.buId === bu.id);
    const costSavedPerMonth = uows.reduce((s, u) => s + effectivenessFor(u).costSavedPerMonth, 0);
    const hoursSavedPerMonth = uows.reduce((s, u) => s + effectivenessFor(u).hoursSavedPerMonth, 0);
    return { name: bu.name, uowCount: uows.length, annualCostSaved: costSavedPerMonth * 12, hoursSavedPerMonth };
  }).filter((b) => b.uowCount > 0);

  const reconciledAnnual = buRollup.reduce((s, b) => s + b.annualCostSaved, 0);
  const assertedAnnual = 3400000; // IMPROVEMENT_STATS.businessValueGenerated, parsed
  const tracedPct = Math.round((reconciledAnnual / assertedAnnual) * 100);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="LEARNING & OUTCOMES"
        metrics={[
          { label: "AVG ACCURACY", value: metrics.learningMetrics.accuracy },
          { label: "DRIFT RATE", value: metrics.learningMetrics.driftDetection },
          { label: "AGENTS IMPROVED", value: IMPROVEMENT_STATS.agentsImproved },
        ]}
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        <div className="grid grid-cols-3 gap-6">
          {/* North Star Chart */}
          <div className="col-span-2 bg-white border border-border rounded-sm p-6 shadow-sm">
            <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase border-b border-border pb-2 mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> 90-Day Enterprise Execution Index (EEI)
            </h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.eeiTrend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short' })} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                  <RechartsTooltip contentStyle={{ borderRadius: '2px', border: '1px solid #E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Learning Scorecard */}
          <div className="bg-white border border-border rounded-sm p-6 shadow-sm">
            <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase border-b border-border pb-2 mb-4 flex items-center gap-2">
              <Award size={14} /> System Learning Scorecard
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Global Accuracy</span>
                <span className="text-lg font-bold font-mono">{metrics.learningMetrics.accuracy}%</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Reliability Score</span>
                <span className="text-lg font-bold font-mono">{metrics.learningMetrics.reliability}%</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Cost Efficiency</span>
                <span className="text-lg font-bold font-mono text-emerald-600">{metrics.learningMetrics.costEfficiency}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Goal Completion</span>
                <span className="text-lg font-bold font-mono">{metrics.learningMetrics.goalCompletion}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Results Table */}
        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-[#FCFCFD]">
            <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Target size={14} /> Delivered Business Value
            </h2>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">Business Unit</th>
                <th className="px-4 py-3 font-medium">Value Delivered</th>
                <th className="px-4 py-3 font-medium">Change</th>
                <th className="px-4 py-3 font-medium">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{result.metric}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{result.businessUnit}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-lg tabular-nums">
                      {result.category === 'revenue' || result.category === 'cost' ? '$' : ''}
                      {result.category === 'revenue' || result.category === 'cost' ? (result.value / 1000000).toFixed(1) : result.value}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">{result.unit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm inline-flex border border-emerald-100">
                      <ArrowUp size={12} /> {result.change}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{result.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Effectiveness by Unit of Work — bottom-up reconciliation */}
        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-[#FCFCFD] flex items-center justify-between">
            <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Boxes size={14} /> Effectiveness by Unit of Work
            </h2>
            <span className="text-[10px] text-muted-foreground">
              ${(reconciledAnnual / 1_000_000).toFixed(1)}M reconciled vs ${(assertedAnnual / 1_000_000).toFixed(1)}M asserted · {tracedPct}% traceable to Units of Work
            </span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium">Business Unit</th>
                <th className="px-4 py-3 font-medium">Units of Work</th>
                <th className="px-4 py-3 font-medium">Hours Saved / mo</th>
                <th className="px-4 py-3 font-medium">Annual Cost Saved (reconciled)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {buRollup.map((b) => (
                <tr key={b.name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{b.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.uowCount}</td>
                  <td className="px-4 py-3 text-xs font-mono text-foreground">{b.hoursSavedPerMonth.toFixed(0)}h</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-600">${Math.round(b.annualCostSaved).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 bg-muted/20 text-[10px] text-muted-foreground border-t border-border">
            Computed bottom-up from each Unit of Work's manual-vs-automated mapping — this is expected to diverge from the top-line asserted figure above; it's the point of the reconciliation, not a bug.
          </div>
        </div>

        {/* Continuous Improvement Dashboard */}
        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-[#FCFCFD]">
            <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <RefreshCw size={14} /> Continuous Improvement Dashboard
            </h2>
          </div>

          <div className="p-5 space-y-5">
            {/* KPI Grid */}
            <div className="grid grid-cols-6 gap-4">
              {[
                { icon: TrendingUp, label: "Agents Improved", value: IMPROVEMENT_STATS.agentsImproved, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                { icon: RefreshCw, label: "Agents Retrained", value: IMPROVEMENT_STATS.agentsRetrained, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
                { icon: Bot, label: "Agents Replaced", value: IMPROVEMENT_STATS.agentsReplaced, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
                { icon: ShieldCheck, label: "Violations Prevented", value: IMPROVEMENT_STATS.violationsPrevented, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
                { icon: UserCheck, label: "Human Overrides", value: IMPROVEMENT_STATS.humanOverrides, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
                { icon: DollarSign, label: "Business Value", value: IMPROVEMENT_STATS.businessValueGenerated, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={cn("border rounded-sm p-3 text-center", stat.bg)}>
                    <Icon size={16} className={cn("mx-auto mb-1", stat.color)} />
                    <div className={cn("text-xl font-bold font-mono", stat.color)}>{stat.value}</div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5 leading-tight">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Monthly Trend */}
            <div className="grid grid-cols-4 gap-3">
              {IMPROVEMENT_TIMELINE.map((month) => (
                <div key={month.month} className="bg-muted/30 border border-border/60 rounded-sm p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{month.month}</div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Improved", value: month.improved, color: "text-emerald-600" },
                      { label: "Retrained", value: month.retrained, color: "text-blue-600" },
                      { label: "Replaced", value: month.replaced, color: "text-amber-600" },
                      { label: "Violations Prevented", value: month.violations, color: "text-violet-600" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-[9px]">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={cn("font-mono font-bold", item.color)}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Improvement Log */}
            <div className="border border-border rounded-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-muted/40">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Agent Evolution Log — Quarter to Date</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FCFCFD] border-b border-border text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-2 font-medium">Agent</th>
                    <th className="px-4 py-2 font-medium">Status Change</th>
                    <th className="px-4 py-2 font-medium">Accuracy Delta</th>
                    <th className="px-4 py-2 font-medium">Period</th>
                    <th className="px-4 py-2 font-medium">Business Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {AGENT_IMPROVEMENT_LOG.map((entry) => (
                    <tr key={entry.name} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2 font-semibold text-foreground">{entry.name}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-muted-foreground">{entry.from}</span>
                          <ArrowUp size={9} className="text-muted-foreground rotate-90" />
                          <span className={cn("font-semibold",
                            entry.to === "Stable" || entry.to === "Improving" ? "text-emerald-600" :
                            entry.to === "Replacement Recommended" ? "text-red-600" : "text-amber-600"
                          )}>{entry.to}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className={cn("flex items-center gap-0.5 font-mono font-bold text-[10px]",
                          entry.accuracy.startsWith("+") ? "text-emerald-600" : "text-red-600"
                        )}>
                          {entry.accuracy.startsWith("+") ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                          {entry.accuracy}
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono text-muted-foreground">{entry.period}</td>
                      <td className="px-4 py-2 text-muted-foreground">{entry.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
