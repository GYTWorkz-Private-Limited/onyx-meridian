// ============================================================================
// Stubbed data for the Onyx Meridian prototype.
// Deterministic (seeded RNG) so the knowledge-graph layout is stable.
// ============================================================================

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260623)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1))

// ---------------------------------------------------------------- roles -----
export const ROLES = {
  member: { key: 'member', label: 'Department Member', short: 'Member', color: '#0d9488' },
  head: { key: 'head', label: 'Department Head', short: 'Head', color: '#2563eb' },
  admin: { key: 'admin', label: 'Admin', short: 'Admin', color: '#7c3aed' },
}
export const USERS = [
  { id: 'u-aanya', name: 'Aanya Sharma', role: 'member', dept: 'Finance & Invoicing', title: 'AR Analyst', initials: 'AS' },
  { id: 'u-rao', name: 'Vikram Rao', role: 'head', dept: 'Finance & Invoicing', title: 'Head of Finance', initials: 'VR' },
  { id: 'u-hari', name: 'Hari Gyt', role: 'admin', dept: 'Platform', title: 'Workspace Admin', initials: 'HG' },
]

// ---------------------------------------------------------------- depts -----
export const departments = [
  { id: 'fis', name: 'Finance & Invoicing', status: 'active', employees: 2, workflows: 5, budget: 1800, spent: 642, eff: '4.1×', caretaker: 'Vikram Rao', units: ['Accounts Receivable', 'Accounts Payable'], scopes: ['invoice:read', 'invoice:write', 'customer:read', 'payment:write'] },
  { id: 'ops', name: 'Operations', status: 'active', employees: 1, workflows: 4, budget: 1500, spent: 410, eff: '3.6×', caretaker: 'Lena Ortiz', units: ['Service Delivery'], scopes: ['job:read', 'job:write', 'sla:read'] },
  { id: 'cs', name: 'Customer Service', status: 'active', employees: 2, workflows: 6, budget: 2000, spent: 1180, eff: '5.2×', caretaker: 'Mei Lin', units: ['Support', 'Onboarding'], scopes: ['ticket:read', 'ticket:write', 'customer:read'] },
  { id: 'mkt', name: 'Marketing', status: 'active', employees: 1, workflows: 3, budget: 1200, spent: 300, eff: '2.9×', caretaker: 'Tom Reyes', units: ['Demand Gen'], scopes: ['lead:read', 'lead:write'] },
  { id: 'legal', name: 'Legal', status: 'active', employees: 1, workflows: 2, budget: 900, spent: 140, eff: '3.1×', caretaker: 'Priya N.', units: ['Contracts'], scopes: ['contract:read', 'contract:write'] },
  { id: 'proj', name: 'Projects', status: 'onboarding', employees: 0, workflows: 0, budget: 0, spent: 0, eff: '—', caretaker: '—', units: [], scopes: [] },
]

