---
name: Onyx Meridian Architecture
description: Key structural decisions for Onyx Meridian Enterprise OS — manufacturing context, new pages, sidebar, data shape.
---

## Data Layer
- `enterprise-data.ts` exports: BU_LIST (5 MFG BUs), ANOMALIES, IMPACT_MAP, MFG_AGENTS (9 agents), KPI_CATALOG (10+ KPIs), SOP_CATALOG (4 SOPs), BU_INTELLIGENCE
- BU_LIST shape has: id, name, eei, health, agents, workflows, risk, eeiContrib, kpis{}, cost, openTasks, roi, revenueProtected, costSaved, hoursSaved, downtimePrevented, automationPct, productivityImprovement, eeiContribution, color, employees[]
- MFG_AGENTS shape: id, employeeId, name, role, department, bu, status, autonomy, utilization, sla, costPerDay, tasks, skills[], systems[], hoursSaved, revenueProtected, downtimePrevented, costSaved, automationPct, roi, eeiContrib, kpisImproved[], health, version, model, latencyMs, accuracy, hallucination, policyCompliance, tokenUsage, costMtd
- KPI_CATALOG items have: id, name, category, value, target, trend, delta, buIds[], linked[] (agent ids)
- BU_INTELLIGENCE: per-BU insights, recommendations (with sop/workflow/confidence/effort/impact fields), forecast, businessImpact
- SOP_CATALOG.workflow is an array of steps; items have: agents[], kpis[], systems[], owner, automation, risk, status, version
- MFG_AGENTS is the canonical agent list for all new pages

## Write Tool Warning
- The write tool truncates content mid-write if it contains certain unicode characters (em dash `—`, arrows `→`) inside string literals; replace with ASCII equivalents to avoid unterminated string errors in Vite/Babel

## Completed Pages
- `business-unit-detail.tsx` — 12 tabs: Overview, Business Impact, KPIs, Agents, Tasks, Workflows, Knowledge, Recommendations, Risks, Documents, Timeline, Human Approvals; inline data for all 5 BUs; cross-links throughout; Approve/Reject on approvals; Execute on recommendations; Run on tasks
- `workforce.tsx` — 5 tabs: Inventory, Agent Overview, Command Center, Harness, Playground; uses MFG_AGENTS directly; Hire Agent modal; all buttons functional with toast
- `prompt-playground.tsx` — Save Draft, Export, Publish v5, Clone, Rollback buttons all wired with toast; useToast imported and initialized

## Sidebar Structure
5 sections: ENTERPRISE / OPERATE / CONTROL / BUILD / OPTIMIZE
- Policy Studio appears in both CONTROL (as "Policies") and BUILD (as "Policy Studio") — both link to /policy-studio — key uniqueness handled by `item.path + item.label`

## New Routes (added to App.tsx)
- `/agent-studio` — 11-step wizard for creating Digital Employees
- `/agents/:id` — Digital Employee Workspace
- `/business-impact` — enterprise-wide business impact
- `/sop` — SOP Framework with visual workflow canvas
- `/kpis` — KPI Framework linked to BUs and agents
- `/workflow-studio` — visual workflow canvas
- `/knowledge-studio` — knowledge base management
- `/connector-hub` — ERP/MES/SCADA/CMMS/IoT/WMS/PLM connectors
- `/evaluation-studio` — eval library and scheduling

## Command Palette
- `CommandPalette.tsx` lives in `src/components/`
- Mounted inside `AppLayout.tsx` — listens for Ctrl/Cmd+K globally

## Visual Language (preserve)
- `text-[10px] uppercase tracking-widest` — all section labels and badges
- `font-mono` — metrics, scores, costs, IDs
- `border border-border rounded-sm` — cards (not rounded-md)
- `bg-muted/30` — card backgrounds
- `bg-primary/10 text-primary` — active/selected states
- HeaderBar + breadcrumb pattern on every page

**Why:** Existing pages (digital-twin, workforce, agentops, governance etc.) must NOT be redesigned — only add new pages and update data.
