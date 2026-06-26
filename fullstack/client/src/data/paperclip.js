// ============================================================
// Paperclip-prototype — NEW reference data merged in from paperclip-master.
// These are the concepts Meridian didn't have: agent runtime ADAPTERS
// (bring-your-own-agent), GOALS (hierarchy), PROJECTS, and the ACTIVITY feed.
// Real-estate stays the flagship seed; a second generic company proves the
// multi-company shell.
// ============================================================
import { modelById, monthlyCost } from './store.js';

// ---- Agent runtime adapters (Paperclip "bring your own agent") -------------
export const DEFAULT_ADAPTERS = [
  { id: 'adp-claude', name: 'Claude Code',        kind: 'claude', status: 'connected', runtime: 'local',
    description: 'Anthropic Claude Code agent runtime. Heartbeat-driven, tool-use capable.' },
  { id: 'adp-codex',  name: 'Codex',              kind: 'codex',  status: 'connected', runtime: 'local',
    description: 'OpenAI Codex CLI runtime for code-centric agents.' },
  { id: 'adp-gemini', name: 'Gemini CLI',         kind: 'gemini', status: 'available', runtime: 'local',
    description: 'Google Gemini command-line agent runtime.' },
  { id: 'adp-cursor', name: 'Cursor Agent',       kind: 'cursor', status: 'available', runtime: 'cloud',
    description: 'Cursor cloud/local coding agent.' },
  { id: 'adp-http',   name: 'HTTP / Webhook Bot', kind: 'http',   status: 'available', runtime: 'webhook',
    description: 'Any bot that can receive a heartbeat over HTTP. If it can receive a heartbeat, it is hired.' },
  { id: 'adp-bash',   name: 'Bash Agent',         kind: 'bash',   status: 'available', runtime: 'local',
    description: 'Shell-driven agent for scripted, deterministic tasks.' },
];

const VENDOR_TO_ADAPTER = { Anthropic: 'adp-claude', OpenAI: 'adp-codex', Google: 'adp-gemini' };

// Enrich Meridian's AI employees with the org-chart + adapter + budget fields
// Paperclip adds. Deterministic: the first employee seen in a department becomes
// that department's lead; the rest report to the lead.
export function withOrgFields(employees) {
  const leadByDept = {};
  employees.forEach(e => { if (!leadByDept[e.dept]) leadByDept[e.dept] = e.id; });
  return employees.map(e => {
    const isLead = leadByDept[e.dept] === e.id;
    const vendor = modelById(e.model).vendor;
    return {
      ...e,
      managerId: isLead ? null : leadByDept[e.dept],
      adapterId: VENDOR_TO_ADAPTER[vendor] || 'adp-http',
      budgetMonthlyUsd: Math.max(500, Math.round((monthlyCost(e) * 1.4) / 50) * 50),
    };
  });
}

// ---- Goals (hierarchy) -----------------------------------------------------
const ONYX_GOALS = [
  { id: 'goal-1', parentId: null,     title: 'Run the portfolio at target NOI', status: 'active', targetDate: '2026-12-31',
    description: 'Hit net-operating-income targets across all managed assets while holding the line on cost.' },
  { id: 'goal-2', parentId: 'goal-1', title: 'Keep portfolio occupancy ≥ 95%', status: 'active', targetDate: '2026-09-30',
    description: 'Reduce vacancy through faster leasing, renewals and proactive delinquency work.' },
  { id: 'goal-3', parentId: 'goal-1', title: 'Cut manual ops cost 30% with the AI workforce', status: 'active', targetDate: '2026-12-31',
    description: 'Automate the highest-volume Units of Work across every department.' },
  { id: 'goal-4', parentId: 'goal-3', title: 'Zero-touch finance reconciliation', status: 'active', targetDate: '2026-08-31',
    description: 'Automate rent reconciliation and AP invoice matching between Yardi and SAP.' },
  { id: 'goal-5', parentId: 'goal-2', title: 'Sub-7-day unit turn time', status: 'at-risk', targetDate: '2026-10-15',
    description: 'Coordinate facilities, leasing and vendors to turn vacant units faster.' },
];
const ACME_GOALS = [
  { id: 'goal-ac-1', parentId: null, title: 'Launch the company & onboard the first department', status: 'active', targetDate: null,
    description: 'Stand up an AI workforce from scratch — connect systems, discover Units of Work, hire agents.' },
];
export const seedGoals = (cid) => (cid === 'co-onyx' ? ONYX_GOALS : ACME_GOALS).map(g => ({ ...g }));

