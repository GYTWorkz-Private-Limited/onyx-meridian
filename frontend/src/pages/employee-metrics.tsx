import { useLocation } from "wouter";
import { useGetTasks } from "@workspace/api-client-react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { useAppContext } from "@/context/AppContext";
import { MFG_AGENTS, BU_LIST } from "@/data/enterprise-data";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Lightbulb, Bot, FileText, Target } from "lucide-react";

// Deterministic 8-week trend, not randomized per render.
const TASK_TREND = [
  { week: "W1", closed: 4, opened: 5 },
  { week: "W2", closed: 5, opened: 4 },
  { week: "W3", closed: 3, opened: 6 },
  { week: "W4", closed: 6, opened: 5 },
  { week: "W5", closed: 5, opened: 3 },
  { week: "W6", closed: 7, opened: 4 },
  { week: "W7", closed: 6, opened: 5 },
  { week: "W8", closed: 8, opened: 4 },
];

const SUGGESTIONS = [
  "You've closed 3 more tasks this week than last — nice pace.",
  "2 tasks have been in Blocked for 4+ days. Consider escalating via Mission Control.",
  "Your linked KPI 'Cycle Time' improved 8% this month.",
  "Try tagging the SCADA Gateway connector on your next maintenance task — it's underused by your team.",
];

export default function EmployeeMetrics() {
  const [, navigate] = useLocation();
  const { persona, currentCompanyId } = useAppContext();
  const { data: apiTasks } = useGetTasks();

  const mine = (Array.isArray(apiTasks) ? apiTasks : []).filter(
    (t: any) => t.owner === persona.name && (t.companyId ?? "company-a") === currentCompanyId
  );
  const doneCount = mine.filter((t: any) => t.status === "done").length;
  const blockedCount = mine.filter((t: any) => t.status === "blocked").length;

  const buName = BU_LIST.find((b: any) => b.id === persona.buId)?.name;
  const myAgents = MFG_AGENTS.filter((a: any) => a.bu === persona.buId).slice(0, 5);

  const kpis = [
    { label: "Tasks Closed (30d)", value: doneCount || 6 },
    { label: "Avg Cycle Time", value: "1.8 days" },
    { label: "On-time Rate", value: "94%" },
    { label: "Open Tasks", value: mine.length - doneCount },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="EMPLOYEE METRICS" metrics={[{ label: "TASKS CLOSED", value: doneCount || 6 }, { label: "BLOCKED", value: blockedCount }]} />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
        <p className="text-xs text-muted-foreground">
          Personal performance for <span className="font-semibold text-foreground">{persona.name}</span> · {buName}
        </p>

        <div className="grid grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{k.label}</div>
              <div className="text-xl font-bold font-mono text-foreground">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white border border-border rounded-sm shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Task Throughput — Last 8 Weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={TASK_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 2, border: "1px solid #E5E7EB", fontSize: 12 }} />
                <Area type="monotone" dataKey="closed" name="Closed" stroke="hsl(228 71% 54%)" fill="hsl(228 71% 54%)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="opened" name="Opened" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-border rounded-sm shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={13} className="text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Suggestions</span>
            </div>
            <ul className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <li key={i} className="text-xs text-foreground leading-snug flex gap-2">
                  <span className="text-amber-500 shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot size={13} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Agents You Work With</span>
            </div>
            <button onClick={() => navigate("/agent-logs")} className="text-[9px] uppercase tracking-widest font-bold text-primary flex items-center gap-1">
              <FileText size={10} /> View Agent Logs
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {myAgents.map((a: any) => (
              <button key={a.id} onClick={() => navigate(`/agents/${a.id}`)} className="text-left border border-border rounded-sm p-2.5 hover:border-primary/40 hover:shadow-sm transition-all">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className="text-xs font-semibold text-foreground truncate">{a.name}</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{a.role}</div>
              </button>
            ))}
            {myAgents.length === 0 && <div className="text-xs text-muted-foreground col-span-5 text-center py-4">No agents mapped to your business unit yet.</div>}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-sm px-4 py-2.5 text-xs text-blue-800 flex items-center gap-2">
          <Target size={13} className="shrink-0" />
          This is your personal view — for enterprise-wide workforce analytics, ask your ABU Head or CEO to open the People page.
        </div>
      </div>
    </div>
  );
}
