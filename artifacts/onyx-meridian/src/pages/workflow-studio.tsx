import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { useToast } from "@/hooks/use-toast";
import { MFG_AGENTS, BU_LIST, SOP_CATALOG } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import {
  Plus, Play, Settings, Copy, ArrowRight, CheckCircle2,
  GitBranch, Bot, Users, Clock, Target, Zap, ChevronRight,
  X, Trash2, ArrowUp, ArrowDown, AlertTriangle, DollarSign,
  Search, Layers, Shield, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────

type MissionStatus = "draft" | "ready" | "active";
type StepType = "ai-agent" | "human-approval" | "automated" | "condition";

interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  assignee: string;
  sla: string;
  requiresApproval: boolean;
  successCondition: string;
}

interface Mission {
  id: string;
  name: string;
  objective: string;
  bu: string;
  priority: "critical" | "high" | "medium" | "low";
  status: MissionStatus;
  agents: string[];
  steps: WorkflowStep[];
  successConditions: string[];
  budget: string;
  estimatedDuration: string;
  executionOrder: "sequential" | "parallel";
}

// ─── Static data ───────────────────────────────────────────────

const MISSION_TEMPLATES: Mission[] = [
  {
    id: "mt1", name: "Line 7 OEE Recovery", objective: "Recover Line 7 OEE from 69% to ≥87% target before next shift",
    bu: "manufacturing", priority: "critical", status: "ready",
    agents: ["OEE Optimizer", "Predictive Maintenance", "Production Planner"],
    steps: [
      { id: "s1", name: "Asset Anomaly Detection", type: "ai-agent", assignee: "OEE Optimizer", sla: "5 min", requiresApproval: false, successCondition: "Anomaly confirmed and classified" },
      { id: "s2", name: "Root Cause Analysis", type: "ai-agent", assignee: "Predictive Maintenance", sla: "15 min", requiresApproval: false, successCondition: "Root cause identified with 90%+ confidence" },
      { id: "s3", name: "Maintenance Plan Generation", type: "ai-agent", assignee: "Production Planner", sla: "10 min", requiresApproval: false, successCondition: "Work order and schedule produced" },
      { id: "s4", name: "Human Approval — Maintenance Window", type: "human-approval", assignee: "Plant Manager", sla: "30 min", requiresApproval: true, successCondition: "Maintenance approved and scheduled" },
      { id: "s5", name: "Execute & Verify", type: "automated", assignee: "OEE Optimizer", sla: "2 hrs", requiresApproval: false, successCondition: "OEE restored to ≥87%" },
    ],
    successConditions: ["OEE ≥ 87%", "No secondary failures", "Work order closed in CMMS"],
    budget: "$500K protected", estimatedDuration: "2.5 hrs", executionOrder: "sequential",
  },
  {
    id: "mt2", name: "Supplier Risk Mitigation — Q3", objective: "Assess and mitigate Q3 continuity risk for 3 flagged Tier-1 vendors",
    bu: "procurement", priority: "high", status: "ready",
    agents: ["Supplier Risk Agent", "Contract Bot", "Sourcing Agent"],
    steps: [
      { id: "s1", name: "Supplier Risk Scoring", type: "ai-agent", assignee: "Supplier Risk Agent", sla: "20 min", requiresApproval: false, successCondition: "All vendors scored, risk tiers assigned" },
      { id: "s2", name: "Alternative Sourcing Analysis", type: "ai-agent", assignee: "Sourcing Agent", sla: "30 min", requiresApproval: false, successCondition: "3+ alternatives identified per vendor" },
      { id: "s3", name: "Contract Review", type: "ai-agent", assignee: "Contract Bot", sla: "20 min", requiresApproval: false, successCondition: "Contract terms reviewed, risks flagged" },
      { id: "s4", name: "Procurement Manager Approval", type: "human-approval", assignee: "Procurement Manager", sla: "4 hrs", requiresApproval: true, successCondition: "Mitigation plan approved" },
      { id: "s5", name: "Activate Alternate Supplier", type: "automated", assignee: "Sourcing Agent", sla: "1 hr", requiresApproval: false, successCondition: "Alternate supplier activated in ERP" },
    ],
    successConditions: ["All Tier-1 risks mitigated", "Alternate suppliers confirmed", "No production disruption"],
    budget: "$180K exposure covered", estimatedDuration: "6 hrs", executionOrder: "sequential",
  },
  {
    id: "mt3", name: "Revenue Pipeline Recovery — APAC", objective: "Recover APAC Q3 pipeline conversion rate from -11% to target",
    bu: "revenue", priority: "high", status: "draft",
    agents: ["Revenue Scout", "Deal Closer AI", "Customer Intel"],
    steps: [
      { id: "s1", name: "Pipeline Analysis", type: "ai-agent", assignee: "Revenue Scout", sla: "15 min", requiresApproval: false, successCondition: "At-risk accounts identified and scored" },
      { id: "s2", name: "Account Intelligence", type: "ai-agent", assignee: "Customer Intel", sla: "20 min", requiresApproval: false, successCondition: "Churn signals and engagement gaps mapped" },
      { id: "s3", name: "Outreach & Deal Acceleration", type: "ai-agent", assignee: "Deal Closer AI", sla: "2 hrs", requiresApproval: false, successCondition: "Outreach sent to 14 priority accounts" },
      { id: "s4", name: "VP Sales Review", type: "human-approval", assignee: "VP Sales", sla: "2 hrs", requiresApproval: true, successCondition: "Recovery plan approved" },
    ],
    successConditions: ["Pipeline conversion +8%", "APAC at-risk accounts contacted", "CRM updated"],
    budget: "$3.4M pipeline protected", estimatedDuration: "4 hrs", executionOrder: "sequential",
  },
];

