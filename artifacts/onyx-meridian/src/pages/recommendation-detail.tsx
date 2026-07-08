import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { RECOMMENDATIONS } from "./intelligence";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Play, Bookmark, UserPlus, XCircle, CheckCircle2,
  ArrowUp, ArrowDown, DollarSign, TrendingUp, Shield, Clock,
  AlertTriangle, Users, Bot, FileText, BookOpen, GitBranch,
  Target, ChevronRight, Activity, BarChart2, Cpu, FlaskConical,
  List, Info, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  critical: { label: "CRITICAL", bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200"   },
  high:     { label: "HIGH",     bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  medium:   { label: "MEDIUM",   bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200"  },
  low:      { label: "LOW",      bg: "bg-muted",    text: "text-muted-foreground", border: "border-border" },
};

const STATUS_CONFIG = {
  active:           { label: "ACTIVE",           dot: "bg-emerald-500" },
  in_progress:      { label: "IN PROGRESS",      dot: "bg-blue-500"    },
  pending_approval: { label: "PENDING APPROVAL", dot: "bg-amber-500"   },
  monitoring:       { label: "MONITORING",       dot: "bg-violet-500"  },
};

const TABS = [
  { id: "overview",   label: "Overview",        icon: Info },
  { id: "evidence",   label: "Evidence & Root Cause", icon: Activity },
  { id: "impact",     label: "KPI Projections & Impact", icon: BarChart2 },
  { id: "execution",  label: "Execution Plan",  icon: List },
  { id: "agents",     label: "Agent Contributions", icon: Cpu },
  { id: "knowledge",  label: "Knowledge & Lineage", icon: BookOpen },
  { id: "simulation", label: "Rollback & Contingency", icon: FlaskConical },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3 pb-1.5 border-b border-border">
      {title}
    </div>
  );
}

function InfoCard({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white border border-border rounded-sm p-4", className)}>
      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">{label}</div>
      {children}
    </div>
  );
}

export default function RecommendationDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addWorkflow } = useAppContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLaunched, setIsLaunched] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const rec = RECOMMENDATIONS.find(r => r.id === params.id);

  if (!rec) {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FA]">
        <HeaderBar moduleName="RECOMMENDATION DETAIL" metrics={[]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Recommendation not found.</p>
            <Button variant="link" onClick={() => navigate("/intelligence")}>← Back to Intelligence</Button>
          </div>
        </div>
      </div>
    );
  }

  const priority = PRIORITY_CONFIG[rec.priority];
  const status = STATUS_CONFIG[rec.liveStatus];

  const handleLaunch = () => {
    if (isLaunched) return;
    const wf = addWorkflow(rec.agentWorkflow, rec.agentName, rec.title);
    setIsLaunched(true);
    toast({ title: "Workflow Launched", description: `"${rec.agentWorkflow}" is now running.` });
    setTimeout(() => navigate(`/workflow/${wf.id}`), 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="RECOMMENDATION DETAIL"
        metrics={[
          { label: "CONFIDENCE", value: `${rec.confidence}%` },
          { label: "SUCCESS PROB", value: `${rec.successProbability}%` },
          { label: "PRIORITY", value: rec.priority.toUpperCase() },
        ]}
      />

      {/* Sticky top bar */}
      <div className="bg-white border-b border-border px-6 py-3 shrink-0 flex items-center gap-4">
        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/intelligence")}>
          <ArrowLeft size={12} /> Back to Intelligence
        </Button>
        <div className="text-[10px] text-muted-foreground font-mono">{rec.id}</div>
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status.dot)} />
          <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{status.label}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isLaunched ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-sm font-semibold">
              <CheckCircle2 size={11} /> Workflow Running
            </span>
          ) : (
            <Button className="bg-[#0F0F1A] text-white hover:bg-black text-[10px] h-8 px-4 gap-1.5 rounded-sm uppercase tracking-wider font-bold"
              onClick={handleLaunch}>
              <Play size={10} /> Launch Workflow
            </Button>
          )}
          {isSaved ? (
            <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-2 py-1.5 rounded-sm font-bold">✓ Saved</span>
          ) : (
            <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1" onClick={() => { setIsSaved(true); toast({ title: "Saved" }); }}>
              <Bookmark size={10} /> Save
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"
            onClick={() => toast({ title: "Owner Assigned", description: "Recommendation forwarded to department lead." })}>
            <UserPlus size={10} /> Assign Owner
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1 text-muted-foreground hover:text-red-600"
            onClick={() => { toast({ title: "Dismissed" }); navigate("/intelligence"); }}>
            <XCircle size={10} /> Dismiss
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1200px] mx-auto p-6">

          {/* Title block */}
          <div className="bg-white border border-border rounded-sm p-6 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20">
                {rec.confidence}% CONFIDENCE
              </span>
              <span className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm border", priority.bg, priority.text, priority.border)}>
                {priority.label} PRIORITY
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold px-2 py-0.5 bg-muted border border-border rounded-sm">
                {rec.businessObjective}
              </span>
            </div>

            <h1 className="text-xl font-bold text-foreground mb-3 leading-snug">{rec.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{rec.executiveSummary}</p>

            {/* Quick stats */}
            <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-border">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Financial Impact</div>
                <div className="text-sm font-bold text-foreground">{rec.financialImpact.total}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Execution Time</div>
                <div className="text-sm font-bold text-foreground flex items-center gap-1"><Clock size={12} /> {rec.estimatedExecutionTime}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Success Probability</div>
                <div className="text-sm font-bold text-foreground">{rec.successProbability}%</div>
                <div className="w-full h-1 bg-muted rounded-full mt-1">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${rec.successProbability}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Required Approvals</div>
                <div className="text-sm font-bold text-foreground flex items-center gap-1">
                  <AlertTriangle size={12} className={rec.requiredApprovals.length > 0 ? "text-amber-500" : "text-emerald-500"} />
                  {rec.requiredApprovals.length} approvals
                </div>
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex border-b border-border mb-5 bg-white rounded-t-sm overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors border-b-2",
                    activeTab === tab.id
                      ? "text-primary border-primary bg-primary/5"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon size={11} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Operational Impact">
                  <p className="text-xs text-foreground leading-relaxed">{rec.operationalImpact}</p>
                </InfoCard>
                <InfoCard label="Risk Assessment">
                  <p className="text-xs text-foreground leading-relaxed">{rec.riskAssessment}</p>
                </InfoCard>
              </div>

              <InfoCard label="Affected Departments & Agents">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2 flex items-center gap-1"><Users size={9} /> Departments</div>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.affectedDepartments.map(d => (
                        <span key={d} className="text-xs bg-muted border border-border px-2 py-1 rounded-sm font-medium text-foreground">{d}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2 flex items-center gap-1"><Bot size={9} /> AI Agents</div>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.affectedAgents.map(a => (
                        <span key={a} className="text-xs bg-primary/5 border border-primary/20 text-primary px-2 py-1 rounded-sm font-medium">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </InfoCard>

              <InfoCard label="Dependencies">
                <div className="space-y-2">
                  {rec.dependencies.map((dep, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
                      {dep}
                    </div>
                  ))}
                </div>
              </InfoCard>

              <div className="grid grid-cols-3 gap-4">
                {rec.financialImpact.revenueGain && (
                  <InfoCard label="Revenue Gain">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                      <TrendingUp size={14} /> {rec.financialImpact.revenueGain}
                    </div>
                  </InfoCard>
                )}
                {rec.financialImpact.costReduction && (
                  <InfoCard label="Cost Reduction">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                      <DollarSign size={14} /> {rec.financialImpact.costReduction}
                    </div>
                  </InfoCard>
                )}
                {rec.financialImpact.riskAvoided && (
                  <InfoCard label="Risk Avoided">
                    <div className="flex items-center gap-1.5 text-violet-600 font-bold text-sm">
                      <Shield size={14} /> {rec.financialImpact.riskAvoided}
                    </div>
                  </InfoCard>
                )}
              </div>

              <InfoCard label="Expected ROI / Business Outcome">
                <p className="text-sm font-semibold text-foreground">{rec.expectedROI}</p>
              </InfoCard>
            </div>
          )}

          {/* ── EVIDENCE & ROOT CAUSE ─────────────────────────────────────── */}
          {activeTab === "evidence" && (
            <div className="space-y-4">
              <InfoCard label="Root Cause Analysis">
                <p className="text-sm text-foreground leading-relaxed">{rec.rootCause}</p>
              </InfoCard>

              <InfoCard label="Evidence Used">
                <div className="space-y-3">
                  {rec.evidenceUsed.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#FAFAFA] border border-border rounded-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-xs text-foreground leading-relaxed">{e}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <InfoCard label="Decision Lineage Timeline">
                <div className="space-y-3">
                  {rec.decisionLineage.map((step, i) => (
                    <div key={step.step} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        {i < rec.decisionLineage.length - 1 && (
                          <div className="w-px h-6 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-primary mb-0.5">{step.step}</div>
                        <p className="text-xs text-foreground leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}

          {/* ── KPI PROJECTIONS ───────────────────────────────────────────── */}
          {activeTab === "impact" && (
            <div className="space-y-4">
              <InfoCard label="Impacted KPIs — Current vs Target vs Projected">
                <div className="space-y-4">
                  {rec.kpis.map(kpi => (
                    <div key={kpi.name} className="border border-border rounded-sm p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-sm text-foreground">{kpi.name}</div>
                        <div className={cn("flex items-center gap-1 text-xs font-bold", kpi.direction === "up" ? "text-emerald-600" : "text-blue-600")}>
                          {kpi.direction === "up" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          Projected: {kpi.projected}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-red-50 border border-red-100 rounded-sm">
                          <div className="text-[9px] uppercase tracking-widest text-red-600 font-bold mb-1">Current</div>
                          <div className="font-mono font-bold text-red-700 text-sm">{kpi.current}</div>
                        </div>
                        <div className="text-center p-2 bg-amber-50 border border-amber-100 rounded-sm">
                          <div className="text-[9px] uppercase tracking-widest text-amber-600 font-bold mb-1">Target</div>
                          <div className="font-mono font-bold text-amber-700 text-sm">{kpi.target}</div>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 border border-emerald-100 rounded-sm">
                          <div className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold mb-1">Projected</div>
                          <div className="font-mono font-bold text-emerald-700 text-sm">{kpi.projected}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Financial Impact Detail">
                  <div className="space-y-3">
                    {rec.financialImpact.revenueGain && (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-sm">
                        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1"><TrendingUp size={11} /> Revenue Gain</div>
                        <div className="text-xs font-mono font-bold text-emerald-700">{rec.financialImpact.revenueGain}</div>
                      </div>
                    )}
                    {rec.financialImpact.costReduction && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-sm">
                        <div className="text-xs text-blue-700 font-semibold flex items-center gap-1"><DollarSign size={11} /> Cost Reduction</div>
                        <div className="text-xs font-mono font-bold text-blue-700">{rec.financialImpact.costReduction}</div>
                      </div>
                    )}
                    {rec.financialImpact.riskAvoided && (
                      <div className="flex items-center justify-between p-2 bg-violet-50 border border-violet-100 rounded-sm">
                        <div className="text-xs text-violet-700 font-semibold flex items-center gap-1"><Shield size={11} /> Risk Avoided</div>
                        <div className="text-xs font-mono font-bold text-violet-700">{rec.financialImpact.riskAvoided}</div>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-2 bg-[#FAFAFA] border border-border rounded-sm pt-3 border-t-2">
                      <div className="text-xs text-foreground font-bold">Net Impact</div>
                      <div className="text-sm font-mono font-bold text-foreground">{rec.financialImpact.total}</div>
                    </div>
                  </div>
                </InfoCard>

                <InfoCard label="Operational Impact">
                  <p className="text-xs text-foreground leading-relaxed mb-3">{rec.operationalImpact}</p>
                  <div className="border-t border-border pt-3">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Expected ROI</div>
                    <p className="text-xs font-semibold text-foreground">{rec.expectedROI}</p>
                  </div>
                </InfoCard>
              </div>
            </div>
          )}

          {/* ── EXECUTION PLAN ────────────────────────────────────────────── */}
          {activeTab === "execution" && (
            <div className="space-y-4">
              <InfoCard label="Recommended Actions — Ordered Execution Plan">
                <div className="space-y-3">
                  {rec.recommendedActions.map(action => (
                    <div key={action.step} className="flex items-start gap-3 p-4 border border-border rounded-sm bg-[#FAFAFA]">
                      <div className="w-7 h-7 rounded-full bg-[#0F0F1A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {action.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground mb-1">{action.action}</div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Bot size={9} /> {action.owner}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock size={9} /> {action.duration}
                          </span>
                          {action.requiresApproval && (
                            <span className="text-[9px] uppercase tracking-widest font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                              <AlertTriangle size={8} /> Approval Required
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[9px] shrink-0"
                        onClick={() => toast({ title: `Step ${action.step} Initiated`, description: action.action })}>
                        Initiate
                      </Button>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Required Human Approvals">
                  <div className="space-y-2">
                    {rec.requiredApprovals.map((approval, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-sm">
                        <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground leading-snug">{approval}</span>
                      </div>
                    ))}
                    {rec.requiredApprovals.length === 0 && (
                      <div className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> No human approvals required</div>
                    )}
                  </div>
                </InfoCard>

                <InfoCard label="Estimated Execution Timeline">
                  <div className="text-2xl font-bold font-mono text-foreground mb-2">{rec.estimatedExecutionTime}</div>
                  <div className="space-y-1.5 mt-3 border-t border-border pt-3">
                    {rec.recommendedActions.map(a => (
                      <div key={a.step} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Step {a.step}</span>
                        <span className="font-mono font-semibold text-foreground">{a.duration}</span>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              </div>
            </div>
          )}

          {/* ── AGENT CONTRIBUTIONS ───────────────────────────────────────── */}
          {activeTab === "agents" && (
            <div className="space-y-4">
              <InfoCard label="AI Agent Contributions">
                <div className="space-y-3">
                  {rec.affectedAgents.map(agent => {
                    const steps = rec.recommendedActions.filter(a => a.owner.includes(agent.replace(" AI", "").replace(" Optimizer", "")));
                    return (
                      <div key={agent} className="border border-border rounded-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot size={12} className="text-primary" />
                            </div>
                            <span className="font-semibold text-sm text-foreground">{agent}</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">Active</span>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {steps.length > 0
                            ? `Assigned to ${steps.length} execution step${steps.length > 1 ? "s" : ""}: ${steps.map(s => `Step ${s.step}`).join(", ")}`
                            : "Contributing to monitoring, analysis, and outcome verification for this recommendation."
                          }
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] mt-2 -ml-2"
                          onClick={() => navigate("/agent-studio")}>
                          View Agent Profile →
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </InfoCard>

              <InfoCard label="Primary Executing Workflow">
                <div className="p-3 bg-[#FAFAFA] border border-border rounded-sm flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{rec.agentWorkflow}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Primary agent: {rec.agentName}</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"
                    onClick={() => navigate("/workflow-studio")}>
                    <GitBranch size={10} /> Open in Mission Creator
                  </Button>
                </div>
              </InfoCard>
            </div>
          )}

          {/* ── KNOWLEDGE & LINEAGE ───────────────────────────────────────── */}
          {activeTab === "knowledge" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Related SOPs">
                  <div className="space-y-2">
                    {rec.relatedSOPs.map((sop, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-[#FAFAFA] border border-border rounded-sm cursor-pointer hover:border-primary/30 transition-colors"
                        onClick={() => navigate("/knowledge-studio")}>
                        <FileText size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground">{sop}</span>
                      </div>
                    ))}
                  </div>
                </InfoCard>

                <InfoCard label="Related Policies">
                  <div className="space-y-2">
                    {rec.relatedPolicies.map((policy, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-[#FAFAFA] border border-border rounded-sm cursor-pointer hover:border-primary/30 transition-colors"
                        onClick={() => navigate("/policy-studio")}>
                        <Shield size={11} className="text-primary shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground">{policy}</span>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Linked Workflows">
                  <div className="space-y-2">
                    {rec.linkedWorkflows.map((wf, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-[#FAFAFA] border border-border rounded-sm">
                        <div className="flex items-center gap-2">
                          <GitBranch size={11} className="text-blue-600 shrink-0" />
                          <span className="text-xs text-foreground">{wf}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[9px]"
                          onClick={() => navigate("/workflow-studio")}>Open →</Button>
                      </div>
                    ))}
                  </div>
                </InfoCard>

                <InfoCard label="Linked Missions">
                  <div className="space-y-2">
                    {rec.linkedMissions.map((mission, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-[#FAFAFA] border border-border rounded-sm">
                        <div className="flex items-center gap-2">
                          <Target size={11} className="text-violet-600 shrink-0" />
                          <span className="text-xs text-foreground">{mission}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[9px]"
                          onClick={() => navigate("/agentops")}>Open →</Button>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              </div>

              <InfoCard label="Full Decision Lineage">
                <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
                  {rec.decisionLineage.map((step, idx) => (
                    <div key={step.step} className="flex items-center shrink-0">
                      <div className="w-[180px]">
                        <div className="bg-[#FAFAFA] border border-border rounded-sm p-3">
                          <div className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center mb-1.5">
                            {idx + 1}
                          </div>
                          <div className="text-[9px] uppercase tracking-widest font-bold text-primary mb-1">{step.step}</div>
                          <p className="text-[10px] text-foreground leading-snug">{step.detail}</p>
                        </div>
                      </div>
                      {idx < rec.decisionLineage.length - 1 && (
                        <div className="w-8 flex items-center justify-center shrink-0 text-muted-foreground">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}

          {/* ── ROLLBACK & CONTINGENCY ────────────────────────────────────── */}
          {activeTab === "simulation" && (
            <div className="space-y-4">
              <InfoCard label="Rollback Strategy">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <Layers size={14} className="text-amber-600" />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{rec.rollbackStrategy}</p>
                </div>
              </InfoCard>

              <InfoCard label="Risk Assessment — Full Analysis">
                <p className="text-sm text-foreground leading-relaxed mb-4">{rec.riskAssessment}</p>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <div className="text-center p-3 bg-[#FAFAFA] border border-border rounded-sm">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Risk Level</div>
                    <div className={cn("text-sm font-bold uppercase", rec.riskLevel === "high" ? "text-red-600" : rec.riskLevel === "medium" ? "text-amber-600" : "text-emerald-600")}>
                      {rec.riskLevel}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-[#FAFAFA] border border-border rounded-sm">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Success Probability</div>
                    <div className="text-sm font-bold text-foreground">{rec.successProbability}%</div>
                  </div>
                  <div className="text-center p-3 bg-[#FAFAFA] border border-border rounded-sm">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Confidence</div>
                    <div className="text-sm font-bold text-primary">{rec.confidence}%</div>
                  </div>
                </div>
              </InfoCard>

              <InfoCard label="Execution Dependencies">
                <div className="space-y-2">
                  {rec.dependencies.map((dep, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-[#FAFAFA] border border-border rounded-sm">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground">{dep}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <InfoCard label="Impact Simulation">
                <div className="p-4 bg-[#FAFAFA] border border-border rounded-sm text-center">
                  <Activity size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-sm text-foreground font-semibold mb-1">Simulation Engine</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Run a Monte Carlo simulation across {rec.kpis.length} KPIs and {rec.affectedAgents.length} agents to validate projected outcomes before execution.
                  </p>
                  <Button className="bg-[#0F0F1A] text-white hover:bg-black text-[10px] h-8 px-4 gap-1.5"
                    onClick={() => { toast({ title: "Simulation Running", description: "Monte Carlo simulation started. Results ready in ~30 seconds." }); }}>
                    <FlaskConical size={10} /> Run Impact Simulation
                  </Button>
                </div>
              </InfoCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
