import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../data/StoreContext.jsx';
import { USERS, empById, modelById, reasoningById, monthlyCost } from '../data/store.js';
import { ACTION_LABEL } from '../data/paperclip.js';
import { api } from '../api/index.js';
import { Card, Stat, Pill, Modal, Field, Select, Avatar, AgentAvatar, Empty, SectionTitle, Note } from '../components/ui.jsx';
import {
  Building2, Plus, Target, FolderKanban, Share2, Cpu, Activity as ActivityIcon,
  Check, ArrowRight, Bot, Calendar, DollarSign, Zap, GitBranch, ShieldCheck,
  Boxes, Plug, MessageSquare, TrendingUp, CircleDot,
} from 'lucide-react';

// ---------- helpers ----------------------------------------------------------
const fmtUsd = (n) => n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
function ago(iso) {
  if (!iso) return '';
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / (60 * 24))}d ago`;
}
const statusTone = (s) => ({ active: 'success', 'at-risk': 'warning', planning: 'info', paused: 'neutral', done: 'success', connected: 'success', available: 'neutral' }[s] || 'neutral');

// =============================================================================
// COMPANIES — the Paperclip multi-company control plane
// =============================================================================
export function Companies({ role, toast }) {
  const { companies, companyId, switchCompany, createCompany } = useStore();
  const [counts, setCounts] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', domain: 'generic', tagline: '' });

  useEffect(() => {
    let alive = true;
    Promise.all(companies.map(c => api.getState(c.id).then(s => [c.id, {
      agents: s.employees.length, goals: s.goals.length, projects: s.projects.length, uow: s.unitsOfWork.length,
    }]).catch(() => [c.id, null])))
      .then(entries => { if (alive) setCounts(Object.fromEntries(entries)); });
    return () => { alive = false; };
  }, [companies]);

  const submit = async () => {
    if (!form.name.trim()) return;
    await createCompany(form);
    toast?.(`Company “${form.name}” created`);
    setOpen(false);
    setForm({ name: '', domain: 'generic', tagline: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionTitle icon={Building2} title="Companies" subtitle="One control plane, many companies. Complete data isolation — switch context to operate each." />
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New company</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {companies.map(c => {
          const isCurrent = c.id === companyId;
          const k = counts[c.id];
          return (
            <Card key={c.id} className={`pc-card ${isCurrent ? 'ring-active' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="company-mark"><Building2 size={18} /></div>
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <Pill label={c.domain} tone={c.domain === 'real-estate' ? 'purple' : 'info'} />
                  </div>
                </div>
                {isCurrent && <Pill label="Current" tone="success" />}
              </div>
              <div className="text-sm text-muted mb-3" style={{ minHeight: 34 }}>{c.tagline}</div>
              <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                <MiniStat n={k?.agents} label="Agents" />
                <MiniStat n={k?.goals} label="Goals" />
                <MiniStat n={k?.projects} label="Projects" />
                <MiniStat n={k?.uow} label="UoW" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted flex items-center gap-1"><DollarSign size={12} /> {fmtUsd(c.budgetMonthlyUsd)}/mo budget</span>
                {isCurrent
                  ? <span className="text-xs text-muted">Active context</span>
                  : <button className="btn btn-outline btn-sm" onClick={() => { switchCompany(c.id); toast?.(`Switched to ${c.name}`); }}>Switch <ArrowRight size={14} /></button>}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create a company">
        <Field label="Company name"><input className="search-input bg-white" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Helios Energy" /></Field>
        <Field label="Domain" hint="Real-estate is the flagship seed; pick generic for a fresh company.">
          <Select value={form.domain} onChange={v => setForm(f => ({ ...f, domain: v }))} options={[{ value: 'generic', label: 'Generic' }, { value: 'real-estate', label: 'Real estate' }]} />
        </Field>
        <Field label="Tagline"><input className="search-input bg-white" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="One line about this company" /></Field>
        <Note>A new generic company starts empty — use <b>Dept Onboarding</b> to discover Units of Work and hire agents.</Note>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Create company</button>
        </div>
      </Modal>
    </div>
  );
}
const MiniStat = ({ n, label }) => (
  <div className="mini-stat"><div className="font-semibold">{n ?? '—'}</div><div className="text-xs text-muted">{label}</div></div>
);