// ---- Projects --------------------------------------------------------------
const ONYX_PROJECTS = [
  { id: 'proj-1', name: 'Q3 Delinquency Reduction', leadAgentId: 'emp-1', goalId: 'goal-2', color: '#3a86d4', status: 'active',   targetDate: '2026-09-30',
    description: 'Coordinated rent-roll sweeps, tenant notices and payment plans to cut delinquency.' },
  { id: 'proj-2', name: 'Finance Auto-Reconciliation', leadAgentId: 'emp-5', goalId: 'goal-4', color: '#2c9d8f', status: 'active', targetDate: '2026-08-31',
    description: 'Zero-touch reconciliation pipeline across Yardi and the SAP ERP.' },
  { id: 'proj-3', name: 'Leasing Velocity', leadAgentId: 'emp-7', goalId: 'goal-2', color: '#c0617f', status: 'planning', targetDate: '2026-10-15',
    description: 'Speed up listing syndication and tenant onboarding to lift occupancy.' },
  { id: 'proj-4', name: 'Portfolio Valuation Refresh', leadAgentId: 'emp-13', goalId: 'goal-1', color: '#8169b8', status: 'active', targetDate: '2026-07-31',
    description: 'Quarterly valuation + NOI variance watch across the portfolio.' },
];
export const seedProjects = (cid) => (cid === 'co-onyx' ? ONYX_PROJECTS.map(p => ({ ...p })) : []);

// ---- Activity / audit feed -------------------------------------------------
const iso = (daysAgo, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const ONYX_ACTIVITY = [
  { id: 'act-1', actorType: 'agent', actorId: 'emp-1',  action: 'ran_workflow',   targetType: 'workflow', targetId: 'wf-1',  meta: { name: 'Rent Roll Sweep' },              at: iso(0, 7) },
  { id: 'act-2', actorType: 'agent', actorId: 'emp-5',  action: 'called_uow',     targetType: 'uow',      targetId: 'uow-8', meta: { name: 'Reconcile Rent Payment' },        at: iso(0, 8) },
  { id: 'act-3', actorType: 'agent', actorId: 'emp-1',  action: 'requested_approval', targetType: 'approval', targetId: 'app-1', meta: { name: 'Send delinquency notices' }, at: iso(0, 8) },
  { id: 'act-4', actorType: 'user',  actorId: 'head-1', action: 'approved',       targetType: 'approval', targetId: 'app-3', meta: { name: 'Grant work-order scope' },        at: iso(1, 16) },
  { id: 'act-5', actorType: 'agent', actorId: 'emp-13', action: 'ran_workflow',   targetType: 'workflow', targetId: 'wf-6',  meta: { name: 'Quarterly Valuation Refresh' },   at: iso(1, 6) },
  { id: 'act-6', actorType: 'user',  actorId: 'admin-1', action: 'updated_budget', targetType: 'company', targetId: 'co-onyx', meta: { name: 'Monthly AI budget' },           at: iso(2, 11) },
  { id: 'act-7', actorType: 'agent', actorId: 'emp-3',  action: 'completed_task', targetType: 'task',     targetId: 'task-3', meta: { name: 'Audit lease renewals' },          at: iso(2, 14) },
];
export const seedActivity = (cid) => (cid === 'co-onyx' ? ONYX_ACTIVITY.map(a => ({ ...a })) : []);

// Human-readable label for an activity action.
export const ACTION_LABEL = {
  ran_workflow: 'ran workflow',
  called_uow: 'called Unit of Work',
  requested_approval: 'requested approval',
  approved: 'approved',
  resolved_approval: 'resolved approval',
  updated_budget: 'updated budget',
  completed_task: 'completed task',
  created_employee: 'hired agent',
  updated_employee: 'updated agent',
  created_task: 'created issue',
  moved_task: 'moved issue',
  created_goal: 'created goal',
  created_project: 'created project',
  created_uow: 'added Unit of Work',
  connected_connector: 'connected system',
  invited_user: 'invited person',
  created_company: 'created company',
  heartbeat_run: 'heartbeat run',
};
