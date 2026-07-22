import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { CostControlPanel, type CostEntity } from "@/components/shared/CostControlPanel";
import { KillSwitchButton } from "@/components/shared/KillSwitch";
import { useAppContext } from "@/context/AppContext";
import { MFG_AGENTS, BU_LIST, agentsForBu, agentsForDept } from "@/data/enterprise-data";
import { PEOPLE } from "@/data/people-data";
import { MODEL_CATALOG, REASONING_LEVELS, monthlyCost } from "@/data/cost-control-data";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Gauge, Briefcase, Layers, Users, Bot, Power } from "lucide-react";

type DevTab = "bu" | "dept" | "people" | "agents" | "kill";

export default function CostControl() {
  const {
    role, currentBuId, persona,
    getBuCap, setBuCap, getDeptCap, setDeptCap, getPersonCap, setPersonCap,
    getAgentCap, setAgentCap, agentModelOverride, agentReasoningOverride, setAgentModel, setAgentReasoning,
    killSwitchActive,
  } = useAppContext();

  const [devTab, setDevTab] = useState<DevTab>("bu");

  const reasoningOf = (a: any) => agentReasoningOverride[a.id] ?? a.reasoningLevel;
  const modelOf = (a: any) => agentModelOverride[a.id] ?? a.costModelId;
  const costFor = (a: any) => monthlyCost(a.tokenUsage, modelOf(a), reasoningOf(a));

  // Agents in scope for the reasoning/effort dial and the top-line total.
  const scopedAgents =
    role === "cxo" || role === "developer" ? MFG_AGENTS
    : role === "abu_head" ? agentsForBu(currentBuId ?? "")
    : persona.deptId ? agentsForDept(persona.deptId)
    : agentsForBu(currentBuId ?? "");

  const totalMonthly = scopedAgents.reduce((s, a) => s + costFor(a), 0);

  // ─── Entity builders for each level of the lock/cap panel ──────
  const buEntities: CostEntity[] = BU_LIST.map((b: any) => {
    const c = getBuCap(b.id);
    return {
      id: b.id, name: b.name, subtitle: `${b.departments.length} departments · ${b.agents} agents`,
      spend: agentsForBu(b.id).reduce((s, a) => s + costFor(a), 0), cap: c.cap, locked: c.locked,
    };
  });
  const buSetCap = (id: string, cap: number | null) => setBuCap(id, cap, getBuCap(id).locked);
  const buSetLock = (id: string, locked: boolean) => setBuCap(id, getBuCap(id).cap, locked);

  const deptEntitiesForBu = (buId: string): CostEntity[] => {
    const bu = BU_LIST.find((b: any) => b.id === buId);
    if (!bu) return [];
    return bu.departments.map((d: any) => {
      const c = getDeptCap(d.id);
      return {
        id: d.id, name: d.name, subtitle: `${bu.name} · ${d.function}`,
        spend: agentsForDept(d.id).reduce((s, a) => s + costFor(a), 0), cap: c.cap, locked: c.locked,
      };
    });
  };
  const allDeptEntities: CostEntity[] = BU_LIST.flatMap((b: any) => deptEntitiesForBu(b.id));
  const deptSetCap = (id: string, cap: number | null) => setDeptCap(id, cap, getDeptCap(id).locked);
  const deptSetLock = (id: string, locked: boolean) => setDeptCap(id, getDeptCap(id).cap, locked);

  const personEntitiesFor = (people: typeof PEOPLE): CostEntity[] => people.map((p) => {
    const c = getPersonCap(p.id);
    return { id: p.id, name: p.name, subtitle: p.title, spend: p.costMtd, cap: c.cap, locked: c.locked };
  });
  const allPersonEntities = personEntitiesFor(PEOPLE);
  const personSetCap = (id: string, cap: number | null) => setPersonCap(id, cap, getPersonCap(id).locked);
  const personSetLock = (id: string, locked: boolean) => setPersonCap(id, getPersonCap(id).cap, locked);

  const agentEntitiesFor = (agents: typeof MFG_AGENTS): CostEntity[] => agents.map((a: any) => {
    const c = getAgentCap(a.id);
    return { id: a.id, name: a.name, subtitle: a.role, spend: costFor(a), cap: c.totalCap, locked: c.locked };
  });
  const agentSetCap = (id: string, cap: number | null) => setAgentCap(id, { totalCap: cap });
  const agentSetLock = (id: string, locked: boolean) => setAgentCap(id, { locked });

  const byBu = BU_LIST.filter((b: any) => role === "cxo" || role === "developer" || b.id === currentBuId).map((b: any) => ({
    name: b.name,
    cost: Math.round(agentsForBu(b.id).reduce((s, a) => s + costFor(a), 0)),
  }));

  const byModel = Object.values(MODEL_CATALOG).map((m) => {
    const agentsOnModel = scopedAgents.filter((a: any) => modelOf(a) === m.id);
    return {
      name: m.name,
      count: agentsOnModel.length,
      cost: Math.round(agentsOnModel.reduce((s, a: any) => s + costFor(a), 0)),
    };
  }).filter((m) => m.count > 0);

  const devTabs: { id: DevTab; label: string; icon: React.ElementType }[] = [
    { id: "bu", label: "Business Units", icon: Briefcase },
    { id: "dept", label: "Departments", icon: Layers },
    { id: "people", label: "People", icon: Users },
    { id: "agents", label: "Agents", icon: Bot },
    { id: "kill", label: "Kill Switch", icon: Power },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="COST CONTROL"
        metrics={[
          { label: "MONTHLY SPEND", value: `$${totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: "AGENTS", value: scopedAgents.length },
          ...(killSwitchActive ? [{ label: "STATUS", value: "KILL SWITCH ACTIVE" }] : []),
        ]}
      />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
        {killSwitchActive && (
          <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-2.5 text-xs text-red-700 flex items-center gap-2">
            <Power size={13} className="shrink-0" />
            Kill switch is active — every agent enterprise-wide is halted, overriding individual caps.
          </div>
        )}

        {/* ── CXO: Business Unit lock/cap panel ── */}
        {role === "cxo" && (
          <CostControlPanel title="Business Unit Spend Controls" entityLabel="Business Unit" entities={buEntities} onSetCap={buSetCap} onToggleLock={buSetLock} />
        )}

        {/* ── ABU Head: Department lock/cap panel, scoped to their BU ── */}
        {role === "abu_head" && (
          <CostControlPanel title="Department Spend Controls" entityLabel="Department" entities={deptEntitiesForBu(currentBuId ?? "")} onSetCap={deptSetCap} onToggleLock={deptSetLock} />
        )}

        {/* ── Dept Manager: People lock/cap panel, scoped to their department ── */}
        {role === "dept_manager" && (
          <CostControlPanel
            title="Team Spend Controls" entityLabel="Person"
            entities={personEntitiesFor(PEOPLE.filter((p) => p.deptId === persona.deptId || (!persona.deptId && p.buId === persona.buId)))}
            onSetCap={personSetCap} onToggleLock={personSetLock}
          />
        )}

        {/* ── Developer: everything, tabbed ── */}
        {role === "developer" && (
          <div className="space-y-4">
            <div className="flex items-center gap-1 border-b border-border">
              {devTabs.map((t) => {
                const Icon = t.icon;
                const isActive = devTab === t.id;
                return (
                  <button key={t.id} onClick={() => setDevTab(t.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest font-semibold border-b-2 transition-colors -mb-px",
                      isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    )}>
                    <Icon size={12} />{t.label}
                  </button>
                );
              })}
            </div>
            {devTab === "bu" && <CostControlPanel title="Business Unit Spend Controls" entityLabel="Business Unit" entities={buEntities} onSetCap={buSetCap} onToggleLock={buSetLock} />}
            {devTab === "dept" && <CostControlPanel title="Department Spend Controls — All Business Units" entityLabel="Department" entities={allDeptEntities} onSetCap={deptSetCap} onToggleLock={deptSetLock} />}
            {devTab === "people" && <CostControlPanel title="People Spend Controls — Enterprise-Wide" entityLabel="Person" entities={allPersonEntities} onSetCap={personSetCap} onToggleLock={personSetLock} />}
            {devTab === "agents" && <CostControlPanel title="Agent Spend Controls — Total Cap" entityLabel="Agent" entities={agentEntitiesFor(MFG_AGENTS)} onSetCap={agentSetCap} onToggleLock={agentSetLock} />}
            {devTab === "kill" && <KillSwitchButton variant="card" />}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-sm px-4 py-2.5 text-xs text-blue-800 flex items-center gap-2">
          <Gauge size={13} className="shrink-0" />
          Cost is also driven by how hard each agent thinks. Dial reasoning down where deep analysis isn't needed — session-only in this prototype.
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
                  <div className="text-[10px] text-muted-foreground">{MODEL_CATALOG[modelOf(a)]?.name}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {REASONING_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setAgentReasoning(a.id, lvl.id)}
                      className={cn(
                        "text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border transition-colors",
                        reasoningOf(a) === lvl.id ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:bg-muted/60"
                      )}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-mono font-bold text-foreground">${costFor(a).toFixed(0)}/mo</div>
                  <div className="text-[10px] text-muted-foreground">{REASONING_LEVELS.find(l => l.id === reasoningOf(a))?.note}</div>
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