// ------------------------------------------------------------ employees -----
export const employees = [
  { id: 'e1', name: 'Ada', role: 'AR Clerk', archetype: 'fis.ar_clerk', dept: 'Finance & Invoicing', tier: 'T1', status: 'deployed', autonomy: 'supervised', wip: [2, 3], spent: 312, budget: 900, eff: '4.1×', hb: '12s ago',
    resp: ['Chase overdue invoices', 'Reconcile payments', 'Flag disputes for review'], kpis: ['Days-sales-outstanding', 'Collection rate'],
    workflows: ['Overdue collections', 'Payment reconciliation'], connectors: ['netsuite.erp', 'gmail.comms'], sched: 'Daily 07:00 · hourly sweep' },
  { id: 'e2', name: 'Boon', role: 'AP Specialist', archetype: 'fis.ap_specialist', dept: 'Finance & Invoicing', tier: 'T1', status: 'deployed', autonomy: 'assist', wip: [1, 2], spent: 330, budget: 900, eff: '3.8×', hb: '40s ago',
    resp: ['Match POs to invoices', 'Schedule approved payments'], kpis: ['On-time payment %', 'Match accuracy'],
    workflows: ['3-way match', 'Payment run'], connectors: ['netsuite.erp'], sched: 'Twice daily' },
  { id: 'e3', name: 'Cleo', role: 'Support Triage', archetype: 'cs.triage', dept: 'Customer Service', tier: 'T2', status: 'deployed', autonomy: 'autonomous', wip: [4, 6], spent: 780, budget: 1200, eff: '5.2×', hb: '3s ago',
    resp: ['Classify tickets', 'Draft first responses', 'Escalate at-risk accounts'], kpis: ['First-response time', 'CSAT'],
    workflows: ['Ticket triage', 'Escalation routing', 'KB answer'], connectors: ['salesforce.crm', 'gmail.comms'], sched: 'Continuous heartbeat' },
  { id: 'e4', name: 'Dex', role: 'Onboarding Guide', archetype: 'cs.onboarding', dept: 'Customer Service', tier: 'T2', status: 'deployed', autonomy: 'supervised', wip: [2, 4], spent: 400, budget: 800, eff: '4.6×', hb: '1m ago',
    resp: ['Drive activation checklist', 'Schedule kickoff'], kpis: ['Time-to-activation'],
    workflows: ['Activation checklist'], connectors: ['hubspot.crm'], sched: 'Weekdays 09:00' },
  { id: 'e5', name: 'Eli', role: 'Demand Gen', archetype: 'mkt.demandgen', dept: 'Marketing', tier: 'T2', status: 'deployed', autonomy: 'assist', wip: [1, 3], spent: 300, budget: 1200, eff: '2.9×', hb: '5m ago',
    resp: ['Score inbound leads', 'Draft nurture sequences'], kpis: ['MQL→SQL rate'],
    workflows: ['Lead scoring'], connectors: ['hubspot.crm'], sched: 'Hourly' },
  { id: 'e6', name: 'Faye', role: 'Contract Reviewer', archetype: 'legal.contracts', dept: 'Legal', tier: 'T3', status: 'deployed', autonomy: 'shadow', wip: [0, 1], spent: 140, budget: 900, eff: '3.1×', hb: '8m ago',
    resp: ['Redline standard clauses', 'Flag non-standard terms'], kpis: ['Review turnaround'],
    workflows: ['Clause review'], connectors: ['salesforce.crm'], sched: 'On demand' },
  { id: 'e7', name: 'Gus', role: 'Service Ops', archetype: 'ops.delivery', dept: 'Operations', tier: 'T2', status: 'suspended', autonomy: 'supervised', wip: [0, 3], spent: 410, budget: 1500, eff: '3.6×', hb: '2h ago',
    resp: ['Track SLAs', 'Auto-assign jobs'], kpis: ['SLA adherence'],
    workflows: ['SLA watch', 'Job assignment'], connectors: ['salesforce.crm'], sched: 'Paused — budget review' },
  { id: 'e8', name: 'Hana', role: 'Projects PM', archetype: 'proj.pm', dept: 'Projects', tier: 'T3', status: 'draft', autonomy: 'shadow', wip: [0, 2], spent: 0, budget: 700, eff: '—', hb: 'never',
    resp: ['Track milestones', 'Chase deliverables'], kpis: ['On-time delivery'],
    workflows: [], connectors: [], sched: 'Pending deploy' },
]

// --------------------------------------------------------------- tasks ------
export const tasks = [
  { id: 't1', title: 'Send reminder — INV-4821 (30d overdue)', owner: 'Ada', ownerType: 'ai', col: 'doing', pri: 'high', gate: false, assignedToMe: false },
  { id: 't2', title: 'Escalate INV-4733 to collections', owner: 'Ada', ownerType: 'ai', col: 'gate', pri: 'critical', gate: true, assignedToMe: false },
  { id: 't3', title: 'Confirm write-off threshold for ACME dispute', owner: 'Aanya Sharma', ownerType: 'person', col: 'todo', pri: 'medium', gate: false, assignedToMe: true, from: 'Ada' },
  { id: 't4', title: '3-way match: PO-991 vs INV-220', owner: 'Boon', ownerType: 'ai', col: 'doing', pri: 'medium', gate: false, assignedToMe: false },
  { id: 't5', title: 'Triage ticket #88210 — outage', owner: 'Cleo', ownerType: 'ai', col: 'doing', pri: 'critical', gate: false, assignedToMe: false },
  { id: 't6', title: 'Draft KB answer — SSO setup', owner: 'Cleo', ownerType: 'ai', col: 'done', pri: 'low', gate: false, assignedToMe: false },
  { id: 't7', title: 'Approve payment run (14 invoices)', owner: 'Boon', ownerType: 'ai', col: 'gate', pri: 'high', gate: true, assignedToMe: false },
  { id: 't8', title: 'Score 32 inbound leads', owner: 'Eli', ownerType: 'ai', col: 'todo', pri: 'medium', gate: false, assignedToMe: false },
  { id: 't9', title: 'Verify customer VAT id — Northwind', owner: 'Aanya Sharma', ownerType: 'person', col: 'doing', pri: 'high', gate: false, assignedToMe: true, from: 'Ada' },
  { id: 't10', title: 'Redline MSA — Globex', owner: 'Faye', ownerType: 'ai', col: 'wait', pri: 'high', gate: false, assignedToMe: false },
  { id: 't11', title: 'Reminder sent — INV-4799', owner: 'Ada', ownerType: 'ai', col: 'done', pri: 'low', gate: false, assignedToMe: false },
  { id: 't12', title: 'Provide Q2 revenue split for board pack', owner: 'Aanya Sharma', ownerType: 'person', col: 'done', pri: 'medium', gate: false, assignedToMe: true, from: 'Ada' },
]

