import React, { useState } from 'react'
import {
  CircleDollarSign, Clock, Gauge, TrendingUp, Users, Lock, Settings as Cog,
  ShieldAlert, KeyRound, Power, FileLock2, UserPlus, SlidersHorizontal, Activity, Bot,
} from 'lucide-react'
import { employees, departments, USERS, ROLES } from '../data/store.js'
import { Card, Stat, Pill, Bar, SectionTitle, Avatar, statusTone } from '../components/ui.jsx'

export function Cost({ role, toast }) {
  const live = employees.filter((e) => e.status === 'deployed')
  const [dials, setDials] = useState(Object.fromEntries(live.map((e) => [e.id, 100])))
  const runs = { e1: 420, e2: 790, e3: 4100, e4: 520, e5: 960, e6: 40 }
  return (
    <>
      <p className="lead">The <b>cost-control center</b>: see what each employee runs, how often, and what it costs. Dial cadence down — the primary cost lever — or decommission (a cascade: revoke credential, reassign work, retire schedules).</p>
      <div className="grid g4" style={{ marginTop: 18 }}>
        <Stat icon={CircleDollarSign} tone="green" label="Spend this month" value="$2,672" sub="of $7,400" />
        <Stat icon={Clock} tone="blue" label="Projected EOM" value="$3,910" sub="within budget" />
        <Stat icon={Gauge} tone="purple" label="Cost / task" value="$0.0041" sub="3-term metered" />
        <Stat icon={TrendingUp} tone="amber" label="All-in ROI" value="4.1×" sub="incl. HITL" />
      </div>
      <SectionTitle>Cost breakdown per employee</SectionTitle>
      <Card><div className="tbl-wrap"><table>
        <thead><tr><th>Employee</th><th>Workflows</th><th>Runs/mo</th><th style={{ width: 210 }}>Cadence dial</th><th>Cost/mo</th><th>Effectiveness</th><th></th></tr></thead>
        <tbody>
          {live.map((e) => {
            const f = dials[e.id] / 100
            return (
              <tr key={e.id}>
                <td><div className="row"><Avatar name={e.name} size="sm" /><b>{e.name}</b></div></td>
                <td className="muted">{e.workflows.length}</td>
                <td>{Math.round((runs[e.id] || 300) * f)}</td>
                <td>
                  <input type="range" min="20" max="100" value={dials[e.id]} onChange={(ev) => setDials((d) => ({ ...d, [e.id]: +ev.target.value }))} />
                  <span className="muted" style={{ fontSize: 11 }}>{dials[e.id]}% cadence</span>
                </td>
                <td><b>${Math.round(e.spent * f)}</b></td>
                <td><span className="badge-soft">{e.eff}</span></td>
                <td><button className="btn sm danger" onClick={() => toast(`Decommission gate opened for ${e.name}`)}>Decommission</button></td>
              </tr>
            )
          })}
        </tbody>
      </table></div></Card>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Each cost = <b>AI-decide</b> + <b>AI-do</b> + <b>integration</b> (connector pull/push). Lower the dial to reduce run cadence and spend.</p>

      <Card className="pad" style={{ marginTop: 18, borderColor: '#f3cccc', background: '#fff7f7' }}>
        <div className="row"><div className="ic m red"><ShieldAlert /></div>
          <div style={{ flex: 1 }}><h4>Suspended — budget review</h4><p className="muted" style={{ fontSize: 12.5, marginTop: 3 }}><b>Gus — Service Ops</b> auto-suspended at its budget cap. Resume with an override, lower cadence, or decommission.</p></div>
          <button className="btn sm">Lower cadence</button><button className="btn sm danger" onClick={() => toast('Decommission gate opened for Gus')}>Decommission</button>
        </div>
      </Card>
    </>
  )
}

