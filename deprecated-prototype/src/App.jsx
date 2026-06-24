import React, { useState } from 'react'
import { ChevronDown, Search, Bell, LogOut, Check, Hexagon } from 'lucide-react'
import { ROLES, USERS, employees, questions, approvals } from './data/store.js'
import { NAV, routesFor, ALL_ROUTES, canAccess } from './data/nav.js'
import { Avatar, useToast, Denied } from './components/ui.jsx'
import * as Pages from './pages/index.jsx'

const COUNTS = { employees: employees.filter((e) => e.status === 'deployed').length, questions: questions.filter((q) => q.status === 'open').length, approvals: approvals.length }

// ---------------------------------------------------------------- Login -----
function Login({ onPick }) {
  return (
    <div className="login-wrap">
      <div className="login">
        <div className="brandside">
          <div className="row" style={{ gap: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(140deg,#fff,#bfdbfe)', display: 'grid', placeItems: 'center' }}>
              <Hexagon size={24} color="#1746b0" />
            </div>
            <div><div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Onyx Meridian</div><div style={{ color: '#7fa0e0', fontSize: 12 }}>AI Workforce Control Plane</div></div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginTop: 48 }}>
            <h1 style={{ color: '#fff', fontSize: 30, lineHeight: 1.18, letterSpacing: '-.02em' }}>Communicate,<br />then do the work.</h1>
            <p style={{ color: '#bcd0f5', marginTop: 16, fontSize: 14.5, maxWidth: 360 }}>
              Onboard a department, decompose its processes into governed workflows, and put an AI workforce to work — with a human gate on every commitment.
            </p>
            <div style={{ display: 'flex', gap: 22, marginTop: 40 }}>
              {[['6', 'departments'], ['8', 'AI employees'], ['561', 'knowledge nodes']].map(([n, l]) => (
                <div key={l}><div style={{ color: '#fff', fontSize: 26, fontWeight: 800 }}>{n}</div><div style={{ color: '#7fa0e0', fontSize: 12 }}>{l}</div></div>
              ))}
            </div>
          </div>
        </div>
        <div className="formside">
          <h2 style={{ fontSize: 20 }}>Sign in</h2>
          <p className="muted" style={{ marginBottom: 22, marginTop: 4 }}>Choose a persona to explore role-scoped access.</p>
          {USERS.map((u) => {
            const r = ROLES[u.role]
            return (
              <div key={u.id} className="role-pick" onClick={() => onPick(u.id)}>
                <Avatar name={u.name} size="lg" color={`linear-gradient(135deg, ${r.color}, ${r.color}bb)`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{r.label} · {u.dept}</div>
                </div>
                <span className="pill blue"><span className="dot" />{r.short}</span>
              </div>
            )
          })}
          <div className="note" style={{ marginTop: 18 }}>Tip: you can switch persona anytime from the top-right menu to see how the UI re-scopes.</div>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------- Role menu ------
function RoleMenu({ userId, setUserId, close }) {
  return (
    <div className="menu" onMouseLeave={close}>
      <div style={{ padding: '11px 15px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', fontWeight: 700 }}>Switch persona</div>
      {USERS.map((u) => {
        const r = ROLES[u.role]
        return (
          <div key={u.id} className={'mi' + (u.id === userId ? ' sel' : '')} onClick={() => { setUserId(u.id); close() }}>
            <Avatar name={u.name} size="md" color={`linear-gradient(135deg, ${r.color}, ${r.color}bb)`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{r.label}</div>
            </div>
            {u.id === userId && <Check size={17} color="var(--blue-600)" />}
          </div>
        )
      })}
      <div className="mi" style={{ color: 'var(--red)' }} onClick={() => setUserId(null)}>
        <div className="ic s red" style={{ width: 36, height: 36 }}><LogOut size={16} /></div>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>Sign out</div>
      </div>
    </div>
  )
}

const PAGE_MAP = {
  dashboard: Pages.Dashboard, mywork: Pages.MyWork, inbox: Pages.Inbox,
  departments: Pages.Departments, orgtwin: Pages.OrgTwin, employees: Pages.Employees,
  taskboard: Pages.Taskboard, approvals: Pages.Approvals, onboarding: Pages.Onboarding,
  workflows: Pages.Workflows, connectors: Pages.Connectors, knowledge: Pages.Knowledge,
  cost: Pages.Cost, effectiveness: Pages.Effectiveness, people: Pages.People,
  governance: Pages.Governance, settings: Pages.Settings,
}

export default function App() {
  const [userId, setUserId] = useState(null)
  const [route, setRoute] = useState('dashboard')
  const [menu, setMenu] = useState(false)
  const [toast, fire] = useToast()

  if (!userId) return <Login onPick={(id) => { setUserId(id); setRoute('dashboard') }} />

  const user = USERS.find((u) => u.id === userId)
  const role = ROLES[user.role]
  const groups = routesFor(user.role)
  const meta = ALL_ROUTES.find((r) => r.key === route)
  const allowed = canAccess(user.role, route)
  const Page = PAGE_MAP[route] || Pages.Dashboard

  const switchUser = (id) => { if (id == null) { setUserId(null); return } setUserId(id); const u = USERS.find((x) => x.id === id); if (!canAccess(u.role, route)) setRoute('dashboard') }

  return (
    <div className="app">
      {/* sidebar */}
      <aside className="side">
        <div className="brand">
          <div className="logo"><Hexagon size={23} color="#1746b0" /></div>
          <div><div className="nm">Onyx Meridian</div><div className="sb">Control Plane</div></div>
        </div>
        {groups.map((g) => (
          <React.Fragment key={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map((it) => {
              const Icon = it.icon
              const cnt = it.countKey ? COUNTS[it.countKey] : null
              return (
                <div key={it.key} className={'nav-item' + (route === it.key ? ' active' : '')} onClick={() => setRoute(it.key)}>
                  <Icon /><span>{it.label}</span>{cnt ? <span className="cnt">{cnt}</span> : null}
                </div>
              )
            })}
          </React.Fragment>
        ))}
        <div className="side-foot">
          <div className="scope-card">
            <div style={{ color: '#cfe0ff', fontWeight: 700, fontSize: 12 }}>{role.label}</div>
            <div style={{ marginTop: 3 }}>{user.role === 'admin' ? 'Org-wide access' : user.role === 'head' ? `Scoped · ${user.dept}` : `Participant · ${user.dept}`}</div>
          </div>
          <div style={{ marginTop: 10 }}>Pilot · V1 GA Oct 2026</div>
        </div>
      </aside>

      {/* main */}
      <div className="main">
        <div className="topbar">
          <div>
            <h1>{meta?.label || 'Overview'}</h1>
            <div className="crumb">{user.role === 'admin' ? 'Organization' : user.dept} · {role.label}</div>
          </div>
          <div className="spacer" />
          <div className="searchbox"><Search size={16} /><input placeholder="Search employees, tasks, knowledge…" /></div>
          <div className="icon-btn"><Bell size={18} /><span className="dot" /></div>
          <div style={{ position: 'relative' }}>
            <div className="role-switch" onClick={() => setMenu((m) => !m)}>
              <Avatar name={user.name} size="md" color={`linear-gradient(135deg, ${role.color}, ${role.color}bb)`} />
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{role.short}</div>
              </div>
              <ChevronDown size={16} color="var(--muted)" />
            </div>
            {menu && <RoleMenu userId={userId} setUserId={switchUser} close={() => setMenu(false)} />}
          </div>
        </div>

        <div className="scroll">
          <div className="content">
            {allowed ? <Page user={user} role={user.role} go={setRoute} toast={fire} /> : <Denied feature={meta?.label} />}
          </div>
        </div>
      </div>

      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}
