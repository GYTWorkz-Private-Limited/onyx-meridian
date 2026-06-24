import React, { useState } from 'react'
import {
  Building2, Bot, CircleDollarSign, Gauge, MessageSquare, Sparkles, ShieldCheck,
  ArrowRight, Send, CheckCircle2, Clock, ListChecks, Inbox as InboxIcon, CornerDownRight,
} from 'lucide-react'
import { departments, employees, approvals, activity, tasks, questions, myAnswers } from '../data/store.js'
import { Card, Stat, Pill, Bar, SectionTitle, Avatar, priTone, statusTone, Empty } from '../components/ui.jsx'

const LOOP = [
  { t: 'Communicate', d: 'Ask what to do; answer from context', tone: 'blue', icon: MessageSquare },
  { t: 'Pick workflow', d: 'Match intent to a gated workflow', tone: 'purple', icon: Sparkles },
  { t: 'Run task', d: 'Deterministic · policy · AI agent', tone: 'teal', icon: Bot },
  { t: 'Pull / push', d: 'Move data via connectors', tone: 'amber', icon: ArrowRight },
  { t: 'Gate & meter', d: 'Human commits · cost metered', tone: 'green', icon: ShieldCheck },
]

export function Dashboard({ go }) {
  return (
    <>
      <div className="grid g4">
        <Stat icon={Building2} tone="blue" label="Departments live" value="5" sub="+1 onboarding" />
        <Stat icon={Bot} tone="purple" label="AI employees" value="8" sub="6 deployed · 1 paused · 1 draft" />
        <Stat icon={CircleDollarSign} tone="green" label="Spend this month" value="$2,672" sub="of $7,400 budget" />
        <Stat icon={Gauge} tone="amber" label="Avg effectiveness" value="4.1×" sub="vs human baseline" />
      </div>

      <SectionTitle>The operating loop</SectionTitle>
      <Card className="pad">
        <div className="between wrap" style={{ gap: 10 }}>
          {LOOP.map((s, i) => (
            <React.Fragment key={s.t}>
              <div style={{ textAlign: 'center', flex: 1, minWidth: 120 }}>
                <div className={`ic l ${s.tone}`} style={{ margin: '0 auto 9px' }}><s.icon /></div>
                <div style={{ fontWeight: 700 }}>{s.t}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{s.d}</div>
              </div>
              {i < LOOP.length - 1 && <ArrowRight size={20} color="var(--faint)" />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="grid g23" style={{ marginTop: 18 }}>
        <Card className="pad">
          <div className="between"><h3>Departments</h3><span className="muted" style={{ fontSize: 12 }}>budget utilisation</span></div>
          <div style={{ marginTop: 14 }}>
            {departments.map((d) => (
              <div key={d.id} className="between" style={{ padding: '11px 8px', borderRadius: 10, cursor: 'pointer' }} onClick={() => go('departments')}>
                <div style={{ minWidth: 170 }}>
                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{d.employees} employees · {d.workflows} workflows</div>
                </div>
                <div style={{ flex: 1, maxWidth: 230 }}><Bar value={d.budget ? (d.spent / d.budget) * 100 : 0} /></div>
                <div style={{ width: 120, textAlign: 'right', fontSize: 12 }}><b>${d.spent}</b> <span className="muted">/ ${d.budget}</span></div>
                <Pill tone={statusTone(d.status)}>{d.status}</Pill>
              </div>
            ))}
          </div>
        </Card>
        <Card className="pad">
          <div className="between"><h3>Pending gates</h3><span className="badge-soft">{approvals.length}</span></div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>AI proposes — a human commits.</p>
          <div style={{ marginTop: 10 }}>
            {approvals.slice(0, 4).map((a) => (
              <Card key={a.id} className="click" style={{ padding: 12, marginBottom: 9 }} onClick={() => go('approvals')}>
                <div className="between"><Pill tone="amber">{a.type.replace('_', ' ')}</Pill><Pill tone={a.risk === 'high' ? 'red' : 'blue'}>{a.risk} risk</Pill></div>
                <div style={{ fontWeight: 600, marginTop: 8, fontSize: 13 }}>{a.title}</div>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      <SectionTitle>Live activity</SectionTitle>
      <Card className="pad">
        {activity.map((a, i) => (
          <div key={i} className="dotline">
            <Avatar name={a.who} size="sm" />
            <div><b>{a.who}</b> {a.what}</div>
            <div className="spacer" />
            <Pill tone={a.tone}>{a.when}</Pill>
          </div>
        ))}
      </Card>
    </>
  )
}

export function MyWork({ user }) {
  const mine = tasks.filter((t) => t.assignedToMe)
  const cols = [['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']]
  return (
    <>
      <p className="lead">Work the AI workforce has delegated to you, plus anything you own. AI employees assign tasks to real people when they need a decision or an action only a human can take.</p>
      <div className="grid g4" style={{ marginTop: 18 }}>
        <Stat icon={ListChecks} tone="blue" label="Assigned to me" value={mine.length} sub="by AI employees" />
        <Stat icon={Clock} tone="amber" label="Due today" value="2" sub="1 high priority" />
        <Stat icon={MessageSquare} tone="purple" label="Questions for me" value={questions.filter((q) => q.status === 'open').length} sub="awaiting my answer" />
        <Stat icon={CheckCircle2} tone="green" label="Completed this week" value="9" sub="+3 vs last week" />
      </div>
      <SectionTitle>My tasks</SectionTitle>
      <div className="grid g3">
        {cols.map(([k, label]) => (
          <Card key={k} className="pad" style={{ background: 'var(--surface-2)' }}>
            <div className="between" style={{ marginBottom: 10 }}><h4>{label}</h4><span className="badge-soft">{mine.filter((t) => t.col === k).length}</span></div>
            {mine.filter((t) => t.col === k).map((t) => (
              <Card key={t.id} style={{ padding: 12, marginBottom: 9 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
                <div className="row" style={{ marginTop: 9, gap: 8 }}>
                  {t.from && <span className="tag"><CornerDownRight size={12} style={{ marginRight: 4 }} />from {t.from}</span>}
                  <Pill tone={priTone(t.pri)}>{t.pri}</Pill>
                </div>
              </Card>
            ))}
            {!mine.filter((t) => t.col === k).length && <p className="muted" style={{ fontSize: 12.5 }}>Nothing here.</p>}
          </Card>
        ))}
      </div>
    </>
  )
}

export function Inbox({ toast }) {
  const [tab, setTab] = useState('questions')
  const [chat, setChat] = useState([
    { who: 'Ada', me: false, text: 'Morning! I have 3 reminders queued for overdue invoices. Want me to send them, or hold any?' },
  ])
  const [draft, setDraft] = useState('')
  const open = questions.filter((q) => q.status === 'open')

  const send = () => {
    if (!draft.trim()) return
    setChat((c) => [...c, { who: 'me', me: true, text: draft }, { who: 'Ada', me: false, text: 'Got it — I’ll proceed and flag anything that needs your sign-off at a gate.' }])
    setDraft('')
  }

  return (
    <>
      <p className="lead">Two-way communication with the AI workforce: answer the questions employees raise for you, and ask them anything — a reactive workflow runs behind each request.</p>
      <div className="seg" style={{ marginTop: 16 }}>
        <button className={tab === 'questions' ? 'on' : ''} onClick={() => setTab('questions')}>Questions for me ({open.length})</button>
        <button className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')}>Ask an AI employee</button>
        <button className={tab === 'answers' ? 'on' : ''} onClick={() => setTab('answers')}>My answers</button>
      </div>

      {tab === 'questions' && (
        <div style={{ marginTop: 18 }}>
          {open.map((q) => (
            <Card key={q.id} className="pad" style={{ marginBottom: 12 }}>
              <div className="between">
                <div className="row"><Avatar name={q.from} size="md" /><div><b>{q.from}</b> <span className="muted">asks</span><div className="muted" style={{ fontSize: 12 }}>{q.ctx} · {q.age} ago</div></div></div>
                <Pill tone="amber">open</Pill>
              </div>
              <p style={{ marginTop: 12, fontWeight: 600 }}>{q.q}</p>
              <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <input className="searchbox" style={{ flex: 1, width: 'auto' }} placeholder="Type your answer…" />
                <button className="btn primary" onClick={() => toast('Answer sent to ' + q.from)}><Send size={15} /> Answer</button>
                <button className="btn">Reassign</button>
              </div>
            </Card>
          ))}
          {!open.length && <Empty icon={InboxIcon} title="Inbox zero">No questions waiting on you.</Empty>}
        </div>
      )}

      {tab === 'chat' && (
        <Card className="pad" style={{ marginTop: 18, maxWidth: 720 }}>
          <div className="row" style={{ paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
            <Avatar name="Ada" size="md" /><div><b>Ada — AR Clerk</b><div className="muted" style={{ fontSize: 12 }}>Finance & Invoicing · ♥ online</div></div>
          </div>
          <div style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chat.map((m, i) => (
              <div key={i} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                <div style={{ background: m.me ? 'var(--grad-blue)' : 'var(--surface-2)', color: m.me ? '#fff' : 'var(--ink)', padding: '10px 14px', borderRadius: 14, border: m.me ? 0 : '1px solid var(--line)', fontSize: 13.5 }}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <input className="searchbox" style={{ flex: 1, width: 'auto' }} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask Ada to do something…" />
            <button className="btn primary" onClick={send}><Send size={15} /> Send</button>
          </div>
        </Card>
      )}

      {tab === 'answers' && (
        <div style={{ marginTop: 18 }}>
          {myAnswers.map((a) => (
            <Card key={a.id} className="pad" style={{ marginBottom: 10 }}>
              <div className="between"><div className="muted" style={{ fontSize: 12 }}>To {a.to} · {a.age}</div><Pill tone="green">answered</Pill></div>
              <div style={{ marginTop: 6 }}><span className="muted">Q:</span> {a.q}</div>
              <div style={{ marginTop: 3 }}><span className="muted">A:</span> <b>{a.a}</b></div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
