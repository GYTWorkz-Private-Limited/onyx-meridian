import React, { useState, useEffect } from 'react';
import { Card, SectionTitle, Pill, Bar, statusTone, Modal, Note, Field, Select, SecuredBadge, Avatar, AgentAvatar, useSortable, SortHead, SkeletonRows, useFakeLoad } from '../components/ui.jsx';
import { useStore } from '../data/StoreContext.jsx';
import { WORKFLOWS, KNOWLEDGE_GRAPH, KG_STATS, DEPARTMENTS, UNITS_OF_WORK, uowById, uowRoi } from '../data/store.js';
import { KnowledgeGraph } from '../components/KnowledgeGraph.jsx';
import { BrandIcon } from '../components/BrandIcon.jsx';
import { Rocket, CheckCircle, RefreshCw, Plus, Boxes, Plug, Info, Calendar, Zap, Building2, Clock, DollarSign, Lock, ShieldCheck, ArrowRight, Loader2, Search, ChevronDown, Gauge, Repeat, TrendingUp, ShieldAlert, Sparkles, FileText, Video, Music, Play, Pause, Upload, Network, FileAudio, FileVideo } from 'lucide-react';

// group helper: returns [{ dept, items }] in DEPARTMENTS order, only non-empty
function groupByDept(items) {
  const map = {};
  items.forEach(it => { (map[it.dept] = map[it.dept] || []).push(it); });
  return DEPARTMENTS.filter(d => map[d]?.length).map(d => ({ dept: d, items: map[d] }));
}

// ============================================================================
// Department Onboarding — sophisticated multi-step stepper
// ============================================================================
const DISCOVERY_PHASES = [
  { label: 'Authenticating with connected systems', detail: 'Opening MCP sessions & validating scopes' },
  { label: 'Crawling API surface & object schemas', detail: 'Reading endpoints, entities and permissions' },
  { label: 'Extracting candidate Units of Work', detail: 'Clustering operations into atomic capabilities' },
  { label: 'Scoring confidence & de-duplicating', detail: 'Pruning overlapping and low-signal candidates' },
  { label: 'Re-ranking by leverage & frequency', detail: 'Prioritising high-impact units', rerank: true },
  { label: 'Mapping manual time & cost', detail: 'Estimating savings against each unit' },
  { label: 'Finalizing the Unit-of-Work catalog', detail: 'Securing each capability via the Meridian Proxy' },
];

// Extra synthetic candidates per department so discovery surfaces a rich set.
const EXTRA_CANDIDATES = {
  'Acquisitions': ['Score Target Submarket', 'Pull Rent Comparables', 'Build Sources & Uses', 'Draft Letter of Intent', 'Estimate CapEx Budget', 'Run Sensitivity Analysis', 'Flag Environmental Risk', 'Sync Deal to Pipeline CRM'],
  'Property Management': ['Generate Delinquency Notice', 'Reconcile Vendor Invoice', 'Post Lease Charge', 'Close Work Order', 'Sync Tenant Ledger', 'Schedule Turn Cleaning'],
  'Leasing': ['Score Applicant Credit', 'Schedule Unit Tour', 'Draft Renewal Offer', 'Sync Lead from Portal', 'Generate Move-in Packet', 'Run Background Check'],
  'Finance': ['Post Journal Entry', 'Run AP Aging Report', 'Match Bank Statement', 'Forecast Cash Position', 'Generate Owner Statement', 'Flag Budget Variance'],
  'Asset Management': ['Refresh Cap-Rate Model', 'Build Hold/Sell Analysis', 'Update Debt Covenant Tracker', 'Generate Investor Report', 'Benchmark Asset vs Market'],
  'Facilities': ['Triage Maintenance Ticket', 'Order Replacement Part', 'Schedule Vendor Visit', 'Log Equipment Reading', 'Track Warranty Expiry'],
  'Legal': ['Review Lease Clause', 'Track Compliance Deadline', 'Generate NDA', 'Archive Executed Contract', 'Flag Regulatory Change'],
  'Marketing': ['Generate Listing Copy', 'Schedule Social Post', 'Pull Campaign Metrics', 'Score Inbound Lead', 'A/B Test Listing Photos'],
};

// deterministic pseudo-confidence from a string so renders are stable
function confidenceFor(seed, base) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1000;
  return Math.min(0.98, base + (h % 100) / 1000); // base..base+0.099
}

// Build the candidate set the Discovery Agent "finds": real catalog units for
// the department (high confidence) plus synthesized candidates (lower).
function buildCandidates(dept) {
  const real = UNITS_OF_WORK.filter(u => u.dept === dept);
  const seedReal = (real.length ? real : UNITS_OF_WORK.slice(0, 2).map(u => ({ ...u, dept })))
    .map(u => ({ ...u, mapping: { ...u.mapping }, confidence: confidenceFor(u.name, 0.88), synthetic: false }));
  const methods = ['GET', 'POST', 'GET', 'POST', 'PATCH'];
  const extra = (EXTRA_CANDIDATES[dept] || ['Read Records', 'Update Records', 'Export Report', 'Notify Owner'])
    .map((name, i) => ({
      id: `cand-${dept}-${i}`.replace(/\s/g, ''), name, dept, synthetic: true,
      confidence: confidenceFor(name, 0.6),
      endpoint: { method: methods[i % methods.length], baseUrl: 'https://api.acme.com', path: `/v1/${name.toLowerCase().replace(/[^a-z]+/g, '-')}` },
      auth: { mode: i % 3 === 0 ? 'proxy-delegated' : 'vault-credential', secret: i % 3 === 0 ? null : 'ACME_SVC', scopes: ['read', 'write'] },
      mapping: { manualMinutes: 12 + (i * 4) % 30, manualCostUsd: 8 + (i * 3) % 24, automatedMinutes: 1 + i % 2, automatedCostUsd: 0.3 + (i % 4) / 10, runsPerMonth: 40 + (i * 17) % 220, manualErrorRate: 6 + (i * 3) % 14 },
    }));
  return [...seedReal, ...extra];
}

