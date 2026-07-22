import { useRef } from "react";
import { useParams, useLocation, Redirect } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { BU_LIST, MFG_AGENTS, SOP_CATALOG, ANOMALIES, BU_INTELLIGENCE, ENTERPRISE_METRICS } from "@/data/enterprise-data";
import {
  Bot, Shield, TrendingUp, TrendingDown, ArrowRight, CheckCircle2,
  AlertTriangle, XCircle, Clock, ChevronRight,
  DollarSign, Target, Cpu, Lock,
  Star, Play, RefreshCw,
  Layers, Gauge, ClipboardCheck, Workflow,
} from "lucide-react";

// ─── Per-BU rich data ─────────────────────────────────────────

const BU_TIMELINE: Record<string, Array<{ time: string; event: string; actor: string; type: "agent"|"human"|"system"|"alert" }>> = {
  manufacturing: [
    { time: "06:12", event: "Emergency WO generated for MX-0441 bearing replacement", actor: "Predictive Maintenance", type: "agent" },
    { time: "06:08", event: "Shift schedule optimized (+42 u/hr throughput)", actor: "Production Planner", type: "agent" },
    { time: "06:04", event: "Line 7 OEE deviation alert escalated to supervisor", actor: "OEE Optimizer", type: "alert" },
    { time: "05:52", event: "Emergency line stop approved (bearing fault)", actor: "Maintenance Supervisor", type: "human" },
    { time: "05:44", event: "Predictive inspection complete (12 assets green, 2 flagged)", actor: "Predictive Maintenance", type: "agent" },
    { time: "05:38", event: "ERP sync completed (284 work orders reconciled)", actor: "Production Planner", type: "system" },
    { time: "05:22", event: "Quality inspection batch QD-229 (3 defects flagged)", actor: "Quality Inspector", type: "agent" },
    { time: "04:58", event: "Scrap disposition approved for 2 units (QD-228)", actor: "Quality Manager", type: "human" },
  ],
  "supply-chain": [
    { time: "06:13", event: "SKU-8841 stockout alert (11-day runway)", actor: "Inventory Optimizer", type: "alert" },
    { time: "06:07", event: "APAC forecast variance flagged (18% above threshold)", actor: "Demand Planner", type: "agent" },
    { time: "05:58", event: "18 orders rerouted via alternate pick path", actor: "WMS Agent", type: "agent" },
    { time: "05:42", event: "WMS sync lag alert (4.2 min degraded freshness)", actor: "Inventory Optimizer", type: "alert" },
    { time: "05:28", event: "Emergency reorder authorization approved", actor: "Supply Chain Manager", type: "human" },
    { time: "04:48", event: "Carrier B delay mitigation routes calculated", actor: "Route Optimizer", type: "agent" },
    { time: "04:22", event: "Demand plan locked for next 7 days", actor: "Demand Planner", type: "system" },
  ],
  procurement: [
    { time: "06:10", event: "Supplier #084 risk score 82 (continuity alert raised)", actor: "Supplier Risk", type: "alert" },
    { time: "06:04", event: "PO approval backlog: 29 open, 4 past SLA", actor: "Contract Bot", type: "alert" },
    { time: "05:51", event: "Renegotiation complete (Supplier #042 -6 days lead time)", actor: "Sourcing Agent", type: "agent" },
    { time: "05:38", event: "Supplier #091 financial health score dropped 12 pts", actor: "Supplier Risk", type: "agent" },
    { time: "05:22", event: "Emergency alternate supplier protocol approved", actor: "Procurement Manager", type: "human" },
    { time: "04:48", event: "4 alternate suppliers qualified and shortlisted", actor: "Sourcing Agent", type: "agent" },
  ],
  finance: [
    { time: "06:14", event: "Cost center variance report (4 items above threshold)", actor: "Finance Analyst", type: "agent" },
    { time: "06:08", event: "Raw material cost variance +8.2% flagged for CFO", actor: "Cost Controller", type: "alert" },
    { time: "05:54", event: "Reconciliation complete (98.8% auto-matched)", actor: "Audit Agent", type: "agent" },
    { time: "05:41", event: "Monthly forecast updated (94.2% accuracy)", actor: "Finance Analyst", type: "agent" },
    { time: "05:22", event: "Budget variance exception approved by Finance Director", actor: "Finance Director", type: "human" },
    { time: "04:48", event: "ERP period-end close process initiated", actor: "Finance Analyst", type: "system" },
  ],
  revenue: [
    { time: "06:11", event: "APAC pipeline conversion alert (-11% over 30 days)", actor: "Revenue Scout", type: "alert" },
    { time: "06:04", event: "4 APAC accounts flagged (churn probability >70%)", actor: "Customer Intel", type: "agent" },
    { time: "05:54", event: "Q3 pipeline forecast updated ($48.2M, 22.4% conv.)", actor: "Forecast Agent", type: "agent" },
    { time: "05:42", event: "APAC forecast variance (18%) triggers model retraining", actor: "Forecast Agent", type: "agent" },
    { time: "05:22", event: "EMEA deployment plan approved by VP Sales", actor: "VP Sales", type: "human" },
    { time: "04:48", event: "Deal Closer AI closed 18% more deals vs benchmark", actor: "Deal Closer AI", type: "agent" },
  ],
};