export function Effectiveness() {
  const rows = [
    ['Ada', 'AR Clerk', '4.1×', '4%', '2%', '98%', 'Supervised'],
    ['Boon', 'AP Specialist', '3.8×', '6%', '3%', '95%', 'Assist'],
    ['Cleo', 'Support Triage', '5.2×', '3%', '1%', '99%', 'Autonomous'],
    ['Eli', 'Demand Gen', '2.9×', '11%', '5%', '90%', 'Assist'],
    ['Faye', 'Contract Reviewer', '3.1×', '14%', '7%', '93%', 'Shadow'],
  ]
  return (
    <>
      <p className="lead"><b>Ensure</b> — effectiveness, evals, drift and promotion gates. Effectiveness is task-specific and pluggable; a generic formula seeds each role and is solidified over time. Promotions up the autonomy ladder require a passing eval.</p>
      <div className="grid g4" style={{ marginTop: 18 }}>
        <Stat icon={Gauge} tone="blue" label="Avg effectiveness" value="4.1×" sub="vs human baseline" />
        <Stat icon={Activity} tone="amber" label="Avg override rate" value="6%" sub="accept / edit / dismiss" />
        <Stat icon={TrendingUp} tone="green" label="SLA adherence" value="96%" sub="across workflows" />
        <Stat icon={Bot} tone="purple" label="Promotion-eligible" value="1" sub="Ada → Autonomous" />
      </div>
      <SectionTitle>Per-employee scorecard</SectionTitle>
      <Card><div className="tbl-wrap"><table>
        <thead><tr><th>Employee</th><th>Role</th><th>Effectiveness</th><th>Override rate</th><th>Rework</th><th>SLA</th><th>Autonomy</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="hov">
              <td><div className="row"><Avatar name={r[0]} size="sm" /><b>{r[0]}</b></div></td>
              <td className="muted">{r[1]}</td><td><span className="badge-soft">{r[2]}</span></td>
              <td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td><Pill tone="purple">{r[6]}</Pill></td>
            </tr>
          ))}
        </tbody>
      </table></div></Card>
      <Card className="pad" style={{ marginTop: 18 }}>
        <SectionTitle>Effectiveness formula (generic — Finance & Invoicing)</SectionTitle>
        <pre style={{ background: 'var(--ink)', color: '#cfe0ff', borderRadius: 12, padding: 16, fontSize: 12.5, fontFamily: 'JetBrains Mono, monospace', overflow: 'auto', margin: 0 }}>{`effectiveness = (human_baseline_minutes / ai_minutes)
              × (1 − override_rate)
              × sla_adherence
# solidify per-role over time as data accrues`}</pre>
      </Card>
    </>
  )
}

export function People({ role, toast }) {
  const canOnboardHead = role === 'admin'
  const people = [
    ...USERS.map((u) => ({ name: u.name, role: ROLES[u.role].label, dept: u.dept, you: true })),
    { name: 'Lena Ortiz', role: 'Department Head', dept: 'Operations' },
    { name: 'Mei Lin', role: 'Department Head', dept: 'Customer Service' },
    { name: 'Tom Reyes', role: 'Department Head', dept: 'Marketing' },
    { name: 'Sofia Diaz', role: 'Department Member', dept: 'Finance & Invoicing' },
    { name: 'Omar Haddad', role: 'Department Member', dept: 'Customer Service' },
  ]
  const shown = role === 'admin' ? people : people.filter((p) => p.dept === 'Finance & Invoicing')
  return (
    <>
      <p className="lead">Human users in the organization. {role === 'admin' ? 'Admins onboard departments and department heads.' : 'As a department head you can onboard members into your department (up to member role only).'}</p>
      <div className="row" style={{ margin: '16px 0', gap: 10 }}>
        <button className="btn primary" onClick={() => toast('Invite a department member')}><UserPlus size={15} /> Onboard member</button>
        <button className="btn" disabled={!canOnboardHead} onClick={() => toast('Onboard a department head')}><UserPlus size={15} /> Onboard department head{!canOnboardHead && ' (admin only)'}</button>
      </div>
      <Card><div className="tbl-wrap"><table>
        <thead><tr><th>Name</th><th>Role</th><th>Department</th><th></th></tr></thead>
        <tbody>
          {shown.map((p, i) => (
            <tr key={i} className="hov">
              <td><div className="row"><Avatar name={p.name} size="sm" /><b>{p.name}</b>{p.you && <span className="badge-soft">you</span>}</div></td>
              <td><Pill tone={p.role.includes('Admin') ? 'purple' : p.role.includes('Head') ? 'blue' : 'gray'}>{p.role}</Pill></td>
              <td className="muted">{p.dept}</td>
              <td><button className="btn sm">Manage</button></td>
            </tr>
          ))}
        </tbody>
      </table></div></Card>
    </>
  )
}

