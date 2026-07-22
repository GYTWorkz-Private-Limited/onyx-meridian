import { useMemo, useState } from "react";
import { useGetTasks, useCreateTask } from "@/lib/api";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { isDeptScoped } from "@/lib/rbac";
import { BU_LIST, KPI_CATALOG } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { Bot, User, Users, Plus, X, LayoutGrid, Table2, ArrowUpDown } from "lucide-react";

const COLUMNS: { id: string; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

const PRIORITY_CLS: Record<string, string> = {
  p1: "bg-red-50 text-red-700 border-red-200",
  p2: "bg-amber-50 text-amber-700 border-amber-200",
  p3: "bg-gray-50 text-gray-600 border-gray-200",
};

function OwnerTypeIcon({ ownerType }: { ownerType?: string }) {
  if (ownerType === "ai") return <Bot size={11} className="text-violet-600" />;
  if (ownerType === "shared") return <Users size={11} className="text-teal-600" />;
  return <User size={11} className="text-muted-foreground" />;
}

type SortKey = "title" | "status" | "priority" | "owner" | "dueDate";

function TaskListView({ items }: { items: any[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return av.localeCompare(bv) * sortDir;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  };

  const Head = ({ label, sortBy }: { label: string; sortBy: SortKey }) => (
    <th className="text-left font-medium py-2 px-3 cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort(sortBy)}>
      <span className="flex items-center gap-1">{label}{sortKey === sortBy && <ArrowUpDown size={9} />}</span>
    </th>
  );

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-[#FCFCFD] border-b border-border text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
          <tr>
            <Head label="Title" sortBy="title" />
            <Head label="Status" sortBy="status" />
            <Head label="Priority" sortBy="priority" />
            <Head label="Owner" sortBy="owner" />
            <Head label="Due Date" sortBy="dueDate" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {sorted.map((t) => (
            <tr key={t.id} className="hover:bg-muted/20 transition-colors">
              <td className="py-2.5 px-3 font-medium text-foreground">{t.title}</td>
              <td className="py-2.5 px-3 text-muted-foreground capitalize">{String(t.status).replace("-", " ")}</td>
              <td className="py-2.5 px-3">
                <span className={cn("text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-sm border font-bold", PRIORITY_CLS[t.priority] ?? PRIORITY_CLS.p3)}>
                  {t.priority}
                </span>
              </td>
              <td className="py-2.5 px-3 text-muted-foreground">
                <span className="flex items-center gap-1"><OwnerTypeIcon ownerType={t.ownerType} /> {t.owner}</span>
              </td>
              <td className="py-2.5 px-3 text-muted-foreground font-mono">
                {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No tasks match.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function MyWork() {
  const { persona, role, currentCompanyId } = useAppContext();
  const { data: apiTasks, isLoading } = useGetTasks();
  const createTask = useCreateTask();
  const { toast } = useToast();

  const [view, setView] = useState<"board" | "list">("board");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", priority: "p2" as "p1" | "p2" | "p3", dueDate: "", linkedKpi: "" });

  const buName = BU_LIST.find((b: any) => b.id === persona.buId)?.name;

  const scoped = (Array.isArray(apiTasks) ? apiTasks : []).filter((t: any) => {
    if ((t.companyId ?? "company-a") !== currentCompanyId) return false;
    if (role === "employee") return t.owner === persona.name;
    if (isDeptScoped(role)) return t.businessUnitId === persona.buId;
    return true; // cxo landing here directly (edge case) sees everything
  });

  const doneCount = scoped.filter((t: any) => t.status === "done").length;
  const blockedCount = scoped.filter((t: any) => t.status === "blocked").length;

  const submit = () => {
    if (!form.title.trim()) {
      toast({ title: "Missing title", description: "Give the work item a title.", variant: "destructive" });
      return;
    }
    createTask.mutate(
      {
        title: form.title,
        priority: form.priority,
        owner: persona.name,
        ownerType: "human",
        linkedKpi: form.linkedKpi || null,
        dueDate: form.dueDate || null,
        businessUnitId: persona.buId,
        department: undefined,
        workflow: undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Work item created", description: `"${form.title}" added to your To Do column.` });
          setShowModal(false);
          setForm({ title: "", priority: "p2", dueDate: "", linkedKpi: "" });
        },
        onError: () => {
          toast({ title: "Couldn't create work item", description: "Something went wrong — try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="MY WORK"
        metrics={[
          { label: isDeptScoped(role) ? "TEAM TASKS" : "MY TASKS", value: scoped.length },
          { label: "DONE", value: doneCount },
          { label: "BLOCKED", value: blockedCount },
        ]}
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isDeptScoped(role)
              ? <>Showing the shared task board for <span className="font-semibold text-foreground">{buName}</span>.</>
              : <>Personal task queue for <span className="font-semibold text-foreground">{persona.name}</span>.</>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-border rounded-sm p-0.5 bg-white">
              <button onClick={() => setView("board")} className={cn("flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm transition-colors", view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60")}>
                <LayoutGrid size={11} /> Board
              </button>
              <button onClick={() => setView("list")} className={cn("flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60")}>
                <Table2 size={11} /> List
              </button>
            </div>
            <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowModal(true)}>
              <Plus size={14} className="mr-2" /> Create New Work
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {COLUMNS.map((c) => <Skeleton key={c.id} className="h-64 w-full" />)}
          </div>
        ) : view === "list" ? (
          <TaskListView items={scoped} />
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {COLUMNS.map((col) => {
              const items = scoped.filter((t: any) => t.status === col.id);
              return (
                <div key={col.id} className="bg-white border border-border rounded-sm shadow-sm flex flex-col">
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{col.label}</span>
                    <Badge variant="outline" className="text-[9px]">{items.length}</Badge>
                  </div>
                  <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                    {items.map((t: any) => (
                      <div key={t.id} className="border border-border rounded-sm p-2.5 bg-[#FCFCFD] hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-medium text-foreground leading-snug">{t.title}</span>
                          <span className={cn("text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-sm border font-bold shrink-0", PRIORITY_CLS[t.priority] ?? PRIORITY_CLS.p3)}>
                            {t.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><OwnerTypeIcon ownerType={t.ownerType} /> {t.owner}</span>
                          <span>{t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-[10px] text-muted-foreground text-center py-6">No tasks</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-border rounded-sm shadow-xl w-[460px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Create New Work</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">
              A personal initiative you want to drive — e.g. "Expand to Asian markets." Lands in your To Do column.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Title *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Expand to Asian markets" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Priority</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}>
                    <option value="p1">P1 — Critical</option>
                    <option value="p2">P2 — Normal</option>
                    <option value="p3">P3 — Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Due Date</label>
                  <input type="date" className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Linked KPI (optional)</label>
                <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.linkedKpi} onChange={e => setForm(f => ({ ...f, linkedKpi: e.target.value }))}>
                  <option value="">None</option>
                  {KPI_CATALOG.map((k) => <option key={k.id} value={k.fullName}>{k.fullName}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" disabled={createTask.isPending} onClick={submit}>
                {createTask.isPending ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
