export type Severity = "ERR" | "WAR" | "INF" | "DEB";
export type LogResult = "Success" | "Timeout" | "Escalated" | "Blocked" | "Failed" | "Retried";

export interface AgentLog {
  id: string;
  timestamp: string;
  severity: Severity;
  agent: string;
  agentVersion: string;
  agentId: string;
  abu: string;
  department: string;
  mission: string;
  workflow: string;
  task: string;
  module: string;
  action: string;
  resource: string;
  mcpServer: string;
  model: string;
  promptVersion: string;
  result: LogResult;
  latencyMs: number;
  queueTimeMs: number;
  executionTimeMs: number;
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  costUsd: number;
  memoryMb: number;
  contextSize: number;
  knowledgeSources: string;
  docsRetrieved: number;
  toolCalls: number;
  apiStatus: number;
  retryCount: number;
  statusCode: number;
  error: string;
  traceId: string;
  sessionId: string;
  user: string;
  environment: string;
  region: string;
}

// ─── Reference tables ────────────────────────────────────────────────────
const AGENTS = [
  { name: "Finance-Specialist-03", id: "FIN-323", abu: "Finance ABU",      dept: "Finance",  model: "GPT-4o",         resource: "SharePoint",    mcp: "SAP-Connector",      module: "Memory",    action: "Policy Check" },
  { name: "Legal-Reviewer-001",    id: "LEG-718", abu: "Legal ABU",         dept: "Legal",    model: "Claude 3.7",     resource: "Oracle ERP",    mcp: "Legal-MCP",          module: "Execution", action: "Task Delegation" },
  { name: "HR-Ops-Agent-012",      id: "HR-701",  abu: "Operations ABU",    dept: "HR",       model: "Gemini Flash",   resource: "GitHub MCP",    mcp: "GitHub-MCP-01",      module: "Execution", action: "Policy Check" },
  { name: "Planner-024",           id: "PRD-042", abu: "Manufacturing ABU", dept: "Ops",      model: "GPT-4o",         resource: "Finance ABU",   mcp: "SAP-PP-Connector",   module: "Execution", action: "Task Delegation" },
  { name: "Research-018",          id: "PRD-018", abu: "Supply Chain ABU",  dept: "Ops",      model: "Claude 3.5",     resource: "SAP HR",        mcp: "SAP-HR-Connector",   module: "Knowledge", action: "Knowledge Retrieval" },
  { name: "Platform-Ops-018",      id: "ENG-869", abu: "IT ABU",            dept: "IT",       model: "GPT-4o",         resource: "SharePoint",    mcp: "M365-Connector",     module: "Execution", action: "Auth Validation" },
  { name: "Supervisor-001",        id: "MFG-001", abu: "Manufacturing ABU", dept: "Ops",      model: "o3",             resource: "MES Scheduler", mcp: "MES-Connector",      module: "Tool",      action: "Tool Invocation" },
  { name: "Lead-Qualifier-011",    id: "SAL-529", abu: "Revenue ABU",       dept: "Sales",    model: "GPT-4o-mini",    resource: "Oracle ERP",    mcp: "CRM-Connector",      module: "Policy",    action: "Memory Write" },
  { name: "Finance-Controller-002",id: "FIN-889", abu: "Finance ABU",       dept: "Finance",  model: "Claude 3.7",     resource: "Policy Engine", mcp: "SAP-FI-Connector",   module: "Policy",    action: "Policy Check" },
  { name: "Brand-Guard-007",       id: "MAR-821", abu: "Marketing ABU",     dept: "Mktg",     model: "GPT-4o",         resource: "Database Query",mcp: "CMS-Connector",      module: "Inference", action: "Memory Read" },
  { name: "Audit-Agent-001",       id: "SEC-001", abu: "Governance ABU",    dept: "Legal",    model: "Claude 3.7",     resource: "Policy Engine", mcp: "GRC-Connector",      module: "Security",  action: "Auth Validation" },
  { name: "Supply-Optimizer-003",  id: "OPE-456", abu: "Supply Chain ABU",  dept: "Ops",      model: "GPT-4o",         resource: "Memory Store",  mcp: "WMS-Connector",      module: "Deployment",action: "Agent Spawn" },
  { name: "UX-Analyst-002",        id: "PRD-742", abu: "IT ABU",            dept: "IT",       model: "Gemini Flash",   resource: "Database Query",mcp: "Analytics-MCP",      module: "Knowledge", action: "Agent Spawn" },
  { name: "Finance-Controller-002",id: "FIN-144", abu: "Finance ABU",       dept: "Finance",  model: "GPT-4o",         resource: "Memory Store",  mcp: "SAP-FI-Connector",   module: "Tool",      action: "Agent Spawn" },
  { name: "OEE-Optimizer-01",      id: "MFG-211", abu: "Manufacturing ABU", dept: "Ops",      model: "GPT-4o",         resource: "MES Scheduler", mcp: "MES-Connector",      module: "Execution", action: "OEE Calculation" },
  { name: "Predictive-Maint-02",   id: "MFG-312", abu: "Manufacturing ABU", dept: "Ops",      model: "Claude 3.5",     resource: "Sensor DB",     mcp: "IoT-Connector",      module: "Inference", action: "Anomaly Detection" },
  { name: "Demand-Planner-02",     id: "SCM-204", abu: "Supply Chain ABU",  dept: "Ops",      model: "GPT-4o",         resource: "ERP System",    mcp: "SAP-SD-Connector",   module: "Knowledge", action: "Demand Forecast" },
  { name: "Supplier-Risk-01",      id: "PRO-101", abu: "Procurement ABU",   dept: "Ops",      model: "Claude 3.7",     resource: "Supplier API",  mcp: "Supplier-MCP",       module: "Execution", action: "Risk Score Calc" },
  { name: "Revenue-Scout-01",      id: "REV-501", abu: "Revenue ABU",       dept: "Sales",    model: "GPT-4o",         resource: "CRM System",    mcp: "CRM-Connector",      module: "Knowledge", action: "Pipeline Analysis" },
  { name: "Quality-Inspector-03",  id: "MFG-433", abu: "Manufacturing ABU", dept: "Ops",      model: "Gemini Pro",     resource: "Vision API",    mcp: "Vision-MCP",         module: "Execution", action: "Defect Detection" },
];

