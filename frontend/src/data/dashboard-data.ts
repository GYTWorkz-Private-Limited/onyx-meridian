
// Deterministic data generator — no Math.random() in render
function s(i: number, offset = 0, amp = 1, base = 0) {
  return base + amp * (Math.sin(i * 0.42 + offset) * 0.5 + 0.5);
}
function c(i: number, offset = 0, amp = 1, base = 0) {
  return base + amp * (Math.cos(i * 0.38 + offset) * 0.5 + 0.5);
}
function round(v: number, d = 0) {
  return parseFloat(v.toFixed(d));
}

export const DAYS = Array.from({ length: 30 }, (_, i) => `D${i + 1}`);

// ─── Cost Over Time ────────────────────────────────────────────────────────
export const COST_DATA = DAYS.map((day, i) => ({
  day,
  OpenAI:    round(s(i, 0,    1200, 1800) + i * 22),
  Azure:     round(s(i, 1.2,  500,  700)  + i * 8),
  AWS:       round(s(i, 2.1,  400,  600)  + i * 5),
  Anthropic: round(c(i, 0.8,  300,  400)  + i * 4),
  GCP:       round(c(i, 1.5,  200,  250)  + i * 3),
}));

// ─── Task Execution ────────────────────────────────────────────────────────
export const TASK_DATA = DAYS.map((day, i) => ({
  day,
  Completed: round(s(i, 0,   20, 80)),
  Running:   round(c(i, 0.5, 12, 16)),
  Queued:    round(s(i, 1.1,  8, 10)),
  Retried:   round(c(i, 2,    5,  6)),
  Failed:    round(s(i, 3,    3,  2)),
}));

// ─── AI Workforce Activity ─────────────────────────────────────────────────
export const WORKFORCE_DATA = DAYS.map((day, i) => ({
  day,
  Active:   round(s(i, 0,    80, 380)),
  Idle:     round(c(i, 1,    30,  55)),
  Learning: round(s(i, 2.2,  10,  18)),
  Blocked:  round(c(i, 3,     6,   8)),
}));

// ─── Response Latency Percentiles ─────────────────────────────────────────
export const LATENCY_DATA = DAYS.map((day, i) => ({
  day,
  Max:     round(s(i, 0,   200, 580)),
  P99:     round(c(i, 0.5, 100, 320)),
  P95:     round(s(i, 1,    80, 270)),
  P90:     round(c(i, 1.5,  60, 230)),
  Average: round(s(i, 2,    40, 140)),
}));

// ─── Knowledge Retrieval ──────────────────────────────────────────────────
export const KNOWLEDGE_DATA = DAYS.map((day, i) => ({
  day,
  Requests:      round(s(i, 0, 3000, 5000)),
  RetrievalTime: round(c(i, 1,   18,   28), 1),
}));

// ─── Business Value ───────────────────────────────────────────────────────
export const BUSINESS_VALUE_DATA = DAYS.map((day, i) => ({
  day,
  Revenue: round(s(i, 0, 40000, 62000) + i * 1800),
}));

// ─── Revenue (Executive Command — CXO) ────────────────────────────────────
export const REVENUE_SNAPSHOT = {
  today: "$412K",
  todayTrend: "↑6%",
  monthly: "$9.7M",
  monthlyTrend: "↑11%",
  quarterly: "$28.4M",
  quarterlyTrend: "↑9%",
};

// ─── Current Business Stock (Executive Command — CXO) ─────────────────────
export const CURRENT_STOCK = {
  value: "$4.2M",
  trend: "↓3%",
};

// ─── Top Performing Departments ────────────────────────────────────────────
export const DEPT_PERF = [
  { dept: "Support",    score: 128 },
  { dept: "Operations", score: 118 },
  { dept: "Sales",      score: 106 },
  { dept: "Finance",    score: 98  },
  { dept: "IT",         score: 88  },
  { dept: "Marketing",  score: 82  },
  { dept: "HR",         score: 64  },
  { dept: "Legal",      score: 44  },
];

// ─── Top Resource Consuming Agents ────────────────────────────────────────
export const RESOURCE_AGENTS = [
  { agent: "Finance-Sup-01",  value: 118, color: "#8b5cf6" },
  { agent: "Legal-Ana-03",    value: 97,  color: "#60a5fa" },
  { agent: "Ops-Mgr-02",      value: 88,  color: "#8b5cf6" },
  { agent: "Support-Bot-12",  value: 83,  color: "#94a3b8" },
  { agent: "HR-Screen-06",    value: 72,  color: "#94a3b8" },
  { agent: "Sales-Gen-08",    value: 64,  color: "#f97316" },
];