// ----------------------------------------------------------- connectors -----
export const connectors = [
  { key: 'salesforce.crm', platform: 'Salesforce', domain: 'CRM', status: 'complete', auth: 'OAuth2 bearer', used: 4, ops: 'pull · push · upsert' },
  { key: 'hubspot.crm', platform: 'HubSpot', domain: 'CRM', status: 'complete', auth: 'Private-app token', used: 2, ops: 'pull · push · upsert' },
  { key: 'netsuite.erp', platform: 'NetSuite', domain: 'ERP', status: 'complete', auth: 'TBA OAuth1', used: 3, ops: 'pull · push' },
  { key: 'zoho.crm', platform: 'Zoho', domain: 'CRM', status: 'research_derived', auth: 'Zoho OAuth', used: 1, ops: 'pull · push (unverified)' },
  { key: 'workday.hr', platform: 'Workday', domain: 'HR', status: 'research_derived', auth: 'OAuth2', used: 0, ops: 'pull (unverified)' },
  { key: 'gmail.comms', platform: 'Gmail', domain: 'Comms', status: 'incomplete', auth: 'OAuth2', used: 0, ops: '—' },
  { key: 'sap.erp', platform: 'SAP S/4HANA', domain: 'ERP', status: 'incomplete', auth: 'OAuth2', used: 0, ops: '—' },
  { key: 'stripe.finance', platform: 'Stripe', domain: 'Finance', status: 'complete', auth: 'API key', used: 1, ops: 'pull · push' },
  { key: 'slack.comms', platform: 'Slack', domain: 'Comms', status: 'complete', auth: 'Bot token', used: 2, ops: 'push' },
  { key: 'jira.delivery', platform: 'Jira', domain: 'Delivery', status: 'research_derived', auth: 'OAuth2', used: 0, ops: 'pull · push (unverified)' },
]
export const connections = [
  { id: 'cx1', key: 'netsuite.erp', dept: 'Finance & Invoicing', name: 'NetSuite — prod', liveness: 'alive', synced: '2m ago', pulls: 18400 },
  { id: 'cx2', key: 'stripe.finance', dept: 'Finance & Invoicing', name: 'Stripe — live', liveness: 'alive', synced: '40s ago', pulls: 9200 },
  { id: 'cx3', key: 'salesforce.crm', dept: 'Customer Service', name: 'Salesforce — support org', liveness: 'alive', synced: '5m ago', pulls: 22100 },
  { id: 'cx4', key: 'hubspot.crm', dept: 'Marketing', name: 'HubSpot — marketing', liveness: 'stale', synced: '6h ago', pulls: 4100 },
  { id: 'cx5', key: 'slack.comms', dept: 'Customer Service', name: 'Slack — #support', liveness: 'alive', synced: '1m ago', pulls: 0 },
  { id: 'cx6', key: 'zoho.crm', dept: 'Marketing', name: 'Zoho — trial', liveness: 'never_run', synced: 'never', pulls: 0 },
]

