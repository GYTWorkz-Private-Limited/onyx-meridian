import React, { useState } from 'react'
import {
  Building2, Sparkles, Bot, KanbanSquare, ShieldCheck, Check, X, ScrollText,
  Network, Plus, Zap, Heart, Gauge,
} from 'lucide-react'
import { departments, employees, tasks, approvals } from '../data/store.js'
import { Card, Stat, Pill, Bar, SectionTitle, Avatar, Modal, priTone, statusTone, Empty } from '../components/ui.jsx'

const RUNGS = ['shadow', 'assist', 'supervised', 'autonomous']

export function Departments({ go, toast }) {
  const [sel, setSel] = useState(null)
  const d = departments.find((x) => x.id === sel)
  return (
    <>
      <p className="lead">Each department is a <b>Business Unit</b> — onboarded with its scopes, budget, and caretaker, then populated with roles, units of work, workflows, and a knowledge graph.</p>
      <div className="grid g3" style={{ marginTop: 18 }}>
        {departments.map((x) => (
          <Card key={x.id} className="pad click" onClick={() => (x.status === 'onboarding' ? go('onboarding') : setSel(x.id))}>
            <div className="between"><div className="ic m blue"><Building2 /></div><Pill tone={statusTone(x.status)}>{x.status}</Pill></div>
            <h3 style={{ marginTop: 12 }}>{x.name}</h3>
            <div className="tags" style={{ marginTop: 8 }}>{x.units.length ? x.units.map((u) => <span key={u} className="tag">{u}</span>) : <span className="muted" style={{ fontSize: 12 }}>units to be discovered</span>}</div>
            <div className="divider" />
            <div className="between" style={{ fontSize: 12.5 }}>
              <span className="muted">{x.employees} employees</span><span className="muted">{x.workflows} workflows</span><span className="badge-soft">{x.eff} eff</span>
            </div>
            {x.budget ? (
              <><Bar value={(x.spent / x.budget) * 100} className="" /><div className="muted" style={{ fontSize: 12, marginTop: 6 }}>${x.spent} / ${x.budget} this month</div></>
            ) : (
              <button className="btn primary block" style={{ marginTop: 12 }}><Sparkles size={15} /> Run onboarding agent</button>
            )}
          </Card>
        ))}
      </div>

      {d && (
        <Modal title={d.name} sub={`${d.units.join(' · ') || 'no units yet'} · caretaker ${d.caretaker}`} onClose={() => setSel(null)}
          footer={<><button className="btn" onClick={() => { setSel(null); go('knowledge') }}>Open knowledge graph</button><button className="btn primary" onClick={() => { setSel(null); go('onboarding') }}><Sparkles size={15} /> Run discovery</button></>}>
          <div className="grid g3">
            <Card className="pad stat"><div className="k">Employees</div><div className="v" style={{ fontSize: 24 }}>{d.employees}</div></Card>
            <Card className="pad stat"><div className="k">Workflows</div><div className="v" style={{ fontSize: 24 }}>{d.workflows}</div></Card>
            <Card className="pad stat"><div className="k">Effectiveness</div><div className="v" style={{ fontSize: 24 }}>{d.eff}</div></Card>
          </div>
          <SectionTitle>Delegatable scopes</SectionTitle>
          <div className="tags">{d.scopes.map((s) => <span key={s} className="tag code">{s}</span>)}</div>
          <SectionTitle>Employees</SectionTitle>
          {employees.filter((e) => e.dept === d.name).map((e) => (
            <div key={e.id} className="dotline"><Avatar name={e.name} size="sm" /><b>{e.name}</b><span className="muted" style={{ fontSize: 12 }}>{e.role}</span><div className="spacer" /><Pill tone="purple">{e.autonomy}</Pill></div>
          )) || <p className="muted">None yet.</p>}
        </Modal>
      )}
    </>
  )
}

