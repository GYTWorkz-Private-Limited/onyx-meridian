import React, { useState, useEffect, useRef } from 'react';
import { Card, SectionTitle, Pill, statusTone, priTone, Modal, Avatar, AgentAvatar, Note, Field, Select, SecuredBadge, SortableTable, Skeleton, useFakeLoad } from '../components/ui.jsx';
import { useStore } from '../data/StoreContext.jsx';
import {
  DEPARTMENTS, ARCHETYPES, MODELS, REASONING_LEVELS, UNITS_OF_WORK, WORKFLOWS, USERS,
  empById, uowById, wfById, modelById, reasoningById, monthlyCost, effectiveness,
  uowsForEmployee, employeeWorkflows, employeeActivity
} from '../data/store.js';
import {
  Building2, Search, Bot, Plus, Send, ArrowLeft, Workflow, Boxes, ShieldAlert, ShieldCheck,
  Users as UsersIcon, Clock, Zap, CheckCircle, MessageSquare, Sparkles,
  Activity as ActivityIcon, ListChecks, RefreshCw, Calendar,
  Mic, MicOff, ChevronDown, ChevronRight, ArrowUp, DollarSign, Phone, PhoneOff, Network,
  BarChart3, FileText, FileJson, FileSpreadsheet, Folder, FolderOpen, Brain, X, HardDrive,
  Mail, TrendingUp, Tag
} from 'lucide-react';
import { employeeMemory, fileSize, memoryStats } from '../data/memory.js';

// ---- helpers ----------------------------------------------------------------
const activeEmployeesFor = (role, user, employees) =>
  employees.filter(e => e.status === 'active' && (role === 'admin' || e.dept === user.dept));

// Distinct, elegant per-agent avatar gradients (deterministic by id).
const AVATAR_GRADS = [
  'linear-gradient(135deg, #7178d3, #b291cf)',
  'linear-gradient(135deg, #5b9fd0, #74c2c8)',
  'linear-gradient(135deg, #8b7fd0, #d28aa9)',
  'linear-gradient(135deg, #5fa98f, #8fcfa0)',
  'linear-gradient(135deg, #c08bd0, #e0a3c4)',
  'linear-gradient(135deg, #6f86d6, #9aa7e0)',
  'linear-gradient(135deg, #d39a6a, #e0c08a)',
  'linear-gradient(135deg, #6cb0c4, #9ad0c8)',
];
function avatarGrad(id = '') {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % AVATAR_GRADS.length;
  return AVATAR_GRADS[h];
}

// Live working status for an AI employee, derived from its open tasks.
function agentLiveStatus(e, tasks = []) {
  if (e.status !== 'active') return { state: e.status, label: e.status, dot: 'var(--gray-400)', running: 0, queue: 0, pulse: false };
  const mine = tasks.filter(t => t.assigneeType === 'ai' && t.assignee === e.id && t.status !== 'done');
  const running = mine.filter(t => t.status === 'in-progress' || t.status === 'review');
  const queue = mine.length - running.length;
  if (running.length) return { state: 'working', label: 'Working', dot: 'var(--green-500)', running: running.length, queue, pulse: true };
  if (mine.length) return { state: 'queued', label: 'Queued', dot: 'var(--orange-500)', running: 0, queue: mine.length, pulse: false };
  return { state: 'idle', label: 'Idle', dot: 'var(--gray-400)', running: 0, queue: 0, pulse: false };
}

// Compact status indicator: pulsing dot + label + queue line.
function AgentStatus({ e, tasks }) {
  const s = agentLiveStatus(e, tasks);
  const sub = s.state === 'working'
    ? `${s.running} running${s.queue ? ` · ${s.queue} in queue` : ''}`
    : s.state === 'queued' ? `${s.queue} in queue`
    : s.state === 'idle' ? 'No tasks queued'
    : 'Suspended';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 128, marginRight: 4 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 500, color: 'var(--gray-700)', lineHeight: 1.2 }}>
        <span className={s.pulse ? 'status-dot pulsing' : 'status-dot'} style={{ background: s.dot }} />
        {s.label}
      </span>
      <span className="text-xs text-muted" style={{ lineHeight: 1.2 }}>{sub}</span>
    </div>
  );
}

const DEPT_DEFAULT = 'Property Management';

// Build a believable background step trace for a chat reply.
function buildAgentSteps(emp, employees) {
  const wfs = employeeWorkflows(emp);
  const wf = wfs[0];
  const uows = uowsForEmployee(emp);
  const peer = employees.find(e => e.dept === emp.dept && e.id !== emp.id && e.status === 'active');
  const steps = [];
  if (wf) steps.push({ type: 'workflow', label: `Invoked workflow “${wf.name}”` });
  const uow = uows[0];
  if (uow) steps.push({ type: 'uow', label: `Called Unit of Work “${uow.name}” via Meridian Proxy`, detail: uow.auth.mode });
  if (peer) steps.push({ type: 'delegate', label: `Requested help from ${peer.name} (${peer.title})` });
  // a step that needs human approval
  const risky = uows.find(u => u.auth.mode !== 'proxy-delegated');
  if (risky) steps.push({ type: 'approval', label: `Action on “${risky.name}” needs your approval`, needsApproval: true, uow: risky });
  return steps;
}

// Synthesize an activity timeline for a single task.
function taskTimeline(task) {
  const owner = USERS.find(u => u.id === task.owner);
  const items = [{ type: 'created', text: `Task created${owner ? ` by ${owner.name}` : ''}`, when: '3d ago' }];

  if (task.assigneeType === 'ai') {
    const ai = empById(task.assignee);
    const wf = ai ? employeeWorkflows(ai)[0] : null;
    const uows = ai ? uowsForEmployee(ai) : [];
    items.push({ type: 'assign', text: `Assigned to ${ai?.name || 'AI'} (${ai?.title || 'AI employee'})`, when: '3d ago' });
    if (wf) items.push({ type: 'workflow', text: `${ai.name} started workflow “${wf.name}”`, when: '2d ago' });
    if (uows[0]) items.push({ type: 'uow', text: `Called Unit of Work “${uows[0].name}” via Meridian Proxy`, when: '1d ago' });
    if (task.delegateTo && empById(task.delegateTo)) items.push({ type: 'delegate', text: `${ai.name} asked ${empById(task.delegateTo).name} for help`, when: '20h ago' });
    if (uows[1]) items.push({ type: 'uow', text: `Called Unit of Work “${uows[1].name}” via Meridian Proxy`, when: '6h ago' });
  } else {
    const human = USERS.find(u => u.id === task.assignee);
    items.push({ type: 'assign', text: `Assigned to ${human?.name || 'a person'}`, when: '3d ago' });
  }

  if (task.status === 'review' || task.status === 'done') items.push({ type: 'status', text: 'Moved to Review', when: '4h ago' });
  if (task.status === 'done') items.push({ type: 'done', text: 'Completed', when: '2h ago' });
  else items.push({ type: 'current', text: `Currently ${task.status.replace('-', ' ')}`, when: 'now' });
  return items;
}

