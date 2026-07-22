import { useEffect, useRef, useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { childrenOf, type Goal, type GoalLevel } from "@/data/goals-data";
import { generateAbuGoals, generateDeptGoals, generateEmployeeGoals } from "@/data/goal-agent";
import { BU_LIST } from "@/data/enterprise-data";
import { PEOPLE } from "@/data/people-data";
import { cn } from "@/lib/utils";
import { Target, Briefcase, Layers, User, Plus, X, Sparkles, Check, XCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { canEdit } from "@/lib/rbac";

const STATUS_CLS: Record<string, string> = {
  active: "bg-blue-50 text-blue-700 border-blue-200",
  "at-risk": "bg-amber-50 text-amber-700 border-amber-200",
  planning: "bg-gray-50 text-gray-600 border-gray-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const LEVEL_ICON: Record<GoalLevel, React.ElementType> = { enterprise: Target, abu: Briefcase, dept: Layers, employee: User };
const LEVEL_LABEL: Record<GoalLevel, string> = { enterprise: "Enterprise", abu: "ABU", dept: "Department", employee: "Employee" };
const NEXT_LEVEL: Record<Exclude<GoalLevel, "employee">, string> = { enterprise: "ABU", abu: "Department", dept: "Employee" };
const GENERATING_STEPS = ["Reading goal context…", "Identifying scope…", "Drafting sub-goals…"];

// ─── Generation control — only rendered for the role that owns this exact
// goal's level, so responsibility for generating/approving stays distributed
// (CXO only ever approves ABU-level breakdowns; ABU Heads only approve their
// own department breakdown; Dept Managers only approve their own employee
// breakdown). Nothing recurses automatically — each level's owner triggers
// their own step, on their own schedule.
function GoalGenerationControl({ goal, onUpdate }: { goal: Goal; onUpdate: (patch: Partial<Goal>) => void }) {
  const { role, currentBuId, persona, addGoals } = useAppContext();
  const [genStep, setGenStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (goal.level === "employee") return null;

  const owns =
    goal.level === "enterprise" ? role === "cxo" :
    goal.level === "abu" ? role === "abu_head" && currentBuId === goal.buId :
    role === "dept_manager" && persona.deptId === goal.deptId;

  if (!owns) return null;

  const generator = goal.level === "enterprise" ? generateAbuGoals : goal.level === "abu" ? generateDeptGoals : generateEmployeeGoals;
  const nextLabel = NEXT_LEVEL[goal.level];

  const startGeneration = () => {
    onUpdate({ genState: "generating" });
    setGenStep(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= GENERATING_STEPS.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onUpdate({ genState: "awaiting-approval", pendingChildren: generator(goal) });
      } else {
        setGenStep(step);
      }
    }, 450);
  };

  const approve = () => {
    if (goal.pendingChildren?.length) addGoals(goal.pendingChildren);
    onUpdate({ genState: undefined, pendingChildren: undefined });
  };
  const reject = () => onUpdate({ genState: undefined, pendingChildren: undefined });

  if (!goal.genState) {
    return (
      <button
        onClick={startGeneration}
        className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-sm border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <Sparkles size={11} /> Demo: Generate {nextLabel} Plan
      </button>
    );
  }

  if (goal.genState === "generating") {
    return (
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Loader2 size={11} className="animate-spin text-primary" />
        {GENERATING_STEPS[genStep]}
      </div>
    );
  }

  return (
    <div className="mt-2 bg-muted/30 border border-border rounded-sm p-2.5 space-y-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-foreground">
        Agent-Generated {nextLabel} Plan — Awaiting Your Approval
      </div>
      <div className="space-y-0.5">
        {goal.pendingChildren?.map((c) => (
          <div key={c.id} className="text-[10px] text-muted-foreground">• {c.title}</div>
        ))}
      </div>
      <div className="flex gap-2 pt-0.5">
        <Button size="sm" className="h-7 text-[10px] bg-foreground text-background hover:bg-foreground/90" onClick={approve}>
          <Check size={11} className="mr-1" /> Approve
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={reject}>
          <XCircle size={11} className="mr-1" /> Reject
        </Button>
      </div>
    </div>
  );
}

interface GoalNodeProps {
  goal: Goal;
  allGoals: Goal[];
  onUpdate: (id: string, patch: Partial<Goal>) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}

function GoalNode({ goal, allGoals, onUpdate, expandedIds, toggleExpand }: GoalNodeProps) {
  const { role, persona } = useAppContext();
  const kids = childrenOf(goal.id, allGoals);
  const hasKids = kids.length > 0;
  const isExpanded = expandedIds.has(goal.id);
  const bu = BU_LIST.find((b: any) => b.id === goal.buId);
  const dept = bu?.departments.find((d: any) => d.id === goal.deptId);
  const assignee = goal.assigneePersonId ? PEOPLE.find((p) => p.id === goal.assigneePersonId) : undefined;
  const LevelIcon = LEVEL_ICON[goal.level];

  const canToggleDone = goal.level === "employee" && (
    role === "cxo" || role === "developer" ||
    (role === "dept_manager" && persona.deptId === goal.deptId) ||
    (role === "abu_head" && persona.buId === goal.buId) ||
    assignee?.name === persona.name
  );

  return (
    <div className="mb-2">
      <div
        onClick={() => hasKids && toggleExpand(goal.id)}
        className={cn(
          "flex items-start gap-3 bg-white border border-border rounded-sm shadow-sm p-3 transition-colors",
          hasKids && "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02]"
        )}
      >
        {hasKids ? (
          isExpanded ? <ChevronDown size={14} className="text-primary shrink-0 mt-0.5" /> : <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
        ) : (
          <LevelIcon size={14} className="text-primary shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-bold text-foreground">{goal.title}</span>
            <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", STATUS_CLS[goal.status])}>{goal.status}</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/70">{LEVEL_LABEL[goal.level]}</span>
            {bu && <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{bu.name}</span>}
            {dept && <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{dept.name}</span>}
            {assignee && <span className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-1.5 py-0.5 rounded-sm">{assignee.name}</span>}
          </div>
          <div className="text-[11px] text-muted-foreground">{goal.description}</div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Target: {goal.targetDate}</span>
            {hasKids && (
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                {kids.length} Sub-goal{kids.length === 1 ? "" : "s"}
              </span>
            )}
            {canToggleDone && (
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate(goal.id, { status: goal.status === "done" ? "active" : "done" }); }}
                className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border",
                  goal.status === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-muted-foreground border-border")}
              >
                {goal.status === "done" ? "Done" : "Mark Done"}
              </button>
            )}
          </div>
          {/* Generation controls are interactive on their own — stop the
              click here so generating/approving doesn't also toggle the tree. */}
          <div onClick={(e) => e.stopPropagation()}>
            <GoalGenerationControl goal={goal} onUpdate={(patch) => onUpdate(goal.id, patch)} />
          </div>
        </div>
      </div>

      {hasKids && isExpanded && (
        <div className="relative ml-[19px] pl-5 border-l-2 border-border">
          {kids.map((k) => (
            <div key={k.id} className="relative pt-2">
              {/* connector from the trunk to this sub-goal's card */}
              <span className="absolute -left-5 top-[22px] w-5 h-0.5 bg-border" />
              <GoalNode goal={k} allGoals={allGoals} onUpdate={onUpdate} expandedIds={expandedIds} toggleExpand={toggleExpand} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function collectSubtree(root: Goal, allGoals: Goal[]): Goal[] {
  return [root, ...childrenOf(root.id, allGoals).flatMap((c) => collectSubtree(c, allGoals))];
}

export default function Goals() {
  const { goals, addGoal, updateGoal, role, currentBuId, persona } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", targetDate: "", status: "active" as Goal["status"] });
  const { toast } = useToast();
  const isCxo = role === "cxo";

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => setExpandedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const submit = () => {
    if (!form.title.trim()) {
      toast({ title: "Missing title", description: "Give the goal a name.", variant: "destructive" });
      return;
    }
    const goal: Goal = {
      id: `goal-${Date.now()}`, parentId: null, level: "enterprise",
      title: form.title, description: form.description, status: form.status,
      targetDate: form.targetDate || "—", buId: null,
    };
    addGoal(goal);
    setShowModal(false);
    setForm({ title: "", description: "", targetDate: "", status: "active" });
    toast({ title: "Goal Created", description: `"${goal.title}" added. Generate an ABU plan below when you're ready — which ABUs, departments, and people take it from there is each level's own call.` });
  };

  // Each role's own entry points into the tree — CXO sees every enterprise
  // goal; ABU Head sees their own ABU-level goals directly (not the
  // enterprise parent); Dept Manager sees their own department-level goals;
  // Employee sees just their own assigned leaf tasks.
  const roots =
    isCxo || role === "developer" ? goals.filter(g => g.parentId === null)
    : role === "abu_head" ? goals.filter(g => g.level === "abu" && g.buId === currentBuId)
    : role === "dept_manager" ? goals.filter(g => g.level === "dept" && g.deptId === persona.deptId)
    : goals.filter(g => g.level === "employee" && PEOPLE.find(p => p.id === g.assigneePersonId)?.name === persona.name);

  const visibleGoals = roots.flatMap((r) => collectSubtree(r, goals));

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="GOALS" metrics={[{ label: "GOALS", value: visibleGoals.length }]} />

      <div className="p-6 max-w-[1200px] mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground max-w-xl">
            {isCxo
              ? "Set the high-level goal — the agent breaks it down into ABU, department, and employee plans, each approved by the role that owns it."
              : "Every task traces back to a company goal — agents know what to do and why."}
          </p>
          {isCxo && (
            <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowModal(true)}>
              <Plus size={14} className="mr-2" /> New Goal
            </Button>
          )}
        </div>

        {roots.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-sm p-10 text-center text-sm text-muted-foreground">
            No goals yet.
          </div>
        ) : (
          <div>{roots.map(g => <GoalNode key={g.id} goal={g} allGoals={goals} onUpdate={updateGoal} expandedIds={expandedIds} toggleExpand={toggleExpand} />)}</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-border rounded-sm shadow-xl w-[480px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">New Goal</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Goal Title *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Target Date</label>
                  <input type="date" className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Status</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Goal["status"] }))}>
                    <option value="active">Active</option>
                    <option value="at-risk">At Risk</option>
                    <option value="planning">Planning</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Description</label>
                <textarea className="w-full border border-border rounded-sm px-3 py-2 text-sm min-h-[70px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={submit}>Create Goal</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