export function OrgTwin({ role }) {
  const scoped = role === 'head'
  const shown = scoped ? departments.filter((d) => d.name === 'Finance & Invoicing') : departments
  return (
    <>
      <p className="lead">A living <b>digital twin</b> of the organization — departments, their AI employees, and reporting lines on one canvas. {scoped ? 'Scoped to your department.' : 'Org-wide view.'}</p>
      <Card className="pad" style={{ marginTop: 18 }}>
        <div className="between" style={{ marginBottom: 16 }}><div className="row"><div className="ic s blue"><Network /></div><h3>{scoped ? 'Finance & Invoicing' : 'Onyx Enterprise'} — org canvas</h3></div><Pill tone="blue">live</Pill></div>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 28, minWidth: 'min-content', padding: '8px 4px' }}>
            {!scoped && (
              <div style={{ display: 'grid', placeItems: 'center', minWidth: 150 }}>
                <div className="ic l" style={{ background: 'var(--blue-900)', color: '#fff', width: 60, height: 60, borderRadius: 16 }}><Building2 /></div>
                <div style={{ fontWeight: 700, marginTop: 8, textAlign: 'center' }}>Onyx Enterprise</div>
                <div className="muted" style={{ fontSize: 12 }}>6 departments</div>
              </div>
            )}
            {shown.map((d) => (
              <div key={d.id} style={{ minWidth: 230 }}>
                <Card className="pad" style={{ background: 'linear-gradient(180deg,#fff,var(--surface-2))' }}>
                  <div className="between"><div className="row"><div className="ic s blue"><Building2 /></div><b>{d.name}</b></div><Pill tone={statusTone(d.status)}>{d.status}</Pill></div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {employees.filter((e) => e.dept === d.name).map((e) => (
                      <div key={e.id} className="row" style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 11, background: '#fff' }}>
                        <Avatar name={e.name} size="sm" />
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{e.name}</div><div className="muted" style={{ fontSize: 11 }}>{e.role} · {e.tier}</div></div>
                        <span className="sw" style={{ background: e.status === 'deployed' ? 'var(--green)' : e.status === 'suspended' ? 'var(--red)' : 'var(--faint)', borderRadius: '50%' }} />
                      </div>
                    ))}
                    {!employees.filter((e) => e.dept === d.name).length && <div className="muted" style={{ fontSize: 12, padding: 4 }}>No employees yet</div>}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  )
}

export function Employees() {
  const [sel, setSel] = useState(null)
  const e = employees.find((x) => x.id === sel)
  return (
    <>
      <p className="lead">An <b>AI employee</b> is a role + responsibility, bound to workflows on a schedule. It runs a heartbeat — <i>“is there anything I should do right now?”</i> — within a WIP limit, prioritising by urgency, importance and readiness.</p>
      <div className="grid g3" style={{ marginTop: 18 }}>
        {employees.map((x) => (
          <Card key={x.id} className="pad click" onClick={() => setSel(x.id)}>
            <div className="between">
              <div className="row"><Avatar name={x.name} size="lg" /><div><div style={{ fontWeight: 700 }}>{x.name}</div><div className="muted" style={{ fontSize: 12 }}>{x.role}</div></div></div>
              <Pill tone={statusTone(x.status)}>{x.status}</Pill>
            </div>
            <div className="tags" style={{ marginTop: 12 }}><span className="tag">{x.dept}</span><span className="tag">{x.tier}</span></div>
            <div className="divider" />
            <div className="between" style={{ fontSize: 12.5 }}><Pill tone="purple">{x.autonomy}</Pill><span className="muted">WIP {x.wip[0]}/{x.wip[1]}</span><span className="badge-soft">{x.eff}</span></div>
            <div className="between" style={{ fontSize: 12, marginTop: 12 }}><span className="muted"><Heart size={12} style={{ verticalAlign: -2 }} /> {x.hb}</span><span className="muted">${x.spent} / ${x.budget}</span></div>
          </Card>
        ))}
      </div>

      {e && (
        <Modal title={e.name + ' — ' + e.role} sub={`${e.archetype} · ${e.dept} · ${e.tier}`} onClose={() => setSel(null)}
          footer={<><button className="btn">Reconfigure</button><button className="btn danger">Decommission</button><button className="btn primary">Promote autonomy</button></>}>
          <div className="row wrap" style={{ gap: 8, marginBottom: 14 }}><Pill tone={statusTone(e.status)}>{e.status}</Pill><Pill tone="blue">WIP {e.wip[0]}/{e.wip[1]}</Pill><Pill tone="green"><Heart size={11} /> {e.hb}</Pill></div>
          <SectionTitle>Autonomy ladder</SectionTitle>
          <div className="ladder">{RUNGS.map((r, i) => { const idx = RUNGS.indexOf(e.autonomy); return <div key={r} className={'rung' + (i < idx ? ' passed' : i === idx ? ' on' : '')}>{r}<small>L{i}</small></div> })}</div>
          <SectionTitle>Responsibilities</SectionTitle>
          {e.resp.map((r) => <div key={r} className="dotline"><Check size={15} color="var(--green)" /> {r}</div>)}
          <SectionTitle>Bound workflows</SectionTitle>
          <div className="tags">{e.workflows.length ? e.workflows.map((w) => <span key={w} className="tag">{w}</span>) : <span className="muted" style={{ fontSize: 12 }}>none yet</span>}</div>
          <SectionTitle>Connectors</SectionTitle>
          <div className="tags">{e.connectors.length ? e.connectors.map((c) => <span key={c} className="tag code">{c}</span>) : <span className="muted" style={{ fontSize: 12 }}>none</span>}</div>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card className="pad"><div className="muted" style={{ fontSize: 12 }}>Schedule</div><div style={{ fontWeight: 700, marginTop: 4, fontSize: 13 }}>{e.sched}</div></Card>
            <Card className="pad"><div className="muted" style={{ fontSize: 12 }}>Spend / Budget</div><div style={{ fontWeight: 700, marginTop: 4 }}>${e.spent} / ${e.budget}</div><Bar value={(e.spent / e.budget) * 100} className="" /></Card>
          </div>
        </Modal>
      )}
    </>
  )
}

