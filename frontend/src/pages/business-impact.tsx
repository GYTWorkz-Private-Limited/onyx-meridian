import { useState } from "react";
import { Link, useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { MFG_AGENTS, BU_LIST, ENTERPRISE_METRICS } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import {
  ChevronRight, TrendingUp, DollarSign, Clock, Activity, ArrowUpRight,
  Bot, Filter, Shield, Zap, BarChart3, Target, AlertTriangle,
} from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  blue: "text-blue-600 bg-blue-50 border-blue-200",
  amber: "text-amber-600 bg-amber-50 border-amber-200",
  orange: "text-orange-600 bg-orange-50 border-orange-200",
  emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
  violet: "text-violet-600 bg-violet-50 border-violet-200",
};

const COST_INTELLIGENCE = [
  { category: "AI Agent Costs (MTD)", value: "$42.8K", trend: "down", delta: "-8%", note: "vs. last month" },
  { category: "Compute & Infrastructure", value: "$18.4K", trend: "up", delta: "+3%", note: "peak demand" },
  { category: "Token Usage", value: "14.2M tokens", trend: "up", delta: "+12%", note: "volume growth" },
  { category: "Cost per Decision", value: "$0.48", trend: "down", delta: "-22%", note: "efficiency gain" },
  { category: "Cost per Hour Saved", value: "$8.10", trend: "down", delta: "-14%", note: "vs. human labor" },
  { category: "Net ROI on AI Investment", value: "2.1x", trend: "up", delta: "+0.3x", note: "QoQ improvement" },
];