const MISSIONS  = ["OEE Improvement Q3", "Supplier Risk Mitigation", "Q3 Pipeline Expansion", "Monthly Financial Close", "Line 7 Maintenance", "Workforce Planning", "Demand Forecast Refresh", "Security Audit Q3"];
const WORKFLOWS = ["WF-MFG-0041", "WF-PRO-0018", "WF-REV-0093", "WF-FIN-0022", "WF-OPS-0071", "WF-HR-0009", "WF-SCM-0034", "WF-SEC-0004"];
const TASKS     = ["Task: Analyze sensor data", "Task: Score supplier risk", "Task: Qualify lead", "Task: Reconcile invoices", "Task: Schedule maintenance", "Task: Validate policy", "Task: Retrieve knowledge", "Task: Spawn sub-agent", "Task: Generate forecast", "Task: Detect anomaly"];
const USERS     = ["j.morrison@onyx.io", "m.torres@onyx.io", "a.patel@onyx.io", "system", "scheduler", "orchestrator"];
const REGIONS   = ["us-east-1", "eu-west-1", "ap-southeast-1"];
const ENVS      = ["production", "production", "production", "staging"];
const KNOWLEDGE = ["SAP KBase, Maintenance SOP", "Supplier Risk Index, Policy DB", "CRM Knowledge, Sales Playbook", "Finance Policies, GAAP Rules", "MES Manual, Line Specs", "HR Policies, Labor Laws", "—", "Security Standards, SOC2"];
const PROMPT_VERSIONS = ["v2.4.1", "v3.0.0", "v2.9.3", "v1.8.7", "v3.1.0", "v2.7.2"];

