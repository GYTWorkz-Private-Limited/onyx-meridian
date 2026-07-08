import { useState } from "react";
import { useGetTasks } from "@workspace/api-client-react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import React from "react";
import {
  Plus, Filter, MoreHorizontal, CheckCircle2, Clock,
  CircleDashed, AlertCircle, ChevronDown, ChevronRight,
  User, Bot, Users, Lightbulb, Workflow, Target, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface NewTask {
  title: string;
  owner: string;
  dueDate: string;
  priority: "p1" | "p2" | "p3";
  businessUnit: string;
}

const BU_OPTIONS = ["Revenue Intelligence", "Finance Intelligence", "Procurement Intelligence", "Customer Intelligence", "Engineering Intelligence", "Supply Chain Intelligence"];
const PRIORITY_OPTIONS: { value: "p1" | "p2" | "p3"; label: string; cls: string }[] = [
  { value: "p1", label: "P1 Critical", cls: "border-red-300 bg-red-50 text-red-700" },
  { value: "p2", label: "P2 High",     cls: "border-amber-300 bg-amber-50 text-amber-700" },
  { value: "p3", label: "P3 Normal",   cls: "border-border bg-muted text-muted-foreground" },
];

export default function Tasks() {
  const { data: apiTasks, isLoading } = useGetTasks();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const { toast } = useToast();

  const [form, setForm] = useState<NewTask>({
    title: "", owner: "", dueDate: "", priority: "p2", businessUnit: BU_OPTIONS[0],
  });

  const tasks = [...(apiTasks ?? []), ...localTasks];
  const filtered = filterStatus === "all" ? tasks : tasks.filter(t => t.status === filterStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'in-progress': return <Clock size={16} className="text-primary" />;
      case 'blocked':     return <AlertCircle size={16} className="text-destructive" />;
      default:            return <CircleDashed size={16} className="text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, JSX.Element> = {
      'done':        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase tracking-widest rounded-sm">DONE</Badge>,
      'in-progress': <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase tracking-widest rounded-sm">IN PROGRESS</Badge>,
      'blocked':     <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] uppercase tracking-widest rounded-sm">BLOCKED</Badge>,
    };
    return map[status] ?? <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] uppercase tracking-widest rounded-sm">TO DO</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, JSX.Element> = {
      'p1': <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase tracking-widest text-[9px] rounded-sm">P1 CRITICAL</Badge>,
      'p2': <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-widest text-[9px] rounded-sm">P2 HIGH</Badge>,
    };
    return map[priority] ?? <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 uppercase tracking-widest text-[9px] rounded-sm">P3 NORMAL</Badge>;
  };

  const getOwnerTypeBadge = (ownerType: string) => {
    if (ownerType === 'ai') return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-sm">
        <Bot size={10} /> AI Employee
      </span>
    );
    if (ownerType === 'shared') return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-sm">
        <Users size={10} /> Shared
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-sm">
        <User size={10} /> Human
      </span>
    );
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const submitTask = () => {
    if (!form.title.trim() || !form.owner.trim() || !form.dueDate) {
      toast({ title: "Missing fields", description: "Please fill in Title, Owner, and Due Date.", variant: "destructive" });
      return;
    }
    const newTask = {
      id: `local-${Date.now()}`,
      title: form.title,
      owner: form.owner,
      dueDate: form.dueDate,
      priority: form.priority,
      status: "todo",
      linkedKpi: "—",
      department: form.businessUnit,
      ownerType: "human",
    };
    setLocalTasks(prev => [newTask, ...prev]);
    setShowModal(false);
    setForm({ title: "", owner: "", dueDate: "", priority: "p2", businessUnit: BU_OPTIONS[0] });
    toast({ title: "Task Created", description: `"${newTask.title}" added to the registry.` });
  };

  const openCnt  = tasks.filter(t => t.status !== 'done').length;
  const blockedCnt = tasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="TASK & ACCOUNTABILITY REGISTRY"
        metrics={[
          { label: "OPEN TASKS", value: openCnt },
          { label: "BLOCKED",    value: blockedCnt },
          { label: "TOTAL",      value: tasks.length },
        ]}
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-4">

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Filter Panel", description: "Advanced filters: assignee, date range, linked KPI" })} className="h-8 text-xs bg-white border-border text-foreground hover:bg-muted">
              <Filter size={14} className="mr-2" /> Filter
            </Button>
            {["all", "todo", "in-progress", "blocked", "done"].map(s => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className={cn("h-8 text-xs bg-white border-border hover:bg-muted capitalize", filterStatus === s && "border-primary text-primary bg-primary/5")}
                onClick={() => setFilterStatus(s)}
              >
                {s === "all" ? "All" : s.replace("-", " ")}
              </Button>
            ))}
          </div>
          <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium" onClick={() => setShowModal(true)}>
            <Plus size={14} className="mr-2" /> NEW TASK
          </Button>
        </div>

        {/* New Task Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white border border-border rounded-sm shadow-xl w-[520px] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">New Task</h3>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Task Title *</label>
                  <input
                    className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                    placeholder="e.g. Review APAC Pipeline Report"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Owner *</label>
                    <input
                      className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                      placeholder="e.g. Sarah Chen"
                      value={form.owner}
                      onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Due Date *</label>
                    <input
                      type="date"
                      className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                        className={cn("flex-1 text-[10px] uppercase tracking-widest font-bold px-3 py-2 border rounded-sm transition-colors", p.cls, form.priority === p.value ? "ring-2 ring-primary/30" : "opacity-60 hover:opacity-100")}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Business Unit</label>
                  <select
                    className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                    value={form.businessUnit}
                    onChange={e => setForm(f => ({ ...f, businessUnit: e.target.value }))}
                  >
                    {BU_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-5 flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={submitTask}>Create Task</Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3 font-medium w-8"></th>
                  <th className="px-4 py-3 font-medium w-8"></th>
                  <th className="px-4 py-3 font-medium">Task Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Owner Type</th>
                  <th className="px-4 py-3 font-medium">Linked KPI</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((task) => {
                  const t = task as any;
                  const isExpanded = expandedRow === task.id;
                  return (
                    <React.Fragment key={task.id}>
                      <tr
                        className={cn("hover:bg-muted/30 transition-colors group cursor-pointer", isExpanded && "bg-muted/20")}
                        onClick={() => setExpandedRow(prev => prev === task.id ? null : task.id)}
                      >
                        <td className="px-4 py-3 align-middle">{getStatusIcon(task.status)}</td>
                        <td className="px-4 py-3 align-middle text-muted-foreground">
                          {isExpanded
                            ? <ChevronDown size={14} className="text-primary" />
                            : <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{task.title}</div>
                          {t.department && <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{t.department}</div>}
                        </td>
                        <td className="px-4 py-3 align-middle">{getStatusBadge(task.status)}</td>
                        <td className="px-4 py-3 align-middle">{getPriorityBadge(task.priority)}</td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                              t.ownerType === 'ai' ? "bg-violet-100 text-violet-700" : t.ownerType === 'shared' ? "bg-teal-100 text-teal-700" : "bg-primary/10 text-primary"
                            )}>
                              {t.ownerType === 'ai' ? <Bot size={11} /> : getInitials(task.owner)}
                            </div>
                            <span className="text-xs text-muted-foreground">{task.owner}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">{getOwnerTypeBadge(t.ownerType || 'human')}</td>
                        <td className="px-4 py-3 align-middle">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-sm border border-border/50">{task.linkedKpi}</span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="text-xs font-mono text-muted-foreground">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle text-right" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => toast({ title: "Task Actions", description: "Edit · Duplicate · Move · Archive" })} className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={16} />
                          </Button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${task.id}-lineage`} className="bg-[#FAFBFC]">
                          <td colSpan={10} className="px-6 py-4 border-b border-border">
                            <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Task Lineage</div>
                            <div className="flex items-stretch gap-0">
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                  <Lightbulb size={13} className="text-amber-600" />
                                </div>
                                <div className="w-px flex-1 bg-border mt-1" />
                              </div>
                              <div className="ml-3 mb-4 flex-1">
                                <div className="text-[10px] uppercase tracking-widest font-semibold text-amber-600 mb-0.5">Recommendation</div>
                                <div className="text-xs text-foreground">{t.linkedRecommendation || "AI-generated recommendation"}</div>
                              </div>
                              <div className="w-8" />
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                                  <Workflow size={13} className="text-blue-600" />
                                </div>
                                <div className="w-px flex-1 bg-border mt-1" />
                              </div>
                              <div className="ml-3 mb-4 flex-1">
                                <div className="text-[10px] uppercase tracking-widest font-semibold text-blue-600 mb-0.5">Workflow</div>
                                <div className="text-xs text-foreground">{t.workflow || "—"}</div>
                              </div>
                              <div className="w-8" />
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                  <CheckCircle2 size={13} className="text-primary" />
                                </div>
                                <div className="w-px flex-1 bg-border mt-1" />
                              </div>
                              <div className="ml-3 mb-4 flex-1">
                                <div className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-0.5">Task <span className="bg-primary/10 px-1 py-0.5 rounded-sm">current</span></div>
                                <div className="text-xs text-foreground">{task.title}</div>
                              </div>
                              <div className="w-8" />
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                                  <Target size={13} className="text-emerald-600" />
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="text-[10px] uppercase tracking-widest font-semibold text-emerald-600 mb-0.5">Expected Outcome</div>
                                <div className="text-xs font-mono font-medium text-emerald-700">{t.expectedOutcome || "—"}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-sm">No tasks found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