// ─── Activity Heatmap (8 depts × 24 hours) ────────────────────────────────
const DEPT_NAMES = ["Finance", "HR", "Ops", "IT", "Legal", "Sales", "Mktg", "Support"];
const HOURS = Array.from({ length: 25 }, (_, i) => i);

export const ACTIVITY_HEATMAP = DEPT_NAMES.map((dept, di) => ({
  dept,
  hours: HOURS.map((h) => {
    const peak = di % 2 === 0 ? 9 : 10;
    const intensity = Math.max(0, Math.round(s(h, di * 0.7, 8, 1) * c(h, di * 0.4, 4, 0)));
    const business = h >= 8 && h <= 17 ? 1 : 0;
    return { h, v: Math.min(10, round(intensity * business + s(h, di, 2, 0))) };
  }),
}));

// ─── Failure Heatmap (8 depts × 30 days) ─────────────────────────────────
export const FAILURE_HEATMAP = DEPT_NAMES.map((dept, di) => ({
  dept,
  days: DAYS.map((day, i) => ({
    day,
    v: Math.round(Math.max(0, s(i, di * 0.9, 4, 0) * c(i, di * 0.4, 3, 0))),
  })),
}));

// ─── Alerts ───────────────────────────────────────────────────────────────
export const ALERTS = [
  { severity: "CRITICAL", title: "Finance Supervisor Agent hallu...", source: "Finance-Supervisor-01", time: "14:25" },
  { severity: "CRITICAL", title: "Production knowledge sync fai...",  source: "SAP-HR-Connector",      time: "14:22" },
  { severity: "HIGH",     title: "GitHub MCP timeout, 12 failures in 1h", source: "GitHub-MCP-01",   time: "14:20" },
  { severity: "HIGH",     title: "Knowledge index outdated",          source: "SAP HR, last sync 18h ago", time: "14:18" },
  { severity: "HIGH",     title: "Cloud budget at 85% of monthly li...", source: "Azure Cost Monitor", time: "14:15" },
  { severity: "MEDIUM",   title: "Memory threshold approaching ...",  source: "System",                time: "14:10" },
];

// ─── System Logs ──────────────────────────────────────────────────────────
export const SYSTEM_LOGS = [
  { ts: "14:48:12", severity: "INFO",    module: "AgentExecutor", agent: "Finance-Sup-01",      action: "ProcessTask" },
  { ts: "14:48:10", severity: "WARNING", module: "MemoryMgr",     agent: "System",              action: "GarbageCollect" },
  { ts: "14:48:05", severity: "ERROR",   module: "MCP-Client",    agent: "GitHub-Connector",    action: "FetchRepo" },
  { ts: "14:47:55", severity: "INFO",    module: "Planner",       agent: "Orchestrator",        action: "DelegateTask" },
  { ts: "14:47:40", severity: "INFO",    module: "ToolCaller",    agent: "Legal-Ana-03",        action: "SearchCase" },
  { ts: "14:47:32", severity: "ERROR",   module: "PolicyGuard",   agent: "HR-Screen-05",        action: "ValidateOutput" },
  { ts: "14:47:15", severity: "INFO",    module: "KnowledgeRet",  agent: "Sales-Gen-08",        action: "VectorSearch" },
  { ts: "14:47:01", severity: "WARNING", module: "TokenBudget",   agent: "Finance-Sup-01",      action: "ThrottleRequest" },
  { ts: "14:46:55", severity: "INFO",    module: "AgentExecutor", agent: "Ops-Mgr-02",          action: "CoordinateTeam" },
  { ts: "14:46:40", severity: "INFO",    module: "Scheduler",     agent: "System",              action: "DispatchBatch" },
];

export const LIVE_EVENTS_INIT = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  text: `New system event simulated ${36 - i}`,
  time: `10:${String(17 - Math.floor(i / 2)).padStart(2, "0")}`,
}));