const COLS = [['todo', 'To do'], ['doing', 'In progress'], ['wait', 'Waiting'], ['gate', 'At gate'], ['done', 'Done']]
export function Taskboard() {
  const [sel, setSel] = useState(null)
  const t = tasks.find((x) => x.id === sel)
  return (
    <>
      <p className="lead">The shared <b>taskboard</b> across the workforce. Incoming messages and scheduled triggers land here; employees fetch, work, and maintain status. Cards <i>at a gate</i> wait for a human to commit.</p>
      <div className="row wrap" style={{ margin: '16px 0', gap: 8 }}>
        <Pill tone="red">critical {tasks.filter((x) => x.pri === 'critical').length}</Pill>
        <Pill tone="amber">at gate {tasks.filter((x) => x.col === 'gate').length}</Pill>
        <Pill tone="purple">waiting {tasks.filter((x) => x.col === 'wait').length}</Pill>
        <Pill tone="blue">in progress {tasks.filter((x) => x.col === 'doing').length}</Pill>
      </div>
      <div className="kanban">
        {COLS.map(([k, label]) => (
          <div key={k} className="kcol">
            <h4>{label}<span className="badge-soft">{tasks.filter((x) => x.col === k).length}</span></h4>
            {tasks.filter((x) => x.col === k).map((x) => (
              <div key={x.id} className="kc" onClick={() => setSel(x.id)}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{x.title}</div>
                <div className="row" style={{ marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
                  <Avatar name={x.owner} size="sm" /><span className="muted" style={{ fontSize: 11 }}>{x.owner}</span>
                  <Pill tone={priTone(x.pri)}>{x.pri}</Pill>{x.gate && <Pill tone="amber">gate</Pill>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {t && (
        <Modal title={t.title} onClose={() => setSel(null)}>
          <div className="row" style={{ gap: 8 }}><Pill tone={priTone(t.pri)}>{t.pri}</Pill><Pill tone="blue">{t.col}</Pill>{t.gate && <Pill tone="amber">at gate</Pill>}</div>
          <SectionTitle>Owner</SectionTitle>
          <div className="row"><Avatar name={t.owner} size="sm" /> {t.owner} <span className="muted" style={{ fontSize: 12 }}>({t.ownerType === 'ai' ? 'AI employee' : 'person'})</span></div>
          <SectionTitle>Provenance</SectionTitle>
          <Card className="pad" style={{ fontSize: 12.5 }}><span className="muted">Source:</span> meeting · 2026-06-19 standup<br /><i className="slate">“Chase anything past 30 days before month-end.”</i></Card>
          {t.gate && (
            <div className="note amber" style={{ marginTop: 14, flexDirection: 'column', alignItems: 'flex-start' }}>
              <b>Human gate</b><span style={{ marginTop: 4 }}>AI proposed this step — irreversible push. Commit to proceed.</span>
              <div className="row" style={{ marginTop: 10, gap: 8 }}><button className="btn primary sm" onClick={() => setSel(null)}>Commit</button><button className="btn sm">Edit</button><button className="btn danger sm" onClick={() => setSel(null)}>Dismiss</button></div>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

export function Approvals({ toast }) {
  const [list, setList] = useState(approvals)
  const decide = (id, act) => { setList((l) => l.filter((a) => a.id !== id)); toast(act === 'approve' ? 'Approved & committed — audit row written' : 'Rejected — proposer notified') }
  return (
    <>
      <p className="lead"><b>Human gates</b> — “AI proposes, a human commits.” Lifecycle gates (deploy, decommission, autonomy, budget) plus per-step workflow proposals queue here.</p>
      <div style={{ marginTop: 18 }}>
        {list.map((a) => (
          <Card key={a.id} className="pad" style={{ marginBottom: 14 }}>
            <div className="between">
              <div className="row"><Pill tone="amber">{a.type.replace('_', ' ')}</Pill><Pill tone={a.risk === 'high' ? 'red' : a.risk === 'low' ? 'gray' : 'blue'}>{a.risk} risk</Pill><span className="tag">{a.dept}</span></div>
              <div className="row"><Avatar name={a.emp} size="sm" /><span className="muted" style={{ fontSize: 12 }}>{a.emp}</span></div>
            </div>
            <h3 style={{ marginTop: 10 }}>{a.title}</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{a.why}</p>
            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <button className="btn primary" onClick={() => decide(a.id, 'approve')}><Check size={15} /> Approve & commit</button>
              <button className="btn danger" onClick={() => decide(a.id, 'reject')}><X size={15} /> Reject</button>
              <button className="btn ghost"><ScrollText size={15} /> Audit trail</button>
            </div>
          </Card>
        ))}
        {!list.length && <Empty icon={ShieldCheck} title="All clear">No gates waiting on a human right now.</Empty>}
      </div>
    </>
  )
}