const STEP_COLORS: Record<StepType, string> = {
  "ai-agent": "bg-primary/5 border-primary/30 text-primary",
  "human-approval": "bg-amber-50 border-amber-200 text-amber-700",
  "automated": "bg-emerald-50 border-emerald-200 text-emerald-700",
  "condition": "bg-violet-50 border-violet-200 text-violet-700",
};

const STEP_ICONS: Record<StepType, React.ElementType> = {
  "ai-agent": Bot,
  "human-approval": Users,
  "automated": Zap,
  "condition": GitBranch,
};

export default function MissionCreator() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>(MISSION_TEMPLATES);
  const [selectedMission, setSelectedMission] = useState<Mission>(MISSION_TEMPLATES[0]);
  const [editMode, setEditMode] = useState(false);
  const [showNewMission, setShowNewMission] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");

  const [newForm, setNewForm] = useState({
    name: "", objective: "", bu: "manufacturing", priority: "high" as const,
    budget: "", duration: "", executionOrder: "sequential" as const,
  });

  const filteredAgents = MFG_AGENTS.filter(a =>
    a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.department.toLowerCase().includes(agentSearch.toLowerCase())
  );

  const toggleAgent = (agentName: string) => {
    setSelectedMission(prev => ({
      ...prev,
      agents: prev.agents.includes(agentName)
        ? prev.agents.filter(a => a !== agentName)
        : [...prev.agents, agentName],
    }));
  };

  const moveStep = (idx: number, dir: "up" | "down") => {
    setSelectedMission(prev => {
      const steps = [...prev.steps];
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= steps.length) return prev;
      [steps[idx], steps[target]] = [steps[target], steps[idx]];
      return { ...prev, steps };
    });
  };

  const removeStep = (id: string) => {
    setSelectedMission(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== id) }));
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `s-${Date.now()}`,
      name: "New Step",
      type: "ai-agent",
      assignee: selectedMission.agents[0] || "Agent",
      sla: "30 min",
      requiresApproval: false,
      successCondition: "Step completed successfully",
    };
    setSelectedMission(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
  };

  const launchMission = () => {
    const updated = { ...selectedMission, status: "active" as const };
    setMissions(prev => prev.map(m => m.id === selectedMission.id ? updated : m));
    setSelectedMission(updated);
    toast({ title: "Mission Launched", description: `"${selectedMission.name}" is now active in Mission Control.` });
    setTimeout(() => navigate("/agentops"), 1200);
  };

  const createMission = () => {
    if (!newForm.name.trim() || !newForm.objective.trim()) {
      toast({ title: "Missing fields", description: "Name and objective are required.", variant: "destructive" }); return;
    }
    const nm: Mission = {
      id: `m-${Date.now()}`,
      name: newForm.name,
      objective: newForm.objective,
      bu: newForm.bu,
      priority: newForm.priority,
      status: "draft",
      agents: [],
      steps: [],
      successConditions: [],
      budget: newForm.budget,
      estimatedDuration: newForm.duration,
      executionOrder: newForm.executionOrder,
    };
    setMissions(prev => [nm, ...prev]);
    setSelectedMission(nm);
    setShowNewMission(false);
    setEditMode(true);
    toast({ title: "Mission Created", description: `"${nm.name}" is ready to configure.` });
  };

  const priBadge = (p: string) => {
    if (p === "critical") return "bg-red-50 text-red-700 border-red-200";
    if (p === "high") return "bg-amber-50 text-amber-700 border-amber-200";
    if (p === "medium") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-muted text-muted-foreground border-border";
  };

  const statusBadge = (s: MissionStatus) => {
    if (s === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "ready") return "bg-primary/5 text-primary border-primary/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="MISSION CREATOR"
        metrics={[
          { label: "MISSIONS", value: missions.length },
          { label: "READY", value: missions.filter(m => m.status === "ready").length },
          { label: "DRAFT", value: missions.filter(m => m.status === "draft").length },
        ]}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Build</span>
          <ChevronRight size={10} />
          <span className="text-foreground font-semibold">Mission Creator</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/agentops")}
            className="text-[9px] uppercase tracking-widest font-bold border border-border rounded-sm px-3 py-1.5 bg-white text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            Mission Control →
          </button>
          <button
            onClick={() => setShowNewMission(true)}
            className="flex items-center gap-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-foreground/90 transition-colors"
          >
            <Plus size={11} /> Create Mission
          </button>
        </div>
      </div>

      {/* New Mission Modal */}
      {showNewMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-border rounded-sm shadow-xl w-[560px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wide">Create New Mission</h3>
              <button onClick={() => setShowNewMission(false)}><X size={16} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Mission Name *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" placeholder="e.g. Line 7 OEE Recovery" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Objective *</label>
                <textarea rows={2} className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary resize-none" placeholder="What does success look like?" value={newForm.objective} onChange={e => setNewForm(f => ({ ...f, objective: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Business Unit</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" value={newForm.bu} onChange={e => setNewForm(f => ({ ...f, bu: e.target.value }))}>
                    {BU_LIST.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Priority</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" value={newForm.priority} onChange={e => setNewForm(f => ({ ...f, priority: e.target.value as any }))}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Budget / Value</label>
                  <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" placeholder="e.g. $480K protected" value={newForm.budget} onChange={e => setNewForm(f => ({ ...f, budget: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Execution Order</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" value={newForm.executionOrder} onChange={e => setNewForm(f => ({ ...f, executionOrder: e.target.value as any }))}>
                    <option value="sequential">Sequential</option>
                    <option value="parallel">Parallel</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowNewMission(false)}>Cancel</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={createMission}>Create Mission</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Mission List */}
        <div className="w-[240px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground">Missions</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {missions.map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelectedMission(m); setEditMode(false); }}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-border/40 transition-colors",
                  selectedMission.id === m.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <GitBranch size={10} className={selectedMission.id === m.id ? "text-primary" : "text-muted-foreground"} />
                  <span className={cn("text-[10px] font-bold truncate", selectedMission.id === m.id ? "text-primary" : "text-foreground")}>{m.name}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1 py-0.5 rounded-sm border", statusBadge(m.status))}>{m.status}</span>
                  <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1 py-0.5 rounded-sm border", priBadge(m.priority))}>{m.priority}</span>
                </div>
                <div className="text-[8px] text-muted-foreground mt-1">{m.agents.length} agents · {m.steps.length} steps</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mission Detail */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-bold text-foreground">{selectedMission.name}</h2>
                <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", statusBadge(selectedMission.status))}>{selectedMission.status}</span>
                <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", priBadge(selectedMission.priority))}>{selectedMission.priority}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{selectedMission.objective}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditMode(e => !e)} className={cn("text-[9px] uppercase tracking-widest font-bold border rounded-sm px-3 py-1.5 transition-colors",
                editMode ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/30"
              )}>
                <Settings size={10} className="inline mr-1" />{editMode ? "Done Editing" : "Configure"}
              </button>
              <button onClick={() => { setMissions(prev => prev.map(m => m.id === selectedMission.id ? selectedMission : m)); }} className="text-[9px] uppercase tracking-widest font-bold border border-border rounded-sm px-3 py-1.5 bg-white text-muted-foreground hover:border-primary/30 transition-colors">
                <Copy size={10} className="inline mr-1" />Clone
              </button>
              <button onClick={launchMission} className="flex items-center gap-1.5 bg-primary text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/90 transition-colors">
                <Play size={10} />Launch Mission
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Business Unit", value: BU_LIST.find(b => b.id === selectedMission.bu)?.name ?? selectedMission.bu, icon: Layers },
              { label: "Execution Order", value: selectedMission.executionOrder, icon: GitBranch },
              { label: "Budget / Value", value: selectedMission.budget || "—", icon: DollarSign },
              { label: "Est. Duration", value: selectedMission.estimatedDuration || "—", icon: Clock },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-white border border-border rounded-sm px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={10} className="text-muted-foreground" />
                    <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.label}</span>
                  </div>
                  <div className="text-[11px] font-bold text-foreground capitalize">{m.value}</div>
                </div>
              );
            })}
          </div>

          {/* Agents Section */}
          <div className="bg-white border border-border rounded-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Assigned Agents ({selectedMission.agents.length})</div>
              {editMode && (
                <div className="relative">
                  <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="border border-border rounded-sm pl-6 pr-3 py-1 text-[10px] bg-white outline-none focus:border-primary w-40"
                    placeholder="Search agents..."
                    value={agentSearch}
                    onChange={e => setAgentSearch(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedMission.agents.map(a => (
                <div key={a} className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-sm px-2 py-1">
                  <Bot size={10} className="text-primary shrink-0" />
                  <span className="text-[10px] font-semibold text-primary">{a}</span>
                  {editMode && (
                    <button onClick={() => toggleAgent(a)} className="text-muted-foreground hover:text-destructive ml-1">
                      <X size={9} />
                    </button>
                  )}
                </div>
              ))}
              {selectedMission.agents.length === 0 && (
                <span className="text-[10px] text-muted-foreground">No agents assigned yet. {editMode ? "Search below to hire agents." : ""}</span>
              )}
            </div>
            {editMode && (
              <div className="border-t border-border/40 pt-3">
                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Hire Agent</div>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {filteredAgents.map(a => {
                    const assigned = selectedMission.agents.includes(a.name);
                    return (
                      <button key={a.id} onClick={() => toggleAgent(a.name)} className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 border rounded-sm transition-colors text-left",
                        assigned ? "bg-primary/10 border-primary/30 text-primary" : "bg-white border-border text-foreground hover:border-primary/30"
                      )}>
                        <Bot size={10} className="shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold truncate">{a.name}</div>
                          <div className="text-[8px] text-muted-foreground truncate">{a.department}</div>
                        </div>
                        {assigned && <CheckCircle2 size={9} className="text-primary ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Workflow Steps */}
          <div className="bg-white border border-border rounded-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Workflow Steps ({selectedMission.steps.length})</div>
              {editMode && (
                <button onClick={addStep} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/30 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">
                  <Plus size={9} /> Add Step
                </button>
              )}
            </div>

            {/* Visual flow */}
            <div className="flex items-start gap-0 overflow-x-auto pb-2 mb-4">
              {selectedMission.steps.map((step, i) => {
                const Icon = STEP_ICONS[step.type];
                return (
                  <div key={step.id} className="flex items-start shrink-0">
                    <div className={cn("border rounded-sm px-3 py-2.5 w-[140px]", STEP_COLORS[step.type])}>
                      <div className="flex items-center gap-1 mb-1">
                        <Icon size={10} className="shrink-0" />
                        <span className="text-[8px] uppercase tracking-widest font-bold">{step.type.replace("-", " ")}</span>
                      </div>
                      <div className="text-[10px] font-bold leading-tight mb-0.5">{step.name}</div>
                      <div className="text-[9px] opacity-70">{step.assignee}</div>
                      <div className="text-[8px] mt-1 opacity-60"><Clock size={7} className="inline mr-0.5" />{step.sla}</div>
                      {step.requiresApproval && <div className="text-[8px] mt-0.5 text-amber-600 font-bold">↑ Approval required</div>}
                    </div>
                    {i < selectedMission.steps.length - 1 && (
                      <div className="flex items-center self-center px-1">
                        <div className="w-4 h-[1px] bg-border" />
                        <ArrowRight size={9} className="text-muted-foreground shrink-0" />
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedMission.steps.length === 0 && (
                <div className="text-[11px] text-muted-foreground py-4">No steps defined. {editMode ? 'Click "Add Step" to build the workflow.' : ""}</div>
              )}
            </div>

            {/* Step list for editing */}
            {editMode && selectedMission.steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2 border border-border/60 rounded-sm px-3 py-2 mb-1.5 bg-muted/20">
                <span className="text-[9px] font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <select value={step.type} onChange={e => {
                  const t = e.target.value as StepType;
                  setSelectedMission(prev => ({ ...prev, steps: prev.steps.map(s => s.id === step.id ? { ...s, type: t } : s) }));
                }} className="text-[9px] border border-border rounded-sm px-1.5 py-1 bg-white outline-none shrink-0">
                  <option value="ai-agent">AI Agent</option>
                  <option value="human-approval">Human Approval</option>
                  <option value="automated">Automated</option>
                  <option value="condition">Condition</option>
                </select>
                <input
                  className="flex-1 border border-border rounded-sm px-2 py-1 text-[10px] bg-white outline-none focus:border-primary"
                  value={step.name}
                  onChange={e => setSelectedMission(prev => ({ ...prev, steps: prev.steps.map(s => s.id === step.id ? { ...s, name: e.target.value } : s) }))}
                />
                <input
                  className="w-28 border border-border rounded-sm px-2 py-1 text-[10px] bg-white outline-none focus:border-primary"
                  value={step.assignee}
                  onChange={e => setSelectedMission(prev => ({ ...prev, steps: prev.steps.map(s => s.id === step.id ? { ...s, assignee: e.target.value } : s) }))}
                />
                <label className="flex items-center gap-1 text-[9px] text-muted-foreground shrink-0">
                  <input type="checkbox" checked={step.requiresApproval}
                    onChange={e => setSelectedMission(prev => ({ ...prev, steps: prev.steps.map(s => s.id === step.id ? { ...s, requiresApproval: e.target.checked } : s) }))}
                  />
                  Approval
                </label>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => moveStep(i, "up")} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp size={10} /></button>
                  <button onClick={() => moveStep(i, "down")} disabled={i === selectedMission.steps.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown size={10} /></button>
                  <button onClick={() => removeStep(step.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Success Conditions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Success Conditions</div>
              {selectedMission.successConditions.map((sc, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-foreground">{sc}</span>
                </div>
              ))}
              {selectedMission.successConditions.length === 0 && <div className="text-[10px] text-muted-foreground">No success conditions defined.</div>}
            </div>
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Linked SOPs & Policies</div>
              {SOP_CATALOG.filter(s => BU_LIST.find(b => b.id === selectedMission.bu)?.name.toLowerCase().includes(s.owner.toLowerCase())).slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center gap-2 mb-1.5">
                  <Shield size={10} className="text-primary shrink-0" />
                  <span className="text-[10px] text-foreground">{s.title}</span>
                  <span className="text-[8px] text-muted-foreground ml-auto">{s.version}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