// ─── Resource Dashboard ───────────────────────────────────────────────────
export const RESOURCE_DASH = {
  CPU: { value: 62, color: "text-emerald-600" },
  GPU: { value: 78, color: "text-amber-500" },
  RAM: { value: 71, color: "text-amber-500" },
  VRAM: { value: 45, color: "text-emerald-600" },
  Storage: { value: 34, color: "text-emerald-600" },
  Network: { value: 89, color: "text-red-500" },
  Containers: { value: "23/30", color: "text-amber-500" },
  Pods: { value: "187/200", color: "text-amber-500" },
  Workers: { value: "42/50", color: "text-emerald-600" },
  Autoscaling: { value: "ON", color: "text-emerald-600" },
  "Cloud Credits": { value: "$12,400", color: "text-emerald-600" },
  "API Quotas": { value: "67%", color: "text-amber-500" },
};

// ─── Model Analytics ─────────────────────────────────────────────────────
export const MODEL_ANALYTICS = [
  { label: "Most Used",       value: "GPT-4o (45%)", sub: "" },
  { label: "Fastest",         value: "Gemini Flash (0.8s)", sub: "" },
  { label: "Cheapest",        value: "Llama 3.3 ($0.0004)", sub: "" },
  { label: "High Accuracy",   value: "Claude 3.7 (96.4%)", sub: "", color: "" },
  { label: "High Hallucination", value: "Qwen-72B (3.2%)", sub: "", color: "text-red-500" },
  { label: "High Context",    value: "GPT-4o (28K avg)", sub: "" },
  { label: "Long Reasoning",  value: "o3 (42 steps)", sub: "" },
  { label: "High Tool Usage", value: "Claude 3.5 (8.4)", sub: "" },
  { label: "High Memory",     value: "GPT-4o (12MB avg)", sub: "" },
];

// ─── Knowledge Summary ────────────────────────────────────────────────────
export const KNOWLEDGE_SUMMARY = {
  "Knowledge Bases": { value: "24", color: "" },
  "Docs Indexed": { value: "1.2M", color: "" },
  "Chunks": { value: "8.4M", color: "" },
  "Embeddings": { value: "8.4M", color: "" },
  "Vector Stores": { value: "8 (All Healthy)", color: "text-emerald-600" },
  "Freshness": { value: "94%", color: "text-emerald-600" },
  "Broken Sources": { value: "3", color: "text-red-500" },
  "Sync Failures": { value: "7", color: "text-amber-500" },
  "Confidence": { value: "91%", color: "" },
};

// ─── Tool & Integration Summary ───────────────────────────────────────────
export const TOOL_SUMMARY = {
  "Connected APIs": { value: "47", status: "ok" },
  "REST APIs": { value: "31", status: "ok" },
  "GraphQL": { value: "6", status: "ok" },
  "MCP Servers": { value: "12 (1 warning)", status: "warn" },
  "Databases": { value: "8", status: "ok" },
  "GitHub": { value: "Online", status: "ok" },
  "Linear / Slack": { value: "Online", status: "ok" },
  "Salesforce": { value: "Warning", status: "warn" },
  "Custom SDKs": { value: "14", status: "ok" },
};

// ─── Security & Compliance ────────────────────────────────────────────────
export const SECURITY = [
  { label: "Prompt Injections", value: "23 (Blocked)", color: "text-red-600" },
  { label: "Blocked Requests", value: "1,847", color: "" },
  { label: "Jailbreak Attempts", value: "8", color: "text-red-600" },
  { label: "PII Detections", value: "341", color: "text-amber-600" },
  { label: "Policy Violations", value: "12", color: "text-amber-600" },
  { label: "Secrets Exposed", value: "0", color: "text-emerald-600" },
  { label: "Access Violations", value: "5", color: "text-red-600" },
  { label: "Unauth MCP Calls", value: "3", color: "text-amber-600" },
  { label: "High Risk Agents", value: "4", color: "text-red-600" },
];

// ─── Executive Insights ────────────────────────────────────────────────────
export const EXEC_INSIGHTS = [
  { icon: "↗", color: "text-emerald-600", text: "Finance ABU performing 18% above average" },
  { icon: "⚠", color: "text-amber-500",   text: "HR Agent Cluster showing elevated latency (avg +340ms)" },
  { icon: "⊘", color: "text-orange-500",  text: "Procurement MCP experiencing timeout spikes" },
  { icon: "↘", color: "text-red-500",     text: "Overall hallucination rate up 0.4% vs last week" },
  { icon: "↗", color: "text-emerald-600", text: "Manufacturing ABU OEE at 91.3% — above Q3 target" },
  { icon: "↗", color: "text-emerald-600", text: "Business value generated +$14K vs yesterday" },
];
