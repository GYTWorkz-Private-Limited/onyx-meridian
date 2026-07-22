import { HeaderBar } from "@/components/shared/HeaderBar";
import { useLocation } from "wouter";
import {
  ArrowUp, ArrowDown, DollarSign,
  TrendingUp, ChevronRight,
  AlertTriangle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BU_LIST, ENTERPRISE_METRICS } from "@/data/enterprise-data";
import { useAppContext } from "@/context/AppContext";

const BU_DISPLAY: Record<string, { displayName: string; subtitle: string; accentColor: string; borderColor: string; bgColor: string }> = {
  manufacturing: { displayName: "Manufacturing Intelligence", subtitle: "Production · OEE · Quality · Maintenance", accentColor: "text-blue-600", borderColor: "border-blue-200", bgColor: "bg-blue-50" },
  "supply-chain": { displayName: "Supply Chain Intelligence", subtitle: "Inventory · Logistics · Warehousing · Demand", accentColor: "text-amber-600", borderColor: "border-amber-200", bgColor: "bg-amber-50" },
  procurement: { displayName: "Procurement Intelligence", subtitle: "Sourcing · Supplier Risk · Contracts · PO", accentColor: "text-orange-600", borderColor: "border-orange-200", bgColor: "bg-orange-50" },
  finance: { displayName: "Finance Intelligence", subtitle: "Cost · FP&A · Audit · Month-end Close", accentColor: "text-emerald-600", borderColor: "border-emerald-200", bgColor: "bg-emerald-50" },
  revenue: { displayName: "Revenue Intelligence", subtitle: "Pipeline · CRM · Forecasting · Customer Success", accentColor: "text-violet-600", borderColor: "border-violet-200", bgColor: "bg-violet-50" },
};

const riskColors: Record<string, string> = {
  low: "text-emerald-700 bg-emerald-50 border-emerald-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  high: "text-red-700 bg-red-50 border-red-200",
};

export default function BusinessUnits() {
  const [, navigate] = useLocation();
  const { currentCompanyId, role, currentBuId } = useAppContext();
  // ABU Head is scoped to "only relevant abu" — never sees other ABUs' health/metrics.
  const visibleBUs = BU_LIST.filter((bu: any) =>
    (bu.companyId ?? "company-a") === currentCompanyId &&
    (role !== "abu_head" || bu.id === currentBuId)
  );

  const goTo = (id: string) => navigate(`/business-units/${id}`);

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
          Autonomous Intelligence Domains — Click a card to open it
        </h2>

        {visibleBUs.length === 0 && (
          <div className="bg-white border border-dashed border-border rounded-sm p-10 text-center text-sm text-muted-foreground">
            No business units yet for this company. Run ABU Onboarding to publish the first one.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-5">
          {visibleBUs.map(bu => {
            const disp = BU_DISPLAY[bu.id] ?? { displayName: bu.name + " Intelligence", subtitle: "", accentColor: "text-primary", borderColor: "border-primary/20", bgColor: "bg-primary/5" };

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
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm border", riskColors[bu.risk])}>
                      {bu.risk} risk
                    </span>
                    {bu.risk === "high" && <AlertTriangle size={10} className="text-red-500 animate-pulse" />}
                    {bu.risk === "low" && <CheckCircle2 size={10} className="text-emerald-500" />}
                  </div>
                </div>

                {/* EEI Score */}
                <div className="mx-4 mt-3 flex items-end justify-between bg-muted/30 p-3 rounded-sm border border-border/50">
                  <div>
                    <div className={cn("text-[9px] uppercase tracking-widest font-semibold mb-1", disp.accentColor)}>EEI Score</div>
                    <div className="text-4xl font-bold tracking-tighter tabular-nums">{bu.eei}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("flex items-center gap-1 text-xs font-mono font-bold mb-2", bu.eei >= 85 ? "text-emerald-500" : bu.eei >= 75 ? "text-amber-500" : "text-red-500")}>
                      {bu.eei >= 80 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {bu.roi}
                    </div>
                    <div className="text-[9px] text-muted-foreground">ROI</div>
                  </div>
                </div>

                {/* Core stats */}
                <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
                  {[
                    { label: "Health", value: `${bu.health}%`, color: bu.health >= 85 ? "text-emerald-600" : bu.health >= 70 ? "text-amber-600" : "text-red-600" },
                    { label: "Automation", value: `${bu.automationPct}%`, color: "text-primary" },
                    { label: "Agents", value: String(bu.agents), color: "text-foreground" },
                    { label: "Workflows", value: String(bu.workflows), color: "text-foreground" },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col border border-border rounded-sm p-2 bg-[#FCFCFD]">
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5 font-semibold">{m.label}</div>
                      <div className={cn("text-sm font-bold tracking-tight tabular-nums", m.color)}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Impact snapshot */}
                <div className="mx-4 mt-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={10} className="text-emerald-600" />
                    <span className="text-[10px] font-bold font-mono text-emerald-600">{bu.revenueProtected}</span>
                    <span className="text-[9px] text-muted-foreground">protected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={10} className="text-emerald-600" />
                    <span className="text-[10px] font-bold font-mono text-emerald-600">+{bu.productivityImprovement}%</span>
                    <span className="text-[9px] text-muted-foreground">productivity</span>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className={cn("mt-auto border-t border-border px-4 py-2.5 rounded-b-sm", disp.bgColor, disp.borderColor)}>
                  <span className={cn("text-[9px] uppercase tracking-widest font-bold", disp.accentColor)}>Open Full Intelligence →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
