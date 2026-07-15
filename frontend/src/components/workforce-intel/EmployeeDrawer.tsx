import { cn } from "@/lib/utils";
import type { Employee } from "@/data/workforce-intelligence-data";
import { X, Briefcase, Award, Calendar, DollarSign, TrendingUp, Users, Lightbulb } from "lucide-react";

const RISK_CLS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

function aiRecommendation(e: Employee): string {
  if (e.risk === "critical") return `${e.name} shows multiple risk signals — recommend a 1:1 check-in this week and a comp/role review.`;
  if (e.utilization > 105) return `${e.name} is over-utilized at ${e.utilization}% — consider redistributing current projects.`;
  if (e.performance >= 90) return `${e.name} is a top performer — consider for stretch assignment or promotion track.`;
  return `${e.name} is tracking normally — no action needed.`;
}

export function EmployeeDrawer({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
  const isOpen = !!employee;
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[420px] bg-white border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-200",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {employee && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {employee.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{employee.name}</div>
                  <div className="text-[11px] text-muted-foreground">{employee.title}</div>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 rounded-sm px-2.5 py-2"><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Department</div><div className="font-medium text-foreground">{employee.department}</div></div>
                <div className="bg-muted/30 rounded-sm px-2.5 py-2"><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Office</div><div className="font-medium text-foreground">{employee.office}</div></div>
                <div className="bg-muted/30 rounded-sm px-2.5 py-2"><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Reports To</div><div className="font-medium text-foreground">{employee.managerName}</div></div>
                <div className="bg-muted/30 rounded-sm px-2.5 py-2"><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Work Mode</div><div className="font-medium text-foreground capitalize">{employee.workMode}</div></div>
              </div>

              <div className={cn("rounded-sm border px-2.5 py-2 flex items-center justify-between", RISK_CLS[employee.risk])}>
                <span className="text-[10px] uppercase tracking-widest font-bold">Attrition Risk</span>
                <span className="text-xs font-bold uppercase">{employee.risk}</span>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp size={11} /> Performance</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/30 rounded-sm py-2"><div className="text-sm font-bold font-mono text-foreground">{employee.performance}%</div><div className="text-[9px] text-muted-foreground">Performance</div></div>
                  <div className="bg-muted/30 rounded-sm py-2"><div className="text-sm font-bold font-mono text-foreground">{employee.engagement}%</div><div className="text-[9px] text-muted-foreground">Engagement</div></div>
                  <div className="bg-muted/30 rounded-sm py-2"><div className="text-sm font-bold font-mono text-foreground">{employee.utilization}%</div><div className="text-[9px] text-muted-foreground">Utilization</div></div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Award size={11} /> Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {employee.skills.map((s) => <span key={s} className="text-[10px] bg-muted px-2 py-0.5 rounded-sm border border-border/60">{s}</span>)}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Briefcase size={11} /> Current Projects</div>
                {employee.currentProjects.length === 0
                  ? <div className="text-xs text-muted-foreground">No active project assignment.</div>
                  : employee.currentProjects.map((p) => <div key={p} className="text-xs text-foreground bg-primary/5 border border-primary/20 rounded-sm px-2 py-1 mb-1">{p}</div>)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 rounded-sm px-2.5 py-2"><div className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><DollarSign size={9} /> Comp Band</div><div className="font-medium text-foreground">{employee.salaryBand} · ${employee.salaryUsd.toLocaleString()}</div></div>
                <div className="bg-muted/30 rounded-sm px-2.5 py-2"><div className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar size={9} /> Tenure</div><div className="font-medium text-foreground">{employee.tenureYears} yrs</div></div>
              </div>

              <div className="text-xs text-muted-foreground">Last review: <span className="text-foreground font-medium">{employee.lastReviewDate}</span></div>

              <div className="bg-amber-50 border border-amber-200 rounded-sm px-3 py-2.5 text-xs text-amber-800 flex items-start gap-2">
                <Lightbulb size={13} className="shrink-0 mt-0.5" />
                <span>{aiRecommendation(employee)}</span>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Users size={11} /> Manager Notes</div>
                <div className="text-xs text-muted-foreground italic">"Consistent contributor, good cross-team collaborator." — {employee.managerName}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
