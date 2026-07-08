import { useLocation, useParams } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { ArrowLeft, Bot, CheckCircle2, Clock, Play, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const WORKFLOW_STEPS: Record<string, { label: string; status: "done" | "running" | "pending" }[]> = {
  default: [
    { label: "Signal detected & validated",       status: "done" },
    { label: "Prism recommendation generated",    status: "done" },
    { label: "Workflow instantiated",             status: "done" },
    { label: "Agent assigned & briefed",          status: "running" },
    { label: "Tasks dispatched to sub-agents",    status: "pending" },
    { label: "Human approval requested",          status: "pending" },
    { label: "Action executed & logged",          status: "pending" },
    { label: "Outcome recorded & linked to KPI",  status: "pending" },
  ],
};

const AUDIT_LOG = [
  { time: "08:42:01", event: "Workflow instance created",   actor: "Prism Intelligence Engine", type: "system" },
  { time: "08:42:04", event: "Agent assigned: AI Employee", actor: "Workforce Orchestrator",    type: "system" },
  { time: "08:42:07", event: "Task payload dispatched",     actor: "Agent Employee",             type: "agent" },
  { time: "08:43:15", event: "Context loading: policy + memory", actor: "Agent Employee",       type: "agent" },
  { time: "08:44:30", event: "Sub-task 1/4 completed",      actor: "Agent Employee",             type: "agent" },
  { time: "08:45:01", event: "Awaiting human approval gate", actor: "Governance Engine",         type: "system" },
];

export default function WorkflowView() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { workflows, updateWorkflowStatus } = useAppContext();
  const { toast } = useToast();

  const wf = workflows.find(w => w.id === params.id);

  const handleAction = (action: "pause" | "cancel" | "retry") => {
    if (!wf) return;
    if (action === "cancel") {
      updateWorkflowStatus(wf.id, "failed");
      toast({ title: "Workflow Cancelled", description: `"${wf.title}" has been cancelled.` });
    } else if (action === "retry") {
      updateWorkflowStatus(wf.id, "running");
      toast({ title: "Workflow Restarted", description: `"${wf.title}" is running again.` });
    } else {
      toast({ description: "Workflow paused (all active tasks will complete before halting)." });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="WORKFLOW VIEW" />
      <div className="p-6 max-w-[900px] mx-auto w-full">
        <button
          onClick={() => navigate("/intelligence")}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Intelligence Prism
        </button>

        {!wf ? (
          <div className="bg-white border border-border rounded-sm p-10 text-center shadow-sm">
            <p className="text-muted-foreground text-sm">Workflow not found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white border border-border rounded-sm shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold",
                      wf.status === "running"   ? "bg-blue-50 text-blue-700 border-blue-200" :
                      wf.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      wf.status === "failed"    ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {wf.status === "running" && <span className="inline-block w-1 h-1 rounded-full bg-blue-500 animate-pulse mr-1" />}
                      {wf.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-1">{wf.title}</h2>
                  <p className="text-sm text-muted-foreground">{wf.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {wf.status === "running" && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest" onClick={() => handleAction("pause")}>
                        Pause
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest text-destructive border-red-200" onClick={() => handleAction("cancel")}>
                        Cancel
                      </Button>
                    </>
                  )}
                  {wf.status === "failed" && (
                    <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest bg-primary text-white" onClick={() => handleAction("retry")}>
                      <RotateCcw size={10} className="mr-1" /> Retry
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", wf.status === "completed" ? "bg-emerald-500" : wf.status === "failed" ? "bg-red-500" : "bg-primary")}
                    style={{ width: `${wf.progress}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-foreground">{wf.progress}%</span>
              </div>

              <div className="mt-3 flex items-center gap-6 text-[10px] text-muted-foreground">
                <span><Bot size={10} className="inline mr-1" />{wf.agent}</span>
                <span><Clock size={10} className="inline mr-1" />Started {wf.startedAt}</span>
                <span>ID: <span className="font-mono">{wf.id}</span></span>
              </div>
            </div>

            {/* Execution steps */}
            <div className="bg-white border border-border rounded-sm shadow-sm p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Execution Steps</h3>
              <div className="space-y-2">
                {(WORKFLOW_STEPS.default).map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {step.status === "done" ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : step.status === "running" ? (
                      <Play size={16} className="text-blue-500 shrink-0 animate-pulse" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                    )}
                    <span className={cn(
                      "text-xs",
                      step.status === "done" ? "text-foreground" :
                      step.status === "running" ? "text-primary font-semibold" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                    {step.status === "running" && (
                      <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest ml-auto">
                        In Progress
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Audit log */}
            <div className="bg-white border border-border rounded-sm shadow-sm p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Audit Log</h3>
              <div className="space-y-1.5">
                {AUDIT_LOG.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-[11px]">
                    <span className="font-mono text-muted-foreground shrink-0 w-16">{entry.time}</span>
                    <span className={cn(
                      "text-[9px] uppercase tracking-widest px-1 py-0.5 rounded-sm border font-bold shrink-0",
                      entry.type === "agent" ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-muted text-muted-foreground border-border"
                    )}>{entry.type}</span>
                    <span className="text-foreground">{entry.event}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">{entry.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