const BU_RISKS: Record<string, Array<{ title: string; severity: "critical"|"high"|"medium"|"low"; type: string; owner: string; status: "open"|"mitigating"|"resolved"; impact: string }>> = {
  manufacturing: [
    { title: "MX-0441 bearing failure (Line 7 downtime risk)", severity: "critical", type: "Asset", owner: "Predictive Maintenance", status: "mitigating", impact: "$480K revenue at risk" },
    { title: "Scrap rate above target (batch QD-229)", severity: "high", type: "Quality", owner: "Quality Inspector", status: "open", impact: "$84K material cost" },
    { title: "SCADA data feed timeout (Line 7)", severity: "medium", type: "System", owner: "IT Operations", status: "resolved", impact: "2 min data gap (interpolated)" },
    { title: "Line 8 capacity utilization at 91% (rising)", severity: "medium", type: "Capacity", owner: "Production Planner", status: "mitigating", impact: "Overflow risk if Line 7 fails" },
  ],
  "supply-chain": [
    { title: "SKU-8841 stockout risk (WH-3, 11-day runway)", severity: "critical", type: "Inventory", owner: "Inventory Optimizer", status: "mitigating", impact: "$1.2M revenue at risk" },
    { title: "APAC forecast accuracy below 90% threshold", severity: "high", type: "Forecast", owner: "Demand Planner", status: "open", impact: "18% demand planning error" },
    { title: "WMS sync lag 4.2 min (data freshness degraded)", severity: "medium", type: "System", owner: "IT Operations", status: "open", impact: "Inventory accuracy -2%" },
    { title: "Carrier B delay risk (6 active shipments)", severity: "medium", type: "Logistics", owner: "Route Optimizer", status: "mitigating", impact: "+18 hrs delivery delay" },
  ],
  procurement: [
    { title: "3 Tier-1 suppliers at continuity risk (score >80)", severity: "critical", type: "Supplier", owner: "Supplier Risk", status: "mitigating", impact: "18-day supply disruption risk" },
    { title: "PO approval backlog (29 items, 4 SLA breaches)", severity: "high", type: "Process", owner: "Contract Bot", status: "open", impact: "12.4-day avg cycle time" },
    { title: "Supplier #091 financial health deterioration", severity: "high", type: "Supplier", owner: "Supplier Risk", status: "open", impact: "Tier-2 continuity risk" },
    { title: "New vendor approval delays (compliance gap)", severity: "medium", type: "Compliance", owner: "Procurement Manager", status: "open", impact: "Sourcing flexibility reduced" },
  ],
  finance: [
    { title: "Cost per unit above $17 target ($18.40 actual)", severity: "medium", type: "Cost", owner: "Finance Analyst", status: "open", impact: "$1.4 variance vs standard" },
    { title: "Close cycle 3.1 days (above 3.0-day target)", severity: "low", type: "Process", owner: "Finance Analyst", status: "mitigating", impact: "+0.1 day delay to reporting" },
    { title: "2 policy exceptions flagged (FIN-001)", severity: "medium", type: "Compliance", owner: "Audit Agent", status: "resolved", impact: "Both resolved within SLA" },
    { title: "Budget variance $240K (raw materials Q3)", severity: "medium", type: "Budget", owner: "Cost Controller", status: "mitigating", impact: "CFO review requested" },
  ],
  revenue: [
    { title: "APAC pipeline conversion declining -11%", severity: "critical", type: "Pipeline", owner: "Revenue Scout", status: "mitigating", impact: "$3.4M pipeline at risk" },
    { title: "Q3 forecast accuracy 88% (below 92% target)", severity: "high", type: "Forecast", owner: "Forecast Agent", status: "open", impact: "4 deals with >40% slip probability" },
    { title: "4 APAC enterprise accounts at churn risk", severity: "high", type: "Retention", owner: "Customer Intel", status: "mitigating", impact: "$2.1M ARR at risk" },
    { title: "Deal velocity 22.4 days (target <18 days)", severity: "medium", type: "Sales", owner: "Deal Closer AI", status: "open", impact: "+4.4 day sales cycle" },
  ],
};

const BU_APPROVALS: Record<string, Array<{ action: string; agent: string; risk: string; status: "pending"|"escalated"|"approved"|"rejected"; age: string; value?: string }>> = {
  manufacturing: [
    { action: "Emergency line stop authorization (MX-0441 bearing fault)", agent: "OEE Optimizer", risk: "high", status: "pending", age: "6 min", value: "$480K" },
    { action: "Batch QD-229 rework authorization (3 units)", agent: "Quality Inspector", risk: "medium", status: "pending", age: "42 min" },
    { action: "Overtime scheduling for bearing replacement (4 technicians)", agent: "Production Planner", risk: "low", status: "pending", age: "1.2 hrs" },
    { action: "Emergency WO parts procurement for MX-0441", agent: "Predictive Maintenance", risk: "high", status: "escalated", age: "8 min", value: "$4,200" },
  ],
  "supply-chain": [
    { action: "Emergency reorder SKU-8841 (WH-3 stockout prevention)", agent: "Inventory Optimizer", risk: "high", status: "pending", age: "18 min", value: "$84,000" },
    { action: "Demand plan revision (APAC +22%)", agent: "Demand Planner", risk: "medium", status: "pending", age: "3.4 hrs" },
    { action: "Carrier substitution authorization (6 shipments)", agent: "Route Optimizer", risk: "medium", status: "pending", age: "48 min" },
    { action: "Safety stock adjustment (3 critical SKUs)", agent: "Inventory Optimizer", risk: "medium", status: "escalated", age: "2.1 hrs", value: "$142,000" },
  ],
  procurement: [
    { action: "Alternate supplier activation (3 Tier-1 vendors)", agent: "Supplier Risk", risk: "high", status: "escalated", age: "1.8 hrs" },
    { action: "PO $28,400 for Supplier #084 (new vendor)", agent: "Sourcing Agent", risk: "medium", status: "pending", age: "23 min", value: "$28,400" },
    { action: "Emergency RFQ to 4 alternate suppliers", agent: "Sourcing Agent", risk: "high", status: "pending", age: "42 min" },
    { action: "Contract extension Supplier #042 (6 months)", agent: "Contract Bot", risk: "low", status: "approved", age: "4.2 hrs", value: "$180,000" },
  ],
  finance: [
    { action: "Cost variance $240K (raw materials Q3 report)", agent: "Finance Analyst", risk: "medium", status: "pending", age: "2.4 hrs", value: "$240,000" },
    { action: "Budget reallocation $65K (Engineering to Sales)", agent: "Cost Controller", risk: "high", status: "escalated", age: "4.1 hrs", value: "$65,000" },
    { action: "FIN-001 exception override (materiality threshold)", agent: "Audit Agent", risk: "medium", status: "approved", age: "6.2 hrs" },
  ],
  revenue: [
    { action: "Discount 22% for APAC enterprise deal ($180K)", agent: "Deal Closer AI", risk: "high", status: "pending", age: "1.8 hrs", value: "$180,000" },
    { action: "CRM bulk export for churn risk accounts", agent: "Customer Intel", risk: "medium", status: "pending", age: "2.6 hrs" },
    { action: "APAC pipeline intervention (3 accounts, 14% outreach increase)", agent: "Revenue Scout", risk: "medium", status: "approved", age: "3.1 hrs" },
    { action: "EMEA deployment budget approval ($42K)", agent: "Revenue Scout", risk: "low", status: "pending", age: "4.8 hrs", value: "$42,000" },
  ],
};