function mkTime(minsAgo: number): string {
  const d = new Date(Date.now() - minsAgo * 60000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function pick<T>(arr: T[], i: number): T {
  return arr[Math.abs(i) % arr.length];
}

function seededInt(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
}

function mkTraceId(i: number): string {
  const hex = (n: number) => n.toString(16).padStart(8, "0");
  return `${hex(seededInt(i, 0x10000000, 0xffffffff))}-${hex(seededInt(i + 1, 0x1000, 0xffff))}-${hex(seededInt(i + 2, 0x1000, 0xffff))}`;
}

function mkSessionId(i: number): string {
  return `ses-${seededInt(i * 7, 100000, 999999)}`;
}

// Error messages tied to result type
function mkError(result: LogResult, module: string): string {
  if (result === "Success") return "—";
  if (result === "Timeout")   return "Connection timeout after 30,000ms";
  if (result === "Blocked")   return "Prompt injection detected — blocked";
  if (result === "Escalated") return "Confidence < threshold — escalated";
  if (result === "Failed")    return `${module} returned 500 Internal Error`;
  if (result === "Retried")   return "Rate limit hit — retry 2/3";
  return "—";
}

function mkLog(i: number): AgentLog {
  const agent    = pick(AGENTS, i + i * 3);
  const minsAgo  = seededInt(i, 1, 90);
  const lat      = seededInt(i * 7, 48, 31000);
  const queueT   = seededInt(i * 3, 5, 800);
  const execT    = Math.max(10, lat - queueT);
  const tIn      = seededInt(i * 11, 80, 8000);
  const tOut     = seededInt(i * 13, 40, 2000);
  const cost     = parseFloat(((tIn + tOut) * 0.000003).toFixed(6));
  const retries  = seededInt(i * 5, 0, 2);
  const errChance = seededInt(i * 17, 0, 9);
  const warnChance = seededInt(i * 19, 0, 9);
  const debChance = seededInt(i * 23, 0, 9);

  let severity: Severity = "INF";
  if      (errChance  < 1) severity = "ERR";
  else if (warnChance < 2) severity = "WAR";
  else if (debChance  < 1) severity = "DEB";

  let result: LogResult = "Success";
  if      (severity === "ERR" && seededInt(i, 0, 1) === 0) result = "Timeout";
  else if (severity === "ERR") result = "Blocked";
  else if (severity === "WAR" && seededInt(i, 0, 1) === 0) result = "Escalated";
  else if (severity === "WAR") result = "Retried";

  const statusCode = result === "Success" ? 200 : result === "Timeout" ? 503 : result === "Blocked" ? 403 : result === "Escalated" ? 200 : 500;

  return {
    id:             `log-${String(i + 1).padStart(4, "0")}`,
    timestamp:      mkTime(minsAgo),
    severity,
    agent:          agent.name,
    agentVersion:   `v${seededInt(i * 2, 1, 4)}.${seededInt(i * 3, 0, 9)}.${seededInt(i * 5, 0, 9)}`,
    agentId:        agent.id,
    abu:            agent.abu,
    department:     agent.dept,
    mission:        pick(MISSIONS, i),
    workflow:       pick(WORKFLOWS, i),
    task:           pick(TASKS, i),
    module:         agent.module,
    action:         agent.action,
    resource:       agent.resource,
    mcpServer:      agent.mcp,
    model:          agent.model,
    promptVersion:  pick(PROMPT_VERSIONS, i),
    result,
    latencyMs:      lat,
    queueTimeMs:    queueT,
    executionTimeMs: execT,
    tokensIn:       tIn,
    tokensOut:      tOut,
    tokensTotal:    tIn + tOut,
    costUsd:        cost,
    memoryMb:       seededInt(i * 7, 12, 512),
    contextSize:    seededInt(i * 9, 800, 128000),
    knowledgeSources: pick(KNOWLEDGE, i),
    docsRetrieved:  seededInt(i * 11, 0, 48),
    toolCalls:      seededInt(i * 13, 0, 12),
    apiStatus:      statusCode,
    retryCount:     retries,
    statusCode,
    error:          mkError(result, agent.module),
    traceId:        mkTraceId(i),
    sessionId:      mkSessionId(i),
    user:           pick(USERS, i),
    environment:    pick(ENVS, i),
    region:         pick(REGIONS, i),
  };
}

export const ALL_LOGS: AgentLog[] = Array.from({ length: 130 }, (_, i) => mkLog(i))
  .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

// ─── Execution trace for a given log ─────────────────────────────────────
export interface TraceStep {
  stage: string;
  durationMs: number;
  tokens?: number;
  status: "ok" | "warn" | "error";
  detail?: string;
}

export interface ToolInvocation {
  name: string;
  input: string;
  output: string;
  latencyMs: number;
  status: string;
}

export interface ExecutionTrace {
  log: AgentLog;
  timeline: TraceStep[];
  reasoningSteps: string[];
  prompt: string;
  response: string;
  memoryReads: string[];
  memoryWrites: string[];
  knowledgeChunks: string[];
  toolInvocations: ToolInvocation[];
  mcpCalls: { server: string; method: string; latencyMs: number; status: string }[];
  apiRequests: { endpoint: string; method: string; statusCode: number; latencyMs: number }[];
  policyEvals: { policy: string; result: string; detail: string }[];
  humanApprovals: { step: string; approver: string; status: string; latencyMs: number }[];
  observations: string[];
  evalResults: { metric: string; score: number; threshold: number; passed: boolean }[];
  errors: { ts: string; type: string; message: string; retry: number }[];
  tokenBreakdown: { stage: string; input: number; output: number }[];
  costBreakdown: { model: string; tokens: number; costUsd: number }[];
  latencyBreakdown: { phase: string; ms: number }[];
  relatedMission: string;
  relatedWorkflow: string;
  relatedIncident: string;
}

export function buildTrace(log: AgentLog): ExecutionTrace {
  const lat = log.latencyMs;
  return {
    log,
    timeline: [
      { stage: "Agent Initialization",    durationMs: seededInt(log.tokensIn, 8, 25),    tokens: 0,              status: "ok", detail: `Agent ${log.agent} spawned, loading context` },
      { stage: "Memory Read",             durationMs: seededInt(log.tokensIn + 1, 20, 180), tokens: log.tokensIn / 6 | 0, status: "ok", detail: "Reading working memory and session context" },
      { stage: "Knowledge Retrieval",     durationMs: seededInt(log.tokensIn + 2, 80, 480), tokens: log.tokensIn / 4 | 0, status: log.result === "Escalated" ? "warn" : "ok", detail: `Retrieved ${log.docsRetrieved} docs from ${log.knowledgeSources}` },
      { stage: "Context Assembly",        durationMs: seededInt(log.tokensIn + 3, 15, 90),  tokens: log.tokensIn,        status: "ok", detail: `Context size: ${log.contextSize.toLocaleString()} tokens` },
      { stage: "LLM Inference",           durationMs: Math.max(100, lat - 200),              tokens: log.tokensTotal,     status: log.severity === "ERR" ? "error" : "ok", detail: `Model: ${log.model} · Prompt v${log.promptVersion}` },
      { stage: "Tool Execution",          durationMs: seededInt(log.tokensIn + 4, 10, 400),  tokens: log.tokensOut / 2 | 0, status: log.result === "Timeout" ? "error" : "ok", detail: `${log.toolCalls} tool call(s) to ${log.resource}` },
      { stage: "Policy Evaluation",       durationMs: seededInt(log.tokensIn + 5, 5, 60),    tokens: 0,              status: log.result === "Blocked" ? "error" : "ok", detail: log.result === "Blocked" ? "Policy BLOCKED action" : "Policy PASSED" },
      { stage: "Output & Memory Write",   durationMs: seededInt(log.tokensIn + 6, 10, 80),   tokens: log.tokensOut,  status: "ok", detail: "Result stored to working memory" },
    ],
    reasoningSteps: [
      `Step 1: Received task "${log.task}" from orchestrator`,
      `Step 2: Identified relevant knowledge sources: ${log.knowledgeSources}`,
      `Step 3: Queried ${log.docsRetrieved} documents from knowledge base with semantic search`,
      `Step 4: Assembled ${log.contextSize.toLocaleString()} token context window`,
      `Step 5: Generated plan — ${log.toolCalls} tool call(s) required for ${log.action}`,
      `Step 6: Executed ${log.action} via ${log.resource} (MCP: ${log.mcpServer})`,
      `Step 7: Validated output against policy — result: ${log.result}`,
      `Step 8: Wrote result to memory and notified orchestrator`,
    ],
    prompt: `[SYSTEM] You are ${log.agent} operating in ${log.abu}. Your role is to ${log.action.toLowerCase()} using available tools and knowledge.\n\n[CONTEXT] Mission: ${log.mission}\nWorkflow: ${log.workflow}\nTask: ${log.task}\n\n[USER] Execute the assigned task and return structured output with confidence score.`,
    response: log.result === "Success"
      ? `{"status":"success","action":"${log.action}","confidence":0.94,"result":{"resource":"${log.resource}","duration_ms":${log.executionTimeMs},"output_tokens":${log.tokensOut}},"next_step":"report_to_orchestrator"}`
      : `{"status":"${log.result.toLowerCase()}","action":"${log.action}","error":"${log.error}","retry_count":${log.retryCount},"escalated":${log.result === "Escalated"}}`,
    memoryReads: [
      `session:${log.sessionId} — agent working memory (${(log.memoryMb / 2) | 0} MB)`,
      `shared:${log.workflow} — workflow state and prior steps`,
      `cache:${log.agent}:context — last 5 task completions`,
    ],
    memoryWrites: [
      `session:${log.sessionId} — updated task result`,
      `workflow:${log.workflow}:step — task completion flag`,
    ],
    knowledgeChunks: Array.from({ length: Math.min(log.docsRetrieved, 4) }, (_, ci) => (
      `Chunk ${ci + 1}: [score: ${(0.94 - ci * 0.04).toFixed(2)}] "${log.knowledgeSources}" — relevant section ${ci + 1} matching query "${log.action}"`
    )),
    toolInvocations: Array.from({ length: Math.min(log.toolCalls, 3) }, (_, ti) => ({
      name:       ti === 0 ? log.resource : ti === 1 ? log.mcpServer : "Memory Store",
      input:      `{"action":"${log.action}","params":{"agent":"${log.agent}","workflow":"${log.workflow}"}}`,
      output:     log.result === "Success" ? `{"status":200,"data":{"rows":${seededInt(ti + log.tokensIn, 1, 50)}}}` : `{"error":"${log.error}"}`,
      latencyMs:  seededInt(ti * 100 + log.tokensIn, 20, 800),
      status:     log.result === "Success" ? "200 OK" : `${log.statusCode} Error`,
    })),
    mcpCalls: [
      { server: log.mcpServer, method: "tools/call",  latencyMs: seededInt(log.tokensIn, 40, 300), status: log.result === "Timeout" ? "TIMEOUT" : "OK" },
      { server: log.mcpServer, method: "memory/read", latencyMs: seededInt(log.tokensIn + 1, 10, 80), status: "OK" },
    ],
    apiRequests: [
      { endpoint: `/api/${log.resource.replace(/\s/g, "-").toLowerCase()}/v1`, method: "POST", statusCode: log.statusCode, latencyMs: seededInt(log.tokensIn, 30, 500) },
      { endpoint: `/api/memory/write`, method: "PUT", statusCode: 200, latencyMs: seededInt(log.tokensIn + 2, 5, 40) },
    ],
    policyEvals: [
      { policy: "DATA-001 Data Access Control",      result: log.result === "Blocked" ? "BLOCKED" : "PASSED", detail: log.result === "Blocked" ? log.error : "Access level verified" },
      { policy: "SEC-004 Output Validation",         result: "PASSED", detail: "No PII or sensitive content detected in output" },
      { policy: "COST-002 Token Budget",             result: log.tokensTotal > 10000 ? "WARNING" : "PASSED", detail: `Used ${log.tokensTotal} of 15,000 budget` },
    ],
    humanApprovals: log.result === "Escalated" ? [
      { step: "Output review required", approver: log.user, status: "PENDING", latencyMs: 0 },
    ] : [],
    observations: [
      `Agent completed ${log.action} in ${log.latencyMs}ms`,
      `Queue time: ${log.queueTimeMs}ms · Execution: ${log.executionTimeMs}ms`,
      `Model ${log.model} used ${log.tokensTotal.toLocaleString()} tokens ($${log.costUsd.toFixed(4)})`,
      `Knowledge hit: ${log.docsRetrieved} documents retrieved from ${log.knowledgeSources}`,
    ],
    evalResults: [
      { metric: "Task Completion",    score: log.result === "Success" ? 1.0 : 0.0,  threshold: 0.8, passed: log.result === "Success" },
      { metric: "Response Quality",   score: 0.91, threshold: 0.85, passed: true },
      { metric: "Latency SLA",        score: log.latencyMs < 5000 ? 1.0 : 0.3, threshold: 0.7, passed: log.latencyMs < 5000 },
      { metric: "Token Efficiency",   score: log.tokensOut / Math.max(1, log.tokensIn), threshold: 0.3, passed: true },
      { metric: "Policy Compliance",  score: log.result === "Blocked" ? 0.0 : 1.0, threshold: 1.0, passed: log.result !== "Blocked" },
    ],
    errors: log.severity === "INF" ? [] : [
      { ts: log.timestamp, type: log.result, message: log.error, retry: log.retryCount },
    ],
    tokenBreakdown: [
      { stage: "Knowledge Retrieval", input: (log.tokensIn * 0.3) | 0,  output: 0 },
      { stage: "LLM Inference",       input: (log.tokensIn * 0.6) | 0,  output: log.tokensOut },
      { stage: "Tool Calls",          input: (log.tokensIn * 0.1) | 0,  output: 0 },
    ],
    costBreakdown: [
      { model: log.model, tokens: log.tokensTotal, costUsd: log.costUsd },
    ],
    latencyBreakdown: [
      { phase: "Queue",           ms: log.queueTimeMs },
      { phase: "Memory Read",     ms: seededInt(log.tokensIn, 20, 150) },
      { phase: "Knowledge",       ms: seededInt(log.tokensIn + 1, 50, 400) },
      { phase: "LLM Inference",   ms: Math.max(50, log.executionTimeMs - 200) },
      { phase: "Tool Execution",  ms: seededInt(log.tokensIn + 2, 10, 300) },
      { phase: "Policy Check",    ms: seededInt(log.tokensIn + 3, 5, 50) },
      { phase: "Memory Write",    ms: seededInt(log.tokensIn + 4, 5, 30) },
    ],
    relatedMission:  log.mission,
    relatedWorkflow: log.workflow,
    relatedIncident: log.result !== "Success" ? "INC-2026-0441" : "—",
  };
}
