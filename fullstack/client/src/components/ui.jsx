import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, ShieldCheck, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Bot, Cpu, Hexagon, Sparkles, Activity, Compass, Radar, Aperture } from 'lucide-react';
import { agentGrad, agentSeed } from '../data/store.js';

const AGENT_ICONS = [Bot, Cpu, Hexagon, Sparkles, Activity, Compass, Radar, Aperture];

export function Note({ children, icon: Icon = Info }) {
  return (
    <div className="note">
      <Icon size={18} className="ico" />
      <div>{children}</div>
    </div>
  );
}

export function SecuredBadge({ children }) {
  return <span className="secured-badge"><ShieldCheck size={13} /> {children}</span>;
}

export function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select className={`search-input bg-white ${className}`} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Stat({ label, value, delta, icon: Icon }) {
  const isPos = delta && delta.startsWith('+');
  const isNeg = delta && delta.startsWith('-');
  const tone = isPos ? 'positive' : isNeg ? 'negative' : 'neutral';
  
  return (
    <div className="stat">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && <Icon size={16} className="text-muted" />}
      </div>
      <div className="stat-val">{value}</div>
      {delta && <div className={`stat-delta ${tone}`}>{delta}</div>}
    </div>
  );
}

export function Pill({ label, tone = 'neutral' }) {
  return <span className={`pill pill-${tone}`}>{label}</span>;
}

// Shimmering skeleton placeholder shown while an action's result loads.
export function Skeleton({ w = '100%', h = 12, radius = 6, className = '', style }) {
  return <span className={`skeleton ${className}`} style={{ width: w, height: h, borderRadius: radius, ...style }} />;
}

// Simulates a real backend round-trip: returns `loading=true` on mount, then
// flips to false after a random delay (default 1–5s) so grids feel like a live
// system fetching data. `deps` re-triggers the load (e.g. on filter/tab change).
export function useFakeLoad(deps = [], { min = 1000, max = 5000 } = {}) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const ms = min + Math.random() * (max - min);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return loading;
}