// ---------------------------------------------------------- approvals -------
export const approvals = [
  { id: 'a1', type: 'deploy', title: 'Deploy “Hana — Projects PM” into Projects', emp: 'Hana', dept: 'Projects', risk: 'medium', why: 'New AI employee, first deploy into an onboarding unit. Issues a scoped credential and starts in Shadow.' },
  { id: 'a2', type: 'budget_override', title: 'Budget override — Cleo exceeded $1,200/mo', emp: 'Cleo', dept: 'Customer Service', risk: 'high', why: 'Auto-suspended at the budget cap. Approve a one-month override to $1,500 or reduce cadence.' },
  { id: 'a3', type: 'autonomy_promote', title: 'Promote Ada: Supervised → Autonomous (collections)', emp: 'Ada', dept: 'Finance & Invoicing', risk: 'medium', why: 'Ensure eval passed — override rate 4%, 0 incidents over 30 days. Promotes one rung.' },
  { id: 'a4', type: 'workflow_proposal', title: 'Escalate INV-4733 to external collections', emp: 'Ada', dept: 'Finance & Invoicing', risk: 'high', why: 'AI proposes an irreversible push to the collections partner. A human must commit.' },
  { id: 'a5', type: 'schedule', title: 'Accept proposed cadence — Lead scoring hourly', emp: 'Eli', dept: 'Marketing', risk: 'low', why: 'Employee proposes running lead scoring hourly. Estimated +$58/mo.' },
]

// ---------------------------------------------------------- workflows -------
export const workflows = [
  { id: 'wf1', name: 'Overdue collections', dept: 'Finance & Invoicing', steps: 5, gates: 2, runs: 420, cost: '$0.004', tag: 'read-write', mode: 'reactive', status: 'active' },
  { id: 'wf2', name: 'Payment reconciliation', dept: 'Finance & Invoicing', steps: 3, gates: 1, runs: 180, cost: '$0.003', tag: 'read-write-update', mode: 'proactive', status: 'active' },
  { id: 'wf3', name: '3-way match', dept: 'Finance & Invoicing', steps: 4, gates: 1, runs: 640, cost: '$0.002', tag: 'read-only', mode: 'proactive', status: 'active' },
  { id: 'wf4', name: 'Ticket triage', dept: 'Customer Service', steps: 3, gates: 0, runs: 3200, cost: '$0.005', tag: 'read-write', mode: 'reactive', status: 'active' },
  { id: 'wf5', name: 'Escalation routing', dept: 'Customer Service', steps: 4, gates: 1, runs: 210, cost: '$0.006', tag: 'variety', mode: 'reactive', status: 'active' },
  { id: 'wf6', name: 'Lead scoring', dept: 'Marketing', steps: 2, gates: 0, runs: 960, cost: '$0.003', tag: 'read-only', mode: 'proactive', status: 'active' },
  { id: 'wf7', name: 'Clause review', dept: 'Legal', steps: 3, gates: 2, runs: 40, cost: '$0.05', tag: 'read-write', mode: 'reactive', status: 'active' },
  { id: 'wf8', name: 'Activation checklist', dept: 'Customer Service', steps: 6, gates: 1, runs: 120, cost: '$0.004', tag: 'read-write-update', mode: 'proactive', status: 'active' },
]

// --------------------------------------------------------- archetypes -------
export const archetypes = [
  { key: 'fis.ar_clerk', name: 'AR Clerk', tier: 'T1', caps: ['collections', 'reconciliation'] },
  { key: 'fis.ap_specialist', name: 'AP Specialist', tier: 'T1', caps: ['3-way-match', 'payment-run'] },
  { key: 'cs.triage', name: 'Support Triage', tier: 'T2', caps: ['classify', 'draft-reply', 'escalate'] },
  { key: 'cs.onboarding', name: 'Onboarding Guide', tier: 'T2', caps: ['activation', 'scheduling'] },
  { key: 'mkt.demandgen', name: 'Demand Gen', tier: 'T2', caps: ['lead-scoring', 'nurture'] },
  { key: 'legal.contracts', name: 'Contract Reviewer', tier: 'T3', caps: ['redline', 'risk-flag'] },
  { key: 'ops.delivery', name: 'Service Ops', tier: 'T2', caps: ['sla-watch', 'assignment'] },
  { key: 'proj.pm', name: 'Projects PM', tier: 'T3', caps: ['milestones', 'chasing'] },
]