const BU_MISSIONS: Record<string, Array<{ id: string; name: string; status: "active"|"paused"|"completed"|"failed"; agents: string[]; progress: number; startDate: string; objective: string; sla: string }>> = {
  manufacturing: [
    { id: "m1", name: "Line 7 Recovery Protocol", status: "active", agents: ["Predictive Maintenance", "OEE Optimizer"], progress: 62, startDate: "Today 06:04", objective: "Restore Line 7 to full production by 14:00", sla: "On Track" },
    { id: "m2", name: "Q3 OEE Optimization Campaign", status: "active", agents: ["OEE Optimizer", "Production Planner"], progress: 78, startDate: "2 weeks ago", objective: "Raise OEE from 87.4% to 90% target by Q3 close", sla: "On Track" },
    { id: "m3", name: "Predictive Maintenance Rollout Line 8", status: "paused", agents: ["Predictive Maintenance"], progress: 35, startDate: "1 week ago", objective: "Deploy predictive maintenance to Line 8 assets", sla: "Delayed" },
    { id: "m4", name: "Scrap Reduction Initiative", status: "active", agents: ["Quality Inspector", "OEE Optimizer"], progress: 51, startDate: "3 days ago", objective: "Reduce scrap rate from 1.2% to <1% target", sla: "At Risk" },
  ],
  "supply-chain": [
    { id: "m1", name: "SKU-8841 Stockout Prevention", status: "active", agents: ["Inventory Optimizer", "Route Optimizer"], progress: 44, startDate: "Today 06:13", objective: "Prevent WH-3 stockout within 11-day window", sla: "Critical" },
    { id: "m2", name: "APAC Demand Model Retraining", status: "active", agents: ["Demand Planner"], progress: 29, startDate: "Today 05:42", objective: "Retrain APAC forecast model — reduce 18% variance", sla: "On Track" },
    { id: "m3", name: "Carrier Diversification Program", status: "active", agents: ["Route Optimizer", "Inventory Optimizer"], progress: 66, startDate: "1 week ago", objective: "Reduce dependency on Carrier B across APAC lane", sla: "On Track" },
  ],
  procurement: [
    { id: "m1", name: "Tier-1 Supplier Continuity Response", status: "active", agents: ["Supplier Risk", "Sourcing Agent"], progress: 38, startDate: "Today 05:22", objective: "Activate alternate suppliers for 3 at-risk Tier-1 vendors", sla: "Critical" },
    { id: "m2", name: "PO Backlog Clearance", status: "active", agents: ["Contract Bot"], progress: 18, startDate: "Today", objective: "Clear 29 pending POs — resolve 4 SLA breaches", sla: "At Risk" },
    { id: "m3", name: "Supplier Consolidation Program", status: "paused", agents: ["Sourcing Agent", "Supplier Risk"], progress: 54, startDate: "3 weeks ago", objective: "Consolidate from 84 to 60 active suppliers", sla: "On Track" },
  ],
  finance: [
    { id: "m1", name: "Q3 Financial Close Sprint", status: "active", agents: ["Finance Analyst", "Audit Agent"], progress: 87, startDate: "3 days ago", objective: "Complete Q3 close within 3.0-day target", sla: "On Track" },
    { id: "m2", name: "Cost-per-Unit Reduction Program", status: "active", agents: ["Cost Controller", "Finance Analyst"], progress: 42, startDate: "2 weeks ago", objective: "Reduce CPU from $18.40 to $17.00 target by Q4", sla: "At Risk" },
    { id: "m3", name: "SOX Compliance Automation", status: "active", agents: ["Audit Agent"], progress: 71, startDate: "1 month ago", objective: "Automate 90% of SOX compliance checks", sla: "On Track" },
  ],
  revenue: [
    { id: "m1", name: "APAC Pipeline Recovery", status: "active", agents: ["Revenue Scout", "Customer Intel"], progress: 22, startDate: "Today 06:11", objective: "Reverse -11% conversion trend in APAC pipeline", sla: "Critical" },
    { id: "m2", name: "EMEA Market Expansion", status: "active", agents: ["Revenue Scout"], progress: 48, startDate: "2 weeks ago", objective: "Deploy Revenue Scout to EMEA — initial pipeline coverage", sla: "On Track" },
    { id: "m3", name: "Enterprise Account Churn Prevention", status: "active", agents: ["Customer Intel", "Deal Closer AI"], progress: 34, startDate: "1 week ago", objective: "Mitigate churn risk for 4 APAC enterprise accounts", sla: "At Risk" },
    { id: "m4", name: "Q3 Forecast Accuracy Recovery", status: "active", agents: ["Forecast Agent"], progress: 58, startDate: "3 days ago", objective: "Raise forecast accuracy from 88% to 92% target", sla: "On Track" },
  ],
};

