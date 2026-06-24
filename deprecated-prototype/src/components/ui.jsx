import React, { useEffect } from 'react'
import { X, ShieldAlert } from 'lucide-react'

export const cx = (...a) => a.filter(Boolean).join(' ')

const PAL = ['#2563eb', '#7c3aed', '#0d9488', '#d97706', '#dc2626', '#0891b2', '#15a34a', '#db2777']
export const colorFor = (s = '?') => PAL[(s.charCodeAt(0) || 0) % PAL.length]

export function Avatar({ name = '?', size = 'md', color }) {
  const initials = name.split(/[\s—]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('')
  return <div className={cx('avatar', size)} style={{ background: color || `linear-gradient(135deg, ${colorFor(name)}, ${colorFor(name + 'x')})` }}>{initials.toUpperCase()}</div>
}

export function Pill({ tone = 'gray', children }) {
  return <span className={cx('pill', tone)}><span className="dot" />{children}</span>
}

const STATUS_TONE = {
  active: 'green', deployed: 'green', complete: 'green', alive: 'green',
  onboarding: 'amber', research_derived: 'amber', stale: 'amber', draft: 'gray', pending: 'amber',
  suspended: 'red', incomplete: 'red', never_run: 'gray',
}
export const statusTone = (s) => STATUS_TONE[s] || 'gray'
const PRI_TONE = { critical: 'red', high: 'amber', medium: 'blue', low: 'gray' }
export const priTone = (p) => PRI_TONE[p] || 'gray'

export function Card({ className, children, onClick, ...rest }) {
  return <div className={cx('card', onClick && 'click', className)} onClick={onClick} {...rest}>{children}</div>
}

export function Stat({ icon: Icon, tone = 'blue', label, value, unit, sub }) {
  return (
    <Card className="pad stat">
      <div className="between">
        <div className="k">{label}</div>
        <div className={cx('ic', 's', tone)}><Icon /></div>
      </div>
      <div className="v">{value}{unit && <span className="u">{unit}</span>}</div>
      {sub && <div className="sub">{sub}</div>}
    </Card>
  )
}

export function Bar({ value, tone, className }) {
  const t = tone ? ` ${tone}` : ''
  return <div className={cx('bar' + t, className)}><i style={{ width: Math.max(0, Math.min(100, value)) + '%' }} /></div>
}

export function SectionTitle({ children }) { return <div className="section-title">{children}</div> }

export function Modal({ title, sub, onClose, children, footer }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mh">
          <div><h2>{title}</h2>{sub && <div className="crumb">{sub}</div>}</div>
          <div className="x" onClick={onClose}><X size={18} /></div>
        </div>
        <div className="mb">{children}</div>
        {footer && <div className="mh" style={{ borderBottom: 0, borderTop: '1px solid var(--line)', justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon: Icon, title, children }) {
  return <div className="empty"><div className="ic m slate">{Icon && <Icon />}</div><h3>{title}</h3><p className="muted" style={{ marginTop: 4 }}>{children}</p></div>
}

export function Denied({ feature = 'this area' }) {
  return (
    <div className="deny">
      <ShieldAlert size={22} style={{ flex: 'none' }} />
      <div>
        <h3 style={{ color: 'inherit' }}>Not available for your role</h3>
        <p style={{ marginTop: 4 }}>{feature} requires Department Head or Admin access. Use the role switcher in the top-right to view it as a different persona.</p>
      </div>
    </div>
  )
}

let toastTimer
export function useToast() {
  const [msg, setMsg] = React.useState(null)
  const toast = (m) => { setMsg(m); clearTimeout(toastTimer); toastTimer = setTimeout(() => setMsg(null), 2600) }
  return [msg, toast]
}
