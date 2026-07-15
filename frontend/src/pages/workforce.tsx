import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { StatusBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MFG_AGENTS, BU_LIST, BU_INTELLIGENCE } from "@/data/enterprise-data";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { WorkforceManagement } from "@/components/command-center/WorkforceManagement";
import {
  Bot, Search, Filter, ChevronRight, Play, Pause, RotateCcw,
  Cpu, BookOpen, Zap, Wrench, Terminal, History, MessageSquare,
  Lightbulb, Settings, Eye, Plus, ArrowRight, CheckCircle2,
  AlertTriangle, Clock, BarChart3, DollarSign, Shield,
  Layers, GitBranch, User, Activity, TerminalSquare, FlaskConical,
  TrendingUp, TrendingDown, Send, X, Edit3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

type WorkforceTab = "inventory" | "overview" | "command-center" | "harness" | "playground";
type OverviewSection = "edit" | "logs" | "history" | "requests" | "suggestions" | "quick-actions";

// ─── Per-agent static data extensions ─────────────────────────

const AGENT_LOGS: Record<string, Array<{ time: string; level: string; message: string }>> = {
  ag1: [
    { time: "06:14:22", level: "INFO", message: "Shift schedule optimized — throughput +42 u/hr projected" },
    { time: "06:08:11", level: "INFO", message: "MES sync complete — 284 WOs reconciled" },
    { time: "05:52:44", level: "WARN", message: "Capacity constraint on Line 8 — overflow routing activated" },
    { time: "05:41:08", level: "INFO", message: "ERP demand pull updated — 3 priority jobs rescheduled" },
    { time: "05:38:19", level: "INFO", message: "Daily plan committed — 2,840 u/hr target set" },
  ],
  ag2: [
    { time: "06:14:38", level: "WARN", message: "MX-0441 vibration 2.3σ above baseline — escalating" },
    { time: "06:09:22", level: "INFO", message: "Shift OEE calculated: 87.4% — below 90% target" },
    { time: "05:58:44", level: "ERROR", message: "SCADA feed timeout on Line 7 — reconnecting" },
    { time: "05:51:08", level: "INFO", message: "Line 3 restart logged — 12-min downtime, tooling change" },
    { time: "05:42:08", level: "INFO", message: "OEE report generated — distributed to shift supervisor" },
  ],
  ag3: [
    { time: "06:12:48", level: "CRIT", message: "Asset MX-0441: bearing failure imminent — emergency WO generated" },
    { time: "06:09:33", level: "INFO", message: "CMMS work order WO-PM-4421 submitted — parts requested" },
    { time: "05:58:17", level: "WARN", message: "Asset A12 PM overdue 8 days — scheduling conflict raised" },
    { time: "05:44:22", level: "INFO", message: "Predictive scan complete — 12 assets green, 2 flagged" },
    { time: "05:38:11", level: "INFO", message: "IoT batch processing: 4,284 sensor readings analyzed" },
  ],
  ag4: [
    { time: "06:11:02", level: "WARN", message: "Defect cluster in batch QD-229 — 3 units flagged for rework" },
    { time: "06:04:38", level: "INFO", message: "Inspection complete: 389 units — 1.2% defect rate" },
    { time: "05:52:14", level: "INFO", message: "SPC control chart updated — Cpk 1.31, process stable" },
    { time: "05:41:28", level: "ERROR", message: "Vision camera Line 4 interrupted — fallback to manual" },
    { time: "05:38:08", level: "INFO", message: "Yield report QD-228: 98.4% — batch released" },
  ],
};

const AGENT_HISTORY: Record<string, Array<{ task: string; outcome: string; time: string; status: "success" | "warning" | "failed" }>> = {
  ag1: [
    { task: "Optimize shift schedule for Day shift — 3 lines", outcome: "+42 u/hr throughput, $84K saved", time: "2h ago", status: "success" },
    { task: "Reschedule WO-8841 due to material shortage", outcome: "Delayed 2 hrs, 14 downstream WOs adjusted", time: "4h ago", status: "warning" },
    { task: "Capacity plan — APAC demand surge +22%", outcome: "Line 8 overflow routing approved", time: "6h ago", status: "success" },
    { task: "ERP sync — 284 work orders reconciled", outcome: "3 priority jobs rescheduled, 0 SLA breaches", time: "8h ago", status: "success" },
  ],
  ag2: [
    { task: "OEE root cause analysis — Line 7 drop to 69.6%", outcome: "MX-0441 bearing identified as primary cause", time: "35m ago", status: "warning" },
    { task: "Micro-stoppage analysis — 6-8 per hour", outcome: "Feeder alignment issue identified on Line 7", time: "2h ago", status: "success" },
    { task: "Shift handover report — Shift A → B", outcome: "Report generated, 4 action items handed over", time: "4h ago", status: "success" },
    { task: "SCADA reconnect — timeout on Line 7", outcome: "Reconnected in 42 sec, 2 readings interpolated", time: "5h ago", status: "warning" },
  ],
  ag3: [
    { task: "Emergency diagnosis — MX-0441 bearing vibration", outcome: "Failure within 4–6 hrs predicted, WO generated", time: "8m ago", status: "warning" },
    { task: "Preventive inspection — 14 assets", outcome: "12 green, 2 flagged for review (A12, B08)", time: "1.5h ago", status: "success" },
    { task: "IoT batch: 4,284 sensor readings processed", outcome: "2 anomalies detected, 1 escalated", time: "3h ago", status: "success" },
    { task: "CMMS sync — 21 open work orders", outcome: "3 overdue flagged, 1 PM deferral requested", time: "5h ago", status: "warning" },
  ],
  ag4: [
    { task: "Inspect batch QD-229 — 3 units flagged", outcome: "Rework authorization requested — 2 units pass on 2nd inspect", time: "42m ago", status: "warning" },
    { task: "Vision inspection — 389 units Line 7", outcome: "1.2% defect rate — above 1.0% target", time: "2h ago", status: "warning" },
    { task: "SPC update — Cp, Cpk analysis", outcome: "Cpk 1.31 — process stable, no action required", time: "3h ago", status: "success" },
    { task: "Batch release QD-228 — 98.4% yield", outcome: "Batch approved for shipment", time: "5h ago", status: "success" },
  ],
};

const AGENT_REQUESTS: Record<string, Array<{ endpoint: string; method: string; latency: number; status: number; time: string }>> = {
  ag1: [
    { endpoint: "/api/mes/schedule", method: "POST", latency: 842, status: 200, time: "06:14" },
    { endpoint: "/api/erp/workorders", method: "GET", latency: 318, status: 200, time: "06:08" },
    { endpoint: "/api/capacity/line8", method: "GET", latency: 427, status: 200, time: "05:52" },
    { endpoint: "/api/mes/schedule", method: "PUT", latency: 891, status: 200, time: "05:41" },
  ],
  ag2: [
    { endpoint: "/api/scada/sensors", method: "GET", latency: 1124, status: 200, time: "06:14" },
    { endpoint: "/api/oee/calculate", method: "POST", latency: 842, status: 200, time: "06:09" },
    { endpoint: "/api/scada/line7", method: "GET", latency: 1240, status: 504, time: "05:58" },
    { endpoint: "/api/mes/downtime", method: "POST", latency: 621, status: 200, time: "05:51" },
  ],
  ag3: [
    { endpoint: "/api/iot/sensors/MX-0441", method: "GET", latency: 624, status: 200, time: "06:12" },
    { endpoint: "/api/cmms/workorders", method: "POST", latency: 412, status: 201, time: "06:09" },
    { endpoint: "/api/iot/batch", method: "GET", latency: 1840, status: 200, time: "05:44" },
    { endpoint: "/api/cmms/assets", method: "GET", latency: 388, status: 200, time: "05:38" },
  ],
  ag4: [
    { endpoint: "/api/vision/inspect", method: "POST", latency: 784, status: 200, time: "06:11" },
    { endpoint: "/api/quality/spc", method: "GET", latency: 421, status: 200, time: "06:04" },
    { endpoint: "/api/mes/batches/QD-229", method: "GET", latency: 318, status: 200, time: "05:52" },
    { endpoint: "/api/quality/release", method: "POST", latency: 612, status: 201, time: "05:41" },
  ],
};

const AGENT_SUGGESTIONS: Record<string, Array<{ title: string; impact: string; confidence: number; type: "upgrade" | "tune" | "expand" | "reduce" }>> = {
  ag1: [
    { title: "Increase scheduling horizon from 8h to 12h — improve constraint look-ahead", impact: "+2.1% OEE potential", confidence: 88, type: "tune" },
    { title: "Enable autonomous re-scheduling on capacity exceptions up to $50K impact", impact: "+180 hrs/qtr saved", confidence: 84, type: "expand" },
    { title: "Add demand-sensing module from Supply Chain feed — improve plan accuracy", impact: "+6% forecast alignment", confidence: 91, type: "upgrade" },
  ],
  ag2: [
    { title: "Upgrade vibration anomaly model to v4.1 — 8% accuracy improvement", impact: "+$240K/yr downtime prevention", confidence: 94, type: "upgrade" },
    { title: "Reduce OEE scan interval from 15m to 5m for critical assets", impact: "Earlier detection, -3 MTTR", confidence: 87, type: "tune" },
    { title: "Add acoustic analysis capability — detect gear wear earlier", impact: "+18 hrs additional downtime prevented", confidence: 82, type: "expand" },
  ],
  ag3: [
    { title: "Promote to Fully Autonomous for standard PM work orders <$10K", impact: "+420 hrs/qtr saved", confidence: 96, type: "expand" },
    { title: "Integrate thermal imaging feed from IoT cameras on Lines 6–9", impact: "+22% detection surface coverage", confidence: 89, type: "upgrade" },
    { title: "Add CMMS parts pre-ordering trigger when failure probability >85%", impact: "-4h mean repair time", confidence: 91, type: "expand" },
  ],
  ag4: [
    { title: "Upgrade vision model to v3.0 — closes gap on micro-surface defects", impact: "+1.8% yield improvement", confidence: 92, type: "upgrade" },
    { title: "Add automated rework routing — reduce 2-step approval for <5-unit batches", impact: "+140 hrs/qtr saved", confidence: 86, type: "expand" },
    { title: "Train on QD-229 batch failure data — improve material defect detection", impact: "+0.3% quality score", confidence: 88, type: "tune" },
  ],
};

const COMMAND_CENTER_FEEDS = [
  { agent: "Predictive Maintenance", action: "Emergency WO raised for MX-0441 — bearing replacement authorized", bu: "Manufacturing", severity: "critical", time: "6 min ago" },
  { agent: "Inventory Optimizer", action: "Reorder trigger sent for SKU-8841 — WH-3 stockout risk in 11 days", bu: "Supply Chain", severity: "warning", time: "18 min ago" },
  { agent: "Supplier Risk Agent", action: "3 Tier-1 vendors escalated — alternate sourcing RFQ issued", bu: "Procurement", severity: "warning", time: "22 min ago" },
  { agent: "Revenue Scout", action: "APAC pipeline flag updated — 3 accounts at 70%+ churn risk", bu: "Revenue", severity: "info", time: "2 hrs ago" },
  { agent: "Finance Analyst", action: "Variance report generated — 4 items above materiality threshold", bu: "Finance", severity: "info", time: "2.4 hrs ago" },
  { agent: "Production Planner", action: "Shift schedule optimized — throughput +42 u/hr on Day shift", bu: "Manufacturing", severity: "success", time: "3 hrs ago" },
  { agent: "Quality Inspector", action: "Batch QD-229 inspection complete — 3 units flagged for rework", bu: "Manufacturing", severity: "warning", time: "4 hrs ago" },
  { agent: "OEE Optimizer", action: "Line 7 OEE: 87.4% — root cause analysis triggered", bu: "Manufacturing", severity: "info", time: "5 hrs ago" },
];

const HARNESS_SCENARIOS = [
  { id: "h1", name: "OEE Drop Analysis — Line 7", input: "Analyze the OEE drop on Line 7 this shift. Availability: 78%, Performance: 91%, Quality: 98%. Identify root causes and recommend corrective actions.", expected: "Root cause identification + action plan", agent: "ag2" },
  { id: "h2", name: "Bearing Failure Prediction", input: "Asset MX-0441 vibration reading 2.3σ above baseline. Temperature +12°C. Acoustic pattern: abnormal. Predict failure probability and recommended intervention.", expected: "Failure probability + maintenance action", agent: "ag3" },
  { id: "h3", name: "Shift Schedule Optimization", input: "Day shift capacity: 3 lines available. Demand: 2,840 units. Constraints: Line 7 at 70% due to bearing issue. Generate optimized production schedule.", expected: "Optimized schedule with contingency routing", agent: "ag1" },
  { id: "h4", name: "Quality Defect Classification", input: "Batch QD-229 vision inspection output: 3 surface defects detected on 389 units. Defect type: micro-scratch, 0.3mm. Classify and recommend disposition.", expected: "Defect classification + rework/scrap decision", agent: "ag4" },
];

const HARNESS_OUTPUT = `## Analysis Result — MX-0441 Bearing Assessment

**Asset:** MX-0441 · Line 7 · Manufacturing Floor A

### Failure Probability Assessment
- **Current Risk:** 94% probability of bearing failure within 4–6 hours
- **Confidence:** 96.4% (based on 3 corroborating signal types)
- **Failure Mode:** Fatigue-induced spalling of inner race

### Signal Analysis
| Signal | Reading | Baseline | Deviation |
|--------|---------|----------|-----------|
| Vibration (RMS) | 2.3σ | 0.8σ | +188% |
| Temperature | +12°C | +2°C | +500% |
| Acoustic | Abnormal grinding | Normal | High severity |

### Recommended Intervention
**IMMEDIATE:** Schedule bearing replacement — current risk of unplanned failure is unacceptable.

**Work Order Details:**
- Priority: P1 — Emergency
- Estimated repair time: 2.5 hours
- Parts: SKF 6208-2RS bearing (in stock: 3 units)
- Estimated cost of action: $4,200
- **Cost of inaction: $480K** (6-hr unplanned downtime)

**Confidence:** 96.4% | **EEI Impact if actioned:** +1.2 pts`;

// ─── Helper components ─────────────────────────────────────────

function HealthBar({ value }: { value: number }) {
  const color = value >= 90 ? "bg-emerald-500" : value >= 80 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

function BUBadge({ bu }: { bu: string }) {
  const colors: Record<string, string> = {
    manufacturing: "bg-blue-50 text-blue-700 border-blue-200",
    "supply-chain": "bg-amber-50 text-amber-700 border-amber-200",
    procurement: "bg-orange-50 text-orange-700 border-orange-200",
    finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
    revenue: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", colors[bu] || "bg-muted text-muted-foreground border-border")}>
      {bu.replace("-", " ")}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function Workforce() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<WorkforceTab>("inventory");
  const [selectedAgent, setSelectedAgent] = useState<string>(MFG_AGENTS[0].id);
  const [overviewSection, setOverviewSection] = useState<OverviewSection>("edit");
  const [search, setSearch] = useState("");
  const [buFilter, setBuFilter] = useState("all");
  const [showHireModal, setShowHireModal] = useState(false);

  // Harness state
  const [harnessScenario, setHarnessScenario] = useState("h1");
  const [harnessInput, setHarnessInput] = useState(HARNESS_SCENARIOS[0].input);
  const [harnessRunning, setHarnessRunning] = useState(false);
  const [harnessOutput, setHarnessOutput] = useState("");
  const [harnessMetrics, setHarnessMetrics] = useState<{ tokens: number; latency: number; cost: string; confidence: number } | null>(null);
  const [harnessAgentId, setHarnessAgentId] = useState("ag2");

  // Edit state
  const agent = MFG_AGENTS.find(a => a.id === selectedAgent) || MFG_AGENTS[0];
  const [editForm, setEditForm] = useState({ name: agent.name, role: agent.role, autonomy: agent.autonomy, model: agent.model, description: `${agent.role} for ${agent.department}` });

  const { currentCompanyId, role, persona } = useAppContext();

  // Dept managers and employees are locked to their own department's agent
  // catalog (employee: "emp agent inv" — involvement in own agents only).
  // Most departments only have 1-2 hand-authored MFG_AGENTS entries, so fall
  // back to the full BU roster (with a banner) rather than showing an empty page.
  const isDeptScopedRole = role === "dept_manager" || role === "employee";
  const deptCatalog = isDeptScopedRole ? MFG_AGENTS.filter(a => (a as any).deptId === persona.deptId) : null;
  const deptFallback = isDeptScopedRole && (deptCatalog?.length ?? 0) === 0;
  const scopedAgents = isDeptScopedRole
    ? (deptFallback ? MFG_AGENTS.filter(a => a.bu === persona.buId) : deptCatalog!)
    : MFG_AGENTS;
  const canManageAgents = role !== "employee";

  const filteredAgents = scopedAgents.filter(a => {
    const matchCompany = ((a as any).companyId ?? "company-a") === currentCompanyId;
    const matchSearch = search === "" || a.name.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase());
    const matchBU = isDeptScopedRole ? true : (buFilter === "all" || a.bu === buFilter);
    return matchCompany && matchSearch && matchBU;
  });

  function selectAndView(id: string) {
    setSelectedAgent(id);
    const a = MFG_AGENTS.find(ag => ag.id === id);
    if (a) setEditForm({ name: a.name, role: a.role, autonomy: a.autonomy, model: a.model, description: `${a.role} for ${a.department}` });
    setActiveTab("overview");
    setOverviewSection("edit");
  }

  function runHarness() {
    setHarnessRunning(true);
    setHarnessOutput("");
    setHarnessMetrics(null);
    let i = 0;
    const interval = setInterval(() => {
      i += 14;
      setHarnessOutput(HARNESS_OUTPUT.slice(0, i));
      if (i >= HARNESS_OUTPUT.length) {
        clearInterval(interval);
        setHarnessRunning(false);
        setHarnessMetrics({ tokens: 1842, latency: 624, cost: "$0.028", confidence: 96 });
      }
    }, 16);
  }

  const logs = AGENT_LOGS[selectedAgent] || AGENT_LOGS.ag1;
  const history = AGENT_HISTORY[selectedAgent] || AGENT_HISTORY.ag1;
  const requests = AGENT_REQUESTS[selectedAgent] || AGENT_REQUESTS.ag1;
  const suggestions = AGENT_SUGGESTIONS[selectedAgent] || AGENT_SUGGESTIONS.ag1;

  const activeCount = scopedAgents.filter(a => a.status === "active").length;
  const watchCount = scopedAgents.filter(a => a.status === "watch").length;

  const tabs: Array<{ id: WorkforceTab; label: string; icon: React.ElementType }> = [
    { id: "inventory", label: "Inventory", icon: Layers },
    { id: "overview", label: "Agent Overview", icon: Bot },
    { id: "command-center", label: "Command Center", icon: Activity },
    { id: "harness", label: "Harness", icon: FlaskConical },
    { id: "playground", label: "Playground", icon: TerminalSquare },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="AI WORKFORCE"
        metrics={[
          { label: "TOTAL AGENTS", value: scopedAgents.length },
          { label: "ACTIVE", value: activeCount },
          { label: "UNDER REVIEW", value: watchCount },
        ]}
      />

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 pt-4 border-b border-border bg-white shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "playground") { navigate("/prompt-playground"); return; }
                setActiveTab(tab.id);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest font-semibold border-b-2 transition-colors -mb-px",
                isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
        <div className="flex-1" />
        {canManageAgents && (
          <button
            onClick={() => setShowHireModal(true)}
            className="mb-2 flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold bg-foreground text-background hover:bg-foreground/90 rounded-sm transition-colors"
          >
            <Plus size={10} />Hire Agent
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">

        {/* ── INVENTORY ─────────────────────────────────── */}
        {activeTab === "inventory" && (
          <div className="p-6 space-y-4">
            {/* Dept manager scope banner */}
            {role === "dept_manager" && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-sm border text-[10px]",
                deptFallback ? "border-amber-200 bg-amber-50 text-amber-700" : "border-primary/20 bg-primary/5 text-primary"
              )}>
                <Layers size={12} className="shrink-0" />
                {deptFallback
                  ? <span>No dedicated agent catalog for this department yet — showing the full <span className="font-bold uppercase">{persona.buId}</span> business unit roster.</span>
                  : <span>Scoped to your department — <span className="font-bold">{scopedAgents.length}</span> agent{scopedAgents.length === 1 ? "" : "s"}.</span>}
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search agents..."
                  className="w-full pl-8 pr-4 py-1.5 text-[11px] border border-border rounded-sm bg-white focus:outline-none focus:border-primary"
                />
              </div>
              {role !== "dept_manager" && (
                <div className="flex items-center gap-1">
                  <Filter size={11} className="text-muted-foreground" />
                  {["all", "manufacturing", "supply-chain", "procurement", "finance", "revenue"].map(f => (
                    <button key={f} onClick={() => setBuFilter(f)}
                      className={cn("px-2.5 py-1 text-[9px] uppercase tracking-widest font-semibold rounded-sm border transition-colors",
                        buFilter === f ? "bg-primary/5 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground bg-white")}>
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Agent table */}
            <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FCFCFD] border-b border-border text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Business Unit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Autonomy</th>
                    <th className="px-4 py-3">Health</th>
                    <th className="px-4 py-3">Utilization</th>
                    <th className="px-4 py-3">SLA</th>
                    <th className="px-4 py-3">ROI</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAgents.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => selectAndView(a.id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Bot size={15} />
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-[12px]">{a.name}</div>
                            <div className="text-[9px] text-muted-foreground font-mono">{a.employeeId} · {a.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><BUBadge bu={a.bu} /></td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] uppercase tracking-widest bg-muted/40 border border-border/60 rounded-sm px-2 py-0.5 font-semibold">{a.autonomy}</span>
                      </td>
                      <td className="px-4 py-3 w-28">
                        <div className="flex items-center gap-2">
                          <HealthBar value={a.health} />
                          <span className={cn("text-[10px] font-mono font-bold shrink-0", a.health >= 90 ? "text-emerald-600" : "text-amber-600")}>{a.health}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${a.utilization}%` }} />
                          </div>
                          <span className="text-[10px] font-mono">{a.utilization}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-sm">{a.sla}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono font-bold text-primary">{a.roi}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => selectAndView(a.id)}
                            className="text-[9px] uppercase tracking-widest text-primary font-bold border border-primary/20 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">
                            View
                          </button>
                          <button onClick={() => { setHarnessAgentId(a.id); setActiveTab("harness"); }}
                            className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border border-border rounded-sm px-2 py-1 hover:bg-muted/40 transition-colors">
                            Test
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAgents.length === 0 && (
                <div className="px-4 py-8 text-center text-[11px] text-muted-foreground">No agents match your search or filter.</div>
              )}
            </div>
          </div>
        )}

        {/* ── AGENT OVERVIEW ────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="p-6 space-y-4">
            {/* Agent header */}
            <div className="bg-white border border-border rounded-sm shadow-sm p-4 flex items-center gap-6">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                <Bot size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base font-bold text-foreground">{agent.name}</span>
                  <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded-sm border border-border">{agent.employeeId}</span>
                  <BUBadge bu={agent.bu} />
                  <StatusBadge status={agent.status} />
                </div>
                <div className="text-[10px] text-muted-foreground">{agent.role} · {agent.model} {agent.version} · {agent.autonomy} autonomy</div>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { label: "Health", value: `${agent.health}/100`, color: agent.health >= 90 ? "text-emerald-600" : "text-amber-600" },
                  { label: "SLA", value: `${agent.sla}%`, color: "text-foreground" },
                  { label: "ROI", value: agent.roi, color: "text-primary" },
                  { label: "Rev Protected", value: agent.revenueProtected, color: "text-emerald-600" },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                    <div className={cn("text-sm font-bold font-mono", m.color)}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => selectAndView(MFG_AGENTS[(MFG_AGENTS.findIndex(a => a.id === selectedAgent) - 1 + MFG_AGENTS.length) % MFG_AGENTS.length].id)}
                  className="w-7 h-7 flex items-center justify-center rounded-sm border border-border hover:bg-muted/40 transition-colors text-muted-foreground">
                  ‹
                </button>
                <button onClick={() => selectAndView(MFG_AGENTS[(MFG_AGENTS.findIndex(a => a.id === selectedAgent) + 1) % MFG_AGENTS.length].id)}
                  className="w-7 h-7 flex items-center justify-center rounded-sm border border-border hover:bg-muted/40 transition-colors text-muted-foreground">
                  ›
                </button>
              </div>
            </div>

            {/* Section pills */}
            <div className="flex gap-1">
              {([
                { id: "edit", label: "Edit", icon: Edit3 },
                { id: "logs", label: "Logs", icon: Terminal },
                { id: "history", label: "History", icon: History },
                { id: "requests", label: "Requests", icon: Activity },
                { id: "suggestions", label: "Suggestions", icon: Lightbulb },
                { id: "quick-actions", label: "Quick Actions", icon: Zap },
              ] as Array<{ id: OverviewSection; label: string; icon: React.ElementType }>).map(s => {
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => setOverviewSection(s.id)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold rounded-sm border transition-colors",
                      overviewSection === s.id ? "bg-primary/5 border-primary/30 text-primary" : "bg-white border-border text-muted-foreground hover:text-foreground")}>
                    <Icon size={10} />{s.label}
                  </button>
                );
              })}
            </div>

            {/* ── Edit ── */}
            {overviewSection === "edit" && (
              <div className="bg-white border border-border rounded-sm shadow-sm p-5 space-y-4">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Agent Configuration</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Agent Name", key: "name" },
                    { label: "Role", key: "role" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">{f.label}</label>
                      <input value={(editForm as Record<string, string>)[f.key]}
                        onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-[11px] border border-border rounded-sm bg-muted/20 focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">Autonomy Level</label>
                    <select value={editForm.autonomy} onChange={e => setEditForm(p => ({ ...p, autonomy: e.target.value }))}
                      className="w-full px-3 py-2 text-[11px] border border-border rounded-sm bg-muted/20 focus:outline-none focus:border-primary">
                      {["assisted", "supervised", "full"].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">Foundation Model</label>
                    <select value={editForm.model} onChange={e => setEditForm(p => ({ ...p, model: e.target.value }))}
                      className="w-full px-3 py-2 text-[11px] border border-border rounded-sm bg-muted/20 focus:outline-none focus:border-primary">
                      {["GPT-4o", "GPT-4o-mini", "Claude-3.5-Sonnet", "Gemini-1.5-Pro"].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">Description / Mission</label>
                  <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} className="w-full px-3 py-2 text-[11px] border border-border rounded-sm bg-muted/20 focus:outline-none focus:border-primary resize-none" />
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Connected Systems</div>
                  <div className="flex gap-2 flex-wrap">
                    {agent.systems.map(s => (
                      <span key={s} className="text-[9px] font-mono bg-muted/40 border border-border rounded-sm px-2 py-1">{s}</span>
                    ))}
                    <button onClick={() => toast({ description: "System integration panel opened." })}
                      className="text-[9px] font-mono text-primary border border-primary/20 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">+ Add System</button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => toast({ description: "Changes discarded." })}
                    className="px-4 py-1.5 text-[9px] uppercase tracking-widest font-semibold border border-border rounded-sm hover:bg-muted/40 transition-colors">
                    Discard
                  </button>
                  <button onClick={() => toast({ title: "Agent Updated", description: `${editForm.name} configuration saved.` })}
                    className="px-4 py-1.5 text-[9px] uppercase tracking-widest font-bold bg-primary text-white rounded-sm hover:bg-primary/90 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* ── Logs ── */}
            {overviewSection === "logs" && (
              <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Execution Logs — Last Hour</span>
                  <button onClick={() => toast({ description: "Logs refreshed." })}
                    className="text-[9px] uppercase tracking-widest text-primary font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
                    <RotateCcw size={9} />Refresh
                  </button>
                </div>
                {logs.map((log, i) => (
                  <div key={i} className={cn("flex items-start gap-3 px-4 py-2.5 border-b border-border/40 last:border-b-0 text-[10px]", {
                    "bg-red-50/40": log.level === "CRIT" || log.level === "ERROR",
                    "bg-amber-50/30": log.level === "WARN",
                  })}>
                    <span className="font-mono text-muted-foreground shrink-0 w-14">{log.time}</span>
                    <span className={cn("font-bold uppercase tracking-widest shrink-0 w-10", {
                      "text-red-600": log.level === "CRIT" || log.level === "ERROR",
                      "text-amber-600": log.level === "WARN",
                      "text-emerald-600": log.level === "INFO",
                    })}>{log.level}</span>
                    <span className="text-foreground flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── History ── */}
            {overviewSection === "history" && (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className={cn("bg-white border rounded-sm p-4 shadow-sm flex items-start gap-3", {
                    "border-border": h.status === "success",
                    "border-amber-200": h.status === "warning",
                    "border-red-200": h.status === "failed",
                  })}>
                    <div className={cn("w-6 h-6 rounded-sm flex items-center justify-center shrink-0 mt-0.5", {
                      "bg-emerald-100": h.status === "success",
                      "bg-amber-100": h.status === "warning",
                      "bg-red-100": h.status === "failed",
                    })}>
                      {h.status === "success" ? <CheckCircle2 size={12} className="text-emerald-600" /> : <AlertTriangle size={12} className="text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-foreground mb-0.5">{h.task}</div>
                      <div className="text-[9px] text-muted-foreground">{h.outcome}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock size={10} className="text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{h.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Requests ── */}
            {overviewSection === "requests" && (
              <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">API Requests — Recent</span>
                </div>
                <table className="w-full text-[10px]">
                  <thead className="bg-muted/20 border-b border-border">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-[9px] uppercase tracking-widest text-muted-foreground text-left">Endpoint</th>
                      <th className="px-4 py-2 font-semibold text-[9px] uppercase tracking-widest text-muted-foreground text-left">Method</th>
                      <th className="px-4 py-2 font-semibold text-[9px] uppercase tracking-widest text-muted-foreground text-left">Latency</th>
                      <th className="px-4 py-2 font-semibold text-[9px] uppercase tracking-widest text-muted-foreground text-left">Status</th>
                      <th className="px-4 py-2 font-semibold text-[9px] uppercase tracking-widest text-muted-foreground text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-mono text-foreground">{r.endpoint}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm", r.method === "GET" ? "text-blue-600 bg-blue-50" : r.method === "POST" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50")}>{r.method}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{r.latency}ms</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-sm", r.status < 300 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50")}>{r.status}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground text-right">{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Suggestions ── */}
            {overviewSection === "suggestions" && (
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-white border border-border rounded-sm p-4 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-7 h-7 rounded-sm flex items-center justify-center shrink-0 mt-0.5", {
                          "bg-blue-100 text-blue-600": s.type === "upgrade",
                          "bg-emerald-100 text-emerald-600": s.type === "expand",
                          "bg-amber-100 text-amber-600": s.type === "tune",
                          "bg-red-100 text-red-600": s.type === "reduce",
                        })}>
                          {s.type === "upgrade" ? <TrendingUp size={12} /> : s.type === "expand" ? <Plus size={12} /> : <Settings size={12} />}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-foreground mb-0.5">{s.title}</div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-sm">{s.impact}</span>
                            <span className="text-[9px] text-muted-foreground">{s.confidence}% confidence</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => toast({ title: "Suggestion Scheduled", description: "Added to improvement backlog." })}
                          className="text-[9px] uppercase tracking-widest text-primary font-bold border border-primary/20 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">
                          Schedule
                        </button>
                        <button onClick={() => toast({ title: "Applying Improvement", description: `${s.title.slice(0, 30)}...` })}
                          className="text-[9px] uppercase tracking-widest text-white font-bold bg-primary rounded-sm px-2 py-1 hover:bg-primary/90 transition-colors">
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Quick Actions ── */}
            {overviewSection === "quick-actions" && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Deploy Agent", desc: "Push to production with current config", icon: Play, color: "text-emerald-600 bg-emerald-50 border-emerald-200", action: () => toast({ title: "Agent Deployed", description: `${agent.name} is now live.` }) },
                  { label: "Suspend Agent", desc: "Pause execution — resume at any time", icon: Pause, color: "text-amber-600 bg-amber-50 border-amber-200", action: () => toast({ title: "Agent Suspended", description: `${agent.name} paused.` }) },
                  { label: "Run Test Suite", desc: "Execute all evaluation scenarios", icon: FlaskConical, color: "text-blue-600 bg-blue-50 border-blue-200", action: () => { setHarnessAgentId(agent.id); setActiveTab("harness"); } },
                  { label: "Open Harness", desc: "Interactive test runner with custom inputs", icon: Terminal, color: "text-violet-600 bg-violet-50 border-violet-200", action: () => { setHarnessAgentId(agent.id); setActiveTab("harness"); } },
                  { label: "Prompt Studio", desc: "Edit system prompt and test configurations", icon: TerminalSquare, color: "text-primary bg-primary/5 border-primary/20", action: () => navigate("/prompt-playground") },
                  { label: "View in BU", desc: `Navigate to ${agent.department} business unit`, icon: ArrowRight, color: "text-muted-foreground bg-muted/40 border-border", action: () => navigate(`/business-units/${agent.bu}`) },
                ].map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button key={i} onClick={action.action}
                      className={cn("bg-white border rounded-sm p-4 shadow-sm text-left hover:shadow-md transition-all", action.color)}>
                      <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center mb-3 border", action.color)}>
                        <Icon size={16} />
                      </div>
                      <div className="text-[10px] font-bold text-foreground mb-0.5">{action.label}</div>
                      <div className="text-[9px] text-muted-foreground">{action.desc}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── COMMAND CENTER ────────────────────────────── */}
        {activeTab === "command-center" && (
          <div className="p-6 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Active Agents", value: activeCount, sub: "of " + scopedAgents.length + " total", color: "text-emerald-600" },
                { label: "Tasks Today", value: scopedAgents.reduce((s, a) => s + a.tasks, 0).toLocaleString(), sub: role === "dept_manager" ? "your department" : "across all BUs", color: "text-foreground" },
                { label: "Decisions Made", value: "2,184", sub: "14 human escalated", color: "text-primary" },
                { label: "Pending Approvals", value: "47", sub: "4 high priority", color: "text-amber-600" },
              ].map(m => (
                <div key={m.label} className="bg-white border border-border rounded-sm p-4 shadow-sm">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                  <div className={cn("text-2xl font-bold font-mono tabular-nums", m.color)}>{m.value}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* BU Orchestrator cards */}
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
              {role === "dept_manager" ? "Your Business Unit" : "Business Unit Orchestrators"}
            </div>
            <div className={cn("grid gap-3", role === "dept_manager" ? "grid-cols-1 max-w-xs" : "grid-cols-5")}>
              {(role === "dept_manager" ? BU_LIST.filter(bu => bu.id === persona.buId) : BU_LIST).map(bu => (
                <button key={bu.id} onClick={() => navigate(`/business-units/${bu.id}`)}
                  className="bg-white border border-border rounded-sm p-3 shadow-sm text-left hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{bu.name}</span>
                    <span className={cn("text-[9px] font-bold font-mono", bu.health >= 85 ? "text-emerald-600" : bu.health >= 70 ? "text-amber-600" : "text-red-600")}>{bu.health}%</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-primary mb-1">{bu.eei}</div>
                  <div className="text-[8px] text-muted-foreground">EEI · {bu.agents} agents</div>
                  <div className="mt-2 w-full h-0.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", bu.health >= 85 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${bu.health}%` }} />
                  </div>
                </button>
              ))}
            </div>

            {/* Live activity feed */}
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Live Agent Activity</div>
              <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
                {(role === "dept_manager" ? COMMAND_CENTER_FEEDS.filter(f => f.bu.toLowerCase().replace(" ", "-") === persona.buId) : COMMAND_CENTER_FEEDS).map((feed, i) => (
                  <div key={i} className={cn("flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-b-0 hover:bg-muted/20 transition-colors", {
                    "bg-red-50/30": feed.severity === "critical",
                    "bg-amber-50/20": feed.severity === "warning",
                  })}>
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", {
                      "bg-red-500 animate-pulse": feed.severity === "critical",
                      "bg-amber-500": feed.severity === "warning",
                      "bg-emerald-500": feed.severity === "success",
                      "bg-blue-400": feed.severity === "info",
                    })} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-primary">{feed.agent}</span>
                        <BUBadge bu={feed.bu.toLowerCase().replace(" ", "-")} />
                      </div>
                      <div className="text-[10px] text-foreground">{feed.action}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-muted-foreground">{feed.time}</span>
                      <button onClick={() => toast({ description: `Action reviewed: ${feed.agent}` })}
                        className="text-[9px] uppercase tracking-widest text-primary font-bold border border-primary/20 rounded-sm px-2 py-0.5 hover:bg-primary/5 transition-colors">
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Workforce Management ── */}
            <WorkforceManagement />
          </div>
        )}

        {/* ── HARNESS ───────────────────────────────────── */}
        {activeTab === "harness" && (
          <div className="p-6 flex gap-4 h-full">
            {/* Left config */}
            <div className="w-72 shrink-0 space-y-3">
              <div className="bg-white border border-border rounded-sm shadow-sm p-4 space-y-3">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Test Configuration</div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">Agent Under Test</label>
                  <select value={harnessAgentId} onChange={e => setHarnessAgentId(e.target.value)}
                    className="w-full text-[10px] border border-border rounded-sm px-2 py-1.5 bg-muted/20 font-semibold">
                    {MFG_AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">Test Scenario</label>
                  <select value={harnessScenario}
                    onChange={e => { setHarnessScenario(e.target.value); const sc = HARNESS_SCENARIOS.find(s => s.id === e.target.value); if (sc) setHarnessInput(sc.input); }}
                    className="w-full text-[10px] border border-border rounded-sm px-2 py-1.5 bg-muted/20 font-semibold">
                    {HARNESS_SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-white border border-border rounded-sm shadow-sm p-4 space-y-2">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Evaluation Criteria</div>
                {["Factual Accuracy", "Actionability", "Response Structure", "Context Relevance", "Safety Compliance"].map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-3 h-3 accent-primary" />
                    <span className="text-[10px] text-foreground">{c}</span>
                  </label>
                ))}
              </div>
              {harnessMetrics && (
                <div className="bg-white border border-border rounded-sm shadow-sm p-4 space-y-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Run Metrics</div>
                  {[
                    { label: "Latency", value: `${harnessMetrics.latency}ms` },
                    { label: "Tokens", value: harnessMetrics.tokens.toLocaleString() },
                    { label: "Cost", value: harnessMetrics.cost },
                    { label: "Confidence", value: `${harnessMetrics.confidence}%` },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{m.label}</span>
                      <span className="text-[10px] font-mono font-bold text-foreground">{m.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: input + output */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col" style={{ flex: "0 0 auto", maxHeight: 200 }}>
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between shrink-0">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Test Input</span>
                  <button onClick={runHarness} disabled={harnessRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold bg-primary text-white rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
                    {harnessRunning ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Running…</> : <><Play size={9} fill="white" />Run Test</>}
                  </button>
                </div>
                <textarea value={harnessInput} onChange={e => setHarnessInput(e.target.value)}
                  className="flex-1 p-4 text-[11px] resize-none focus:outline-none font-mono bg-transparent min-h-[120px]" />
              </div>
              <div className="flex-1 bg-white border border-border rounded-sm shadow-sm flex flex-col min-h-0">
                <div className="px-4 py-2.5 border-b border-border shrink-0">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                    {harnessRunning ? "Streaming output…" : harnessOutput ? "Test Output" : "Output will appear here"}
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {harnessOutput ? (
                    <div className="text-[11px] font-mono text-foreground whitespace-pre-wrap leading-relaxed">{harnessOutput}</div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[11px] text-muted-foreground">
                      Configure a scenario and click Run Test to begin
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Hire Agent Modal ─── */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-border shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="text-sm font-bold tracking-widest uppercase text-foreground">Hire New Agent</div>
              <button onClick={() => setShowHireModal(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {[
                { label: "Agent Name", placeholder: "e.g. Quality Controller AI" },
                { label: "Role / Mission", placeholder: "e.g. Detect and classify production defects" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">{f.label}</label>
                  <input placeholder={f.placeholder} className="w-full px-3 py-2 text-[11px] border border-border rounded-sm focus:outline-none focus:border-primary" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">Business Unit</label>
                  <select className="w-full text-[10px] border border-border rounded-sm px-2 py-2 focus:outline-none focus:border-primary">
                    {BU_LIST.map(b => <option key={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">Foundation Model</label>
                  <select className="w-full text-[10px] border border-border rounded-sm px-2 py-2 focus:outline-none focus:border-primary">
                    {["GPT-4o", "GPT-4o-mini", "Claude-3.5-Sonnet"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setShowHireModal(false)}
                className="px-4 py-2 text-[9px] uppercase tracking-widest font-semibold border border-border rounded-sm hover:bg-muted/40 transition-colors">
                Cancel
              </button>
              <button onClick={() => { setShowHireModal(false); toast({ title: "Agent Created", description: "New agent added to inventory. Configure in Agent Studio." }); }}
                className="px-4 py-2 text-[9px] uppercase tracking-widest font-bold bg-primary text-white rounded-sm hover:bg-primary/90 transition-colors">
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
