import React, { useState } from 'react'
import {
  Sparkles, FileText, Workflow as WFIcon, Cable, Share2, Check, Database, Zap,
  GitBranch, Plug, RefreshCw, CircleDot, ArrowRight,
} from 'lucide-react'
import { connectors, connections, workflows, KG_STATS, KG_CATEGORIES } from '../data/store.js'
import { Card, Stat, Pill, Bar, SectionTitle, statusTone, Empty } from '../components/ui.jsx'
import KnowledgeGraph from '../components/KnowledgeGraph.jsx'

const PHASES = [
  ['Intake & inventory', 'Catalogue handed documents (SOPs, org chart, 3 meetings) and probe wired connections; raise intake questions.', '14 documents · 4 connections · 3 intake questions'],
  ['Domain discovery', 'Derive entities + sanctioned edges from docs and a sampling pull. Seeds the knowledge graph.', 'Customer, Invoice, Payment, Dispute · 6 edges'],
  ['Process decomposition', 'Mine units of work; dedupe; map to business units.', '17 units of work · grouped into AR & AP'],
  ['Workflow synthesis', 'Order units of work into DAGs; insert human gates at every commitment.', '5 candidate workflows · 7 gates proposed'],
  ['Connector binding', 'Bind connectors from the repository; queue research build for missing platforms.', 'netsuite.erp bound · gmail.comms → extraction queued'],
  ['Cost & effectiveness', 'Estimate AI-decide + AI-do + integration cost per task.', 'Est. $0.0035/task · 4.1× vs human'],
  ['Process Spec + review gate', 'Emit one reviewable, fully-cited spec. Stop. Await human approval.', 'fis.process-spec.yaml ready'],
  ['Materialize', 'On approval: create units, archetypes, workflows, connections; provision employees.', 'awaiting approval'],
]

