import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import {
  Factory, Bot, Plus, Copy, Settings, Play, Rocket, Archive,
  CheckCircle2, Clock, FlaskConical, XCircle, ChevronDown, ChevronRight, ArrowUp, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AgentStatus = "draft" | "testing" | "active" | "retired";

const INITIAL_AGENTS: {
  id: string; name: string; role: string; bu: string; status: AgentStatus;
  autonomyLevel: string; version: string; created: string;
  goals: string[]; skills: string[]; tools: string[]; policies: string[];
  budget: string; memoryType: string; permissions: string[];
}[] = [
  {
    id: "f1", name: "Revenue Scout AI v4", role: "Pipeline Intelligence Analyst", bu: "Revenue Intelligence",
    status: "testing", autonomyLevel: "Semi-Autonomous", version: "v4.0-beta", created: "Jun 20",
    goals: ["Increase pipeline conversion rate by 15%", "Identify APAC expansion opportunities", "Flag churn risk >60%"],
    skills: ["CRM Analysis", "Market Intelligence", "Forecast Modeling", "Opportunity Scoring"],
    tools: ["CRM API", "Pipeline DB", "Market Data Feed", "Competitor Intelligence"],
    policies: ["REV-001 Growth Threshold", "REV-007 Data Access", "GOV-001 Human Approval >$50K"],
    budget: "$18,000/mo", memoryType: "Persistent Vector Store",
    permissions: ["Read CRM", "Read Pipeline DB", "Write Opportunity Score", "Escalate Decisions"],
  },
  {
    id: "f2", name: "Compliance Agent Alpha", role: "Regulatory Compliance Analyst", bu: "Finance Intelligence",
    status: "draft", autonomyLevel: "Supervised", version: "v0.1", created: "Jun 22",
    goals: ["Monitor all agent actions for regulatory violations", "Generate compliance reports weekly", "Alert on policy drift"],
    skills: ["Regulatory Analysis", "Policy Interpretation", "Audit Trail Generation"],
    tools: ["Policy Engine API", "Audit DB", "Regulatory Feed"],
    policies: ["GOV-004 Data Privacy", "GOV-001 Human Approval", "FIN-002 Regulatory"],
    budget: "$9,000/mo", memoryType: "Ephemeral",
    permissions: ["Read All Agent Logs", "Read Policy Vault", "Write Compliance Reports"],
  },
  {
    id: "f3", name: "Customer Retention Agent v2", role: "Customer Lifecycle Manager", bu: "Revenue Intelligence",
    status: "active", autonomyLevel: "Fully Autonomous", version: "v2.1", created: "May 15",
    goals: ["Reduce churn by 20%", "Increase NPS by 10 points", "Identify expansion opportunities"],
    skills: ["Churn Prediction", "NPS Analysis", "Retention Campaign Design", "Account Health Scoring"],
    tools: ["CRM API", "NPS Survey Platform", "Email Automation", "Customer Data Platform"],
    policies: ["REV-003 Customer Escalation", "GOV-001 Human Approval for Discounts", "GOV-004 PII Protection"],
    budget: "$22,000/mo", memoryType: "Persistent Vector Store",
    permissions: ["Read CRM", "Write Customer Tags", "Send Email Campaigns", "Create Retention Tasks"],
  },
  {
    id: "f4", name: "Procurement Agent v1", role: "Strategic Sourcing Agent", bu: "Procurement Intelligence",
    status: "retired", autonomyLevel: "Assisted", version: "v1.8", created: "Mar 1",
    goals: ["Reduce procurement costs by 12%", "Automate PO generation", "Score supplier risk"],
    skills: ["Supplier Analysis", "Contract Intelligence", "Spend Analysis"],
    tools: ["Procurement Platform", "Supplier Risk API", "Contract DB"],
    policies: ["PRO-001 Spend Approval >$10K", "PRO-009 Supplier Continuity"],
    budget: "$14,000/mo", memoryType: "Short-term",
    permissions: ["Read Supplier DB", "Generate PO Drafts", "Escalate Spend Approvals"],
  },
];

const statusStyle: Record<AgentStatus, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  draft:   { bg: "bg-muted",       text: "text-muted-foreground", border: "border-border",       icon: Clock },
  testing: { bg: "bg-blue-50",     text: "text-blue-700",        border: "border-blue-200",      icon: FlaskConical },
  active:  { bg: "bg-emerald-50",  text: "text-emerald-700",     border: "border-emerald-200",   icon: CheckCircle2 },
  retired: { bg: "bg-muted",       text: "text-muted-foreground", border: "border-border",       icon: Archive },
};