export default function BusinessImpact() {
  const { role } = useAppContext();
  const isCxo = role === "cxo";
  const [selectedBu, setSelectedBu] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"roi" | "costSaved" | "hoursSaved">("roi");
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "cost">("overview");
  const [, navigate] = useLocation();

  const TABS = (["overview", "agents", "cost"] as const).filter((t) => !isCxo || t !== "agents");

  const filtered = MFG_AGENTS
    .filter((a) => selectedBu === "all" || a.bu === selectedBu)
    .sort((a, b) => {
      if (sortBy === "roi") return parseFloat(b.roi) - parseFloat(a.roi);
      if (sortBy === "costSaved") return parseInt(b.costSaved.replace(/[$KM,.]/g, "")) - parseInt(a.costSaved.replace(/[$KM,.]/g, ""));
      return b.hoursSaved - a.hoursSaved;
    });

  const enterpriseTotals = {
    revenueProtected: ENTERPRISE_METRICS.revenueProtected,
    costSaved: ENTERPRISE_METRICS.costSaved,
    hoursSaved: ENTERPRISE_METRICS.hoursSaved,
    downtimePrevented: ENTERPRISE_METRICS.downtimePrevented,
    eeiContribution: ENTERPRISE_METRICS.eeiContribution,
    automationPct: ENTERPRISE_METRICS.automationPct,
    productivityImprovement: ENTERPRISE_METRICS.productivityImprovement,
    roi: ENTERPRISE_METRICS.roi,
  };

  const SUMMARY_METRICS = [
    { label: "Revenue Protected", value: enterpriseTotals.revenueProtected, icon: DollarSign, color: "text-emerald-600", sub: "Protected this quarter" },
    { label: "Cost Saved MTD", value: enterpriseTotals.costSaved, icon: TrendingUp, color: "text-emerald-600", sub: "Month-to-date savings" },
    { label: "Hours Saved MTD", value: `${enterpriseTotals.hoursSaved.toLocaleString()} hrs`, icon: Clock, color: "text-primary", sub: "Human hours automated" },
    { label: "Downtime Prevented", value: enterpriseTotals.downtimePrevented, icon: Shield, color: "text-blue-600", sub: "Unplanned downtime avoided" },
    { label: "EEI Contribution", value: `+${enterpriseTotals.eeiContribution}`, icon: BarChart3, color: "text-primary", sub: "Enterprise Efficiency Index pts" },
    { label: "Automation Rate", value: `${enterpriseTotals.automationPct}%`, icon: Zap, color: "text-amber-600", sub: "Fully automated workflows" },
    { label: "Productivity Gain", value: `+${enterpriseTotals.productivityImprovement}%`, icon: ArrowUpRight, color: "text-emerald-600", sub: "vs. pre-AI baseline" },
    { label: "Enterprise ROI", value: enterpriseTotals.roi, icon: Target, color: "text-primary", sub: "Return on AI investment" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="BUSINESS IMPACT"
        metrics={[
          { label: "Revenue Protected", value: enterpriseTotals.revenueProtected },
          { label: "Cost Saved", value: enterpriseTotals.costSaved },
          { label: "ROI", value: enterpriseTotals.roi },
        ]}
      />

      {/* Breadcrumb + Tabs */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Enterprise</span>
          <ChevronRight size={10} />
          <span className="text-foreground font-semibold">Business Impact</span>
        </div>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-sm border transition-colors",
                activeTab === t ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {t === "overview" ? "Enterprise Overview" : t === "agents" ? "Agent Breakdown" : "Cost Intelligence"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {activeTab === "overview" && (
          <>
            {/* 8-metric enterprise grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {SUMMARY_METRICS.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="bg-white border border-border rounded-sm px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/kpi-studio")}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={11} className="text-muted-foreground" />
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{m.label}</span>
                    </div>
                    <div className={cn("text-xl font-bold font-mono mb-0.5", m.color)}>{m.value}</div>
                    <div className="text-[9px] text-muted-foreground">{m.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* BU cards */}
            <div className="mb-6">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Business Unit Impact</div>
              <div className="grid grid-cols-5 gap-3">
                {BU_LIST.map((bu) => {
                  const cls = COLOR_MAP[bu.color] || COLOR_MAP.blue;
                  return (
                    <Link key={bu.id} href={`/business-units/${bu.id}`}>
                      <div className={cn("bg-white border rounded-sm p-4 hover:shadow-sm transition-all cursor-pointer", cls.split(" ")[2])}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("text-[9px] uppercase tracking-widest font-bold", cls.split(" ")[0])}>{bu.name}</span>
                          <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm border", cls)}>{bu.eeiContrib} EEI</span>
                        </div>
                        <div className="space-y-1.5 mb-3">
                          <div className="flex justify-between">
                            <span className="text-[9px] text-muted-foreground">Revenue Protected</span>
                            <span className="text-[9px] font-mono font-bold text-emerald-600">{bu.revenueProtected}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] text-muted-foreground">Cost Saved</span>
                            <span className="text-[9px] font-mono font-bold text-emerald-600">{bu.costSaved}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] text-muted-foreground">Hours Saved</span>
                            <span className="text-[9px] font-mono font-bold text-primary">{bu.hoursSaved.toLocaleString()} hrs</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] text-muted-foreground">Downtime Prev.</span>
                            <span className="text-[9px] font-mono font-bold text-blue-600">{bu.downtimePrevented}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] text-muted-foreground">Automation</span>
                            <span className="text-[9px] font-mono font-bold text-foreground">{bu.automationPct}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] text-muted-foreground">Productivity</span>
                            <span className="text-[9px] font-mono font-bold text-emerald-600">+{bu.productivityImprovement}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", cls.split(" ")[1])} style={{ width: `${bu.automationPct}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[8px] text-muted-foreground">ROI: <span className="font-bold text-foreground">{bu.roi}</span></span>
                          <span className="text-[8px] text-muted-foreground">{bu.agents} agents</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Hours saved bars */}
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Hours Saved by Business Unit</div>
              <div className="space-y-3">
                {BU_LIST.map((bu) => {
                  const maxHours = 3000;
                  return (
                    <div key={bu.id} className="flex items-center gap-3">
                      <div className="w-28 text-[10px] font-semibold text-foreground truncate shrink-0">{bu.name}</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.max(5, (bu.hoursSaved / maxHours) * 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] font-mono font-bold text-foreground w-20 text-right shrink-0">
                        {bu.hoursSaved > 0 ? `${bu.hoursSaved.toLocaleString()} hrs` : "—"}
                      </div>
                      <div className="text-[9px] text-emerald-600 font-bold w-16 text-right shrink-0">{bu.eeiContrib} EEI</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === "agents" && !isCxo && (
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Digital Employee Impact Breakdown</div>
              <div className="flex items-center gap-2">
                <Filter size={11} className="text-muted-foreground" />
                <select
                  value={selectedBu}
                  onChange={(e) => setSelectedBu(e.target.value)}
                  className="text-[10px] border border-border rounded-sm px-2 py-1 bg-white outline-none"
                >
                  <option value="all">All Business Units</option>
                  {BU_LIST.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-[10px] border border-border rounded-sm px-2 py-1 bg-white outline-none"
                >
                  <option value="roi">Sort by ROI</option>
                  <option value="costSaved">Sort by Cost Saved</option>
                  <option value="hoursSaved">Sort by Hours Saved</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-9 gap-2 px-4 py-2 bg-muted/30 border-b border-border">
              {["Agent", "BU", "Hours Saved", "Rev. Protected", "Downtime Prev.", "Cost Saved", "Automation", "ROI", "EEI Contrib"].map((h) => (
                <div key={h} className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground">{h}</div>
              ))}
            </div>
            {filtered.map((agent) => (
              <div key={agent.id} className="grid grid-cols-9 gap-2 px-4 py-3 border-b border-border/40 hover:bg-muted/20 transition-colors items-center">
                <div className="min-w-0">
                  <Link href={`/agents/${agent.id}`} className="text-[10px] font-bold text-primary hover:underline block truncate">
                    {agent.name}
                  </Link>
                  <div className="text-[8px] text-muted-foreground truncate">{agent.employeeId}</div>
                </div>
                <div className="text-[9px] text-muted-foreground capitalize">{agent.bu.replace("-", " ")}</div>
                <div className="text-[10px] font-mono font-bold text-foreground">{agent.hoursSaved.toLocaleString()} hrs</div>
                <div className="text-[10px] font-mono font-bold text-emerald-600">{agent.revenueProtected}</div>
                <div className="text-[10px] font-mono font-bold text-blue-600">{agent.downtimePrevented}</div>
                <div className="text-[10px] font-mono font-bold text-emerald-600">{agent.costSaved}</div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-foreground">{agent.automationPct}%</div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden mt-0.5 w-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${agent.automationPct}%` }} />
                  </div>
                </div>
                <div className={cn("text-[10px] font-mono font-bold", parseFloat(agent.roi) >= 2 ? "text-emerald-600" : "text-foreground")}>
                  {agent.roi}
                </div>
                <div className="text-[10px] font-mono font-bold text-primary">{agent.eeiContrib}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "cost" && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {COST_INTELLIGENCE.map((c) => (
                <div key={c.category} className="bg-white border border-border rounded-sm px-4 py-3">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{c.category}</div>
                  <div className="text-xl font-bold font-mono text-foreground mb-0.5">{c.value}</div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-bold", c.trend === "down" ? "text-emerald-600" : "text-amber-600")}>
                      {c.trend === "down" ? "↓" : "↑"} {c.delta}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{c.note}</span>
                  </div>
                </div>
              ))}
            </div>

            {!isCxo && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-border rounded-sm p-4">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Cost per Agent (MTD)</div>
                    <div className="space-y-2">
                      {MFG_AGENTS.slice(0, 6).map((a) => (
                        <div key={a.id} className="flex items-center gap-3">
                          <div className="w-32 text-[10px] font-semibold text-foreground truncate shrink-0">{a.name}</div>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(a.costPerDay / 200) * 100}%` }} />
                          </div>
                          <div className="text-[9px] font-mono text-muted-foreground w-20 text-right shrink-0">${a.costPerDay}/day</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-border rounded-sm p-4">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Token Usage by Agent</div>
                    <div className="space-y-2">
                      {MFG_AGENTS.slice(0, 6).map((a) => {
                        const maxTokens = 3500000;
                        return (
                          <div key={a.id} className="flex items-center gap-3">
                            <div className="w-32 text-[10px] font-semibold text-foreground truncate shrink-0">{a.name}</div>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(a.tokenUsage / maxTokens) * 100}%` }} />
                            </div>
                            <div className="text-[9px] font-mono text-muted-foreground w-20 text-right shrink-0">
                              {(a.tokenUsage / 1000000).toFixed(1)}M
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-white border border-border rounded-sm p-4">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Cost Alerts</div>
                  {[
                    { msg: "Finance Analyst token usage +24% this week — review prompt efficiency", sev: "warning" },
                    { msg: "Predictive Maintenance cost MTD on track — $6.8K of $7.2K budget", sev: "info" },
                    { msg: "Revenue Scout compute cost spiked +18% — CRM sync volume increase", sev: "warning" },
                  ].map((a, i) => (
                    <div key={i} className={cn("flex items-start gap-2 px-3 py-2 rounded-sm mb-1.5 text-[10px]",
                      a.sev === "warning" ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-muted/40 border border-border text-muted-foreground"
                    )}>
                      {a.sev === "warning" ? <AlertTriangle size={11} className="mt-0.5 shrink-0" /> : <Activity size={11} className="mt-0.5 shrink-0" />}
                      {a.msg}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