function TaskTimeline({ task }) {
  const items = taskTimeline(task);
  const meta = {
    created: { icon: Plus, fg: '#6b7280', bg: '#f3f4f6' },
    assign: { icon: Bot, fg: '#2f79a8', bg: '#e8f2fb' },
    workflow: { icon: Workflow, fg: '#2f79a8', bg: '#e8f2fb' },
    uow: { icon: Boxes, fg: '#7c3aed', bg: '#f5f3ff' },
    delegate: { icon: UsersIcon, fg: '#059669', bg: '#ecfdf5' },
    status: { icon: Clock, fg: '#b45309', bg: '#fffbeb' },
    done: { icon: CheckCircle, fg: '#059669', bg: '#ecfdf5' },
    current: { icon: RefreshCw, fg: '#2f79a8', bg: '#e8f2fb' },
  };
  return (
    <div className="flex flex-col">
      <div className="text-xs font-semibold text-muted uppercase mb-2" style={{ letterSpacing: '0.05em' }}>Activity timeline</div>
      <div style={{ position: 'relative' }}>
        {items.map((it, i) => {
          const m = meta[it.type] || meta.created; const Icon = m.icon;
          const last = i === items.length - 1;
          return (
            <div key={i} className="flex gap-3" style={{ position: 'relative', paddingBottom: last ? 0 : 14 }}>
              {!last && <div style={{ position: 'absolute', left: 13, top: 26, bottom: 0, width: 2, background: 'var(--gray-200)' }} />}
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.bg, color: m.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                <Icon size={14} className={it.type === 'current' && task.status !== 'done' ? 'animate-spin' : ''} />
              </div>
              <div className="flex-1 flex items-center justify-between" style={{ minHeight: 28 }}>
                <span className="text-sm">{it.text}</span>
                <span className="text-xs text-muted">{it.when}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Departments
// ============================================================================
export function Departments({ go, toast }) {
  const { employees, tasks, unitsOfWork } = useStore();
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <DeptPage dept={selected} onBack={() => setSelected(null)} go={go} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <SectionTitle title="Departments" subtitle="Organization units, AI allocation and cost" />
        <button className="btn btn-primary" onClick={() => go('onboarding')}><Plus size={16} /> Onboard a new department</button>
      </div>
      <Card>
        <div className="table-wrap">
          <SortableTable
            rows={DEPARTMENTS.map(d => {
              const emps = employees.filter(e => e.dept === d);
              return {
                dept: d, count: emps.length,
                spend: emps.reduce((a, e) => a + monthlyCost(e), 0),
                active: tasks.filter(t => t.dept === d && t.status !== 'done').length,
                uows: unitsOfWork.filter(u => u.dept === d).length,
              };
            })}
            columns={[
              { key: 'dept', label: 'Department', get: r => r.dept },
              { key: 'count', label: 'AI Employees', get: r => r.count },
              { key: 'uows', label: 'Units of Work', get: r => r.uows },
              { key: 'spend', label: 'Monthly Cost', get: r => r.spend },
              { key: 'active', label: 'Active Tasks', get: r => r.active },
              { label: '' },
            ]}
            renderRow={r => (
              <tr key={r.dept} className="cursor-pointer" onClick={() => setSelected(r.dept)}>
                <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600"><Building2 size={16} /></div><span className="font-medium">{r.dept}</span></div></td>
                <td>{r.count}</td><td>{r.uows}</td><td>${r.spend.toLocaleString()}</td><td>{r.active}</td>
                <td><button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(r.dept); }}>View</button></td>
              </tr>
            )}
          />
        </div>
      </Card>
    </div>
  );
}

function DeptPage({ dept, onBack, go }) {
  const { employees, tasks, unitsOfWork } = useStore();
  const emps = employees.filter(e => e.dept === dept);
  const uows = unitsOfWork.filter(u => u.dept === dept);
  const spend = emps.reduce((a, e) => a + monthlyCost(e), 0);
  const active = tasks.filter(t => t.dept === dept && t.status !== 'done').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={16} /> Departments</button>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Building2 size={20} /></div>
        <div>
          <h1 className="m-0" style={{ fontSize: 26, letterSpacing: '-0.02em' }}>{dept}</h1>
          <div className="text-sm text-muted">Department overview — AI workforce, capabilities and automation</div>
        </div>
      </div>

      <div className="grid-cols-4" style={{ gap: 12 }}>
        <Stat2 label="AI Employees" value={emps.length} />
        <Stat2 label="Units of Work" value={uows.length} />
        <Stat2 label="Active Tasks" value={active} />
        <Stat2 label="Monthly Cost" value={`$${spend.toLocaleString()}`} />
      </div>

      {/* Units of Work */}
      <Card>
        <div className="card-header flex items-center justify-between">
          <h3 className="flex items-center gap-2"><Boxes size={16} className="text-purple-600" /> Units of Work <span className="badge">{uows.length}</span></h3>
          <button className="btn btn-outline btn-sm" onClick={() => go('unitofwork')}>Open Units of Work →</button>
        </div>
        <div className="card-body flex flex-col gap-2">
          {uows.map(u => (
            <div key={u.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-purple-50 flex items-center justify-center text-purple-600"><Boxes size={14} /></div>
                <div><div className="font-medium text-sm">{u.name}</div><div className="text-xs text-muted">{u.endpoint.method} {u.endpoint.path}</div></div>
              </div>
              <SecuredBadge>Secured</SecuredBadge>
            </div>
          ))}
          {uows.length === 0 && <div className="text-muted text-sm">No Units of Work extracted yet.</div>}
        </div>
      </Card>

      {/* AI Employees + their workflows */}
      <Card>
        <div className="card-header flex items-center justify-between">
          <h3 className="flex items-center gap-2"><Bot size={16} className="text-blue-600" /> AI Employees <span className="badge">{emps.length}</span></h3>
          <button className="btn btn-outline btn-sm" onClick={() => go('employees')}>Open AI Employees →</button>
        </div>
        <div className="card-body flex flex-col gap-3">
          {emps.map(e => {
            const wfs = employeeWorkflows(e);
            return (
              <div key={e.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><AgentAvatar id={e.id} name={e.name} size={28} /><div><div className="font-medium">{e.name}</div><div className="text-xs text-muted">{e.title}</div></div></div>
                  <Pill label={e.status} tone={statusTone(e.status)} />
                </div>
                <div className="mt-3">
                  <div className="text-xs uppercase text-muted font-semibold mb-1" style={{ letterSpacing: '0.05em' }}>Workflows extracted</div>
                  {wfs.length === 0 ? (
                    <div className="text-xs text-muted">No workflows extracted yet.</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {wfs.map(w => (
                        <div key={w.id} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center gap-2"><Workflow size={14} className="text-muted" /> {w.name}</div>
                          <div className="flex items-center gap-2">
                            <Pill label={w.trigger} tone={w.trigger === 'proactive' ? 'purple' : 'info'} />
                            {w.schedule && <span className="text-xs text-muted flex items-center gap-1"><Calendar size={12} /> {w.schedule}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {emps.length === 0 && <div className="text-muted text-sm">No AI employees yet — onboard this department to extract workflows.</div>}
        </div>
      </Card>
    </div>
  );
}

function Stat2({ label, value }) {
  return <div className="p-3 rounded-lg bg-gray-50 border"><div className="text-xs text-muted">{label}</div><div className="text-xl font-bold">{value}</div></div>;
}

// ============================================================================
// Org Twin (simplified + clickable departments)
// ============================================================================
// ============================================================================
// AI Employees — list, conversation, onboarding wizard
// ============================================================================
export function Employees({ role, user, toast }) {
  const store = useStore();
  const { employees, tasks } = store;
  const [search, setSearch] = useState('');
  const [chatEmp, setChatEmp] = useState(null);
  const [wizard, setWizard] = useState(false);
  const [callEmp, setCallEmp] = useState(null);
  const [memEmp, setMemEmp] = useState(null);

  const [openDepts, setOpenDepts] = useState({});

  const data = role === 'admin' ? employees : employees.filter(e => e.dept === user.dept);
  const filtered = data.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.title.toLowerCase().includes(search.toLowerCase()));

  // Organization → Departments → AI employees
  const byDept = {};
  filtered.forEach(e => { (byDept[e.dept] = byDept[e.dept] || []).push(e); });
  const deptList = DEPARTMENTS.filter(d => byDept[d]?.length);
  const searching = search.trim().length > 0;
  const isDeptOpen = (d) => searching || !!openDepts[d];
  const toggleDept = (d) => setOpenDepts(o => ({ ...o, [d]: !o[d] }));

  if (chatEmp) {
    const emp = employees.find(e => e.id === chatEmp);
    return (
      <>
        <EmployeeConsole emp={emp} user={user} onBack={() => setChatEmp(null)} toast={toast}
          onOpenMemory={() => setMemEmp(emp)} />
        {memEmp && <MemoryExplorer emp={memEmp} onClose={() => setMemEmp(null)} />}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <SectionTitle title="AI Employees" subtitle="Your AI workforce — open one to converse with it or review its workflows" />
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input className="search-input has-icon w-64" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." />
          </div>
          <button className="btn btn-primary" onClick={() => setWizard(true)}><Plus size={16} /> Onboard AI Employee</button>
        </div>
      </div>

      <Card className="flex-1 overflow-y-auto">
        {deptList.length === 0 ? (
          <div className="card-body text-muted text-sm">No AI employees match “{search}”.</div>
        ) : (
          <div className="org-tree">
            <div className="org-root-node">
              <div className="org-ic"><Network size={18} /></div>
              <div>
                <div className="font-semibold">Organization</div>
                <div className="text-xs text-muted">{deptList.length} department{deptList.length > 1 ? 's' : ''} · {filtered.length} AI employee{filtered.length > 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="org-depts">
              {deptList.map(d => {
                const emps = byDept[d];
                const open = isDeptOpen(d);
                return (
                  <div key={d} className="org-dept">
                    <button className="org-dept-head" onClick={() => toggleDept(d)}>
                      <ChevronDown size={15} className="text-muted" style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                      <Building2 size={16} className="text-muted" />
                      <span className="font-medium">{d}</span>
                      <span className="badge">{emps.length}</span>
                    </button>
                    {open && (
                      <div className="org-emps">
                        {emps.map(e => (
                          <div key={e.id} className="org-emp" onClick={() => setChatEmp(e.id)} title={`Open ${e.name}`}>
                            <AgentAvatar id={e.id} name={e.name} size={34} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{e.name}</div>
                              <div className="text-xs text-muted truncate">{e.title} · {modelById(e.model).name} · {e.tasks_completed.toLocaleString()} tasks</div>
                            </div>
                            <AgentStatus e={e} tasks={tasks} />
                            <div className="flex items-center gap-2">
                              <button className="btn btn-call btn-sm" disabled={e.status !== 'active'} title={e.status === 'active' ? `Call ${e.name}` : `${e.name} is ${e.status}`} onClick={(ev) => { ev.stopPropagation(); setCallEmp(e); }}><Phone size={14} /> Call</button>
                              <button className="btn btn-outline btn-sm" title={`View ${e.name}'s memory`} onClick={(ev) => { ev.stopPropagation(); setMemEmp(e); }}><Brain size={14} /> Memory</button>
                              <button className="btn btn-outline btn-sm" onClick={(ev) => { ev.stopPropagation(); setChatEmp(e.id); }}><MessageSquare size={14} /> Message</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {wizard && <OnboardWizard role={role} user={user} onClose={() => setWizard(false)} toast={toast} />}
      {callEmp && <CallModal emp={callEmp} user={user} onClose={() => setCallEmp(null)} />}
      {memEmp && <MemoryExplorer emp={memEmp} onClose={() => setMemEmp(null)} />}
    </div>
  );
}

// ---- Employee console: Conversation + Activity + Profile -------------------
function EmployeeConsole({ emp, user, onBack, toast, onOpenMemory }) {
  const { addApproval, tasks, createTask } = useStore();
  const [tab, setTab] = useState('chat');
  const [assignOpen, setAssignOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  if (!emp) return null;

  const callable = emp.status === 'active';

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <AgentAvatar id={emp.id} name={emp.name} size={40} />
        <div className="flex-1">
          <h2 className="m-0">{emp.name}</h2>
          <div className="text-sm text-muted">{emp.title} · {emp.dept} · <Pill label={emp.status} tone={statusTone(emp.status)} /></div>
        </div>
        <button className="btn btn-call" disabled={!callable} title={callable ? `Call ${emp.name}` : `${emp.name} is ${emp.status}`} onClick={() => setCallOpen(true)}><Phone size={16} /> Call</button>
        <button className="btn btn-outline" onClick={() => onOpenMemory?.()}><Brain size={16} /> Memory</button>
        <button className="btn btn-primary" onClick={() => setAssignOpen(true)}><ListChecks size={16} /> Assign Task</button>
        <div className="seg">
          <button className={tab === 'activity' ? 'on' : ''} onClick={() => setTab(t => t === 'activity' ? 'chat' : 'activity')}>Activity</button>
          <button className={tab === 'profile' ? 'on' : ''} onClick={() => setTab(t => t === 'profile' ? 'chat' : 'profile')}>Profile</button>
        </div>
      </div>

      {tab === 'chat' && <EmployeeChat emp={emp} user={user} addApproval={addApproval} toast={toast} />}
      {tab === 'activity' && <EmployeeActivity emp={emp} tasks={tasks} />}
      {tab === 'profile' && <EmployeeProfile emp={emp} onOpenMemory={onOpenMemory} />}

      {assignOpen && (
        <AssignToEmployeeModal emp={emp} user={user} onClose={() => setAssignOpen(false)}
          createTask={createTask} toast={toast} onAssigned={() => setTab('activity')} />
      )}
      {callOpen && <CallModal emp={emp} user={user} onClose={() => setCallOpen(false)} />}
    </div>
  );
}

// Synchronous audio call with an AI employee — a believable live-call overlay
// to complement the asynchronous Inbox/chat.
const CALL_SCRIPT = [
  { who: 'ai', text: 'Hi {firstName}, {name} here — I’m on. What do you need?' },
  { who: 'me', text: 'Give me a quick status on the rent roll sweep.' },
  { who: 'ai', text: 'Running it now… last night’s sweep cleared 318 units. Two delinquencies need your sign-off.' },
  { who: 'me', text: 'Go ahead and open work orders for the maintenance backlog.' },
  { who: 'ai', text: 'On it — I’ll route those through the Meridian Proxy and send approvals to your Inbox.' },
];

export function CallModal({ emp, user, onClose }) {
  const firstName = (user?.name || '').split(' ')[0];
  const [state, setState] = useState('connecting'); // connecting → live → ended
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setState('live'), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (state !== 'live') return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => {
    if (state !== 'live') return;
    if (turn >= CALL_SCRIPT.length) return;
    const id = setTimeout(() => setTurn(t => t + 1), turn === 0 ? 600 : 2600);
    return () => clearTimeout(id);
  }, [state, turn]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const transcript = CALL_SCRIPT.slice(0, turn).map((l, i) => ({ ...l, text: l.text.replace('{firstName}', firstName).replace('{name}', emp.name), key: i }));
  const speaking = state === 'live' && turn > 0 && turn <= CALL_SCRIPT.length && CALL_SCRIPT[turn - 1]?.who === 'ai';

  const end = () => { setState('ended'); setTimeout(onClose, 700); };

  return (
    <div className="call-overlay">
      <div className="call-card">
        <div className="call-status">
          {state === 'connecting' && <span className="text-muted text-sm">Connecting…</span>}
          {state === 'live' && <span className="call-live"><span className="call-dot" /> Live · {fmt(secs)}</span>}
          {state === 'ended' && <span className="text-muted text-sm">Call ended</span>}
        </div>

        <div className={`call-avatar ${speaking ? 'speaking' : ''}`}>
          <AgentAvatar id={emp.id} name={emp.name} size={96} />
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold">{emp.name}</div>
          <div className="text-sm text-muted">{emp.title} · {emp.dept}</div>
        </div>

        <div className="call-wave">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className={`call-bar ${speaking && !muted ? 'on' : ''}`} style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>

        <div className="call-transcript">
          {transcript.length === 0 && state === 'live' && <div className="text-xs text-muted text-center">Listening…</div>}
          {transcript.map(l => (
            <div key={l.key} className={`call-line ${l.who}`}>
              <span className="call-line-who">{l.who === 'ai' ? emp.name : firstName}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>

        <div className="call-controls">
          <button className={`call-btn ${muted ? 'active' : ''}`} onClick={() => setMuted(m => !m)} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button className="call-btn end" onClick={end} title="End call"><PhoneOff size={22} /></button>
        </div>
        <div className="text-[11px] text-muted text-center">Synchronous voice channel · simulated for the prototype</div>
      </div>
    </div>
  );
}

function EmployeeActivity({ emp, tasks }) {
  const items = employeeActivity(emp, tasks);
  const loading = useFakeLoad([emp.id]);
  const meta = {
    workflow: { icon: Workflow, bg: '#e8f2fb', fg: '#2f79a8' },
    uow: { icon: Boxes, bg: '#f5f3ff', fg: '#7c3aed' },
    task: { icon: ListChecks, bg: '#ecfdf5', fg: '#059669' },
    delegate: { icon: UsersIcon, bg: '#ecfdf5', fg: '#059669' },
    approval: { icon: ShieldCheck, bg: '#fffbeb', fg: '#b45309' },
    memory: { icon: Brain, bg: '#f5f3ff', fg: '#7c3aed' },
    error: { icon: RefreshCw, bg: '#fef2f2', fg: '#dc2626' },
  };
  return (
    <Card className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
      <div className="card-header"><h3>Recent Activity</h3><span className="text-xs text-muted">What {emp.name} has done so far</span></div>
      <div className="card-body flex flex-col gap-0">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < 7 ? '1px solid var(--gray-100)' : 'none' }}>
              <Skeleton w={28} h={28} radius={8} />
              <div className="flex-1"><Skeleton w={`${55 + (i * 7) % 35}%`} h={12} /></div>
              <Skeleton w={42} h={10} />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-muted text-sm">No activity yet.</div>
        ) : items.map((it, i) => {
          const m = meta[it.type] || meta.workflow; const Icon = m.icon;
          return (
            <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < items.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
              <div className="step-row" style={{ padding: 0, border: 'none' }}>
                <div className="ico" style={{ background: m.bg, color: m.fg }}><Icon size={14} /></div>
              </div>
              <div className="flex-1 text-sm">{it.text}</div>
              <div className="text-xs text-muted">{it.when}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AssignToEmployeeModal({ emp, user, onClose, createTask, toast, onAssigned }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const submit = () => {
    if (!title.trim()) return;
    createTask({ title, priority, dept: emp.dept, dueDate: '2026-07-01', owner: user.id, assigneeType: 'ai', assignee: emp.id, status: 'in-progress' });
    toast(`Task assigned to ${emp.name}`, 'success');
    onAssigned?.(); onClose();
  };
  return (
    <Modal open onClose={onClose} title={`Assign a task to ${emp.name}`}>
      <div className="flex flex-col gap-4">
        <Note icon={Bot}>{emp.name} ({emp.title}) will pick this up and run the relevant workflow. You’ll see it appear under Activity.</Note>
        <Field label="Task"><textarea className="search-input" style={{ minHeight: 96, resize: 'vertical', lineHeight: 1.5 }} value={title} onChange={e => setTitle(e.target.value)} placeholder={`e.g. ${emp.dept === 'Finance' ? 'Reconcile June rent batch' : 'Generate rent roll for Maple Court'}`} /></Field>
        <Field label="Priority"><Select value={priority} onChange={setPriority} options={['low', 'medium', 'high', 'critical']} /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!title.trim()} onClick={submit}>Assign</button>
        </div>
      </div>
    </Modal>
  );
}

// Build a believable result the employee returns after running the work.
function synthesizeAnswer(emp, question, { wf, uows, peer, approval }) {
  const used = uows.slice(0, 2);
  const minsSaved = uows.reduce((s, u) => s + (u.mapping.manualMinutes - u.mapping.automatedMinutes), 0);
  const costSaved = uows.reduce((s, u) => s + (u.mapping.manualCostUsd - u.mapping.automatedCostUsd), 0);
  // deterministic-but-varied record count from the employee + question
  const records = 4 + ((emp.name.length + question.length) % 17);
  const bullets = [];
  if (wf) bullets.push({ icon: 'workflow', label: 'Workflow executed', value: wf.name });
  if (used.length) bullets.push({ icon: 'uow', label: 'Units of Work called', value: used.map(u => u.name).join(' · ') });
  bullets.push({ icon: 'records', label: 'Records processed', value: `${records} ${emp.dept === 'Finance' ? 'ledger entries' : 'records'}` });
  if (peer) bullets.push({ icon: 'delegate', label: 'Collaborated with', value: `${peer.name} (${peer.title})` });
  const summary = approval
    ? `I've prepared everything for “${question}” and ran the read-only steps. One action — calling “${approval.uow.name}” — needs your approval before I can complete it. I've routed that to you.`
    : `Done. I handled “${question}” end-to-end through my ${wf ? `“${wf.name}” workflow` : 'workflows'} and everything came back clean.`;
  return { summary, bullets, minsSaved: Math.max(minsSaved, 1), costSaved: Math.max(costSaved, 0.5), approval: !!approval };
}

function AnswerCard({ answer, approved }) {
  const meta = {
    workflow: { icon: Workflow, fg: '#5b60c2', bg: '#eef0fc' },
    uow: { icon: Boxes, fg: '#7c6fd0', bg: '#f4f2fc' },
    records: { icon: ListChecks, fg: '#2f9a72', bg: '#eef9f3' },
    delegate: { icon: UsersIcon, fg: '#2f9a72', bg: '#eef9f3' },
  };
  const awaiting = answer.approval && !approved;
  return (
    <div className="step-trace" style={{ marginTop: 10, background: 'var(--surface, rgba(255,255,255,0.9))' }}>
      <div className="px-3 py-2 text-xs font-semibold uppercase" style={{ background: 'var(--grad-aurora)', borderBottom: '1px solid var(--gray-200)', letterSpacing: '0.05em', color: 'var(--blue-700)' }}>
        {awaiting ? 'Result · awaiting approval' : answer.approval ? 'Result · approved' : 'Result'}
      </div>
      <div className="px-3 py-3 text-sm" style={{ lineHeight: 1.55 }}>
        {answer.summary}
        {answer.approval && approved && <div className="flex items-center text-green-600 font-medium" style={{ gap: 5, marginTop: 8 }}><CheckCircle size={14} /> You approved this — completing now.</div>}
      </div>
      {answer.bullets.map((b, i) => {
        const m = meta[b.icon] || meta.workflow; const Icon = m.icon;
        return (
          <div key={i} className="step-row">
            <div className="ico" style={{ background: m.bg, color: m.fg }}><Icon size={13} /></div>
            <div className="flex-1"><span className="text-muted">{b.label}: </span><span className="font-medium">{b.value}</span></div>
          </div>
        );
      })}
      <div className="step-row" style={{ background: 'var(--grad-aurora)' }}>
        <div className="ico" style={{ background: '#eef9f3', color: '#2f9a72' }}><Zap size={13} /></div>
        <div className="flex-1 text-sm">Saved <strong>{answer.minsSaved} min</strong> and <strong>${answer.costSaved.toFixed(1)}</strong> vs. doing this manually.</div>
      </div>
    </div>
  );
}

// Horizontal capabilities every AI employee exposes in its chat.
const CAPABILITIES = [
  { id: 'summarize',   label: 'Summarize',  icon: FileText,   prompt: 'Summarize what you did today in a few bullets', hint: 'Summarize recent activity' },
  { id: 'answer',      label: 'Answer',     icon: MessageSquare, prompt: 'What needs my attention or approval right now?', hint: 'Quick answer to a question' },
  { id: 'infographic', label: 'Infographic', icon: BarChart3,  prompt: 'Generate an infographic of your impact', hint: 'Generate a visual impact infographic' },
  { id: 'analyze',     label: 'Analyze',    icon: TrendingUp,  prompt: 'Analyze recent trends in my work and flag any risks', hint: 'Analyze trends & risks' },
];

// Infer the kind of response a typed/sent message should produce, so a populated
// capability prompt still renders the right result when the user hits send.
// Only genuine work requests trigger the full step-trace + result card; greetings,
// thanks, acknowledgements and plain questions get a short conversational reply.
function detectKind(text) {
  const t = text.toLowerCase().trim();
  if (/infographic|chart|visual|graph/.test(t)) return 'infographic';
  if (/\bemail\b|stakeholder|draft (a |an )?(note|message|update)/.test(t)) return 'email';
  if (/^(hi|hey+|hello+|yo|sup|hiya|howdy|gm|good (morning|afternoon|evening))\b/.test(t)
    || /\b(you (there|around|up|online)|are you (there|online|available|busy|free))\b/.test(t)) return 'greeting';
  if (/^(thanks|thank you|thx|ty|cheers|appreciate|nice|great|awesome|amazing|perfect|cool|love it|good (job|work|stuff)|well done|brilliant)\b/.test(t)) return 'thanks';
  if (/^(ok|okay|kk?|got it|sounds good|sg|yep|yeah|yes|no|nope|sure|alright|right|fine|np)[\s.!]*$/.test(t)) return 'ack';
  // Explicit work verbs → run the workflow and show the result card.
  if (/\b(run|execute|kick off|call|reconcile|generate|dispatch|process|audit|review|sync|pull|file|schedule|draft|create|prepare|update|handle|fix|resolve|escalate|approve|onboard|analy[sz]e|summari[sz]e)/.test(t)) return 'answer';
  // Work-intent nouns (status / approvals / backlog queries) → result card too.
  if (/\b(attention|approval|sign[- ]?off|pending|blocker|status|queue|today|backlog|outstanding|waiting on|to-?do)\b/.test(t)) return 'answer';
  // A plain question with no work verb → a direct conversational answer.
  if (t.endsWith('?') || /^(what|why|how|when|who|where|which|can you|could you|would you|do you|did you|is there|are there|any |whats|what's)\b/.test(t)) return 'reply';
  // Short, non-work chatter → keep it conversational.
  if (t.split(/\s+/).length <= 4) return 'reply';
  return 'answer';
}

// Short conversational replies for non-work messages (greetings, thanks, etc.),
// varied per employee so they don't read like a canned bot.
function conversationalReply(emp, kind, text, firstName) {
  const h = hashStr(emp.id + text);
  const pick = (arr) => arr[h % arr.length];
  if (kind === 'greeting') return pick([
    `Hey ${firstName} — ${emp.name} here, online and ready. What do you need?`,
    `Hi ${firstName}! I'm around. Want me to run something or pull a quick status?`,
    `Right here, ${firstName}. ${emp.title} on standby — what can I take off your plate?`,
    `Yep, I'm on. Give me a task and I'll handle the ${emp.dept} side of it.`,
  ]);
  if (kind === 'thanks') return pick([
    `Anytime, ${firstName} — happy to help.`,
    `You got it. I'll keep an eye on things and flag anything that needs you.`,
    `My pleasure. Ping me whenever you want another run.`,
  ]);
  if (kind === 'ack') return pick([
    `👍 Standing by — just say the word.`,
    `Got it. I'll be here if anything else comes up.`,
    `Understood. I'll hold here until you need me.`,
  ]);
  // 'reply' — a plain question with no work verb.
  return pick([
    `Good question, ${firstName}. I can dig into that — want me to run my ${emp.title.toLowerCase()} workflow and pull the details?`,
    `Happy to look into it. Say the word and I'll process the relevant records and report back.`,
    `I can answer that properly by running the actual check — want me to kick it off?`,
  ]);
}

// Derive a believable impact infographic from the employee's effectiveness data.
function buildInfographic(emp) {
  const eff = effectiveness(emp);
  const uo = uowsForEmployee(emp).length;
  const wf = employeeWorkflows(emp).length;
  return {
    title: `${emp.name} · impact snapshot`,
    footer: `${uo} units of work · ${wf} workflows · ${emp.dept}`,
    tiles: [
      { label: 'Tasks completed', value: eff.tasksCompleted.toLocaleString() },
      { label: 'Time saved', value: `${eff.timeSavedHours.toLocaleString()}h` },
      { label: 'Cost saved', value: `$${eff.costSaved.toLocaleString()}` },
      { label: 'Effectiveness', value: `${eff.effectivenessPct}%` },
    ],
    bars: [
      { label: 'Automation effectiveness', pct: Math.max(4, eff.effectivenessPct) },
      { label: 'Quality uplift', pct: Math.max(4, eff.qualityUpliftPct) },
      { label: 'Capability coverage', pct: Math.min(100, (uo + wf) * 12) },
    ],
  };
}

function CapabilityBar({ onRun }) {
  return (
    <div className="cap-bar">
      <span className="cap-bar-label"><Sparkles size={13} /> Capabilities</span>
      {CAPABILITIES.map(c => {
        const Icon = c.icon;
        return (
          <button key={c.id} className="cap-btn" title={c.hint} onClick={() => onRun(c)}>
            <Icon size={14} /> {c.label}
          </button>
        );
      })}
    </div>
  );
}

function InfographicCard({ data }) {
  return (
    <div className="infographic">
      <div className="ig-head"><BarChart3 size={14} /> {data.title}</div>
      <div className="ig-tiles">
        {data.tiles.map(t => (
          <div key={t.label} className="ig-tile">
            <div className="ig-tile-val">{t.value}</div>
            <div className="ig-tile-label">{t.label}</div>
          </div>
        ))}
      </div>
      <div className="ig-bars">
        {data.bars.map(b => (
          <div key={b.label} className="ig-bar-row">
            <span className="ig-bar-label">{b.label}</span>
            <div className="ig-bar"><div className="ig-bar-fill" style={{ width: `${b.pct}%` }} /></div>
            <span className="ig-bar-pct">{b.pct}%</span>
          </div>
        ))}
      </div>
      <div className="ig-foot">{data.footer}</div>
    </div>
  );
}

// Compose a believable stakeholder-update email from the employee's real data.
function buildEmail(emp) {
  const wf = employeeWorkflows(emp)[0];
  const eff = effectiveness(emp);
  return {
    to: `${emp.dept} stakeholders`,
    subject: `${emp.dept} update — ${wf ? wf.name : emp.title} progress`,
    body: [
      'Hi team,',
      `Quick update from ${emp.name} (${emp.title}). I've completed ${eff.tasksCompleted.toLocaleString()} tasks this cycle${wf ? ` and ran the “${wf.name}” workflow end-to-end` : ''}, saving roughly ${eff.timeSavedHours.toLocaleString()} hours and $${eff.costSaved.toLocaleString()} versus the manual process.`,
      'No blockers right now — I’ll route anything that needs sign-off to your Approvals inbox.',
      'Best,',
      emp.name,
    ],
  };
}

function EmailCard({ email, toast }) {
  return (
    <div className="email-card">
      <div className="email-head"><Mail size={14} /> Drafted email</div>
      <div className="email-meta"><span>To</span><div>{email.to}</div></div>
      <div className="email-meta"><span>Subject</span><div className="font-medium">{email.subject}</div></div>
      <div className="email-body">{email.body.map((p, i) => <p key={i} style={{ margin: i ? '8px 0 0' : 0 }}>{p}</p>)}</div>
      <div className="email-actions">
        <button className="btn btn-outline btn-sm" onClick={() => toast?.('Draft copied to clipboard', 'success')}>Copy</button>
        <button className="btn btn-primary btn-sm" onClick={() => toast?.('Email sent', 'success')}><Send size={13} /> Send</button>
      </div>
    </div>
  );
}

// Deterministic per-employee hash so the seeded history is stable but varies
// between employees.
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Pre-seeded conversation so every employee chat looks lived-in. The questions,
// AI phrasing, exchange types, order and length all vary per employee, while
// still showcasing the different response kinds (plain, result card, infographic,
// email, awaiting-approval, peer hand-off).
function seedHistory(emp, employees) {
  const wf = employeeWorkflows(emp)[0];
  const uows = uowsForEmployee(emp);
  const peer = employees.find(e => e.dept === emp.dept && e.id !== emp.id && e.status === 'active');
  const h = hashStr(emp.id);
  const pick = (arr, salt = 0) => arr[(h + salt) % arr.length];
  const cap = (uows[0]?.name) || 'my core capability';
  const wfName = wf ? wf.name : `${emp.dept} operations`;

  // Exchange builders, keyed by type. Each returns [userMsg-ish, aiMsg-ish] minus ids.
  const build = {
    intro: () => [
      { role: 'user', text: pick([
        `What's on your plate for ${emp.dept} today?`,
        `Quick status on the “${wfName}” run?`,
        `How's the overnight ${emp.dept.toLowerCase()} queue looking?`,
        `Catch me up — anything in the queue I should know about?`,
      ], 1) },
      { role: 'ai', text: wf
        ? pick([
            `Morning! I'm mid-way through my “${wf.name}” workflow and clearing the overnight queue — most of it routes through “${cap}”.`,
            `Hey! Running “${wf.name}” right now and working the backlog. I'll ping you if anything needs sign-off.`,
            `On it as we speak — “${wf.name}” is processing and the queue's about half cleared.`,
          ], 2)
        : pick([
            `Morning! Clearing the overnight queue and keeping ${emp.dept} moving.`,
            `Hey! Working the backlog for ${emp.dept} — nothing blocking so far.`,
          ], 2) },
    ],
    summary: () => {
      const q = pick([
        `Recap last night's “${wfName}” run — how many records and what did it save us?`,
        `What did you close out yesterday, and how much time did it save?`,
        `Summarize this week's ${emp.dept.toLowerCase()} work and the savings so far`,
        `Quick recap of the last run through “${cap}”?`,
      ], 3);
      return [
        { role: 'user', text: q },
        { role: 'ai', text: pick(["Here's where it landed:", 'Sure — quick recap:', "Here's the rundown:"], 4), answer: synthesizeAnswer(emp, q, { wf, uows, peer, approval: null }) },
      ];
    },
    approval: () => {
      if (!uows[0]) return build.summary();
      const q = pick([
        `Go ahead and process the pending ${emp.dept.toLowerCase()} batch through “${cap}”`,
        `Action the items waiting on my sign-off and route anything risky to me`,
        `Push through the rest of the “${wfName}” queue`,
      ], 5);
      return [
        { role: 'user', text: q },
        { role: 'ai', text: pick(['Most of it is done — one step needs your sign-off:', 'Handled the read-only steps; one action needs approval:'], 6), answer: synthesizeAnswer(emp, q, { wf, uows, peer, approval: { uow: uows[0] } }) },
      ];
    },
    infographic: () => [
      { role: 'user', text: pick(['Show me an infographic of your impact', 'Can you visualize how you’re doing this month?', 'Put your numbers into a quick chart', 'Give me a visual of your impact'], 7) },
      { role: 'ai', text: pick(['Sure — a visual snapshot:', 'Here you go:', 'Visualized below:'], 8), infographic: buildInfographic(emp) },
    ],
    email: () => [
      { role: 'user', text: pick(['Draft an email update I can send to stakeholders', 'Write a status email I can forward to leadership', 'Put together an email summary for the team', 'Draft a note to stakeholders about this week'], 9) },
      { role: 'ai', text: pick(["Done — here's a draft you can send:", 'Drafted below — tweak as needed:', "Here's a ready-to-send draft:"], 10), email: buildEmail(emp) },
    ],
    peer: () => {
      if (!peer) return build.intro();
      return [
        { role: 'user', text: pick([`Are you coordinating with ${peer.name} on this?`, `Loop in ${peer.name} if you need to`, `How's the hand-off with ${peer.name}?`], 11) },
        { role: 'ai', text: pick([
            `Yep — I've looped in ${peer.name} (${peer.title}). They're picking up the downstream steps and I'll consolidate the results.`,
            `Already coordinating with ${peer.name}. I pass the cleared items over and they handle the follow-through.`,
          ], 12) },
      ];
    },
  };

  // A few distinct scripts (vary order, length, and which types appear).
  const scripts = [
    ['intro', 'summary', 'infographic', 'email'],
    ['intro', 'approval', 'infographic', 'email'],
    ['summary', 'peer', 'infographic', 'email'],
    ['intro', 'summary', 'email'],
    ['intro', 'peer', 'approval', 'infographic'],
    ['intro', 'infographic', 'summary', 'email'],
    ['approval', 'email', 'infographic'],
  ];
  const script = scripts[h % scripts.length];

  const msgs = [];
  let n = 0;
  script.forEach(type => {
    build[type]().forEach(m => { msgs.push({ id: `${emp.id}-h${n++}`, ...m }); });
  });
  return msgs;
}

// Skeleton placeholder shown after a capability / send button is clicked, while
// the result loads. Mirrors the shape of the result that's coming.
function ChatSkeleton({ kind }) {
  if (kind === 'infographic') {
    return (
      <div className="skeleton-card" style={{ width: 460, maxWidth: '100%' }}>
        <Skeleton w="100%" h={34} radius={0} />
        <div className="ig-tiles">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="ig-tile">
              <Skeleton w="55%" h={22} />
              <Skeleton w="80%" h={10} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
        <div className="ig-bars">
          {[0, 1, 2].map(i => (
            <div key={i} className="ig-bar-row">
              <Skeleton w={150} h={10} />
              <Skeleton w="100%" h={9} radius={999} />
              <Skeleton w={30} h={10} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="skeleton-lines" style={{ maxWidth: 360, width: '70%', paddingTop: 4 }}>
      <Skeleton w="90%" h={12} />
      <Skeleton w="75%" h={12} />
      <Skeleton w="55%" h={12} />
    </div>
  );
}

export function EmployeeChat({ emp, user, addApproval, toast, seedQuestion, seedQuestions }) {
  const { employees, resolveApproval } = useStore();
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState(() => {
    const base = seedHistory(emp, employees);
    // Any questions this employee raised surface as the latest turns, so the
    // chat doubles as the inbox of things waiting on the human.
    const qs = seedQuestions || (seedQuestion ? [seedQuestion] : []);
    qs.forEach((q, i) => base.push({ id: Date.now() + i, role: 'ai', raised: true, qTitle: q.title, qBody: q.body, urgency: q.urgency }));
    return base;
  });
  const [thinking, setThinking] = useState(false);
  const [pendingKind, setPendingKind] = useState('answer'); // shape of the skeleton loader
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const firstName = (user?.name || 'there').split(' ')[0];
  const model = modelById(emp.model);
  const hasConvo = msgs.length > 0;
  useEffect(() => { bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight); }, [msgs, thinking]);

  const suggestions = (() => {
    const wfs = employeeWorkflows(emp); const uows = uowsForEmployee(emp);
    const out = [];
    if (wfs[0]) out.push(`Run my “${wfs[0].name}” workflow`);
    if (uows[0]) out.push(`Call “${uows[0].name}” now`);
    out.push('Summarize what you did today');
    out.push('What needs my approval?');
    return out.slice(0, 4);
  })();

  const send = (textArg) => {
    const text = (textArg ?? input).trim();
    if (!text || thinking) return;
    const userMsg = { id: Date.now(), role: 'user', text };
    setInput('');
    setMsgs(m => [...m, userMsg]);
    const kind = detectKind(text);
    setPendingKind(kind === 'infographic' ? 'infographic' : 'answer');
    setThinking(true);
    // Conversational messages (greeting / thanks / ack / plain question) get a
    // short reply — no workflow run, no result card.
    if (kind === 'greeting' || kind === 'thanks' || kind === 'ack' || kind === 'reply') {
      const reply = conversationalReply(emp, kind, text, firstName);
      setTimeout(() => {
        setThinking(false);
        setMsgs(m => [...m, { id: Date.now() + 1, role: 'ai', text: reply }]);
      }, 700);
      return;
    }
    // Card-style responses (infographic / email) skip the step trace.
    if (kind === 'infographic') {
      const data = buildInfographic(emp);
      setTimeout(() => {
        setThinking(false);
        setMsgs(m => [...m, { id: Date.now() + 1, role: 'ai', text: `Here's a visual snapshot of my impact, ${firstName}:`, infographic: data }]);
      }, 1300);
      return;
    }
    if (kind === 'email') {
      const email = buildEmail(emp);
      setTimeout(() => {
        setThinking(false);
        setMsgs(m => [...m, { id: Date.now() + 1, role: 'ai', text: `Here's a draft you can send, ${firstName}:`, email }]);
      }, 1300);
      return;
    }
    const steps = buildAgentSteps(emp, employees);
    const wf = employeeWorkflows(emp)[0];
    const uows = uowsForEmployee(emp);
    const peer = employees.find(e => e.dept === emp.dept && e.id !== emp.id && e.status === 'active');
    const ap = steps.find(s => s.needsApproval);
    const apId = ap ? `app-chat-${Date.now()}` : null;
    if (ap) ap.approvalId = apId;
    const answer = synthesizeAnswer(emp, text, { wf, uows, peer, approval: ap });
    const aiMsg = { id: Date.now() + 1, role: 'ai', text: `On it — here's how I'm handling “${text}”:`, steps, answer };
    setTimeout(() => {
      setThinking(false);
      setMsgs(m => [...m, aiMsg]);
      if (ap) {
        addApproval({
          id: apId,
          title: `${emp.name}: action on “${ap.uow.name}”`,
          type: 'config', risk: 'medium', dept: emp.dept, requestedBy: emp.id, ownerId: user.id,
          detail: `${emp.name} needs approval to call the “${ap.uow.name}” Unit of Work while handling your request.`,
        });
        toast('Approval routed to you — approve it right here or in Approvals', 'info');
      }
    }, 1500);
  };

  // Approve an action inline from the step trace.
  const approveInline = (step) => {
    if (step?.approvalId) resolveApproval(step.approvalId);
    toast(`Approved — ${emp.name} can complete the action.`, 'success');
  };

  // A capability click just populates the composer with its prompt — the user
  // reviews and sends it themselves (send() then renders the matching response).
  const runCapability = (cap) => {
    setInput(cap.prompt);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <Card className="flex-1 chat-wrap min-h-[460px]">
      {!hasConvo ? (
        <div className="gem-hero" style={{ background: 'var(--grad-aurora)' }}>
          <AgentAvatar id={emp.id} name={emp.name} size={56} />
          <div className="flex flex-col gap-1 items-center">
            <div className="gem-greet">What's the plan, {firstName}?</div>
            <div className="gem-greet-sub">{emp.name} · {emp.title} · {emp.dept}</div>
          </div>
          <ChatComposer emp={emp} model={model} input={input} setInput={setInput} send={send} inputRef={inputRef} />
          <CapabilityBar onRun={runCapability} />
          <div className="gem-chips">
            {suggestions.map(s => <button key={s} className="gem-chip" onClick={() => send(s)}>{s}</button>)}
          </div>
        </div>
      ) : (
        <>
          <div className="chat-body" ref={bodyRef}>
            {msgs.map(m => <ChatMessage key={m.id} m={m} emp={emp} toast={toast} onApprove={approveInline} />)}
            {thinking && (
              <div className="chat-row ai">
                <ChatSkeleton kind={pendingKind} />
              </div>
            )}
          </div>
          <div className="gem-dock">
            <CapabilityBar onRun={runCapability} />
            <ChatComposer emp={emp} model={model} input={input} setInput={setInput} send={send} inputRef={inputRef} />
          </div>
        </>
      )}
    </Card>
  );
}

function ChatMessage({ m, emp, toast, onApprove }) {
  // Hold the result/answer until the step trace finishes animating.
  const [stepsDone, setStepsDone] = useState(!m.steps);
  const [approved, setApproved] = useState(false);
  const handleApprove = (step) => { setApproved(true); onApprove?.(step); };

  // Perplexity-style: user turns are a subtle right-aligned pill; AI turns are
  // plain text on the empty canvas (no bubble, no avatar, full width).
  if (m.role === 'user') {
    return (
      <div className="chat-row user">
        <div className="chat-user-pill">{m.text}</div>
      </div>
    );
  }
  // A question the AI raised for the human — a distinct, attention-grabbing card.
  if (m.raised) {
    const emoji = m.urgency === 'high' ? '🚨' : m.urgency === 'medium' ? '⚠️' : '🙋';
    return (
      <div className="chat-row ai">
        <div className={`raised-q ${m.urgency === 'high' ? 'urgent' : ''}`}>
          <AgentAvatar id={emp.id} name={emp.name} size={30} className="flex-shrink-0" />
          <div className="raised-q-body">
            <div className="raised-q-head">
              <span className="raised-q-emoji">{emoji}</span>
              {emp.name} raised a question
              <span className="ai-chip">AI</span>
            </div>
            <div className="raised-q-title">{m.qTitle}</div>
            {m.qBody && <div className="raised-q-text">{m.qBody}</div>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="chat-row ai">
      {m.text && <div className="msg-ai-text">{m.text}</div>}
      {m.steps && <StepTrace steps={m.steps} onDone={() => setStepsDone(true)} approved={approved} onApprove={handleApprove} />}
      {m.answer && stepsDone && <AnswerCard answer={m.answer} approved={approved} />}
      {m.infographic && <InfographicCard data={m.infographic} />}
      {m.email && <EmailCard email={m.email} toast={toast} />}
    </div>
  );
}

function ChatComposer({ emp, model, input, setInput, send, inputRef }) {
  // Dictation is handled globally by <VoiceInput/>, which floats a mic over the
  // focused field — so the composer itself only needs attach + send.
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div className="gem-composer">
        <button className="gem-iconbtn" title="Attach context"><Plus size={18} /></button>
        <input ref={inputRef} autoFocus placeholder={`Ask ${emp.name}…`} value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button className="gem-iconbtn gem-send" onClick={() => send()} title="Send"><ArrowUp size={18} /></button>
      </div>
    </div>
  );
}

// Web Speech API dictation — appends recognized text to the composer input.
// Gracefully no-ops where the browser has no SpeechRecognition.
function useVoiceInput(input, setInput) {
  const [on, setOn] = useState(false);
  const recRef = useRef(null);
  const baseRef = useRef('');
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggle = () => {
    if (!SR) return;
    if (on) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = false;
    baseRef.current = input ? input.trim() + ' ' : '';
    rec.onresult = (e) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(baseRef.current + t);
    };
    rec.onend = () => setOn(false);
    rec.onerror = () => setOn(false);
    recRef.current = rec;
    setOn(true);
    try { rec.start(); } catch { setOn(false); }
  };

  useEffect(() => () => { try { recRef.current?.stop(); } catch {} }, []);
  return { on, toggle, supported: !!SR };
}

// Reveals steps one-by-one: each step shows a spinner while "running", then
// flips to a green check before the next appears — so the trace feels like the
// agent is actually working through them. Stops (and stays "waiting") on an
// approval step. Calls onDone once the sequence settles.
function StepTrace({ steps, onDone, approved, onApprove }) {
  const meta = {
    workflow: { icon: Workflow, bg: '#e8f2fb', fg: '#2f79a8' },
    uow: { icon: Boxes, bg: '#f5f3ff', fg: '#7c3aed' },
    delegate: { icon: UsersIcon, bg: '#ecfdf5', fg: '#059669' },
    approval: { icon: ShieldAlert, bg: '#fffbeb', fg: '#b45309' },
  };
  const [shown, setShown] = useState(1);   // steps currently visible
  const [done, setDone] = useState(0);      // steps marked complete
  const doneRef = useRef(false);

  useEffect(() => {
    const cur = steps[shown - 1];
    if (!cur) return;
    if (cur.needsApproval) {                // terminal: leave it "waiting"
      if (!doneRef.current) { doneRef.current = true; onDone?.(); }
      return;
    }
    const delay = 700 + (shown === 1 ? 200 : 0);
    const t = setTimeout(() => {
      setDone(shown);
      if (shown < steps.length) setShown(shown + 1);
      else if (!doneRef.current) { doneRef.current = true; onDone?.(); }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return (
    <div className="step-trace">
      <div className="px-3 py-2 text-xs font-semibold text-muted uppercase flex items-center gap-2" style={{ background: 'var(--surface, #fff)', borderBottom: '1px solid var(--gray-200)' }}>
        Background steps
        {done < steps.length && !steps[shown - 1]?.needsApproval && <RefreshCw size={11} className="animate-spin text-muted" />}
      </div>
      {steps.slice(0, shown).map((s, i) => {
        const m = meta[s.type] || meta.workflow; const Icon = m.icon;
        const completed = i < done;
        return (
          <div key={i} className="step-row appearing">
            <div className="ico" style={{ background: m.bg, color: m.fg }}><Icon size={13} /></div>
            <div className="flex-1">{s.label}{s.detail && <span className="text-muted"> · {s.detail}</span>}</div>
            {s.needsApproval
              ? (approved
                  ? <span className="flex items-center text-green-600 text-xs font-semibold" style={{ gap: 5 }}><CheckCircle size={14} /> Approved</span>
                  : <div className="flex items-center gap-2">
                      <Pill label="Waiting for approval" tone="warning" />
                      <button className="btn btn-primary btn-sm" onClick={() => onApprove?.(s)}><ShieldCheck size={13} /> Approve</button>
                    </div>)
              : completed
                ? <CheckCircle size={15} className="text-green-600" />
                : <RefreshCw size={14} className="animate-spin text-blue-500" />}
          </div>
        );
      })}
    </div>
  );
}

function EmployeeProfile({ emp, onOpenMemory }) {
  const m = modelById(emp.model), r = reasoningById(emp.reasoning);
  const wfs = employeeWorkflows(emp);
  const eff = effectiveness(emp);
  const mem = React.useMemo(() => memoryStats(employeeMemory(emp)), [emp]);
  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      <div className="grid-cols-4">
        <Stat2 label="Model" value={m.name} />
        <Stat2 label="Reasoning" value={r.label} />
        <Stat2 label="Tasks Done" value={emp.tasks_completed.toLocaleString()} />
        <Stat2 label="Monthly Cost" value={`$${monthlyCost(emp).toLocaleString()}`} />
      </div>
      <Card>
        <div className="card-body flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="mem-card-ic"><Brain size={18} /></div>
            <div className="min-w-0">
              <div className="font-semibold">Memory</div>
              <div className="text-xs text-muted truncate">Persistent workspace · {mem.folders} folders · {mem.files} files</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onOpenMemory?.()}><FolderOpen size={14} /> Open Memory</button>
        </div>
      </Card>
      <Card>
        <div className="card-header"><h3>Responsibilities</h3></div>
        <div className="card-body text-sm">{emp.description}</div>
      </Card>
      <Card>
        <div className="card-header"><h3>Workflows ({wfs.length})</h3></div>
        <div className="card-body flex flex-col gap-3">
          {wfs.length === 0 && <div className="text-muted text-sm">No workflows composed yet.</div>}
          {wfs.map((w, i) => (
            <div key={i} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{w.name}</div>
                <div className="flex gap-1">
                  <Pill label={w.trigger} tone={w.trigger === 'proactive' ? 'purple' : 'neutral'} />
                  {w.trigger === 'proactive' && w.schedule && <Pill label={w.schedule} tone="neutral" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(w.uowIds || []).map(uid => {
                  const u = uowById(uid); if (!u) return null;
                  return <span key={uid} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><Boxes size={11} /> {u.name}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {eff.hasMapping && (
        <Note icon={Sparkles}>
          Background effectiveness for {emp.name}: ~<strong>{eff.timeSavedHours}h</strong> saved and
          <strong> ${eff.costSaved.toLocaleString()}</strong> avoided this period vs. the manual baseline mapped on its Units of Work.
        </Note>
      )}
    </div>
  );
}

// ---- Memory explorer (full-screen) -----------------------------------------
// The persistent workspace an AI employee reads from and writes to. Left: a
// collapsible folder tree of its base instructions, knowledge and task
// artifacts. Right: the selected file's contents.
const fileIconFor = (kind) =>
  kind === 'json' ? FileJson : kind === 'csv' ? FileSpreadsheet : FileText;
const kindLabel = { md: 'Markdown', json: 'JSON', csv: 'CSV', txt: 'Text' };

function firstFile(nodes, trail = []) {
  for (const n of nodes) {
    if (n.type === 'file') return { node: n, trail: [...trail, n.name] };
    const found = firstFile(n.children || [], [...trail, n.name]);
    if (found) return found;
  }
  return null;
}

function MemoryTreeNode({ node, depth, selected, onSelect, openMap, toggle, path }) {
  const here = `${path}/${node.name}`;
  if (node.type === 'folder') {
    const open = openMap[here] ?? depth < 1; // top-level folders open by default
    return (
      <div>
        <button className="mem-node mem-node-folder" style={{ paddingLeft: 10 + depth * 16 }} onClick={() => toggle(here)}>
          {open ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
          {open ? <FolderOpen size={15} /> : <Folder size={15} />}
          <span className="mem-node-name">{node.name}</span>
          <span className="mem-node-count">{(node.children || []).length}</span>
        </button>
        {open && (node.children || []).map((c, i) => (
          <MemoryTreeNode key={i} node={c} depth={depth + 1} selected={selected}
            onSelect={onSelect} openMap={openMap} toggle={toggle} path={here} />
        ))}
      </div>
    );
  }
  const Icon = fileIconFor(node.kind);
  const active = selected === here;
  return (
    <button className={`mem-node mem-node-file ${active ? 'active' : ''}`} style={{ paddingLeft: 10 + depth * 16 }}
      onClick={() => onSelect(here, node)}>
      <Icon size={15} className="text-muted" />
      <span className="mem-node-name">{node.name}</span>
    </button>
  );
}

function MemoryExplorer({ emp, onClose }) {
  const tree = React.useMemo(() => employeeMemory(emp), [emp]);
  const stats = React.useMemo(() => memoryStats(tree), [tree]);
  const init = React.useMemo(() => firstFile(tree), [tree]);
  const [openMap, setOpenMap] = useState({});
  const [sel, setSel] = useState(null);

  // Resolve the initially-selected file's path against the rendered tree.
  useEffect(() => {
    if (init) {
      const path = `root/${init.trail.join('/')}`;
      setSel({ path, node: init.node });
    }
  }, [init]);

  const toggle = (p) => setOpenMap(m => ({ ...m, [p]: !(m[p] ?? false) }));
  const onSelect = (path, node) => setSel({ path, node });

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const node = sel?.node;
  const Icon = node ? fileIconFor(node.kind) : FileText;
  const crumbs = sel ? sel.path.replace(/^root\//, '').split('/') : [];

  return (
    <div className="mem-overlay">
      <header className="mem-header">
        <div className="flex items-center gap-3 min-w-0">
          <AgentAvatar id={emp.id} name={emp.name} size={34} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-muted" />
              <span className="font-semibold truncate">{emp.name} · Memory</span>
            </div>
            <div className="text-xs text-muted truncate">{emp.title} · {emp.dept}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted flex items-center gap-1"><HardDrive size={13} /> {stats.folders} folders · {stats.files} files</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /> Close</button>
        </div>
      </header>
      <div className="mem-body">
        <aside className="mem-tree">
          <div className="mem-tree-label">Workspace</div>
          {tree.map((n, i) => (
            <MemoryTreeNode key={i} node={n} depth={0} selected={sel?.path}
              onSelect={onSelect} openMap={openMap} toggle={toggle} path="root" />
          ))}
        </aside>
        <main className="mem-file">
          {node ? (
            <>
              <div className="mem-file-head">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={16} className="text-muted" />
                  <span className="mem-crumbs truncate">{crumbs.join(' / ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pill label={kindLabel[node.kind] || node.kind} tone="neutral" />
                  <span className="text-xs text-muted">{fileSize(node)} · updated {node.updated}</span>
                </div>
              </div>
              <pre className="mem-file-content">{node.content}</pre>
            </>
          ) : (
            <div className="text-muted text-sm p-6">Select a file to view its contents.</div>
          )}
        </main>
      </div>
    </div>
  );
}

// ---- Onboarding wizard ------------------------------------------------------
// Uneven-length phases so extraction feels like real work (~30s total).
const ANALYZE_PHASES = [
  { label: 'Reading roles & responsibilities', ms: 2200 },
  { label: 'Inventorying available Units of Work', ms: 3500 },
  { label: 'Mapping responsibilities to capabilities', ms: 4200 },
  { label: 'Clustering related Units of Work', ms: 2600 },
  { label: 'Classifying reactive vs proactive triggers', ms: 4800 },
  { label: 'Proposing schedules for proactive work', ms: 3100 },
  { label: 'Checking connector availability & auth', ms: 2400 },
  { label: 'Estimating effectiveness baselines', ms: 3700 },
  { label: 'Composing candidate workflows', ms: 3500 },
];

// Compose genuinely different workflows from the dept's Units of Work:
// read/GET capabilities become scheduled *proactive* monitors, write capabilities
// become *reactive* handlers — each workflow a distinct, non-overlapping subset.
function deriveWorkflows(dept) {
  const u = UNITS_OF_WORK.filter(x => x.dept === dept);
  if (!u.length) return [];
  const reads = u.filter(x => x.endpoint.method === 'GET');
  const writes = u.filter(x => x.endpoint.method !== 'GET');
  const chunk = (arr, size) => { const r = []; for (let i = 0; i < arr.length; i += size) r.push(arr.slice(i, i + size)); return r; };
  const PRO_NAMES = ['Monitoring Sweep', 'Reporting Rollup', 'Reconciliation Cycle', 'Compliance Watch'];
  const PRO_SCHED = ['Daily at 07:00', 'Weekdays at 07:30', 'Weekly on Mon at 06:30', 'Hourly during business hours'];
  const RE_NAMES = ['Request Handler', 'Action Dispatch', 'Exception Handler', 'Update Pipeline'];
  const out = [];
  // proactive monitors from read capabilities (uneven chunk sizes: 4 then 3…)
  chunk(reads, 4).slice(0, 2).forEach((c, i) => {
    out.push({ name: `${dept} ${PRO_NAMES[i % PRO_NAMES.length]}`, trigger: 'proactive', schedule: PRO_SCHED[i % PRO_SCHED.length], uowIds: c.map(x => x.id) });
  });
  // reactive handlers from write capabilities (chunks of 3)
  chunk(writes, 3).slice(0, 2).forEach((c, i) => {
    out.push({ name: `${dept} ${RE_NAMES[i % RE_NAMES.length]}`, trigger: 'reactive', schedule: null, uowIds: c.map(x => x.id) });
  });
  if (!out.length) out.push({ name: `${dept} Workflow`, trigger: 'reactive', schedule: null, uowIds: u.slice(0, 4).map(x => x.id) });
  return out;
}

function OnboardWizard({ role, user, onClose, toast }) {
  const { createEmployee } = useStore();
  const [step, setStep] = useState(0);
  const deptDefault = role === 'admin' ? DEPT_DEFAULT : user.dept;
  const [form, setForm] = useState({
    name: '', title: '', archetype: 'Coordinator', dept: deptDefault, description: '',
    model: 'sonnet-4-6', reasoning: 'medium',
  });
  const [derived, setDerived] = useState(null);
  const [analyzeIdx, setAnalyzeIdx] = useState(-1);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // changing dept invalidates the derived workflows
  useEffect(() => { setDerived(null); setAnalyzeIdx(-1); }, [form.dept]);

  // kick off analysis when reaching the Compose step
  useEffect(() => {
    if (step === 2 && derived === null && analyzeIdx === -1) setAnalyzeIdx(0);
  }, [step, derived, analyzeIdx]);

  // step through the analysis phases, then produce the derived workflows
  useEffect(() => {
    if (analyzeIdx < 0) return;
    if (analyzeIdx >= ANALYZE_PHASES.length) { setDerived(deriveWorkflows(form.dept)); return; }
    const t = setTimeout(() => setAnalyzeIdx(i => i + 1), ANALYZE_PHASES[analyzeIdx].ms);
    return () => clearTimeout(t);
  }, [analyzeIdx]);

  const updateWf = (i, patch) => setDerived(d => d.map((w, j) => j === i ? { ...w, ...patch } : w));
  const toggleUow = (i, id) => setDerived(d => d.map((w, j) => j === i ? { ...w, uowIds: w.uowIds.includes(id) ? w.uowIds.filter(x => x !== id) : [...w.uowIds, id] } : w));

  const steps = ['Role', 'Model & Reasoning', 'Compose Workflows', 'Review'];
  const analyzing = analyzeIdx >= 0 && derived === null;
  const canNext = step === 0 ? (form.name.trim() && form.title.trim()) : step === 2 ? !analyzing : true;
  const deptUows = UNITS_OF_WORK.filter(u => u.dept === form.dept);

  const finish = () => {
    createEmployee({
      name: form.name, title: form.title, archetype: form.archetype, dept: form.dept,
      status: 'active', model: form.model, reasoning: form.reasoning, tokensMonth: 8_000_000,
      tasks_completed: 0, workflowIds: [], description: form.description || `${form.title} for ${form.dept}.`,
      composedWorkflows: derived || [],
    });
    toast(`${form.name} onboarded`, 'success');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Onboard AI Employee" size="lg">
      <div>
        <div className="wizard-steps mb-6">
          {steps.map((s, i) => (
            <div key={s} className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="dot">{i < step ? <CheckCircle size={15} /> : i + 1}</div>
              <div className="lbl">{s}</div>
              {i < steps.length - 1 && <div className="line" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid-cols-2" style={{ gap: 16 }}>
              <Field label="Name (codename)"><input className="search-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Beacon" /></Field>
              <Field label="Role title"><input className="search-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Lease Coordinator" /></Field>
              <Field label="Archetype"><Select value={form.archetype} onChange={v => set('archetype', v)} options={ARCHETYPES.map(a => ({ value: a.name, label: a.name }))} /></Field>
              <Field label="Department"><Select value={form.dept} onChange={v => set('dept', v)} options={role === 'admin' ? DEPARTMENTS : [user.dept]} /></Field>
            </div>
            <Field label="Roles & responsibilities" hint="Describe what this employee is accountable for. The system uses this to derive which Units of Work to combine into workflows.">
              <textarea className="search-input" style={{ minHeight: 90, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Owns the rent roll: pulls delinquencies, opens work orders and keeps the ERP in sync." />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Field label="Model" hint="Use the latest generation for best quality.">
              <Select value={form.model} onChange={v => set('model', v)} options={MODELS.map(m => ({ value: m.id, label: `${m.name} · ${m.vendor}` }))} />
            </Field>
            <Field label="Reasoning / effort level">
              <div className="seg" style={{ display: 'flex' }}>
                {REASONING_LEVELS.map(r => <button key={r.id} className={form.reasoning === r.id ? 'on' : ''} onClick={() => set('reasoning', r.id)} style={{ flex: 1 }}>{r.label}</button>)}
              </div>
            </Field>
            <Note>Higher reasoning means deeper thinking but higher cost. <strong>{reasoningById(form.reasoning).note}</strong> You can change this anytime from Cost Control.</Note>
          </div>
        )}

        {step === 2 && analyzing && (
          <div className="flex flex-col items-center gap-5 py-8">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <div className="text-center">
              <div className="font-semibold mb-1">Deriving workflows from {form.dept}’s Units of Work…</div>
              <div className="text-sm text-muted">Combining capabilities and classifying how each should run.</div>
            </div>
            <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 440 }}>
              {ANALYZE_PHASES.slice(0, analyzeIdx + 1).map((p, i) => (
                <div key={p.label} className="step-row appearing flex items-center gap-3 p-2 rounded-lg border">
                  <div className="ico" style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < analyzeIdx ? 'var(--green-50)' : '#e8f2fb', color: i < analyzeIdx ? 'var(--green-600)' : 'var(--blue-500)' }}>
                    {i < analyzeIdx ? <CheckCircle size={14} /> : <RefreshCw size={13} className="animate-spin" />}
                  </div>
                  <div className="text-sm flex-1">{p.label}</div>
                  <div className="text-xs text-muted">{i < analyzeIdx ? 'done' : 'working…'}</div>
                </div>
              ))}
              <div className="text-xs text-muted text-center mt-1">Step {Math.min(analyzeIdx + 1, ANALYZE_PHASES.length)} of {ANALYZE_PHASES.length}</div>
            </div>
          </div>
        )}

        {step === 2 && !analyzing && derived && (
          <div className="flex flex-col gap-4">
            <Note icon={Sparkles}>Derived <strong>{derived.length}</strong> workflow{derived.length === 1 ? '' : 's'} from {form.dept}’s Units of Work and classified each as reactive or proactive. Adjust below.</Note>
            {derived.length === 0 && <div className="text-muted text-sm">No Units of Work mapped for {form.dept} yet — create some first on the Units of Work page.</div>}
            {derived.map((w, i) => (
              <div key={i} className="p-4 border rounded-lg flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Workflow size={16} className="text-blue-600" />
                  <input className="search-input" style={{ flex: 1 }} value={w.name} onChange={e => updateWf(i, { name: e.target.value })} />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted">Trigger</span>
                  <div className="seg" style={{ display: 'flex' }}>
                    {['reactive', 'proactive'].map(t => <button key={t} className={w.trigger === t ? 'on' : ''} style={{ textTransform: 'capitalize' }} onClick={() => updateWf(i, { trigger: t, schedule: t === 'proactive' ? (w.schedule || 'Daily at 08:00') : null })}>{t}</button>)}
                  </div>
                  {w.trigger === 'proactive' && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-muted" />
                      <input className="search-input" style={{ width: 200 }} value={w.schedule || ''} onChange={e => updateWf(i, { schedule: e.target.value })} placeholder="e.g. Daily at 08:00" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {deptUows.map(u => {
                    const on = w.uowIds.includes(u.id);
                    return (
                      <button key={u.id} onClick={() => toggleUow(i, u.id)}
                        className="text-xs px-2 py-1 rounded flex items-center gap-1"
                        style={{ border: '1px solid', borderColor: on ? 'var(--blue-500)' : 'var(--gray-300)', background: on ? 'var(--blue-50)' : 'white', color: on ? 'var(--blue-700)' : 'var(--gray-600)' }}>
                        <Boxes size={11} /> {u.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <div className="grid-cols-2" style={{ gap: 12 }}>
              <Stat2 label="Name" value={form.name || '—'} />
              <Stat2 label="Role" value={form.title || '—'} />
              <Stat2 label="Department" value={form.dept} />
              <Stat2 label="Model" value={modelById(form.model).name} />
              <Stat2 label="Reasoning" value={reasoningById(form.reasoning).label} />
              <Stat2 label="Workflows" value={`${(derived || []).length} derived`} />
            </div>
            <div className="flex flex-col gap-2">
              {(derived || []).map((w, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium text-sm">{w.name}</span>
                  <div className="flex gap-1">
                    <Pill label={w.trigger} tone={w.trigger === 'proactive' ? 'purple' : 'neutral'} />
                    {w.trigger === 'proactive' && w.schedule && <Pill label={w.schedule} tone="neutral" />}
                  </div>
                </div>
              ))}
            </div>
            <Note icon={CheckCircle}>{form.name || 'This employee'} will start <strong>active</strong> with {(derived || []).length} workflow{(derived || []).length === 1 ? '' : 's'}.</Note>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
        <div>{step > 0 && <button className="btn btn-outline" onClick={() => setStep(step - 1)}>Back</button>}</div>
        {step < steps.length - 1
          ? <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>{step === 2 && analyzing ? 'Analyzing…' : 'Continue'}</button>
          : <button className="btn btn-primary" onClick={finish}><CheckCircle size={16} /> Create Employee</button>}
      </div>
    </Modal>
  );
}

// ============================================================================
// Taskboard — create + assign to AI + delegation
// ============================================================================
const COLUMNS = [
  { id: 'todo', label: 'To Do' }, { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' }, { id: 'done', label: 'Done' },
];

// Human-readable labels for the terse status / work-type codes used in seed data.
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'In Review', 'done': 'Done' };
const TYPE_LABELS = { analysis: 'Analysis', sync: 'Data Sync', audit: 'Audit', drafting: 'Drafting', review: 'Review' };
const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export function Taskboard({ role, user, toast }) {
  const { tasks, employees, assignTask, createTask, moveTask } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const scope = role === 'admin' ? tasks : tasks.filter(t => t.dept === user.dept);

  // assignee filter options built from the scoped tasks
  const aiEmps = [...new Set(scope.filter(t => t.assigneeType === 'ai').map(t => t.assignee))].map(empById).filter(Boolean);
  const humans = [...new Set(scope.filter(t => t.assigneeType === 'human').map(t => t.assignee))].map(id => USERS.find(u => u.id === id)).filter(Boolean);
  const assigneeOptions = [
    { value: 'all', label: 'All assignees' }, { value: 'me', label: 'Assigned to me' },
    { value: 'ai', label: 'AI employees' }, { value: 'human', label: 'People' },
    ...aiEmps.map(e => ({ value: e.id, label: `${e.name} (AI)` })),
    ...humans.map(u => ({ value: u.id, label: u.name })),
  ];

  const matches = (t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priority !== 'all' && t.priority !== priority) return false;
    if (assignee === 'me') return t.assigneeType === 'human' && t.assignee === user.id;
    if (assignee === 'ai') return t.assigneeType === 'ai';
    if (assignee === 'human') return t.assigneeType === 'human';
    if (assignee !== 'all') return t.assignee === assignee;
    return true;
  };
  const visible = scope.filter(matches);
  const cols = COLUMNS.map(c => ({ ...c, items: visible.filter(t => t.status === c.id) }));

  const onDrop = (colId) => {
    if (dragId) { moveTask(dragId, colId); toast('Task moved', 'success'); }
    setDragId(null); setOverCol(null);
  };

  // Detailed view opens as a separate page (detail holds the task id; the live
  // task is looked up so it reflects assignments/moves made on the page).
  const detailTask = detail ? tasks.find(t => t.id === detail) : null;
  if (detailTask) {
    return <TaskDetailPage task={detailTask} role={role} user={user} employees={employees}
      onBack={() => setDetail(null)} assignTask={assignTask} toast={toast} />;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center">
        <SectionTitle title="Department Taskboard" subtitle="Drag cards between columns to update status. Assign tasks to AI employees and watch them delegate to peers." />
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create Task</button>
      </div>

      {/* filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative" style={{ width: 240 }}>
          <Search className="absolute left-3 top-2.5 text-muted" size={16} />
          <input className="search-input has-icon" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 200 }}>
          <Select value={assignee} onChange={setAssignee} options={assigneeOptions} />
        </div>
        <div style={{ width: 150 }}>
          <Select value={priority} onChange={setPriority} options={[{ value: 'all', label: 'All priorities' }, 'low', 'medium', 'high', 'critical']} />
        </div>
        {(search || assignee !== 'all' || priority !== 'all') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setAssignee('all'); setPriority('all'); }}>Clear</button>
        )}
        <span className="text-xs text-muted ml-auto">{visible.length} of {scope.length} tasks</span>
      </div>

      <div className="kanban">
        {cols.map(col => (
          <div key={col.id}
            className="kanban-col"
            style={{ outline: overCol === col.id ? '2px dashed var(--blue-400)' : 'none', outlineOffset: -2 }}
            onDragOver={e => { e.preventDefault(); setOverCol(col.id); }}
            onDragLeave={() => setOverCol(c => c === col.id ? null : c)}
            onDrop={() => onDrop(col.id)}>
            <div className="kanban-col-header"><span>{col.label}</span><span className="badge">{col.items.length}</span></div>
            <div className="kanban-col-body">
              {col.items.map(t => (
                <TaskCard key={t.id} task={t} onClick={() => setDetail(t.id)}
                  onDragStart={() => setDragId(t.id)} onDragEnd={() => { setDragId(null); setOverCol(null); }} dragging={dragId === t.id} />
              ))}
              {col.items.length === 0 && <div className="text-xs text-muted text-center py-4" style={{ opacity: 0.7 }}>Drop here</div>}
            </div>
          </div>
        ))}
      </div>

      {createOpen && <CreateTaskModal role={role} user={user} employees={employees} onClose={() => setCreateOpen(false)} createTask={createTask} toast={toast} />}
    </div>
  );
}

function TaskCard({ task, onClick, onDragStart, onDragEnd, dragging }) {
  const ai = task.assigneeType === 'ai' ? empById(task.assignee) : null;
  const human = task.assigneeType === 'human' ? USERS.find(u => u.id === task.assignee) : null;
  const peer = task.delegateTo ? empById(task.delegateTo) : null;
  return (
    <div className="kanban-card" draggable onClick={onClick}
      onDragStart={onDragStart} onDragEnd={onDragEnd}
      style={{ opacity: dragging ? 0.4 : 1, cursor: 'grab' }}>
      <div className="font-medium text-sm leading-tight">{task.title}</div>
      <div className="flex flex-wrap gap-2">
        <Pill label={task.priority} tone={priTone(task.priority)} />
        <Pill label={task.dept} tone="neutral" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--gray-100)' }}>
        <div className="flex items-center gap-2 text-xs">
          {ai
            ? <><AgentAvatar id={ai.id} name={ai.name} size={20} /><span className="text-muted">{ai.name} · AI</span></>
            : <><Avatar initials={(human?.avatar) || '?'} size={20} /><span className="text-muted">{human?.name || 'Unassigned'}</span></>}
        </div>
        <span className="text-xs text-muted">{task.dueDate}</span>
      </div>
      {peer && <div className="text-xs flex items-center gap-1" style={{ color: '#059669' }}><UsersIcon size={12} /> {ai?.name} → asked {peer.name} for help</div>}
    </div>
  );
}

function CreateTaskModal({ role, user, employees, onClose, createTask, toast }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dept, setDept] = useState(role === 'admin' ? 'Property Management' : user.dept);
  const [assignTo, setAssignTo] = useState('me');

  // Member: only active AI in own dept. Admin: any active AI.
  const aiOptions = activeEmployeesFor(role, user, employees).filter(e => role === 'admin' || e.dept === dept);

  const submit = () => {
    if (!title.trim()) return;
    const base = { title, priority, dept, dueDate: '2026-07-01', owner: user.id };
    if (assignTo === 'me') createTask({ ...base, assigneeType: 'human', assignee: user.id });
    else createTask({ ...base, assigneeType: 'ai', assignee: assignTo });
    toast('Task created', 'success');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Create Task">
      <div className="flex flex-col gap-4">
        <Field label="Task"><input className="search-input" style={{ fontSize: 16, padding: '13px 16px' }} value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs doing?" /></Field>
        <div className="grid-cols-2" style={{ gap: 16 }}>
          <Field label="Priority"><Select value={priority} onChange={setPriority} options={['low', 'medium', 'high', 'critical']} /></Field>
          <Field label="Department"><Select value={dept} onChange={setDept} options={role === 'admin' ? DEPARTMENTS : [user.dept]} /></Field>
        </div>
        <Field label="Assign to" hint={role === 'admin' ? 'As admin you can assign to any active AI employee.' : 'As a member you can assign to active AI employees in your department.'}>
          <Select value={assignTo} onChange={setAssignTo}
            options={[{ value: 'me', label: 'Myself (human)' }, ...aiOptions.map(e => ({ value: e.id, label: `${e.name} · ${e.title} (AI)` }))]} />
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Create</button>
        </div>
      </div>
    </Modal>
  );
}

// Full-page task detail view (opened from a Taskboard / My Work card click).
export function TaskDetailPage({ task, role, user, employees, onBack, assignTask, toast, backLabel = 'Taskboard' }) {
  const loading = useFakeLoad([task.id]);
  const ai = task.assigneeType === 'ai' ? empById(task.assignee) : null;
  const human = task.assigneeType === 'human' ? USERS.find(u => u.id === task.assignee) : null;
  const owner = USERS.find(u => u.id === task.owner);
  const peer = task.delegateTo ? empById(task.delegateTo) : null;
  const aiOptions = activeEmployeesFor(role, user, employees).filter(e => role === 'admin' || e.dept === task.dept);
  const [pick, setPick] = useState(aiOptions[0]?.id || '');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={16} /> {backLabel}</button>
      </div>

      {loading ? (
        <>
          <div className="flex flex-col gap-3">
            <Skeleton w="55%" h={28} />
            <Skeleton w="35%" h={14} />
          </div>
          <div className="grid-cols-4" style={{ gap: 12 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 border"><Skeleton w="50%" h={10} /><Skeleton w="70%" h={20} style={{ marginTop: 10 }} /></div>
            ))}
          </div>
          <Card><div className="card-body flex flex-col gap-4">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3"><Skeleton w={28} h={28} radius={999} /><Skeleton w={`${60 - i * 6}%`} h={12} /></div>
            ))}
          </div></Card>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><ListChecks size={20} /></div>
            <div className="flex-1">
              <h1 className="m-0" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>{task.title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Pill label={STATUS_LABELS[task.status] || cap(task.status)} tone={statusTone(task.status)} />
                <Pill label={cap(task.priority)} tone={priTone(task.priority)} />
                <Pill label={task.dept} tone="neutral" />
                {task.type && (
                  <span className="pill pill-neutral"><Tag size={11} /> {TYPE_LABELS[task.type] || cap(task.type)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid-cols-4" style={{ gap: 12 }}>
            <Stat2 label="Priority" value={cap(task.priority)} />
            <Stat2 label="Status" value={STATUS_LABELS[task.status] || cap(task.status)} />
            <Stat2 label="Due date" value={task.dueDate} />
            <Stat2 label="Department" value={task.dept} />
          </div>

          {/* Assignee / owner */}
          <Card>
            <div className="card-header"><h3>People</h3></div>
            <div className="card-body flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Assigned to</span>
                <div className="flex items-center gap-2">
                  {ai ? <><AgentAvatar id={ai.id} name={ai.name} size={24} /><span className="font-medium text-sm">{ai.name}</span><span className="text-xs text-muted">· {ai.title} · AI</span></>
                    : human ? <><Avatar initials={human.avatar || '?'} size={24} /><span className="font-medium text-sm">{human.name}</span></>
                    : <span className="text-sm text-muted">Unassigned</span>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Owner</span>
                <span className="text-sm font-medium">{owner?.name || '—'}</span>
              </div>
              {peer && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Delegated</span>
                  <span className="text-sm flex items-center gap-1" style={{ color: '#059669' }}><UsersIcon size={14} /> {ai?.name} → {peer.name}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card><div className="card-body"><TaskTimeline task={task} /></div></Card>

          {!ai && (
            <Card>
              <div className="card-body">
                <Field label="Assign to an AI employee" hint={role === 'admin' ? 'Any active AI employee.' : 'Active AI employees in your department only.'}>
                  <Select value={pick} onChange={setPick} options={aiOptions.length ? aiOptions.map(e => ({ value: e.id, label: `${e.name} · ${e.title}` })) : [{ value: '', label: 'No active AI employees available' }]} />
                </Field>
                <button className="btn btn-primary mt-3" disabled={!pick} onClick={() => { assignTask(task.id, pick); toast('Task assigned to AI', 'success'); onBack(); }}><Bot size={16} /> Assign to AI</button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Approvals — routed to task owner, backed by the store
// ============================================================================
export function Approvals({ role, user, toast }) {
  const { approvals, resolveApproval } = useStore();
  const [selected, setSelected] = useState(null);

  // Member: only approvals routed to me. Head: my dept. Admin: all.
  const visible = approvals.filter(a =>
    role === 'admin' ? true : role === 'head' ? a.dept === user.dept : a.ownerId === user.id);

  const act = (id, action) => { resolveApproval(id); toast(`Approval ${action}.`, 'success'); setSelected(null); };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Approvals" subtitle="Human-in-the-loop gates your AI workforce is waiting on" />
      <Card>
        <div className="table-wrap">
          {visible.length === 0
            ? <div className="text-center py-8 text-muted">No approvals waiting on you.</div>
            : <SortableTable
            rows={visible}
            initial={{ key: 'age', dir: 'asc' }}
            columns={[
              { key: 'type', label: 'Type', get: a => a.type },
              { key: 'request', label: 'Request', get: a => a.title },
              { key: 'risk', label: 'Risk', get: a => ({ low: 0, medium: 1, high: 2 }[a.risk] ?? 0) },
              { key: 'dept', label: 'Dept', get: a => a.dept },
              { key: 'by', label: 'Raised By', get: a => empById(a.requestedBy)?.name || a.requestedBy },
              { key: 'age', label: 'Age', get: a => new Date(a.createdAt).getTime() },
              { label: 'Action' },
            ]}
            renderRow={a => {
                const ageHrs = Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 3600000));
                return (
                  <tr key={a.id}>
                    <td className="capitalize font-medium">{a.type}</td>
                    <td>{a.title}</td>
                    <td><Pill label={a.risk} tone={a.risk === 'high' ? 'error' : a.risk === 'medium' ? 'warning' : 'success'} /></td>
                    <td>{a.dept}</td>
                    <td>{empById(a.requestedBy)?.name || a.requestedBy}</td>
                    <td className="text-muted">{ageHrs}h ago</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => setSelected(a)}>View</button>
                        <button className="btn btn-primary btn-sm" onClick={() => act(a.id, 'approved')}>Approve</button>
                      </div>
                    </td>
                  </tr>
                );
            }}
          />}
        </div>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Approval Detail">
        {selected && (
          <div className="flex flex-col gap-4">
            <h3 className="m-0">{selected.title}</h3>
            <div className="grid-cols-2" style={{ gap: 12 }}>
              <Stat2 label="Type" value={selected.type} />
              <Stat2 label="Risk" value={selected.risk} />
              <Stat2 label="Raised By" value={empById(selected.requestedBy)?.name || selected.requestedBy} />
              <Stat2 label="Department" value={selected.dept} />
            </div>
            {selected.detail && <Note icon={ShieldAlert}>{selected.detail}</Note>}
            <div className="flex justify-end gap-2 border-t pt-4">
              <button className="btn btn-danger" onClick={() => act(selected.id, 'rejected')}>Reject</button>
              <button className="btn btn-primary" onClick={() => act(selected.id, 'approved')}>Approve Request</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
