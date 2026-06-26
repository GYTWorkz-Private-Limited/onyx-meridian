import React, { useState } from 'react';
import { Card, SectionTitle, Pill, Modal, Note, Field, Select, SecuredBadge, useSortable, SortHead, SkeletonRows, useFakeLoad } from '../components/ui.jsx';
import { useStore } from '../data/StoreContext.jsx';
import { DEPARTMENTS, VAULT_SECRETS, uowRoi, WORKFLOWS } from '../data/store.js';
import { BrandIcon } from '../components/BrandIcon.jsx';
import { Boxes, Plus, Lock, ShieldCheck, Clock, DollarSign, Info, Building2, UserCheck, Search, ChevronDown, Sparkles, RefreshCw, Repeat, ShieldAlert, TrendingUp, Workflow as WorkflowIcon, Calendar, Zap, Bot } from 'lucide-react';

const AUTH_LABEL = {
  'proxy-delegated': 'Proxy · your token',
  'vault-credential': 'Vault credential',
  'api-key': 'Vault API key',
};
const authTone = (m) => (m === 'proxy-delegated' ? 'info' : 'purple');
const RACI_ROLES = [
  { key: 'responsible', label: 'Responsible', hint: 'Does the work' },
  { key: 'accountable', label: 'Accountable', hint: 'Owns the outcome' },
  { key: 'consulted', label: 'Consulted', hint: 'Gives input' },
  { key: 'informed', label: 'Informed', hint: 'Kept in the loop' },
];

function groupByDept(items) {
  const map = {};
  items.forEach(it => { (map[it.dept] = map[it.dept] || []).push(it); });
  return DEPARTMENTS.filter(d => map[d]?.length).map(d => ({ dept: d, items: map[d] }));
}