// A <tbody> of shimmering placeholder rows, sized to the given columns. Drop in
// while a table's data "loads" so the grid keeps its shape. Pass either a
// `columns` array (skeleton width varies a little per column) or a `cols` count.
export function SkeletonRows({ columns, cols, rows = 6 }) {
  const list = columns || Array.from({ length: cols || 4 });
  const widths = ['70%', '45%', '60%', '40%', '55%', '35%', '50%'];
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {list.map((c, i) => (
            <td key={(c && c.key) || i} style={{ textAlign: (c && c.align) || undefined }}>
              <Skeleton w={widths[i % widths.length]} h={12} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function Bar({ value, max = 100, tone = 'blue' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const bgMap = {
    blue: 'var(--blue-500)',
    green: 'var(--green-500)',
    orange: 'var(--orange-500)',
    red: 'var(--red-500)',
  };
  return (
    <div style={{ width: '100%', height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: bgMap[tone] || bgMap.blue, transition: 'width 0.3s' }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, size }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Avatar({ initials, photo, size = 32, className = '', style }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={initials || ''}
        className={`avatar avatar-photo ${className}`}
        style={{ width: size, height: size, objectFit: 'cover', ...style }}
      />
    );
  }
  return <div className={`avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.4, ...style }}>{initials}</div>;
}

// Professional, deterministic avatar for an AI agent — a clean line icon on a
// distinct per-agent gradient (keyed by id, falls back to name).
export function AgentAvatar({ id, name = '', size = 32, className = '', style }) {
  const key = id || name;
  const Icon = AGENT_ICONS[agentSeed(key) % AGENT_ICONS.length];
  return (
    <div className={`avatar agent-avatar ${className}`}
      style={{ width: size, height: size, color: '#fff', background: agentGrad(key), ...style }}
      title={name || undefined}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </div>
  );
}

export function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={20} className="text-muted" />}
        <h2 style={{ margin: 0 }}>{title}</h2>
      </div>
      {subtitle && <div className="text-muted text-sm">{subtitle}</div>}
    </div>
  );
}

export function Empty({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-muted" style={{ padding: '40px' }}>
      {Icon && <Icon size={32} opacity={0.5} />}
      <div>{message}</div>
    </div>
  );
}

export function Denied() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <AlertCircle size={48} className="text-muted mb-4" />
      <h2>Access Denied</h2>
      <p className="text-muted mt-2">You do not have permission to view this area.</p>
    </div>
  );
}

export function statusTone(status) {
  const map = {
    'done': 'success',
    'answered': 'success',
    'active': 'success',
    'autonomous': 'success',
    'in-progress': 'info',
    'syncing': 'info',
    'assist': 'info',
    'review': 'warning',
    'pending': 'warning',
    'shadow': 'neutral',
    'todo': 'neutral',
    'draft': 'neutral',
    'paused': 'neutral',
    'invited': 'warning',
    'error': 'error',
  };
  return map[status?.toLowerCase()] || 'neutral';
}

export function priTone(priority) {
  const map = {
    'low': 'neutral',
    'medium': 'info',
    'high': 'warning',
    'critical': 'error',
  };
  return map[priority?.toLowerCase()] || 'neutral';
}

// ---- Sortable tables -------------------------------------------------------
// Columns are declared as { key, label, get, style, align }. A column with no
// `get` accessor is rendered as a plain (non-sortable) header — useful for
// action columns. Clicking a sortable header cycles asc → desc on that key.
export function useSortable(columns, initial = {}) {
  const [sort, setSort] = useState({ key: initial.key || null, dir: initial.dir || 'asc' });
  const toggle = (key) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  const apply = (rows) => {
    const col = columns.find(c => c.key === sort.key && c.get);
    if (!col) return rows;
    const sorted = [...rows].sort((a, b) => {
      const va = col.get(a), vb = col.get(b);
      const aNull = va == null || va === '', bNull = vb == null || vb === '';
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
    });
    return sort.dir === 'asc' ? sorted : sorted.reverse();
  };
  return { sort, toggle, apply };
}

export function SortHead({ columns, sort, toggle }) {
  return (
    <thead>
      <tr>
        {columns.map((c, i) => {
          const sortable = !!c.get;
          const active = sortable && sort.key === c.key;
          return (
            <th key={c.key || c.label || i} onClick={sortable ? () => toggle(c.key) : undefined}
              className={sortable ? 'th-sort' : ''} style={{ textAlign: c.align, ...c.style }}>
              <span className="th-sort-inner" style={{ justifyContent: c.align === 'right' ? 'flex-end' : undefined }}>
                {c.label}
                {sortable && (active
                  ? (sort.dir === 'asc' ? <ChevronUp size={13} className="th-sort-ico on" /> : <ChevronDown size={13} className="th-sort-ico on" />)
                  : <ChevronsUpDown size={13} className="th-sort-ico" />)}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

// Self-contained sortable table. Encapsulates its own sort state so it can be
// dropped in anywhere (including conditional render branches) without hook-order
// concerns. `columns` are { key, label, get, style, align }; `renderRow(row, i)`
// must return a <tr> (and own its key).
export function SortableTable({ columns, rows, initial, renderRow, className = 'table', skeletonRows = 6, pageSize }) {
  const { sort, toggle, apply } = useSortable(columns, initial);
  const loading = useFakeLoad();
  const [page, setPage] = useState(0);
  const sorted = apply(rows);
  const paginate = pageSize && sorted.length > pageSize;
  const pageCount = paginate ? Math.ceil(sorted.length / pageSize) : 1;
  // Keep the current page in range when the data set shrinks (e.g. after sorting/filtering).
  const safePage = Math.min(page, pageCount - 1);
  const visible = paginate ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize) : sorted;
  return (
    <>
      <table className={className}>
        <SortHead columns={columns} sort={sort} toggle={toggle} />
        {loading
          ? <SkeletonRows columns={columns} rows={Math.min(skeletonRows, pageSize || rows.length || skeletonRows)} />
          : <tbody>{visible.map((r, i) => renderRow(r, i))}</tbody>}
      </table>
      {!loading && paginate && (
        <div className="pager">
          <span className="pager-info">
            {safePage * pageSize + 1}–{Math.min(safePage * pageSize + pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="pager-controls">
            <button className="btn btn-outline btn-sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              <ChevronLeft size={15} /> Prev
            </button>
            <span className="pager-page">Page {safePage + 1} / {pageCount}</span>
            <button className="btn btn-outline btn-sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

let toastId = 0;
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = (msg, type = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const ToastContainer = () => (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: '#333', color: '#fff', padding: '12px 16px', borderRadius: '6px', 
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.2s ease-out forwards'
        }}>
          {t.type === 'success' ? <CheckCircle size={16} color="#4ade80" /> : <Info size={16} color="#6f6cf0" />}
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );

  return { toasts, toast, ToastContainer };
}
