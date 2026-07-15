// Canonical AI agent registry — every agent belongs to exactly one department (deptId).

import { deptTwinId } from "@/data/org-ids";

export interface AgentRecord {
  id: string;
  companyId: string;
  name: string;
  employeeId: string;
  role: string;
  department: string;
  bu: string;
  deptId: string;
  status: "active" | "watch" | "critical";
  autonomy: "full" | "supervised" | "assisted";
  utilization: number;
  sla: number;
  costPerDay: number;
  tasks: number;
  skills: string[];
  systems: string[];
  hoursSaved: number;
  revenueProtected: string;
  downtimePrevented: string;
  costSaved: string;
  automationPct: number;
  roi: string;
  eeiContrib: string;
  kpisImproved: string[];
  health: number;
  version: string;
  model: string;
  latencyMs: number;
  accuracy: number;
  hallucination: number;
  policyCompliance: number;
  tokenUsage: number;
  costMtd: string;
  adapterId: string;
  costModelId: string;
  reasoningLevel: string;
}

export const ALL_AGENTS: AgentRecord[] = [
  {
    id: "ag1", companyId: "company-a", name: "Production Planner", employeeId: "AIE-0101", role: "Production Scheduling Agent",
    department: "Production", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Production"), status: "active", autonomy: "full",
    utilization: 94, sla: 97.8, costPerDay: 182, tasks: 412,
    skills: ["MES Integration", "Scheduling Optimization", "Capacity Planning", "ERP Sync"],
    systems: ["ERP", "MES", "SCADA"],
    hoursSaved: 1840, revenueProtected: "$4.2M", downtimePrevented: "42 hrs", costSaved: "$380K",
    automationPct: 87, roi: "2.3x", eeiContrib: "+1.8", kpisImproved: ["OEE", "Throughput", "EEI"],
    health: 96, version: "v3.2", model: "GPT-4o",
    latencyMs: 840, accuracy: 94.2, hallucination: 0.8, policyCompliance: 99.1,
    tokenUsage: 2840000, costMtd: "$5,420",
    adapterId: "codex", costModelId: "gpt-4o", reasoningLevel: "High",
  },
  {
    id: "ag2", companyId: "company-a", name: "OEE Optimizer", employeeId: "AIE-0102", role: "Equipment Efficiency Agent",
    department: "Engineering", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Engineering"), status: "active", autonomy: "supervised",
    utilization: 88, sla: 95.4, costPerDay: 148, tasks: 284,
    skills: ["OEE Monitoring", "Root Cause Analysis", "Shift Optimization", "SCADA Integration"],
    systems: ["SCADA", "MES", "IoT"],
    hoursSaved: 960, revenueProtected: "$2.8M", downtimePrevented: "28 hrs", costSaved: "$214K",
    automationPct: 79, roi: "1.9x", eeiContrib: "+1.2", kpisImproved: ["OEE", "Scrap Rate"],
    health: 92, version: "v2.8", model: "GPT-4o",
    latencyMs: 1120, accuracy: 91.8, hallucination: 1.2, policyCompliance: 98.4,
    tokenUsage: 1920000, costMtd: "$4,180",
    adapterId: "codex", costModelId: "gpt-4o", reasoningLevel: "Medium",
  },
  {
    id: "ag2b", companyId: "company-a", name: "Line Monitor Agent", employeeId: "AIE-0103", role: "Real-time Line Intelligence Agent",
    department: "Production", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Production"), status: "active", autonomy: "supervised",
    utilization: 91, sla: 96.2, costPerDay: 132, tasks: 356,
    skills: ["Line Telemetry", "Stoppage Detection", "MES Integration", "Alert Routing"],
    systems: ["MES", "SCADA", "IoT"],
    hoursSaved: 720, revenueProtected: "$1.6M", downtimePrevented: "18 hrs", costSaved: "$168K",
    automationPct: 82, roi: "2.0x", eeiContrib: "+1.0", kpisImproved: ["OEE", "Throughput"],
    health: 93, version: "v2.4", model: "GPT-4o",
    latencyMs: 680, accuracy: 93.1, hallucination: 0.9, policyCompliance: 98.8,
    tokenUsage: 1560000, costMtd: "$3,640",
    adapterId: "codex", costModelId: "gpt-4o", reasoningLevel: "Medium",
  },
  {
    id: "ag1b", companyId: "company-a", name: "Shift Scheduler", employeeId: "AIE-0104", role: "Workforce Scheduling Agent",
    department: "Production", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Production"), status: "active", autonomy: "supervised",
    utilization: 85, sla: 95.6, costPerDay: 118, tasks: 268,
    skills: ["Shift Planning", "Labor Forecasting", "MES Integration", "Absence Coverage"],
    systems: ["ERP", "MES"],
    hoursSaved: 540, revenueProtected: "$920K", downtimePrevented: "9 hrs", costSaved: "$126K",
    automationPct: 74, roi: "1.7x", eeiContrib: "+0.7", kpisImproved: ["Throughput", "Labor Cost"],
    health: 90, version: "v1.6", model: "GPT-4o-mini",
    latencyMs: 1040, accuracy: 89.4, hallucination: 1.3, policyCompliance: 97.8,
    tokenUsage: 1080000, costMtd: "$2,360",
    adapterId: "gemini-cli", costModelId: "gpt-4o-mini", reasoningLevel: "Medium",
  },
  {
    id: "ag1c", companyId: "company-a", name: "Changeover Optimizer", employeeId: "AIE-0105", role: "Changeover Reduction Agent",
    department: "Production", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Production"), status: "active", autonomy: "supervised",
    utilization: 80, sla: 94.8, costPerDay: 126, tasks: 194,
    skills: ["Setup Sequencing", "SMED Analysis", "MES Integration"],
    systems: ["MES", "SCADA"],
    hoursSaved: 460, revenueProtected: "$780K", downtimePrevented: "14 hrs", costSaved: "$104K",
    automationPct: 69, roi: "1.6x", eeiContrib: "+0.6", kpisImproved: ["OEE", "Throughput"],
    health: 87, version: "v1.3", model: "GPT-4o-mini",
    latencyMs: 1220, accuracy: 87.6, hallucination: 1.6, policyCompliance: 96.9,
    tokenUsage: 860000, costMtd: "$2,080",
    adapterId: "gemini-cli", costModelId: "gpt-4o-mini", reasoningLevel: "Low",
  },
  {
    id: "ag1d", companyId: "company-a", name: "Capacity Planner", employeeId: "AIE-0106", role: "Capacity Forecasting Agent",
    department: "Production", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Production"), status: "watch", autonomy: "assisted",
    utilization: 61, sla: 90.2, costPerDay: 96, tasks: 112,
    skills: ["Demand-Capacity Matching", "Scenario Modeling", "ERP Integration"],
    systems: ["ERP", "MES"],
    hoursSaved: 280, revenueProtected: "$420K", downtimePrevented: "—", costSaved: "$58K",
    automationPct: 51, roi: "1.1x", eeiContrib: "+0.3", kpisImproved: ["Throughput"],
    health: 76, version: "v0.9", model: "GPT-4o-mini",
    latencyMs: 1560, accuracy: 82.1, hallucination: 2.2, policyCompliance: 94.6,
    tokenUsage: 420000, costMtd: "$1,540",
    adapterId: "http-webhook", costModelId: "gpt-4o-mini", reasoningLevel: "Low",
  },
  {
    id: "ag3", companyId: "company-a", name: "Predictive Maintenance", employeeId: "AIE-0201", role: "Failure Prediction Agent",
    department: "Maintenance", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Maintenance"), status: "active", autonomy: "full",
    utilization: 97, sla: 98.2, costPerDay: 162, tasks: 543,
    skills: ["Acoustic Analysis", "Vibration Monitoring", "Failure Prediction", "CMMS Integration"],
    systems: ["CMMS", "IoT", "SCADA"],
    hoursSaved: 2240, revenueProtected: "$6.1M", downtimePrevented: "84 hrs", costSaved: "$920K",
    automationPct: 91, roi: "2.4x", eeiContrib: "+2.1", kpisImproved: ["Downtime", "OEE", "EEI"],
    health: 98, version: "v4.1", model: "GPT-4o",
    latencyMs: 620, accuracy: 96.4, hallucination: 0.4, policyCompliance: 99.8,
    tokenUsage: 3410000, costMtd: "$6,840",
    adapterId: "claude-code", costModelId: "gpt-4o", reasoningLevel: "High",
  },
  {
    id: "ag10", companyId: "company-a", name: "Energy Intelligence", employeeId: "AIE-0801", role: "EEI Optimization Agent",
    department: "Engineering", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Engineering"), status: "active", autonomy: "full",
    utilization: 88, sla: 97.4, costPerDay: 91, tasks: 312,
    skills: ["Energy Monitoring", "Load Balancing", "SCADA Integration", "Anomaly Detection"],
    systems: ["SCADA", "BMS", "IoT"],
    hoursSaved: 640, revenueProtected: "$1.1M", downtimePrevented: "—", costSaved: "$218K",
    automationPct: 81, roi: "1.9x", eeiContrib: "+1.2", kpisImproved: ["EEI", "Energy Cost"],
    health: 95, version: "v2.0", model: "GPT-4o",
    latencyMs: 740, accuracy: 94.8, hallucination: 0.7, policyCompliance: 98.6,
    tokenUsage: 1480000, costMtd: "$2,730",
    adapterId: "bash", costModelId: "gpt-4o", reasoningLevel: "High",
  },
  {
    id: "ag11", companyId: "company-a", name: "Scrap Rate Reducer", employeeId: "AIE-0901", role: "Waste Reduction Agent",
    department: "Quality", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Quality"), status: "watch", autonomy: "assisted",
    utilization: 42, sla: 72.0, costPerDay: 48, tasks: 24,
    skills: ["Defect Analysis", "Root Cause Analysis", "SPC Integration"],
    systems: ["MES", "ERP"],
    hoursSaved: 120, revenueProtected: "$180K", downtimePrevented: "—", costSaved: "$42K",
    automationPct: 38, roi: "0.9x", eeiContrib: "+0.2", kpisImproved: ["Scrap Rate", "OEE"],
    health: 68, version: "v0.1", model: "GPT-4o-mini",
    latencyMs: 1840, accuracy: 78.4, hallucination: 2.4, policyCompliance: 92.1,
    tokenUsage: 240000, costMtd: "$680",
    adapterId: "gemini-cli", costModelId: "gpt-4o-mini", reasoningLevel: "Minimal",
  },
  {
    id: "ag4", companyId: "company-a", name: "Quality Inspector", employeeId: "AIE-0301", role: "Defect Detection Agent",
    department: "Quality", bu: "manufacturing", deptId: deptTwinId("manufacturing", "Quality"), status: "active", autonomy: "supervised",
    utilization: 91, sla: 96.8, costPerDay: 138, tasks: 389,
    skills: ["Vision AI", "Defect Classification", "Statistical Process Control", "MES Integration"],
    systems: ["MES", "IoT", "ERP"],
    hoursSaved: 1280, revenueProtected: "$1.8M", downtimePrevented: "12 hrs", costSaved: "$340K",
    automationPct: 83, roi: "2.1x", eeiContrib: "+1.4", kpisImproved: ["Yield", "Scrap Rate", "Defect Rate"],
    health: 94, version: "v2.4", model: "Claude-3.5-Sonnet",
    latencyMs: 780, accuracy: 93.6, hallucination: 0.9, policyCompliance: 98.9,
    tokenUsage: 2180000, costMtd: "$3,960",
    adapterId: "claude-code", costModelId: "claude-3-5-sonnet", reasoningLevel: "Medium",
  },
  {
    id: "ag5", companyId: "company-a", name: "Inventory Optimizer", employeeId: "AIE-0401", role: "Stock Intelligence Agent",
    department: "Warehousing", bu: "supply-chain", deptId: deptTwinId("supply-chain", "Warehousing"), status: "watch", autonomy: "supervised",
    utilization: 76, sla: 88.4, costPerDay: 124, tasks: 241,
    skills: ["Demand Sensing", "Replenishment Optimization", "WMS Integration", "Stockout Prediction"],
    systems: ["WMS", "ERP", "IoT"],
    hoursSaved: 680, revenueProtected: "$1.4M", downtimePrevented: "—", costSaved: "$182K",
    automationPct: 64, roi: "1.4x", eeiContrib: "+0.8", kpisImproved: ["Inventory Turns", "Fill Rate"],
    health: 82, version: "v1.9", model: "GPT-4o-mini",
    latencyMs: 1840, accuracy: 84.2, hallucination: 2.1, policyCompliance: 96.2,
    tokenUsage: 1240000, costMtd: "$2,840",
    adapterId: "gemini-cli", costModelId: "gpt-4o-mini", reasoningLevel: "Medium",
  },
  {
    id: "ag5b", companyId: "company-a", name: "Demand Planner", employeeId: "AIE-0402", role: "Forecast Modeling Agent",
    department: "Demand Planning", bu: "supply-chain", deptId: deptTwinId("supply-chain", "Demand Planning"), status: "active", autonomy: "supervised",
    utilization: 84, sla: 92.1, costPerDay: 118, tasks: 198,
    skills: ["Statistical Forecasting", "Seasonality Modeling", "ERP Integration"],
    systems: ["ERP", "WMS"],
    hoursSaved: 520, revenueProtected: "$980K", downtimePrevented: "—", costSaved: "$142K",
    automationPct: 68, roi: "1.5x", eeiContrib: "+0.6", kpisImproved: ["Forecast Accuracy", "Fill Rate"],
    health: 86, version: "v1.6", model: "GPT-4o-mini",
    latencyMs: 1420, accuracy: 86.4, hallucination: 1.8, policyCompliance: 97.1,
    tokenUsage: 980000, costMtd: "$2,240",
    adapterId: "gemini-cli", costModelId: "gpt-4o-mini", reasoningLevel: "Medium",
  },
  {
    id: "ag5c", companyId: "company-a", name: "WMS Agent", employeeId: "AIE-0403", role: "Warehouse Operations Agent",
    department: "Warehousing", bu: "supply-chain", deptId: deptTwinId("supply-chain", "Warehousing"), status: "watch", autonomy: "assisted",
    utilization: 79, sla: 90.2, costPerDay: 112, tasks: 276,
    skills: ["Pick-path Optimization", "WMS Integration", "Slotting Intelligence"],
    systems: ["WMS", "ERP"],
    hoursSaved: 440, revenueProtected: "$720K", downtimePrevented: "—", costSaved: "$118K",
    automationPct: 61, roi: "1.3x", eeiContrib: "+0.5", kpisImproved: ["Fill Rate", "OTIF"],
    health: 80, version: "v1.4", model: "GPT-4o-mini",
    latencyMs: 1680, accuracy: 85.8, hallucination: 2.0, policyCompliance: 95.8,
    tokenUsage: 860000, costMtd: "$2,080",
    adapterId: "http-webhook", costModelId: "gpt-4o-mini", reasoningLevel: "Low",
  },
  {
    id: "ag5d", companyId: "company-a", name: "Route Optimizer", employeeId: "AIE-0404", role: "Route Intelligence Agent",
    department: "Logistics", bu: "supply-chain", deptId: deptTwinId("supply-chain", "Logistics"), status: "active", autonomy: "full",
    utilization: 87, sla: 93.6, costPerDay: 126, tasks: 214,
    skills: ["Route Planning", "TMS Integration", "Carrier Selection"],
    systems: ["TMS", "ERP"],
    hoursSaved: 380, revenueProtected: "$640K", downtimePrevented: "—", costSaved: "$96K",
    automationPct: 72, roi: "1.6x", eeiContrib: "+0.7", kpisImproved: ["OTD", "OTIF"],
    health: 88, version: "v2.0", model: "GPT-4o",
    latencyMs: 1240, accuracy: 90.2, hallucination: 1.4, policyCompliance: 97.6,
    tokenUsage: 1120000, costMtd: "$2,560",
    adapterId: "codex", costModelId: "gpt-4o", reasoningLevel: "Medium",
  },
  {
    id: "ag6", companyId: "company-a", name: "Supplier Risk Agent", employeeId: "AIE-0501", role: "Supplier Intelligence Agent",
    department: "Supplier Management", bu: "procurement", deptId: deptTwinId("procurement", "Supplier Management"), status: "watch", autonomy: "assisted",
    utilization: 71, sla: 84.2, costPerDay: 108, tasks: 187,
    skills: ["Supplier Risk Scoring", "Market Intelligence", "Contract Analysis", "ERP Integration"],
    systems: ["ERP", "PLM"],
    hoursSaved: 420, revenueProtected: "$0.8M", downtimePrevented: "—", costSaved: "$128K",
    automationPct: 52, roi: "1.2x", eeiContrib: "+0.5", kpisImproved: ["Supplier Score", "Cycle Time"],
    health: 78, version: "v1.4", model: "GPT-4o-mini",
    latencyMs: 2140, accuracy: 81.8, hallucination: 2.8, policyCompliance: 94.8,
    tokenUsage: 880000, costMtd: "$2,120",
    adapterId: "http-webhook", costModelId: "gpt-4o-mini", reasoningLevel: "Low",
  },
  {
    id: "ag6b", companyId: "company-a", name: "Sourcing Agent", employeeId: "AIE-0502", role: "Strategic Sourcing Agent",
    department: "Sourcing", bu: "procurement", deptId: deptTwinId("procurement", "Sourcing"), status: "active", autonomy: "supervised",
    utilization: 82, sla: 91.4, costPerDay: 116, tasks: 224,
    skills: ["Supplier Negotiation", "Market Benchmarking", "ERP Integration"],
    systems: ["ERP", "PLM"],
    hoursSaved: 560, revenueProtected: "$1.4M", downtimePrevented: "—", costSaved: "$210K",
    automationPct: 58, roi: "1.5x", eeiContrib: "+0.8", kpisImproved: ["Cost Savings", "Cycle Time"],
    health: 84, version: "v1.8", model: "GPT-4o",
    latencyMs: 1580, accuracy: 88.2, hallucination: 1.6, policyCompliance: 96.4,
    tokenUsage: 1040000, costMtd: "$2,480",
    adapterId: "codex", costModelId: "gpt-4o", reasoningLevel: "Medium",
  },
  {
    id: "ag6c", companyId: "company-a", name: "Contract Bot", employeeId: "AIE-0503", role: "Contract Lifecycle Agent",
    department: "Contracts", bu: "procurement", deptId: deptTwinId("procurement", "Contracts"), status: "active", autonomy: "supervised",
    utilization: 85, sla: 93.8, costPerDay: 104, tasks: 312,
    skills: ["Contract Drafting", "Clause Analysis", "Approval Routing"],
    systems: ["ERP", "PLM"],
    hoursSaved: 480, revenueProtected: "$600K", downtimePrevented: "—", costSaved: "$94K",
    automationPct: 64, roi: "1.4x", eeiContrib: "+0.6", kpisImproved: ["Cycle Time"],
    health: 86, version: "v2.0", model: "GPT-4o",
    latencyMs: 1320, accuracy: 90.6, hallucination: 1.2, policyCompliance: 97.2,
    tokenUsage: 920000, costMtd: "$2,180",
    adapterId: "cursor", costModelId: "gpt-4o", reasoningLevel: "Medium",
  },
  {
    id: "ag7", companyId: "company-a", name: "Finance Analyst", employeeId: "AIE-0601", role: "Cost Analytics Agent",
    department: "FP&A", bu: "finance", deptId: deptTwinId("finance", "FP&A"), status: "active", autonomy: "full",
    utilization: 86, sla: 97.4, costPerDay: 142, tasks: 318,
    skills: ["Cost Analysis", "Variance Reporting", "ERP Integration", "Budget Intelligence"],
    systems: ["ERP", "MES"],
    hoursSaved: 1120, revenueProtected: "$2.2M", downtimePrevented: "—", costSaved: "$284K",
    automationPct: 88, roi: "2.2x", eeiContrib: "+1.6", kpisImproved: ["Cost per Unit", "Forecast Accuracy"],
    health: 95, version: "v3.0", model: "GPT-4o",
    latencyMs: 920, accuracy: 95.1, hallucination: 0.6, policyCompliance: 99.4,
    tokenUsage: 1840000, costMtd: "$4,620",
    adapterId: "codex", costModelId: "gpt-4o", reasoningLevel: "High",
  },
  {
    id: "ag7b", companyId: "company-a", name: "Cost Controller", employeeId: "AIE-0602", role: "Budget Intelligence Agent",
    department: "Accounting", bu: "finance", deptId: deptTwinId("finance", "Accounting"), status: "active", autonomy: "full",
    utilization: 84, sla: 96.8, costPerDay: 128, tasks: 264,
    skills: ["Budget Tracking", "Variance Alerts", "ERP Integration"],
    systems: ["ERP"],
    hoursSaved: 840, revenueProtected: "$1.6M", downtimePrevented: "—", costSaved: "$198K",
    automationPct: 86, roi: "2.0x", eeiContrib: "+1.2", kpisImproved: ["Cost per Unit", "COGS"],
    health: 93, version: "v2.6", model: "GPT-4o",
    latencyMs: 880, accuracy: 94.4, hallucination: 0.7, policyCompliance: 99.0,
    tokenUsage: 1420000, costMtd: "$3,840",
    adapterId: "codex", costModelId: "gpt-4o", reasoningLevel: "High",
  },
  {
    id: "ag7c", companyId: "company-a", name: "Audit Agent", employeeId: "AIE-0603", role: "Compliance & Audit Agent",
    department: "Audit", bu: "finance", deptId: deptTwinId("finance", "Audit"), status: "active", autonomy: "supervised",
    utilization: 80, sla: 98.1, costPerDay: 118, tasks: 186,
    skills: ["Policy Compliance", "Exception Detection", "Audit Trail Analysis"],
    systems: ["ERP"],
    hoursSaved: 620, revenueProtected: "$900K", downtimePrevented: "—", costSaved: "$142K",
    automationPct: 82, roi: "1.8x", eeiContrib: "+1.0", kpisImproved: ["Close Cycle"],
    health: 94, version: "v3.1", model: "GPT-4o",
    latencyMs: 1040, accuracy: 96.2, hallucination: 0.5, policyCompliance: 99.6,
    tokenUsage: 1180000, costMtd: "$3,420",
    adapterId: "claude-code", costModelId: "gpt-4o", reasoningLevel: "High",
  },
  {
    id: "ag8", companyId: "company-a", name: "Revenue Scout", employeeId: "AIE-0701", role: "Pipeline Intelligence Agent",
    department: "Sales", bu: "revenue", deptId: deptTwinId("revenue", "Sales"), status: "active", autonomy: "supervised",
    utilization: 89, sla: 94.8, costPerDay: 158, tasks: 342,
    skills: ["Pipeline Analysis", "Opportunity Scoring", "CRM Integration", "Forecast Modeling"],
    systems: ["CRM", "ERP"],
    hoursSaved: 1240, revenueProtected: "$14.2M", downtimePrevented: "—", costSaved: "$380K",
    automationPct: 78, roi: "2.7x", eeiContrib: "+1.4", kpisImproved: ["Pipeline Health", "Forecast Accuracy"],
    health: 91, version: "v2.6", model: "GPT-4o",
    latencyMs: 980, accuracy: 92.4, hallucination: 1.1, policyCompliance: 98.2,
    tokenUsage: 2140000, costMtd: "$4,840",
    adapterId: "cursor", costModelId: "gpt-4o", reasoningLevel: "Medium",
  },
  {
    id: "ag9", companyId: "company-a", name: "Deal Closer AI", employeeId: "AIE-0702", role: "Sales Acceleration Agent",
    department: "Sales", bu: "revenue", deptId: deptTwinId("revenue", "Sales"), status: "active", autonomy: "supervised",
    utilization: 83, sla: 91.2, costPerDay: 134, tasks: 218,
    skills: ["Deal Qualification", "Proposal Generation", "Objection Handling", "CRM Sync"],
    systems: ["CRM", "ERP"],
    hoursSaved: 840, revenueProtected: "$6.8M", downtimePrevented: "—", costSaved: "$240K",
    automationPct: 72, roi: "2.4x", eeiContrib: "+1.0", kpisImproved: ["Deal Velocity", "Win Rate"],
    health: 88, version: "v2.1", model: "GPT-4o",
    latencyMs: 1140, accuracy: 89.6, hallucination: 1.4, policyCompliance: 97.4,
    tokenUsage: 1640000, costMtd: "$3,820",
    adapterId: "cursor", costModelId: "gpt-4o", reasoningLevel: "Medium",
  },
  {
    id: "ag9b", companyId: "company-a", name: "Customer Intel", employeeId: "AIE-0703", role: "Account Intelligence Agent",
    department: "Customer Success", bu: "revenue", deptId: deptTwinId("revenue", "Customer Success"), status: "active", autonomy: "supervised",
    utilization: 86, sla: 93.4, costPerDay: 122, tasks: 196,
    skills: ["Account Health Scoring", "Churn Prediction", "CRM Integration"],
    systems: ["CRM"],
    hoursSaved: 680, revenueProtected: "$3.2M", downtimePrevented: "—", costSaved: "$168K",
    automationPct: 74, roi: "2.2x", eeiContrib: "+0.9", kpisImproved: ["NPS", "Pipeline Health"],
    health: 90, version: "v2.2", model: "GPT-4o",
    latencyMs: 1060, accuracy: 91.2, hallucination: 1.0, policyCompliance: 98.0,
    tokenUsage: 1380000, costMtd: "$3,280",
    adapterId: "cursor", costModelId: "gpt-4o", reasoningLevel: "Medium",
  },
  {
    id: "ag9c", companyId: "company-a", name: "Forecast Agent", employeeId: "AIE-0704", role: "Demand Forecasting Agent",
    department: "Sales", bu: "revenue", deptId: deptTwinId("revenue", "Sales"), status: "watch", autonomy: "assisted",
    utilization: 78, sla: 88.6, costPerDay: 114, tasks: 164,
    skills: ["Revenue Forecasting", "Scenario Modeling", "CRM Integration"],
    systems: ["CRM", "ERP"],
    hoursSaved: 520, revenueProtected: "$2.4M", downtimePrevented: "—", costSaved: "$124K",
    automationPct: 68, roi: "1.9x", eeiContrib: "+0.7", kpisImproved: ["Forecast Accuracy"],
    health: 84, version: "v1.8", model: "GPT-4o-mini",
    latencyMs: 1280, accuracy: 87.8, hallucination: 1.6, policyCompliance: 96.8,
    tokenUsage: 960000, costMtd: "$2,640",
    adapterId: "gemini-cli", costModelId: "gpt-4o-mini", reasoningLevel: "Medium",
  },
];

/** Backward-compatible alias — the whole-enterprise agent list. */
export const MFG_AGENTS = ALL_AGENTS;

export function agentsForDept(deptId: string): AgentRecord[] {
  return ALL_AGENTS.filter((a) => a.deptId === deptId);
}

export function agentsForBu(buId: string): AgentRecord[] {
  return ALL_AGENTS.filter((a) => a.bu === buId);
}