const BU_POLICIES: Record<string, Array<{ id: string; title: string; type: string; status: "active"|"under-review"|"draft"; scope: string; version: string; lastUpdated: string; compliance: number }>> = {
  manufacturing: [
    { id: "p1", title: "Emergency Work Order Authorization", type: "Operational", status: "active", scope: "All Production Lines", version: "v3.1", lastUpdated: "2 weeks ago", compliance: 99 },
    { id: "p2", title: "Asset Criticality Threshold Policy", type: "Maintenance", status: "active", scope: "Manufacturing", version: "v2.4", lastUpdated: "1 month ago", compliance: 98 },
    { id: "p3", title: "Scrap & Rework Authorization Matrix", type: "Quality", status: "active", scope: "Quality Control", version: "v1.8", lastUpdated: "3 weeks ago", compliance: 97 },
    { id: "p4", title: "OEE Alarm Escalation Protocol", type: "Operations", status: "under-review", scope: "Line Monitoring", version: "v2.0", lastUpdated: "1 week ago", compliance: 94 },
    { id: "p5", title: "Production Schedule Override Rules", type: "Scheduling", status: "active", scope: "Planning", version: "v4.2", lastUpdated: "5 days ago", compliance: 100 },
  ],
  "supply-chain": [
    { id: "p1", title: "Safety Stock Replenishment Policy", type: "Inventory", status: "active", scope: "All Warehouses", version: "v2.2", lastUpdated: "1 week ago", compliance: 96 },
    { id: "p2", title: "Demand Plan Variance Threshold", type: "Planning", status: "active", scope: "Demand Planning", version: "v1.6", lastUpdated: "2 weeks ago", compliance: 91 },
    { id: "p3", title: "Emergency Reorder Authorization", type: "Procurement", status: "active", scope: "WH Operations", version: "v3.0", lastUpdated: "4 days ago", compliance: 98 },
    { id: "p4", title: "Carrier Selection & Override Rules", type: "Logistics", status: "under-review", scope: "Transportation", version: "v1.4", lastUpdated: "3 days ago", compliance: 89 },
  ],
  procurement: [
    { id: "p1", title: "Supplier Risk Activation Protocol", type: "Risk", status: "active", scope: "All Suppliers", version: "v4.1", lastUpdated: "3 days ago", compliance: 97 },
    { id: "p2", title: "PO Approval Threshold Matrix", type: "Approval", status: "active", scope: "Procurement", version: "v3.4", lastUpdated: "1 week ago", compliance: 95 },
    { id: "p3", title: "New Vendor Qualification Requirements", type: "Compliance", status: "active", scope: "Sourcing", version: "v2.1", lastUpdated: "2 weeks ago", compliance: 88 },
    { id: "p4", title: "Contract Renewal Trigger Policy", type: "Contract", status: "under-review", scope: "Contract Mgmt", version: "v1.9", lastUpdated: "1 day ago", compliance: 92 },
    { id: "p5", title: "Emergency RFQ Authorization", type: "Sourcing", status: "active", scope: "Strategic Sourcing", version: "v2.8", lastUpdated: "1 week ago", compliance: 99 },
  ],
  finance: [
    { id: "p1", title: "Budget Variance Materiality Threshold (FIN-001)", type: "Compliance", status: "active", scope: "All Cost Centers", version: "v5.2", lastUpdated: "2 weeks ago", compliance: 100 },
    { id: "p2", title: "Month-end Close Sequence Policy", type: "Process", status: "active", scope: "Finance", version: "v8.0", lastUpdated: "1 month ago", compliance: 99 },
    { id: "p3", title: "Cost Center Reallocation Authorization", type: "Budget", status: "active", scope: "Finance Directors", version: "v2.4", lastUpdated: "3 weeks ago", compliance: 97 },
    { id: "p4", title: "Audit Exception Escalation Protocol", type: "Audit", status: "active", scope: "SOX Controls", version: "v3.1", lastUpdated: "1 week ago", compliance: 100 },
    { id: "p5", title: "AI Forecast Confidence Threshold", type: "AI Governance", status: "under-review", scope: "FP&A", version: "v1.2", lastUpdated: "2 days ago", compliance: 94 },
  ],
  revenue: [
    { id: "p1", title: "Discount Authorization Matrix (by deal size)", type: "Sales", status: "active", scope: "All Sales Reps", version: "v6.1", lastUpdated: "1 week ago", compliance: 96 },
    { id: "p2", title: "Pipeline Stage Transition Requirements", type: "CRM", status: "active", scope: "CRM", version: "v3.4", lastUpdated: "2 weeks ago", compliance: 91 },
    { id: "p3", title: "Churn Risk Intervention Threshold", type: "Customer", status: "active", scope: "Customer Success", version: "v2.0", lastUpdated: "3 days ago", compliance: 98 },
    { id: "p4", title: "EMEA Expansion Approval Protocol", type: "Strategy", status: "under-review", scope: "VP Sales", version: "v1.1", lastUpdated: "1 day ago", compliance: 85 },
  ],
};

const BU_SYSTEMS: Record<string, Array<{ name: string; status: "healthy"|"degraded"|"down"; uptime: string; lastSync: string }>> = {
  manufacturing: [
    { name: "ERP (SAP)", status: "healthy", uptime: "99.8%", lastSync: "2 min ago" },
    { name: "MES", status: "healthy", uptime: "99.4%", lastSync: "30 sec ago" },
    { name: "SCADA (Line 7)", status: "degraded", uptime: "97.2%", lastSync: "4.2 min ago" },
    { name: "CMMS", status: "healthy", uptime: "99.9%", lastSync: "1 min ago" },
    { name: "IoT Sensors", status: "healthy", uptime: "98.6%", lastSync: "10 sec ago" },
  ],
  "supply-chain": [
    { name: "WMS", status: "degraded", uptime: "96.8%", lastSync: "4.2 min ago" },
    { name: "ERP (Oracle)", status: "healthy", uptime: "99.6%", lastSync: "1 min ago" },
    { name: "TMS", status: "healthy", uptime: "99.1%", lastSync: "3 min ago" },
    { name: "Carrier API", status: "degraded", uptime: "94.2%", lastSync: "8 min ago" },
  ],
  procurement: [
    { name: "ERP / Procurement Module", status: "healthy", uptime: "99.3%", lastSync: "2 min ago" },
    { name: "Supplier Portal", status: "healthy", uptime: "98.7%", lastSync: "5 min ago" },
    { name: "Contract Management System", status: "degraded", uptime: "95.1%", lastSync: "12 min ago" },
    { name: "Risk Intelligence Feed", status: "healthy", uptime: "99.9%", lastSync: "30 sec ago" },
  ],
  finance: [
    { name: "ERP (SAP FI)", status: "healthy", uptime: "99.9%", lastSync: "1 min ago" },
    { name: "FP&A Platform", status: "healthy", uptime: "99.6%", lastSync: "3 min ago" },
    { name: "Audit Management", status: "healthy", uptime: "99.4%", lastSync: "5 min ago" },
    { name: "Banking Integration", status: "healthy", uptime: "100%", lastSync: "2 min ago" },
  ],
  revenue: [
    { name: "CRM (Salesforce)", status: "healthy", uptime: "99.7%", lastSync: "30 sec ago" },
    { name: "Revenue Intelligence Platform", status: "healthy", uptime: "99.5%", lastSync: "1 min ago" },
    { name: "Forecast Engine", status: "degraded", uptime: "97.8%", lastSync: "6 min ago" },
    { name: "Customer Data Platform", status: "healthy", uptime: "99.9%", lastSync: "1 min ago" },
  ],
};

const BU_ANALYTICS: Record<string, { eeiTrend: number[]; healthTrend: number[]; automationTrend: number[]; agentCost: number[]; labels: string[] }> = {
  manufacturing: {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    eeiTrend: [82, 83, 84, 83, 85, 86, 87, 88],
    healthTrend: [86, 87, 88, 87, 89, 90, 91, 91],
    automationTrend: [78, 80, 81, 82, 83, 84, 86, 87],
    agentCost: [128, 132, 138, 141, 144, 146, 147, 148],
  },
  "supply-chain": {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    eeiTrend: [78, 77, 76, 75, 74, 74, 76, 76],
    healthTrend: [84, 83, 82, 81, 80, 79, 80, 79],
    automationTrend: [58, 59, 60, 61, 62, 63, 63, 64],
    agentCost: [104, 108, 110, 112, 112, 112, 112, 112],
  },
  procurement: {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    eeiTrend: [76, 75, 74, 74, 73, 73, 73, 73],
    healthTrend: [82, 81, 80, 79, 78, 77, 78, 77],
    automationTrend: [48, 49, 50, 50, 51, 52, 52, 52],
    agentCost: [78, 80, 82, 83, 84, 84, 84, 84],
  },
  finance: {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    eeiTrend: [82, 83, 84, 85, 85, 86, 87, 87],
    healthTrend: [88, 89, 90, 91, 91, 92, 92, 92],
    automationTrend: [82, 83, 84, 85, 86, 87, 87, 88],
    agentCost: [62, 64, 65, 66, 67, 68, 68, 68],
  },
  revenue: {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    eeiTrend: [80, 81, 82, 82, 83, 83, 84, 83],
    healthTrend: [86, 87, 87, 88, 88, 88, 87, 87],
    automationTrend: [72, 73, 74, 75, 76, 77, 78, 78],
    agentCost: [108, 112, 114, 116, 117, 118, 118, 118],
  },
};