// ------------------------------------------------- questions (member) -------
export const questions = [
  { id: 'q1', from: 'Ada', q: 'What is the agreed write-off threshold for the ACME dispute?', ctx: 'Collections workflow · INV-4733', age: '8m', status: 'open' },
  { id: 'q2', from: 'Ada', q: 'Is Northwind’s VAT id “GB429xxx” still current?', ctx: 'Reminder workflow · INV-4821', age: '22m', status: 'open' },
  { id: 'q3', from: 'Boon', q: 'Can I schedule the payment run for PO-991 before the 25th?', ctx: '3-way match', age: '1h', status: 'open' },
  { id: 'q4', from: 'Cleo', q: 'Should outage tickets auto-page the on-call engineer?', ctx: 'Escalation routing', age: '2h', status: 'answered' },
]
export const myAnswers = [
  { id: 'an1', to: 'Ada', q: 'Quarter-end cutoff date?', a: 'June 30, 23:59 GST.', age: 'yesterday' },
  { id: 'an2', to: 'Cleo', q: 'Is BigCorp a strategic account?', a: 'Yes — tier-1, route escalations to me.', age: '2 days ago' },
]

// ---------------------------------------------------------- activity --------
export const activity = [
  { who: 'Cleo', what: 'autonomously resolved ticket #88195', when: '3s ago', tone: 'purple' },
  { who: 'Ada', what: 'proposed escalation of INV-4733 — at gate', when: '2m ago', tone: 'amber' },
  { who: 'Boon', what: 'completed 3-way match PO-990', when: '6m ago', tone: 'green' },
  { who: 'Discovery Agent', what: 'emitted fis.process-spec.yaml for review', when: '18m ago', tone: 'blue' },
  { who: 'Gus', what: 'auto-suspended — budget review', when: '2h ago', tone: 'red' },
]

// ============================================================================
//  KNOWLEDGE GRAPH — 560+ nodes, ~1000 edges. Deterministic.
// ============================================================================
export const KG_CATEGORIES = [
  { key: 'organization', label: 'Organization', color: '#0b2552' },
  { key: 'department', label: 'Department', color: '#1746b0' },
  { key: 'customer', label: 'Customer', color: '#2563eb' },
  { key: 'lead', label: 'Lead', color: '#0891b2' },
  { key: 'invoice', label: 'Invoice', color: '#7c3aed' },
  { key: 'payment', label: 'Payment', color: '#15a34a' },
  { key: 'ticket', label: 'Ticket', color: '#d97706' },
  { key: 'contract', label: 'Contract', color: '#db2777' },
  { key: 'project', label: 'Project', color: '#0d9488' },
  { key: 'order', label: 'Order', color: '#4f46e5' },
  { key: 'product', label: 'Product', color: '#ca8a04' },
  { key: 'vendor', label: 'Vendor', color: '#9333ea' },
  { key: 'person', label: 'Person', color: '#dc2626' },
  { key: 'document', label: 'Document', color: '#64748b' },
  { key: 'asset', label: 'Asset', color: '#14b8a6' },
]
const CAT_DEPT = {
  customer: 'cs', lead: 'mkt', invoice: 'fis', payment: 'fis', ticket: 'cs',
  contract: 'legal', project: 'proj', order: 'fis', product: 'ops', vendor: 'ops',
  person: 'ops', document: 'legal', asset: 'ops',
}
const FIRST = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne', 'Soylent', 'Hooli', 'Pied Piper', 'Vehement', 'Massive Dynamic', 'Cyberdyne', 'Wonka', 'Tyrell', 'Gekko', 'Oscorp', 'Nakatomi', 'Bluth', 'Dunder', 'Vandelay', 'Northwind', 'Contoso', 'Fabrikam', 'Litware', 'Tailspin', 'Adventure', 'Proseware', 'Wingtip', 'Coho', 'Fourth Coffee']
const PERSON = ['Aanya', 'Vikram', 'Mei', 'Tom', 'Priya', 'Lena', 'Omar', 'Sofia', 'Raj', 'Nadia', 'Diego', 'Yuki', 'Ahmed', 'Clara', 'Ben', 'Ivy', 'Leo', 'Zara', 'Sam', 'Noor']

