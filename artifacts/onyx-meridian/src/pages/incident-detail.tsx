import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Clock, Activity, User, Bot,
  Shield, FileText, History, BookOpen, MessageSquare, GitBranch,
  TrendingDown, TrendingUp, Zap, Target, BarChart2, Send,
  ChevronRight, ExternalLink, ArrowUpRight, ArrowDownRight,
  Cpu, Database, Radio, Package, Truck, DollarSign, Users,
  Wrench, Factory, ShoppingCart, BarChart3, PieChart
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, CartesianGrid, Legend
} from "recharts";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { INCIDENT_DATA, IncidentDetail, ManufacturingMetrics, ProcurementMetrics, SupplyChainMetrics, RevenueMetrics } from "@/data/incident-data";

const SEVERITY_STYLES = {
  critical: { badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", ring: "ring-red-200", bar: "bg-red-500", label: "CRITICAL" },
  warning:  { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", ring: "ring-amber-200", bar: "bg-amber-500", label: "WARNING" },
  watch:    { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400", ring: "ring-blue-200", bar: "bg-blue-400", label: "WATCH" },
};

const STATUS_STYLES = {
  "open":        "bg-red-50 text-red-700 border-red-200",
  "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
  "escalated":   "bg-violet-50 text-violet-700 border-violet-200",
};

const PRIORITY_STYLES = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high:     "bg-amber-50 text-amber-700 border-amber-200",
  medium:   "bg-blue-50 text-blue-700 border-blue-200",
};

const TIMELINE_STYLES = {
  detection:  { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Radio },
  escalation: { color: "text-red-600",   bg: "bg-red-50 border-red-200",     icon: AlertTriangle },
  action:     { color: "text-primary",   bg: "bg-primary/10 border-primary/20", icon: Zap },
  resolution: { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  system:     { color: "text-muted-foreground", bg: "bg-muted border-border",  icon: Cpu },
};

function MetricCard({ label, value, sub, color = "default", tooltip }: {
  label: string; value: string; sub?: string; color?: "red" | "amber" | "blue" | "emerald" | "default"; tooltip?: string;
}) {
  const colorMap = {
    red:     "border-l-red-500 bg-red-50/30",
    amber:   "border-l-amber-500 bg-amber-50/30",
    blue:    "border-l-blue-500 bg-blue-50/30",
    emerald: "border-l-emerald-500 bg-emerald-50/30",
    default: "border-l-border bg-white",
  };
  const valueColorMap = {
    red: "text-red-700", amber: "text-amber-700", blue: "text-blue-700", emerald: "text-emerald-700", default: "text-foreground"
  };
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <div className={cn("border border-border border-l-2 rounded-sm p-3 cursor-default", colorMap[color])}>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">{label}</div>
          <div className={cn("text-sm font-bold font-mono", valueColorMap[color])}>{value}</div>
          {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </TooltipTrigger>
      {tooltip && <TooltipContent><p className="text-xs max-w-[200px]">{tooltip}</p></TooltipContent>}
    </UITooltip>
  );
}

function KpiRow({ name, current, target, delta, trend, critical, history }: IncidentDetail["affectedKpis"][0]) {
  const isDown = trend === "down";
  const isBad = (isDown && delta.startsWith("-")) || (!isDown && delta.startsWith("+"));
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-border last:border-0 group hover:bg-muted/30 px-3 rounded-sm transition-colors">
      <div className="w-4 flex-shrink-0">
        {critical && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      </div>
      <div className="w-36 flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">{name}</span>
      </div>
      <div className="w-24 font-mono text-sm text-foreground font-semibold">{current}</div>
      <div className="w-24 font-mono text-sm text-muted-foreground">{target}</div>
      <div className={cn("w-24 flex items-center gap-1 text-xs font-mono font-semibold", isBad ? "text-red-600" : "text-emerald-600")}>
        {isBad ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
        {delta}
      </div>
      <div className="flex-1 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history.map((v, i) => ({ v, i }))}>
            <Line type="monotone" dataKey="v" stroke={isBad ? "#ef4444" : "#10b981"} strokeWidth={1.5} dot={false} />
            <Tooltip
              content={({ active, payload }) => active && payload?.length ? (
                <div className="bg-white border border-border rounded-sm px-2 py-1 text-xs font-mono shadow-sm">
                  {payload[0].value}
                </div>
              ) : null}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WorkflowStep({ label, status }: { label: string; status: "done" | "active" | "pending" }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 border", {
        "bg-emerald-500 border-emerald-500 text-white": status === "done",
        "bg-primary border-primary text-white ring-2 ring-primary/30": status === "active",
        "bg-white border-border text-muted-foreground": status === "pending",
      })}>
        {status === "done" ? <CheckCircle2 size={11} /> : status === "active" ? <Activity size={10} className="animate-pulse" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />}
      </div>
      <span className={cn("text-xs", {
        "text-foreground font-medium": status === "done",
        "text-primary font-semibold": status === "active",
        "text-muted-foreground": status === "pending",
      })}>{label}</span>
    </div>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={13} className="text-muted-foreground" />}
      <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{children}</span>
    </div>
  );
}

function EvidenceLog({ log }: { log: IncidentDetail["evidence"]["logs"][0] }) {
  const levelColor = { error: "text-red-600 bg-red-50 border-red-200", warn: "text-amber-600 bg-amber-50 border-amber-200", info: "text-blue-600 bg-blue-50 border-blue-200" };
  return (
    <div className="font-mono text-[10px] py-1.5 px-3 border-b border-border/60 last:border-0 hover:bg-muted/30 flex gap-3 items-start">
      <span className="text-muted-foreground shrink-0 w-16">{log.timestamp}</span>
      <span className={cn("shrink-0 px-1 rounded-sm border text-[9px] font-bold uppercase", levelColor[log.level])}>{log.level}</span>
      <span className="text-primary/70 shrink-0 max-w-[140px] truncate">{log.source}</span>
      <span className="text-foreground leading-tight">{log.message}</span>
    </div>
  );
}

function ActionButton({ label, variant = "default", onClick, done = false, icon: Icon }: {
  label: string; variant?: "default" | "outline" | "destructive" | "ghost"; onClick?: () => void; done?: boolean; icon?: React.ComponentType<{ size?: number }>;
}) {
  if (done) return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-sm font-semibold">
      <CheckCircle2 size={11} /> Done
    </span>
  );
  const styles: Record<string, string> = {
    default: "bg-[#1A1A2E] text-white hover:bg-black",
    outline: "bg-white text-foreground border border-border hover:border-primary/40 hover:text-primary",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent",
  };
  return (
    <button onClick={onClick} className={cn("flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-sm transition-colors", styles[variant])}>
      {Icon && <Icon size={10} />}
      {label}
    </button>
  );
}

