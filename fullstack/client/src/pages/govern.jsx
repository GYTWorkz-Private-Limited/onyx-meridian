import React, { useState } from 'react';
import { Card, SectionTitle, Stat, Bar, Pill, Avatar, AgentAvatar, Note, Field, Select, statusTone, SortableTable } from '../components/ui.jsx';
import { useStore } from '../data/StoreContext.jsx';
import {
  DEPARTMENTS, MODELS, REASONING_LEVELS, VAULT_SECRETS,
  modelById, reasoningById, monthlyCost, effectiveness, empById
} from '../data/store.js';
import { DollarSign, TrendingUp, Sparkles, Lock, Plus, Clock, Info, SlidersHorizontal } from 'lucide-react';

// ============================================================================
// Cost Control — real per-employee detail + the reasoning/effort cost lever
// ============================================================================
export function Cost() {
  const { employees, setReasoning } = useStore();

  const deptSpend = DEPARTMENTS.map(d => ({
    dept: d, total: employees.filter(e => e.dept === d).reduce((a, e) => a + monthlyCost(e), 0),
  })).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
  const maxSpend = Math.max(1, ...deptSpend.map(d => d.total));
  const total = employees.reduce((a, e) => a + monthlyCost(e), 0);

  // per-model breakdown (actual detail, not a vague summary)
  const byModel = MODELS.map(m => {
    const emps = employees.filter(e => e.model === m.id);
    return { model: m, count: emps.length, cost: emps.reduce((a, e) => a + monthlyCost(e), 0) };
  }).filter(m => m.count > 0);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Cost Control" subtitle="Control spend at the source — the reasoning/effort level each AI employee runs at — and see exactly where it goes." />

      <div className="grid-cols-3">
        <Stat label="Total Monthly Spend" value={`$${total.toLocaleString()}`} delta="+$4.2k" icon={DollarSign} />
        <Stat label="AI Employees Billed" value={employees.length} />
        <Stat label="Forecast EOM" value={`$${Math.round(total * 1.08).toLocaleString()}`} icon={TrendingUp} />
      </div>

      {/* The actual cost lever */}
      <Card>
        <div className="card-header"><h3 className="flex items-center gap-2"><SlidersHorizontal size={16} /> Reasoning / Effort Control</h3></div>
        <div className="card-body flex flex-col gap-3">
          <Note>Cost is driven by how hard each employee thinks. Dial reasoning down where deep analysis isn’t needed — this is the primary lever, not just watching the bill. Changes recompute cost live.</Note>
          {employees.map(e => {
            const m = modelById(e.model);
            return (
              <div key={e.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <AgentAvatar id={e.id} name={e.name} size={28} />
                <div style={{ width: 150 }}>
                  <div className="font-medium text-sm">{e.name}</div>
                  <div className="text-xs text-muted">{m.name}</div>
                </div>
                <div className="seg" style={{ display: 'flex' }}>
                  {REASONING_LEVELS.map(r => (
                    <button key={r.id} className={e.reasoning === r.id ? 'on' : ''} onClick={() => setReasoning(e.id, r.id)}>{r.label}</button>
                  ))}
                </div>
                <div className="ml-auto text-right">
                  <div className="font-bold">${monthlyCost(e).toLocaleString()}/mo</div>
                  <div className="text-xs text-muted">{reasoningById(e.reasoning).note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid-cols-2">
        <Card>
          <div className="card-header"><h3>Spend by Department</h3></div>
          <div className="card-body flex flex-col gap-4">
            {deptSpend.map(d => (
              <div key={d.dept}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{d.dept}</span><span className="text-muted">${d.total.toLocaleString()}</span></div>
                <Bar value={d.total} max={maxSpend} tone={d.total > maxSpend * 0.8 ? 'orange' : 'blue'} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="card-header"><h3>Spend by Model</h3></div>
          <div className="table-wrap">
            <SortableTable
              rows={byModel}
              columns={[
                { key: 'model', label: 'Model', get: m => m.model.name },
                { key: 'count', label: 'Employees', get: m => m.count },
                { key: 'rate', label: 'Blended Rate', get: m => m.model.rate },
                { key: 'cost', label: 'Monthly Cost', get: m => m.cost },
              ]}
              renderRow={m => (
                <tr key={m.model.id}><td className="font-medium">{m.model.name}</td><td>{m.count}</td><td className="font-mono text-sm">${m.model.rate}/Mtok</td><td className="font-mono">${m.cost.toLocaleString()}</td></tr>
              )}
            />
          </div>
        </Card>
      </div>

      {/* actual per-employee detail */}
      <Card>
        <div className="card-header"><h3>Per-Employee Cost Detail</h3></div>
        <div className="table-wrap">
          <SortableTable
            rows={employees}
            initial={{ key: 'cost', dir: 'desc' }}
            columns={[
              { key: 'name', label: 'Employee', get: e => e.name },
              { key: 'dept', label: 'Dept', get: e => e.dept },
              { key: 'model', label: 'Model', get: e => modelById(e.model).name },
              { key: 'reasoning', label: 'Reasoning', get: e => reasoningById(e.reasoning).mult },
              { key: 'tokens', label: 'Tokens / mo', get: e => e.tokensMonth },
              { key: 'cost', label: 'Monthly Cost', get: e => monthlyCost(e) },
            ]}
            renderRow={e => (
              <tr key={e.id}>
                <td className="font-medium">{e.name}</td>
                <td className="text-muted">{e.dept}</td>
                <td className="text-sm">{modelById(e.model).name}</td>
                <td><Pill label={reasoningById(e.reasoning).label} tone="info" /></td>
                <td className="font-mono text-sm">{(e.tokensMonth / 1e6).toFixed(0)}M</td>
                <td className="font-mono">${monthlyCost(e).toLocaleString()}</td>
              </tr>
            )}
          />
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Effectiveness — background measurement, no uptime/autonomy
// ============================================================================
export function Effectiveness() {
  const { employees } = useStore();
  const withMapping = employees.map(e => ({ e, m: effectiveness(e) }));

  const tasksTotal = withMapping.reduce((a, x) => a + x.m.tasksCompleted, 0);
  const timeSaved = withMapping.reduce((a, x) => a + x.m.timeSavedHours, 0);
  const costSaved = withMapping.reduce((a, x) => a + x.m.costSaved, 0);
  const mapped = withMapping.filter(x => x.m.hasMapping);
  const automation = mapped.length ? Math.round(mapped.reduce((a, x) => a + x.m.effectivenessPct, 0) / mapped.length) : 0;
  const quality = mapped.length ? Math.round(mapped.reduce((a, x) => a + (x.m.qualityUpliftPct || 0), 0) / mapped.length) : 0;

  const top = [...withMapping].sort((a, b) => b.m.timeSavedHours - a.m.timeSavedHours).slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Effectiveness" subtitle="What the AI workforce actually saved versus doing the work manually" />

      <Note icon={Info}>
        Effectiveness is a <strong>background measurement</strong>. It’s computed from the manual-vs-automated mapping captured on each
        Unit of Work during onboarding — nobody manages it day-to-day. Only the resulting metric surfaces here for admins.
        (Uptime and autonomy were removed: uptime is infrastructure’s concern and should always be 100%, and autonomy varies task-to-task.)
      </Note>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 24 }}>
        <Stat label="Tasks Completed" value={tasksTotal.toLocaleString()} icon={Sparkles} />
        <Stat label="Time Saved / mo" value={`${timeSaved.toLocaleString()}h`} delta="+8%" icon={Clock} />
        <Stat label="Cost Saved / mo" value={`$${costSaved.toLocaleString()}`} delta="+5%" icon={DollarSign} />
        <Stat label="Automation Rate" value={`${automation}%`} />
        <Stat label="Quality Uplift" value={`+${quality}%`} delta="fewer errors / rework" />
      </div>

      <Card>
        <div className="card-header"><h3>Top Performers</h3></div>
        <div className="table-wrap">
          <SortableTable
            rows={top}
            initial={{ key: 'time', dir: 'desc' }}
            columns={[
              { key: 'name', label: 'Employee', get: x => x.e.name },
              { key: 'role', label: 'Role', get: x => x.e.title },
              { key: 'dept', label: 'Dept', get: x => x.e.dept },
              { key: 'tasks', label: 'Tasks Completed', get: x => x.m.tasksCompleted },
              { key: 'time', label: 'Time Saved', get: x => x.m.hasMapping ? x.m.timeSavedHours : -1 },
              { key: 'eff', label: 'Effectiveness', get: x => x.m.hasMapping ? x.m.effectivenessPct : -1 },
              { key: 'quality', label: 'Quality Uplift', get: x => x.m.hasMapping ? x.m.qualityUpliftPct : -1 },
            ]}
            renderRow={({ e, m }) => (
              <tr key={e.id}>
                <td className="font-medium flex items-center gap-2"><AgentAvatar id={e.id} name={e.name} size={24} /> {e.name}</td>
                <td className="text-muted">{e.title}</td>
                <td>{e.dept}</td>
                <td>{m.tasksCompleted.toLocaleString()}</td>
                <td>{m.hasMapping ? `${m.timeSavedHours.toLocaleString()}h` : '—'}</td>
                <td>{m.hasMapping ? <Pill label={`${m.effectivenessPct}%`} tone="success" /> : <span className="text-muted text-xs">No mapping</span>}</td>
                <td>{m.hasMapping ? <Pill label={`+${m.qualityUpliftPct}%`} tone="purple" /> : <span className="text-muted text-xs">—</span>}</td>
              </tr>
            )}
          />
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// People — working invite
// ============================================================================
export function People({ role, user, toast }) {
  const { people, inviteUser } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <SectionTitle title="People" subtitle="Human operators and gatekeepers" />
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Invite User</button>
      </div>

      <Card>
        <div className="table-wrap">
          <SortableTable
            rows={people}
            columns={[
              { key: 'name', label: 'User', get: u => u.name },
              { key: 'email', label: 'Email', get: u => u.email },
              { key: 'role', label: 'Role', get: u => u.role },
              { key: 'dept', label: 'Department', get: u => u.dept || 'Org-Wide' },
              { key: 'status', label: 'Status', get: u => u.status },
            ]}
            renderRow={u => (
              <tr key={u.id}>
                <td className="font-medium flex items-center gap-3"><Avatar initials={(u.name.split(' ').map(p => p[0]).join('').slice(0, 2)) || '?'} size={32} /> {u.name}</td>
                <td className="text-muted text-sm">{u.email}</td>
                <td><Pill label={u.role.toUpperCase()} tone={u.role === 'admin' ? 'error' : u.role === 'head' ? 'warning' : 'neutral'} /></td>
                <td>{u.dept || 'Org-Wide'}</td>
                <td><Pill label={u.status} tone={statusTone(u.status)} /></td>
              </tr>
            )}
          />
        </div>
      </Card>

      {open && <InviteModal onClose={() => setOpen(false)} inviteUser={inviteUser} toast={toast} />}
    </div>
  );
}

function InviteModal({ onClose, inviteUser, toast }) {
  const [f, setF] = useState({ name: '', email: '', role: 'member', dept: 'Property Management' });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.name.trim() && /\S+@\S+\.\S+/.test(f.email);
  const submit = () => {
    if (!valid) return;
    inviteUser({ name: f.name, email: f.email, role: f.role, dept: f.role === 'admin' ? null : f.dept });
    toast(`Invitation sent to ${f.email}`, 'success');
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 className="m-0">Invite User</h3></div>
        <div className="modal-body flex flex-col gap-4">
          <Field label="Full name"><input className="search-input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="Jane Cooper" /></Field>
          <Field label="Work email"><input className="search-input" value={f.email} onChange={e => set('email', e.target.value)} placeholder="jane.cooper@acme.com" /></Field>
          <div className="grid-cols-2" style={{ gap: 16 }}>
            <Field label="Role"><Select value={f.role} onChange={v => set('role', v)} options={[{ value: 'member', label: 'Member' }, { value: 'head', label: 'Department Head' }, { value: 'admin', label: 'Admin' }]} /></Field>
            <Field label="Department"><Select value={f.dept} onChange={v => set('dept', v)} options={DEPARTMENTS} className={f.role === 'admin' ? 'opacity-50' : ''} /></Field>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>Send Invitation</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Governance — RBAC + Secret Vault (backs the Units of Work)
// ============================================================================
export function Governance() {
  const { unitsOfWork } = useStore();
  const usage = (name) => unitsOfWork.filter(u => u.auth.secret === name).length;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Governance" subtitle="Access control and the Secret Vault your Units of Work reference" />

      <Card>
        <div className="card-header"><h3>RBAC Permission Matrix</h3></div>
        <div className="table-wrap">
          <SortableTable
            className="table"
            rows={DEPARTMENTS.slice(0, 5)}
            columns={[
              { key: 'dept', label: 'Department', get: d => d },
              { label: 'Member' },
              { label: 'Head' },
              { label: 'Admin' },
            ]}
            renderRow={d => (
              <tr key={d}><td className="font-medium">{d}</td><td>Read, work tasks, approve own</td><td>Manage {d}, onboard AI, set cost</td><td>Global control</td></tr>
            )}
          />
        </div>
      </Card>

      <Card>
        <div className="card-header"><h3 className="flex items-center gap-2"><Lock size={16} /> Secret Vault</h3><span className="text-xs text-muted">Units of Work reference these — the proxy injects them server-side</span></div>
        <div className="table-wrap">
          <SortableTable
            rows={VAULT_SECRETS}
            columns={[
              { key: 'name', label: 'Secret', get: s => s.name },
              { key: 'type', label: 'Type', get: s => s.type },
              { label: 'Value' },
              { key: 'usage', label: 'Used by', get: s => usage(s.name) },
              { label: 'Rotated' },
            ]}
            renderRow={s => (
              <tr key={s.name}>
                <td className="font-mono text-sm">{s.name}</td>
                <td>{s.type}</td>
                <td className="font-mono text-muted">{s.masked}</td>
                <td>{usage(s.name)} unit{usage(s.name) === 1 ? '' : 's'} of work</td>
                <td className="text-muted text-sm">{s.rotated}</td>
              </tr>
            )}
          />
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Settings
// ============================================================================
export function Settings({ toast }) {
  const [model, setModel] = useState('opus-4-8');
  const [reasoning, setReasoning] = useState('medium');
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <SectionTitle title="Settings" subtitle="Platform configuration and defaults" />
      <Card>
        <div className="card-header"><h3>Organization Profile</h3></div>
        <div className="card-body flex flex-col gap-4">
          <Field label="Organization Name"><input className="search-input" defaultValue="Acme Corp Global" /></Field>
          <Field label="Default Model Gateway" hint="New AI employees default to this model.">
            <Select value={model} onChange={setModel} options={MODELS.map(m => ({ value: m.id, label: `${m.name} · ${m.vendor}` }))} />
          </Field>
          <Field label="Default Reasoning Level">
            <div className="seg" style={{ display: 'flex', maxWidth: 360 }}>
              {REASONING_LEVELS.map(r => <button key={r.id} className={reasoning === r.id ? 'on' : ''} style={{ flex: 1 }} onClick={() => setReasoning(r.id)}>{r.label}</button>)}
            </div>
          </Field>
          <div className="mt-2"><button className="btn btn-primary" onClick={() => toast('Settings saved', 'success')}>Save Changes</button></div>
        </div>
      </Card>
    </div>
  );
}