function genKnowledgeGraph() {
  const nodes = []
  const links = []
  const add = (id, label, cat, extra = {}) => { nodes.push({ id, label, cat, ...extra }); return id }
  const link = (s, t, kind) => links.push({ source: s, target: t, kind })

  add('org', 'Onyx Enterprise', 'organization')
  departments.forEach((d) => { add(`dept:${d.id}`, d.name, 'department', { deptId: d.id }); link('org', `dept:${d.id}`, 'has-unit') })

  // category anchor nodes per department
  const counts = { customer: 70, lead: 55, invoice: 80, payment: 55, ticket: 60, contract: 28, project: 20, order: 45, product: 22, vendor: 22, person: 30, document: 16, asset: 14 }
  const byCat = {}
  Object.keys(counts).forEach((cat) => {
    const dept = CAT_DEPT[cat]
    byCat[cat] = []
    for (let i = 0; i < counts[cat]; i++) {
      let label
      const n = String(i + 1).padStart(3, '0')
      if (cat === 'customer') label = pick(FIRST) + ' ' + pick(['Corp', 'Ltd', 'Inc', 'LLC', 'Group'])
      else if (cat === 'lead') label = 'Lead ' + pick(FIRST)
      else if (cat === 'invoice') label = 'INV-' + (4000 + i)
      else if (cat === 'payment') label = 'PAY-' + (9000 + i)
      else if (cat === 'ticket') label = '#' + (88000 + i)
      else if (cat === 'contract') label = 'MSA ' + pick(FIRST)
      else if (cat === 'project') label = 'PRJ ' + pick(FIRST)
      else if (cat === 'order') label = 'SO-' + (7000 + i)
      else if (cat === 'product') label = 'SKU-' + n
      else if (cat === 'vendor') label = pick(FIRST) + ' Supply'
      else if (cat === 'person') label = pick(PERSON) + ' ' + String.fromCharCode(65 + (i % 26)) + '.'
      else if (cat === 'document') label = 'DOC-' + n
      else label = 'AST-' + n
      const id = `${cat}:${i}`
      add(id, label, cat, { deptId: dept })
      byCat[cat].push(id)
    }
  })

  const some = (arr) => arr[Math.floor(rnd() * arr.length)]
  // semantic relationships (the web)
  byCat.invoice.forEach((inv) => link(some(byCat.customer), inv, 'owns'))
  byCat.payment.forEach((p) => link(p, some(byCat.invoice), 'settles'))
  byCat.ticket.forEach((t) => link(t, some(byCat.customer), 'raised-by'))
  byCat.contract.forEach((c) => link(c, some(byCat.customer), 'with'))
  byCat.order.forEach((o) => { link(some(byCat.customer), o, 'placed'); link(o, some(byCat.product), 'line-item') })
  byCat.lead.forEach((l, i) => { if (i % 2 === 0) link(l, some(byCat.customer), 'converts-to') })
  byCat.project.forEach((p) => link(p, some(byCat.customer), 'delivers-for'))
  byCat.product.forEach((p) => link(some(byCat.vendor), p, 'supplies'))
  byCat.person.forEach((p) => link(p, `dept:${some(['fis', 'ops', 'cs', 'mkt', 'legal'])}`, 'member-of'))
  byCat.document.forEach((d) => link(d, some([...byCat.invoice, ...byCat.contract, ...byCat.ticket]), 'attached-to'))
  byCat.asset.forEach((a) => link(a, `dept:${some(['ops', 'fis'])}`, 'owned-by'))

  // attach category clusters to their department (gives clean clusters)
  Object.keys(byCat).forEach((cat) => {
    const dept = CAT_DEPT[cat]
    byCat[cat].forEach((id, i) => { if (i % 3 === 0) link(`dept:${dept}`, id, 'contains') })
  })

  // a few cross-customer relationships for density
  for (let i = 0; i < 40; i++) link(some(byCat.customer), some(byCat.customer), 'related')

  // degree
  const deg = {}
  links.forEach((l) => { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1 })
  nodes.forEach((n) => { n.deg = deg[n.id] || 1 })
  return { nodes, links }
}
export const knowledgeGraph = genKnowledgeGraph()
export const KG_STATS = {
  nodes: knowledgeGraph.nodes.length,
  edges: knowledgeGraph.links.length,
  categories: KG_CATEGORIES.length,
}
