import { useGetTasks } from "@/lib/api";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/context/AppContext";
import { isDeptScoped } from "@/lib/rbac";
import { BU_LIST } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { Bot, User, Users } from "lucide-react";

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

export default function MyWork() {
  const { persona, role, currentCompanyId } = useAppContext();
  const { data: apiTasks, isLoading } = useGetTasks();

  const buName = BU_LIST.find((b: any) => b.id === persona.buId)?.name;

  const scoped = (Array.isArray(apiTasks) ? apiTasks : []).filter((t: any) => {
    if ((t.companyId ?? "company-a") !== currentCompanyId) return false;
    if (role === "employee") return t.owner === persona.name;
    if (isDeptScoped(role)) return t.businessUnitId === persona.buId;
    return true; // ceo landing here directly (edge case) sees everything
  });

  const doneCount = scoped.filter((t: any) => t.status === "done").length;
  const blockedCount = scoped.filter((t: any) => t.status === "blocked").length;

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
        <div className="text-sm text-muted-foreground">
          {isDeptScoped(role)
            ? <>Showing the shared task board for <span className="font-semibold text-foreground">{buName}</span>.</>
            : <>Personal task queue for <span className="font-semibold text-foreground">{persona.name}</span>.</>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {COLUMNS.map((c) => <Skeleton key={c.id} className="h-64 w-full" />)}
          </div>
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
    </div>
  );
}
