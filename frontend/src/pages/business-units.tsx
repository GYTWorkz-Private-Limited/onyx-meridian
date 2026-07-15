import { HeaderBar } from "@/components/shared/HeaderBar";
import { useLocation } from "wouter";
import {
  ArrowUp, ArrowDown, Activity, Cpu, Target, Network, DollarSign,
  TrendingUp, Clock, Zap, BarChart3, ChevronRight, Shield,
  AlertTriangle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BU_LIST, ENTERPRISE_METRICS } from "@/data/enterprise-data";
import { useAppContext } from "@/context/AppContext";

const BU_DISPLAY: Record<string, {
  displayName: string;
  subtitle: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  missions: number;
  sopCount: number;
  policyCount: number;
  approvalsPending: number;
}> = {
  manufacturing: {
    displayName: "Manufacturing Intelligence",
    subtitle: "Production · OEE · Quality · Maintenance",
    accentColor: "text-blue-600", borderColor: "border-blue-200", bgColor: "bg-blue-50",
    missions: 8, sopCount: 12, policyCount: 9, approvalsPending: 4,
  },
  "supply-chain": {
    displayName: "Supply Chain Intelligence",
    subtitle: "Inventory · Logistics · Warehousing · Demand",
    accentColor: "text-amber-600", borderColor: "border-amber-200", bgColor: "bg-amber-50",
    missions: 6, sopCount: 8, policyCount: 7, approvalsPending: 4,
  },
  procurement: {
    displayName: "Procurement Intelligence",
    subtitle: "Sourcing · Supplier Risk · Contracts · PO",
    accentColor: "text-orange-600", borderColor: "border-orange-200", bgColor: "bg-orange-50",
    missions: 5, sopCount: 7, policyCount: 8, approvalsPending: 4,
  },
  finance: {
    displayName: "Finance Intelligence",
    subtitle: "Cost · FP&A · Audit · Month-end Close",
    accentColor: "text-emerald-600", borderColor: "border-emerald-200", bgColor: "bg-emerald-50",
    missions: 4, sopCount: 6, policyCount: 11, approvalsPending: 3,
  },
  revenue: {
    displayName: "Revenue Intelligence",
    subtitle: "Pipeline · CRM · Forecasting · Customer Success",
    accentColor: "text-violet-600", borderColor: "border-violet-200", bgColor: "bg-violet-50",
    missions: 7, sopCount: 9, policyCount: 6, approvalsPending: 4,
  },
};

const riskColors: Record<string, string> = {
  low: "text-emerald-700 bg-emerald-50 border-emerald-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  high: "text-red-700 bg-red-50 border-red-200",
};