// ─── Domain-specific Analytics ──────────────────────────────────────────────

function ManufacturingAnalytics({ metrics }: { metrics: ManufacturingMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="OEE" value={`${metrics.oee.current}%`} sub={`Target: ${metrics.oee.target}%`} color="amber" tooltip="Overall Equipment Effectiveness — availability × performance × quality" />
        <MetricCard label="Uptime" value={`${metrics.uptime.current}%`} sub={`Target: ${metrics.uptime.target}%`} color="amber" />
        <MetricCard label="Throughput" value={`${metrics.throughput.current.toLocaleString()} ${metrics.throughput.unit}`} sub={`Target: ${metrics.throughput.target.toLocaleString()}`} color="red" />
        <MetricCard label="Yield Rate" value={`${metrics.quality.yieldRate}%`} sub={`Scrap: ${metrics.quality.scrapRate}%`} color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={Activity}>OEE + Throughput Trend</SectionTitle>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.oee.history.map((v, i) => ({ i, oee: v, throughput: metrics.throughput.history[i] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="i" tick={false} />
                <YAxis yAxisId="left" domain={[75, 95]} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[2400, 3100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Line yAxisId="left" type="monotone" dataKey="oee" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="OEE %" />
                <Line yAxisId="right" type="monotone" dataKey="throughput" stroke="#f59e0b" strokeWidth={2} dot={false} name="Throughput u/hr" />
                <Legend iconType="line" wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={BarChart2}>Shift Performance Comparison</SectionTitle>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.shiftTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="shift" tick={{ fontSize: 9 }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Bar dataKey="oee" fill="hsl(var(--primary))" name="OEE %" radius={[2, 2, 0, 0]} />
                <Bar dataKey="quality" fill="#10b981" name="Quality %" radius={[2, 2, 0, 0]} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-sm p-4">
        <SectionTitle icon={Radio}>Machine Telemetry — Real-time Sensor Status</SectionTitle>
        <div className="space-y-2">
          {metrics.telemetry.map((s) => {
            const pct = Math.min(100, (s.value / s.threshold) * 100);
            const statusColor = s.status === "critical" ? "bg-red-500" : s.status === "warning" ? "bg-amber-500" : "bg-emerald-500";
            const trackColor = s.status === "critical" ? "bg-red-100" : s.status === "warning" ? "bg-amber-100" : "bg-emerald-100";
            return (
              <div key={s.id + s.sensor} className="flex items-center gap-4 py-1.5 border-b border-border/60 last:border-0">
                <div className="w-40 shrink-0">
                  <div className="text-xs font-semibold text-foreground">{s.sensor}</div>
                  <div className="text-[9px] text-muted-foreground font-mono">{s.id}</div>
                </div>
                <div className="flex-1">
                  <div className={cn("h-2 rounded-full", trackColor)}>
                    <div className={cn("h-2 rounded-full transition-all", statusColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="font-mono text-xs font-bold text-foreground">{s.value} {s.unit}</span>
                </div>
                <div className="w-24 text-right text-[10px] text-muted-foreground font-mono">thresh: {s.threshold} {s.unit}</div>
                <div className="w-16 text-right">
                  <span className="font-mono text-[10px] text-amber-600">{s.sigma}σ</span>
                </div>
                <div className={cn("w-16 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border text-center", {
                  "bg-red-50 text-red-700 border-red-200": s.status === "critical",
                  "bg-amber-50 text-amber-700 border-amber-200": s.status === "warning",
                  "bg-emerald-50 text-emerald-700 border-emerald-200": s.status === "normal",
                })}>{s.status}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={Wrench}>Predictive Maintenance Intelligence</SectionTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-xs text-muted-foreground">Next Failure ETA</span>
              <span className="font-mono text-sm font-bold text-red-600">{metrics.predictiveMaintenance.nextFailureHours} hrs</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-xs text-muted-foreground">Failure Confidence</span>
              <span className="font-mono text-sm font-bold text-amber-600">{metrics.predictiveMaintenance.confidence}%</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-xs text-muted-foreground">Last Maintenance</span>
              <span className="font-mono text-xs text-foreground">{metrics.predictiveMaintenance.lastMaintenance}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-xs text-muted-foreground">MTBF (current)</span>
              <span className="font-mono text-xs text-foreground">{metrics.predictiveMaintenance.mtbf}</span>
            </div>
            <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded-sm">
              <div className="text-[9px] uppercase tracking-widest text-primary font-bold mb-1">AI Recommendation</div>
              <p className="text-[10px] text-foreground leading-snug">{metrics.predictiveMaintenance.recommendation}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={Factory}>Production Impact Assessment</SectionTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-xs text-muted-foreground">Units at Risk</span>
              <span className="font-mono text-sm font-bold text-red-600">{metrics.productionImpact.unitsAtRisk.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-xs text-muted-foreground">Revenue at Risk</span>
              <span className="font-mono text-sm font-bold text-red-600">{metrics.productionImpact.revenueAtRisk}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-xs text-muted-foreground">Lines Affected</span>
              <span className="font-mono text-sm font-bold text-amber-600">{metrics.productionImpact.linesAffected}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted-foreground">Shifts Impacted</span>
              <span className="font-mono text-sm font-bold text-amber-600">{metrics.productionImpact.shiftsImpacted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcurementAnalytics({ metrics }: { metrics: ProcurementMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Spend at Risk" value={metrics.spend.atRisk} color="red" tooltip="Total open PO value with at-risk vendors" />
        <MetricCard label="Days of Supply" value={`${metrics.inventory.daysOfSupply} days`} sub={`Reorder: ${metrics.inventory.reorderPoint} days`} color="amber" />
        <MetricCard label="Critical SKUs" value={`${metrics.inventory.criticalSkus}`} sub={`Coverage gap: ${metrics.inventory.coverageGap}`} color="red" />
        <MetricCard label="Alt. Readiness" value={`${metrics.sourcingRisk.alternateReadiness}%`} sub="Qualified alt. suppliers" color="amber" />
      </div>

      <div className="bg-white border border-border rounded-sm p-4">
        <SectionTitle icon={Users}>Supplier Health Dashboard</SectionTitle>
        <div className="space-y-2">
          {metrics.supplierHealth.map((s) => {
            const riskColor = { critical: "text-red-700 bg-red-50 border-red-200", high: "text-amber-700 bg-amber-50 border-amber-200", medium: "text-blue-700 bg-blue-50 border-blue-200", low: "text-emerald-700 bg-emerald-50 border-emerald-200" };
            const barColor = { critical: "bg-red-500", high: "bg-amber-500", medium: "bg-blue-400", low: "bg-emerald-500" };
            return (
              <div key={s.name} className="flex items-center gap-4 py-2 border-b border-border/60 last:border-0">
                <div className="w-40 shrink-0">
                  <div className="text-xs font-semibold text-foreground">{s.name}</div>
                  <div className="text-[9px] text-muted-foreground">Tier {s.tier} · {s.country}</div>
                </div>
                <div className="flex-1">
                  <div className="bg-muted h-2 rounded-full">
                    <div className={cn("h-2 rounded-full", barColor[s.risk])} style={{ width: `${s.score}%` }} />
                  </div>
                </div>
                <div className="w-16 text-right font-mono text-sm font-bold text-foreground">{s.score}/100</div>
                <div className="w-20 text-right text-[10px] text-muted-foreground">{s.spend}</div>
                <div className="w-12 text-center text-[9px] text-muted-foreground">{s.alternatives} alt.</div>
                <div className={cn("w-16 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border text-center", riskColor[s.risk])}>{s.risk}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={ShoppingCart}>Open Purchase Orders at Risk</SectionTitle>
          <div className="space-y-2">
            {metrics.purchaseOrders.map((po) => {
              const riskColor = { high: "border-l-red-500", medium: "border-l-amber-500", low: "border-l-emerald-500" };
              const statusColor = { "At Risk": "text-red-700 bg-red-50 border-red-200", "Delayed": "text-amber-700 bg-amber-50 border-amber-200", "Suspended": "text-violet-700 bg-violet-50 border-violet-200" };
              return (
                <UITooltip key={po.poId}>
                  <TooltipTrigger asChild>
                    <div className={cn("flex items-center gap-3 py-1.5 px-2 border-l-2 border border-border rounded-sm", riskColor[po.risk])}>
                      <div className="flex-1">
                        <div className="text-[10px] font-mono text-muted-foreground">{po.poId}</div>
                        <div className="text-xs font-semibold text-foreground">{po.supplier}</div>
                      </div>
                      <div className="font-mono text-sm font-bold text-foreground">{po.value}</div>
                      <div className="text-[9px] text-muted-foreground">{po.daysOpen}d open</div>
                      <div className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", (statusColor as any)[po.status] ?? "bg-muted text-muted-foreground border-border")}>{po.status}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">{po.supplier} · {po.value} · Open {po.daysOpen} days</p></TooltipContent>
                </UITooltip>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={BarChart2}>Monthly Spend vs Budget</SectionTitle>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.spendTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                <Bar dataKey="budget" fill="#e2e8f0" name="Budget" radius={[2, 2, 0, 0]} />
                <Bar dataKey="spend" fill="hsl(var(--primary))" name="Actual Spend" radius={[2, 2, 0, 0]} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-sm p-4">
        <SectionTitle icon={Clock}>Lead Time Analysis by Category</SectionTitle>
        <div className="space-y-3">
          {metrics.leadTimes.map((l) => {
            const pct = (l.current / (l.current + l.delta)) * 100;
            const excessPct = 100 - pct;
            return (
              <div key={l.category} className="flex items-center gap-4">
                <div className="w-36 shrink-0 text-xs font-semibold text-foreground">{l.category}</div>
                <div className="flex-1 flex items-center gap-1 h-5">
                  <div className="bg-primary/20 h-full rounded-l-sm" style={{ width: `${pct}%` }} title={`Target: ${l.target} days`} />
                  <div className="bg-red-400 h-full rounded-r-sm" style={{ width: `${excessPct}%` }} title={`Overrun: +${l.delta} days`} />
                </div>
                <div className="w-32 text-right font-mono text-xs">
                  <span className="text-foreground font-bold">{l.current} days</span>
                  <span className="text-muted-foreground ml-1">(target: {l.target})</span>
                </div>
                <div className="w-16 text-right font-mono text-xs text-red-600 font-bold">+{l.delta}d</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SupplyChainAnalytics({ metrics }: { metrics: SupplyChainMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="OTIF Rate" value={`${metrics.otif.current}%`} sub={`Target: ${metrics.otif.target}%`} color="amber" tooltip="On-Time In-Full delivery rate" />
        <MetricCard label="Fill Rate" value={`${metrics.fulfillment.fillRate}%`} sub={`Backlog: ${metrics.fulfillment.orderBacklog} orders`} color="amber" />
        <MetricCard label="Warehouse Utilization" value={`${metrics.warehouse.utilization}%`} sub={`Accuracy: ${metrics.warehouse.accuracy}%`} color="blue" />
        <MetricCard label="Late Shipments" value={`${metrics.transport.lateShipments}`} sub={`Carrier score: ${metrics.transport.carrierScore}/100`} color="red" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={Activity}>OTIF + Fill Rate Trend</SectionTitle>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.inventoryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" domain={[80, 100]} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[5, 12]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="turns" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Inv. Turns" />
                <Line yAxisId="left" type="monotone" dataKey="fill" stroke="#10b981" strokeWidth={2} dot={false} name="Fill Rate %" />
                <Legend iconType="line" wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={Package}>Inventory Status by SKU</SectionTitle>
          <div className="space-y-2">
            {metrics.inventory.map((item) => {
              const statusColor = { critical: "text-red-700 bg-red-50 border-red-200", warning: "text-amber-700 bg-amber-50 border-amber-200", ok: "text-emerald-700 bg-emerald-50 border-emerald-200" };
              const pct = Math.min(100, (item.daysOfSupply / item.reorderPoint) * 100);
              const barColor = { critical: "bg-red-500", warning: "bg-amber-500", ok: "bg-emerald-500" };
              return (
                <div key={item.sku} className="flex items-center gap-3 py-1.5 border-b border-border/60 last:border-0">
                  <div className="w-20 shrink-0">
                    <div className="text-xs font-mono font-bold text-foreground">{item.sku}</div>
                    <div className="text-[9px] text-muted-foreground">{item.location}</div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted h-2 rounded-full">
                      <div className={cn("h-2 rounded-full", barColor[item.status])} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold text-foreground w-16 text-right">{item.daysOfSupply}d</div>
                  <div className="text-[9px] text-muted-foreground w-20 text-right">reorder: {item.reorderPoint}d</div>
                  <div className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border w-16 text-center", statusColor[item.status])}>{item.status}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-sm p-4">
        <SectionTitle icon={Truck}>Logistics Route Status</SectionTitle>
        <div className="space-y-2">
          {metrics.logistics.map((r) => {
            const statusColor = { "on-track": "text-emerald-700 bg-emerald-50 border-emerald-200", "delayed": "text-red-700 bg-red-50 border-red-200", "at-risk": "text-amber-700 bg-amber-50 border-amber-200" };
            return (
              <div key={r.route} className="flex items-center gap-4 py-2 border-b border-border/60 last:border-0">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground">{r.route}</div>
                  <div className="text-[9px] text-muted-foreground">{r.carrier}</div>
                </div>
                <div className="w-24">
                  <div className="bg-muted h-1.5 rounded-full">
                    <div className={cn("h-1.5 rounded-full", r.status === "on-track" ? "bg-emerald-500" : r.status === "at-risk" ? "bg-amber-500" : "bg-red-400")} style={{ width: `${r.onTime}%` }} />
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-foreground w-16 text-right">{r.onTime}% OT</div>
                <div className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border w-20 text-center", statusColor[r.status])}>{r.status}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RevenueAnalytics({ metrics }: { metrics: RevenueMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Pipeline at Risk" value={metrics.pipeline.atRisk} color="red" tooltip="APAC enterprise pipeline with elevated churn/stall risk" />
        <MetricCard label="Q3 Forecast Gap" value={metrics.forecast.gap} color="red" sub={`Confidence: ${metrics.forecast.confidence}%`} />
        <MetricCard label="Conversion Rate" value={`${metrics.pipeline.conversionRate}%`} sub="Target: 25%" color="amber" />
        <MetricCard label="Churn Risk Accounts" value={`${metrics.orders.churnRisk}`} sub="Enterprise accounts" color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={BarChart2}>Pipeline by Stage</SectionTitle>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.pipeline.stages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Deals" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={Activity}>Pipeline vs Conversion Trend</SectionTitle>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.pipelineTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}M`} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} formatter={(v: number) => `$${v}M`} />
                <Line type="monotone" dataKey="pipeline" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Pipeline $M" />
                <Line type="monotone" dataKey="converted" stroke="#10b981" strokeWidth={2} dot={false} name="Converted $M" />
                <Legend iconType="line" wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-sm p-4">
        <SectionTitle icon={Users}>Customer Segment Health</SectionTitle>
        <div className="space-y-2">
          {metrics.customers.map((c) => {
            const riskColor = c.churnRisk > 5 ? "text-red-700 bg-red-50 border-red-200" : c.churnRisk > 2 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200";
            return (
              <div key={c.segment} className="flex items-center gap-4 py-2 border-b border-border/60 last:border-0">
                <div className="w-24 shrink-0 text-xs font-semibold text-foreground">{c.segment}</div>
                <div className="w-12 text-center text-xs text-muted-foreground">{c.count} accts</div>
                <div className="font-mono text-sm font-bold text-foreground w-20">{c.revenue}</div>
                <div className="flex-1">
                  <div className="bg-muted h-1.5 rounded-full">
                    <div className="bg-primary/60 h-1.5 rounded-full" style={{ width: `${c.nps}%` }} />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground w-16 text-right">NPS: {c.nps}</div>
                <div className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border w-20 text-center", riskColor)}>
                  {c.churnRisk} at risk
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-border rounded-sm p-4">
        <SectionTitle icon={TrendingDown}>Q3 Revenue Forecast</SectionTitle>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.forecast.trend.map((v, i) => ({ i, forecast: v, target: parseFloat(metrics.forecast.q3Target.replace("$", "").replace("M", "")) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="i" tick={false} />
              <YAxis domain={[14, 20]} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}M`} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} formatter={(v: number) => `$${v.toFixed(1)}M`} />
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} name="Forecast $M" />
              <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1.5} dot={false} name="Q3 Target" />
              <Legend iconType="line" wrapperStyle={{ fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addWorkflow } = useAppContext();
  const [actionedItems, setActionedItems] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<IncidentDetail["comments"]>([]);

  const incident = INCIDENT_DATA[params.id];

  if (!incident) {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FA]">
        <HeaderBar moduleName="INCIDENT DETAIL" />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Incident not found.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/")}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const sev = SEVERITY_STYLES[incident.severity];
  const allComments = [...incident.comments, ...comments];

  function handleAction(actionId: string, label: string) {
    if (actionedItems.has(actionId)) return;
    setActionedItems(prev => { const n = new Set(prev); n.add(actionId); return n; });
    toast({ title: "Action Initiated", description: `"${label}" has been triggered.` });
  }

  function handleCreateMission() {
    const wf = addWorkflow(incident.activeWorkflow.name, incident.assignedAgents[0]?.name ?? "AI Agent", incident.title);
    toast({ title: "Mission Created", description: `"${incident.activeWorkflow.name}" is now running.` });
    setTimeout(() => navigate(`/workflow/${wf.id}`), 600);
  }

  function handleSubmitComment() {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: `uc-${Date.now()}`,
      author: "You",
      role: "Operations",
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC",
      text: newComment.trim(),
      isAI: false,
    }]);
    setNewComment("");
    toast({ title: "Comment Added", description: "Your comment has been posted to the incident thread." });
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="INCIDENT DETAIL"
        metrics={[
          { label: "INCIDENT ID", value: incident.incidentId },
          { label: "CONFIDENCE", value: `${incident.confidence}%` },
          { label: "RESOLUTION", value: `${incident.resolution.progress}%` },
        ]}
      />

      <div className="p-6 max-w-[1240px] mx-auto w-full">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Live Intelligence
        </button>

        {/* ── Incident Header Card ───────────────────────────────── */}
        <div className="bg-white border border-border rounded-sm shadow-sm p-5 mb-5">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold", sev.badge)}>
                  {sev.label}
                </span>
                <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold", STATUS_STYLES[incident.resolution.status])}>
                  {incident.resolution.status}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-sm">{incident.incidentId}</span>
                <span className="text-[9px] text-muted-foreground">{incident.timestamp}</span>
              </div>
              <h1 className="text-xl font-bold text-foreground mb-1">{incident.title}</h1>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed max-w-3xl">{incident.summary}</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Bot size={11} /> {incident.affectedAgent}</span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1"><Target size={11} /> {incident.affectedDepartment}</span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1"><Shield size={11} /> {incident.confidence}% confidence</span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1"><User size={11} /> Owner: {incident.resolution.owner}</span>
              </div>
            </div>

            {/* Resolution progress */}
            <div className="w-52 shrink-0">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Resolution Progress</div>
              <div className="text-2xl font-bold font-mono text-foreground mb-1">{incident.resolution.progress}%</div>
              <div className="bg-muted h-2 rounded-full mb-2">
                <div className={cn("h-2 rounded-full", sev.bar)} style={{ width: `${incident.resolution.progress}%` }} />
              </div>
              <div className="text-[9px] text-muted-foreground mb-3">ETA: <span className="font-semibold text-foreground">{incident.resolution.eta}</span></div>
              <div className="space-y-1.5">
                {incident.resolution.steps.slice(0, 4).map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
                    {s.done
                      ? <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                      : <div className="w-2.5 h-2.5 rounded-full border border-border shrink-0" />
                    }
                    <span className={s.done ? "text-emerald-700 line-through" : "text-muted-foreground"}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border flex-wrap">
            <ActionButton label="Assign" variant="outline" icon={User} onClick={() => handleAction("assign", "Assign Incident")} done={actionedItems.has("assign")} />
            <ActionButton label="Escalate" variant="outline" icon={AlertTriangle} onClick={() => handleAction("escalate", "Escalate Incident")} done={actionedItems.has("escalate")} />
            <ActionButton label="Resolve" variant="outline" icon={CheckCircle2} onClick={() => handleAction("resolve", "Mark as Resolved")} done={actionedItems.has("resolve")} />
            <ActionButton label="Create Mission" variant="default" icon={Zap} onClick={handleCreateMission} />
            <ActionButton label="Create Approval" variant="outline" icon={Shield} onClick={() => { navigate("/approvals"); }} />
            <ActionButton label="View Agent" variant="ghost" icon={Bot} onClick={() => navigate("/workforce")} />
            <ActionButton label="View Workflow" variant="ghost" icon={GitBranch} onClick={() => navigate(`/agentops`)} />
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-5 bg-white border border-border p-1 rounded-sm h-auto">
            {["Overview", "Workflow & Team", "Action Items", "Evidence", "Timeline", "Analytics"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}
                className="py-2 text-[10px] uppercase tracking-widest font-semibold rounded-sm data-[state=active]:bg-primary/5 data-[state=active]:text-primary"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
          <TabsContent value="overview" className="m-0 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Root Cause */}
              <div className="col-span-2 bg-white border border-border rounded-sm p-4">
                <SectionTitle icon={Activity}>Root Cause Analysis</SectionTitle>
                <div className="p-3 bg-red-50/60 border border-red-200 rounded-sm mb-3">
                  <div className="text-[9px] uppercase tracking-widest text-red-600 font-bold mb-1">Primary Cause</div>
                  <p className="text-xs text-foreground leading-relaxed">{incident.rootCause.primary}</p>
                </div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Contributing Factors</div>
                <div className="space-y-1.5">
                  {incident.rootCause.contributing.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <ChevronRight size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                      <span className="leading-snug">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Classification: </span>
                  <span className="text-[10px] font-semibold text-primary">{incident.rootCause.classification}</span>
                </div>
              </div>

              {/* Risk Prediction */}
              <div className="bg-white border border-border rounded-sm p-4">
                <SectionTitle icon={Target}>Risk Prediction</SectionTitle>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold font-mono text-red-600 mb-1">{incident.riskPrediction.probability}%</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Failure Probability</div>
                  <div className="text-xs text-muted-foreground mt-1">Impact in: <span className="font-semibold text-foreground">{incident.riskPrediction.timeToImpact}</span></div>
                </div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Risk Factors</div>
                <div className="space-y-2">
                  {incident.riskPrediction.factors.map((f) => (
                    <div key={f.factor}>
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-foreground leading-snug">{f.factor}</span>
                        <span className="font-mono text-muted-foreground">{f.weight}%</span>
                      </div>
                      <div className="bg-muted h-1.5 rounded-full">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${f.weight * 2.5}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-muted rounded-sm">
                  <p className="text-[10px] text-muted-foreground leading-snug">{incident.riskPrediction.impact}</p>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="bg-white border border-primary/20 rounded-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SectionTitle icon={undefined}>AI Recommendation</SectionTitle>
                    <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-bold ml-1">{incident.aiRecommendation.confidence}% CONF</span>
                  </div>
                  <p className="text-sm text-foreground font-medium leading-relaxed mb-3">{incident.aiRecommendation.primary}</p>
                  <div className="text-[10px] text-muted-foreground leading-relaxed mb-3">{incident.aiRecommendation.rationale}</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Alternative Approaches</div>
                  <div className="space-y-1">
                    {incident.aiRecommendation.alternatives.map((alt, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-[9px] text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                        <span className="leading-snug">{alt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Affected KPIs */}
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={BarChart2}>Affected KPIs — Current vs Target</SectionTitle>
              <div className="flex items-center gap-4 py-1.5 px-3 mb-1 border-b border-border">
                <div className="w-4 shrink-0" />
                <div className="w-36 shrink-0 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">KPI</div>
                <div className="w-24 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Current</div>
                <div className="w-24 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Target</div>
                <div className="w-24 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Delta</div>
                <div className="flex-1 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">30-day Trend</div>
              </div>
              {incident.affectedKpis.map((kpi) => <KpiRow key={kpi.name} {...kpi} />)}
            </div>

            {/* Business Impact */}
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={DollarSign}>Business Impact</SectionTitle>
              <div className="grid grid-cols-5 gap-3">
                <MetricCard label="Cost Exposure" value={incident.businessImpact.cost} color="red" />
                <MetricCard label="Downtime Risk" value={incident.businessImpact.downtime} color="amber" />
                <MetricCard label="Production Impact" value={incident.businessImpact.production} color="amber" />
                <MetricCard label="SLA Risk" value={incident.businessImpact.sla} color="amber" />
                <MetricCard label="Revenue at Risk" value={incident.businessImpact.revenue} color="red" />
              </div>
            </div>

            {/* Historical Incidents */}
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={History}>Similar Historical Incidents</SectionTitle>
              <div className="space-y-2">
                {incident.historicalIncidents.map((h) => (
                  <UITooltip key={h.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-4 py-2.5 px-3 border border-border rounded-sm hover:border-primary/30 cursor-pointer transition-colors group">
                        <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center shrink-0">
                          <History size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{h.title}</span>
                            <span className="text-[9px] font-mono text-muted-foreground">· {h.id}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-snug">{h.resolution}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-1">
                          <span className="text-[9px] text-muted-foreground">{h.date}</span>
                          <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">{h.similarity}% similar</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-xs">{h.resolution}</p></TooltipContent>
                  </UITooltip>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── WORKFLOW & TEAM TAB ───────────────────────────────────── */}
          <TabsContent value="workflow-&-team" className="m-0 space-y-4">
            {/* Active Workflow */}
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle icon={GitBranch}>Active Workflow / Mission</SectionTitle>
                <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", incident.activeWorkflow.status === "running" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                  {incident.activeWorkflow.status}
                </span>
              </div>
              <div className="text-base font-bold text-foreground mb-3">{incident.activeWorkflow.name}</div>
              <div className="bg-muted h-1.5 rounded-full mb-4">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${incident.activeWorkflow.progress}%` }} />
              </div>
              <div className="relative pl-4 border-l-2 border-border space-y-4">
                {incident.activeWorkflow.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 -ml-[13px]">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2", {
                      "bg-emerald-500 border-emerald-500": step.status === "done",
                      "bg-primary border-primary ring-2 ring-primary/30": step.status === "active",
                      "bg-white border-border": step.status === "pending",
                    })}>
                      {step.status === "done" ? <CheckCircle2 size={12} className="text-white" /> : step.status === "active" ? <Activity size={11} className="text-white animate-pulse" /> : <span className="w-1.5 h-1.5 rounded-full bg-border block" />}
                    </div>
                    <span className={cn("text-sm", {
                      "text-foreground font-medium": step.status === "done",
                      "text-primary font-semibold": step.status === "active",
                      "text-muted-foreground": step.status === "pending",
                    })}>{step.label}</span>
                    {step.status === "active" && <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">In Progress</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button size="sm" className="text-xs h-8 bg-[#1A1A2E] hover:bg-black text-white rounded-sm uppercase tracking-wider font-semibold" onClick={handleCreateMission}>
                  <Zap size={11} className="mr-1" /> Create Mission
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8 rounded-sm uppercase tracking-wider font-semibold" onClick={() => navigate("/agentops")}>
                  View in AgentOps <ExternalLink size={10} className="ml-1" />
                </Button>
              </div>
            </div>

            {/* Assigned Agents & Humans */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-border rounded-sm p-4">
                <SectionTitle icon={Bot}>Assigned AI Agents</SectionTitle>
                <div className="space-y-3">
                  {incident.assignedAgents.map((agent) => (
                    <div key={agent.name} className="flex items-center gap-3 py-2 border-b border-border/60 last:border-0 group hover:bg-muted/30 px-2 rounded-sm transition-colors cursor-pointer" onClick={() => navigate("/workforce")}>
                      <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot size={14} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{agent.name}</div>
                        <div className="text-[10px] text-muted-foreground">{agent.role}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", agent.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                          {agent.status}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{agent.autonomy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-border rounded-sm p-4">
                <SectionTitle icon={User}>Assigned Humans</SectionTitle>
                <div className="space-y-3">
                  {incident.assignedHumans.map((human) => {
                    const statusColor = { notified: "bg-blue-50 text-blue-700 border-blue-200", reviewing: "bg-amber-50 text-amber-700 border-amber-200", actioning: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                    return (
                      <div key={human.name} className="flex items-center gap-3 py-2 border-b border-border/60 last:border-0 px-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                          {human.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground">{human.name}</div>
                          <div className="text-[10px] text-muted-foreground">{human.role}</div>
                        </div>
                        <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", statusColor[human.status])}>
                          {human.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Related SOPs & Policies */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-border rounded-sm p-4">
                <SectionTitle icon={FileText}>Related SOPs</SectionTitle>
                <div className="space-y-2">
                  {incident.relatedSops.map((sop) => (
                    <div key={sop.title} className="flex items-start gap-3 py-2 border-b border-border/60 last:border-0 group hover:bg-muted/30 px-2 rounded-sm transition-colors cursor-pointer" onClick={() => navigate("/sop")}>
                      <div className="w-7 h-7 rounded-sm bg-emerald-50 flex items-center justify-center shrink-0">
                        <FileText size={13} className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{sop.title}</div>
                        <div className="text-[9px] text-muted-foreground">{sop.version}</div>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">{sop.relevance}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-border rounded-sm p-4">
                <SectionTitle icon={Shield}>Policies Applied</SectionTitle>
                <div className="space-y-2">
                  {incident.policies.map((pol) => (
                    <div key={pol.title} className="flex items-start gap-3 py-2 border-b border-border/60 last:border-0 group hover:bg-muted/30 px-2 rounded-sm transition-colors cursor-pointer" onClick={() => navigate("/policy-studio")}>
                      <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield size={13} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{pol.title}</div>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">{pol.relevance}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Escalation Path */}
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={ArrowUpRight}>Escalation Path</SectionTitle>
              <div className="flex items-stretch gap-0 overflow-x-auto">
                {incident.escalationPath.map((step, idx, arr) => (
                  <div key={step.level} className="flex items-center shrink-0">
                    <div className={cn("w-48 border rounded-sm p-3", {
                      "border-primary/30 bg-primary/5": step.status === "active",
                      "border-emerald-200 bg-emerald-50": step.status === "done",
                      "border-border bg-white": step.status === "pending",
                    })}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold", {
                          "bg-primary text-white": step.status === "active",
                          "bg-emerald-500 text-white": step.status === "done",
                          "bg-muted text-muted-foreground": step.status === "pending",
                        })}>{step.level}</div>
                        <span className={cn("text-[9px] uppercase tracking-widest font-bold", {
                          "text-primary": step.status === "active",
                          "text-emerald-700": step.status === "done",
                          "text-muted-foreground": step.status === "pending",
                        })}>{step.status}</span>
                      </div>
                      <div className="text-sm font-bold text-foreground">{step.name}</div>
                      <div className="text-[9px] text-muted-foreground mb-1">{step.role}</div>
                      <div className="text-[9px] text-muted-foreground leading-snug italic">{step.trigger}</div>
                    </div>
                    {idx < arr.length - 1 && <div className="w-6 flex items-center justify-center shrink-0"><div className="text-muted-foreground text-xs">→</div></div>}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── ACTION ITEMS TAB ──────────────────────────────────────── */}
          <TabsContent value="action-items" className="m-0 space-y-3">
            {incident.recommendedActions.map((action) => (
              <div key={action.id} className="bg-white border border-border rounded-sm p-4 hover:border-primary/30 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", PRIORITY_STYLES[action.priority])}>
                        {action.priority}
                      </span>
                      <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", action.status === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : action.status === "in-progress" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-muted text-muted-foreground border-border")}>
                        {action.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1 leading-snug">{action.action}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><User size={10} /> {action.owner}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> ETA: {action.eta}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ActionButton label="Assign" variant="outline" onClick={() => handleAction(`assign-${action.id}`, action.action)} done={actionedItems.has(`assign-${action.id}`) || action.status === "done"} />
                    <ActionButton label="Resolve" variant="outline" icon={CheckCircle2} onClick={() => handleAction(`resolve-${action.id}`, action.action)} done={actionedItems.has(`resolve-${action.id}`) || action.status === "done"} />
                    {action.priority === "critical" && (
                      <ActionButton label="Escalate" variant="destructive" icon={AlertTriangle} onClick={() => handleAction(`esc-${action.id}`, action.action)} done={actionedItems.has(`esc-${action.id}`)} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── EVIDENCE TAB ─────────────────────────────────────────── */}
          <TabsContent value="evidence" className="m-0 space-y-4">
            {/* Logs */}
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={Database}>System Logs</SectionTitle>
              <div className="bg-[#0F1117] rounded-sm overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-white/40 font-mono ml-2">live · {incident.incidentId}</span>
                </div>
                {incident.evidence.logs.map((log, i) => (
                  <div key={i} className="font-mono text-[10px] py-1.5 px-3 border-b border-white/5 last:border-0 hover:bg-white/5 flex gap-3 items-start">
                    <span className="text-white/40 shrink-0 w-16">{log.timestamp}</span>
                    <span className={cn("shrink-0 text-[9px] font-bold w-8", { "text-red-400": log.level === "error", "text-amber-400": log.level === "warn", "text-blue-400": log.level === "info" })}>[{log.level.toUpperCase()}]</span>
                    <span className="text-cyan-400/70 shrink-0 max-w-[160px] truncate">{log.source}</span>
                    <span className="text-white/80 leading-tight">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sensors */}
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={Radio}>Sensor Readings</SectionTitle>
              <div className="space-y-2">
                {incident.evidence.sensors.map((sensor) => {
                  const statusColor = { critical: "border-l-red-500 bg-red-50/30", warning: "border-l-amber-500 bg-amber-50/30", normal: "border-l-emerald-500 bg-emerald-50/30" };
                  const badgeColor = { critical: "bg-red-50 text-red-700 border-red-200", warning: "bg-amber-50 text-amber-700 border-amber-200", normal: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                  return (
                    <UITooltip key={sensor.id}>
                      <TooltipTrigger asChild>
                        <div className={cn("flex items-center gap-4 px-3 py-2 border border-border border-l-2 rounded-sm", statusColor[sensor.status])}>
                          <div className="w-28 shrink-0">
                            <div className="text-xs font-semibold text-foreground">{sensor.name}</div>
                            <div className="text-[9px] text-muted-foreground font-mono">{sensor.id}</div>
                          </div>
                          <div className="font-mono text-sm font-bold text-foreground">{sensor.value}</div>
                          <div className="text-[10px] text-muted-foreground">Threshold: <span className="font-semibold">{sensor.threshold}</span></div>
                          <div className={cn("ml-auto text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", badgeColor[sensor.status])}>{sensor.status}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">{sensor.name} · {sensor.value} (threshold: {sensor.threshold})</p></TooltipContent>
                    </UITooltip>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={FileText}>Supporting Documents</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {incident.evidence.documents.map((doc) => (
                  <div key={doc.title} className="flex items-center gap-3 p-3 border border-border rounded-sm hover:border-primary/30 cursor-pointer transition-colors group">
                    <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">{doc.title}</div>
                      <div className="text-[9px] text-muted-foreground">{doc.type} · {doc.date}</div>
                    </div>
                    <ExternalLink size={11} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Traces */}
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={Activity}>Agent Traces</SectionTitle>
              <div className="space-y-1">
                {incident.evidence.traces.map((trace) => {
                  const statusColor = { ok: "text-emerald-600", warn: "text-amber-600", error: "text-red-600" };
                  const statusBg = { ok: "bg-emerald-50 border-emerald-200", warn: "bg-amber-50 border-amber-200", error: "bg-red-50 border-red-200" };
                  return (
                    <div key={trace.id} className="flex items-center gap-4 py-1.5 px-3 border-b border-border/60 last:border-0 font-mono text-[10px] hover:bg-muted/30 rounded-sm">
                      <span className="text-muted-foreground shrink-0 w-28">{trace.id}</span>
                      <span className="text-foreground flex-1 leading-snug">{trace.event}</span>
                      <span className="text-muted-foreground w-12 text-right shrink-0">{trace.duration}</span>
                      <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", statusBg[trace.status], statusColor[trace.status])}>{trace.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── TIMELINE TAB ─────────────────────────────────────────── */}
          <TabsContent value="timeline" className="m-0">
            <div className="bg-white border border-border rounded-sm p-4">
              <SectionTitle icon={Clock}>Timeline of Events</SectionTitle>
              <div className="relative pl-8 border-l-2 border-border space-y-0 mt-2">
                {incident.timeline.map((event, idx) => {
                  const style = TIMELINE_STYLES[event.type];
                  const Icon = style.icon;
                  return (
                    <div key={idx} className="relative pb-5 group">
                      <div className={cn("absolute -left-[21px] w-8 h-8 rounded-full flex items-center justify-center border", style.bg)}>
                        <Icon size={13} className={style.color} />
                      </div>
                      <div className="pt-1 hover:bg-muted/30 px-3 rounded-sm transition-colors cursor-default">
                        <div className="flex items-center gap-3 mb-0.5">
                          <span className="font-mono text-xs font-bold text-foreground">{event.time}</span>
                          <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", style.bg, style.color)}>{event.type}</span>
                        </div>
                        <p className="text-sm text-foreground leading-snug mb-0.5">{event.event}</p>
                        <p className="text-[10px] text-muted-foreground">{event.actor}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── ANALYTICS TAB ────────────────────────────────────────── */}
          <TabsContent value="analytics" className="m-0 space-y-4">
            <div className="bg-white border border-primary/20 rounded-sm p-3 mb-2">
              <p className="text-[10px] text-muted-foreground">
                Domain-specific metrics for <span className="font-semibold text-foreground capitalize">{incident.buId.replace("-", " ")}</span> incidents. All charts are interactive — hover for drill-down values.
              </p>
            </div>
            {incident.domainMetrics.type === "manufacturing" && <ManufacturingAnalytics metrics={incident.domainMetrics as ManufacturingMetrics} />}
            {incident.domainMetrics.type === "procurement" && <ProcurementAnalytics metrics={incident.domainMetrics as ProcurementMetrics} />}
            {incident.domainMetrics.type === "supply-chain" && <SupplyChainAnalytics metrics={incident.domainMetrics as SupplyChainMetrics} />}
            {incident.domainMetrics.type === "revenue" && <RevenueAnalytics metrics={incident.domainMetrics as RevenueMetrics} />}
          </TabsContent>
        </Tabs>

        {/* ── Discussion ───────────────────────────────────────────── */}
        <div className="mt-5 bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={MessageSquare}>Discussion / Comments</SectionTitle>
          <div className="space-y-3 mb-4">
            {allComments.map((comment) => (
              <div key={comment.id} className={cn("flex items-start gap-3 p-3 rounded-sm border", comment.isAI ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border")}>
                <div className={cn("w-7 h-7 rounded-sm flex items-center justify-center shrink-0", comment.isAI ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  {comment.isAI ? <Bot size={13} /> : <User size={13} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-foreground">{comment.author}</span>
                    <span className="text-[9px] text-muted-foreground">{comment.role}</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">{comment.time}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
              placeholder="Add a comment to this incident thread…"
              className="flex-1 text-xs border border-border rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
            />
            <Button size="sm" className="h-9 bg-[#1A1A2E] hover:bg-black text-white rounded-sm px-4" onClick={handleSubmitComment}>
              <Send size={12} className="mr-1" /> Post
            </Button>
          </div>
        </div>

        {/* ── Audit History ────────────────────────────────────────── */}
        <div className="mt-4 bg-white border border-border rounded-sm p-4">
          <SectionTitle icon={History}>Audit History</SectionTitle>
          <div className="space-y-1">
            {incident.auditHistory.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-4 py-2 px-3 border-b border-border/60 last:border-0 text-xs hover:bg-muted/30 rounded-sm">
                <span className="font-mono text-muted-foreground shrink-0 w-16">{entry.time}</span>
                <span className="font-semibold text-foreground shrink-0 w-36 truncate">{entry.actor}</span>
                <span className="font-semibold text-primary shrink-0 w-36 truncate">{entry.action}</span>
                <span className="text-muted-foreground leading-snug">{entry.details}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