export function Governance({ toast }) {
  return (
    <>
      <p className="lead"><b>Vault</b> — governance, identity and security. Versioned policy catalog, least-privilege scope inheritance, separation of duties, and the kill switch at employee / unit / workforce scope.</p>
      <div className="grid g3" style={{ marginTop: 18 }}>
        <Card className="pad"><div className="row"><div className="ic s blue"><FileLock2 /></div><h4>Policy catalog</h4></div><p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>14 policies · versioned · central → unit → employee narrowing.</p><button className="btn sm" style={{ marginTop: 10 }}>View catalog</button></Card>
        <Card className="pad"><div className="row"><div className="ic s purple"><KeyRound /></div><h4>Principals & secrets</h4></div><p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>6 active scoped credentials · vaulted secrets · rotation on deploy.</p><button className="btn sm" style={{ marginTop: 10 }}>Manage</button></Card>
        <Card className="pad"><div className="row"><div className="ic s amber"><ShieldAlert /></div><h4>Separation of duties</h4></div><p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>configurer ≠ approver ≠ auditor enforced on every gate.</p><button className="btn sm" style={{ marginTop: 10 }}>Configure</button></Card>
      </div>

      <SectionTitle>Kill switch</SectionTitle>
      <Card className="pad">
        <div className="grid g3">
          {[['Employee', 'Suspend one worker instantly', 'amber'], ['Unit', 'Cascade-suspend a department', 'amber'], ['Workforce', 'Org-wide emergency stop', 'red']].map(([t, d, tone]) => (
            <Card key={t} className="pad" style={{ borderColor: tone === 'red' ? '#f3cccc' : 'var(--line)' }}>
              <div className="row"><div className={`ic s ${tone === 'red' ? 'red' : 'amber'}`}><Power /></div><h4>{t}</h4></div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>{d}</p>
              <button className={'btn sm ' + (tone === 'red' ? 'danger' : '')} style={{ marginTop: 10 }} onClick={() => toast(`${t} kill-switch armed — confirmation required`)}>Arm {t.toLowerCase()} stop</button>
            </Card>
          ))}
        </div>
      </Card>

      <SectionTitle>Recent policy activity</SectionTitle>
      <Card className="pad">
        {[['Least-privilege check', 'blocked Eli from customer:write — not in scope', 'amber'], ['Policy v12 published', 'PDPL egress rule tightened', 'blue'], ['Autonomy promote', 'Ada cleared separation-of-duties check', 'green']].map(([a, b, tone], i) => (
          <div key={i} className="dotline"><span className="sw" style={{ background: `var(--${tone === 'amber' ? 'amber' : tone === 'green' ? 'green' : 'blue-600'})` }} /><b>{a}</b> <span className="muted">— {b}</span></div>
        ))}
      </Card>
    </>
  )
}

export function Settings({ toast }) {
  return (
    <>
      <p className="lead">Platform-level configuration — admin only. Model gateway, connector catalog, feature flags, and identity integration.</p>
      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card className="pad">
          <div className="row"><div className="ic s blue"><SlidersHorizontal /></div><h3>Model gateway</h3></div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>On-prem-first routing with a token→USD pricing table.</p>
          <div className="kv" style={{ marginTop: 12 }}>
            <span className="k">Preferred</span><span className="mono">internal/onyx-llm</span>
            <span className="k">Fallback</span><span className="mono">claude-opus-4-8</span>
            <span className="k">Egress</span><span>PII-redacted</span>
          </div>
        </Card>
        <Card className="pad">
          <div className="row"><div className="ic s purple"><Cog /></div><h3>Feature flags</h3></div>
          {[['Durable Flow engine', true], ['Knowledge-miss routing', true], ['Drift auto-demote', false], ['Workforce kill switch', true]].map(([f, on]) => (
            <div key={f} className="between" style={{ padding: '9px 0', borderBottom: '1px solid var(--line-2)' }}>
              <span style={{ fontSize: 13 }}>{f}</span>
              <span className="pill" style={{ background: on ? 'var(--green-bg)' : '#eef2f8', color: on ? '#157f3b' : '#5b6677' }}><span className="dot" style={{ background: on ? 'var(--green)' : 'var(--faint)' }} />{on ? 'on' : 'off'}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card className="pad" style={{ marginTop: 18 }}>
        <div className="row"><div className="ic s teal"><Activity /></div><h3>System health</h3></div>
        <div className="grid g4" style={{ marginTop: 14 }}>
          {[['API', 'healthy'], ['MongoDB', 'healthy'], ['Model gateway', 'healthy'], ['Connectors', 'degraded']].map(([s, st]) => (
            <div key={s} className="row" style={{ gap: 8 }}><span className="sw" style={{ background: st === 'healthy' ? 'var(--green)' : 'var(--amber)', borderRadius: '50%' }} /><span style={{ fontSize: 13 }}><b>{s}</b><div className="muted" style={{ fontSize: 11.5 }}>{st}</div></span></div>
          ))}
        </div>
      </Card>
    </>
  )
}