export function Onboarding({ toast }) {
  const [run, setRun] = useState(-1) // -1 idle, n current phase, 99 done
  const [busy, setBusy] = useState(false)
  const start = () => {
    if (busy) return; setBusy(true); let i = 0
    const tick = () => { setRun(i); i++; if (i <= PHASES.length) setTimeout(tick, 720); else { setRun(99); setBusy(false) } }
    tick()
  }
  const done = (n) => run === 99 || run > n
  return (
    <>
      <p className="lead">The <b>discovery agent</b> explores the documents you hand it <i>and</i> the connections you’ve wired, then proposes a full operating model — units of work, gated workflows, connector bindings, and a cost model. <b>Nothing is materialized until you approve the Process Spec.</b></p>
      <div className="grid g23" style={{ marginTop: 18 }}>
        <Card className="pad">
          <div className="between"><h3>Discovery run — Finance & Invoicing</h3><button className="btn primary" disabled={busy} onClick={start}><Sparkles size={15} /> {busy ? 'Running…' : run === 99 ? 'Re-run' : 'Run discovery'}</button></div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Spec-first · every fact cited · <span className="kbd">UNVERIFIED</span> by default.</p>
          <div style={{ marginTop: 16 }}>
            {PHASES.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 0', borderBottom: i < PHASES.length - 1 ? '1px dashed var(--line)' : 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13,
                  background: done(i) ? 'var(--green)' : run === i ? 'var(--blue-600)' : 'var(--surface-2)',
                  color: done(i) || run === i ? '#fff' : 'var(--muted)', border: done(i) || run === i ? 0 : '2px solid var(--line)',
                  animation: run === i ? 'pulse 1.2s infinite' : 'none' }}>{done(i) ? <Check size={15} /> : i}</div>
                <div>
                  <h4>{p[0]}</h4><p className="muted" style={{ fontSize: 13, marginTop: 2 }}>{p[1]}</p>
                  {done(i) && <div style={{ marginTop: 7, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ {p[2]}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div>
          <Card className="pad">
            <h3>Inputs</h3>
            <SectionTitle>Documents</SectionTitle>
            {['SOP — Collections.pdf', 'Org chart.png', 'AR policy v3.docx', '3 recorded meetings', 'Dispute handling.md'].map((f) => (
              <div key={f} className="row" style={{ gap: 9, padding: '5px 0' }}><span className="ic s blue" style={{ width: 28, height: 28 }}><FileText size={15} /></span><span style={{ fontSize: 13 }}>{f}</span></div>
            ))}
            <SectionTitle>Connections</SectionTitle>
            {connections.slice(0, 3).map((c) => <div key={c.id} className="between" style={{ padding: '4px 0' }}><span className="tag code">{c.key}</span><Pill tone={statusTone(c.liveness)}>{c.liveness}</Pill></div>)}
          </Card>
          <Card className="pad" style={{ marginTop: 18 }}>
            <h3>Completeness critique</h3>
            <p className="muted" style={{ fontSize: 12.5 }}>What the agent could not determine becomes an intake question or expert task.</p>
            <div style={{ marginTop: 8 }}>
              {['Day-60 escalation owner unconfirmed → intake question', 'gmail.comms connector missing → research queued', 'netsuite cursor mechanics UNVERIFIED'].map((x) => (
                <div key={x} className="row" style={{ gap: 9, padding: '6px 0', fontSize: 12.5 }}><span className="sw" style={{ background: 'var(--amber)' }} />{x}</div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {run === 99 && (
        <Card className="pad" style={{ marginTop: 18 }}>
          <div className="between"><h3>Process Spec — review gate</h3><Pill tone="amber">proposed</Pill></div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>One reviewable artifact. Edit or approve — then it materializes into Meridian.</p>
          <pre style={{ background: 'var(--ink)', color: '#cfe0ff', borderRadius: 12, padding: 18, overflow: 'auto', fontSize: 12, lineHeight: 1.55, marginTop: 12, fontFamily: 'JetBrains Mono, monospace' }}>{`department: "Finance & Invoicing"
status: proposed
units:
  - name: "Accounts Receivable"
    allowed_scopes: ["invoice:read","invoice:write","customer:read"]
units_of_work:
  - id: uow-001
    title: "Send overdue-invoice reminder"
    execution_mode: workflow_policy
    trigger: {type: schedule, cadence: "daily"}
    connectors: ["netsuite.erp","gmail.comms"]
    cost: {ai_decide_usd: 0.002, ai_do_usd: 0.001, integration_usd: 0.0005}
    effectiveness: {metric: time_to_execute, human_baseline_min: 6}
    confidence: 0.82
    source: {type: pdf, doc_id: d12, quote: "AR sends a reminder at day 30…"}
workflows:
  - id: wf-collections
    steps: [uow-001, uow-002, uow-003]
    gates: [{after: uow-002, type: proposal, reason: "before legal escalation"}]`}</pre>
          <div className="row" style={{ marginTop: 14, gap: 10 }}>
            <button className="btn primary" onClick={() => toast('Approved — materializing units, archetypes & workflows')}><Check size={15} /> Approve & materialize</button>
            <button className="btn">Edit spec</button><button className="btn ghost">Request changes</button>
          </div>
        </Card>
      )}
    </>
  )
}

const TAG_TONE = { 'read-only': 'green', 'read-write': 'blue', 'read-write-update': 'amber', variety: 'purple' }
export function Workflows() {
  return (
    <>
      <p className="lead">A <b>workflow</b> is units of work composed into a DAG with <b>human gates</b> wherever there’s a commitment, an irreversible push, or a spend. Each is tagged by operation profile and by how an employee invokes it.</p>
      <Card className="pad" style={{ marginTop: 18 }}>
        <div className="between"><div className="row"><div className="ic s blue"><WFIcon /></div><h3>Overdue collections — Finance & Invoicing</h3></div><div className="row"><Pill tone="blue">durable</Pill><Pill tone="teal">reversible</Pill></div></div>
        <div className="scroll-x" style={{ marginTop: 14 }}>
          <div className="row" style={{ gap: 0, minWidth: 760 }}>
            {[['Detect overdue', 'teal'], ['Draft reminder', 'blue'], ['Send email', 'teal'], ['Gate: escalate?', 'amber'], ['Open dispute', 'blue']].map((s, i, arr) => (
              <React.Fragment key={i}>
                <div style={{ minWidth: 140, border: `2px solid var(--${s[1] === 'teal' ? 'teal' : s[1] === 'amber' ? 'amber' : 'blue-600'})`, borderRadius: 12, padding: '12px 14px', background: '#fff', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, borderRadius: '12px 0 0 12px', background: `var(--${s[1] === 'teal' ? 'teal' : s[1] === 'amber' ? 'amber' : 'blue-600'})` }} />
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{s[0].replace('Gate: ', '')}</div>
                  <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>{i === 3 ? 'human commits' : 'step ' + (i + 1)}</div>
                </div>
                {i < arr.length - 1 && <ArrowRight size={18} color="var(--faint)" style={{ margin: '0 6px', flex: 'none' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="legend" style={{ marginTop: 14 }}>
          <span><span className="sw" style={{ background: 'var(--blue-600)' }} /> AI agent step</span>
          <span><span className="sw" style={{ background: 'var(--teal)' }} /> workflow + policy</span>
          <span><span className="sw" style={{ background: 'var(--amber)' }} /> human gate</span>
        </div>
      </Card>

      <SectionTitle>All workflows</SectionTitle>
      <Card><div className="tbl-wrap"><table>
        <thead><tr><th>Workflow</th><th>Department</th><th>Steps</th><th>Gates</th><th>Operation tag</th><th>Mode</th><th>Runs/mo</th><th>Avg cost</th></tr></thead>
        <tbody>
          {workflows.map((w) => (
            <tr key={w.id} className="hov">
              <td><b>{w.name}</b></td><td>{w.dept}</td><td>{w.steps}</td>
              <td>{w.gates ? <span className="badge-soft">{w.gates} gate{w.gates > 1 ? 's' : ''}</span> : <span className="muted">—</span>}</td>
              <td><Pill tone={TAG_TONE[w.tag]}>{w.tag}</Pill></td>
              <td><Pill tone={w.mode === 'proactive' ? 'teal' : 'purple'}>{w.mode}</Pill></td>
              <td>{w.runs}</td><td>{w.cost}</td>
            </tr>
          ))}
        </tbody>
      </table></div></Card>
    </>
  )
}

export function Connectors({ toast }) {
  return (
    <>
      <p className="lead">The <b>connector repository</b> is the integration spine — a standardized pull/push contract per <span className="kbd">&lt;platform&gt;.&lt;domain&gt;</span>. Configured connections feed each department’s knowledge graph; missing connectors are built by the research-mode agents.</p>
      <div className="grid g4" style={{ marginTop: 18 }}>
        <Stat icon={Plug} tone="blue" label="Connectors" value={connectors.length} sub={`${connectors.filter((c) => c.status === 'complete').length} complete`} />
        <Stat icon={FileText} tone="amber" label="Research-derived" value={connectors.filter((c) => c.status === 'research_derived').length} sub="pending doc-verify" />
        <Stat icon={Cable} tone="green" label="Live connections" value={connections.filter((c) => c.liveness === 'alive').length} sub={`${connections.length} configured`} />
        <Stat icon={Database} tone="purple" label="Pulls today" value="53.8k" sub="feeding knowledge graph" />
      </div>

      <SectionTitle>Connector repository</SectionTitle>
      <Card><div className="tbl-wrap"><table>
        <thead><tr><th>Connector</th><th>Platform</th><th>Domain</th><th>Auth</th><th>Ops</th><th>Used by</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {connectors.map((c) => (
            <tr key={c.key} className="hov">
              <td><span className="tag code">{c.key}</span></td><td>{c.platform}</td><td>{c.domain}</td>
              <td className="muted">{c.auth}</td><td className="muted" style={{ fontSize: 12 }}>{c.ops}</td><td>{c.used} tasks</td>
              <td><Pill tone={statusTone(c.status)}>{c.status.replace('_', ' ')}</Pill></td>
              <td>
                {c.status === 'incomplete' ? <button className="btn sm primary" onClick={() => toast(`Extraction agent queued for ${c.platform} — deep-research → builder`)}>Build</button>
                  : c.status === 'research_derived' ? <button className="btn sm" onClick={() => toast(`Verifying ${c.key} against live docs`)}>Verify</button>
                    : <button className="btn sm">Configure</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></Card>

      <SectionTitle>Configured connections → knowledge feed</SectionTitle>
      <div className="grid g3">
        {connections.map((c) => (
          <Card key={c.id} className="pad">
            <div className="between"><span className="tag code">{c.key}</span><Pill tone={statusTone(c.liveness)}>{c.liveness.replace('_', ' ')}</Pill></div>
            <h4 style={{ marginTop: 10 }}>{c.name}</h4>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{c.dept}</div>
            <div className="divider" />
            <div className="between" style={{ fontSize: 12 }}><span className="muted"><RefreshCw size={12} style={{ verticalAlign: -2 }} /> synced {c.synced}</span><span className="muted">{c.pulls.toLocaleString()} pulls</span></div>
          </Card>
        ))}
      </div>
      <div className="note" style={{ marginTop: 16 }}><Zap size={16} style={{ flex: 'none' }} /><span>Each pull adds to the department’s knowledge graph, so it stays current. Freshness shows as <b>alive / stale / never-run</b>.</span></div>
    </>
  )
}

export function Knowledge() {
  return (
    <>
      <p className="lead">The department <b>knowledge graph</b> — entities and the sanctioned edges between them, continuously fed by connections. Workflows consume it; agents may only traverse sanctioned edges. Drag to pan, scroll to zoom, click a node to trace its relationships.</p>
      <div className="grid g4" style={{ margin: '18px 0' }}>
        <Stat icon={Share2} tone="blue" label="Nodes" value={KG_STATS.nodes} sub={`${KG_STATS.categories} entity types`} />
        <Stat icon={GitBranch} tone="purple" label="Relationships" value={KG_STATS.edges} sub="sanctioned + observed" />
        <Stat icon={Cable} tone="teal" label="Feeding connections" value={connections.length} sub={`${connections.filter((c) => c.liveness === 'alive').length} live`} />
        <Stat icon={CircleDot} tone="amber" label="Knowledge misses" value="1" sub="routed to expert" />
      </div>
      <KnowledgeGraph />
      <div className="note" style={{ marginTop: 16 }}><Sparkles size={16} style={{ flex: 'none' }} /><span>Solid edges are sanctioned for automation traversal; an agent proposing a path off-graph is blocked. When the graph can’t answer, a knowledge-miss task is auto-created for a domain expert.</span></div>
    </>
  )
}