// ─── Small helpers ─────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", {
      "bg-emerald-500": status === "ok" || status === "active" || status === "done" || status === "resolved",
      "bg-amber-500 animate-pulse": status === "warn" || status === "watch" || status === "in-progress" || status === "mitigating",
      "bg-red-500 animate-pulse": status === "crit" || status === "critical" || status === "blocked",
      "bg-blue-400": status === "open",
    })} />
  );
}

function HealthBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-emerald-500" : value >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1 bg-border rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

function MetricBadge({ value, label, color, onClick }: { value: string; label: string; color?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn("bg-muted/30 border border-border/40 rounded-sm px-3 py-2", onClick && "cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors")}
    >
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</div>
      <div className={cn("text-sm font-bold font-mono", color || "text-foreground")}>{value}</div>
    </div>
  );
}

// A single big number — used for Missions/Workflows/Approvals, which are
// deliberately NOT full sections anymore, just a count with a link out to
// the real page that owns that content.
function CountCard({ value, label, icon: Icon, color, onClick }: { value: string | number; label: string; icon: React.ElementType; color?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn("bg-white border border-border rounded-sm p-3 shadow-sm text-left flex items-center gap-3", onClick && "hover:border-primary/40 transition-colors")}
    >
      <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center shrink-0 bg-muted/40", color)}>
        <Icon size={14} />
      </div>
      <div>
        <div className="text-lg font-bold font-mono tabular-nums text-foreground leading-none">{value}</div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</div>
      </div>
    </button>
  );
}

