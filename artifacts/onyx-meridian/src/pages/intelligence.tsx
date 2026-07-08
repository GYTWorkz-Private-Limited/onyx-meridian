import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import {
  ArrowUp, ArrowDown, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  DollarSign, BarChart2, Users, Bot, FileText, Shield, ChevronRight,
  Play, Bookmark, UserPlus, XCircle, FlaskConical, Cpu, GitBranch,
  Target, ExternalLink, Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

export interface Recommendation {
  id: string;
  confidence: number;
  successProbability: number;
  priority: "critical" | "high" | "medium" | "low";
  liveStatus: "active" | "in_progress" | "pending_approval" | "monitoring";
  businessObjective: string;
  title: string;
  executiveSummary: string;
  rootCause: string;
  evidenceUsed: string[];
  affectedDepartments: string[];
  affectedAgents: string[];
  kpis: { name: string; current: string; target: string; projected: string; direction: "up" | "down" }[];
  financialImpact: { revenueGain?: string; costReduction?: string; riskAvoided?: string; total: string };
  operationalImpact: string;
  riskAssessment: string;
  riskLevel: "low" | "medium" | "high";
  dependencies: string[];
  recommendedActions: { step: number; action: string; owner: string; duration: string; requiresApproval: boolean }[];
  estimatedExecutionTime: string;
  requiredApprovals: string[];
  relatedSOPs: string[];
  relatedPolicies: string[];
  linkedWorkflows: string[];
  linkedMissions: string[];
  decisionLineage: { step: string; detail: string; icon: string }[];
  expectedROI: string;
  rollbackStrategy: string;
  agentWorkflow: string;
  agentName: string;
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "REC-2026-001",
    confidence: 94,
    successProbability: 91,
    priority: "critical",
    liveStatus: "active",
    businessObjective: "Manufacturing Continuity & Downtime Prevention",
    title: "Execute Predictive Bearing Replacement on Production Line 7 — MX-0441",
    executiveSummary: "Manufacturing Intelligence has detected a high-confidence OEE deviation on Line 7 consistent with imminent bearing failure in Roller Assembly Unit MX-0441. Vibration harmonic signatures have exceeded the 2.4σ threshold for the past 72 hours, and thermal imaging confirms progressive heat concentration in the left-side bearing race. Immediate replacement within the next production changeover window (before the 06:00 shift on Jun 28) will prevent an estimated $480K in unplanned downtime and avoid a cascading quality failure affecting Lines 6 and 8.",
    rootCause: "MFRS-7 vibration sensor array recorded a 340Hz harmonic spike at T-72h, T-48h, and T-18h intervals — a pattern consistent with bearing raceway fatigue documented in 14 prior failure cases across the fleet. OEE dropped from 91.2% to 87.4% over the same period. Thermal camera TH-0041 shows a 12°C delta between the left and right bearing races, exceeding the 8°C alert threshold. The pattern is statistically indistinguishable from the Q4-2025 Line 3 bearing failure that caused 18 hours of downtime.",
    evidenceUsed: [
      "MFRS-7 vibration harmonics (72h): 340Hz spike at 2.4σ",
      "Thermal camera TH-0041: 12°C bearing race delta",
      "OEE trend: 91.2% → 87.4% (72h window)",
      "Fleet failure library: 14 matching prior cases",
      "Lubrication log: Last service 87 days ago (threshold: 90 days)",
      "Q4-2025 Line 3 bearing failure post-mortem (88% pattern match)",
    ],
    affectedDepartments: ["Manufacturing — Line 7", "Quality Control", "Maintenance Operations"],
    affectedAgents: ["OEE Optimizer", "Predictive Maintenance AI", "Line Monitor 7", "Quality Gate AI"],
    kpis: [
      { name: "OEE Line 7", current: "87.4%", target: "91.0%", projected: "92.1%", direction: "up" },
      { name: "Unplanned Downtime Risk", current: "$480K", target: "$0", projected: "$0", direction: "down" },
      { name: "Throughput (Line 7)", current: "2,210 u/hr", target: "2,400 u/hr", projected: "2,450 u/hr", direction: "up" },
      { name: "Scrap Rate", current: "1.8%", target: "1.2%", projected: "1.1%", direction: "down" },
    ],
    financialImpact: { riskAvoided: "$480K unplanned downtime", costReduction: "$24K bearing replacement cost", total: "Net: $456K risk-adjusted savings" },
    operationalImpact: "Replacement requires a 4-hour planned maintenance window during shift changeover. Lines 6 and 8 can sustain target throughput during the window. Quality hold on Line 7 output from the past 18 hours is recommended pending post-replacement verification.",
    riskAssessment: "Without intervention, bearing failure probability exceeds 78% within 36 hours. A catastrophic failure would cause 14–22 hours of unplanned downtime, disrupt Lines 6 and 8 via shared conveyor infrastructure, and trigger a mandatory quality hold on 4,200 units currently in buffer.",
    riskLevel: "high",
    dependencies: ["Bearing SKF 6314/C3 in stock (Qty: 4 confirmed)", "Maintenance crew availability — Jun 27 23:00 changeover", "Quality Inspector sign-off post-replacement", "Line 6 and 8 capacity to absorb Line 7 demand during window"],
    recommendedActions: [
      { step: 1, action: "Issue Maintenance Work Order MX-0441 and confirm bearing stock (SKF 6314/C3 × 4)", owner: "Predictive Maintenance AI", duration: "30 min", requiresApproval: false },
      { step: 2, action: "Schedule 4-hour planned maintenance window for Jun 27 23:00 shift changeover", owner: "Operations Manager", duration: "1 hr", requiresApproval: true },
      { step: 3, action: "Activate quality hold on Line 7 output buffer (last 18 hours of production)", owner: "Quality Gate AI", duration: "15 min", requiresApproval: true },
      { step: 4, action: "Execute bearing replacement on MX-0441 — left and right race", owner: "Maintenance Crew + Predictive Maintenance AI", duration: "3 hrs", requiresApproval: false },
      { step: 5, action: "Run post-replacement OEE verification cycle (min 2 production runs)", owner: "OEE Optimizer + Line Monitor 7", duration: "45 min", requiresApproval: false },
      { step: 6, action: "Release quality hold pending quality gate pass; resume normal production", owner: "Quality Inspector + Quality Gate AI", duration: "30 min", requiresApproval: true },
    ],
    estimatedExecutionTime: "4–6 hours total (including 3h replacement window)",
    requiredApprovals: ["Operations Manager — maintenance window authorization", "Quality Inspector — quality hold activation and release", "Plant Director — if shift schedule change required"],
    relatedSOPs: ["SOP-MFG-0041: Predictive Maintenance Bearing Replacement Protocol", "SOP-QC-0018: Quality Hold Procedures — Line Output", "SOP-MFG-0009: OEE Recovery Verification Standard"],
    relatedPolicies: ["Manufacturing Uptime Policy (>90% OEE target)", "Planned vs Unplanned Maintenance Cost Policy", "Quality Gate Escalation Policy v2.1"],
    linkedWorkflows: ["Predictive Maintenance Execution Workflow", "Line Quality Hold Workflow"],
    linkedMissions: ["Line 7 OEE Recovery Mission", "Manufacturing Continuity Mission Q3-2026"],
    decisionLineage: [
      { step: "Signal Detection", detail: "MFRS-7 vibration at 2.4σ — 340Hz harmonic for 72h continuous", icon: "signal" },
      { step: "Pattern Matching", detail: "Fleet failure library: 88% match to Q4-2025 Line 3 failure pattern", icon: "brain" },
      { step: "Risk Quantification", detail: "Downtime probability 78% / $480K impact model applied", icon: "calc" },
      { step: "SOP Validation", detail: "SOP-MFG-0041 confirmed applicable; bearing stock verified", icon: "doc" },
      { step: "Recommendation Surfaced", detail: "94% confidence threshold exceeded — Critical priority assigned", icon: "check" },
    ],
    expectedROI: "$456K net (risk avoided minus replacement cost) · 92.1% OEE recovery · Zero unplanned downtime",
    rollbackStrategy: "If post-replacement OEE verification fails, isolate Line 7 and escalate to Plant Director. Quality hold remains active. Engage extended maintenance team for root cause re-analysis. Lines 6 and 8 absorb demand until Line 7 cleared.",
    agentWorkflow: "Predictive Maintenance Execution Workflow",
    agentName: "OEE Optimizer",
  },
  {
    id: "REC-2026-002",
    confidence: 88,
    successProbability: 83,
    priority: "high",
    liveStatus: "active",
    businessObjective: "Supply Chain Continuity — Q3 2026",
    title: "Activate Alternative Sourcing for 3 Flagged Tier-1 Suppliers — Q3 Continuity at Risk",
    executiveSummary: "Procurement Intelligence has flagged 3 Tier-1 suppliers (Apex Steel Components, MidWest Precision Parts, and Shenzen Bearing Co.) with risk scores exceeding the 0.78 critical threshold. Combined, these suppliers account for 41% of Line 1–5 material input. Without sourcing intervention within the next 14 days, Q3 production continuity is at high risk. The Intelligence Engine has pre-qualified 5 alternative suppliers capable of matching the required specifications and lead times. Activating dual-sourcing contracts for all three material categories will neutralize the risk at an estimated 3.2% cost premium versus single-source pricing.",
    rootCause: "Apex Steel: financial distress signals detected via supplier credit monitoring (Dun & Bradstreet score declined 18 points in 60 days). MidWest Precision: capacity constraint flagged — key customer (Tier-OEM) has increased orders by 34%, reducing available capacity for Onyx. Shenzen Bearing: geopolitical freight risk — shipping lane disruption probability 62% based on current maritime intelligence feeds.",
    evidenceUsed: [
      "Supplier risk scores: Apex 0.81, MidWest 0.79, Shenzen 0.83",
      "D&B credit: Apex -18pt decline (60 days)",
      "MidWest capacity allocation: -28% available to Onyx",
      "Maritime intelligence: 62% disruption probability (Shenzen route)",
      "5 pre-qualified alternatives identified by Procurement Intelligence AI",
      "Q3 material demand forecast: 41% dependency on flagged suppliers",
    ],
    affectedDepartments: ["Supply Chain", "Procurement", "Manufacturing — Lines 1–5", "Finance Operations"],
    affectedAgents: ["Procurement Intelligence", "Supplier Risk AI", "Inventory Optimizer", "Contract AI"],
    kpis: [
      { name: "Supplier Risk Score (avg)", current: "0.81", target: "< 0.60", projected: "0.52", direction: "down" },
      { name: "Supply Continuity Coverage", current: "59%", target: "95%", projected: "97%", direction: "up" },
      { name: "Material Cost Premium", current: "0%", target: "< 4%", projected: "3.2%", direction: "up" },
      { name: "Q3 Production at Risk", current: "$1.1M", target: "$0", projected: "$0", direction: "down" },
    ],
    financialImpact: { riskAvoided: "$1.1M Q3 supply disruption", costReduction: "$0", revenueGain: "Q3 production continuity secured", total: "Net: $1.1M risk avoided at 3.2% material cost premium (~$84K/mo)" },
    operationalImpact: "Dual-sourcing activation requires procurement contract negotiations with 2–3 alternative suppliers per category. Standard RFQ process can be accelerated using pre-qualified vendor database. Target: 3 dual-source contracts signed within 14 days.",
    riskAssessment: "If no action is taken within 14 days, there is a 71% probability of at least one material shortage event in Q3. A single-supplier failure would halt Lines 1–3 for an estimated 6–10 days, risking $1.1M in lost production output and customer delivery commitments.",
    riskLevel: "high",
    dependencies: ["Pre-qualified alternative supplier list (5 vendors confirmed)", "Procurement team capacity for accelerated RFQ", "Legal review of dual-source contract terms", "Finance approval for 3.2% cost premium"],
    recommendedActions: [
      { step: 1, action: "Distribute RFQ packages to 5 pre-qualified alternative suppliers (Procurement Intelligence to prepare)", owner: "Procurement Intelligence AI", duration: "4 hrs", requiresApproval: false },
      { step: 2, action: "Convene supplier risk review with CPO — present flagged risk scores and mitigation plan", owner: "Supply Chain Director", duration: "2 hrs", requiresApproval: true },
      { step: 3, action: "Evaluate RFQ responses and select best-fit dual-source partners per category", owner: "Procurement Team + Procurement Intelligence AI", duration: "3 days", requiresApproval: false },
      { step: 4, action: "Negotiate and execute dual-source contracts for Apex Steel, MidWest Precision, and Shenzen Bearing categories", owner: "Procurement Director + Contract AI", duration: "7 days", requiresApproval: true },
      { step: 5, action: "Update inventory safety stock thresholds to reflect dual-source coverage", owner: "Inventory Optimizer AI", duration: "1 hr", requiresApproval: false },
      { step: 6, action: "Activate continuous supplier monitoring — weekly risk score refresh for all 3 flagged suppliers", owner: "Supplier Risk AI", duration: "Ongoing", requiresApproval: false },
    ],
    estimatedExecutionTime: "14 days (contract execution) + 30 days (full dual-source operational)",
    requiredApprovals: ["CPO — risk review and mitigation plan sign-off", "Procurement Director — dual-source contract authorization", "CFO — cost premium approval (estimated $84K/mo additional spend)"],
    relatedSOPs: ["SOP-SCM-0012: Supplier Risk Escalation Protocol", "SOP-SCM-0031: Dual-Sourcing Activation Framework", "SOP-PROC-0008: Emergency RFQ Acceleration Procedure"],
    relatedPolicies: ["Supplier Concentration Risk Policy (max 40% from single vendor)", "Procurement Spend Gate Policy", "Supply Chain Business Continuity Policy v3.0"],
    linkedWorkflows: ["Supplier Risk Mitigation Workflow", "Dual-Source Contract Workflow"],
    linkedMissions: ["Q3 Supply Continuity Mission", "Procurement Risk Mitigation Mission"],
    decisionLineage: [
      { step: "Risk Score Breach", detail: "3 suppliers exceed 0.78 critical threshold simultaneously", icon: "signal" },
      { step: "Impact Analysis", detail: "41% material dependency mapped — Q3 production continuity quantified", icon: "brain" },
      { step: "Alternative Sourcing", detail: "5 pre-qualified alternatives identified from approved vendor database", icon: "search" },
      { step: "Policy Check", detail: "Supplier Concentration Risk Policy breach confirmed (>40% single-source)", icon: "doc" },
      { step: "Recommendation Surfaced", detail: "88% confidence — HIGH priority with 14-day action window", icon: "check" },
    ],
    expectedROI: "$1.1M risk avoided · Q3 production continuity secured · 3.2% material cost premium ($84K/mo incremental)",
    rollbackStrategy: "If alternative suppliers cannot meet specifications within 14 days, activate emergency inventory build (increase safety stock by 45 days) and negotiate temporary capacity extension with current suppliers while escalating to Board-level crisis management.",
    agentWorkflow: "Supplier Risk Mitigation Workflow",
    agentName: "Procurement Intelligence",
  },
  {
    id: "REC-2026-003",
    confidence: 84,
    successProbability: 79,
    priority: "high",
    liveStatus: "in_progress",
    businessObjective: "Production Quality & Yield Optimization",
    title: "Tune Quality Gate AI Thresholds on Lines 3–5 to Reduce Scrap Rate by 38%",
    executiveSummary: "Quality Control Intelligence has identified that Lines 3, 4, and 5 are generating a combined scrap rate of 2.9% — 1.7 percentage points above the enterprise target of 1.2%. Root cause analysis traced the primary driver to over-rejection at the dimensional inspection gate: the current AI threshold (±0.08mm) is tighter than the customer specification (±0.12mm), causing 62% of rejected units to be within-spec product. Relaxing the AI threshold to ±0.10mm and retraining the visual inspection model on the latest defect taxonomy will reduce scrap by an estimated 38% while maintaining full quality compliance, recovering approximately $320K per month in scrapped material value.",
    rootCause: "Quality Gate AI was calibrated in Q1-2025 against a tighter internal standard that has since been superseded by the updated customer specification (Rev 4.2, effective Feb 2026). The model has not been retrained since Q3-2025. Additionally, ambient temperature variance in the Line 3 inspection bay (±4°C daily swing) is causing thermal expansion artifacts that the model incorrectly classifies as dimensional violations. Retraining with temperature-compensated reference data and updating the tolerance threshold to ±0.10mm will resolve both issues.",
    evidenceUsed: [
      "Line 3-5 combined scrap rate: 2.9% (enterprise target: 1.2%)",
      "Rejection analysis: 62% of rejected units passed manual re-inspection",
      "Customer spec Rev 4.2 (Feb 2026): ±0.12mm tolerance vs AI threshold ±0.08mm",
      "Quality Gate AI last retrained: Q3-2025 (9 months ago)",
      "Temperature log Line 3 inspection bay: ±4°C daily variance",
      "Financial waste: $320K/mo scrapped material (within-spec units)",
    ],
    affectedDepartments: ["Manufacturing Quality", "Line Operations 3–5", "Finance (Material Cost)"],
    affectedAgents: ["Quality Gate AI", "Line Monitor 3", "Line Monitor 4", "Line Monitor 5", "OEE Optimizer"],
    kpis: [
      { name: "Combined Scrap Rate (Lines 3–5)", current: "2.9%", target: "1.2%", projected: "1.8%", direction: "down" },
      { name: "False Rejection Rate", current: "62%", target: "< 15%", projected: "12%", direction: "down" },
      { name: "Monthly Material Waste", current: "$320K", target: "< $130K", projected: "$198K", direction: "down" },
      { name: "Quality Gate Accuracy", current: "71%", target: "94%", projected: "93%", direction: "up" },
    ],
    financialImpact: { costReduction: "$122K/mo scrapped material recovery", riskAvoided: "Customer quality audit risk (next audit: Sep 2026)", total: "Est. $122K/mo ongoing · $1.46M annualized" },
    operationalImpact: "AI threshold adjustment requires a 6-hour model retraining run on the Quality Gate AI using updated defect taxonomy and temperature-compensated reference data. Lines 3–5 quality gates will operate in supervised mode during retraining validation (24–48h). No production halt required.",
    riskAssessment: "Retraining risk is low — changes are additive (relaxing threshold within-spec) and validation against historic data shows no risk of accepting out-of-spec units. The 24-48h supervised mode provides a human-in-the-loop safety net. Rollback to current thresholds is immediate if validation fails.",
    riskLevel: "low",
    dependencies: ["Updated defect taxonomy dataset (prepared by Quality Engineering)", "Temperature-compensated reference data from Line 3 sensors", "Quality Manager sign-off on updated threshold policy", "Customer spec Rev 4.2 written authorization on file"],
    recommendedActions: [
      { step: 1, action: "Retrieve and validate customer spec Rev 4.2 tolerance documentation (±0.12mm)", owner: "Quality Manager", duration: "2 hrs", requiresApproval: true },
      { step: 2, action: "Prepare temperature-compensated training dataset from Line 3 sensor logs (last 90 days)", owner: "Quality Gate AI + Data Engineer", duration: "4 hrs", requiresApproval: false },
      { step: 3, action: "Initiate Quality Gate AI retraining run with updated defect taxonomy and ±0.10mm threshold", owner: "Quality Gate AI", duration: "6 hrs", requiresApproval: true },
      { step: 4, action: "Activate supervised validation mode on Lines 3–5 (24h human-in-loop quality review)", owner: "Quality Inspector + Line Monitors 3/4/5", duration: "24 hrs", requiresApproval: false },
      { step: 5, action: "Evaluate retraining performance metrics — confirm scrap rate reduction and zero out-of-spec pass-through", owner: "Quality Manager + OEE Optimizer", duration: "4 hrs", requiresApproval: true },
      { step: 6, action: "Promote retrained model to production; update Quality Gate Policy threshold documentation", owner: "Quality Gate AI + Quality Manager", duration: "1 hr", requiresApproval: true },
    ],
    estimatedExecutionTime: "36–48 hours (including 24h supervised validation)",
    requiredApprovals: ["Quality Manager — threshold policy change authorization", "Plant Director — supervised mode activation", "Quality Manager — final model promotion sign-off"],
    relatedSOPs: ["SOP-QC-0022: AI Quality Gate Retraining Protocol", "SOP-QC-0007: Supervised Mode Activation — Quality Systems", "SOP-QC-0015: Customer Specification Change Management"],
    relatedPolicies: ["Quality Gate Accuracy Policy (>90% target)", "AI Model Retraining Policy v1.3", "Customer Specification Compliance Policy"],
    linkedWorkflows: ["Quality Gate AI Retraining Workflow", "Line Supervised Mode Workflow"],
    linkedMissions: ["Manufacturing Quality Improvement Mission Q3-2026", "Scrap Reduction Mission"],
    decisionLineage: [
      { step: "Anomaly Detection", detail: "Scrap rate 2.9% — 1.7pp above enterprise target for 45 consecutive days", icon: "signal" },
      { step: "Root Cause Analysis", detail: "62% of rejected units passed manual re-inspection → threshold calibration issue", icon: "brain" },
      { step: "Spec Cross-Reference", detail: "Customer spec Rev 4.2 (±0.12mm) vs AI threshold (±0.08mm) — gap identified", icon: "doc" },
      { step: "Financial Quantification", detail: "$320K/mo material waste from within-spec rejections", icon: "calc" },
      { step: "Recommendation Surfaced", detail: "84% confidence — HIGH priority · $1.46M annualized recovery", icon: "check" },
    ],
    expectedROI: "$1.46M annualized (material recovery) · 38% scrap rate reduction · Quality audit risk mitigation",
    rollbackStrategy: "Immediate rollback to ±0.08mm threshold via Quality Gate AI configuration override. Supervised mode remains active until root cause of any quality gate failure is identified. No production impact — rollback completes in < 5 minutes.",
    agentWorkflow: "Quality Gate AI Retraining Workflow",
    agentName: "Quality Gate AI",
  },
  {
    id: "REC-2026-004",
    confidence: 79,
    successProbability: 74,
    priority: "medium",
    liveStatus: "pending_approval",
    businessObjective: "Procurement Cost Optimization & Cycle Time Reduction",
    title: "Automate Procurement-to-Finance Approval Routing to Eliminate 4.2-Day Handoff Delay",
    executiveSummary: "Operations Intelligence has identified a systemic bottleneck: 38% of procurement approvals (averaging $47K per transaction) are stalling at the Finance review handoff for an average of 4.2 days — 3.1 days longer than the target SLA of 24 hours. The root cause is threshold misalignment between Procurement's approval policy (auto-approve < $50K) and Finance's manual review gate (manual review all > $25K). Implementing an automated routing rule that dynamically routes approvals based on vendor risk score, category, and transaction amount — combined with a Finance AI co-review for transactions between $25K–$50K — will eliminate the bottleneck and reduce average approval cycle time by 22%.",
    rootCause: "The Procurement and Finance approval policies were established independently in Q2-2024 and have never been reconciled. The $25K Finance manual review threshold was originally set for a smaller transaction volume (avg 12/week). Current volume is 31/week — a 158% increase — creating a queue depth of 4.2x normal at the Finance review gate. Finance has insufficient reviewer capacity to process the volume within SLA, but the threshold has not been updated to reflect the AI-assisted review capability now available.",
    evidenceUsed: [
      "Procurement approval queue analysis: 38% stall rate at Finance handoff",
      "Average delay: 4.2 days vs 1.0 day SLA (3.1 day overage)",
      "Transaction volume growth: 12/week (Q2-2024) → 31/week (current)",
      "Finance reviewer capacity: 2 FTEs vs 31 transactions/week requirement",
      "Finance Reconciler AI accuracy: 97.8% on $25K–$50K transaction review",
      "Threshold misalignment: Procurement auto-approve < $50K vs Finance manual > $25K",
    ],
    affectedDepartments: ["Procurement", "Finance Operations", "Supply Chain", "Operations"],
    affectedAgents: ["Finance Reconciler AI", "Operations AI", "Contract AI", "Procurement Intelligence"],
    kpis: [
      { name: "Avg Approval Cycle Time", current: "4.2 days", target: "1.0 day", projected: "1.1 days", direction: "down" },
      { name: "Finance Handoff Stall Rate", current: "38%", target: "< 5%", projected: "6%", direction: "down" },
      { name: "Finance Ops Efficiency", current: "62%", target: "90%", projected: "88%", direction: "up" },
      { name: "Payment Delay (Downstream)", current: "8.4 days avg", target: "< 3 days", projected: "2.8 days", direction: "down" },
    ],
    financialImpact: { costReduction: "$180K/yr approval administration cost", riskAvoided: "$340K early payment discount recovery (2% net 10)", total: "Est. $520K/yr combined benefit" },
    operationalImpact: "Automated routing requires policy alignment between Procurement and Finance (one-time governance update) and a configuration change to the Finance Reconciler AI routing logic. Finance AI co-review (97.8% accuracy) handles $25K–$50K transactions autonomously, escalating only outliers to human reviewers. Net effect: Finance team freed from routine reviews, capacity redirected to complex transactions and strategic analysis.",
    riskAssessment: "Policy change requires cross-BU sign-off. Automation risk is low given Finance Reconciler AI's 97.8% accuracy track record. Recommended 30-day parallel run (AI + human) before full automation to validate routing rules. Audit trail is fully maintained throughout.",
    riskLevel: "low",
    dependencies: ["Policy alignment between Procurement and Finance (threshold reconciliation)", "Finance Reconciler AI routing logic update", "CFO approval for policy change", "30-day parallel validation period"],
    recommendedActions: [
      { step: 1, action: "Map current approval thresholds and document policy gap (Procurement < $50K vs Finance > $25K)", owner: "Operations AI", duration: "4 hrs", requiresApproval: false },
      { step: 2, action: "Convene Procurement-Finance policy alignment session — agree on unified threshold framework", owner: "CPO + CFO", duration: "2 hrs", requiresApproval: true },
      { step: 3, action: "Configure Finance Reconciler AI routing rules: auto-approve < $25K, AI co-review $25K–$50K, manual > $50K", owner: "Finance Reconciler AI + Operations Team", duration: "1 day", requiresApproval: false },
      { step: 4, action: "Run 30-day parallel validation: AI co-review alongside human review for $25K–$50K transactions", owner: "Finance Reconciler AI + Finance Team", duration: "30 days", requiresApproval: false },
      { step: 5, action: "Review parallel run results — confirm accuracy and escalation rate meets targets", owner: "CFO + Finance Manager", duration: "1 day", requiresApproval: true },
      { step: 6, action: "Activate full automated routing; decommission manual queue for $25K–$50K tier", owner: "Finance Reconciler AI + Operations AI", duration: "1 hr", requiresApproval: true },
    ],
    estimatedExecutionTime: "35 days (including 30-day parallel validation)",
    requiredApprovals: ["CPO + CFO — policy alignment sign-off", "CFO — parallel validation start authorization", "CFO — full automation activation"],
    relatedSOPs: ["SOP-FIN-0014: Invoice and Approval Automation Framework", "SOP-OPS-0027: Cross-BU Policy Alignment Protocol", "SOP-FIN-0008: AI Co-Review Activation Procedure"],
    relatedPolicies: ["Procurement Spend Gate Policy", "Finance Approval Threshold Policy v2.0", "AI Autonomous Action Policy — Finance Operations"],
    linkedWorkflows: ["Cross-BU Approval Automation Workflow", "Finance AI Co-Review Workflow"],
    linkedMissions: ["Finance Efficiency Mission Q3-2026", "Procurement Cycle Time Reduction Mission"],
    decisionLineage: [
      { step: "Queue Analysis", detail: "38% stall rate detected at Finance handoff for 90 consecutive days", icon: "signal" },
      { step: "Threshold Mapping", detail: "Policy gap identified: $25K vs $50K threshold misalignment", icon: "brain" },
      { step: "Capacity Analysis", detail: "Finance volume 158% above 2024 baseline — 2 FTE vs 31 tx/week", icon: "calc" },
      { step: "AI Validation", detail: "Finance Reconciler AI: 97.8% accuracy on $25K–$50K transactions", icon: "doc" },
      { step: "Recommendation Surfaced", detail: "79% confidence — MEDIUM priority · $520K annual benefit", icon: "check" },
    ],
    expectedROI: "$520K/yr (cost reduction + early payment discounts) · 74% approval cycle time improvement",
    rollbackStrategy: "Revert to manual Finance review queue for all transactions. Routing rules can be disabled in < 10 minutes. Finance Reconciler AI continues co-review in advisory mode only. No data loss — full audit trail maintained throughout.",
    agentWorkflow: "Cross-BU Approval Automation Workflow",
    agentName: "Finance Reconciler AI",
  },
  {
    id: "REC-2026-005",
    confidence: 76,
    successProbability: 71,
    priority: "medium",
    liveStatus: "monitoring",
    businessObjective: "AI Workforce Optimization & Supply Chain Crisis Response",
    title: "Reallocate 4 Underutilized Manufacturing Agents to Supply Chain Crisis Support",
    executiveSummary: "Workforce Intelligence has identified 4 Manufacturing AI agents currently operating at < 45% task utilization (Manufacturing demand is in a scheduled low-cycle between production runs). Simultaneously, the Supply Chain business unit is under significant strain — 3 flagged Tier-1 suppliers, elevated procurement queue depth, and a Supplier Risk AI operating at 94% capacity with a 6-hour backlog. Cross-training and temporary redeployment of the 4 underutilized Manufacturing agents to Supply Chain monitoring, supplier outreach, and inventory analysis tasks will accelerate the supplier risk mitigation effort and reduce the Supplier Risk AI backlog by an estimated 68% within 48 hours.",
    rootCause: "The Manufacturing unit is between production cycles (planned Q3 capacity build does not begin until Jul 7). During this window, Line Monitor 1, Line Monitor 2, Production Optimizer, and Throughput Analyzer are each operating below 45% utilization — a known seasonal pattern. The Supply Chain crisis (see REC-2026-002) has created an immediate surge in analytical demand that exceeds current Supply Chain agent capacity. Agent cross-deployment policy (updated in Agent Governance Policy v2.4) explicitly permits temporary cross-BU redeployment for agents with >50% available capacity.",
    evidenceUsed: [
      "Agent utilization report: 4 Manufacturing agents at 32–44% utilization",
      "Supply Chain agent capacity: Supplier Risk AI at 94%, 6-hour backlog",
      "Manufacturing production schedule: Low-cycle Jul 1–6 (confirmed)",
      "Agent Governance Policy v2.4: Cross-BU redeployment permitted > 50% available capacity",
      "Workforce Coordinator analysis: 68% backlog reduction projected with 4 additional agents",
      "Cross-training feasibility: All 4 agents have Supply Chain task templates in knowledge base",
    ],
    affectedDepartments: ["Manufacturing — Lines 1–2", "Supply Chain", "Procurement", "AI Workforce Operations"],
    affectedAgents: ["Line Monitor 1", "Line Monitor 2", "Production Optimizer", "Throughput Analyzer", "Supplier Risk AI", "Inventory Optimizer"],
    kpis: [
      { name: "Supply Chain Agent Utilization", current: "94% (Supplier Risk AI)", target: "< 75%", projected: "61%", direction: "down" },
      { name: "Supplier Risk Analysis Backlog", current: "6 hrs", target: "< 1 hr", projected: "1.9 hrs", direction: "down" },
      { name: "Manufacturing Agent Utilization", current: "38% avg", target: "60%", projected: "64%", direction: "up" },
      { name: "Supplier Outreach Coverage", current: "31%", target: "80%", projected: "84%", direction: "up" },
    ],
    financialImpact: { riskAvoided: "$240K (supplier risk backlog delay cost)", costReduction: "$0 additional cost (no new agents)", total: "Est. $240K risk cost avoided · no incremental spend" },
    operationalImpact: "Redeployment requires configuration update to 4 agent task queues — estimated 2 hours setup time. Manufacturing emergency monitoring remains active (agents can respond to critical manufacturing alerts even while redeployed). Redeployment is temporary (Jul 1–6) with automated recall when Manufacturing production resumes.",
    riskAssessment: "Low operational risk — agents retain their core capabilities and manufacturing monitoring remains in escalation mode. The primary risk is a simultaneous Manufacturing and Supply Chain crisis requiring all agents at once, which is unlikely during the planned low-cycle window (< 8% probability per Workforce Intelligence model).",
    riskLevel: "low",
    dependencies: ["Manufacturing production schedule confirmation (low-cycle Jul 1–6)", "AI Workforce Director authorization for cross-BU redeployment", "Supply Chain team readiness to receive and coordinate redeployed agents", "Emergency recall protocol configured"],
    recommendedActions: [
      { step: 1, action: "Confirm Jul 1–6 low-cycle schedule with Plant Operations — no emergency production runs expected", owner: "Plant Operations Manager", duration: "1 hr", requiresApproval: true },
      { step: 2, action: "Configure emergency recall protocol for all 4 agents (auto-return to Manufacturing on critical alert)", owner: "Workforce Coordinator AI", duration: "2 hrs", requiresApproval: false },
      { step: 3, action: "Load Supply Chain task templates onto agents (supplier outreach, inventory analysis, risk monitoring)", owner: "Workforce Coordinator AI", duration: "2 hrs", requiresApproval: false },
      { step: 4, action: "Execute redeployment: assign Line Monitor 1/2 to supplier outreach, Production Optimizer to inventory analysis, Throughput Analyzer to logistics monitoring", owner: "AI Workforce Director", duration: "30 min", requiresApproval: true },
      { step: 5, action: "Monitor redeployed agent performance and Supply Chain backlog reduction for 48 hours", owner: "Supplier Risk AI + Workforce Coordinator", duration: "48 hrs", requiresApproval: false },
      { step: 6, action: "Recall all 4 agents to Manufacturing on Jul 7 ahead of production cycle restart", owner: "Workforce Coordinator AI", duration: "1 hr", requiresApproval: false },
    ],
    estimatedExecutionTime: "5 hours setup · 6-day temporary redeployment window",
    requiredApprovals: ["Plant Operations Manager — production schedule confirmation", "AI Workforce Director — cross-BU redeployment authorization"],
    relatedSOPs: ["SOP-WF-0031: Cross-BU Agent Redeployment Protocol", "SOP-WF-0019: Emergency Recall Configuration", "SOP-SCM-0044: Supply Chain Surge Response Playbook"],
    relatedPolicies: ["Agent Governance Policy v2.4 — Cross-BU Redeployment", "AI Workforce Utilization Policy (minimum 60% utilization target)", "Manufacturing Continuity Policy — emergency monitoring requirements"],
    linkedWorkflows: ["Cross-BU Agent Redeployment Workflow", "Supply Chain Surge Response Workflow"],
    linkedMissions: ["AI Workforce Optimization Mission Q3-2026", "Supply Chain Crisis Response Mission"],
    decisionLineage: [
      { step: "Utilization Monitoring", detail: "4 Manufacturing agents at 32–44% for 5 consecutive days", icon: "signal" },
      { step: "Demand Cross-Reference", detail: "Supply Chain Supplier Risk AI at 94% capacity with 6-hour backlog", icon: "brain" },
      { step: "Policy Check", detail: "Agent Governance Policy v2.4: redeployment permitted at >50% available capacity", icon: "doc" },
      { step: "Cross-Training Analysis", detail: "All 4 agents have Supply Chain task templates — 2hr setup confirmed", icon: "calc" },
      { step: "Recommendation Surfaced", detail: "76% confidence — MEDIUM priority · $240K risk avoided · zero cost", icon: "check" },
    ],
    expectedROI: "$240K risk avoided (supplier backlog delay) · Supply Chain backlog -68% · No incremental spend",
    rollbackStrategy: "Trigger emergency recall protocol — all 4 agents return to Manufacturing task queues within 15 minutes of any critical manufacturing alert. Supply Chain reverts to current agent capacity. No data or configuration is lost.",
    agentWorkflow: "Cross-BU Agent Redeployment Workflow",
    agentName: "Workforce Coordinator AI",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  critical: { label: "CRITICAL", bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200"    },
  high:     { label: "HIGH",     bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  medium:   { label: "MEDIUM",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  low:      { label: "LOW",      bg: "bg-muted",     text: "text-muted-foreground", border: "border-border" },
};

const STATUS_CONFIG = {
  active:           { label: "ACTIVE",           dot: "bg-emerald-500",  text: "text-emerald-700" },
  in_progress:      { label: "IN PROGRESS",      dot: "bg-blue-500",     text: "text-blue-700"    },
  pending_approval: { label: "PENDING APPROVAL", dot: "bg-amber-500",    text: "text-amber-700"   },
  monitoring:       { label: "MONITORING",       dot: "bg-violet-500",   text: "text-violet-700"  },
};

const RISK_CONFIG = {
  low:    { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "LOW RISK" },
  medium: { text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   label: "MEDIUM RISK" },
  high:   { text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     label: "HIGH RISK" },
};

// ─── Card Component ───────────────────────────────────────────────────────────

function RecommendationCard({ rec, onDismiss }: { rec: Recommendation; onDismiss: (id: string) => void }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addWorkflow } = useAppContext();
  const [isLaunched, setIsLaunched] = useState(false);
  const [isTaskCreated, setIsTaskCreated] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const priority = PRIORITY_CONFIG[rec.priority];
  const status = STATUS_CONFIG[rec.liveStatus];
  const risk = RISK_CONFIG[rec.riskLevel];

  const handleLaunchWorkflow = () => {
    if (isLaunched) return;
    const wf = addWorkflow(rec.agentWorkflow, rec.agentName, rec.title);
    setIsLaunched(true);
    toast({ title: "Workflow Launched", description: `"${rec.agentWorkflow}" is now running.` });
    setTimeout(() => navigate(`/workflow/${wf.id}`), 800);
  };

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm hover:border-primary/30 transition-colors">
      {/* Card Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Confidence */}
            <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20">
              {rec.confidence}% CONF
            </span>
            {/* Priority */}
            <span className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm border", priority.bg, priority.text, priority.border)}>
              {priority.label}
            </span>
            {/* Risk Level */}
            <span className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm border", risk.bg, risk.text, risk.border)}>
              {risk.label}
            </span>
          </div>
          {/* Live Status */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status.dot)} />
            <span className={cn("text-[9px] uppercase tracking-widest font-bold", status.text)}>{status.label}</span>
          </div>
        </div>

        {/* Business Objective */}
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
          {rec.businessObjective}
        </div>

        {/* Title */}
        <h3
          className="text-base font-bold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors leading-snug"
          onClick={() => navigate(`/intelligence/recommendation/${rec.id}`)}
        >
          {rec.title}
        </h3>

        {/* Executive Summary */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {rec.executiveSummary}
        </p>
      </div>

      {/* KPI Strip */}
      <div className="px-5 py-3 border-b border-border/50 bg-[#FAFAFA]">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Impacted KPIs</div>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {rec.kpis.map(kpi => (
            <div key={kpi.name} className="bg-white border border-border rounded-sm px-3 py-2">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1 truncate">{kpi.name}</div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono text-muted-foreground">{kpi.current}</span>
                <ChevronRight size={9} className="text-muted-foreground shrink-0" />
                <span className={cn("text-[11px] font-mono font-bold flex items-center gap-0.5", kpi.direction === "up" ? "text-emerald-600" : "text-blue-600")}>
                  {kpi.direction === "up" ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                  {kpi.projected}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial + Operational Impact */}
      <div className="px-5 py-3 border-b border-border/50 flex flex-wrap gap-4 items-start">
        <div className="flex-1 min-w-[200px]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Financial Impact</div>
          <div className="flex flex-wrap gap-1.5">
            {rec.financialImpact.revenueGain && (
              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm flex items-center gap-1">
                <TrendingUp size={9} /> {rec.financialImpact.revenueGain}
              </span>
            )}
            {rec.financialImpact.costReduction && (
              <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-sm flex items-center gap-1">
                <DollarSign size={9} /> {rec.financialImpact.costReduction}
              </span>
            )}
            {rec.financialImpact.riskAvoided && (
              <span className="text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-sm flex items-center gap-1">
                <Shield size={9} /> {rec.financialImpact.riskAvoided}
              </span>
            )}
          </div>
          <div className="text-[10px] font-semibold text-foreground mt-1">{rec.financialImpact.total}</div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Expected ROI</div>
          <p className="text-[11px] text-foreground leading-snug">{rec.expectedROI}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Success Probability</div>
          <div className="text-xl font-bold font-mono text-foreground">{rec.successProbability}%</div>
          <div className="w-20 h-1 bg-muted rounded-full overflow-hidden mt-1 ml-auto">
            <div className="h-full bg-primary rounded-full" style={{ width: `${rec.successProbability}%` }} />
          </div>
        </div>
      </div>

      {/* Affected + Evidence */}
      <div className="px-5 py-3 border-b border-border/50 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[180px]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 flex items-center gap-1">
            <Users size={9} /> Affected Departments
          </div>
          <div className="flex flex-wrap gap-1">
            {rec.affectedDepartments.map(d => (
              <span key={d} className="text-[9px] bg-muted border border-border px-2 py-0.5 rounded-sm font-medium text-muted-foreground">{d}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 flex items-center gap-1">
            <Bot size={9} /> Affected Agents
          </div>
          <div className="flex flex-wrap gap-1">
            {rec.affectedAgents.map(a => (
              <span key={a} className="text-[9px] bg-primary/5 border border-primary/20 text-primary px-2 py-0.5 rounded-sm font-medium">{a}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5">Execution Time</div>
          <div className="flex items-center gap-1 text-[11px] text-foreground font-semibold">
            <Clock size={10} /> {rec.estimatedExecutionTime}
          </div>
          {rec.requiredApprovals.length > 0 && (
            <div className="text-[9px] text-amber-600 mt-0.5 flex items-center gap-1">
              <AlertTriangle size={8} /> {rec.requiredApprovals.length} approvals required
            </div>
          )}
        </div>
      </div>

      {/* Evidence Panel (expandable) */}
      {showEvidence && (
        <div className="px-5 py-3 border-b border-border/50 bg-[#FAFAFA]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Supporting Evidence</div>
          <div className="space-y-1">
            {rec.evidenceUsed.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-foreground">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                <span>{e}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Reasoning Panel (expandable) */}
      {showReasoning && (
        <div className="px-5 py-3 border-b border-border/50 bg-[#FAFAFA]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Agent Reasoning — Root Cause Analysis</div>
          <p className="text-xs text-foreground leading-relaxed">{rec.rootCause}</p>
          <div className="mt-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Decision Lineage</div>
            <div className="flex items-stretch gap-0 overflow-x-auto">
              {rec.decisionLineage.map((step, idx) => (
                <div key={step.step} className="flex items-center shrink-0">
                  <div className="w-[140px]">
                    <div className="bg-white border border-border rounded-sm p-2">
                      <div className="text-[8px] uppercase tracking-widest font-bold text-primary mb-0.5">{step.step}</div>
                      <p className="text-[9px] text-foreground leading-snug">{step.detail}</p>
                    </div>
                  </div>
                  {idx < rec.decisionLineage.length - 1 && (
                    <div className="w-5 flex items-center justify-center shrink-0 text-muted-foreground text-xs">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary Action */}
          {isLaunched ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-sm font-semibold">
              <CheckCircle2 size={12} /> Workflow Running
            </span>
          ) : (
            <Button
              className="bg-[#0F0F1A] text-white hover:bg-black text-[10px] h-8 px-4 rounded-sm uppercase tracking-wider font-bold gap-1.5"
              onClick={handleLaunchWorkflow}
            >
              <Play size={10} /> Launch Workflow
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[10px] uppercase tracking-widest font-semibold gap-1"
            onClick={() => navigate(`/intelligence/recommendation/${rec.id}`)}
          >
            <BarChart2 size={10} /> View Decision Analysis
          </Button>

          {isTaskCreated ? (
            <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-sm font-bold uppercase tracking-widest">
              ✓ Task Created
            </span>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
              onClick={() => { setIsTaskCreated(true); toast({ title: "Task Created", description: `"${rec.title}" added to Task Registry.` }); }}>
              <Target size={10} /> Create Task
            </Button>
          )}

          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
            onClick={() => setShowEvidence(!showEvidence)}>
            <Eye size={10} /> {showEvidence ? "Hide" : "View"} Evidence
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
            onClick={() => setShowReasoning(!showReasoning)}>
            <Cpu size={10} /> {showReasoning ? "Hide" : "View"} Agent Reasoning
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
            onClick={() => navigate(`/intelligence/recommendation/${rec.id}?tab=impact`)}>
            <FlaskConical size={10} /> Impact Simulation
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
            onClick={() => navigate(`/workflow-studio`)}>
            <GitBranch size={10} /> Open Mission
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
            onClick={() => navigate(`/policy-studio`)}>
            <Shield size={10} /> Policies
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
            onClick={() => toast({ title: "Owner Assigned", description: "Recommendation sent to department lead for ownership." })}>
            <UserPlus size={10} /> Assign Owner
          </Button>

          {isSaved ? (
            <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-sm font-bold uppercase tracking-widest">
              ✓ Saved
            </span>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
              onClick={() => { setIsSaved(true); toast({ title: "Recommendation Saved", description: "Added to your saved recommendations." }); }}>
              <Bookmark size={10} /> Save
            </Button>
          )}

          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-600 gap-1 ml-auto"
            onClick={() => { onDismiss(rec.id); toast({ title: "Recommendation Dismissed", description: "You can restore it from the dismissed queue." }); }}>
            <XCircle size={10} /> Dismiss
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
            onClick={() => navigate(`/intelligence/recommendation/${rec.id}`)}>
            <ExternalLink size={10} /> Full Analysis
            <ChevronRight size={9} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Intelligence() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { workflows } = useAppContext();
  const runningWorkflows = workflows.filter(w => w.status === "running" || w.status === "pending");

  const visible = RECOMMENDATIONS.filter(r => !dismissed.has(r.id));

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="ENTERPRISE INTELLIGENCE"
        metrics={[
          { label: "RECOMMENDATIONS", value: visible.length },
          { label: "CRITICAL", value: visible.filter(r => r.priority === "critical").length },
          { label: "ACTIVE WORKFLOWS", value: runningWorkflows.length },
        ]}
      />

      <div className="p-6 max-w-[1200px] mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Recommendations</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {visible.length} active AI-generated executive recommendations · Sorted by priority
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            DeepSights Engine v3.2 · Live
          </div>
        </div>

        <div className="space-y-4">
          {visible.map(rec => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onDismiss={id => setDismissed(prev => { const n = new Set(prev); n.add(id); return n; })}
            />
          ))}

          {visible.length === 0 && (
            <div className="p-16 text-center bg-white border border-border rounded-sm">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">All recommendations reviewed</p>
              <p className="text-xs text-muted-foreground mt-1">No active recommendations at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