export function UnitOfWork({ role, user, toast }) {
  const { unitsOfWork, addUnitOfWork, people } = useStore();
  const [selected, setSelected] = useState(null);
  const [create, setCreate] = useState(false);
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState({});

  const personName = (id) => people.find(p => p.id === id)?.name;

  const scoped = role === 'admin' ? unitsOfWork : unitsOfWork.filter(u => u.dept === user.dept);
  const q = query.trim().toLowerCase();
  const data = !q ? scoped : scoped.filter(u =>
    [u.name, u.description, u.endpoint.path, u.endpoint.method, u.dept, AUTH_LABEL[u.auth.mode], personName(u.raci?.accountable)]
      .filter(Boolean).some(t => t.toLowerCase().includes(q))
  );
  const groups = groupByDept(data);
  // Accordions: closed by default; searching forces matches open.
  const isOpen = (dept) => (q ? true : !!opened[dept]);
  const toggle = (dept) => setOpened(c => ({ ...c, [dept]: !c[dept] }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <SectionTitle title="Units of Work" subtitle="The atomic, secured capabilities your AI employees call — organized by department." />
        <button className="btn btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> Add Unit of Work</button>
      </div>

      <Note icon={Lock}>
        Every Unit of Work runs through the <strong>Meridian Proxy</strong>. The endpoint stores only a <em>reference</em> to a
        secret in the Governance vault (or reuses your logged-in token) — the raw key never touches this config or the browser.
      </Note>

      <div className="relative" style={{ maxWidth: 420 }}>
        <Search className="absolute left-3 top-2.5 text-muted" size={16} />
        <input className="search-input has-icon" placeholder="Search units of work, endpoints, people…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {groups.length === 0 && <Card><div className="card-body text-muted text-sm">No units of work match “{query}”.</div></Card>}

      {groups.map(g => (
        <DeptUowGroup key={g.dept} g={g} open={isOpen(g.dept)} onToggle={() => toggle(g.dept)} setSelected={setSelected} personName={personName} />
      ))}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="lg">
        {selected && <UowDetail uow={selected} personName={personName} />}
      </Modal>

      {create && <CreateUow role={role} user={user} onClose={() => setCreate(false)} addUnitOfWork={addUnitOfWork} people={people} toast={toast} />}
    </div>
  );
}

const PAGE_SIZE = 10;
const mapMin = (v) => (v === 'na' || v == null ? 'N/A' : `${v}m`);

const UOW_COLS = (personName) => [
  { key: 'name', label: 'Unit of Work', get: u => u.name },
  { key: 'endpoint', label: 'Endpoint', get: u => `${u.endpoint.method} ${u.endpoint.path}` },
  { key: 'security', label: 'Security', get: u => AUTH_LABEL[u.auth.mode] },
  { key: 'accountable', label: 'Accountable', get: u => personName(u.raci?.accountable) || '' },
  { key: 'manual', label: 'Manual → Auto', get: u => (u.mapping.manualMinutes === 'na' ? -1 : u.mapping.manualMinutes) },
  { label: '' },
];

function DeptUowGroup({ g, open, onToggle, setSelected, personName }) {
  const [page, setPage] = useState(0);
  const cols = UOW_COLS(personName);
  const { sort, toggle, apply } = useSortable(cols);
  const loading = useFakeLoad([open]);
  const sorted = apply(g.items);
  const pages = Math.ceil(sorted.length / PAGE_SIZE);
  const cur = Math.min(page, pages - 1);
  const slice = sorted.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);

  return (
    <Card className="p-0">
      <button className="accordion-head" onClick={onToggle}>
        <ChevronDown size={16} className="text-muted accordion-chevron" style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
        <Building2 size={16} className="text-muted" />
        <h3 className="m-0">{g.dept}</h3>
        <span className="badge">{g.items.length}</span>
      </button>
      {open && (
        <>
          <div className="table-wrap border-t">
            <table className="table">
              <SortHead columns={cols} sort={sort} toggle={toggle} />
              {loading ? <SkeletonRows columns={cols} rows={Math.min(slice.length || 4, 5)} /> : (
              <tbody>
                {slice.map(u => (
                  <tr key={u.id} className="cursor-pointer" onClick={() => setSelected(u)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center text-purple-600"><Boxes size={16} /></div>
                        <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted">{u.description}</div></div>
                      </div>
                    </td>
                    <td><span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{u.endpoint.method} {u.endpoint.path}</span></td>
                    <td><Pill label={AUTH_LABEL[u.auth.mode]} tone={authTone(u.auth.mode)} /></td>
                    <td className="text-sm">{personName(u.raci?.accountable) || <span className="text-muted">—</span>}</td>
                    <td className="text-sm">{mapMin(u.mapping.manualMinutes)} → {mapMin(u.mapping.automatedMinutes)}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(u); }}>Details</button></td>
                  </tr>
                ))}
              </tbody>
              )}
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
              <span className="text-muted">Showing {cur * PAGE_SIZE + 1}–{Math.min(cur * PAGE_SIZE + PAGE_SIZE, g.items.length)} of {g.items.length}</span>
              <div className="flex items-center gap-2">
                <button className="btn btn-outline btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Prev</button>
                <span className="text-muted">Page {cur + 1} / {pages}</span>
                <button className="btn btn-outline btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function UowDetail({ uow, personName }) {
  const { employees } = useStore();
  const naTime = uow.mapping.manualMinutes === 'na';
  const naCost = uow.mapping.manualCostUsd === 'na';
  const timeSaved = naTime ? null : uow.mapping.manualMinutes - uow.mapping.automatedMinutes;
  const costSaved = naCost ? null : uow.mapping.manualCostUsd - uow.mapping.automatedCostUsd;
  const raci = uow.raci || {};
  const hasRaci = RACI_ROLES.some(r => raci[r.key]);
  const attachedWorkflows = WORKFLOWS.filter(w => (w.uowIds || []).includes(uow.id));
  const runnersOf = (wfId) => employees.filter(e => (e.workflowIds || []).includes(wfId));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">{uow.description}</p>

      <Card>
        <div className="card-header"><h3 className="flex items-center gap-2"><WorkflowIcon size={16} /> Used in workflows</h3><Pill label={`${attachedWorkflows.length}`} tone="info" /></div>
        <div className="card-body flex flex-col gap-2">
          {attachedWorkflows.length === 0 && (
            <div className="text-muted text-sm">Not part of any workflow yet — it can be composed into one when you onboard an AI employee.</div>
          )}
          {attachedWorkflows.map(w => {
            const runners = runnersOf(w.id);
            return (
              <div key={w.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="ico" style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--blue-50)', color: 'var(--blue-600)', flexShrink: 0 }}><WorkflowIcon size={15} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{w.name}</div>
                  <div className="text-xs text-muted flex items-center gap-3 flex-wrap" style={{ marginTop: 2 }}>
                    <span className="flex items-center gap-1"><Building2 size={11} /> {w.dept}</span>
                    {w.trigger === 'proactive'
                      ? <span className="flex items-center gap-1"><Calendar size={11} /> {w.schedule}</span>
                      : <span className="flex items-center gap-1"><Zap size={11} /> on event</span>}
                    {runners.length > 0 && <span className="flex items-center gap-1"><Bot size={11} /> {runners.map(r => r.name).join(', ')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Pill label={w.trigger} tone={w.trigger === 'proactive' ? 'purple' : 'neutral'} />
                  <span className="text-xs text-muted font-medium">{w.successRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="card-header"><h3>Endpoint</h3></div>
        <div className="card-body flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2"><Pill label={uow.endpoint.method} tone="info" /><span className="font-mono">{uow.endpoint.baseUrl}{uow.endpoint.path}</span></div>
          <div className="text-xs text-muted">Calls are proxied — the base URL + path are resolved server-side by the Meridian Proxy.</div>
        </div>
      </Card>

      <Card>
        <div className="card-header"><h3>Security</h3><SecuredBadge>Secured</SecuredBadge></div>
        <div className="card-body flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between"><span className="text-muted">Auth mode</span><Pill label={AUTH_LABEL[uow.auth.mode]} tone={authTone(uow.auth.mode)} /></div>
          {uow.auth.mode === 'proxy-delegated' ? (
            <Note icon={ShieldCheck}>Reuses <strong>your logged-in token</strong> via the proxy. Since you already hold the permission, no separate key is provisioned — and nothing is stored on the Unit of Work.</Note>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2"><Lock size={15} className="text-gray-500" /><span>Vault secret</span></div>
              <span className="font-mono text-sm">{uow.auth.secret}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="text-muted text-xs">Scopes:</span>
            {uow.auth.scopes.map(s => <span key={s} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{s}</span>)}
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-header"><h3 className="flex items-center gap-2"><UserCheck size={16} /> Accountability (RACI)</h3></div>
        <div className="card-body">
          {!hasRaci && <div className="text-muted text-sm">No RACI assigned — these are optional.</div>}
          {hasRaci && (
            <div className="grid-cols-2" style={{ gap: 12 }}>
              {RACI_ROLES.map(r => (
                <div key={r.key} className="flex items-center justify-between p-2 border rounded">
                  <div><div className="text-sm font-medium">{r.label}</div><div className="text-xs text-muted">{r.hint}</div></div>
                  <span className="text-sm">{personName(raci[r.key]) || <span className="text-muted">—</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="card-header"><h3>Effectiveness mapping</h3><Pill label="4 dimensions" tone="purple" /></div>
        <div className="card-body">
          <Note icon={Info}>Effectiveness is measured across <strong>time, cost, volume and quality</strong>. The manual baseline is captured during onboarding and you don’t manage it day-to-day — the resulting ROI simply surfaces to admins on the Effectiveness page.</Note>
          {(() => {
            const r = uowRoi(uow.mapping);
            return (
              <div className="flex flex-col gap-3 mt-3">
                <div className="grid-cols-2" style={{ gap: 12 }}>
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <div className="flex items-center gap-1 text-xs text-muted"><Clock size={12} /> Time per run</div>
                    {naTime ? <div className="font-bold text-muted">Not measured (N/A)</div> : (<>
                      <div className="font-bold">{uow.mapping.manualMinutes}m manual → {uow.mapping.automatedMinutes}m auto</div>
                      <div className="text-xs text-green-600 font-medium mt-1">{timeSaved}m saved each run · {r.timeReductionPct}% faster</div>
                    </>)}
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <div className="flex items-center gap-1 text-xs text-muted"><DollarSign size={12} /> Cost per run</div>
                    {naCost ? <div className="font-bold text-muted">Not measured (N/A)</div> : (<>
                      <div className="font-bold">${uow.mapping.manualCostUsd} manual → ${uow.mapping.automatedCostUsd} auto</div>
                      <div className="text-xs text-green-600 font-medium mt-1">${costSaved.toFixed(2)} saved each run</div>
                    </>)}
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <div className="flex items-center gap-1 text-xs text-muted"><Repeat size={12} /> Volume</div>
                    <div className="font-bold">{r.runsPerMonth.toLocaleString()} runs / month{r.manualPeople > 1 ? ` · ${r.manualPeople} people` : ''}</div>
                    <div className="text-xs text-green-600 font-medium mt-1">~{Math.round(r.monthlyHoursSaved)}h saved / month</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <div className="flex items-center gap-1 text-xs text-muted"><ShieldAlert size={12} /> Quality</div>
                    <div className="font-bold">{r.manualErrorRate}% manual → {r.automatedErrorRate}% auto</div>
                    <div className="text-xs text-green-600 font-medium mt-1">+{r.qualityUpliftPct}% fewer errors / rework</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--grad-aurora)', borderColor: 'var(--blue-200)' }}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-blue-700"><TrendingUp size={15} /> Projected annual ROI</span>
                  <span className="text-lg font-bold text-blue-700" style={{ fontVariantNumeric: 'tabular-nums' }}>${Math.round(r.annualCostSaved).toLocaleString()}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </Card>
    </div>
  );
}

const SYSTEM_BASE = {
  sap: 'https://erp.acme.com/sap/opu/odata', yardi: 'https://api.yardi.com/voyager',
  docusign: 'https://api.docusign.net/restapi/v2.1', appfolio: 'https://api.appfolio.com/v2',
  mri: 'https://api.mrisoftware.com/v1', stripe: 'https://api.stripe.com/v1',
  procore: 'https://api.procore.com/rest/v1.0', salesforce: 'https://api.salesforce.com/services/data/v59.0',
  realpage: 'https://api.realpage.com/v1', entrata: 'https://api.entrata.com/v1',
  netsuite: 'https://api.netsuite.com/services/rest/record/v1', dynamics: 'https://api.dynamics.com/data/v9.2',
  sage: 'https://api.intacct.com/ia/xml', buildium: 'https://api.buildium.com/v1', coupa: 'https://api.coupa.com/api',
};
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const titleCase = (s) => s.replace(/\b\w/g, c => c.toUpperCase());
const GEN_PHASES = ['Reading the connection…', 'Resolving endpoint & method…', 'Securing via Meridian Proxy…', 'Estimating the manual baseline…', 'Drafting the Unit of Work…'];

// Deterministically turn a plain-language prompt + a connected system into a
// drafted Unit of Work config.
function deriveUow(prompt, connector, dept) {
  const lower = prompt.toLowerCase();
  const isWrite = /\b(create|update|open|sync|push|send|generate|post|file|submit|schedule|reconcile|publish|assign|close)\b/.test(lower);
  const words = prompt.trim().split(/\s+/).slice(0, 6).join(' ');
  const name = titleCase(words || 'Custom Capability').slice(0, 48);
  const base = connector ? (SYSTEM_BASE[connector.brand] || `https://api.${connector.brand}.com`) : 'https://api.internal.com';
  const hasSecret = connector && connector.secret;
  const manualMinutes = 12 + (prompt.length % 36);
  return {
    name,
    description: prompt.trim() || 'AI-drafted unit of work.',
    dept,
    method: isWrite ? 'POST' : 'GET',
    baseUrl: base,
    path: `/${slugify(name) || 'resource'}`,
    authMode: hasSecret ? 'vault-credential' : 'proxy-delegated',
    secret: hasSecret ? connector.secret : VAULT_SECRETS[0].name,
    manualMinutes, manualCostUsd: Math.round(manualMinutes * 0.75),
    runsPerMonth: 20 + (prompt.length * 3) % 80,
    manualErrorRate: 5 + (prompt.length % 12),
    manualPeople: 1 + (prompt.length % 3),
  };
}

function CreateUow({ role, user, onClose, addUnitOfWork, people, toast }) {
  const { connectors } = useStore();
  const [mode, setMode] = useState('ai'); // 'ai' (agentic) | 'manual'
  const [prompt, setPrompt] = useState('');
  const [connId, setConnId] = useState('');
  const [phase, setPhase] = useState(null); // null | 0..GEN_PHASES.length (animation index)
  const [f, setF] = useState({
    name: '', description: '', dept: role === 'admin' ? 'Property Management' : user.dept,
    baseUrl: 'https://api.yardi.com', path: '/voyager/resource', method: 'GET',
    authMode: 'proxy-delegated', secret: VAULT_SECRETS[0].name,
    manualMinutes: 15, manualCostUsd: 10, naMinutes: false, naCost: false,
    runsPerMonth: 40, manualErrorRate: 8, naErrorRate: false, manualPeople: 1,
    responsible: '', accountable: '', consulted: '', informed: '',
    aiDrafted: false,
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const peopleOpts = [{ value: '', label: '— Optional —' }, ...people.map(p => ({ value: p.id, label: `${p.name} · ${p.role}` }))];

  const deptConnectors = connectors.filter(c => c.dept === f.dept);
  const generate = () => {
    if (!prompt.trim()) { toast('Describe what the capability should do', 'info'); return; }
    const connector = connectors.find(c => c.id === connId) || null;
    setPhase(0);
    const step = (i) => {
      if (i >= GEN_PHASES.length) {
        const d = deriveUow(prompt, connector, f.dept);
        setF(s => ({ ...s, ...d, naMinutes: false, naCost: false, naErrorRate: false, aiDrafted: true }));
        setPhase(null);
        setMode('manual');
        toast('AI drafted the Unit of Work — review & adjust', 'success');
        return;
      }
      setPhase(i);
      setTimeout(() => step(i + 1), 480);
    };
    setTimeout(() => step(1), 480);
  };

  const submit = () => {
    if (!f.name.trim()) return;
    addUnitOfWork({
      name: f.name, description: f.description || 'Custom unit of work.', dept: f.dept,
      endpoint: { baseUrl: f.baseUrl, path: f.path, method: f.method },
      auth: { mode: f.authMode, secret: f.authMode === 'proxy-delegated' ? null : f.secret, scopes: ['read'] },
      mapping: {
        manualMinutes: f.naMinutes ? 'na' : Number(f.manualMinutes),
        manualCostUsd: f.naCost ? 'na' : Number(f.manualCostUsd),
        automatedMinutes: f.naMinutes ? 'na' : 1,
        automatedCostUsd: f.naCost ? 'na' : 0.4,
        runsPerMonth: Number(f.runsPerMonth) || undefined,
        manualPeople: Number(f.manualPeople) || undefined,
        manualErrorRate: f.naErrorRate ? 'na' : Number(f.manualErrorRate),
      },
      raci: { responsible: f.responsible, accountable: f.accountable, consulted: f.consulted, informed: f.informed },
    });
    toast('Unit of Work created & secured', 'success');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Add Unit of Work" size="lg">
      <div className="flex flex-col gap-4">
        <div className="seg" style={{ alignSelf: 'flex-start' }}>
          <button className={mode === 'ai' ? 'on' : ''} onClick={() => setMode('ai')}><Sparkles size={13} /> Generate with AI</button>
          <button className={mode === 'manual' ? 'on' : ''} onClick={() => setMode('manual')}>Manual</button>
        </div>

        {mode === 'ai' && (
          <div className="flex flex-col gap-4">
            <Note icon={Sparkles}>Describe the capability in plain language and pick a connected system. Meridian drafts the secured endpoint, auth and effectiveness mapping for you — you review before saving.</Note>
            <Field label="Department"><Select value={f.dept} onChange={v => { set('dept', v); setConnId(''); }} options={role === 'admin' ? DEPARTMENTS : [user.dept]} /></Field>
            <Field label="What should this capability do?">
              <textarea className="search-input" style={{ minHeight: 80, resize: 'vertical' }} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Pull the latest delinquency report for a property and flag tenants over 30 days late" />
            </Field>
            <div>
              <div className="text-sm font-medium mb-2">Use a connected system <span className="text-xs text-muted">— {f.dept}</span></div>
              {deptConnectors.length === 0 ? (
                <div className="text-xs text-muted">No connectors for this department — the draft will use a proxy-delegated token.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {deptConnectors.map(c => (
                    <button key={c.id} className={`conn-pick ${connId === c.id ? 'on' : ''}`} onClick={() => setConnId(connId === c.id ? '' : c.id)}>
                      <BrandIcon brand={c.brand} size={22} />
                      <div className="text-left"><div className="text-sm font-medium">{c.name}</div><div className="text-[11px] text-muted">{c.connected ? 'Connected' : 'Not connected'}</div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {phase !== null ? (
              <div className="ai-gen">
                <RefreshCw size={16} className="animate-spin text-purple-600" />
                <span className="text-sm">{GEN_PHASES[phase]}</span>
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={generate}><Sparkles size={16} /> Generate Unit of Work</button>
              </div>
            )}
          </div>
        )}

        {mode === 'manual' && (<>
        {f.aiDrafted && <Note icon={Sparkles}>Drafted by AI from your prompt — review every field and adjust before creating.</Note>}
        <div className="grid-cols-2" style={{ gap: 16 }}>
          <Field label="Name"><input className="search-input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Pull Rent Roll" /></Field>
          <Field label="Department"><Select value={f.dept} onChange={v => set('dept', v)} options={role === 'admin' ? DEPARTMENTS : [user.dept]} /></Field>
        </div>
        <Field label="Description"><input className="search-input" value={f.description} onChange={e => set('description', e.target.value)} placeholder="What does this capability do?" /></Field>

        <div className="text-sm font-semibold mt-1">Endpoint</div>
        <div className="grid-cols-3" style={{ gap: 12 }}>
          <Field label="Method"><Select value={f.method} onChange={v => set('method', v)} options={['GET', 'POST', 'PATCH', 'DELETE']} /></Field>
          <Field label="Base URL"><input className="search-input" value={f.baseUrl} onChange={e => set('baseUrl', e.target.value)} /></Field>
          <Field label="Path"><input className="search-input" value={f.path} onChange={e => set('path', e.target.value)} /></Field>
        </div>

        <div className="text-sm font-semibold mt-1">Security</div>
        <Field label="Auth mode" hint="Proxy-delegated reuses your logged-in token. Otherwise the proxy injects a named vault secret — the key never lives here.">
          <Select value={f.authMode} onChange={v => set('authMode', v)} options={[
            { value: 'proxy-delegated', label: 'Proxy · reuse my logged-in token' },
            { value: 'vault-credential', label: 'Vault credential' },
            { value: 'api-key', label: 'Vault API key' },
          ]} />
        </Field>
        {f.authMode !== 'proxy-delegated' && (
          <Field label="Vault secret reference"><Select value={f.secret} onChange={v => set('secret', v)} options={VAULT_SECRETS.map(s => ({ value: s.name, label: `${s.name} (${s.type})` }))} /></Field>
        )}

        <div className="text-sm font-semibold mt-1">Accountability (RACI) <span className="text-xs text-muted font-normal">— all optional</span></div>
        <div className="grid-cols-2" style={{ gap: 12 }}>
          {RACI_ROLES.map(r => (
            <Field key={r.key} label={r.label} hint={r.hint}><Select value={f[r.key]} onChange={v => set(r.key, v)} options={peopleOpts} /></Field>
          ))}
        </div>

        <div className="text-sm font-semibold mt-1">Effectiveness mapping</div>
        <Note icon={Info}>For background measurement only — capture the manual baseline across <strong>time, cost, volume and quality</strong>. These feed the ROI shown to admins on the Effectiveness page. If there’s no manual baseline for a field, mark it <strong>N/A</strong>. You won’t manage this after onboarding.</Note>
        <div className="text-xs font-semibold text-muted uppercase tracking-wide">Time &amp; cost</div>
        <div className="grid-cols-2" style={{ gap: 16 }}>
          <Field label="Manual minutes / run">
            <input type="number" className="search-input" value={f.naMinutes ? '' : f.manualMinutes} disabled={f.naMinutes} placeholder={f.naMinutes ? 'N/A' : ''} onChange={e => set('manualMinutes', e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-muted mt-2 cursor-pointer">
              <input type="checkbox" checked={f.naMinutes} onChange={e => set('naMinutes', e.target.checked)} /> N/A — no manual baseline
            </label>
          </Field>
          <Field label="Manual cost / run ($)">
            <input type="number" className="search-input" value={f.naCost ? '' : f.manualCostUsd} disabled={f.naCost} placeholder={f.naCost ? 'N/A' : ''} onChange={e => set('manualCostUsd', e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-muted mt-2 cursor-pointer">
              <input type="checkbox" checked={f.naCost} onChange={e => set('naCost', e.target.checked)} /> N/A — no manual baseline
            </label>
          </Field>
        </div>
        <div className="text-xs font-semibold text-muted uppercase tracking-wide mt-1">Volume &amp; quality</div>
        <div className="grid-cols-3" style={{ gap: 16 }}>
          <Field label="Runs / month" hint="How often the manual task ran — scales per-run savings into ROI.">
            <input type="number" className="search-input" value={f.runsPerMonth} onChange={e => set('runsPerMonth', e.target.value)} placeholder="e.g. 40" />
          </Field>
          <Field label="People / run" hint="How many staff the manual version needed.">
            <input type="number" className="search-input" value={f.manualPeople} onChange={e => set('manualPeople', e.target.value)} placeholder="e.g. 1" />
          </Field>
          <Field label="Manual error / rework rate (%)" hint="Baseline error rate automation drives down.">
            <input type="number" className="search-input" value={f.naErrorRate ? '' : f.manualErrorRate} disabled={f.naErrorRate} placeholder={f.naErrorRate ? 'N/A' : ''} onChange={e => set('manualErrorRate', e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-muted mt-2 cursor-pointer">
              <input type="checkbox" checked={f.naErrorRate} onChange={e => set('naErrorRate', e.target.checked)} /> N/A
            </label>
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-2 pt-4 border-t">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}><ShieldCheck size={16} /> Create Secured Unit</button>
        </div>
        </>)}
      </div>
    </Modal>
  );
}
