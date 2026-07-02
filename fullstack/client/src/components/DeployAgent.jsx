import React, { useState, useEffect } from 'react';
import { Modal, Pill, Field, Select, Skeleton } from './ui.jsx';
import { useStore } from '../data/StoreContext.jsx';
import {
  Rocket, Copy, Check, Eye, EyeOff, Plus, X, Globe, ShieldCheck, Activity,
  KeyRound, Link2, ArrowLeft, ExternalLink, Server, Trash2, ChevronRight,
  Zap, MessageSquare, Star, Radio,
} from 'lucide-react';

const INTEGRATION_GUIDE_URL = 'https://onyx.gytworkz.com';

// Deterministic hex token from a seed so a deployment's keys are stable across
// sessions (a prototype stand-in for server-issued credentials).
function hashHex(seed, len) {
  let h = 2166136261 >>> 0;
  let out = '';
  let s = String(seed);
  while (out.length < len) {
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    out += h.toString(16).padStart(8, '0');
    s = out;
  }
  return out.slice(0, len);
}

const ENVS = ['production', 'staging', 'sandbox'];
const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'];

// ---- persistence (localStorage, scoped to company + agent) ------------------
// One established "production" deployment ships pre-provisioned so there's a
// place the activity log legitimately lives. It's stamped ~26h old, so it has
// had time to accumulate traffic — unlike anything the user deploys now.
function defaultDeployment(empId) {
  return {
    id: `dep-${empId}-prod`,
    name: 'production',
    env: 'production',
    region: 'us-east-1',
    origins: ['*'],
    createdAt: Date.now() - 26 * 60 * 60 * 1000,
  };
}

