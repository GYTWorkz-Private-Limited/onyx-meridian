import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { PEOPLE, type Person } from "@/data/people-data";
import { BU_LIST } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { Users, Plus, X, Trash2 } from "lucide-react";

const STATUS_CLS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  invited: "bg-blue-50 text-blue-700 border-blue-200",
  paused: "bg-gray-50 text-gray-600 border-gray-200",
};

const ROLE_TIER_CLS: Record<string, string> = {
  ceo: "bg-red-50 text-red-700 border-red-200",
  abu_head: "bg-amber-50 text-amber-700 border-amber-200",
  member: "bg-gray-50 text-gray-600 border-gray-200",
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

export default function People() {
  const { role, currentBuId } = useAppContext();
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [buFilter, setBuFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", title: "", buId: currentBuId ?? BU_LIST[0].id });
  const { toast } = useToast();

  // ABU Head sees only their own ABU's roster; CEO sees everyone (optionally filtered).
  const scoped = people.filter((p) => {
    if (role === "abu_head") return p.buId === currentBuId;
    if (buFilter === "all") return true;
    return p.buId === buFilter;
  });

  const submit = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Missing fields", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    const person: Person = {
      id: `per-${Date.now()}`, name: form.name, email: form.email, title: form.title || "Team Member",
      buId: role === "abu_head" ? currentBuId : form.buId, roleTier: "member", status: "invited",
    };
    setPeople((prev) => [person, ...prev]);
    setShowModal(false);
    setForm({ name: "", email: "", title: "", buId: currentBuId ?? BU_LIST[0].id });
    toast({ title: "Person Hired", description: `${person.name} invited to ${BU_LIST.find((b: any) => b.id === person.buId)?.name ?? "the enterprise"}.` });
  };

  const remove = (id: string) => {
    const p = people.find((p) => p.id === id);
    setPeople((prev) => prev.filter((p) => p.id !== id));
    if (p) toast({ title: "Person Removed", description: `${p.name} removed from the roster.` });
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="PEOPLE" metrics={[{ label: "TOTAL", value: scoped.length }, { label: "ACTIVE", value: scoped.filter(p => p.status === "active").length }]} />

      <div className="p-6 max-w-[1200px] mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {role === "abu_head"
              ? "Human operators in your business unit — view profiles, hire, and manage onboarding."
              : "Human operators across the enterprise."}
          </p>
          <div className="flex items-center gap-2">
            {role === "ceo" && (
              <select className="border border-border rounded-sm px-2 py-1.5 text-xs bg-white" value={buFilter} onChange={(e) => setBuFilter(e.target.value)}>
                <option value="all">All Business Units</option>
                {BU_LIST.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowModal(true)}>
              <Plus size={14} className="mr-2" /> Hire Person
            </Button>
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Business Unit</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scoped.map((p) => {
                const bu = BU_LIST.find((b: any) => b.id === p.buId);
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {initials(p.name)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">{p.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{p.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{bu?.name ?? "Enterprise"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", ROLE_TIER_CLS[p.roleTier])}>
                        {p.roleTier === "ceo" ? "CEO" : p.roleTier === "abu_head" ? "ABU Head" : "Member"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", STATUS_CLS[p.status])}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.roleTier === "member" && (
                        <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {scoped.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No people found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-border rounded-sm shadow-xl w-[460px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><Users size={14} /> Hire Person</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Full Name *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Work Email *</label>
                <input type="email" className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Title</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm" placeholder="e.g. Shift Supervisor" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              {role === "ceo" && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Business Unit</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={form.buId} onChange={e => setForm(f => ({ ...f, buId: e.target.value }))}>
                    {BU_LIST.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={submit}>Send Invitation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
