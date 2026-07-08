import { HeaderBar } from "@/components/shared/HeaderBar";
import { useAppContext } from "@/context/AppContext";
import { COMPANIES } from "@/data/companies-data";
import { BU_LIST, MFG_AGENTS } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { Building2, Check } from "lucide-react";

export default function Companies() {
  const { currentCompanyId, setCurrentCompanyId } = useAppContext();

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="COMPANIES" metrics={[{ label: "TENANTS", value: COMPANIES.length }]} />

      <div className="p-6 max-w-[1200px] mx-auto w-full space-y-4">
        <p className="text-xs text-muted-foreground max-w-2xl">
          One control plane, many companies — complete data isolation, switch context to operate each. In this
          prototype only Business Units, AI Workforce, and Tasks/My Work actually react to the switch below; every
          other page keeps showing {COMPANIES[0].name}'s data regardless of selection.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {COMPANIES.map((c) => {
            const isCurrent = c.id === currentCompanyId;
            const agentCount = c.id === "company-a" ? MFG_AGENTS.length : 1;
            const buCount = c.id === "company-a" ? BU_LIST.length : 1;
            return (
              <div key={c.id} className={cn("bg-white border rounded-sm shadow-sm p-5", isCurrent ? "border-primary/40 ring-1 ring-primary/20" : "border-border")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-primary" />
                    <span className="text-sm font-bold text-foreground">{c.name}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] uppercase tracking-widest font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                      <Check size={10} /> Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-4">{c.tagline}</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-muted/30 rounded-sm py-2">
                    <div className="text-sm font-bold font-mono text-foreground">{buCount}</div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Business Units</div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-sm py-2">
                    <div className="text-sm font-bold font-mono text-foreground">{agentCount}</div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">AI Agents</div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-sm py-2">
                    <div className="text-sm font-bold font-mono text-foreground">${(c.budgetMonthlyUsd / 1000).toFixed(0)}K</div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Budget / mo</div>
                  </div>
                </div>
                <button
                  disabled={isCurrent}
                  onClick={() => setCurrentCompanyId(c.id)}
                  className={cn(
                    "w-full text-[10px] uppercase tracking-widest font-bold py-2 rounded-sm border transition-colors",
                    isCurrent ? "text-muted-foreground border-border bg-muted/30 cursor-default" : "text-primary border-primary/30 hover:bg-primary/5"
                  )}
                >
                  {isCurrent ? "Active Context" : "Switch →"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