export function Onboarding({ toast, go }) {
  const { connectors } = useStore();
  const [step, setStep] = useState(0);
  const [dept, setDept] = useState('Acquisitions');
  const [region, setRegion] = useState('West Region');
  const [picked, setPicked] = useState(connectors.filter(c => c.connected).map(c => c.id));
  const [discIdx, setDiscIdx] = useState(-1);
  const [candidates, setCandidates] = useState(null); // streaming candidates
  const [revealCount, setRevealCount] = useState(0);
  const [reranked, setReranked] = useState(false);
  const [discovered, setDiscovered] = useState(null); // final UoWs

  // Workflow composition belongs to AI-employee onboarding, not department
  // onboarding — a department just connects systems and extracts its Units of Work.
  const steps = ['Department', 'Connect Systems', 'Discover Units of Work', 'Effectiveness Mapping', 'Review & Publish'];

  // kick off discovery when arriving at step 2
  useEffect(() => {
    if (step === 2 && discovered === null && candidates === null) {
      setCandidates(buildCandidates(dept));
      setRevealCount(0); setReranked(false); setDiscIdx(0);
    }
  }, [step, discovered, candidates, dept]);

  // phase progression — ~2.8s each so the full scan runs ~20s
  useEffect(() => {
    if (discIdx < 0 || candidates === null) return;
    if (discIdx >= DISCOVERY_PHASES.length) {
      const finalList = [...candidates].sort((a, b) => b.confidence - a.confidence);
      setDiscovered(finalList.map(u => ({ ...u, mapping: { ...u.mapping } })));
      return;
    }
    const t = setTimeout(() => {
      if (DISCOVERY_PHASES[discIdx].rerank) {
        setCandidates(cs => [...cs].sort((a, b) => b.confidence - a.confidence));
        setReranked(true);
      }
      setDiscIdx(i => i + 1);
    }, 2800);
    return () => clearTimeout(t);
  }, [discIdx, candidates, dept]);

  // stream candidates in one-by-one for a live "found it" feel
  useEffect(() => {
    if (candidates === null || discovered) return;
    if (revealCount >= candidates.length) return;
    const t = setTimeout(() => setRevealCount(n => n + 1), 520);
    return () => clearTimeout(t);
  }, [candidates, revealCount, discovered]);

  const togglePick = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const setMapping = (i, k, v) => setDiscovered(d => d.map((u, j) => j === i ? { ...u, mapping: { ...u.mapping, [k]: Number(v) } } : u));
  const analyzing = step === 2 && discovered === null;
  const canNext = step === 2 ? !analyzing : true;
  const resetDiscovery = () => { setDiscovered(null); setDiscIdx(-1); setCandidates(null); setRevealCount(0); setReranked(false); };

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const publish = () => { toast(`${dept} onboarded — ${discovered.length} Units of Work published`, 'success'); setStep(0); resetDiscovery(); go?.('departments'); };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Department Onboarding" subtitle="Onboard a department: connect its systems, derive its Units of Work and map effectiveness." />

      <Card className="max-w-7xl">
        <div className="card-body">
          <div className="wizard-steps mb-6" style={{ flexWrap: 'wrap', gap: 8 }}>
            {steps.map((s, i) => (
              <div key={s} className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`} style={{ flex: 'none' }}>
                <div className="dot">{i < step ? <CheckCircle size={14} /> : i + 1}</div>
                <div className="lbl" style={{ marginRight: 10 }}>{s}</div>
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Note icon={Building2}>Start by identifying the department you’re bringing onto the platform.</Note>
              <div className="grid-cols-2" style={{ gap: 16 }}>
                <Field label="Department"><Select value={dept} onChange={setDept} options={DEPARTMENTS} /></Field>
                <Field label="Region / portfolio"><input className="search-input" value={region} onChange={e => setRegion(e.target.value)} /></Field>
              </div>
              <Field label="What does this department do?">
                <textarea className="search-input" style={{ minHeight: 80, resize: 'vertical' }} defaultValue={`${dept} operations across the ${region} property portfolio.`} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Note icon={Plug}>Select the ERP and property systems this department works through. The Discovery Agent will read these to extract Units of Work.</Note>
              <div className="grid-cols-2" style={{ gap: 12 }}>
                {connectors.map(c => {
                  const on = picked.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ borderColor: on ? 'var(--blue-500)' : 'var(--gray-200)', background: on ? 'var(--blue-50)' : 'var(--surface, white)' }}>
                      <input type="checkbox" checked={on} onChange={() => togglePick(c.id)} />
                      <BrandIcon brand={c.brand} size={30} />
                      <div className="flex-1"><div className="font-medium text-sm">{c.name}</div><div className="text-xs text-muted">{c.category}</div></div>
                      {c.connected && <Pill label="connected" tone="success" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && analyzing && (
            <div className="flex flex-col gap-5 py-4">
              <div className="flex items-center gap-3">
                <RefreshCw size={26} className="animate-spin text-blue-500" />
                <div>
                  <div className="font-semibold">Running Discovery Agent on {dept}…</div>
                  <div className="text-sm text-muted">Reading {picked.length} connected system{picked.length === 1 ? '' : 's'} · <strong>{Math.min(revealCount, candidates?.length || 0)}</strong> candidate Units of Work found{reranked ? ' · re-ranked by leverage' : ''}</div>
                </div>
              </div>

              {/* overall progress */}
              <Bar value={discIdx} max={DISCOVERY_PHASES.length} tone="blue" />

              <div className="grid-cols-2" style={{ gap: 20, alignItems: 'start' }}>
                {/* phase checklist */}
                <div className="flex flex-col gap-2">
                  {DISCOVERY_PHASES.map((p, i) => (
                    <div key={p.label} className="flex items-start gap-3 p-2.5 rounded-lg border" style={{ opacity: i > discIdx ? 0.4 : 1, borderColor: i === discIdx ? 'var(--blue-300)' : 'var(--gray-200)', background: i === discIdx ? 'var(--blue-50)' : 'var(--surface, white)', transition: 'all .25s' }}>
                      <div className="ico" style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, background: i < discIdx ? 'var(--green-50)' : 'var(--blue-50)', color: i < discIdx ? 'var(--green-600)' : 'var(--blue-600)' }}>
                        {i < discIdx ? <CheckCircle size={14} /> : i === discIdx ? <RefreshCw size={13} className="animate-spin" /> : i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{p.label}</div>
                        <div className="text-xs text-muted">{p.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* live candidate stream */}
                <div className="rounded-lg border" style={{ borderColor: 'var(--gray-200)', overflow: 'hidden' }}>
                  <div className="px-3 py-2 text-xs font-semibold uppercase text-muted flex items-center justify-between" style={{ background: 'var(--grad-aurora)', borderBottom: '1px solid var(--gray-200)', letterSpacing: '0.05em' }}>
                    <span>Discovered candidates</span>
                    {reranked && <span className="flex items-center gap-1 text-purple-600"><RefreshCw size={11} /> re-ranked</span>}
                  </div>
                  <div className="flex flex-col" style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {(candidates || []).slice(0, revealCount).map((u, i) => (
                      <div key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--gray-100)', animation: 'popIn .25s ease' }}>
                        <Boxes size={14} className="text-purple-600" style={{ flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <div className="truncate" style={{ fontWeight: 500 }}>{u.name}</div>
                          <div className="text-xs text-muted">{u.synthetic ? 'synthesized' : 'catalog match'}</div>
                        </div>
                        <div style={{ width: 54 }}><Bar value={Math.round(u.confidence * 100)} tone={u.confidence > 0.85 ? 'green' : 'blue'} /></div>
                        <div className="text-xs font-mono text-muted" style={{ width: 32, textAlign: 'right' }}>{Math.round(u.confidence * 100)}%</div>
                      </div>
                    ))}
                    {revealCount < (candidates?.length || 0) && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted"><RefreshCw size={12} className="animate-spin" /> scanning for more…</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && !analyzing && discovered && (
            <div className="flex flex-col gap-3">
              <Note icon={Boxes}>Extracted <strong>{discovered.length}</strong> Units of Work from {dept}’s systems, ranked by confidence. Each is secured through the Meridian Proxy.</Note>
              {discovered.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Boxes size={16} className="text-purple-600" />
                  <div className="flex-1 min-w-0"><div className="font-medium text-sm">{u.name}</div><div className="text-xs text-muted truncate">{u.endpoint.method} {u.endpoint.baseUrl}{u.endpoint.path}</div></div>
                  <div className="flex items-center gap-2" style={{ width: 90 }}>
                    <div style={{ flex: 1 }}><Bar value={Math.round(u.confidence * 100)} tone={u.confidence > 0.85 ? 'green' : 'blue'} /></div>
                    <span className="text-xs font-mono text-muted">{Math.round(u.confidence * 100)}%</span>
                  </div>
                  <SecuredBadge>{u.auth.mode}</SecuredBadge>
                </div>
              ))}
            </div>
          )}

          {step === 3 && discovered && (
            <EffectivenessMapping discovered={discovered} setMapping={setMapping} dept={dept} />
          )}

          {step === 4 && discovered && (
            <div className="flex flex-col gap-3">
              <div className="grid-cols-3" style={{ gap: 12 }}>
                <Mini label="Department" value={dept} />
                <Mini label="Systems" value={picked.length} />
                <Mini label="Units of Work" value={discovered.length} />
              </div>
              <Note icon={CheckCircle}>Publishing will make {dept}’s connected systems and Units of Work available — you can then onboard AI employees and compose their workflows from these capabilities.</Note>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderRadius: 0 }}>
          <div style={{ flex: 1 }}>{step > 0 && <button className="btn btn-outline" onClick={back}>Back</button>}</div>
          {step < steps.length - 1
            ? <button className="btn btn-primary" disabled={!canNext} onClick={next}>{analyzing ? 'Discovering…' : 'Continue'}</button>
            : <button className="btn btn-primary" onClick={publish}><Rocket size={16} /> Publish Department</button>}
        </div>
      </Card>
    </div>
  );
}

function Mini({ label, value }) {
  return <div className="p-3 rounded-lg bg-gray-50 border"><div className="text-xs text-muted">{label}</div><div className="text-lg font-bold">{value}</div></div>;
}

// ----------------------------------------------------------------------------
// Effectiveness Mapping — captures FOUR dimensions per Unit of Work (time, cost,
// volume, quality) and projects a live ROI rollup across the whole department.
// ----------------------------------------------------------------------------
const fmtUsd = (n) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1000 ? `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  : `$${Math.round(n)}`;

const EFF_INPUTS = [
  { key: 'manualMinutes', label: 'Manual minutes / run', icon: Clock, suffix: 'min', accent: 'var(--blue-600)' },
  { key: 'manualCostUsd', label: 'Manual cost / run', icon: DollarSign, prefix: '$', accent: 'var(--green-600)' },
  { key: 'runsPerMonth', label: 'Runs / month', icon: Repeat, suffix: '/mo', accent: 'var(--purple-500)' },
  { key: 'manualErrorRate', label: 'Manual error / rework rate', icon: ShieldAlert, suffix: '%', accent: 'var(--orange-500)' },
];

function EffectivenessMapping({ discovered, setMapping, dept }) {
  const rois = discovered.map(u => uowRoi(u.mapping));
  const roll = rois.reduce((a, r) => ({
    hours: a.hours + r.monthlyHoursSaved,
    cost: a.cost + r.monthlyCostSaved,
    annual: a.annual + r.annualCostSaved,
    quality: a.quality + r.qualityUpliftPct,
  }), { hours: 0, cost: 0, annual: 0, quality: 0 });
  const avgQuality = discovered.length ? Math.round(roll.quality / discovered.length) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Note icon={Gauge}>Effectiveness is measured across <strong>four dimensions</strong> — time, cost, volume and quality. Capture the <strong>manual</strong> baseline for each Unit of Work and Meridian projects the ROI live. This runs in the background; you won’t manage it day-to-day.</Note>

      {/* Live ROI rollup — premium gradient summary */}
      <div className="roi-panel">
        <div className="roi-panel-head">
          <span className="flex items-center gap-2"><TrendingUp size={15} /> Projected impact · {dept}</span>
          <span className="roi-panel-sub">{discovered.length} Units of Work · live estimate</span>
        </div>
        <div className="roi-grid">
          <RoiStat icon={Clock} label="Hours saved / mo" value={Math.round(roll.hours).toLocaleString()} />
          <RoiStat icon={DollarSign} label="Cost saved / mo" value={fmtUsd(roll.cost)} />
          <RoiStat icon={Sparkles} label="Annual ROI" value={fmtUsd(roll.annual)} highlight />
          <RoiStat icon={ShieldAlert} label="Avg quality uplift" value={`${avgQuality}%`} />
        </div>
      </div>

      {discovered.map((u, i) => {
        const r = rois[i];
        return (
          <div key={u.id} className="eff-card">
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="flex items-center gap-2">
                <Boxes size={15} className="text-purple-600" />
                <span className="font-semibold text-sm">{u.name}</span>
              </div>
              <span className="eff-roi-chip"><TrendingUp size={12} /> {fmtUsd(r.annualCostSaved)}/yr</span>
            </div>
            <div className="eff-inputs">
              {EFF_INPUTS.map(f => (
                <label key={f.key} className="eff-input">
                  <span className="eff-input-label"><f.icon size={12} style={{ color: f.accent }} /> {f.label}</span>
                  <span className="eff-input-field">
                    {f.prefix && <span className="eff-affix">{f.prefix}</span>}
                    <input type="number" min="0" value={u.mapping[f.key] ?? r[f.key]} onChange={e => setMapping(i, f.key, e.target.value)} />
                    {f.suffix && <span className="eff-affix">{f.suffix}</span>}
                  </span>
                </label>
              ))}
            </div>
            <div className="eff-readout">
              <ReadoutPill icon={Clock} tone="blue" label="time" value={`${r.timeReductionPct}% faster`} />
              <ReadoutPill icon={Repeat} tone="purple" label="monthly" value={`${Math.round(r.monthlyHoursSaved)}h`} />
              <ReadoutPill icon={DollarSign} tone="green" label="saved / mo" value={fmtUsd(r.monthlyCostSaved)} />
              <ReadoutPill icon={ShieldAlert} tone="orange" label="quality" value={`+${r.qualityUpliftPct}%`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoiStat({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`roi-stat ${highlight ? 'roi-stat-hl' : ''}`}>
      <div className="roi-stat-label"><Icon size={13} /> {label}</div>
      <div className="roi-stat-val">{value}</div>
    </div>
  );
}

function ReadoutPill({ icon: Icon, tone, label, value }) {
  return (
    <span className={`eff-pill eff-pill-${tone}`}><Icon size={12} /> <span className="eff-pill-label">{label}</span> <strong>{value}</strong></span>
  );
}

// ============================================================================
// Workflows — grouped by department, classified by trigger
// ============================================================================
export function Workflows({ role, user }) {
  const { employees } = useStore();
  const [query, setQuery] = useState('');
  const usersOf = (wfId) => employees.filter(e => (e.workflowIds || []).includes(wfId));

  const scoped = role === 'admin' ? WORKFLOWS : WORKFLOWS.filter(w => w.dept === user.dept);
  const q = query.trim().toLowerCase();
  const data = !q ? scoped : scoped.filter(w =>
    [w.name, w.dept, w.trigger, w.schedule, ...w.uowIds.map(id => uowById(id)?.name), ...usersOf(w.id).map(e => e.name)]
      .filter(Boolean).some(t => t.toLowerCase().includes(q))
  );
  const groups = groupByDept(data);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Workflows" subtitle="Units of Work combined into processes — organized by department, classified reactive vs proactive" />
      <div className="relative" style={{ maxWidth: 420 }}>
        <Search className="absolute left-3 top-2.5 text-muted" size={16} />
        <input className="search-input has-icon" placeholder="Search workflows, units of work, employees…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      {groups.length === 0 && <Card><div className="card-body text-muted text-sm">No workflows match “{query}”.</div></Card>}
      {groups.map(g => (
        <WorkflowDeptGroup key={g.dept} g={g} usersOf={usersOf} forceOpen={!!q} />
      ))}
    </div>
  );
}

const WORKFLOW_COLS = [
  { key: 'name', label: 'Name', get: w => w.name },
  { key: 'trigger', label: 'Trigger', get: w => w.trigger },
  { key: 'schedule', label: 'Schedule', get: w => w.trigger === 'proactive' ? w.schedule : 'on event' },
  { label: 'Units of Work' },
  { label: 'Used by' },
  { key: 'success', label: 'Success', get: w => w.successRate },
];

// Expanded workflow detail — the ordered Units of Work that compose the process,
// each with its endpoint, how it's secured, and the time it saves per run.
function WorkflowUowDetail({ w }) {
  const uows = w.uowIds.map(id => uowById(id)).filter(Boolean);
  return (
    <div className="wf-detail">
      <div className="wf-detail-head">
        <Boxes size={14} className="text-muted" />
        <span>{uows.length} Unit{uows.length === 1 ? '' : 's'} of Work in this workflow</span>
        <span className="text-muted">· runs in sequence</span>
      </div>
      <div className="wf-detail-steps">
        {uows.map((u, i) => {
          const roi = uowRoi(u.mapping);
          return (
            <div key={u.id} className="wf-uow-card">
              <div className="wf-uow-step">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{u.name}</span>
                  <span className="wf-method">{u.endpoint?.method}</span>
                  <span className="text-xs text-muted font-mono truncate">{u.endpoint?.path}</span>
                </div>
                <div className="text-xs text-muted mt-1">{u.description}</div>
                <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                  <span className="inline-flex items-center gap-1 text-muted"><Lock size={12} /> {u.auth?.mode}{u.auth?.secret ? ` · ${u.auth.secret}` : ''}</span>
                  <span className="inline-flex items-center gap-1 text-muted"><Clock size={12} /> {roi.manualMinutes}→{roi.automatedMinutes} min <span className="text-green-600 font-medium">−{roi.timeReductionPct}%</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowDeptGroup({ g, usersOf, forceOpen }) {
  const PER = 10;
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false); // accordion: closed by default
  const [openWf, setOpenWf] = useState(null); // expanded workflow row → shows its Units of Work
  const { sort, toggle, apply } = useSortable(WORKFLOW_COLS);
  const isOpen = forceOpen || open;
  const loading = useFakeLoad([isOpen]);
  const sorted = apply(g.items);
  const pages = Math.ceil(sorted.length / PER);
  const cur = Math.min(page, pages - 1);
  const slice = sorted.slice(cur * PER, cur * PER + PER);

  return (
    <Card className="p-0">
      <button className="accordion-head" onClick={() => setOpen(o => !o)}>
        <ChevronDown size={16} className="text-muted accordion-chevron" style={{ transform: isOpen ? 'none' : 'rotate(-90deg)' }} />
        <Building2 size={16} className="text-muted" />
        <h3 className="m-0">{g.dept}</h3>
        <span className="badge">{g.items.length}</span>
      </button>
      {isOpen && (<>
        <div className="table-wrap border-t">
          <table className="table">
            <SortHead columns={WORKFLOW_COLS} sort={sort} toggle={toggle} />
            {loading ? <SkeletonRows columns={WORKFLOW_COLS} rows={Math.min(slice.length || 4, 5)} /> : (
            <tbody>
              {slice.map(w => {
                const emps = usersOf(w.id);
                const expanded = openWf === w.id;
                return (
                <React.Fragment key={w.id}>
                <tr className={`wf-row ${expanded ? 'wf-row-open' : ''}`} onClick={() => setOpenWf(expanded ? null : w.id)}>
                  <td className="font-medium">
                    <span className="flex items-center gap-2">
                      <ChevronDown size={14} className="text-muted wf-row-chevron" style={{ transform: expanded ? 'none' : 'rotate(-90deg)' }} />
                      {w.name}
                    </span>
                  </td>
                  <td><Pill label={w.trigger} tone={w.trigger === 'proactive' ? 'purple' : 'neutral'} /></td>
                  <td className="text-sm text-muted">{w.trigger === 'proactive' ? <span className="flex items-center gap-1"><Calendar size={12} /> {w.schedule}</span> : <span className="flex items-center gap-1"><Zap size={12} /> on event</span>}</td>
                  <td><div className="flex flex-wrap gap-1">{w.uowIds.map(id => <span key={id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{uowById(id)?.name}</span>)}</div></td>
                  <td>
                    {emps.length === 0 ? <span className="text-xs text-muted">— unassigned</span> : (
                      <div className="flex flex-wrap items-center gap-1">
                        {emps.map(e => (
                          <span key={e.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            <AgentAvatar id={e.id} name={e.name} size={16} /> {e.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ minWidth: 110 }}><div className="flex items-center gap-2"><span className="text-sm">{w.successRate}%</span><Bar value={w.successRate} tone={w.successRate > 90 ? 'green' : 'orange'} /></div></td>
                </tr>
                {expanded && (
                  <tr className="wf-detail-row">
                    <td colSpan={WORKFLOW_COLS.length} className="p-0">
                      <WorkflowUowDetail w={w} />
                    </td>
                  </tr>
                )}
                </React.Fragment>
                );
              })}
            </tbody>
            )}
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-muted">Showing {cur * PER + 1}–{Math.min(cur * PER + PER, g.items.length)} of {g.items.length}</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Prev</button>
              <span className="text-muted">Page {cur + 1} / {pages}</span>
              <button className="btn btn-outline btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
            </div>
          </div>
        )}
      </>)}
    </Card>
  );
}

// ============================================================================
// Connectors — MCP & REST API, grouped by department, real brand icons
// ============================================================================
// Derive the OAuth scopes a connector will request from the Units of Work that
// reference its vault secret, falling back to category-based defaults so every
// provider has a believable consent screen.
function connectorScopes(c) {
  const fromUow = UNITS_OF_WORK
    .filter(u => u.dept === c.dept && u.auth?.scopes?.length)
    .flatMap(u => u.auth.scopes);
  const base = ['openid', 'profile', 'offline_access'];
  const set = [...new Set([...base, ...fromUow])];
  return set.length > base.length ? set : [...base, 'read', 'write'];
}

const SCOPE_LABELS = {
  'openid': 'Verify your identity',
  'profile': 'Read your basic account profile',
  'offline_access': 'Maintain access when you are offline',
  'read': 'Read records in your account',
  'write': 'Create and update records',
  'rentroll:read': 'Read rent roll & delinquency data',
  'workorders:write': 'Create and assign maintenance work orders',
  'listings:read': 'Read available unit listings',
  'signature': 'Send documents for e-signature',
  'valuation:read': 'Read asset valuations & cap rates',
  'portfolio:write': 'Update portfolio NOI figures',
  'maintenance:write': 'Schedule preventive maintenance',
  'projects:write': 'Create capital improvement projects',
  'comps:read': 'Read comparable-sale transactions',
  'deals:write': 'Run and store deal underwriting',
  'filings:write': 'Submit regulatory disclosure filings',
  'leads:write': 'Create and route prospect leads',
  'campaigns:write': 'Launch and schedule marketing campaigns',
};

function authHost(brand) {
  const map = { sap: 'accounts.sap.com', salesforce: 'login.salesforce.com', docusign: 'account.docusign.com' };
  return map[brand] || `auth.${brand}.com`;
}

// Simulated OAuth redirect flow — gives the real feeling of leaving the app,
// authorizing at the provider, and being redirected back.
function OAuthFlow({ connector, onAllow, onClose }) {
  const c = connector;
  const [phase, setPhase] = useState('redirecting'); // redirecting → consent → authorizing → done
  const scopes = connectorScopes(c);
  const host = authHost(c.brand);
  const redirectUri = 'https://app.meridian.ai/oauth/callback';
  const authUrl = `https://${host}/oauth2/authorize?client_id=meridian-mcp&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join('+')}`;

  useEffect(() => {
    if (phase === 'redirecting') { const t = setTimeout(() => setPhase('consent'), 1400); return () => clearTimeout(t); }
    if (phase === 'authorizing') { const t = setTimeout(() => { setPhase('done'); onAllow(); }, 1700); return () => clearTimeout(t); }
  }, [phase]);

  // Fake browser chrome with an address bar that animates to the provider.
  const urlForPhase = phase === 'redirecting' ? authUrl
    : phase === 'consent' ? authUrl
    : phase === 'authorizing' ? `${redirectUri}?code=4%2F0Adeu5${c.brand}AX9c-grant&state=meridian`
    : `${redirectUri}?status=success`;

  return (
    <div className="flex flex-col gap-0" style={{ minHeight: 360 }}>
      {/* browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-md" style={{ background: '#e5e7eb' }}>
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#f87171' }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#fbbf24' }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#34d399' }} />
        <div className="flex items-center gap-2 flex-1 ml-2 px-3 py-1 rounded-full text-xs font-mono text-muted" style={{ background: 'var(--surface, #fff)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          <Lock size={11} className="text-green-600" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{urlForPhase}</span>
        </div>
      </div>

      {/* provider page body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-6 py-8 rounded-b-md border border-gray-200" style={{ background: '#fafafa' }}>
        {phase === 'redirecting' && (
          <>
            <Loader2 size={30} className="animate-spin text-blue-600" />
            <div className="text-sm text-muted">Redirecting to <span className="font-semibold">{host}</span> …</div>
          </>
        )}

        {phase === 'consent' && (
          <div className="w-full flex flex-col items-center gap-4" style={{ animation: 'popIn .25s ease' }}>
            <div className="flex items-center gap-3">
              <BrandIcon brand={c.brand} size={44} />
              <ArrowRight size={18} className="text-muted" />
              <div className="avatar" style={{ width: 44, height: 44, fontSize: 15, background: 'var(--grad-blue)', color: '#fff' }}>M</div>
            </div>
            <div>
              <div className="font-semibold" style={{ fontSize: 16 }}>Authorize Meridian</div>
              <div className="text-xs text-muted mt-1"><span className="font-semibold">Meridian {c.protocol === 'rest' ? 'REST API' : 'MCP'}</span> wants to access your <span className="font-semibold">{c.name}</span> account</div>
            </div>
            <div className="w-full text-left rounded-md border border-gray-200 bg-white">
              <div className="px-3 py-2 text-xs font-semibold text-muted border-b border-gray-100">This will allow Meridian to:</div>
              <div className="flex flex-col" style={{ maxHeight: 168, overflowY: 'auto' }}>
                {scopes.map(s => (
                  <div key={s} className="flex items-start gap-2 px-3 py-2 text-sm border-b border-gray-50" style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <CheckCircle size={15} className="text-green-600" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div>{SCOPE_LABELS[s] || s}</div>
                      <div className="text-xs font-mono text-muted">{s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted"><ShieldCheck size={13} className="text-green-600" /> Tokens are stored in the Meridian Governance vault, not in the browser.</div>
            <div className="flex gap-2 w-full">
              <button className="btn btn-outline flex-1" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={() => setPhase('authorizing')}><ShieldCheck size={15} /> Allow</button>
            </div>
          </div>
        )}

        {phase === 'authorizing' && (
          <>
            <Loader2 size={30} className="animate-spin text-blue-600" />
            <div className="text-sm text-muted">Exchanging authorization code & redirecting back to Meridian …</div>
          </>
        )}

        {phase === 'done' && (
          <>
            <CheckCircle size={34} className="text-green-600" />
            <div className="text-sm font-semibold">Connected to {c.name}</div>
          </>
        )}
      </div>
    </div>
  );
}

export function Connectors({ role, user, toast }) {
  const { connectors, connectConnector } = useStore();
  const data = role === 'admin' ? connectors : connectors.filter(c => c.dept === user.dept);
  const groups = groupByDept(data);
  const [flow, setFlow] = useState(null); // connector currently authorizing
  const completeConnect = (c) => { connectConnector(c.id); setFlow(null); toast(`${c.name} has been connected`, 'success'); };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Connectors" subtitle="MCP & REST API integrations to your ERP & property systems — organized by department" />
      <Note icon={Plug}>Systems connect over MCP or REST API. Each connection’s credentials live in the Governance vault and are referenced by Units of Work — never embedded in a connector card.</Note>

      {groups.map(g => (
        <div key={g.dept}>
          <div className="flex items-center gap-2 mb-3"><Building2 size={16} className="text-muted" /><h3 className="m-0">{g.dept}</h3><span className="badge">{g.items.length}</span></div>
          <div className="grid-cols-4">
            {g.items.map(c => (
              <Card key={c.id}>
                <div className="card-body flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <BrandIcon brand={c.brand} size={42} />
                    <div className="flex-1"><div className="font-semibold flex items-center gap-2">{c.name} <Pill label={c.protocol === 'rest' ? 'REST' : 'MCP'} tone={c.protocol === 'rest' ? 'info' : 'purple'} /></div><div className="text-xs text-muted">{c.category}</div></div>
                  </div>
                  {c.connected
                    ? <div className="flex items-center justify-between"><Pill label="connected" tone="success" />{c.secret ? <SecuredBadge>{c.secret}</SecuredBadge> : <span className="text-xs text-muted">delegated</span>}</div>
                    : <button className="btn btn-outline w-full" onClick={() => setFlow(c)}><Plug size={14} /> Connect</button>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Modal open={!!flow} onClose={() => setFlow(null)} title={flow ? `Connect ${flow.name}` : ''}>
        {flow && <OAuthFlow connector={flow} onAllow={() => completeConnect(flow)} onClose={() => setFlow(null)} />}
      </Modal>
    </div>
  );
}

// ============================================================================
// Knowledge (unchanged behavior)
// ============================================================================
// ---- Knowledge artifacts (audio / video / documents) -----------------------
const ARTIFACT_CATS = ['Document', 'Video', 'Audio'];
const artifactIcon = (cat) => cat === 'Video' ? FileVideo : cat === 'Audio' ? FileAudio : FileText;
const artifactTone = (cat) => cat === 'Video' ? 'info' : cat === 'Audio' ? 'purple' : 'neutral';

function parseDuration(str) {
  const m = /(\d+)\s*m\s*(\d+)?/.exec(str || '');
  return m ? (+m[1]) * 60 + (+(m[2] || 0)) : 0;
}
const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

// A faux player — looks and behaves like a real one (play/pause, scrubbing,
// ticking time) without shipping media, so it works fully offline.
function MediaPlayer({ artifact }) {
  const isVideo = artifact.category === 'Video';
  const total = parseDuration(artifact.properties?.Duration) || 180;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { setT(0); setPlaying(false); }, [artifact.id]);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setT(x => (x >= total ? (setPlaying(false), total) : x + 1)), 1000);
    return () => clearInterval(iv);
  }, [playing, total]);

  const pct = total ? (t / total) * 100 : 0;
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setT(Math.max(0, Math.min(total, ((e.clientX - r.left) / r.width) * total)));
  };

  return (
    <div className="mp">
      <div className={`mp-stage ${isVideo ? 'mp-video' : 'mp-audio'}`}>
        {isVideo ? (
          <button className="mp-bigplay" onClick={() => setPlaying(p => !p)}>
            {playing ? <Pause size={30} /> : <Play size={30} />}
          </button>
        ) : (
          <div className="mp-wave">
            {Array.from({ length: 56 }).map((_, i) => {
              const h = 20 + Math.abs(Math.sin(i * 1.7) * 60) + (i % 5) * 4;
              const on = (i / 56) * 100 <= pct;
              return <span key={i} style={{ height: `${h}%`, opacity: on ? 1 : 0.35 }} />;
            })}
          </div>
        )}
      </div>
      <div className="mp-controls">
        <button className="mp-play" onClick={() => setPlaying(p => !p)}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <span className="mp-time">{fmtTime(t)}</span>
        <div className="mp-track" onClick={seek}><div className="mp-fill" style={{ width: `${pct}%` }} /></div>
        <span className="mp-time">{fmtTime(total)}</span>
      </div>
    </div>
  );
}

function DocPreview({ artifact }) {
  const p = artifact.properties || {};
  return (
    <div className="doc-preview">
      <div className="doc-page">
        <div className="doc-page-head">{artifact.label.replace(/\.[a-z0-9]+$/i, '')}</div>
        <p className="doc-page-body">{artifact.description}</p>
        <div className="doc-skeleton">
          {Array.from({ length: 8 }).map((_, i) => <span key={i} style={{ width: `${[100, 96, 88, 100, 72, 94, 60, 90][i]}%` }} />)}
        </div>
      </div>
      <div className="doc-meta">Page 1 / {p.Pages || 1} · {p.Format} · {p.Size}</div>
    </div>
  );
}

function ArtifactPreview({ artifact }) {
  if (!artifact) return <div className="art-empty text-muted">Select an artifact to preview it.</div>;
  const Icon = artifactIcon(artifact.category);
  const p = artifact.properties || {};
  const transcript = p.Transcript;
  return (
    <div className="art-preview">
      <div className="art-preview-head">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={18} className="text-muted" />
          <span className="font-semibold truncate">{artifact.label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Pill label={artifact.category} tone={artifactTone(artifact.category)} />
          <Pill label={artifact.dept} tone="neutral" />
        </div>
      </div>
      <div className="art-preview-body">
        {artifact.category === 'Document'
          ? <DocPreview artifact={artifact} />
          : <MediaPlayer artifact={artifact} />}
        <p className="text-sm text-muted" style={{ marginTop: 14 }}>{artifact.description}</p>
        <div className="art-props">
          {Object.entries(p).map(([k, v]) => (
            <div key={k} className="art-prop"><span className="art-prop-k">{k}</span><span className="art-prop-v">{String(v)}</span></div>
          ))}
        </div>
        {transcript && transcript !== 'N/A' && (
          <Note icon={FileText}>Transcript {String(transcript).toLowerCase()} — searchable and linked to the entities it grounds.</Note>
        )}
      </div>
    </div>
  );
}

function AddArtifactModal({ onClose, onAdd }) {
  const [cat, setCat] = useState('Document');
  const [name, setName] = useState('');
  const [dept, setDept] = useState(DEPARTMENTS[0]);
  const ext = cat === 'Video' ? '.mp4' : cat === 'Audio' ? '.mp3' : '.pdf';
  const submit = () => {
    const base = (name.trim() || `New ${cat}`);
    const label = /\.[a-z0-9]+$/i.test(base) ? base : base + ext;
    onAdd({ category: cat, label, dept });
  };
  return (
    <Modal open onClose={onClose} title="Add knowledge artifact">
      <div className="flex flex-col gap-4">
        <Note icon={Upload}>Upload a document, video or audio source. It’s ingested, chunked/transcribed and linked into the Knowledge Sphere.</Note>
        <Field label="Type">
          <Select value={cat} onChange={setCat} options={ARTIFACT_CATS.map(c => ({ value: c, label: c }))} />
        </Field>
        <Field label="Name">
          <input className="search-input" value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. Lease Agreement — L-1010${ext}`} />
        </Field>
        <Field label="Department">
          <Select value={dept} onChange={setDept} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
        </Field>
        <div className="art-drop"><Upload size={20} className="text-muted" /> Drag a file here or browse <span className="text-muted">(mock)</span></div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}><Plus size={15} /> Add artifact</button>
        </div>
      </div>
    </Modal>
  );
}

function ArtifactsPanel({ filterDept, toast }) {
  // Base artifacts come from the knowledge graph; user-added ones live in state.
  const base = React.useMemo(() => KNOWLEDGE_GRAPH.nodes.filter(n => ARTIFACT_CATS.includes(n.category)), []);
  const [added, setAdded] = useState([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(base[0]?.id || null);
  const [adding, setAdding] = useState(false);

  const all = [...added, ...base];
  const list = all.filter(a =>
    (filterDept === 'All' || a.dept === filterDept) &&
    a.label.toLowerCase().includes(q.toLowerCase()));
  const selected = all.find(a => a.id === sel) || list[0] || null;

  const addArtifact = ({ category, label, dept }) => {
    const id = `art-${category}-${added.length}-${label.length}`;
    const props = category === 'Document'
      ? { Format: 'PDF', Pages: 1, Size: '0.1 MB', Uploaded: '2026-06-24', Source: 'Manual upload', 'Chunks indexed': 'queued', OCR: 'Processing' }
      : { Format: category === 'Video' ? 'MP4 · 1080p' : 'MP3', Duration: '0m 30s', Size: category === 'Video' ? '40 MB' : '1.2 MB', Uploaded: '2026-06-24', Transcript: 'Processing', 'Segments indexed': 'queued' };
    const node = { id, label, category, dept, weight: 5, description: `${category} uploaded to ${dept}. Ingestion in progress — chunks/segments will link to related entities once processed.`, properties: props };
    setAdded(a => [node, ...a]);
    setSel(id);
    setAdding(false);
    toast?.(`Added “${label}” — ingestion started`, 'success');
  };

  return (
    <div className="art-wrap">
      <aside className="art-list">
        <div className="art-list-head">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-muted" size={15} />
            <input className="search-input has-icon w-full" value={q} onChange={e => setQ(e.target.value)} placeholder="Search artifacts..." />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><Plus size={14} /> Add</button>
        </div>
        <div className="art-list-scroll">
          {list.length === 0 && <div className="text-muted text-sm p-3">No artifacts match.</div>}
          {ARTIFACT_CATS.map(cat => {
            const items = list.filter(a => a.category === cat);
            if (!items.length) return null;
            const Icon = artifactIcon(cat);
            return (
              <div key={cat} className="art-group">
                <div className="art-group-label"><Icon size={13} /> {cat}s <span className="badge">{items.length}</span></div>
                {items.map(a => (
                  <button key={a.id} className={`art-item ${a.id === selected?.id ? 'active' : ''}`} onClick={() => setSel(a.id)}>
                    <Icon size={15} className="text-muted flex-shrink-0" />
                    <span className="art-item-name">{a.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="art-main">
        <ArtifactPreview artifact={selected} />
      </main>
      {adding && <AddArtifactModal onClose={() => setAdding(false)} onAdd={addArtifact} />}
    </div>
  );
}

export function Knowledge({ toast }) {
  const [filterDept, setFilterDept] = useState('All');
  const [view, setView] = useState('graph');
  const filteredNodes = filterDept === 'All' ? KNOWLEDGE_GRAPH.nodes : KNOWLEDGE_GRAPH.nodes.filter(n => n.dept === filterDept);
  const artifactCount = KNOWLEDGE_GRAPH.nodes.filter(n => ARTIFACT_CATS.includes(n.category)).length;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center">
        <SectionTitle title="Knowledge Sphere" subtitle="GraphRAG ontology — entities (properties, units, leases, tenants, vendors) grounded in documents, video & audio sources" />
        <div className="flex items-center gap-2">
          <div className="seg">
            <button className={view === 'graph' ? 'on' : ''} onClick={() => setView('graph')}><Network size={14} /> Graph</button>
            <button className={view === 'artifacts' ? 'on' : ''} onClick={() => setView('artifacts')}><FileText size={14} /> Artifacts</button>
          </div>
          <select className="search-input bg-white w-48" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-md font-medium border border-blue-200">
        {view === 'graph'
          ? <>Showing {filteredNodes.length} nodes · {KG_STATS.edges.toLocaleString()} typed edges · {KG_STATS.categories} categories — click any node to inspect its description, properties & linked knowledge sources.</>
          : <>{artifactCount} knowledge artifacts — documents, video & audio that ground the graph. Select one to preview it, or add a new source.</>}
      </div>
      {view === 'graph' ? (
        <div className="flex-1 relative border rounded-lg overflow-hidden border-gray-200 shadow-sm min-h-[500px]">
          <KnowledgeGraph nodes={filteredNodes} links={KNOWLEDGE_GRAPH.links}
            categories={KNOWLEDGE_GRAPH.nodes.map(n => n.category).filter((v, i, a) => a.indexOf(v) === i)} />
        </div>
      ) : (
        <ArtifactsPanel filterDept={filterDept} toast={toast} />
      )}
    </div>
  );
}
