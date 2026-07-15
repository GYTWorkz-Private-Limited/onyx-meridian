import { HeaderBar } from "@/components/shared/HeaderBar";
import { ADAPTER_CATALOG, connectedAgentsFor } from "@/data/adapters-data";
import { cn } from "@/lib/utils";
import { Plug, Bot } from "lucide-react";

export default function Adapters() {
  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="ADAPTERS" metrics={[{ label: "RUNTIMES", value: ADAPTER_CATALOG.length }]} />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-4">
        <p className="text-xs text-muted-foreground max-w-2xl">
          Agent runtimes — plug any compatible agent into the workforce. Decouples orchestration from any single AI provider.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ADAPTER_CATALOG.map((a) => {
            const agents = connectedAgentsFor(a.id);
            return (
              <div key={a.id} className="bg-white border border-border rounded-sm shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Plug size={14} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{a.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{a.runtime}</div>
                    </div>
                  </div>
                  <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border",
                    a.status === "connected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200")}>
                    {a.status}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">{a.description}</p>
                <div className="border-t border-border pt-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">Connected Agents ({agents.length})</div>
                  {agents.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground">None yet</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {agents.map((ag: any) => (
                        <span key={ag.id} className="inline-flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-sm border border-border/60">
                          <Bot size={9} /> {ag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