function loadDeployments(companyId, empId) {
  try {
    const raw = localStorage.getItem(`deploy:${companyId}:${empId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [defaultDeployment(empId)];
}

function useDeployments(companyId, empId) {
  const lsKey = `deploy:${companyId}:${empId}`;
  const [deps, setDeps] = useState(() => loadDeployments(companyId, empId));
  useEffect(() => { try { localStorage.setItem(lsKey, JSON.stringify(deps)); } catch {} }, [lsKey, deps]);
  return [deps, setDeps];
}

function credsFor(dep) {
  return {
    apiKey: `mer_live_${hashHex(dep.id, 24)}`,
    secret: `msk_${hashHex(dep.id + ':secret', 40)}`,
  };
}

// ---- seeded per-deployment activity (invoke calls + feedback submissions) ----
const SEED_HITS = [
  { kind: 'invoke', origin: 'app.acmeproperties.com', ip: '52.14.88.3', mins: 2 },
  { kind: 'feedback', origin: 'app.acmeproperties.com', ip: '52.14.88.3', mins: 6, rating: 5 },
  { kind: 'invoke', origin: '10.0.4.21', ip: '10.0.4.21', mins: 14 },
  { kind: 'invoke', origin: 'tenant-portal.acme.com', ip: '52.14.88.7', mins: 38 },
  { kind: 'feedback', origin: 'tenant-portal.acme.com', ip: '52.14.88.7', mins: 41, rating: 4 },
  { kind: 'invoke', origin: 'staging.acmeproperties.com', ip: '34.201.12.9', mins: 76 },
  { kind: 'invoke', origin: 'unknown-bot.ru', ip: '193.42.18.77', mins: 121 },
  { kind: 'feedback', origin: 'app.acmeproperties.com', ip: '52.14.88.3', mins: 156, rating: 5 },
  { kind: 'invoke', origin: 'ci.acme.com', ip: '52.14.90.2', mins: 245 },
];

function originAllowed(origins, hit) {
  if (origins.includes('*')) return true;
  return origins.some(o => o === hit.origin || o === hit.ip);
}

function relTime(mins) {
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
}

// =============================================================================
export function AgentDeployPage({ emp, user, onBack, toast }) {
  const { companyId } = useStore();
  const [deps, setDeps] = useDeployments(companyId, emp.id);
  const [activeId, setActiveId] = useState(deps[0]?.id || null);
  const [createOpen, setCreateOpen] = useState(false);
  const [provisioningId, setProvisioningId] = useState(null); // shows a skeleton while a new deployment "spins up"

  const active = deps.find(d => d.id === activeId) || null;

  const createDeployment = ({ name, env, region }) => {
    const id = `dep-${emp.id}-${hashHex(name + env + region + deps.length, 8)}`;
    const dep = { id, name: name || env, env, region, origins: ['*'], createdAt: Date.now() };
    setDeps(d => [dep, ...d]);
    setActiveId(id);
    setCreateOpen(false);
    setProvisioningId(id);
    setTimeout(() => setProvisioningId(p => (p === id ? null : p)), 1600);
    toast?.(`Provisioning ${emp.name} · ${env}…`, 'info');
  };

  const updateDeployment = (id, patch) => setDeps(d => d.map(x => x.id === id ? { ...x, ...patch } : x));
  const deleteDeployment = (id) => {
    setDeps(d => d.filter(x => x.id !== id));
    setActiveId(cur => (cur === id ? null : cur));
    toast?.('Deployment removed', 'info');
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={16} /> {emp.name}</button>
        <div className="flex-1">
          <h2 className="m-0">Deploy · {emp.name}</h2>
          <div className="text-sm text-muted">Expose this AI employee as a secure API for external systems.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> New deployment</button>
      </div>

      {deps.length === 0 ? (
        <div className="card flex flex-col items-center text-center gap-4" style={{ padding: '48px 24px' }}>
          <div className="deploy-hero-ic"><Rocket size={26} /></div>
          <div>
            <div className="text-lg font-semibold">No deployments yet</div>
            <p className="text-sm text-muted" style={{ maxWidth: 460, margin: '6px auto 0' }}>
              {emp.name} is reachable from your Workspace and Inbox today. Create a deployment to get a secure
              HTTPS endpoint — with an invoke API and a feedback API — that external systems can call directly.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Rocket size={16} /> Deploy agent</button>
        </div>
      ) : (
        <div className="deploy-layout">
          {/* deployments list */}
          <div className="dep-list">
            {deps.map(d => {
              const allowAll = d.origins.includes('*');
              return (
                <button key={d.id} className={`dep-item ${activeId === d.id ? 'on' : ''}`} onClick={() => setActiveId(d.id)}>
                  <div className="dep-item-ic"><Server size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{d.name}</span>
                      <Pill label="live" tone="success" />
                    </div>
                    <div className="text-xs text-muted truncate">{d.region} · {allowAll ? 'all origins' : `${d.origins.length} origin${d.origins.length === 1 ? '' : 's'}`}</div>
                  </div>
                  <ChevronRight size={15} className="text-muted" />
                </button>
              );
            })}
          </div>

          {/* selected deployment detail */}
          <div className="dep-detail">
            {active && provisioningId === active.id
              ? <DeploymentSkeleton emp={emp} dep={active} />
              : active
                ? <DeploymentDetail emp={emp} dep={active} onUpdate={(p) => updateDeployment(active.id, p)} onDelete={() => deleteDeployment(active.id)} toast={toast} />
                : <div className="card flex items-center justify-center text-muted text-sm" style={{ padding: 40 }}>Select a deployment to view its configuration and activity.</div>}
          </div>
        </div>
      )}

      {createOpen && <NewDeploymentModal emp={emp} onClose={() => setCreateOpen(false)} onCreate={createDeployment} />}
    </div>
  );
}

// Shown for ~1.6s right after a deployment is created, while it "provisions".
function DeploymentSkeleton({ emp, dep }) {
  return (
    <div className="card flex flex-col gap-5" style={{ padding: 20 }}>
      <div className="flex items-center gap-2">
        <span className="prov-spinner" />
        <span className="text-sm text-muted">Provisioning {emp.name} · {dep.env} · {dep.region} — opening MCP session & issuing credentials…</span>
      </div>
      <section className="flex flex-col gap-2">
        <Skeleton w={60} h={12} />
        <Skeleton w="100%" h={42} radius={8} />
        <Skeleton w="100%" h={42} radius={8} />
      </section>
      <section className="flex flex-col gap-2">
        <Skeleton w={90} h={12} />
        <Skeleton w="100%" h={40} radius={8} />
        <Skeleton w="100%" h={40} radius={8} />
        <Skeleton w="100%" h={40} radius={8} />
      </section>
      <section className="flex flex-col gap-2">
        <Skeleton w={140} h={12} />
        <Skeleton w="100%" h={56} radius={10} />
      </section>
    </div>
  );
}

function DeploymentDetail({ emp, dep, onUpdate, onDelete, toast }) {
  const { apiKey, secret } = credsFor(dep);
  const base = `https://api.meridian.work/v1/agents/${emp.id}`;
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(null);
  const [newOrigin, setNewOrigin] = useState('');
  const allowAll = dep.origins.includes('*');

  const copy = (text, field) => {
    try { navigator.clipboard?.writeText(text); } catch {}
    setCopied(field);
    toast?.('Copied to clipboard', 'success');
    setTimeout(() => setCopied(c => (c === field ? null : c)), 1400);
  };

  const setAllowAll = (on) => onUpdate({ origins: on ? ['*'] : [] });
  const addOrigin = () => {
    const v = newOrigin.trim();
    if (!v) return;
    onUpdate({ origins: dep.origins.filter(o => o !== '*' && o !== v).concat(v) });
    setNewOrigin('');
  };
  const removeOrigin = (o) => onUpdate({ origins: dep.origins.filter(x => x !== o) });

  // Activity is gated by how long THIS deployment has actually been live: a hit
  // from "38m ago" only shows once the endpoint is at least 38 minutes old. A
  // brand-new deployment therefore starts quiet and fills in over real time.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const ageMins = dep.createdAt != null ? (Date.now() - dep.createdAt) / 60000 : (dep.createdMins ?? 0);
  const hits = SEED_HITS
    .filter(h => h.mins <= ageMins)
    .map(h => ({ ...h, ok: originAllowed(dep.origins, h) }));
  const feedback = hits.filter(h => h.kind === 'feedback' && h.ok);
  const trust = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) : null;
  const maskedSecret = showSecret ? secret : secret.replace(/.(?=.{4})/g, '•');

  return (
    <div className="card flex flex-col gap-5" style={{ padding: 20 }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pill label="Live" tone="success" />
          <span className="text-sm text-muted">{dep.env} · {dep.region} · MCP-secured via Meridian Proxy</span>
        </div>
        <button className="deploy-icon-btn" title="Remove deployment" onClick={onDelete}><Trash2 size={16} /></button>
      </div>

      {/* Endpoints — the two APIs every deployment exposes */}
      <section className="flex flex-col gap-2">
        <div className="deploy-label"><Radio size={13} /> APIs</div>
        <div className="api-row">
          <span className="api-method post">POST</span>
          <span className="api-path mono">{base}/invoke</span>
          <span className="api-desc"><Zap size={12} /> Run the agent</span>
          <button className="deploy-icon-btn" title="Copy" onClick={() => copy(`${base}/invoke`, 'invoke')}>{copied === 'invoke' ? <Check size={15} /> : <Copy size={15} />}</button>
        </div>
        <div className="api-row">
          <span className="api-method post">POST</span>
          <span className="api-path mono">{base}/feedback</span>
          <span className="api-desc"><MessageSquare size={12} /> Submit user feedback → trust score</span>
          <button className="deploy-icon-btn" title="Copy" onClick={() => copy(`${base}/feedback`, 'feedback')}>{copied === 'feedback' ? <Check size={15} /> : <Copy size={15} />}</button>
        </div>
      </section>

      {/* Credentials */}
      <section className="flex flex-col gap-2">
        <div className="deploy-label"><KeyRound size={13} /> Credentials</div>
        <CredRow icon={<Link2 size={13} />} label="Base URL" value={base} field="base" copied={copied} onCopy={copy} />
        <CredRow icon={<KeyRound size={13} />} label="API key" value={apiKey} field="key" copied={copied} onCopy={copy} />
        <CredRow icon={<ShieldCheck size={13} />} label="Secret key" value={maskedSecret} copyValue={secret} field="secret" copied={copied} onCopy={copy}
          extra={<button className="deploy-icon-btn" title={showSecret ? 'Hide' : 'Reveal'} onClick={() => setShowSecret(s => !s)}>{showSecret ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
        <a className="deploy-guide-link" href={INTEGRATION_GUIDE_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={14} /> Read the integration guide at onyx.gytworkz.com
        </a>
      </section>

      {/* Allowed origins */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="deploy-label"><Globe size={13} /> Allowed origins &amp; IPs</div>
          <label className="deploy-allow-all">
            <input type="checkbox" checked={allowAll} onChange={e => setAllowAll(e.target.checked)} />
            Allow all (<code>*</code>)
          </label>
        </div>
        {allowAll ? (
          <div className="deploy-note warn"><ShieldCheck size={14} /> This deployment accepts requests from any origin. Add specific domains or IPs to restrict access.</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {dep.origins.length === 0 && <span className="text-xs text-muted">No origins yet — requests will be blocked until you add one.</span>}
              {dep.origins.map(o => (
                <span key={o} className="origin-chip">{o}<button onClick={() => removeOrigin(o)} title="Remove"><X size={12} /></button></span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="search-input" style={{ flex: 1, fontSize: 13 }} placeholder="domain.com or 10.0.0.0/24"
                value={newOrigin} onChange={e => setNewOrigin(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOrigin()} />
              <button className="btn btn-outline btn-sm" onClick={addOrigin}><Plus size={14} /> Add</button>
            </div>
          </>
        )}
      </section>

      {/* Activity for THIS deployment */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="deploy-label"><Activity size={13} /> Activity</div>
          {trust != null && <span className="trust-chip"><Star size={12} /> Trust {trust.toFixed(1)}/5 · {feedback.length} feedback</span>}
        </div>
        <div className="deploy-log">
          {hits.length === 0 && (
            <div className="text-sm text-muted" style={{ padding: '14px 4px' }}>
              No requests yet — {emp.name} is live, and calls to <span className="mono">/invoke</span> and <span className="mono">/feedback</span> will appear here as external systems start hitting this endpoint.
            </div>
          )}
          {hits.map((h, i) => (
            <div key={i} className="deploy-log-row">
              <span className={`deploy-dot ${h.ok ? 'ok' : 'block'}`} />
              <span className="deploy-log-origin">{h.origin}{h.origin !== h.ip && <span className="text-muted"> · {h.ip}</span>}</span>
              <span className="deploy-log-method">{h.kind === 'feedback' ? 'POST /feedback' : 'POST /invoke'}{h.kind === 'feedback' && h.ok ? ` · ${h.rating}★` : ''}</span>
              <span>{h.ok ? <Pill label="200 OK" tone="success" /> : <Pill label="403 Blocked" tone="error" />}</span>
              <span className="deploy-log-time">{relTime(h.mins)}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted">Feedback submissions feed {emp.name}'s trust score, surfaced in its Performance section. Origins outside the allow-list are rejected at the edge.</div>
      </section>
    </div>
  );
}

function CredRow({ icon, label, value, copyValue, field, copied, onCopy, extra }) {
  return (
    <div className="deploy-cred">
      <span className="deploy-cred-key">{icon} {label}</span>
      <span className="deploy-cred-val mono">{value}</span>
      {extra}
      <button className="deploy-icon-btn" title="Copy" onClick={() => onCopy(copyValue ?? value, field)}>
        {copied === field ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}

function NewDeploymentModal({ emp, onClose, onCreate }) {
  const [name, setName] = useState('production');
  const [env, setEnv] = useState('production');
  const [region, setRegion] = useState('us-east-1');
  return (
    <Modal open onClose={onClose} title={`New deployment · ${emp.name}`}>
      <div className="flex flex-col gap-4">
        <Field label="Deployment name"><input className="search-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. production" /></Field>
        <div className="grid-cols-2" style={{ gap: 12 }}>
          <Field label="Environment"><Select value={env} onChange={(v) => { setEnv(v); if (!name || ENVS.includes(name)) setName(v); }} options={ENVS} /></Field>
          <Field label="Region"><Select value={region} onChange={setRegion} options={REGIONS} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onCreate({ name: name.trim(), env, region })}><Rocket size={15} /> Deploy</button>
        </div>
      </div>
    </Modal>
  );
}
