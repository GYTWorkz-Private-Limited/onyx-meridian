import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Bot, GitBranch, BookOpen, ShieldAlert, CheckSquare, Briefcase, Target, Zap, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { type: "agent", label: "Production Planner", sub: "Manufacturing · AIE-0101 · Active", path: "/agents/ag1", icon: Bot },
  { type: "agent", label: "Predictive Maintenance", sub: "Maintenance · AIE-0201 · Active", path: "/agents/ag3", icon: Bot },
  { type: "agent", label: "Quality Inspector", sub: "Quality · AIE-0301 · Active", path: "/agents/ag4", icon: Bot },
  { type: "agent", label: "Inventory Optimizer", sub: "Supply Chain · AIE-0401 · Watch", path: "/agents/ag5", icon: Bot },
  { type: "agent", label: "Supplier Risk Agent", sub: "Procurement · AIE-0501 · Watch", path: "/agents/ag6", icon: Bot },
  { type: "agent", label: "Finance Analyst", sub: "Finance · AIE-0601 · Active", path: "/agents/ag7", icon: Bot },
  { type: "workflow", label: "Predictive Maintenance Execution", sub: "SOP · v3.2 · 84% automated", path: "/sop", icon: GitBranch },
  { type: "workflow", label: "Production Quality Inspection", sub: "SOP · v2.8 · 91% automated", path: "/sop", icon: GitBranch },
  { type: "workflow", label: "Supplier Risk Assessment", sub: "SOP · v1.6 · 62% automated", path: "/sop", icon: GitBranch },
  { type: "policy", label: "MNT-001 Emergency Work Order", sub: "Maintenance · Active", path: "/policy-studio", icon: ShieldAlert },
  { type: "policy", label: "QUA-002 Defect Threshold", sub: "Quality · Active", path: "/policy-studio", icon: ShieldAlert },
  { type: "policy", label: "PRO-001 Spend Approval", sub: "Procurement · Active", path: "/policy-studio", icon: ShieldAlert },
  { type: "knowledge", label: "Maintenance Manual v4", sub: "Knowledge · Maintenance", path: "/knowledge-studio", icon: BookOpen },
  { type: "knowledge", label: "Quality Control Plan", sub: "Knowledge · Quality", path: "/knowledge-studio", icon: BookOpen },
  { type: "bu", label: "Manufacturing", sub: "Business Unit · EEI 88 · 18 agents", path: "/business-units/manufacturing", icon: Briefcase },
  { type: "bu", label: "Maintenance", sub: "Business Unit · EEI 82 · 12 agents", path: "/business-units/maintenance", icon: Briefcase },
  { type: "bu", label: "Quality", sub: "Business Unit · EEI 85 · 10 agents", path: "/business-units/quality", icon: Briefcase },
  { type: "kpi", label: "OEE", sub: "Manufacturing KPI · 87.4% → target 90%", path: "/kpi-studio?kpi=k1", icon: Target },
  { type: "kpi", label: "Downtime Hours", sub: "Maintenance KPI · 4.2 hrs → target <3 hrs", path: "/kpi-studio?kpi=k-downtime", icon: Target },
  { type: "kpi", label: "Yield", sub: "Quality KPI · 98.4% → target 99%", path: "/kpi-studio?kpi=k-fpy", icon: Target },
  { type: "task", label: "MX-0441 Bearing Replacement", sub: "Task · Manufacturing · Critical · Open", path: "/tasks", icon: CheckSquare },
  { type: "task", label: "Supplier Alternative Review", sub: "Task · Procurement · Warning · Open", path: "/tasks", icon: CheckSquare },
];

const QUICK_ACTIONS = [
  { label: "Open Agent Studio", path: "/agent-studio", icon: Bot },
  { label: "Run Evaluation", path: "/evaluation", icon: Zap },
  { label: "View Mission Control", path: "/agentops", icon: Target },
  { label: "Open Governance", path: "/governance", icon: ShieldAlert },
];

const TYPE_LABELS: Record<string, string> = {
  agent: "AI Employee",
  workflow: "Workflow",
  policy: "Policy",
  knowledge: "Knowledge",
  bu: "Business Unit",
  kpi: "KPI",
  task: "Task",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = query.trim().length === 0
    ? COMMANDS.slice(0, 8)
    : COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.sub.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-[560px] bg-white border border-border rounded-sm shadow-2xl overflow-hidden mx-4">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents, policies, SOPs, KPIs, tasks..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center gap-1">
            <kbd className="text-[9px] uppercase tracking-widest font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">esc</kbd>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {query.trim().length === 0 && (
            <div className="px-4 pt-3 pb-1">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 gap-1 mb-3">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => handleSelect(a.path)}
                    className="flex items-center gap-2 px-3 py-2 rounded-sm bg-muted/40 hover:bg-primary/5 hover:text-primary border border-border/40 transition-colors text-left"
                  >
                    <a.icon size={11} className="shrink-0 text-muted-foreground" />
                    <span className="text-[10px] font-semibold">{a.label}</span>
                  </button>
                ))}
              </div>
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-1">Recent</div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results found</div>
          )}

          <div className="px-2 pb-2">
            {filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(cmd.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-primary/5 hover:text-primary transition-colors text-left group"
                >
                  <Icon size={13} className="text-muted-foreground group-hover:text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-foreground group-hover:text-primary truncate">{cmd.label}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{cmd.sub}</div>
                  </div>
                  <div className="shrink-0">
                    <span className={cn(
                      "text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm",
                      cmd.type === "agent" ? "bg-primary/10 text-primary" :
                      cmd.type === "policy" ? "bg-red-50 text-red-600" :
                      cmd.type === "kpi" ? "bg-emerald-50 text-emerald-600" :
                      cmd.type === "workflow" ? "bg-blue-50 text-blue-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {TYPE_LABELS[cmd.type]}
                    </span>
                  </div>
                  <ArrowRight size={10} className="text-muted-foreground/40 group-hover:text-primary shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-muted-foreground"><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span className="text-[9px] text-muted-foreground"><kbd className="font-mono">↵</kbd> open</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="text-[9px] font-mono bg-white border border-border rounded px-1 py-0.5 text-muted-foreground">⌘</kbd>
            <kbd className="text-[9px] font-mono bg-white border border-border rounded px-1 py-0.5 text-muted-foreground">K</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