// =============================================================================
// GOALS — hierarchy; work traces back to "the why"
// =============================================================================
export function Goals({ toast }) {
  const { goals, projects, tasks, createGoal } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', parentId: '', targetDate: '', description: '', status: 'active' });

  const roots = goals.filter(g => !g.parentId);
  const childrenOf = (id) => goals.filter(g => g.parentId === id);

  const submit = async () => {
    if (!form.title.trim()) return;
    await createGoal({ ...form, parentId: form.parentId || null });
    toast?.('Goal created');
    setOpen(false);
    setForm({ title: '', parentId: '', targetDate: '', description: '', status: 'active' });
  };

  const GoalNode = ({ g, depth }) => {
    const kids = childrenOf(g.id);
    const linkedProjects = projects.filter(p => p.goalId === g.id);
    return (
      <div>
        <Card className="goal-node" >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2" style={{ marginLeft: depth * 18 }}>
              <Target size={16} className="text-muted" style={{ marginTop: 3 }} />
              <div>
                <div className="font-semibold flex items-center gap-2">{g.title} <Pill label={g.status} tone={statusTone(g.status)} /></div>
                {g.description && <div className="text-sm text-muted">{g.description}</div>}
                <div className="text-xs text-muted mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(g.targetDate)}</span>
                  {linkedProjects.length > 0 && <span className="flex items-center gap-1"><FolderKanban size={12} /> {linkedProjects.length} project{linkedProjects.length > 1 ? 's' : ''}</span>}
                </div>
              </div>
            </div>
          </div>
        </Card>
        {kids.map(k => <GoalNode key={k.id} g={k} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionTitle icon={Target} title="Goals" subtitle="Every task traces back to a company goal — agents know what to do and why." />
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New goal</button>
      </div>
      {goals.length === 0
        ? <Card><Empty icon={Target} message="No goals yet. Define the company's first objective." /></Card>
        : <div className="flex flex-col gap-2">{roots.map(g => <GoalNode key={g.id} g={g} depth={0} />)}</div>}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a goal">
        <Field label="Goal"><input className="search-input bg-white" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Keep occupancy ≥ 95%" /></Field>
        <Field label="Parent goal">
          <Select value={form.parentId} onChange={v => setForm(f => ({ ...f, parentId: v }))} options={[{ value: '', label: '— Top-level —' }, ...goals.map(g => ({ value: g.id, label: g.title }))]} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target date"><input type="date" className="search-input bg-white" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} /></Field>
          <Field label="Status"><Select value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={[{ value: 'active', label: 'Active' }, { value: 'at-risk', label: 'At risk' }, { value: 'done', label: 'Done' }]} /></Field>
        </div>
        <Field label="Description"><textarea className="search-input bg-white" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Create goal</button>
        </div>
      </Modal>
    </div>
  );
}

// =============================================================================
// PROJECTS — group work, lead agent, link to a goal
// =============================================================================
export function Projects({ toast }) {
  const { projects, goals, employees, createProject } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', leadAgentId: '', goalId: '', targetDate: '', color: '#3a86d4', description: '', status: 'planning' });
  const emp = (id) => employees.find(e => e.id === id) || empById(id);
  const goal = (id) => goals.find(g => g.id === id);

  const submit = async () => {
    if (!form.name.trim()) return;
    await createProject({ ...form, goalId: form.goalId || null, leadAgentId: form.leadAgentId || null });
    toast?.('Project created');
    setOpen(false);
    setForm({ name: '', leadAgentId: '', goalId: '', targetDate: '', color: '#3a86d4', description: '', status: 'planning' });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionTitle icon={FolderKanban} title="Projects" subtitle="Group issues under a lead agent and a goal, with a target date." />
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New project</button>
      </div>
      {projects.length === 0
        ? <Card><Empty icon={FolderKanban} message="No projects yet." /></Card>
        : <div className="grid grid-cols-3 gap-4">
          {projects.map(p => {
            const lead = emp(p.leadAgentId);
            const g = goal(p.goalId);
            return (
              <Card key={p.id} className="pc-card">
                <div className="flex items-center gap-2 mb-1">
                  <span className="proj-dot" style={{ background: p.color }} />
                  <div className="font-semibold flex-1">{p.name}</div>
                  <Pill label={p.status} tone={statusTone(p.status)} />
                </div>
                <div className="text-sm text-muted mb-3" style={{ minHeight: 34 }}>{p.description}</div>
                <div className="flex items-center justify-between">
                  {lead ? <span className="flex items-center gap-2 text-sm"><AgentAvatar id={lead.id} name={lead.name} size={22} /> {lead.name}</span> : <span className="text-xs text-muted">No lead</span>}
                  <span className="text-xs text-muted flex items-center gap-1"><Calendar size={12} /> {fmtDate(p.targetDate)}</span>
                </div>
                {g && <div className="text-xs text-muted mt-2 flex items-center gap-1"><Target size={12} /> {g.title}</div>}
              </Card>
            );
          })}
        </div>}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a project">
        <Field label="Project name"><input className="search-input bg-white" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lead agent"><Select value={form.leadAgentId} onChange={v => setForm(f => ({ ...f, leadAgentId: v }))} options={[{ value: '', label: '— None —' }, ...employees.map(e => ({ value: e.id, label: `${e.name} · ${e.title}` }))]} /></Field>
          <Field label="Goal"><Select value={form.goalId} onChange={v => setForm(f => ({ ...f, goalId: v }))} options={[{ value: '', label: '— None —' }, ...goals.map(g => ({ value: g.id, label: g.title }))]} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target date"><input type="date" className="search-input bg-white" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} /></Field>
          <Field label="Status"><Select value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={[{ value: 'planning', label: 'Planning' }, { value: 'active', label: 'Active' }, { value: 'done', label: 'Done' }]} /></Field>
        </div>
        <Field label="Description"><textarea className="search-input bg-white" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Create project</button>
        </div>
      </Modal>
    </div>
  );
}

// =============================================================================
// ORG CHART — reporting lines across departments
// =============================================================================
export function OrgChart() {
  const { employees, adapters, currentCompany, departments } = useStore();
  const adapterName = (id) => adapters.find(a => a.id === id)?.name || '—';
  const depts = departments && departments.length ? departments : [...new Set(employees.map(e => e.dept))];

  const AgentCard = ({ e, lead }) => (
    <div className={`org-card ${lead ? 'org-lead' : ''}`}>
      <AgentAvatar id={e.id} name={e.name} size={32} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm flex items-center gap-2">{e.name}
          <span className={`status-dot ${e.status === 'active' ? 'live' : 'idle'}`} title={e.status} />
        </div>
        <div className="text-xs text-muted truncate">{e.title}</div>
        <div className="text-xs text-muted mt-1 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1"><Cpu size={11} /> {adapterName(e.adapterId)}</span>
          <span className="flex items-center gap-1"><DollarSign size={11} /> {fmtUsd(e.budgetMonthlyUsd || 0)}/mo</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionTitle icon={Share2} title="Org Chart" subtitle={`Reporting lines for ${currentCompany?.name || 'this company'} — agents have a boss, a title and a budget.`} />
      {employees.length === 0
        ? <Card><Empty icon={Share2} message="No agents yet. Hire agents from AI Employees or via Dept Onboarding." /></Card>
        : <div className="flex flex-col gap-4">
          {depts.map(dept => {
            const inDept = employees.filter(e => e.dept === dept);
            if (!inDept.length) return null;
            const leads = inDept.filter(e => !e.managerId);
            const reports = (mid) => inDept.filter(e => e.managerId === mid);
            return (
              <Card key={dept} className="pc-card">
                <div className="font-semibold mb-3 flex items-center gap-2"><Building2 size={15} className="text-muted" /> {dept} <span className="text-xs text-muted">· {inDept.length}</span></div>
                <div className="org-grid">
                  {leads.map(lead => (
                    <div key={lead.id} className="org-branch">
                      <AgentCard e={lead} lead />
                      <div className="org-reports">
                        {reports(lead.id).map(r => <AgentCard key={r.id} e={r} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>}
    </div>
  );
}

// =============================================================================
// ADAPTERS — bring your own agent runtime
// =============================================================================
export function Adapters({ toast }) {
  const { adapters, employees } = useStore();
  const [local, setLocal] = useState(adapters);
  useEffect(() => setLocal(adapters), [adapters]);
  const KIND_ICON = { claude: Bot, codex: GitBranch, gemini: Zap, cursor: CircleDot, http: Plug, bash: Boxes };

  const connect = (id) => {
    setLocal(ls => ls.map(a => a.id === id ? { ...a, status: 'connected' } : a));
    toast?.('Heartbeat registered — adapter connected');
  };

  return (
    <div>
      <SectionTitle icon={Cpu} title="Adapters" subtitle="Bring your own agent. Any runtime that can receive a heartbeat can power an agent." />
      <div className="grid grid-cols-3 gap-4">
        {local.map(a => {
          const Icon = KIND_ICON[a.kind] || Cpu;
          const used = employees.filter(e => e.adapterId === a.id).length;
          return (
            <Card key={a.id} className="pc-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><div className="adapter-mark"><Icon size={18} /></div><div className="font-semibold">{a.name}</div></div>
                <Pill label={a.status} tone={statusTone(a.status)} />
              </div>
              <div className="text-sm text-muted mb-3" style={{ minHeight: 48 }}>{a.description}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{a.runtime} · {used} agent{used !== 1 ? 's' : ''}</span>
                {a.status === 'connected'
                  ? <span className="text-xs text-success flex items-center gap-1"><Check size={13} /> Connected</span>
                  : <button className="btn btn-outline btn-sm" onClick={() => connect(a.id)}>Connect</button>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// ACTIVITY — immutable audit feed
// =============================================================================
export function Activity() {
  const { activity, employees } = useStore();
  const [filter, setFilter] = useState('all');
  const ICON = { ran_workflow: GitBranch, called_uow: Boxes, requested_approval: ShieldCheck, approved: Check, resolved_approval: Check, completed_task: CheckLike, created_task: FolderKanban, moved_task: FolderKanban, created_employee: Bot, updated_employee: Bot, created_goal: Target, created_project: FolderKanban, created_uow: Boxes, connected_connector: Plug, invited_user: MessageSquare, updated_budget: DollarSign, created_company: Building2, heartbeat_run: Zap };

  const actorName = (a) => {
    if (a.actorType === 'agent') return employees.find(e => e.id === a.actorId)?.name || empById(a.actorId)?.name || 'Agent';
    return USERS.find(u => u.id === a.actorId)?.name || 'User';
  };

  const items = useMemo(() => [...(activity || [])].sort((x, y) => new Date(y.at) - new Date(x.at)), [activity]);
  const shown = filter === 'all' ? items : items.filter(i => i.actorType === filter);

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionTitle icon={ActivityIcon} title="Activity" subtitle="Every mutation is traced — who did what, to what, and when." />
        <Select value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All actors' }, { value: 'agent', label: 'Agents' }, { value: 'user', label: 'People' }]} />
      </div>
      {shown.length === 0
        ? <Card><Empty icon={ActivityIcon} message="No activity yet. Actions across the app will appear here." /></Card>
        : <Card className="pc-card">
          <div className="flex flex-col">
            {shown.map((a, i) => {
              const Icon = ICON[a.action] || CircleDot;
              return (
                <div key={a.id} className={`activity-row ${i < shown.length - 1 ? 'with-divider' : ''}`}>
                  <div className={`activity-ico ${a.actorType}`}><Icon size={15} /></div>
                  <div className="flex-1">
                    <span className="font-medium">{actorName(a)}</span>{' '}
                    <span className="text-muted">{ACTION_LABEL[a.action] || a.action}</span>{' '}
                    {a.meta?.name && <span className="font-medium">“{a.meta.name}”</span>}
                    {a.meta?.status && <Pill label={a.meta.status} tone="info" />}
                  </div>
                  <div className="text-xs text-muted">{ago(a.at)}</div>
                </div>
              );
            })}
          </div>
        </Card>}
    </div>
  );
}
// small inline icon to avoid an extra import collision
function CheckLike(props) { return <Check {...props} />; }
