import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { SOP_CATALOG } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { ChevronRight, ScrollText, Plus, ArrowRight, CheckCircle2, AlertTriangle, Bot, Users, Settings, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { accessLevel } from "@/lib/rbac";

const RISK_STYLE: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50 border-emerald-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  high: "text-red-600 bg-red-50 border-red-200",
};

const STATUS_STYLE: Record<string, string> = {
  active: "text-emerald-600 bg-emerald-50 border-emerald-200",
  "under-review": "text-amber-600 bg-amber-50 border-amber-200",
  draft: "text-muted-foreground bg-muted border-border",
};

export default function SopPage() {
  const [selected, setSelected] = useState("sop1");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { role } = useAppContext();
  const sop = SOP_CATALOG.find((s) => s.id === selected) ?? SOP_CATALOG[0];
  // Employee gets "scoped" (suggest edits only); Manager/Developer get "full" direct edit.
  const canEditDirectly = accessLevel(role, "sop") === "full";

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar moduleName="SOP FRAMEWORK" />

      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Governance</span>
          <ChevronRight size={10} />
          <span className="text-foreground font-semibold">SOP Framework</span>
        </div>
        {canEditDirectly && (
          <button onClick={() => navigate("/workflow-studio")} className="flex items-center gap-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/90 transition-colors">
            <Plus size={11} />
            New SOP
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[240px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground">Standard Operating Procedures</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {SOP_CATALOG.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-border/40 transition-colors",
                  selected === s.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40"
                )}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <ScrollText size={10} className={selected === s.id ? "text-primary mt-0.5 shrink-0" : "text-muted-foreground mt-0.5 shrink-0"} />
                  <span className={cn("text-[10px] font-bold leading-tight", selected === s.id ? "text-primary" : "text-foreground")}>
                    {s.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm border", STATUS_STYLE[s.status])}>
                    {s.status === "under-review" ? "Review" : s.status}
                  </span>
                  <span className="text-[8px] text-muted-foreground">{s.automation}% auto</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-lg font-bold text-foreground mb-1">{sop.title}</div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-muted-foreground">Owner: <strong className="text-foreground">{sop.owner}</strong></span>
                <span className="text-[9px] font-mono text-muted-foreground">{sop.version}</span>
                <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded-sm border", RISK_STYLE[sop.risk])}>
                  {sop.risk} risk
                </span>
                <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded-sm border", STATUS_STYLE[sop.status])}>
                  {sop.status === "under-review" ? "Under Review" : sop.status.charAt(0).toUpperCase() + sop.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {canEditDirectly ? (
                <button onClick={() => toast({ title: "Edit Mode", description: `Editing ${sop.title} — changes auto-saved` })} className="flex items-center gap-1.5 border border-border bg-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-muted/60">
                  <Settings size={10} />Edit
                </button>
              ) : (
                <button onClick={() => toast({ title: "Edit Suggested", description: `Your suggested changes to ${sop.title} were sent to the SOP owner for review.` })} className="flex items-center gap-1.5 border border-border bg-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-muted/60">
                  <Settings size={10} />Suggest Edit
                </button>
              )}
              <button onClick={() => navigate("/agentops")} className="flex items-center gap-1.5 bg-primary text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/90">
                <Play size={10} />Execute
              </button>
            </div>
          </div>

          {/* Automation Score */}
          <div className="bg-white border border-border rounded-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Automation Coverage</div>
              <div className="text-sm font-bold font-mono text-foreground">{sop.automation}%</div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", sop.automation >= 80 ? "bg-emerald-500" : sop.automation >= 60 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${sop.automation}%` }}
              />
            </div>
          </div>

          {/* Workflow Visual */}
          <div className="bg-white border border-border rounded-sm p-4 mb-4">
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Workflow</div>
            <div className="flex items-center gap-1 flex-wrap">
              {sop.workflow.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "border rounded-sm px-3 py-2 text-center",
                    i === 0 ? "bg-primary/5 border-primary/30" :
                    i === sop.workflow.length - 1 ? "bg-emerald-50 border-emerald-200" :
                    "bg-white border-border"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold mx-auto mb-1",
                      i === 0 ? "bg-primary text-white" :
                      i === sop.workflow.length - 1 ? "bg-emerald-500 text-white" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {i === sop.workflow.length - 1 ? "✓" : i + 1}
                    </div>
                    <div className="text-[8px] font-semibold text-foreground leading-tight whitespace-nowrap">{step}</div>
                  </div>
                  {i < sop.workflow.length - 1 && (
                    <ArrowRight size={10} className="text-muted-foreground mx-1 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3-column Details */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Bot size={10} />AI Agents Required
              </div>
              {sop.agents.map((a) => (
                <div key={a} className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[10px] font-semibold text-foreground">{a}</span>
                </div>
              ))}
            </div>
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Users size={10} />Humans Required
              </div>
              {sop.humans.map((h) => (
                <div key={h} className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-[10px] text-foreground">{h}</span>
                </div>
              ))}
            </div>
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Systems</div>
              <div className="flex flex-wrap gap-1.5">
                {sop.systems.map((s) => (
                  <span key={s} className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-sm font-bold">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">KPIs Impacted</div>
              <div className="space-y-1.5">
                {sop.kpis.map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                    <span className="text-[10px] font-semibold text-foreground">{k}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Policies</div>
              <div className="space-y-1.5">
                {sop.policies.map((p) => (
                  <div key={p} className="flex items-center gap-2">
                    <AlertTriangle size={10} className="text-amber-500 shrink-0" />
                    <span className="text-[10px] text-foreground">{p}</span>
                  </div>
                ))}
              </div>
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mt-3 mb-2">Linked Documents</div>
              <div className="space-y-1">
                {sop.linkedDocs.map((d) => (
                  <button key={d} className="block text-[9px] text-primary hover:underline">{d}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
