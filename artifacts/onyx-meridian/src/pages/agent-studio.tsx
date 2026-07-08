import { useState } from "react";
import { Link, useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { RequestChangeModal } from "@/components/shared/RequestChangeModal";
import {
  Bot, Plus, ChevronRight, CheckCircle2, Clock, FlaskConical,
  Rocket, Copy, Settings, Star, Download, Eye, GitBranch, Zap,
  Plug, ChevronLeft, BarChart2, Globe, MoreHorizontal,
  Play, Pause, RotateCcw, Shield, Terminal, TrendingUp, Cpu, Search,
  ArrowUpRight, ArrowDownRight, CheckSquare, RefreshCw,
  XCircle, Wifi, WifiOff, MemoryStick, FileCode,
  Trash2, Edit, Flag,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────────────────

type AgentStatus = "active" | "testing" | "draft" | "suspended";
type AutonomyLevel = "Fully Autonomous" | "Semi-Autonomous" | "Supervised" | "Assisted";

interface RichAgent {
  id: string;
  name: string;
  role: string;
  department: string;
  bu: string;
  mission: string;
  workflow: string;
  model: string;
  version: string;
  health: number;
  trustScore: number;
  autonomy: AutonomyLevel;
  status: AgentStatus;
  queue: number;
  activeTasks: number;
  responseTime: number; // ms p95
  successRate: number;
  tokenUsage: number; // K tokens/day
  cost: number; // $/day
  memoryUsage: number; // MB
  knowledgeHitRate: number;
  toolCalls: number; // last 24h
  contextUsage: number; // % of window
  lastActivity: string;
  skills: string[];
  tools: string[];
  kpis: string[];
  goals: string[];
}

const AGENTS: RichAgent[] = [
  {
    id: "ag1", name: "Production Planner", role: "Production Scheduling Agent",
    department: "Manufacturing Ops", bu: "Manufacturing",
    mission: "Maximize OEE via dynamic scheduling", workflow: "WF-MFG-0042",
    model: "GPT-4o", version: "v3.2", health: 97, trustScore: 94,
    autonomy: "Fully Autonomous", status: "active",
    queue: 3, activeTasks: 2, responseTime: 840, successRate: 98.2,
    tokenUsage: 124, cost: 18.40, memoryUsage: 512, knowledgeHitRate: 91,
    toolCalls: 847, contextUsage: 62, lastActivity: "43s ago",
    skills: ["MES Integration", "Scheduling Optimization", "Capacity Planning", "ERP Sync"],
    tools: ["ERP API", "MES API", "SCADA Feed", "Capacity DB"],
    kpis: ["OEE", "Throughput", "EEI"],
    goals: ["Optimize production schedule to maximize OEE", "Reduce changeover time by 20%", "Prevent line stoppages"],
  },
  {
    id: "ag3", name: "Predictive Maintenance", role: "Failure Prediction Agent",
    department: "Asset Reliability", bu: "Maintenance",
    mission: "Predict equipment failures 72hrs in advance", workflow: "WF-MNT-0019",
    model: "GPT-4o", version: "v4.1", health: 99, trustScore: 97,
    autonomy: "Fully Autonomous", status: "active",
    queue: 1, activeTasks: 1, responseTime: 620, successRate: 99.1,
    tokenUsage: 98, cost: 14.20, memoryUsage: 384, knowledgeHitRate: 95,
    toolCalls: 1204, contextUsage: 48, lastActivity: "12s ago",
    skills: ["Acoustic Analysis", "Vibration Monitoring", "Failure Prediction", "CMMS Integration"],
    tools: ["IoT Sensor Feed", "CMMS API", "SCADA", "Maintenance DB"],
    kpis: ["Downtime Hours", "OEE", "MTTR"],
    goals: ["Predict failures 72hrs ahead", "Reduce unplanned downtime to <3hrs/mo", "Auto-generate work orders"],
  },
  {
    id: "ag4", name: "Quality Inspector", role: "Defect Detection Agent",
    department: "Quality Assurance", bu: "Quality",
    mission: "Achieve <1% defect rate via real-time vision AI", workflow: "WF-QUA-0031",
    model: "Claude-3.5-Sonnet", version: "v2.4", health: 93, trustScore: 88,
    autonomy: "Supervised", status: "active",
    queue: 5, activeTasks: 3, responseTime: 1140, successRate: 96.7,
    tokenUsage: 76, cost: 11.80, memoryUsage: 256, knowledgeHitRate: 87,
    toolCalls: 634, contextUsage: 71, lastActivity: "2m ago",
    skills: ["Vision AI", "Defect Classification", "Statistical Process Control", "MES Integration"],
    tools: ["Vision Camera Feed", "MES API", "SPC Engine", "Quality DB"],
    kpis: ["Yield", "Scrap Rate", "Defect Rate"],
    goals: ["Achieve <1% defect rate", "Maintain 99%+ first-pass yield", "Real-time SPC monitoring"],
  },
  {
    id: "ag5", name: "Inventory Optimizer", role: "Stock Intelligence Agent",
    department: "Supply Chain Ops", bu: "Supply Chain",
    mission: "Eliminate stockouts via demand sensing", workflow: "WF-SC-0007",
    model: "GPT-4o-mini", version: "v1.9-beta", health: 81, trustScore: 76,
    autonomy: "Supervised", status: "testing",
    queue: 8, activeTasks: 1, responseTime: 1820, successRate: 91.3,
    tokenUsage: 48, cost: 6.20, memoryUsage: 192, knowledgeHitRate: 78,
    toolCalls: 312, contextUsage: 55, lastActivity: "8m ago",
    skills: ["Demand Sensing", "Replenishment Optimization", "WMS Integration", "Stockout Prediction"],
    tools: ["WMS API", "ERP API", "Demand Feed", "Supplier Portal"],
    kpis: ["Inventory Turns", "Fill Rate", "Stockout Rate"],
    goals: ["Achieve 10x inventory turns", "Eliminate stockouts", "Optimize reorder points"],
  },
  {
    id: "ag10", name: "Energy Intelligence", role: "EEI Optimization Agent",
    department: "Facilities & Sustainability", bu: "Engineering",
    mission: "Drive 15% energy reduction across plant floor", workflow: "WF-ENG-0055",
    model: "GPT-4o", version: "v2.0", health: 95, trustScore: 91,
    autonomy: "Semi-Autonomous", status: "active",
    queue: 2, activeTasks: 2, responseTime: 740, successRate: 97.4,
    tokenUsage: 62, cost: 9.10, memoryUsage: 320, knowledgeHitRate: 89,
    toolCalls: 521, contextUsage: 44, lastActivity: "1m ago",
    skills: ["Energy Monitoring", "Load Balancing", "SCADA Integration", "Anomaly Detection"],
    tools: ["Energy Meter Feed", "SCADA", "BMS API", "Utility Portal"],
    kpis: ["EEI", "Energy Cost", "Carbon Footprint"],
    goals: ["Reduce energy consumption by 15%", "Optimize peak load scheduling", "Automate demand response"],
  },
  {
    id: "ag11", name: "Scrap Rate Reducer", role: "Waste Reduction Agent",
    department: "Manufacturing Ops", bu: "Manufacturing",
    mission: "Root-cause scrap patterns and generate corrective actions", workflow: "—",
    model: "GPT-4o-mini", version: "v0.1", health: 0, trustScore: 0,
    autonomy: "Assisted", status: "draft",
    queue: 0, activeTasks: 0, responseTime: 0, successRate: 0,
    tokenUsage: 0, cost: 0, memoryUsage: 0, knowledgeHitRate: 0,
    toolCalls: 0, contextUsage: 0, lastActivity: "Never",
    skills: ["Defect Analysis", "Root Cause Analysis", "SPC Integration"],
    tools: ["MES API", "Quality DB", "ERP API"],
    kpis: ["Scrap Rate", "OEE"],
    goals: ["Reduce scrap rate to <1%", "Identify root causes of waste", "Generate corrective action plans"],
  },
];

const TEMPLATES = [
  {
    name: "Predictive Maintenance", icon: Cpu, category: "Reliability",
    desc: "IoT sensor monitoring with failure prediction and CMMS integration for industrial equipment.",
    departments: ["Maintenance", "Asset Reliability", "Engineering"],
    models: ["GPT-4o", "Claude-3.5-Sonnet"],
    tools: ["IoT Sensor Feed", "CMMS API", "SCADA", "Maintenance DB"],
    knowledge: ["Equipment Manuals", "Failure History", "Maintenance SOPs"],
    memory: "Long-term episodic + vector store",
    autonomy: "Fully Autonomous" as AutonomyLevel,
    estCost: "$12–18/day",
    latency: "p95: 800ms",
    complexity: "Medium",
    businessValue: "Prevent $2M+ unplanned downtime/yr",
    deployments: 14,
    rating: 4.9,
  },
  {
    name: "Quality Inspector", icon: CheckSquare, category: "Quality",
    desc: "Vision AI defect detection with SPC and real-time yield monitoring on production lines.",
    departments: ["Quality Assurance", "Manufacturing"],
    models: ["Claude-3.5-Sonnet", "GPT-4o"],
    tools: ["Vision Camera Feed", "MES API", "SPC Engine", "Quality DB"],
    knowledge: ["Quality Standards", "Defect Catalog", "SPC Rules"],
    memory: "Short-term + shared workspace",
    autonomy: "Supervised" as AutonomyLevel,
    estCost: "$10–14/day",
    latency: "p95: 1.2s",
    complexity: "High",
    businessValue: "Reduce scrap cost by 40%",
    deployments: 9,
    rating: 4.7,
  },
  {
    name: "Production Scheduler", icon: BarChart2, category: "Operations",
    desc: "Capacity-aware dynamic scheduling with ERP and MES integration for multi-line plants.",
    departments: ["Manufacturing Ops", "Planning"],
    models: ["GPT-4o"],
    tools: ["ERP API", "MES API", "SCADA Feed", "Capacity DB"],
    knowledge: ["Production Plans", "Machine Specs", "Shift Schedules"],
    memory: "Working + long-term episodic",
    autonomy: "Fully Autonomous" as AutonomyLevel,
    estCost: "$16–22/day",
    latency: "p95: 900ms",
    complexity: "High",
    businessValue: "Increase OEE by 8–12%",
    deployments: 11,
    rating: 4.8,
  },
  {
    name: "Supplier Risk Monitor", icon: Shield, category: "Procurement",
    desc: "Multi-source supplier scoring with anomaly detection and escalation workflows.",
    departments: ["Procurement", "Supply Chain"],
    models: ["GPT-4o-mini", "GPT-4o"],
    tools: ["ERP API", "Supplier Portal", "Risk DB", "News Feed"],
    knowledge: ["Supplier Contracts", "Risk Policies", "SLA Standards"],
    memory: "Persistent vector store",
    autonomy: "Semi-Autonomous" as AutonomyLevel,
    estCost: "$6–10/day",
    latency: "p95: 1.5s",
    complexity: "Medium",
    businessValue: "Prevent supply disruptions worth $800K+",
    deployments: 7,
    rating: 4.6,
  },
  {
    name: "Finance Analyst", icon: TrendingUp, category: "Finance",
    desc: "Cost variance analysis with ERP integration and automated management reporting.",
    departments: ["Finance", "Controlling"],
    models: ["GPT-4o", "Claude-3.5-Sonnet"],
    tools: ["ERP API", "Finance DB", "Reporting Engine"],
    knowledge: ["Chart of Accounts", "Budget Plans", "Variance Playbooks"],
    memory: "Long-term episodic",
    autonomy: "Supervised" as AutonomyLevel,
    estCost: "$8–12/day",
    latency: "p95: 1.1s",
    complexity: "Low",
    businessValue: "Save 120 analyst hours/month",
    deployments: 5,
    rating: 4.5,
  },
  {
    name: "Logistics Optimizer", icon: Globe, category: "Logistics",
    desc: "Route optimization with fleet telemetry, WMS integration and last-mile analytics.",
    departments: ["Logistics", "Distribution"],
    models: ["GPT-4o-mini"],
    tools: ["WMS API", "Fleet Telemetry", "Route Engine", "Customer DB"],
    knowledge: ["Route Maps", "SLA Agreements", "Customer Profiles"],
    memory: "Short-term + shared workspace",
    autonomy: "Semi-Autonomous" as AutonomyLevel,
    estCost: "$5–8/day",
    latency: "p95: 700ms",
    complexity: "Medium",
    businessValue: "Reduce transport cost by 12%",
    deployments: 6,
    rating: 4.4,
  },
];

const DEPLOYMENTS = [
  {
    id: "dep-ag1", agent: "Production Planner", env: "Production", version: "v3.2",
    health: 99, traffic: 100, scaling: "Auto", latency: 840, availability: 99.97,
    errors: 0.03, region: "US-East", replicas: 3, cpu: 42, memory: 61,
    lastDeploy: "Jun 18, 14:32", rollouts: ["v3.2 (current)", "v3.1 → v3.2 Jun 18", "v3.0 → v3.1 Jun 04"],
  },
  {
    id: "dep-ag3", agent: "Predictive Maintenance", env: "Production", version: "v4.1",
    health: 100, traffic: 100, scaling: "Fixed", latency: 620, availability: 99.99,
    errors: 0.01, region: "US-East", replicas: 2, cpu: 28, memory: 44,
    lastDeploy: "Jun 22, 09:15", rollouts: ["v4.1 (current)", "v4.0 → v4.1 Jun 22", "v3.9 → v4.0 Jun 10"],
  },
  {
    id: "dep-ag4", agent: "Quality Inspector", env: "Production", version: "v2.4",
    health: 94, traffic: 100, scaling: "Auto", latency: 1140, availability: 99.91,
    errors: 0.09, region: "US-West", replicas: 4, cpu: 68, memory: 72,
    lastDeploy: "Jun 24, 16:04", rollouts: ["v2.4 (current)", "v2.3 → v2.4 Jun 24", "v2.2 → v2.3 Jun 12"],
  },
  {
    id: "dep-ag5", agent: "Inventory Optimizer", env: "Staging", version: "v1.9-beta",
    health: 81, traffic: 0, scaling: "Manual", latency: 1820, availability: 98.40,
    errors: 1.60, region: "US-East", replicas: 1, cpu: 31, memory: 38,
    lastDeploy: "Jun 25, 11:20", rollouts: ["v1.9-beta (current)", "v1.8 → v1.9-beta Jun 25"],
  },
  {
    id: "dep-ag6", agent: "Energy Intelligence", env: "Production", version: "v2.0",
    health: 97, traffic: 100, scaling: "Auto", latency: 740, availability: 99.94,
    errors: 0.06, region: "US-East", replicas: 2, cpu: 35, memory: 52,
    lastDeploy: "Jun 20, 08:45", rollouts: ["v2.0 (current)", "v1.9 → v2.0 Jun 20", "v1.8 → v1.9 Jun 02"],
  },
];

const VERSIONS = [
  {
    agent: "Production Planner", version: "v3.2", date: "Jun 18, 2026", author: "Eng Team",
    changes: { prompt: true, config: true, model: false, tools: false, knowledge: true },
    accuracy: 98.2, latency: 840, cost: 18.4, notes: "Improved scheduling heuristics, added shift changeover knowledge base",
    status: "current",
  },
  {
    agent: "Production Planner", version: "v3.1", date: "Jun 04, 2026", author: "Eng Team",
    changes: { prompt: false, config: true, model: false, tools: true, knowledge: false },
    accuracy: 96.8, latency: 920, cost: 17.1, notes: "Added ERP sync v2 connector, tuned context window usage",
    status: "rollback-ready",
  },
  {
    agent: "Production Planner", version: "v3.0", date: "May 20, 2026", author: "Platform",
    changes: { prompt: true, config: true, model: true, tools: true, knowledge: true },
    accuracy: 94.1, latency: 1100, cost: 15.8, notes: "Major: migrated to GPT-4o, rewrote planning strategy prompt",
    status: "archived",
  },
  {
    agent: "Predictive Maintenance", version: "v4.1", date: "Jun 22, 2026", author: "Eng Team",
    changes: { prompt: true, config: false, model: false, tools: false, knowledge: true },
    accuracy: 99.1, latency: 620, cost: 14.2, notes: "Added acoustic pattern library v3, refined failure classification",
    status: "current",
  },
  {
    agent: "Predictive Maintenance", version: "v4.0", date: "Jun 10, 2026", author: "Platform",
    changes: { prompt: false, config: true, model: false, tools: true, knowledge: false },
    accuracy: 97.6, latency: 680, cost: 13.5, notes: "Upgraded IoT connector, added retry logic for sensor timeouts",
    status: "rollback-ready",
  },
];

const SKILLS_DATA = [
  {
    id: "sk1", name: "MES Integration", category: "Connectivity",
    confidence: 97, dependencies: ["ERP Sync", "SCADA Bridge"],
    learningProgress: 100, usageFrequency: 184, avgRuntime: 320,
    businessImpact: "Critical", related: ["SCADA Integration", "ERP Sync"],
    agents: ["Production Planner", "Quality Inspector"],
    status: "enabled" as const,
  },
  {
    id: "sk2", name: "Failure Prediction", category: "Analytics",
    confidence: 94, dependencies: ["Acoustic Analysis", "Vibration Monitoring"],
    learningProgress: 89, usageFrequency: 312, avgRuntime: 580,
    businessImpact: "Critical", related: ["CMMS Integration", "Root Cause Analysis"],
    agents: ["Predictive Maintenance"],
    status: "enabled" as const,
  },
  {
    id: "sk3", name: "Statistical Process Control", category: "Quality",
    confidence: 91, dependencies: ["Vision AI"],
    learningProgress: 76, usageFrequency: 247, avgRuntime: 420,
    businessImpact: "High", related: ["Defect Classification", "MES Integration"],
    agents: ["Quality Inspector"],
    status: "enabled" as const,
  },
  {
    id: "sk4", name: "Demand Sensing", category: "Analytics",
    confidence: 79, dependencies: ["WMS Integration", "ERP Sync"],
    learningProgress: 52, usageFrequency: 98, avgRuntime: 870,
    businessImpact: "High", related: ["Replenishment Optimization", "Stockout Prediction"],
    agents: ["Inventory Optimizer"],
    status: "enabled" as const,
  },
  {
    id: "sk5", name: "Vision AI", category: "Perception",
    confidence: 88, dependencies: [],
    learningProgress: 83, usageFrequency: 431, avgRuntime: 210,
    businessImpact: "Critical", related: ["Defect Classification", "Statistical Process Control"],
    agents: ["Quality Inspector"],
    status: "enabled" as const,
  },
  {
    id: "sk6", name: "Energy Monitoring", category: "Sustainability",
    confidence: 92, dependencies: ["SCADA Integration"],
    learningProgress: 68, usageFrequency: 156, avgRuntime: 290,
    businessImpact: "Medium", related: ["Load Balancing", "Anomaly Detection"],
    agents: ["Energy Intelligence"],
    status: "enabled" as const,
  },
  {
    id: "sk7", name: "Root Cause Analysis", category: "Analytics",
    confidence: 71, dependencies: ["Statistical Process Control"],
    learningProgress: 38, usageFrequency: 0, avgRuntime: 0,
    businessImpact: "High", related: ["Failure Prediction", "Defect Classification"],
    agents: ["Scrap Rate Reducer"],
    status: "disabled" as const,
  },
];

const KNOWLEDGE_BASES = [
  {
    id: "kb1", name: "Manufacturing SOPs Library", type: "Document Store",
    source: "SharePoint", chunks: 4821, embeddings: 4821, freshness: "2h ago",
    confidence: 94, health: "healthy" as const,
    retrieval: "Hybrid BM25 + Dense", reranking: "CrossEncoder v2",
    agents: ["Production Planner", "Quality Inspector"],
    docs: ["OEM-001 Line Start Procedures", "OEM-004 Changeover SOP", "OEM-011 Safety Protocols"],
    size: "142 MB",
  },
  {
    id: "kb2", name: "Equipment Failure History", type: "Vector Store",
    source: "CMMS Database", chunks: 12440, embeddings: 12440, freshness: "15m ago",
    confidence: 97, health: "healthy" as const,
    retrieval: "Dense ANN", reranking: "MonoT5",
    agents: ["Predictive Maintenance"],
    docs: ["Fault Code Taxonomy", "Historical Failure Events", "MTBF Records"],
    size: "890 MB",
  },
  {
    id: "kb3", name: "Quality Standards & Specs", type: "Document Store",
    source: "PLM System", chunks: 3205, embeddings: 3205, freshness: "6h ago",
    confidence: 91, health: "healthy" as const,
    retrieval: "Hybrid BM25 + Dense", reranking: "None",
    agents: ["Quality Inspector"],
    docs: ["ISO 9001 Requirements", "Defect Classification Catalog", "SPC Rules"],
    size: "78 MB",
  },
  {
    id: "kb4", name: "Supplier Contract Repository", type: "Document Store",
    source: "Procurement Portal", chunks: 1842, embeddings: 1842, freshness: "1d ago",
    confidence: 84, health: "degraded" as const,
    retrieval: "BM25 Sparse", reranking: "None",
    agents: ["Inventory Optimizer"],
    docs: ["Master Supply Agreements", "SLA Terms", "Lead Time Tables"],
    size: "34 MB",
  },
  {
    id: "kb5", name: "Energy Efficiency Playbooks", type: "Policy Store",
    source: "Internal Wiki", chunks: 622, embeddings: 622, freshness: "3d ago",
    confidence: 88, health: "healthy" as const,
    retrieval: "Dense ANN", reranking: "CrossEncoder v2",
    agents: ["Energy Intelligence"],
    docs: ["Peak Load Management", "HVAC Optimization", "Demand Response Protocols"],
    size: "18 MB",
  },
];

const TOOLS_DATA = [
  {
    id: "t1", name: "SAP ERP API", category: "ERP", type: "REST",
    status: "connected" as const, health: 99, latency: 180, successRate: 99.4,
    calls24h: 3847, retries: 12, auth: "OAuth 2.0", permissions: "Read/Write",
    endpoint: "https://erp.onyxmfg.internal/api/v3",
    version: "v3.4.1", rateLimit: "500 req/min",
    agents: ["Production Planner", "Inventory Optimizer"],
  },
  {
    id: "t2", name: "MES Gateway", category: "MES", type: "gRPC",
    status: "connected" as const, health: 98, latency: 42, successRate: 99.8,
    calls24h: 8412, retries: 4, auth: "mTLS", permissions: "Read/Write",
    endpoint: "grpc://mes.onyxmfg.internal:9090",
    version: "v2.1.0", rateLimit: "2000 req/min",
    agents: ["Production Planner", "Quality Inspector"],
  },
  {
    id: "t3", name: "IoT Sensor Feed", category: "IoT", type: "MQTT",
    status: "connected" as const, health: 100, latency: 8, successRate: 99.9,
    calls24h: 41284, retries: 0, auth: "Token", permissions: "Read",
    endpoint: "mqtt://iot.onyxmfg.internal:1883",
    version: "v1.8.2", rateLimit: "Unlimited",
    agents: ["Predictive Maintenance", "Energy Intelligence"],
  },
  {
    id: "t4", name: "Vision Camera API", category: "Computer Vision", type: "WebSocket",
    status: "connected" as const, health: 94, latency: 65, successRate: 97.2,
    calls24h: 5621, retries: 89, auth: "API Key", permissions: "Read",
    endpoint: "wss://vision.onyxmfg.internal/stream",
    version: "v1.2.0", rateLimit: "100 streams",
    agents: ["Quality Inspector"],
  },
  {
    id: "t5", name: "CMMS API", category: "CMMS", type: "REST",
    status: "connected" as const, health: 97, latency: 210, successRate: 98.8,
    calls24h: 1243, retries: 21, auth: "OAuth 2.0", permissions: "Read/Write",
    endpoint: "https://cmms.onyxmfg.internal/api/v2",
    version: "v2.0.3", rateLimit: "300 req/min",
    agents: ["Predictive Maintenance"],
  },
  {
    id: "t6", name: "WMS Portal", category: "Warehouse", type: "REST",
    status: "degraded" as const, health: 76, latency: 840, successRate: 91.4,
    calls24h: 612, retries: 74, auth: "Basic Auth", permissions: "Read/Write",
    endpoint: "https://wms.onyxmfg.internal/api",
    version: "v1.6.0", rateLimit: "100 req/min",
    agents: ["Inventory Optimizer"],
  },
  {
    id: "t7", name: "Supplier Risk DB", category: "Database", type: "PostgreSQL",
    status: "disconnected" as const, health: 0, latency: 0, successRate: 0,
    calls24h: 0, retries: 0, auth: "SSL Cert", permissions: "Read",
    endpoint: "postgres://riskdb.onyxmfg.internal:5432/supplier",
    version: "pg 15.2", rateLimit: "N/A",
    agents: [],
  },
  {
    id: "t8", name: "SCADA Bridge", category: "SCADA", type: "OPC-UA",
    status: "connected" as const, health: 100, latency: 12, successRate: 100,
    calls24h: 18440, retries: 0, auth: "Certificate", permissions: "Read",
    endpoint: "opc.tcp://scada.onyxmfg.internal:4840",
    version: "v1.0.4", rateLimit: "Unlimited",
    agents: ["Production Planner", "Energy Intelligence", "Predictive Maintenance"],
  },
];

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

const statusBadge = (status: AgentStatus) => {
  const cfg = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    testing: "bg-blue-50 text-blue-700 border-blue-200",
    draft: "bg-muted text-muted-foreground border-border",
    suspended: "bg-red-50 text-red-700 border-red-200",
  }[status];
  const icons = { active: CheckCircle2, testing: FlaskConical, draft: Clock, suspended: Pause };
  const Icon = icons[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[9px] font-bold uppercase tracking-widest", cfg)}>
      <Icon size={9} />
      {status}
    </span>
  );
};

const healthBar = (val: number, size: "sm" | "md" = "sm") => {
  const color = val >= 95 ? "bg-emerald-500" : val >= 80 ? "bg-amber-500" : val > 0 ? "bg-red-500" : "bg-muted";
  const h = size === "md" ? "h-1.5" : "h-1";
  return (
    <div className={cn("flex-1 bg-muted rounded-full overflow-hidden", h)}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${val}%` }} />
    </div>
  );
};

function Metric({ label, value, sub, color = "text-foreground" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white border border-border rounded-sm px-4 py-3">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-lg font-bold font-mono leading-none mb-0.5", color)}>{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function QuickActions({ agent, onClose }: { agent: RichAgent; onClose: () => void }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { role } = useAppContext();
  const canEdit = role !== "employee";
  const [requestOpen, setRequestOpen] = useState(false);
  const readOnlyActions = [
    { label: "Open Engineering Workspace", icon: Terminal, primary: true, action: () => navigate(`/agents/${agent.id}`) },
    { sep: true },
    { label: "View Logs", icon: Terminal, action: () => navigate(`/agents/${agent.id}`) },
    { label: "View Memory", icon: MemoryStick, action: () => navigate(`/agents/${agent.id}`) },
    { label: "View Tool Calls", icon: Plug, action: () => navigate(`/agents/${agent.id}`) },
    { sep: true },
    { label: "Request Change", icon: Edit, action: () => setRequestOpen(true) },
  ];
  const fullActions = [
    { label: "Open Engineering Workspace", icon: Terminal, primary: true, action: () => navigate(`/agents/${agent.id}`) },
    { label: "Edit Configuration", icon: Edit, action: () => toast({ title: "Edit", description: `Opening config for ${agent.name}` }) },
    { label: "Duplicate Agent", icon: Copy, action: () => toast({ title: "Duplicated", description: `${agent.name} clone created as draft` }) },
    { label: "Assign Mission", icon: Flag, action: () => toast({ title: "Assign Mission", description: "Mission assignment dialog" }) },
    { label: "Assign Workflow", icon: GitBranch, action: () => toast({ title: "Assign Workflow", description: "Workflow assignment dialog" }) },
    { label: "Change Model", icon: Cpu, action: () => toast({ title: "Change Model", description: "Model selector opened" }) },
    { label: "Increase Token Budget", icon: Zap, action: () => toast({ title: "Token Budget", description: "Token configuration updated" }) },
    { sep: true },
    { label: "View Logs", icon: Terminal, action: () => navigate(`/agents/${agent.id}`) },
    { label: "View Memory", icon: MemoryStick, action: () => navigate(`/agents/${agent.id}`) },
    { label: "View Tool Calls", icon: Plug, action: () => navigate(`/agents/${agent.id}`) },
    { sep: true },
    { label: agent.status === "active" ? "Suspend Agent" : "Resume Agent", icon: agent.status === "active" ? Pause : Play,
      danger: agent.status === "active",
      action: () => toast({ title: agent.status === "active" ? "Suspended" : "Resumed", description: agent.name }) },
    { label: "Promote", icon: ArrowUpRight, action: () => toast({ title: "Promoted", description: agent.name }) },
    { label: "Demote", icon: ArrowDownRight, action: () => toast({ title: "Demoted", description: agent.name }) },
    { sep: true },
    { label: "Delete Agent", icon: Trash2, danger: true, action: () => toast({ title: "Delete", description: "Confirmation required", variant: "destructive" }) },
  ];
  const actions = canEdit ? fullActions : readOnlyActions;
  return (
    <div className="absolute right-0 top-8 z-50 w-52 bg-white border border-border rounded-sm shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
      <RequestChangeModal open={requestOpen} onClose={() => { setRequestOpen(false); onClose(); }} subject={`Agent config: ${agent.name}`} />
      {actions.map((a, i) => {
        if ("sep" in a && a.sep) return <div key={i} className="my-1 border-t border-border" />;
        const A = a as { label: string; icon: React.ElementType; action: () => void; primary?: boolean; danger?: boolean };
        const Icon = A.icon;
        return (
          <button key={i} onClick={() => { A.action(); onClose(); }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-left hover:bg-muted/40 transition-colors",
              A.primary ? "text-primary" : A.danger ? "text-red-600" : "text-foreground"
            )}>
            <Icon size={11} className="shrink-0" />
            {A.label}
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Roster Tab
// ────────────────────────────────────────────────────────────────
function RosterTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AgentStatus | "all">("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = AGENTS.filter((a) => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.bu.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
    const matchF = filter === "all" || a.status === filter;
    return matchQ && matchF;
  });

  const summary = {
    active: AGENTS.filter((a) => a.status === "active").length,
    testing: AGENTS.filter((a) => a.status === "testing").length,
    draft: AGENTS.filter((a) => a.status === "draft").length,
  };

  return (
    <div className="p-6 space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <Metric label="Total Agents" value={AGENTS.length} sub="registered" />
        <Metric label="Active" value={summary.active} color="text-emerald-600" sub="in production" />
        <Metric label="In Testing" value={summary.testing} color="text-blue-600" sub="staging" />
        <Metric label="Draft" value={summary.draft} color="text-muted-foreground" sub="not deployed" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents, roles, departments..."
            className="w-full border border-border rounded-sm pl-8 pr-3 py-1.5 text-[11px] outline-none focus:border-primary bg-white" />
        </div>
        {(["all", "active", "testing", "draft", "suspended"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              "text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm border transition-colors",
              filter === f ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground hover:text-foreground"
            )}>
            {f}
          </button>
        ))}
        <span className="text-[10px] text-muted-foreground shrink-0">{filtered.length} agents</span>
      </div>

      {/* Agent Cards */}
      <div className="space-y-2">
        {filtered.map((agent) => {
          const isExp = expanded === agent.id;
          return (
            <div key={agent.id} className="bg-white border border-border rounded-sm overflow-visible">
              {/* Main Row */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isExp ? null : agent.id)}>
                {/* Agent identity */}
                <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
                <div className="min-w-0 w-48 shrink-0">
                  <div className="text-[11px] font-bold text-foreground truncate">{agent.name}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{agent.department} · {agent.bu}</div>
                </div>
                {statusBadge(agent.status)}

                {/* Health + trust */}
                <div className="flex items-center gap-1.5 w-28 shrink-0">
                  {healthBar(agent.health)}
                  <span className={cn("text-[9px] font-mono font-bold shrink-0",
                    agent.health >= 95 ? "text-emerald-600" : agent.health >= 80 ? "text-amber-600" : agent.health > 0 ? "text-red-600" : "text-muted-foreground"
                  )}>{agent.health > 0 ? agent.health : "—"}</span>
                </div>

                {/* Key metrics */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="text-center shrink-0">
                    <div className="text-[9px] text-muted-foreground">RESP</div>
                    <div className="text-[10px] font-mono font-bold">{agent.responseTime > 0 ? `${agent.responseTime}ms` : "—"}</div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-[9px] text-muted-foreground">SUCCESS</div>
                    <div className={cn("text-[10px] font-mono font-bold", agent.successRate >= 98 ? "text-emerald-600" : agent.successRate >= 90 ? "text-amber-600" : "text-muted-foreground")}>
                      {agent.successRate > 0 ? `${agent.successRate}%` : "—"}
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-[9px] text-muted-foreground">TOKENS</div>
                    <div className="text-[10px] font-mono font-bold">{agent.tokenUsage > 0 ? `${agent.tokenUsage}K/d` : "—"}</div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-[9px] text-muted-foreground">COST</div>
                    <div className="text-[10px] font-mono font-bold">{agent.cost > 0 ? `$${agent.cost}/d` : "—"}</div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-[9px] text-muted-foreground">QUEUE</div>
                    <div className={cn("text-[10px] font-mono font-bold", agent.queue > 5 ? "text-amber-600" : "text-foreground")}>{agent.queue}</div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-[9px] text-muted-foreground">CTX</div>
                    <div className={cn("text-[10px] font-mono font-bold", agent.contextUsage > 80 ? "text-red-600" : "text-foreground")}>
                      {agent.contextUsage > 0 ? `${agent.contextUsage}%` : "—"}
                    </div>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-muted-foreground shrink-0 hidden xl:block">{agent.model}</div>
                <div className="text-[9px] text-muted-foreground shrink-0 hidden xl:block">{agent.lastActivity}</div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/agents/${agent.id}`}
                    className="text-[9px] uppercase tracking-widest font-bold text-primary hover:underline px-2 py-1">
                    Open →
                  </Link>
                  <button onClick={() => setOpenMenu(openMenu === agent.id ? null : agent.id)}
                    className="p-1 rounded-sm hover:bg-muted transition-colors">
                    <MoreHorizontal size={13} className="text-muted-foreground" />
                  </button>
                  {openMenu === agent.id && <QuickActions agent={agent} onClose={() => setOpenMenu(null)} />}
                </div>
                <ChevronRight size={12} className={cn("text-muted-foreground transition-transform shrink-0", isExp && "rotate-90")} />
              </div>

              {/* Expanded Detail */}
              {isExp && (
                <div className="border-t border-border bg-muted/10 px-4 py-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {/* Identity */}
                    <div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Identity</div>
                      <div className="space-y-1">
                        {[
                          ["Model", agent.model],
                          ["Version", agent.version],
                          ["Autonomy", agent.autonomy],
                          ["Workflow", agent.workflow],
                          ["Last Active", agent.lastActivity],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground">{k}</span>
                            <span className="text-[9px] font-semibold text-foreground">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Performance */}
                    <div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Performance</div>
                      <div className="space-y-1.5">
                        {[
                          ["Trust Score", `${agent.trustScore}/100`, agent.trustScore >= 90 ? "text-emerald-600" : "text-amber-600"],
                          ["Knowledge Hit Rate", `${agent.knowledgeHitRate}%`, "text-foreground"],
                          ["Active Tasks", `${agent.activeTasks}`, "text-foreground"],
                          ["Tool Calls / 24h", `${agent.toolCalls.toLocaleString()}`, "text-foreground"],
                          ["Memory Usage", `${agent.memoryUsage} MB`, agent.memoryUsage > 400 ? "text-amber-600" : "text-foreground"],
                        ].map(([k, v, c]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground">{k}</span>
                            <span className={cn("text-[9px] font-bold font-mono", c ?? "text-foreground")}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Goals */}
                    <div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Goals</div>
                      <ul className="space-y-1.5">
                        {agent.goals.map((g, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[9px] text-foreground">
                            <span className="text-primary shrink-0 mt-0.5">•</span>{g}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Skills & KPIs */}
                    <div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Skills</div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {agent.skills.map((s) => (
                          <span key={s} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-semibold">{s}</span>
                        ))}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">KPIs</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.kpis.map((k) => (
                          <span key={k} className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-semibold">{k}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Templates Tab
// ────────────────────────────────────────────────────────────────
function TemplatesTab() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Metric label="Templates" value={TEMPLATES.length} sub="available blueprints" />
        <Metric label="Total Deployments" value={TEMPLATES.reduce((s, t) => s + t.deployments, 0)} color="text-primary" sub="across enterprise" />
        <Metric label="Avg Rating" value="4.65" color="text-amber-600" sub="community score" />
        <Metric label="Categories" value="6" sub="functional domains" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const isSel = selected === t.name;
          return (
            <div key={t.name}
              onClick={() => setSelected(isSel ? null : t.name)}
              className={cn(
                "bg-white border rounded-sm p-4 cursor-pointer transition-all",
                isSel ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40"
              )}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-primary/10 rounded-sm flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-foreground">{t.name}</div>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">{t.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-bold text-foreground">{t.rating}</span>
                  <span className="text-[9px] text-muted-foreground ml-1">({t.deployments})</span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{t.desc}</p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                {[
                  ["Departments", t.departments.join(", ")],
                  ["Est. Cost", t.estCost],
                  ["Models", t.models.join(", ")],
                  ["Latency", t.latency],
                  ["Memory", t.memory],
                  ["Complexity", t.complexity],
                  ["Autonomy", t.autonomy],
                  ["Business Value", t.businessValue],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{k}</div>
                    <div className="text-[9px] font-semibold text-foreground truncate">{v}</div>
                  </div>
                ))}
              </div>

              {isSel && (
                <div className="border-t border-border pt-3 mb-3">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Required Tools</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.tools.map((tool) => (
                      <span key={tool} className="text-[8px] bg-muted px-1.5 py-0.5 rounded-sm font-mono">{tool}</span>
                    ))}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Knowledge Required</div>
                  <div className="flex flex-wrap gap-1">
                    {t.knowledge.map((k) => (
                      <span key={k} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); toast({ title: "Preview", description: `Previewing ${t.name}` }); }}
                  className="flex items-center gap-1 border border-border text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors">
                  <Eye size={9} />Preview
                </button>
                <button onClick={(e) => { e.stopPropagation(); toast({ title: "Cloned", description: `${t.name} cloned to drafts` }); }}
                  className="flex items-center gap-1 border border-border text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors">
                  <Copy size={9} />Clone
                </button>
                <button onClick={(e) => { e.stopPropagation(); toast({ title: "Customize", description: `Opening ${t.name} customizer` }); }}
                  className="flex items-center gap-1 border border-border text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors">
                  <Settings size={9} />Customize
                </button>
                <button onClick={(e) => { e.stopPropagation(); toast({ title: "Deploying", description: `${t.name} deployment started` }); }}
                  className="flex items-center gap-1 bg-primary text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm hover:bg-primary/90 transition-colors ml-auto">
                  <Rocket size={9} />Deploy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Deployments Tab
// ────────────────────────────────────────────────────────────────
function DeploymentsTab() {
  const { toast } = useToast();

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Metric label="Production" value={DEPLOYMENTS.filter((d) => d.env === "Production").length} color="text-emerald-600" sub="live deployments" />
        <Metric label="Staging" value={DEPLOYMENTS.filter((d) => d.env === "Staging").length} color="text-blue-600" sub="pre-production" />
        <Metric label="Avg Availability" value={`${(DEPLOYMENTS.filter(d => d.env === "Production").reduce((s, d) => s + d.availability, 0) / DEPLOYMENTS.filter(d => d.env === "Production").length).toFixed(2)}%`} color="text-emerald-600" sub="production" />
        <Metric label="Avg Latency" value={`${Math.round(DEPLOYMENTS.reduce((s, d) => s + d.latency, 0) / DEPLOYMENTS.length)}ms`} sub="p95 across fleet" />
      </div>

      <div className="bg-white border border-border rounded-sm overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 bg-muted/30 border-b border-border text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
          <div className="col-span-2">Agent</div>
          <div className="col-span-1">Env</div>
          <div className="col-span-1">Version</div>
          <div className="col-span-1 text-center">Health</div>
          <div className="col-span-1 text-center">Traffic</div>
          <div className="col-span-1 text-center">Latency</div>
          <div className="col-span-1 text-center">Avail.</div>
          <div className="col-span-1 text-center">Errors</div>
          <div className="col-span-1 text-center">CPU</div>
          <div className="col-span-1 text-center">MEM</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {DEPLOYMENTS.map((dep) => (
          <div key={dep.id} className="grid grid-cols-12 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-muted/10 transition-colors">
            <div className="col-span-2">
              <div className="text-[10px] font-bold text-foreground">{dep.agent}</div>
              <div className="text-[9px] text-muted-foreground">{dep.region} · {dep.replicas} replicas</div>
            </div>
            <div className="col-span-1">
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                dep.env === "Production" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
              )}>{dep.env}</span>
            </div>
            <div className="col-span-1 text-[10px] font-mono text-foreground">{dep.version}</div>
            <div className="col-span-1 flex items-center gap-1.5 justify-center">
              {healthBar(dep.health)}
              <span className="text-[9px] font-mono shrink-0">{dep.health}</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-[10px] font-mono font-bold text-foreground">{dep.traffic}%</span>
            </div>
            <div className="col-span-1 text-center text-[10px] font-mono">{dep.latency}ms</div>
            <div className="col-span-1 text-center">
              <span className={cn("text-[10px] font-mono font-bold", dep.availability >= 99.9 ? "text-emerald-600" : dep.availability >= 99 ? "text-amber-600" : "text-red-600")}>
                {dep.availability}%
              </span>
            </div>
            <div className="col-span-1 text-center">
              <span className={cn("text-[10px] font-mono font-bold", dep.errors < 0.1 ? "text-emerald-600" : dep.errors < 1 ? "text-amber-600" : "text-red-600")}>
                {dep.errors}%
              </span>
            </div>
            <div className="col-span-1 text-center">
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", dep.cpu > 70 ? "bg-amber-500" : "bg-primary")} style={{ width: `${dep.cpu}%` }} />
                </div>
                <span className="text-[8px] font-mono">{dep.cpu}%</span>
              </div>
            </div>
            <div className="col-span-1 text-center">
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", dep.memory > 80 ? "bg-red-500" : dep.memory > 60 ? "bg-amber-500" : "bg-primary")} style={{ width: `${dep.memory}%` }} />
                </div>
                <span className="text-[8px] font-mono">{dep.memory}%</span>
              </div>
            </div>
            <div className="col-span-1 flex items-center gap-1 justify-end">
              <button onClick={() => toast({ title: "Rollback", description: `Rolling back ${dep.agent}` })}
                className="p-1 rounded-sm hover:bg-muted border border-border transition-colors" title="Rollback">
                <RotateCcw size={10} className="text-muted-foreground" />
              </button>
              <button onClick={() => toast({ title: "History", description: `${dep.agent} rollout history` })}
                className="p-1 rounded-sm hover:bg-muted border border-border transition-colors" title="History">
                <GitBranch size={10} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rollout history */}
      <div className="grid grid-cols-3 gap-4">
        {DEPLOYMENTS.filter((d) => d.env === "Production").slice(0, 3).map((dep) => (
          <div key={dep.id} className="bg-white border border-border rounded-sm p-4">
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">{dep.agent} · Rollout History</div>
            <div className="space-y-2">
              {dep.rollouts.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", i === 0 ? "bg-emerald-500" : "bg-muted-foreground")} />
                  <span className="text-[9px] text-foreground flex-1">{r}</span>
                  {i > 0 && (
                    <button onClick={() => toast({ title: "Rollback Initiated", description: r })}
                      className="text-[8px] text-primary font-bold hover:underline">Restore</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Versions Tab
// ────────────────────────────────────────────────────────────────
function VersionsTab() {
  const { toast } = useToast();
  const [agentFilter, setAgentFilter] = useState("All");
  const agents = ["All", ...Array.from(new Set(VERSIONS.map((v) => v.agent)))];
  const filtered = agentFilter === "All" ? VERSIONS : VERSIONS.filter((v) => v.agent === agentFilter);

  const changeBadge = (active: boolean, label: string) => (
    <span className={cn(
      "text-[8px] font-bold px-1.5 py-0.5 rounded-sm",
      active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    )}>{label}</span>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Filter Agent:</div>
        {agents.map((a) => (
          <button key={a} onClick={() => setAgentFilter(a)}
            className={cn(
              "text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm border transition-colors",
              agentFilter === a ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground hover:text-foreground"
            )}>{a}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((v, i) => (
          <div key={i} className="bg-white border border-border rounded-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn("w-3 h-3 rounded-full border-2", v.status === "current" ? "border-emerald-500 bg-emerald-500" : v.status === "rollback-ready" ? "border-amber-500 bg-white" : "border-muted-foreground bg-white")} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold font-mono text-foreground">{v.version}</span>
                    <span className="text-[9px] text-muted-foreground">· {v.agent}</span>
                    {v.status === "current" && <span className="text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-sm">CURRENT</span>}
                    {v.status === "rollback-ready" && <span className="text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-sm">ROLLBACK READY</span>}
                    {v.status === "archived" && <span className="text-[8px] font-bold bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">ARCHIVED</span>}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{v.date} · by {v.author}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {v.status !== "current" && (
                  <button onClick={() => toast({ title: "Rollback", description: `Rolling back to ${v.version}` })}
                    className="flex items-center gap-1 text-[9px] font-bold border border-border px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors">
                    <RotateCcw size={9} />Rollback
                  </button>
                )}
                <button onClick={() => toast({ title: "Fork", description: `Forking ${v.version}` })}
                  className="flex items-center gap-1 text-[9px] font-bold border border-border px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors">
                  <GitBranch size={9} />Fork
                </button>
                <button onClick={() => toast({ title: "Exported", description: `${v.version} exported` })}
                  className="flex items-center gap-1 text-[9px] font-bold border border-border px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors">
                  <Download size={9} />Export
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] text-muted-foreground">Changes:</span>
              {changeBadge(v.changes.prompt, "Prompt")}
              {changeBadge(v.changes.config, "Config")}
              {changeBadge(v.changes.model, "Model")}
              {changeBadge(v.changes.tools, "Tools")}
              {changeBadge(v.changes.knowledge, "Knowledge")}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              {[
                ["Accuracy", `${v.accuracy}%`, v.accuracy >= 98 ? "text-emerald-600" : v.accuracy >= 95 ? "text-amber-600" : "text-foreground"],
                ["Latency p95", `${v.latency}ms`, v.latency < 800 ? "text-emerald-600" : "text-foreground"],
                ["Cost/Day", `$${v.cost}`, "text-foreground"],
              ].map(([k, val, c]) => (
                <div key={k} className="bg-muted/30 rounded-sm px-3 py-2">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{k}</div>
                  <div className={cn("text-[12px] font-bold font-mono", c)}>{val}</div>
                </div>
              ))}
            </div>

            <div className="text-[9px] text-muted-foreground bg-muted/30 rounded-sm px-3 py-2">
              <span className="font-semibold text-foreground">Notes: </span>{v.notes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Skills Tab
// ────────────────────────────────────────────────────────────────
function SkillsTab() {
  const { toast } = useToast();

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Metric label="Total Skills" value={SKILLS_DATA.length} sub="capability profiles" />
        <Metric label="Active" value={SKILLS_DATA.filter((s) => s.status === "enabled").length} color="text-emerald-600" sub="enabled" />
        <Metric label="Avg Confidence" value={`${Math.round(SKILLS_DATA.filter(s => s.status === "enabled").reduce((a, s) => a + s.confidence, 0) / SKILLS_DATA.filter(s => s.status === "enabled").length)}%`} color="text-primary" sub="capability score" />
        <Metric label="Total Calls / 24h" value={SKILLS_DATA.reduce((a, s) => a + s.usageFrequency, 0).toLocaleString()} sub="across all skills" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SKILLS_DATA.map((skill) => (
          <div key={skill.id} className={cn(
            "bg-white border rounded-sm p-4",
            skill.status === "disabled" ? "border-border opacity-60" : "border-border"
          )}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold text-foreground">{skill.name}</span>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded-sm",
                    skill.businessImpact === "Critical" ? "bg-red-50 text-red-700" :
                    skill.businessImpact === "High" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                  )}>{skill.businessImpact}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">{skill.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toast({ title: skill.status === "enabled" ? "Disabled" : "Enabled", description: skill.name })}
                  className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border transition-colors",
                    skill.status === "enabled"
                      ? "border-border text-muted-foreground hover:bg-muted/40"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  )}>
                  {skill.status === "enabled" ? "Disable" : "Enable"}
                </button>
                <button onClick={() => toast({ title: "Retraining", description: `${skill.name} retraining started` })}
                  className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border border-border text-muted-foreground hover:bg-muted/40 transition-colors">
                  Retrain
                </button>
              </div>
            </div>

            {/* Confidence */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">Confidence</span>
                <span className={cn("text-[9px] font-bold font-mono",
                  skill.confidence >= 90 ? "text-emerald-600" : skill.confidence >= 75 ? "text-amber-600" : "text-red-600"
                )}>{skill.confidence}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full",
                  skill.confidence >= 90 ? "bg-emerald-500" : skill.confidence >= 75 ? "bg-amber-500" : "bg-red-500"
                )} style={{ width: `${skill.confidence}%` }} />
              </div>
            </div>

            {/* Learning Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">Learning Progress</span>
                <span className="text-[9px] font-bold font-mono text-primary">{skill.learningProgress}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${skill.learningProgress}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                ["Usage / 24h", skill.usageFrequency > 0 ? skill.usageFrequency.toString() : "—"],
                ["Avg Runtime", skill.avgRuntime > 0 ? `${skill.avgRuntime}ms` : "—"],
                ["Agents", skill.agents.length.toString()],
              ].map(([k, v]) => (
                <div key={k} className="bg-muted/30 rounded-sm px-2 py-1.5 text-center">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{k}</div>
                  <div className="text-[10px] font-bold font-mono text-foreground">{v}</div>
                </div>
              ))}
            </div>

            {skill.dependencies.length > 0 && (
              <div className="mb-2">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Dependencies</div>
                <div className="flex flex-wrap gap-1">
                  {skill.dependencies.map((d) => (
                    <span key={d} className="text-[8px] bg-muted px-1.5 py-0.5 rounded-sm">{d}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Agents using this skill</div>
              <div className="flex flex-wrap gap-1">
                {skill.agents.map((a) => (
                  <span key={a} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-semibold">{a}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Knowledge Tab
// ────────────────────────────────────────────────────────────────
function KnowledgeTab() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Metric label="Knowledge Bases" value={KNOWLEDGE_BASES.length} sub="connected sources" />
        <Metric label="Total Chunks" value={KNOWLEDGE_BASES.reduce((s, k) => s + k.chunks, 0).toLocaleString()} color="text-primary" sub="indexed" />
        <Metric label="Healthy" value={KNOWLEDGE_BASES.filter((k) => k.health === "healthy").length} color="text-emerald-600" sub="sources" />
        <Metric label="Degraded" value={KNOWLEDGE_BASES.filter((k) => k.health === "degraded").length} color="text-amber-600" sub="need attention" />
      </div>

      <div className="space-y-3">
        {KNOWLEDGE_BASES.map((kb) => {
          const isSel = selected === kb.id;
          return (
            <div key={kb.id}
              onClick={() => setSelected(isSel ? null : kb.id)}
              className={cn(
                "bg-white border rounded-sm p-4 cursor-pointer transition-all",
                isSel ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/30"
              )}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", kb.health === "healthy" ? "bg-emerald-500" : "bg-amber-500")} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-foreground">{kb.name}</span>
                      <span className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-sm">{kb.type}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground">Source: {kb.source} · {kb.size} · Updated {kb.freshness}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[9px] text-muted-foreground">Confidence</div>
                    <div className={cn("text-[12px] font-bold font-mono", kb.confidence >= 90 ? "text-emerald-600" : kb.confidence >= 80 ? "text-amber-600" : "text-red-600")}>
                      {kb.confidence}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-muted-foreground">Chunks</div>
                    <div className="text-[12px] font-bold font-mono text-foreground">{kb.chunks.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-3">
                {[
                  ["Retrieval", kb.retrieval],
                  ["Reranking", kb.reranking],
                  ["Freshness", kb.freshness],
                  ["Agents", kb.agents.length.toString()],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{k}</div>
                    <div className="text-[9px] font-semibold text-foreground">{v}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {kb.agents.map((a) => (
                  <span key={a} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-semibold">{a}</span>
                ))}
              </div>

              {isSel && (
                <div className="border-t border-border pt-3">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Document Tree</div>
                  <div className="space-y-1.5 mb-3">
                    {kb.docs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-sm hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={(e) => { e.stopPropagation(); toast({ title: doc, description: `Opening chunk preview for ${doc}` }); }}>
                        <FileCode size={10} className="text-muted-foreground shrink-0" />
                        <span className="text-[10px] font-semibold text-foreground flex-1">{doc}</span>
                        <span className="text-[9px] text-muted-foreground">View chunks →</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); toast({ title: "Sync", description: `Syncing ${kb.name}` }); }}
                      className="flex items-center gap-1 text-[9px] font-bold border border-border px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors">
                      <RefreshCw size={9} />Sync Now
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toast({ title: "Inspect", description: `Opening ${kb.name} inspector` }); }}
                      className="flex items-center gap-1 text-[9px] font-bold border border-border px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors">
                      <Eye size={9} />Inspect Chunks
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Tools Tab
// ────────────────────────────────────────────────────────────────
function ToolsTab() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);

  const statusIcon = (status: "connected" | "degraded" | "disconnected") => {
    if (status === "connected") return <Wifi size={12} className="text-emerald-500" />;
    if (status === "degraded") return <Wifi size={12} className="text-amber-500" />;
    return <WifiOff size={12} className="text-muted-foreground" />;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Metric label="Total Tools" value={TOOLS_DATA.length} sub="integrations" />
        <Metric label="Connected" value={TOOLS_DATA.filter((t) => t.status === "connected").length} color="text-emerald-600" sub="healthy" />
        <Metric label="Degraded" value={TOOLS_DATA.filter((t) => t.status === "degraded").length} color="text-amber-600" sub="attention needed" />
        <Metric label="Disconnected" value={TOOLS_DATA.filter((t) => t.status === "disconnected").length} color="text-muted-foreground" sub="offline" />
      </div>

      <div className="bg-white border border-border rounded-sm overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 bg-muted/30 border-b border-border text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
          <div className="col-span-2">Tool / API</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-center">Health</div>
          <div className="col-span-1 text-center">Latency</div>
          <div className="col-span-1 text-center">Success</div>
          <div className="col-span-1 text-center">Calls / 24h</div>
          <div className="col-span-1 text-center">Auth</div>
          <div className="col-span-1">Perms</div>
          <div className="col-span-1">Version</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {TOOLS_DATA.map((tool) => {
          const isSel = selected === tool.id;
          return (
            <div key={tool.id}>
              <div
                onClick={() => setSelected(isSel ? null : tool.id)}
                className="grid grid-cols-12 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-muted/10 transition-colors cursor-pointer">
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {statusIcon(tool.status)}
                    <div>
                      <div className="text-[10px] font-bold text-foreground">{tool.name}</div>
                      <div className="text-[8px] text-muted-foreground">{tool.category}</div>
                    </div>
                  </div>
                </div>
                <div className="col-span-1">
                  <span className="text-[8px] font-mono bg-muted px-1.5 py-0.5 rounded-sm">{tool.type}</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                    tool.status === "connected" ? "bg-emerald-50 text-emerald-700" :
                    tool.status === "degraded" ? "bg-amber-50 text-amber-700" : "bg-muted text-muted-foreground"
                  )}>{tool.status}</span>
                </div>
                <div className="col-span-1 flex items-center gap-1 justify-center">
                  {tool.health > 0 ? (
                    <>
                      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", tool.health >= 95 ? "bg-emerald-500" : tool.health >= 80 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${tool.health}%` }} />
                      </div>
                      <span className="text-[8px] font-mono">{tool.health}%</span>
                    </>
                  ) : <span className="text-[9px] text-muted-foreground">—</span>}
                </div>
                <div className="col-span-1 text-center text-[10px] font-mono">{tool.latency > 0 ? `${tool.latency}ms` : "—"}</div>
                <div className="col-span-1 text-center">
                  <span className={cn("text-[10px] font-mono font-bold",
                    tool.successRate >= 99 ? "text-emerald-600" : tool.successRate >= 95 ? "text-amber-600" : tool.successRate > 0 ? "text-red-600" : "text-muted-foreground"
                  )}>{tool.successRate > 0 ? `${tool.successRate}%` : "—"}</span>
                </div>
                <div className="col-span-1 text-center text-[10px] font-mono">{tool.calls24h > 0 ? tool.calls24h.toLocaleString() : "—"}</div>
                <div className="col-span-1 text-[9px] text-muted-foreground">{tool.auth}</div>
                <div className="col-span-1">
                  <span className={cn("text-[8px] font-semibold",
                    tool.permissions.includes("Write") ? "text-amber-600" : "text-emerald-600"
                  )}>{tool.permissions}</span>
                </div>
                <div className="col-span-1 text-[9px] font-mono text-muted-foreground">{tool.version}</div>
                <div className="col-span-1 flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toast({ title: "Test Connection", description: `Testing ${tool.name}` })}
                    className="p-1 rounded-sm hover:bg-muted border border-border transition-colors" title="Test Connection">
                    <Play size={9} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => toast({ title: "Reconnect", description: `Reconnecting ${tool.name}` })}
                    className="p-1 rounded-sm hover:bg-muted border border-border transition-colors" title="Reconnect">
                    <RefreshCw size={9} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              {isSel && (
                <div className="border-b border-border bg-muted/10 px-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Endpoint</div>
                      <div className="text-[9px] font-mono bg-muted/50 px-2 py-1.5 rounded-sm text-foreground break-all">{tool.endpoint}</div>
                      <div className="mt-2 text-[9px] text-muted-foreground">Rate Limit: <span className="font-semibold text-foreground">{tool.rateLimit}</span></div>
                      <div className="text-[9px] text-muted-foreground">Retries / 24h: <span className="font-semibold text-foreground">{tool.retries}</span></div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Connected Agents</div>
                      {tool.agents.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tool.agents.map((a) => (
                            <span key={a} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-semibold">{a}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">No agents connected</span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-col">
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Actions</div>
                      <button onClick={() => toast({ title: "Request Inspector", description: `Opening inspector for ${tool.name}` })}
                        className="flex items-center gap-1.5 text-[9px] font-bold border border-border px-2 py-1.5 rounded-sm hover:bg-muted/40 transition-colors">
                        <Eye size={9} />Inspect Req/Response
                      </button>
                      <button onClick={() => toast({ title: "Disabled", description: tool.name })}
                        className="flex items-center gap-1.5 text-[9px] font-bold border border-red-200 text-red-700 px-2 py-1.5 rounded-sm hover:bg-red-50 transition-colors">
                        <XCircle size={9} />Disable Tool
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  "Identity", "Mission", "Business Unit", "KPIs", "Skills",
  "Knowledge", "Memory", "Tools", "Policies", "Evaluations", "Deploy",
];

export default function AgentStudio() {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    name: "", role: "", bu: "Manufacturing", kpis: [] as string[],
    skills: [] as string[], model: "GPT-4o", autonomy: "Supervised",
  });
  const { toast } = useToast();
  const { role } = useAppContext();
  const canEdit = role !== "employee";
  const [requestOpen, setRequestOpen] = useState(false);

  const handleWizardFinish = () => {
    setShowWizard(false);
    setWizardStep(0);
    setWizardData({ name: "", role: "", bu: "Manufacturing", kpis: [], skills: [], model: "GPT-4o", autonomy: "Supervised" });
    toast({ title: "Digital Employee created", description: `${wizardData.name || "New Agent"} added as draft — configure and deploy when ready.` });
  };

  if (showWizard) {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
        <HeaderBar moduleName="AGENT HARNESS · CREATE DIGITAL EMPLOYEE" />
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[200px] shrink-0 bg-white border-r border-border flex flex-col py-6 px-4">
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Wizard Steps</div>
            {WIZARD_STEPS.map((step, i) => (
              <button key={step} onClick={() => setWizardStep(i)}
                className={cn(
                  "flex items-center gap-2.5 py-2 px-2 rounded-sm text-left mb-0.5 transition-colors",
                  i === wizardStep ? "bg-primary/10 text-primary" :
                  i < wizardStep ? "text-emerald-600" : "text-muted-foreground hover:text-foreground"
                )}>
                <div className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0",
                  i === wizardStep ? "bg-primary text-white" :
                  i < wizardStep ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {i < wizardStep ? "✓" : i + 1}
                </div>
                <span className="text-[10px] font-semibold">{step}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-[480px]">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Step {wizardStep + 1} of {WIZARD_STEPS.length}</div>
                <div className="text-xl font-bold text-foreground mb-1">{WIZARD_STEPS[wizardStep]}</div>
                <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((wizardStep + 1) / WIZARD_STEPS.length) * 100}%` }} />
                </div>

                {wizardStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-1.5">Employee Name</label>
                      <input value={wizardData.name}
                        onChange={(e) => setWizardData((d) => ({ ...d, name: e.target.value }))}
                        placeholder="e.g. Predictive Maintenance Agent"
                        className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-1.5">Role Title</label>
                      <input value={wizardData.role}
                        onChange={(e) => setWizardData((d) => ({ ...d, role: e.target.value }))}
                        placeholder="e.g. Failure Prediction Specialist"
                        className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-1.5">Autonomy Level</label>
                      <select value={wizardData.autonomy}
                        onChange={(e) => setWizardData((d) => ({ ...d, autonomy: e.target.value }))}
                        className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                        {["Assisted", "Supervised", "Semi-Autonomous", "Fully Autonomous"].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-1.5">AI Model</label>
                      <select value={wizardData.model}
                        onChange={(e) => setWizardData((d) => ({ ...d, model: e.target.value }))}
                        className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                        {["GPT-4o", "GPT-4o-mini", "Claude-3.5-Sonnet", "Claude-3-Haiku", "Gemini-1.5-Pro"].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-2">
                    {["Manufacturing", "Maintenance", "Quality", "Supply Chain", "Procurement", "Finance", "Engineering", "Sales", "Logistics"].map((bu) => (
                      <button key={bu} onClick={() => setWizardData((d) => ({ ...d, bu }))}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 border rounded-sm transition-colors",
                          wizardData.bu === bu ? "border-primary bg-primary/5 text-primary" : "border-border bg-white hover:border-primary/40"
                        )}>
                        <span className="text-[11px] font-semibold">{bu}</span>
                        {wizardData.bu === bu && <CheckCircle2 size={13} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-2">
                    {["OEE", "Downtime Hours", "Yield", "Scrap Rate", "Throughput", "Inventory Turns", "Forecast Accuracy", "Cost per Unit", "On-time Delivery", "EEI"].map((kpi) => {
                      const sel = wizardData.kpis.includes(kpi);
                      return (
                        <button key={kpi}
                          onClick={() => setWizardData((d) => ({ ...d, kpis: sel ? d.kpis.filter((k) => k !== kpi) : [...d.kpis, kpi] }))}
                          className={cn("w-full flex items-center justify-between px-3 py-2 border rounded-sm transition-colors",
                            sel ? "border-primary bg-primary/5 text-primary" : "border-border bg-white hover:border-primary/40")}>
                          <span className="text-[11px] font-semibold">{kpi}</span>
                          {sel && <CheckCircle2 size={12} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-2">
                    {["MES Integration", "SCADA Integration", "ERP Sync", "Vision AI", "Acoustic Analysis", "Demand Sensing", "Root Cause Analysis", "Statistical Process Control", "Failure Prediction", "Schedule Optimization", "Risk Scoring", "Cost Analysis"].map((skill) => {
                      const sel = wizardData.skills.includes(skill);
                      return (
                        <button key={skill}
                          onClick={() => setWizardData((d) => ({ ...d, skills: sel ? d.skills.filter((s) => s !== skill) : [...d.skills, skill] }))}
                          className={cn("w-full flex items-center justify-between px-3 py-2 border rounded-sm transition-colors",
                            sel ? "border-primary bg-primary/5 text-primary" : "border-border bg-white hover:border-primary/40")}>
                          <span className="text-[11px] font-semibold">{skill}</span>
                          {sel && <CheckCircle2 size={12} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(wizardStep === 1 || (wizardStep >= 5 && wizardStep <= 9)) && (
                  <div className="bg-white border border-border rounded-sm p-6 space-y-3">
                    <div className="text-[10px] font-bold text-foreground">{WIZARD_STEPS[wizardStep]} Configuration</div>
                    <div className="text-[10px] text-muted-foreground">
                      {wizardStep === 1 && "Define the primary mission and success criteria for this digital employee."}
                      {wizardStep === 5 && "Select knowledge bases and documents this agent can access."}
                      {wizardStep === 6 && "Configure memory type: ephemeral, short-term, or persistent vector store."}
                      {wizardStep === 7 && "Connect system APIs: ERP, MES, SCADA, CMMS, IoT, WMS, PLM."}
                      {wizardStep === 8 && "Assign governance policies and access controls."}
                      {wizardStep === 9 && "Configure evaluation criteria and pass thresholds."}
                    </div>
                    {wizardStep === 1 && (
                      <textarea placeholder="Describe the primary mission and objective..." rows={4}
                        className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
                    )}
                  </div>
                )}

                {wizardStep === 10 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-6">
                    <div className="text-sm font-bold text-emerald-700 mb-3">Ready to Create</div>
                    <div className="space-y-1 mb-4">
                      {wizardData.name && <div className="text-[11px] font-semibold text-foreground">{wizardData.name}</div>}
                      <div className="text-[10px] text-muted-foreground">{wizardData.bu} · {wizardData.model} · {wizardData.autonomy}</div>
                      {wizardData.kpis.length > 0 && <div className="text-[10px] text-muted-foreground">KPIs: {wizardData.kpis.join(", ")}</div>}
                    </div>
                    <button onClick={handleWizardFinish}
                      className="w-full bg-primary text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                      <Rocket size={12} />Create Digital Employee
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-border bg-white px-8 py-4 flex items-center justify-between">
              <button onClick={() => wizardStep > 0 ? setWizardStep((s) => s - 1) : setShowWizard(false)}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft size={13} />
                {wizardStep === 0 ? "Cancel" : "Back"}
              </button>
              <div className="text-[9px] text-muted-foreground font-mono">{wizardStep + 1} / {WIZARD_STEPS.length}</div>
              {wizardStep < WIZARD_STEPS.length - 1 && (
                <button onClick={() => setWizardStep((s) => s + 1)}
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 transition-colors">
                  Continue<ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="AGENT HARNESS"
        metrics={[
          { label: "Active", value: AGENTS.filter((a) => a.status === "active").length },
          { label: "Avg Health", value: `${Math.round(AGENTS.filter(a => a.health > 0).reduce((s, a) => s + a.health, 0) / AGENTS.filter(a => a.health > 0).length)}%` },
          { label: "Tools", value: TOOLS_DATA.filter((t) => t.status === "connected").length },
          { label: "KB Sources", value: KNOWLEDGE_BASES.length },
        ]}
      />

      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Build</span>
          <ChevronRight size={10} />
          <span className="text-foreground font-semibold">Agent Harness</span>
        </div>
        <RequestChangeModal open={requestOpen} onClose={() => setRequestOpen(false)} subject="Create a new Digital Employee" />
        {canEdit ? (
          <button
            onClick={() => { setShowWizard(true); setWizardStep(0); }}
            className="flex items-center gap-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/90 transition-colors">
            <Plus size={11} />
            Create Digital Employee
          </button>
        ) : (
          <button
            onClick={() => setRequestOpen(true)}
            className="flex items-center gap-1.5 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/5 transition-colors">
            <Plus size={11} />
            Request New Digital Employee
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="roster" className="h-full flex flex-col">
          <div className="bg-white border-b border-border px-6 shrink-0">
            <TabsList className="bg-transparent p-0 h-auto gap-0">
              {[
                { value: "roster", label: "Roster" },
                { value: "templates", label: "Templates" },
                { value: "deployments", label: "Deployments" },
                { value: "versions", label: "Versions" },
                { value: "skills", label: "Skills" },
                { value: "knowledge", label: "Knowledge" },
                { value: "tools", label: "Tools & MCP" },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="text-[10px] uppercase tracking-widest font-semibold px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="roster" className="m-0"><RosterTab /></TabsContent>
            <TabsContent value="templates" className="m-0"><TemplatesTab /></TabsContent>
            <TabsContent value="deployments" className="m-0"><DeploymentsTab /></TabsContent>
            <TabsContent value="versions" className="m-0"><VersionsTab /></TabsContent>
            <TabsContent value="skills" className="m-0"><SkillsTab /></TabsContent>
            <TabsContent value="knowledge" className="m-0"><KnowledgeTab /></TabsContent>
            <TabsContent value="tools" className="m-0"><ToolsTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
