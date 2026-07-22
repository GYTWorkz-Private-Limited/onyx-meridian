import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_LIST, type Project } from "@/data/projects-data";
import { GOAL_TREE } from "@/data/goals-data";
import { MFG_AGENTS } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { FolderKanban, Plus, X, Calendar, Target } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { canEdit } from "@/lib/rbac";
import { CxoProjectWizard } from "@/pages/projects-wizard-cxo";

const STATUS_CLS: Record<string, string> = {
  planning: "bg-gray-50 text-gray-600 border-gray-200",
  active: "bg-blue-50 text-blue-700 border-blue-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(PROJECT_LIST);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", leadAgentId: MFG_AGENTS[0].id, goalId: GOAL_TREE[0].id, status: "planning" as Project["status"], targetDate: "" });
  const { toast } = useToast();
  const { role } = useAppContext();
  const canManage = canEdit(role, "projects");
  const isCxo = role === "cxo";

  const submit = () => {
    if (!form.name.trim()) {
      toast({ title: "Missing name", description: "Give the project a name.", variant: "destructive" });
      return;
    }
    const lead = MFG_AGENTS.find(a => a.id === form.leadAgentId);
    const project: Project = {
      id: `proj-${Date.now()}`, name: form.name, description: form.description,
      leadAgentId: form.leadAgentId, goalId: form.goalId, buId: (lead as any)?.bu ?? "manufacturing",
      status: form.status, color: "#3a86d4", targetDate: form.targetDate || "—", progress: 0,
    };
    setProjects(prev => [project, ...prev]);
    setShowModal(false);
    toast({ title: "Project Created", description: `"${project.name}" added.` });
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="PROJECTS" metrics={[{ label: "PROJECTS", value: projects.length }]} />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Group related tasks under a lead agent, a goal, and a target date.</p>
          {canManage && (
            <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowModal(true)}>
              <Plus size={14} className="mr-2" /> New Project
            </Button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-sm p-10 text-center text-sm text-muted-foreground">No projects yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(p => {
              const lead = MFG_AGENTS.find(a => a.id === p.leadAgentId);
              const goal = GOAL_TREE.find(g => g.id === p.goalId);
              return (
                <div key={p.id} className="bg-white border border-border rounded-sm shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-bold text-foreground flex-1">{p.name}</span>
                    <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", STATUS_CLS[p.status])}>{p.status}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><FolderKanban size={11} /> {lead?.name ?? "Unassigned"}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {p.targetDate}</span>
                  </div>
                  {goal && (
                    <div className="flex items-center gap-1 text-[10px] text-primary bg-primary/5 border border-primary/20 rounded-sm px-2 py-1">
                      <Target size={10} /> {goal.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && isCxo && (
        <CxoProjectWizard
          onClose={() => setShowModal(false)}
          onCreate={(project) => {
            setProjects((prev) => [project, ...prev]);
            setShowModal(false);
          }}
        />
      )}

      {showModal && !isCxo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-border rounded-sm shadow-xl w-[480px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">New Project</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Project Name *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Lead Agent</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.leadAgentId} onChange={e => setForm(f => ({ ...f, leadAgentId: e.target.value }))}>
                    {MFG_AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Goal</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.goalId} onChange={e => setForm(f => ({ ...f, goalId: e.target.value }))}>
                    {GOAL_TREE.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Target Date</label>
                  <input type="date" className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Status</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Project["status"] }))}>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
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
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={submit}>Create Project</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
