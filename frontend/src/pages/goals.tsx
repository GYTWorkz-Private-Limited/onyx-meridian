import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GOAL_TREE, childrenOf, rootGoals, type Goal } from "@/data/goals-data";
import { BU_LIST } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { Target, Plus, X } from "lucide-react";

const STATUS_CLS: Record<string, string> = {
  active: "bg-blue-50 text-blue-700 border-blue-200",
  "at-risk": "bg-amber-50 text-amber-700 border-amber-200",
  planning: "bg-gray-50 text-gray-600 border-gray-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function GoalNode({ goal, depth, allGoals }: { goal: Goal; depth: number; allGoals: Goal[] }) {
  const kids = childrenOf(goal.id).filter(g => allGoals.includes(g));
  const bu = BU_LIST.find((b: any) => b.id === goal.buId);
  return (
    <div style={{ marginLeft: depth * 18 }} className="mb-2">
      <div className="flex items-start gap-3 bg-white border border-border rounded-sm shadow-sm p-3">
        <Target size={14} className="text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-bold text-foreground">{goal.title}</span>
            <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", STATUS_CLS[goal.status])}>{goal.status}</span>
            {bu && <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{bu.name}</span>}
          </div>
          <div className="text-[11px] text-muted-foreground">{goal.description}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Target: {goal.targetDate}</div>
        </div>
      </div>
      {kids.map(k => <GoalNode key={k.id} goal={k} depth={depth + 1} allGoals={allGoals} />)}
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>(GOAL_TREE);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", parentId: "", targetDate: "", status: "active" as Goal["status"] });
  const { toast } = useToast();

  const submit = () => {
    if (!form.title.trim()) {
      toast({ title: "Missing title", description: "Give the goal a name.", variant: "destructive" });
      return;
    }
    const goal: Goal = {
      id: `goal-${Date.now()}`, parentId: form.parentId || null, title: form.title,
      description: form.description, status: form.status, targetDate: form.targetDate || "—", buId: null,
    };
    setGoals(prev => [...prev, goal]);
    setShowModal(false);
    setForm({ title: "", description: "", parentId: "", targetDate: "", status: "active" });
    toast({ title: "Goal Created", description: `"${goal.title}" added to the goal tree.` });
  };

  const roots = goals.filter(g => g.parentId === null);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="GOALS" metrics={[{ label: "GOALS", value: goals.length }]} />

      <div className="p-6 max-w-[1200px] mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground max-w-xl">
            Every task traces back to a company goal — agents know what to do and why.
          </p>
          <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowModal(true)}>
            <Plus size={14} className="mr-2" /> New Goal
          </Button>
        </div>

        {roots.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-sm p-10 text-center text-sm text-muted-foreground">
            No goals yet. Define the company's first objective.
          </div>
        ) : (
          <div>{roots.map(g => <GoalNode key={g.id} goal={g} depth={0} allGoals={goals} />)}</div>
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
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Parent Goal (optional)</label>
                <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <option value="">— None (top-level) —</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
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
