import React, { useState, useEffect } from 'react';
import { Note, Pill } from './ui.jsx';
import { kpisForDept } from '../data/store.js';
import { Gauge, Sparkles, RefreshCw, X } from 'lucide-react';

// Multi-phase "agent reading your connections" scan before it yields the KPI
// inventory — mirrors the Units-of-Work discovery feel. Each phase has its own
// nominal `base` duration (heavy reads take longer); actual time is randomised
// around it at runtime so the scan never feels like a fixed UI sequence.
const KPI_SCAN_PHASES = [
  { label: 'Authenticating with connected systems', base: 1100 },
  { label: 'Reading metrics & report definitions', base: 3400 },
  { label: 'Extracting candidate KPIs from sources', base: 2600 },
  { label: 'Resolving the source of truth per metric', base: 2900 },
  { label: 'Computing baselines & targets', base: 3600 },
];

// Randomise a duration around a nominal value: ±35% jitter, plus a ~20% chance
// of a "backend hiccup" that tacks on an extra 0.5–1.8s — mimics a slow call.
const jitter = (base) => {
  const spread = base * (0.65 + Math.random() * 0.7);
  const hiccup = Math.random() < 0.2 ? 500 + Math.random() * 1300 : 0;
  return Math.round(spread + hiccup);
};

// Reusable KPI identify/inventory panel. Controlled via value/onChange so the
// host (onboarding wizard, department detail) owns the list. Key it by `dept` so
// internal scan state resets when the department changes.
export function KpiInventoryPanel({ dept, sourceLabel = 'Connected systems', value, onChange, toast, autoScan = true }) {
  // scan starts only when there's no inventory yet
  const [scanIdx, setScanIdx] = useState(() => (autoScan && value == null ? 0 : -1));
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);

  // phase stepper — ~1.2s each so the full scan runs ~6s, then yields the KPIs
  useEffect(() => {
    if (scanIdx < 0) return;
    if (scanIdx >= KPI_SCAN_PHASES.length) {
      onChange(kpisForDept(dept).map(k => ({ ...k })));
      setScanIdx(-1);
      return;
    }
    const t = setTimeout(() => setScanIdx(i => i + 1), jitter(KPI_SCAN_PHASES[scanIdx].base));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanIdx]);

  const scanning = scanIdx >= 0;
  const list = value || [];

  const rescan = () => { onChange(null); setScanIdx(0); };

  const identify = () => {
    const raw = prompt.trim();
    if (!raw || busy || scanning) return;
    setBusy(true);
    setTimeout(() => {
      const name = raw.replace(/^(identify|find|add|track)\s+/i, '').replace(/\?$/, '');
      const l = name.toLowerCase();
      const direction = /(time|cost|days|delay|vacan|churn|delinquen|error|backlog|risk)/.test(l) ? 'down' : 'up';
      const unit = /\$|cost|revenue|noi|spend/.test(l) ? '$' : /(day|time|cycle)/.test(l) ? 'days' : /(hour|hrs)/.test(l) ? 'hrs' : '%';
      const id = `kpi-custom-${Date.now().toString(36)}`;
      onChange([{ id, dept, name: name.charAt(0).toUpperCase() + name.slice(1), unit, direction, source: sourceLabel, baseline: 80, current: 80, target: direction === 'up' ? 90 : 70, custom: true }, ...list]);
      setBusy(false); setPrompt('');
      toast?.('KPI identified from your connections', 'success');
    }, 1400);
  };
  const remove = (id) => onChange(list.filter(x => x.id !== id));

  return (
    <div className="flex flex-col gap-3">
      <Note icon={Gauge}>Inventory the business <strong>KPIs</strong> this department is measured on. These are identified from your selected connections — their source of truth. Prompt the agent to surface a specific one, or add it manually.</Note>

      <div className="flex gap-2">
        <input className="search-input" style={{ flex: 1, fontSize: 13 }} placeholder='e.g. "rent collection rate" or "avg days to fill a vacancy"'
          value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && identify()} disabled={scanning || busy} />
        <button className="btn btn-primary btn-sm" disabled={scanning || busy || !prompt.trim()} onClick={identify}><Sparkles size={14} /> Identify KPI</button>
      </div>

      {scanning ? (
        <div className="flex flex-col gap-2">
          {KPI_SCAN_PHASES.map((p, i) => (
            <div key={p.label} className="flex items-center gap-3 p-2.5 rounded-lg border" style={{ opacity: i > scanIdx ? 0.4 : 1 }}>
              <div className="ico" style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: i < scanIdx ? 'var(--green-50)' : 'var(--blue-50)', color: i < scanIdx ? 'var(--green-600)' : 'var(--blue-600)' }}>
                {i < scanIdx ? <RefreshCw size={12} style={{ display: 'none' }} /> : null}
                {i < scanIdx ? '✓' : i === scanIdx ? <RefreshCw size={13} className="animate-spin" /> : i + 1}
              </div>
              <div className="flex-1 text-sm">{p.label}</div>
              <div className="text-xs text-muted">{i < scanIdx ? 'done' : i === scanIdx ? 'working…' : 'queued'}</div>
            </div>
          ))}
          <div className="text-xs text-muted text-center mt-1">Reading metrics from {sourceLabel} · step {Math.min(scanIdx + 1, KPI_SCAN_PHASES.length)} of {KPI_SCAN_PHASES.length}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {busy && <div className="flex items-center gap-2 text-xs text-muted"><RefreshCw size={12} className="animate-spin" /> Identifying from {sourceLabel}…</div>}
          {list.length === 0 && !busy && <div className="text-sm text-muted">No KPIs yet — prompt the agent above to identify one.</div>}
          {list.map(k => (
            <div key={k.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Gauge size={16} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm flex items-center gap-2">{k.name}{k.custom && <Pill label="custom" tone="info" />}</div>
                <div className="text-xs text-muted">Source: {k.source} · unit {k.unit} · {k.direction === 'up' ? 'higher is better' : 'lower is better'}</div>
              </div>
              <span className="text-xs text-muted font-mono">target {k.target}{k.unit === '%' ? '%' : ''}</span>
              <button className="deploy-icon-btn" title="Remove" onClick={() => remove(k.id)}><X size={14} /></button>
            </div>
          ))}
          <div className="flex items-center justify-between mt-1">
            {list.length > 0
              ? <span className="text-xs text-muted">{list.length} KPI{list.length === 1 ? '' : 's'} in the inventory · these become mappable when you onboard AI employees.</span>
              : <span />}
            <button className="btn btn-ghost btn-sm" onClick={rescan} disabled={busy}><RefreshCw size={13} /> Re-scan</button>
          </div>
        </div>
      )}
    </div>
  );
}