export default function BusinessUnits() {
  const [, navigate] = useLocation();
  const { currentCompanyId } = useAppContext();
  const visibleBUs = BU_LIST.filter((bu: any) => (bu.companyId ?? "company-a") === currentCompanyId);

  const goTo = (id: string, tab?: string) => {
    navigate(`/business-units/${id}${tab ? `?tab=${tab}` : ""}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="BUSINESS UNITS"
        metrics={[
          { label: "AUTONOMOUS UNITS", value: visibleBUs.length },
          { label: "ENTERPRISE EEI", value: ENTERPRISE_METRICS.eeiScore },
          { label: "TOTAL AI AGENTS", value: ENTERPRISE_METRICS.activeAgents },
          { label: "REVENUE PROTECTED", value: ENTERPRISE_METRICS.revenueProtected },
          { label: "COST SAVED", value: ENTERPRISE_METRICS.costSaved },
          { label: "HOURS SAVED", value: `${ENTERPRISE_METRICS.hoursSaved.toLocaleString()} hrs` },
        ]}
      />

      {/* Enterprise summary strip */}
      <div className="px-6 pt-4 pb-0">
        <div className="bg-white border border-border rounded-sm shadow-sm px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5 font-semibold">Enterprise Automation Rate</div>
            <div className="text-2xl font-bold tabular-nums font-mono text-primary">{ENTERPRISE_METRICS.automationPct}%</div>
          </div>
          {[
            { label: "Downtime Prevented", value: ENTERPRISE_METRICS.downtimePrevented, color: "text-emerald-600" },
            { label: "Productivity Gain", value: `+${ENTERPRISE_METRICS.productivityImprovement}%`, color: "text-emerald-600" },
            { label: "Total Workflows", value: ENTERPRISE_METRICS.totalWorkflows, color: "text-foreground" },
            { label: "Governance Health", value: `${ENTERPRISE_METRICS.governanceHealth}%`, color: "text-primary" },
            { label: "AI Workforce Health", value: `${ENTERPRISE_METRICS.aiWorkforceHealth}%`, color: "text-primary" },
            { label: "Active Escalations", value: ENTERPRISE_METRICS.activeEscalations, color: "text-amber-600" },
          ].map(m => (
            <div key={m.label} className="text-right">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{m.label}</div>
              <div className={cn("text-sm font-bold font-mono", m.color)}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-[1800px] mx-auto w-full">
        <h2 className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-4">
          Autonomous Intelligence Domains — Click any card or metric to drill down
        </h2>

        {visibleBUs.length === 0 && (
          <div className="bg-white border border-dashed border-border rounded-sm p-10 text-center text-sm text-muted-foreground">
            No business units yet for this company. Run ABU Onboarding to publish the first one.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-5">
          {visibleBUs.map(bu => {
            const disp = BU_DISPLAY[bu.id] ?? { displayName: bu.name + " Intelligence", subtitle: "", accentColor: "text-primary", borderColor: "border-primary/20", bgColor: "bg-primary/5", missions: 0, sopCount: 0, policyCount: 0, approvalsPending: 0 };

            return (
              <div
                key={bu.id}
                className="bg-white border border-border rounded-sm shadow-sm flex flex-col hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => goTo(bu.id)}
              >
                {/* Header */}
                <div className="p-4 border-b border-border/60">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{disp.displayName}</div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5 leading-relaxed">{disp.subtitle}</div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  </div>

                  {/* Status + Risk — click to risks tab */}
                  <div className="flex items-center gap-2" onClick={e => { e.stopPropagation(); goTo(bu.id, "risks"); }}>
                    <span
                      className={cn("text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm border cursor-pointer hover:opacity-80 transition-opacity", riskColors[bu.risk])}
                      title="Click to view Risks"
                    >
                      {bu.risk} risk
                    </span>
                    {bu.risk === "high" && <AlertTriangle size={10} className="text-red-500 animate-pulse" />}
                    {bu.risk === "low" && <CheckCircle2 size={10} className="text-emerald-500" />}
                  </div>
                </div>

                {/* EEI Score — click to Business Impact */}
                <div
                  className="mx-4 mt-3 flex items-end justify-between bg-muted/30 p-3 rounded-sm border border-border/50 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
                  onClick={e => { e.stopPropagation(); goTo(bu.id, "business-impact"); }}
                  title="Click to view Business Impact"
                >
                  <div>
                    <div className={cn("text-[9px] uppercase tracking-widest font-semibold mb-1", disp.accentColor)}>EEI Score</div>
                    <div className="text-4xl font-bold tracking-tighter tabular-nums">{bu.eei}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">EEI Contrib: <span className={cn("font-bold", disp.accentColor)}>{bu.eeiContrib}</span></div>
                  </div>
                  <div className="text-right">
                    <div className={cn("flex items-center gap-1 text-xs font-mono font-bold mb-2", bu.eei >= 85 ? "text-emerald-500" : bu.eei >= 75 ? "text-amber-500" : "text-red-500")}>
                      {bu.eei >= 80 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {bu.roi}
                    </div>
                    <div className="text-[9px] text-muted-foreground">ROI</div>
                  </div>
                </div>

                {/* KPI Cards — click to Live KPIs tab */}
                <div
                  className="mx-4 mt-3 grid grid-cols-2 gap-2 cursor-pointer"
                  onClick={e => { e.stopPropagation(); goTo(bu.id, "kpis"); }}
                  title="Click to view Live KPIs"
                >
                  <div className="flex flex-col border border-border rounded-sm p-2 bg-[#FCFCFD] hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                      <Activity size={9} /> Health
                    </div>
                    <div className={cn("text-lg font-bold tracking-tight tabular-nums", bu.health >= 85 ? "text-emerald-600" : bu.health >= 70 ? "text-amber-600" : "text-red-600")}>
                      {bu.health}%
                    </div>
                    <div className="mt-1 h-1 bg-border rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", bu.health >= 85 ? "bg-emerald-500" : bu.health >= 70 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${bu.health}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-col border border-border rounded-sm p-2 bg-[#FCFCFD] hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                      <Target size={9} /> Automation
                    </div>
                    <div className="text-lg font-bold tracking-tight tabular-nums text-primary">{bu.automationPct}%</div>
                    <div className="mt-1 h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${bu.automationPct}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-col border border-border rounded-sm p-2 bg-[#FCFCFD] hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                      <Cpu size={9} /> Agents
                    </div>
                    <div className="text-lg font-bold tracking-tight tabular-nums">{bu.agents}</div>
                  </div>

                  <div className="flex flex-col border border-border rounded-sm p-2 bg-[#FCFCFD] hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                      <Network size={9} /> Workflows
                    </div>
                    <div className="text-lg font-bold tracking-tight tabular-nums">{bu.workflows}</div>
                  </div>
                </div>

                {/* Enterprise Metrics — click to Business Impact */}
                <div
                  className="mx-4 mt-3 grid grid-cols-1 gap-1.5 cursor-pointer"
                  onClick={e => { e.stopPropagation(); goTo(bu.id, "business-impact"); }}
                  title="Click to view Business Impact"
                >
                  {[
                    { icon: DollarSign, label: "Revenue Protected", value: bu.revenueProtected, color: "text-emerald-600" },
                    { icon: Zap, label: "Cost Saved", value: bu.costSaved, color: "text-foreground" },
                    { icon: Clock, label: "Hours Saved", value: `${bu.hoursSaved.toLocaleString()} hrs`, color: "text-foreground" },
                    { icon: TrendingUp, label: "Productivity", value: `+${bu.productivityImprovement}%`, color: "text-emerald-600" },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between py-1 px-2 rounded-sm hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <m.icon size={9} className="text-muted-foreground" />
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{m.label}</span>
                      </div>
                      <span className={cn("text-[10px] font-bold font-mono", m.color)}>{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Quick metrics row — individual drill-downs */}
                <div className="mx-4 mt-3 grid grid-cols-4 gap-1.5 pb-1">
                  {[
                    { label: "SOPs", value: disp.sopCount, tab: "sops" },
                    { label: "Policies", value: disp.policyCount, tab: "policies" },
                    { label: "Missions", value: disp.missions, tab: "missions" },
                    { label: "Approvals", value: disp.approvalsPending, tab: "approvals", alert: disp.approvalsPending > 3 },
                  ].map(m => (
                    <div
                      key={m.label}
                      className={cn("flex flex-col items-center border rounded-sm p-1.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all", m.alert ? "border-amber-300 bg-amber-50/60" : "border-border bg-[#FCFCFD]")}
                      onClick={e => { e.stopPropagation(); goTo(bu.id, m.tab); }}
                      title={`Click to view ${m.label}`}
                    >
                      <div className={cn("text-base font-bold tabular-nums", m.alert ? "text-amber-700" : "text-foreground")}>{m.value}</div>
                      <div className={cn("text-[8px] uppercase tracking-widest font-semibold", m.alert ? "text-amber-600" : "text-muted-foreground")}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* KPI snapshot */}
                <div className="mx-4 mt-2 mb-4" onClick={e => { e.stopPropagation(); goTo(bu.id, "kpis"); }}>
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5">Key KPIs</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(bu.kpis).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="border border-border rounded-sm px-2 py-1 bg-[#FCFCFD] hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                        <div className="text-[8px] uppercase tracking-widest text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-[10px] font-bold font-mono text-foreground">{v as string}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className={cn("mt-auto border-t border-border px-4 py-2.5 flex items-center justify-between rounded-b-sm", disp.bgColor, disp.borderColor, "border-t")}>
                  <span className={cn("text-[9px] uppercase tracking-widest font-bold", disp.accentColor)}>Open Full Intelligence →</span>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={10} className={disp.accentColor} />
                    <Shield size={10} className={disp.accentColor} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
