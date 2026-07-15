import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { useAppContext } from "@/context/AppContext";
import { MFG_AGENTS, BU_LIST } from "@/data/enterprise-data";
import { MODEL_CATALOG, REASONING_LEVELS, monthlyCost } from "@/data/cost-control-data";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Gauge } from "lucide-react";

export default function CostControl() {
  const { role, currentBuId } = useAppContext();
  const [levels, setLevels] = useState<Record<string, string>>(
    () => Object.fromEntries(MFG_AGENTS.map((a: any) => [a.id, a.reasoningLevel]))
  );

  const scopedAgents = MFG_AGENTS.filter((a: any) => role === "ceo" || a.bu === currentBuId);

  const costFor = (a: any) => monthlyCost(a.tokenUsage, a.costModelId, levels[a.id]);
  const totalMonthly = scopedAgents.reduce((s, a: any) => s + costFor(a), 0);

  const byBu = BU_LIST.filter((b: any) => role === "ceo" || b.id === currentBuId).map((b: any) => ({
    name: b.name,
    cost: Math.round(MFG_AGENTS.filter((a: any) => a.bu === b.id).reduce((s, a: any) => s + costFor(a), 0)),
  }));

  const byModel = Object.values(MODEL_CATALOG).map((m) => {
    const agentsOnModel = scopedAgents.filter((a: any) => a.costModelId === m.id);
    return {
      name: m.name,
      count: agentsOnModel.length,
      cost: Math.round(agentsOnModel.reduce((s, a: any) => s + costFor(a), 0)),
    };
  }).filter((m) => m.count > 0);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="COST CONTROL" metrics={[{ label: "MONTHLY SPEND", value: `$${totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}` }, { label: "AGENTS", value: scopedAgents.length }]} />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-sm px-4 py-2.5 text-xs text-blue-800 flex items-center gap-2">
          <Gauge size={13} className="shrink-0" />
          Cost is driven by how hard each agent thinks. Dial reasoning down where deep analysis isn't needed — this is the primary lever, session-only in this prototype.
        </div>

        <div className="bg-white border border-border rounded-sm shadow-sm">
          <div className="px-4 py-2.5 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Reasoning / Effort Control
          </div>
          <div className="divide-y divide-border">
            {scopedAgents.map((a: any) => (
              <div key={a.id} className="flex items-center gap-4 px-4 py-3">
                <div className="w-40 shrink-0">
                  <div className="text-xs font-semibold text-foreground">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground">{MODEL_CATALOG[a.costModelId]?.name}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {REASONING_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setLevels((prev) => ({ ...prev, [a.id]: lvl.id }))}
                      className={cn(
                        "text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border transition-colors",
                        levels[a.id] === lvl.id ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:bg-muted/60"
                      )}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-mono font-bold text-foreground">${costFor(a).toFixed(0)}/mo</div>
                  <div className="text-[10px] text-muted-foreground">{REASONING_LEVELS.find(l => l.id === levels[a.id])?.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-sm shadow-sm p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Spend by Business Unit</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byBu} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="cost" fill="hsl(228 71% 54%)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-border rounded-sm shadow-sm p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Spend by Model</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left font-medium py-1.5">Model</th>
                  <th className="text-left font-medium py-1.5">Agents</th>
                  <th className="text-left font-medium py-1.5">Rate</th>
                  <th className="text-right font-medium py-1.5">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {byModel.map((m) => (
                  <tr key={m.name}>
                    <td className="py-2 font-medium text-foreground">{m.name}</td>
                    <td className="py-2 text-muted-foreground">{m.count}</td>
                    <td className="py-2 text-muted-foreground font-mono">${MODEL_CATALOG[Object.keys(MODEL_CATALOG).find(k => MODEL_CATALOG[k].name === m.name) ?? "gpt-4o"].rate}/Mtok</td>
                    <td className="py-2 text-right font-mono font-semibold text-foreground">${m.cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
