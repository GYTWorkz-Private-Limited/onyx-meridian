import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import {
  Store, Rocket, Copy, Settings, ArrowUp, Archive, Star,
  TrendingUp, DollarSign, CheckCircle2, Users, Bot, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MARKETPLACE_AGENTS: {
  id: string; name: string; role: string; category: string;
  description: string;
  performanceScore: number; reliabilityScore: number; costEfficiency: number;
  evalScore: number; adoptionCount: number; version: string;
  tags: string[]; deployedTo: string[]; highlight: string;
}[] = [
  {
    id: "m1", name: "Revenue Scout",   category: "Revenue",    version: "v3.1",
    role: "Pipeline Intelligence Analyst",
    description: "Analyzes CRM data, scores pipeline opportunities, forecasts deal close probability, and surfaces APAC expansion signals in real time.",
    performanceScore: 91, reliabilityScore: 94, costEfficiency: 88, evalScore: 94, adoptionCount: 12,
    tags: ["CRM", "Pipeline", "Forecasting", "APAC"],
    deployedTo: ["Revenue Intelligence", "APAC Growth"],
    highlight: "Drove $2.4M revenue impact in Q2 across APAC pipeline",
  },
  {
    id: "m2", name: "Forecast Agent",  category: "Finance",    version: "v2.4",
    role: "Financial Forecasting Specialist",
    description: "Generates weekly and quarterly financial forecasts with 91% accuracy. Integrates with finance systems and flags variance anomalies automatically.",
    performanceScore: 88, reliabilityScore: 90, costEfficiency: 85, evalScore: 89, adoptionCount: 8,
    tags: ["Finance", "Forecasting", "FP&A", "Variance Analysis"],
    deployedTo: ["Finance Intelligence"],
    highlight: "91% forecast accuracy, ↓15% CFO review time",
  },
  {
    id: "m3", name: "Finance Analyst", category: "Finance",    version: "v4.0",
    role: "Autonomous Finance Analyst",
    description: "Handles month-end close reconciliation, journal entry validation, intercompany elimination, and audit trail generation at enterprise scale.",
    performanceScore: 96, reliabilityScore: 97, costEfficiency: 92, evalScore: 97, adoptionCount: 6,
    tags: ["Close", "Reconciliation", "Audit", "GAAP"],
    deployedTo: ["Finance Intelligence", "Group Finance"],
    highlight: "Fully autonomous close — zero manual reconciliation errors",
  },
  {
    id: "m4", name: "Procurement Agent", category: "Procurement", version: "v3.0",
    role: "Strategic Sourcing Agent",
    description: "Automates supplier scoring, PO drafting, and spend analysis. Routes all spend above threshold to human approval before execution.",
    performanceScore: 82, reliabilityScore: 84, costEfficiency: 79, evalScore: 81, adoptionCount: 9,
    tags: ["Sourcing", "Suppliers", "Spend", "PO Automation"],
    deployedTo: ["Procurement Intelligence"],
    highlight: "Saved $340K in procurement costs over 90 days",
  },
  {
    id: "m5", name: "Contract Agent",  category: "Legal",      version: "v2.2",
    role: "Contract Lifecycle Agent",
    description: "Drafts, reviews, and tracks contracts against policy. Flags non-standard terms and escalates high-value contracts to Legal before signature.",
    performanceScore: 85, reliabilityScore: 87, costEfficiency: 83, evalScore: 86, adoptionCount: 7,
    tags: ["Contracts", "Legal", "NDA", "MSA", "Compliance"],
    deployedTo: ["Legal Intelligence", "Procurement Intelligence"],
    highlight: "Reduced contract cycle time from 14 days to 3 days",
  },
  {
    id: "m6", name: "Compliance Agent", category: "Compliance", version: "v1.8",
    role: "Regulatory Compliance Analyst",
    description: "Monitors all AI agent actions for policy violations, generates weekly compliance reports, and creates immutable audit trail entries.",
    performanceScore: 93, reliabilityScore: 95, costEfficiency: 90, evalScore: 96, adoptionCount: 14,
    tags: ["Compliance", "Audit", "Regulatory", "Policy"],
    deployedTo: ["All Business Units"],
    highlight: "Zero compliance breaches in last 90 days",
  },
  {
    id: "m7", name: "Customer Retention Agent", category: "Customer", version: "v2.1",
    role: "Customer Lifecycle Manager",
    description: "Predicts churn risk, designs targeted retention campaigns, and escalates high-value at-risk accounts to human owners within SLA.",
    performanceScore: 87, reliabilityScore: 89, costEfficiency: 84, evalScore: 87, adoptionCount: 5,
    tags: ["Churn", "NPS", "Retention", "CX"],
    deployedTo: ["Customer Intelligence"],
    highlight: "Retained $1.2M ARR at-risk in Q2 — 8 strategic accounts",
  },
  {
    id: "m8", name: "Research Agent",  category: "Intelligence", version: "v1.5",
    role: "Market Intelligence Researcher",
    description: "Synthesizes competitor intelligence, market signals, and industry reports into structured insights for executive decision-making.",
    performanceScore: 84, reliabilityScore: 86, costEfficiency: 81, evalScore: 88, adoptionCount: 4,
    tags: ["Research", "Market Intelligence", "Competitive Analysis"],
    deployedTo: ["Revenue Intelligence", "Strategy"],
    highlight: "Surfaces 12 market signals per week on average",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Revenue:      "bg-primary/10 text-primary border-primary/30",
  Finance:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  Procurement:  "bg-amber-50 text-amber-700 border-amber-200",
  Legal:        "bg-blue-50 text-blue-700 border-blue-200",
  Compliance:   "bg-violet-50 text-violet-700 border-violet-200",
  Customer:     "bg-orange-50 text-orange-700 border-orange-200",
  Intelligence: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function ScorePill({ value, label }: { value: number; label: string }) {
  const color = value >= 90 ? "text-emerald-600" : value >= 80 ? "text-amber-600" : "text-red-600";
  return (
    <div className="text-center">
      <div className={cn("text-sm font-mono font-bold", color)}>{value}</div>
      <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

export default function Marketplace() {
  const [filter, setFilter] = useState<string | null>(null);
  const [deployed, setDeployed] = useState<Set<string>>(new Set(["m1", "m3", "m6"]));
  const [cloned, setCloned] = useState<Set<string>>(new Set());
  const [customized, setCustomized] = useState<Set<string>>(new Set());
  const [upgraded, setUpgraded] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(MARKETPLACE_AGENTS.map(a => a.category)));
  const filtered = filter ? MARKETPLACE_AGENTS.filter(a => a.category === filter) : MARKETPLACE_AGENTS;

  const deploy = (id: string) => setDeployed(prev => { const next = new Set(prev); next.add(id); return next; });

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="AGENT MARKETPLACE"
        metrics={[
          { label: "AVAILABLE AGENTS", value: MARKETPLACE_AGENTS.length },
          { label: "DEPLOYED",         value: deployed.size },
          { label: "CATEGORIES",       value: categories.length },
          { label: "TOTAL ADOPTIONS",  value: MARKETPLACE_AGENTS.reduce((s, a) => s + a.adoptionCount, 0) },
        ]}
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Header + filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            className={cn("text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm border font-semibold transition-colors",
              filter === null ? "bg-foreground text-background border-foreground" : "bg-white text-muted-foreground border-border hover:border-foreground/30"
            )}
            onClick={() => setFilter(null)}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat}
              className={cn("text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm border font-semibold transition-colors",
                filter === cat ? "bg-foreground text-background border-foreground" : cn("bg-white border-border hover:border-foreground/30", CATEGORY_COLORS[cat])
              )}
              onClick={() => setFilter(cat === filter ? null : cat)}
            >{cat}</button>
          ))}
        </div>

        {/* Agent cards grid */}
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(agent => {
            const isDeployed = deployed.has(agent.id);
            const catColor = CATEGORY_COLORS[agent.category] ?? "bg-muted text-muted-foreground border-border";
            return (
              <div key={agent.id} className={cn("bg-white border rounded-sm shadow-sm overflow-hidden transition-all hover:shadow-md",
                isDeployed ? "border-primary/30" : "border-border"
              )}>
                <div className="p-4 border-b border-border flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-base text-foreground leading-tight">{agent.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{agent.role}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold", catColor)}>{agent.category}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">{agent.version}</span>
                        {isDeployed && <CheckCircle2 size={13} className="text-emerald-500" />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{agent.description}</p>

                  {/* Highlight */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-1.5 mb-3 flex items-center gap-1.5">
                    <Star size={9} className="text-emerald-600 shrink-0" />
                    <span className="text-[10px] text-emerald-700 font-medium">{agent.highlight}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {agent.tags.map(tag => (
                      <span key={tag} className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 bg-muted border border-border rounded-sm text-muted-foreground">{tag}</span>
                    ))}
                  </div>

                  {/* Scores */}
                  <div className="flex items-center justify-between border border-border rounded-sm p-2 mb-3">
                    <ScorePill value={agent.performanceScore} label="Perf" />
                    <div className="w-px h-6 bg-border" />
                    <ScorePill value={agent.reliabilityScore} label="Reliability" />
                    <div className="w-px h-6 bg-border" />
                    <ScorePill value={agent.costEfficiency} label="Cost Eff." />
                    <div className="w-px h-6 bg-border" />
                    <ScorePill value={agent.evalScore} label="Eval Score" />
                    <div className="w-px h-6 bg-border" />
                    <div className="text-center">
                      <div className="text-sm font-mono font-bold text-foreground">{agent.adoptionCount}</div>
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Adoptions</div>
                    </div>
                  </div>

                  {/* Deployed to */}
                  {agent.deployedTo.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Users size={9} className="text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">Deployed to: </span>
                      <span className="text-[9px] font-medium text-foreground">{agent.deployedTo.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  {isDeployed ? (
                    <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" disabled>
                      <CheckCircle2 size={10} className="mr-1" /> Deployed
                    </Button>
                  ) : (
                    <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold bg-foreground text-background hover:bg-foreground/90"
                      onClick={() => deploy(agent.id)}>
                      <Rocket size={10} className="mr-1" /> Deploy to BU
                    </Button>
                  )}
                  {cloned.has(agent.id) ? (
                    <span className="text-[8px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest h-7 flex items-center">Cloned ✓</span>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold" onClick={() => setCloned(p => { const n = new Set(p); n.add(agent.id); return n; })}><Copy size={9} className="mr-1" /> Clone</Button>
                  )}
                  {customized.has(agent.id) ? (
                    <span className="text-[8px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest h-7 flex items-center">Customized ✓</span>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold" onClick={() => setCustomized(p => { const n = new Set(p); n.add(agent.id); return n; })}><Settings size={9} className="mr-1" /> Customize</Button>
                  )}
                  {upgraded.has(agent.id) ? (
                    <span className="text-[8px] text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest h-7 flex items-center">Upgraded ✓</span>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold" onClick={() => setUpgraded(p => { const n = new Set(p); n.add(agent.id); return n; })}><ArrowUp size={9} className="mr-1" /> Upgrade</Button>
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