const AUTONOMY_LEVELS = ["Assisted", "Supervised", "Semi-Autonomous", "Fully Autonomous"];

export default function FactoryPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [queued, setQueued] = useState<Set<string>>(new Set());
  const [creatingModal, setCreatingModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newBu, setNewBu] = useState("Revenue Intelligence");
  const { toast } = useToast();

  const queue = (key: string) => {
    setQueued(prev => { const n = new Set(prev); n.add(key); return n; });
  };

  const handleSaveDraft = (agent: typeof INITIAL_AGENTS[0]) => {
    queue(agent.id + "-draft");
    toast({ title: "Draft Saved", description: `"${agent.name}" saved as draft.` });
  };

  const handleSaveAndTest = (agent: typeof INITIAL_AGENTS[0]) => {
    queue(agent.id + "-testing");
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: "testing" as AgentStatus } : a));
    toast({ title: "Testing Started", description: `"${agent.name}" promoted to testing phase.` });
  };

  const handleActivate = (agent: typeof INITIAL_AGENTS[0]) => {
    queue(agent.id + "-activate");
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: "active" as AgentStatus } : a));
    toast({ title: "Agent Deployed", description: `"${agent.name}" is now live and active.` });
  };

  const handleRetire = (agent: typeof INITIAL_AGENTS[0]) => {
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: "retired" as AgentStatus } : a));
    toast({ title: "Agent Retired", description: `"${agent.name}" has been retired.` });
  };

  const handleConfigure = (agent: typeof INITIAL_AGENTS[0]) => {
    toast({ title: "Configure Agent", description: `Opening configuration panel for "${agent.name}".` });
    setExpanded(agent.id === expanded ? null : agent.id);
  };

  const handleCreateAgent = () => {
    if (!newName.trim() || !newRole.trim()) {
      toast({ title: "Missing fields", description: "Name and role are required.", variant: "destructive" }); return;
    }
    const na = {
      id: `f-${Date.now()}`, name: newName, role: newRole, bu: newBu, status: "draft" as AgentStatus,
      autonomyLevel: "Supervised", version: "v0.1", created: "Jun 24",
      goals: [], skills: [], tools: [], policies: [],
      budget: "TBD", memoryType: "Ephemeral", permissions: [],
    };
    setAgents(prev => [na, ...prev]);
    setCreatingModal(false); setNewName(""); setNewRole("");
    toast({ title: "Agent Created", description: `"${newName}" added as a draft agent.` });
  };

  const draft   = agents.filter(a => a.status === "draft").length;
  const active  = agents.filter(a => a.status === "active").length;
  const testing = agents.filter(a => a.status === "testing").length;
  const retired = agents.filter(a => a.status === "retired").length;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="AGENT FACTORY"
        metrics={[
          { label: "DRAFT",    value: draft },
          { label: "TESTING",  value: testing },
          { label: "ACTIVE",   value: active },
          { label: "RETIRED",  value: retired },
        ]}
      />

      {/* Create Agent Modal */}
      {creatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-border rounded-sm shadow-xl w-[480px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wide">New AI Agent</h3>
              <button onClick={() => setCreatingModal(false)}><X size={16} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Agent Name *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" placeholder="e.g. Supply Chain Risk Agent v1" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Role *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" placeholder="e.g. Supply Chain Risk Analyst" value={newRole} onChange={e => setNewRole(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Business Unit</label>
                <select className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" value={newBu} onChange={e => setNewBu(e.target.value)}>
                  {["Revenue Intelligence", "Finance Intelligence", "Procurement Intelligence", "Supply Chain Intelligence", "Engineering Intelligence"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setCreatingModal(false)}>Cancel</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={handleCreateAgent}>Create Agent</Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-w-[1400px] mx-auto w-full">
        <Tabs defaultValue="roster" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-white border border-border p-1 rounded-sm h-auto">
              <TabsTrigger value="roster" className="py-2 px-4 text-xs uppercase tracking-widest font-semibold rounded-sm data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Agent Roster</TabsTrigger>
              <TabsTrigger value="lifecycle" className="py-2 px-4 text-xs uppercase tracking-widest font-semibold rounded-sm data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Lifecycle</TabsTrigger>
            </TabsList>
            <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={() => setCreatingModal(true)}>
              <Plus size={13} className="mr-1.5" /> NEW AGENT
            </Button>
          </div>

          <TabsContent value="roster" className="m-0 space-y-3">
            {agents.map(agent => {
              const ss = statusStyle[agent.status];
              const SIcon = ss.icon;
              const isOpen = expanded === agent.id;
              return (
                <div key={agent.id} className={cn("bg-white border rounded-sm shadow-sm hover:border-primary/30 transition-colors", ss.border)}>
                  <div className="p-4 flex items-center gap-4">
                    <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center border shrink-0", ss.bg, ss.border)}>
                      <SIcon size={14} className={ss.text} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-foreground">{agent.name}</span>
                        <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold", ss.bg, ss.text, ss.border)}>{agent.status}</span>
                        <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 border border-border rounded-sm">{agent.autonomyLevel}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {agent.role} · {agent.bu} · {agent.version} · Created {agent.created}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {agent.status === "draft" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest bg-white" onClick={() => handleSaveDraft(agent)}>
                            {queued.has(agent.id + "-draft") ? <><CheckCircle2 size={9} className="mr-1 text-emerald-500" />Saved</> : "Save Draft"}
                          </Button>
                          <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleSaveAndTest(agent)}>
                            <FlaskConical size={9} className="mr-1" /> Save &amp; Start Testing
                          </Button>
                        </>
                      )}
                      {agent.status === "testing" && (
                        <>
                          <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleActivate(agent)}>
                            {queued.has(agent.id + "-activate") ? <><CheckCircle2 size={9} className="mr-1" />Deployed</> : <><Rocket size={9} className="mr-1" />Deploy to Production</>}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest bg-white" onClick={() => handleConfigure(agent)}>
                            <Settings size={9} className="mr-1" /> Configure
                          </Button>
                        </>
                      )}
                      {agent.status === "active" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest bg-white" onClick={() => handleConfigure(agent)}>
                            <Settings size={9} className="mr-1" /> Configure
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest text-muted-foreground" onClick={() => handleRetire(agent)}>
                            <Archive size={9} className="mr-1" /> Retire
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(isOpen ? null : agent.id)}>
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-border bg-[#FAFBFC] px-5 py-4">
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: "Goals", items: agent.goals },
                          { label: "Skills", items: agent.skills },
                          { label: "Tools", items: agent.tools },
                          { label: "Policies", items: agent.policies },
                        ].map(col => (
                          <div key={col.label}>
                            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">{col.label}</div>
                            <div className="space-y-1">
                              {col.items.length > 0 ? col.items.map((item, i) => (
                                <div key={i} className="text-[10px] bg-white border border-border rounded-sm px-2 py-1 text-foreground">{item}</div>
                              )) : (
                                <div className="text-[10px] text-muted-foreground italic">None configured</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-6 text-[10px] text-muted-foreground">
                        <span>Budget: <span className="font-bold text-foreground">{agent.budget}</span></span>
                        <span>Memory: <span className="font-bold text-foreground">{agent.memoryType}</span></span>
                        <span>Permissions: <span className="font-bold text-foreground">{agent.permissions.length}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="lifecycle" className="m-0 space-y-4">
            <div className="bg-white border border-border rounded-sm shadow-sm p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Agent Lifecycle Pipeline</h3>
              <div className="flex items-center gap-2 mb-6">
                {["Draft", "Testing", "Active", "Retiring", "Retired"].map((stage, i, arr) => (
                  <div key={stage} className="flex items-center">
                    <div className={cn("px-3 py-1.5 rounded-sm border text-[9px] font-bold uppercase tracking-widest",
                      stage === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      stage === "Testing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      stage === "Draft" ? "bg-muted text-muted-foreground border-border" :
                      "bg-muted text-muted-foreground border-border"
                    )}>
                      {stage}
                    </div>
                    {i < arr.length - 1 && <div className="mx-1 text-muted-foreground text-xs">→</div>}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { stage: "Draft",   count: draft,   bg: "bg-muted border-border text-muted-foreground", desc: "Configured, not yet tested" },
                  { stage: "Testing", count: testing, bg: "bg-blue-50 border-blue-200 text-blue-700",     desc: "Under evaluation & tuning" },
                  { stage: "Active",  count: active,  bg: "bg-emerald-50 border-emerald-200 text-emerald-700", desc: "Live in production" },
                  { stage: "Retired", count: retired, bg: "bg-muted border-border text-muted-foreground", desc: "Decommissioned" },
                ].map(s => (
                  <div key={s.stage} className={cn("border rounded-sm p-4", s.bg)}>
                    <div className="text-2xl font-bold font-mono mb-1">{s.count}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest">{s.stage}</div>
                    <div className="text-[9px] opacity-70 mt-0.5">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
