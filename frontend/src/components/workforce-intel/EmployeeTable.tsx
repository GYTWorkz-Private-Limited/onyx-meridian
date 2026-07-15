import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/data/workforce-intelligence-data";
import { ChevronUp, ChevronDown, Search, Download } from "lucide-react";

type SortKey = keyof Pick<Employee, "name" | "department" | "performance" | "engagement" | "utilization" | "risk" | "tenureYears">;

const RISK_CLS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const PAGE_SIZE = 50;

export function EmployeeTable({ employees, onSelect }: { employees: Employee[]; onSelect: (e: Employee) => void }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? employees.filter((e) => e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.title.toLowerCase().includes(q))
      : employees;
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [employees, search, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  };

  const exportCsv = () => {
    const header = ["Name", "Department", "Manager", "Performance", "Engagement", "Utilization", "Risk", "Region", "Status", "Salary Band", "Tenure", "Last Review"];
    const rows = filtered.map((e) => [e.name, e.department, e.managerName, e.performance, e.engagement, e.utilization, e.risk, e.region, e.status, e.salaryBand, e.tenureYears, e.lastReviewDate]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employee-analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="px-3 py-2 font-medium cursor-pointer select-none" onClick={() => toggleSort(k)}>
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k && (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
      </span>
    </th>
  );

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee Analytics</span>
          <span className="text-[10px] text-muted-foreground">{filtered.length.toLocaleString()} employees</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="border border-border rounded-sm pl-7 pr-2 py-1.5 text-xs bg-white w-56"
              placeholder="Search name, dept, title…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <button onClick={exportCsv} className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-primary border border-primary/30 px-2 py-1.5 rounded-sm hover:bg-primary/5">
            <Download size={11} /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            <tr>
              <SortHead label="Employee" k="name" />
              <SortHead label="Department" k="department" />
              <th className="px-3 py-2 font-medium">Manager</th>
              <SortHead label="Performance" k="performance" />
              <SortHead label="Engagement" k="engagement" />
              <SortHead label="Utilization" k="utilization" />
              <SortHead label="Risk" k="risk" />
              <th className="px-3 py-2 font-medium">Region</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Salary Band</th>
              <SortHead label="Tenure" k="tenureYears" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageRows.map((e) => (
              <tr key={e.id} className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => onSelect(e)}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">{e.initials}</div>
                    <div>
                      <div className="font-medium text-foreground">{e.name}</div>
                      <div className="text-[10px] text-muted-foreground">{e.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{e.department}</td>
                <td className="px-3 py-2 text-muted-foreground">{e.managerName}</td>
                <td className="px-3 py-2 font-mono">{e.performance}%</td>
                <td className="px-3 py-2 font-mono">{e.engagement}%</td>
                <td className="px-3 py-2 font-mono">{e.utilization}%</td>
                <td className="px-3 py-2"><span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", RISK_CLS[e.risk])}>{e.risk}</span></td>
                <td className="px-3 py-2 text-muted-foreground">{e.region}</td>
                <td className="px-3 py-2 text-muted-foreground capitalize">{e.status}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{e.salaryBand}</td>
                <td className="px-3 py-2 font-mono">{e.tenureYears}y</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No employees match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[10px] text-muted-foreground">
        <span>Page {page + 1} of {pageCount}</span>
        <div className="flex gap-1">
          <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-2 py-1 border border-border rounded-sm disabled:opacity-40">Prev</button>
          <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} className="px-2 py-1 border border-border rounded-sm disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