function TrendChart({ data, labels, color, max }: { data: number[]; labels: string[]; color: string; max: number }) {
  const maxVal = max || Math.max(...data) + 5;
  return (
    <div className="flex items-end gap-1 h-14">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className={cn("w-full rounded-sm transition-all", color, i === data.length - 1 ? "opacity-100" : "opacity-50")}
            style={{ height: `${Math.max(4, (v / maxVal) * 56)}px` }}
          />
          <div className="text-[7px] text-muted-foreground">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

const riskSeverityStyle: Record<string, string> = {
  critical: "border-red-200 bg-red-50/30",
  high: "border-amber-200 bg-amber-50/20",
  medium: "border-border bg-white",
  low: "border-border bg-white",
};

const timelineTypeStyle: Record<string, { dot: string; label: string }> = {
  agent: { dot: "bg-primary", label: "text-primary" },
  human: { dot: "bg-emerald-500", label: "text-emerald-700" },
  alert: { dot: "bg-red-500 animate-pulse", label: "text-red-600" },
  system: { dot: "bg-muted-foreground", label: "text-muted-foreground" },
};

// ─── Main Page ─────────────────────────────────────────────────
// One continuously scrollable page (same idea as the CXO Executive Command
// redesign) instead of 16 separate tabs — nothing here requires clicking
// into a different view to see it. Sections that duplicated the real
// SOP Library / Knowledge / Documents / full Agent Inventory pages were
// removed outright (not the real pages, just the redundant embeds here);
// Missions, Workflows, and Approvals were too small to earn a whole section
// so they're just count cards linking out to their real home page.

export default function BusinessUnitDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { role, currentBuId } = useAppContext();

  const healthRef = useRef<HTMLDivElement>(null);
  const impactRef = useRef<HTMLDivElement>(null);
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ABU Head is scoped to his own ABU — block direct-URL access to another ABU's detail page.
  if (role === "abu_head" && id !== currentBuId) {
    return <Redirect to="/business-units" />;
  }

  const bu = BU_LIST.find((b) => b.id === id);
  if (!bu) {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FA]">
        <HeaderBar moduleName="BUSINESS UNIT" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Business unit not found.{" "}
          <button className="ml-2 text-primary underline" onClick={() => navigate("/business-units")}>Back to Business Units</button>
        </div>
      </div>
    );
  }

  const buAgents = MFG_AGENTS.filter((a) => a.bu === id);
  const buSops = SOP_CATALOG.filter((s) => s.owner === bu.name);
  const intel = BU_INTELLIGENCE[id!] || BU_INTELLIGENCE.manufacturing;
  const timeline = BU_TIMELINE[id!] || BU_TIMELINE.manufacturing;
  const risks = BU_RISKS[id!] || BU_RISKS.manufacturing;
  const approvals = BU_APPROVALS[id!] || BU_APPROVALS.manufacturing;
  const missions = BU_MISSIONS[id!] || BU_MISSIONS.manufacturing;
  const policies = BU_POLICIES[id!] || BU_POLICIES.manufacturing;
  const systems = BU_SYSTEMS[id!] || BU_SYSTEMS.manufacturing;
  const analytics = BU_ANALYTICS[id!] || BU_ANALYTICS.manufacturing;
  const buAnomalies = ANOMALIES.filter((a) => a.buId === id);
  const openTasksCount = 0; // per-task table removed — see My Work for the live, role-scoped task list

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName={`${bu.name.toUpperCase()} INTELLIGENCE`}
        metrics={[
          { label: "EEI SCORE", value: bu.eei },
          { label: "UNIT HEALTH", value: `${bu.health}%` },
          { label: "AGENTS", value: bu.agents },
          { label: "AUTOMATION", value: `${bu.automationPct}%` },
        ]}
      />

      {/* BU Hero */}
      <div className="px-6 pt-4 pb-0">
        <div className="bg-white border border-border rounded-sm shadow-sm px-5 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => navigate("/business-units")} className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">← Business Units</button>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xl font-bold tracking-tight text-foreground">{bu.name} Intelligence</span>
              <span className={cn("text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm border", {
                "text-emerald-700 bg-emerald-50 border-emerald-200": bu.risk === "low",
                "text-amber-700 bg-amber-50 border-amber-200": bu.risk === "medium",
                "text-red-700 bg-red-50 border-red-200": bu.risk === "high",
              })}>
                {bu.risk} risk
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {bu.cost} cost · {bu.workflows} workflows · EEI contrib {bu.eeiContrib} · ROI {bu.roi}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/kpi-studio")} className="text-right hover:opacity-80 transition-opacity">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">KPIs</div>
              <div className="text-sm font-bold font-mono text-foreground">Open</div>
            </button>
            <button onClick={() => scrollTo(healthRef)} className="text-right hover:opacity-80 transition-opacity">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Health</div>
              <div className={cn("text-2xl font-bold font-mono tabular-nums",
                bu.health >= 85 ? "text-emerald-600" : bu.health >= 70 ? "text-amber-600" : "text-red-600"
              )}>{bu.health}%</div>
            </button>
            <button onClick={() => scrollTo(impactRef)} className="text-right hover:opacity-80 transition-opacity">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">EEI</div>
              <div className="text-3xl font-bold font-mono text-primary tabular-nums">{bu.eei}</div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pt-4 pb-6 space-y-6">

        {/* ── Core stats ── */}
        <div className="grid grid-cols-6 gap-3">
          <MetricBadge value={String(bu.eei)} label="EEI Score" color="text-primary" />
          <MetricBadge value={`${bu.health}%`} label="Unit Health" color={bu.health >= 85 ? "text-emerald-600" : "text-amber-600"} />
          <MetricBadge value={String(bu.agents)} label="AI Agents" color="text-primary" />
          <MetricBadge value={bu.revenueProtected} label="Rev. Protected" color="text-emerald-600" />
          <MetricBadge value={bu.costSaved} label="Cost Saved" />
          <MetricBadge value={`${bu.automationPct}%`} label="Automation" color="text-primary" />
        </div>

        {/* ── Ops counts — Missions/Workflows/Approvals are just a number
             each, linking out to the real page instead of embedding a list ── */}
        <div className="grid grid-cols-4 gap-3">
          <CountCard value={missions.filter(m => m.status === "active").length} label="Active Missions" icon={Target} color="text-primary" onClick={() => navigate("/workflow-studio")} />
          <CountCard value={bu.workflows} label="Workflows" icon={Workflow} color="text-violet-600" onClick={() => navigate("/workflow-studio")} />
          <CountCard value={approvals.filter(a => a.status === "pending").length} label="Pending Approvals" icon={ClipboardCheck} color="text-amber-600" onClick={() => navigate("/approvals")} />
          <CountCard value={openTasksCount || "—"} label="Open Tasks" icon={CheckCircle2} color="text-blue-600" onClick={() => navigate("/my-work")} />
        </div>

        {/* ── Anomalies + AI Workforce + Recent Activity ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
              <AlertTriangle size={10} />Active Anomalies
            </div>
            {buAnomalies.length === 0 ? (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                <CheckCircle2 size={10} />All systems nominal
              </div>
            ) : buAnomalies.map((a) => (
              <button key={a.id} onClick={() => navigate(`/incident/${a.id}`)}
                className={cn("w-full border-l-2 pl-3 py-2 mb-2 last:mb-0 rounded-r-sm text-left hover:opacity-80 transition-opacity", {
                  "border-red-500 bg-red-50/40": a.severity === "critical",
                  "border-amber-500 bg-amber-50/40": a.severity === "warning",
                  "border-blue-400 bg-blue-50/40": a.severity === "watch",
                })}>
                <div className="text-[10px] font-semibold text-foreground leading-snug mb-0.5">{a.title}</div>
                <div className="text-[9px] text-muted-foreground">{a.impact}</div>
              </button>
            ))}
          </div>

          <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
              <Bot size={10} />AI Workforce
            </div>
            <div className="space-y-2">
              {bu.employees.map((emp) => (
                <button key={emp.name}
                  onClick={() => { const agent = MFG_AGENTS.find(a => a.name === emp.name || a.name.startsWith(emp.name.split(" ")[0])); if (agent) navigate(`/agents/${agent.id}`); }}
                  className="w-full flex items-center gap-2 py-1.5 px-2 rounded-sm hover:bg-muted/40 transition-colors text-left">
                  <StatusDot status={emp.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-foreground truncate">{emp.name}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{emp.role}</div>
                  </div>
                  <ChevronRight size={10} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Recent Activity</div>
            <div className="space-y-2">
              {timeline.slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-mono text-[9px] text-muted-foreground shrink-0 w-10 mt-0.5">{e.time}</span>
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", timelineTypeStyle[e.type].dot)} />
                  <div className="flex-1">
                    <span className={cn("text-[10px] font-semibold mr-1", timelineTypeStyle[e.type].label)}>{e.actor}</span>
                    <span className="text-[10px] text-foreground">{e.event}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Business Impact ── */}
        <div ref={impactRef} className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Business Impact</h2>
          <div className="grid grid-cols-4 gap-3">
            <MetricBadge value={bu.roi} label="ROI" color="text-primary" />
            <MetricBadge value={bu.downtimePrevented} label="Downtime Prevented" color="text-emerald-600" />
            <MetricBadge value={`+${bu.productivityImprovement}%`} label="Productivity Gain" color="text-emerald-600" />
            <MetricBadge value={`+${bu.eeiContribution}`} label="EEI Contribution" color="text-primary" />
          </div>

          <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Contribution to Enterprise Metrics</div>
            <div className="space-y-3">
              {[
                { label: "Revenue Protected", bu: bu.revenueProtected, enterprise: ENTERPRISE_METRICS.revenueProtected, pct: Math.round((bu.hoursSaved / ENTERPRISE_METRICS.hoursSaved) * 100) },
                { label: "Cost Saved", bu: bu.costSaved, enterprise: ENTERPRISE_METRICS.costSaved, pct: Math.round((bu.automationPct / ENTERPRISE_METRICS.automationPct) * 100) },
                { label: "Hours Saved", bu: `${bu.hoursSaved.toLocaleString()} hrs`, enterprise: `${ENTERPRISE_METRICS.hoursSaved.toLocaleString()} hrs`, pct: Math.round((bu.hoursSaved / ENTERPRISE_METRICS.hoursSaved) * 100) },
                { label: "EEI Contribution", bu: `+${bu.eeiContribution}`, enterprise: `+${ENTERPRISE_METRICS.eeiContribution}`, pct: Math.round((bu.eeiContribution / ENTERPRISE_METRICS.eeiContribution) * 100) },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 text-[9px] uppercase tracking-widest text-muted-foreground shrink-0">{m.label}</div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${m.pct}%` }} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-primary w-8 shrink-0">{m.pct}%</span>
                  </div>
                  <div className="text-[9px] font-mono font-bold text-foreground w-20 text-right shrink-0">{m.bu}</div>
                  <div className="text-[9px] text-muted-foreground shrink-0">/ {m.enterprise}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {intel.forecast.map((f, i) => (
              <button key={i} onClick={() => navigate("/kpi-studio")}
                className="bg-white border border-border rounded-sm p-4 shadow-sm text-left hover:border-primary/40 transition-colors">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">{f.metric}</div>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-[9px] text-muted-foreground">Current</div>
                    <div className="text-sm font-bold font-mono text-foreground">{f.current}</div>
                  </div>
                  <ArrowRight size={12} className="text-muted-foreground mb-1" />
                  <div>
                    <div className="text-[9px] text-muted-foreground">Predicted</div>
                    <div className={cn("text-sm font-bold font-mono", f.dir === "up" ? "text-emerald-600" : "text-blue-600")}>{f.predicted}</div>
                  </div>
                  {f.dir === "up" ? <TrendingUp size={14} className="text-emerald-500 mb-1" /> : <TrendingDown size={14} className="text-blue-500 mb-1" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Department Health ── */}
        <div ref={healthRef} className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Department Health</h2>
          <div className="grid grid-cols-4 gap-3">
            <MetricBadge value={`${bu.health}%`} label="Overall Health" color={bu.health >= 85 ? "text-emerald-600" : "text-amber-600"} />
            <MetricBadge value={String(buAgents.filter(a => a.status === "active").length)} label="Agents Healthy" color="text-emerald-600" />
            <MetricBadge value={String(systems.filter(s => s.status === "healthy").length)} label="Systems Online" color="text-emerald-600" />
            <MetricBadge value={String(systems.filter(s => s.status !== "healthy").length)} label="Systems Degraded" color="text-amber-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
                <Bot size={10} />Agent Health
              </div>
              <div className="space-y-3">
                {buAgents.length > 0 ? buAgents.map(agent => (
                  <button key={agent.id} onClick={() => navigate(`/agents/${agent.id}`)} className="w-full text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <StatusDot status={agent.status} />
                        <span className="text-[10px] font-semibold text-foreground">{agent.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-foreground">{agent.health}/100</span>
                    </div>
                    <HealthBar value={agent.health} />
                  </button>
                )) : bu.employees.map((emp, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusDot status={emp.status} />
                      <span className="text-[10px] font-semibold">{emp.name}</span>
                    </div>
                    <HealthBar value={emp.status === "active" ? 92 : 74} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
                <Layers size={10} />Connected Systems
              </div>
              <div className="space-y-2">
                {systems.map((sys, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", {
                        "bg-emerald-500": sys.status === "healthy",
                        "bg-amber-500 animate-pulse": sys.status === "degraded",
                        "bg-red-500 animate-pulse": sys.status === "down",
                      })} />
                      <span className="text-[10px] font-semibold text-foreground">{sys.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className={cn("text-[10px] font-mono font-bold", sys.uptime === "100%" ? "text-emerald-600" : sys.status === "degraded" ? "text-amber-600" : "text-foreground")}>{sys.uptime}</span>
                      <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", {
                        "text-emerald-700 bg-emerald-50 border-emerald-200": sys.status === "healthy",
                        "text-amber-700 bg-amber-50 border-amber-200": sys.status === "degraded",
                        "text-red-700 bg-red-50 border-red-200": sys.status === "down",
                      })}>{sys.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
              <Gauge size={10} />Health Scorecard
            </div>
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "AI Workforce", value: bu.health, max: 100, color: "bg-primary" },
                { label: "Automation Rate", value: bu.automationPct, max: 100, color: "bg-emerald-500" },
                { label: "Policy Compliance", value: policies.reduce((s, p) => s + p.compliance, 0) / policies.length, max: 100, color: "bg-blue-500" },
                { label: "SOP Coverage", value: buSops.length > 0 ? 84 : 20, max: 100, color: "bg-violet-500" },
                { label: "Risk Mitigation", value: Math.round((risks.filter(r => r.status !== "open").length / risks.length) * 100), max: 100, color: "bg-amber-500" },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">{m.label}</div>
                  <div className="relative w-16 h-16 mx-auto mb-1">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                        strokeDasharray={`${(m.value / m.max) * 100} 100`}
                        strokeLinecap="round"
                        className={m.color.replace("bg-", "text-")} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold tabular-nums">{Math.round(m.value)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Risks ── */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Risks</h2>
          <div className="grid grid-cols-4 gap-3">
            <MetricBadge value={String(risks.filter(r => r.severity === "critical").length)} label="Critical" color="text-red-600" />
            <MetricBadge value={String(risks.filter(r => r.severity === "high").length)} label="High" color="text-amber-600" />
            <MetricBadge value={String(risks.filter(r => r.severity === "medium").length)} label="Medium" color="text-blue-600" />
            <MetricBadge value={String(risks.filter(r => r.status === "resolved").length)} label="Resolved" color="text-emerald-600" />
          </div>
          <div className="space-y-2">
            {risks.map((risk, i) => (
              <div key={i} className={cn("bg-white border rounded-sm p-4 shadow-sm", riskSeverityStyle[risk.severity])}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-7 h-7 rounded-sm flex items-center justify-center shrink-0 mt-0.5", {
                      "bg-red-100": risk.severity === "critical",
                      "bg-amber-100": risk.severity === "high",
                      "bg-blue-50": risk.severity === "medium",
                      "bg-muted/40": risk.severity === "low",
                    })}>
                      <Shield size={12} className={cn({
                        "text-red-600": risk.severity === "critical",
                        "text-amber-600": risk.severity === "high",
                        "text-blue-600": risk.severity === "medium",
                        "text-muted-foreground": risk.severity === "low",
                      })} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{risk.title}</span>
                        <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", {
                          "text-red-700 bg-red-50 border-red-200": risk.severity === "critical",
                          "text-amber-700 bg-amber-50 border-amber-200": risk.severity === "high",
                          "text-blue-700 bg-blue-50 border-blue-200": risk.severity === "medium",
                        })}>{risk.severity}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">Owner: {risk.owner} · Type: {risk.type} · Impact: {risk.impact}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", {
                      "text-emerald-700 bg-emerald-50 border-emerald-200": risk.status === "resolved",
                      "text-amber-700 bg-amber-50 border-amber-200": risk.status === "mitigating",
                      "text-blue-700 bg-blue-50 border-blue-200": risk.status === "open",
                    })}>{risk.status}</span>
                    <button onClick={() => toast({ description: `Risk mitigation plan for: ${risk.title.slice(0, 40)}` })}
                      className="text-[9px] uppercase tracking-widest text-primary font-bold border border-primary/20 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">
                      Mitigate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Policies ── */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Policies</h2>
          <div className="grid grid-cols-4 gap-3">
            <MetricBadge value={String(policies.length)} label="Total Policies" color="text-primary" />
            <MetricBadge value={String(policies.filter(p => p.status === "active").length)} label="Active" color="text-emerald-600" />
            <MetricBadge value={String(policies.filter(p => p.status === "under-review").length)} label="Under Review" color="text-amber-600" />
            <MetricBadge value={`${Math.round(policies.reduce((s, p) => s + p.compliance, 0) / policies.length)}%`} label="Avg Compliance" color="text-primary" />
          </div>
          <div className="space-y-2">
            {policies.map((policy) => (
              <div key={policy.id} className={cn("bg-white border rounded-sm p-4 shadow-sm", {
                "border-border": policy.status === "active",
                "border-amber-200": policy.status === "under-review",
                "border-muted": policy.status === "draft",
              })}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-sm bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock size={12} className="text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{policy.title}</span>
                        <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", {
                          "text-emerald-700 bg-emerald-50 border-emerald-200": policy.status === "active",
                          "text-amber-700 bg-amber-50 border-amber-200": policy.status === "under-review",
                          "text-muted-foreground bg-muted/40 border-border": policy.status === "draft",
                        })}>{policy.status}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        Type: {policy.type} · Scope: {policy.scope} · {policy.version} · Updated {policy.lastUpdated}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("text-sm font-bold font-mono", policy.compliance >= 98 ? "text-emerald-600" : policy.compliance >= 90 ? "text-amber-600" : "text-red-600")}>{policy.compliance}%</span>
                    <button onClick={() => navigate("/policy-studio")}
                      className="text-[9px] uppercase tracking-widest text-primary font-bold border border-primary/20 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Recommendations</h2>
          <div className="space-y-2">
            {intel.insights.filter(i => i.type === "critical" || i.type === "warning").map((ins, i) => (
              <div key={i} className={cn("bg-white border rounded-sm p-4 shadow-sm flex gap-3", {
                "border-red-200": ins.type === "critical",
                "border-amber-200": ins.type === "warning",
              })}>
                <div className={cn("w-7 h-7 rounded-sm flex items-center justify-center shrink-0 mt-0.5", {
                  "bg-red-100": ins.type === "critical",
                  "bg-amber-100": ins.type === "warning",
                })}>
                  {ins.type === "critical" ? <XCircle size={12} className="text-red-600" /> : <AlertTriangle size={12} className="text-amber-600" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground mb-0.5">{ins.title}</div>
                  <div className="text-[10px] text-muted-foreground">{ins.detail}</div>
                </div>
              </div>
            ))}
            {intel.recommendations.map((rec, i) => (
              <div key={i} className="bg-white border border-border rounded-sm p-4 shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={10} className="text-amber-400" />
                      <div className="text-xs font-semibold text-foreground">{rec.title}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-sm">{rec.impact}</span>
                      <span className="text-[9px] text-muted-foreground">Effort: {rec.effort}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">{rec.confidence}% confidence</span>
                    </div>
                  </div>
                  <button onClick={() => toast({ title: "Executing Recommendation", description: rec.title.slice(0, 50) })}
                    className="text-[9px] uppercase tracking-widest text-white font-bold bg-primary rounded-sm px-2 py-1 hover:bg-primary/90 transition-colors flex items-center gap-1 shrink-0">
                    <Play size={8} />Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Timeline ── */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Timeline</h2>
          <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
            <div className="divide-y divide-border">
              {timeline.map((event, i) => {
                const ts = timelineTypeStyle[event.type];
                return (
                  <div key={i} className="flex items-start gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 w-10 mt-0.5">{event.time}</span>
                    <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", ts.dot)} />
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("text-[10px] font-bold", ts.label)}>{event.actor}</span>
                      </div>
                      <div className="text-[10px] text-foreground">{event.event}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Analytics ── */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Analytics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">EEI Score — 8-Week Trend</div>
              <div className="text-2xl font-bold tabular-nums font-mono text-primary mb-3">
                {analytics.eeiTrend[analytics.eeiTrend.length - 1]}
                <span className={cn("text-sm ml-2", analytics.eeiTrend[analytics.eeiTrend.length - 1] > analytics.eeiTrend[0] ? "text-emerald-500" : "text-red-500")}>
                  {analytics.eeiTrend[analytics.eeiTrend.length - 1] > analytics.eeiTrend[0] ? "▲" : "▼"} {Math.abs(analytics.eeiTrend[analytics.eeiTrend.length - 1] - analytics.eeiTrend[0])} pts
                </span>
              </div>
              <TrendChart data={analytics.eeiTrend} labels={analytics.labels} color="bg-primary" max={100} />
            </div>
            <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Automation Rate — 8-Week Trend</div>
              <div className="text-2xl font-bold tabular-nums font-mono text-violet-600 mb-3">
                {analytics.automationTrend[analytics.automationTrend.length - 1]}%
                <span className="text-sm ml-2 text-violet-500">
                  ▲ {Math.abs(analytics.automationTrend[analytics.automationTrend.length - 1] - analytics.automationTrend[0])} pts
                </span>
              </div>
              <TrendChart data={analytics.automationTrend} labels={analytics.labels} color="bg-violet-500" max={100} />
            </div>
          </div>

          <div className="bg-white border border-border rounded-sm p-4 shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Cumulative Business Impact (This Period)</div>
            <div className="grid grid-cols-6 gap-4">
              {[
                { label: "Revenue Protected", value: bu.revenueProtected, icon: DollarSign, color: "text-emerald-600" },
                { label: "Cost Saved", value: bu.costSaved, icon: Cpu, color: "text-foreground" },
                { label: "Hours Saved", value: `${bu.hoursSaved.toLocaleString()}h`, icon: Clock, color: "text-foreground" },
                { label: "Downtime Prevented", value: bu.downtimePrevented, icon: RefreshCw, color: "text-blue-600" },
                { label: "Productivity", value: `+${bu.productivityImprovement}%`, icon: TrendingUp, color: "text-emerald-600" },
                { label: "EEI Impact", value: bu.eeiContrib, icon: Gauge, color: "text-primary" },
              ].map((m, i) => (
                <div key={i} className="text-center border-r border-border/40 last:border-0 pr-4 last:pr-0">
                  <m.icon size={16} className={cn("mx-auto mb-2", m.color)} />
                  <div className={cn("text-sm font-bold font-mono mb-0.5", m.color)}>{m.value}</div>
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
