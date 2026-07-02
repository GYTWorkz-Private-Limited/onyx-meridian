// ============================================================
// Onyx Meridian — curated seed data (no RNG).
// Domain: commercial/residential real estate operations on top of ERP systems
// (SAP, Yardi, AppFolio, DocuSign). Hand-authored so the product reads as real.
// ============================================================

export const DEPARTMENTS = [
  'Property Management', 'Leasing', 'Asset Management', 'Finance',
  'Facilities', 'Acquisitions', 'Legal', 'Marketing'
];

// Login personas. member + head share a department for a coherent demo.
export const USERS = [
  { id: 'member-1', name: 'Alex Rivera', role: 'member', dept: 'Property Management', avatar: 'AR',
    title: 'Property Associate', blurb: 'Works tasks, asks AI for help, approves its own items.' },
  { id: 'head-1', name: 'Priya Nair', role: 'head', dept: 'Property Management', avatar: 'PN',
    title: 'Head of Property Management', blurb: 'Onboards AI employees, owns the department workforce & cost.' },
  { id: 'admin-1', name: 'Sam Chen', role: 'admin', dept: null, avatar: 'SC',
    title: 'Platform Administrator', blurb: 'Org-wide control: governance, connectors, effectiveness.' }
];

// ---- Models (current generation) -------------------------------------------
export const MODELS = [
  { id: 'opus-4-8',   name: 'Claude Opus 4.8',   vendor: 'Anthropic', rate: 30, tier: 'frontier' },
  { id: 'sonnet-4-6', name: 'Claude Sonnet 4.6', vendor: 'Anthropic', rate: 6,  tier: 'balanced' },
  { id: 'gpt-5-4',    name: 'GPT-5.4',           vendor: 'OpenAI',    rate: 12, tier: 'frontier' },
  { id: 'gemini-2-5', name: 'Gemini 2.5 Pro',    vendor: 'Google',    rate: 7,  tier: 'balanced' },
];
export const modelById = (id) => MODELS.find(m => m.id === id) || MODELS[1];

// ---- Reasoning / effort levels (the actual cost lever) ---------------------
export const REASONING_LEVELS = [
  { id: 'minimal', label: 'Minimal', mult: 0.6, note: 'Fast, shallow. Lookups & routing.' },
  { id: 'low',     label: 'Low',     mult: 0.85, note: 'Light reasoning. Drafting, summaries.' },
  { id: 'medium',  label: 'Medium',  mult: 1.0,  note: 'Balanced. Most analysis & coordination.' },
  { id: 'high',    label: 'High',    mult: 1.7,  note: 'Deep reasoning. Audits, complex planning.' },
];
export const reasoningById = (id) => REASONING_LEVELS.find(r => r.id === id) || REASONING_LEVELS[2];

export const ARCHETYPES = [
  { id: 'analyst',     name: 'Analyst',     description: 'Data processing and reporting' },
  { id: 'coordinator', name: 'Coordinator', description: 'Scheduling and logistics' },
  { id: 'executor',    name: 'Executor',    description: 'Action-oriented task completion' },
  { id: 'advisor',     name: 'Advisor',     description: 'Strategic recommendations' },
  { id: 'auditor',     name: 'Auditor',     description: 'Compliance and quality checks' },
];

// ---- Secret Vault (Governance owns these; UoWs reference them by name) ------
export const VAULT_SECRETS = [
  { name: 'YARDI_OAUTH',    type: 'OAuth client',  masked: 'yd_live_••••••3a9c', rotated: '12d ago' },
  { name: 'SAP_ERP_SVC',    type: 'Service acct',  masked: 'sap_svc_••••••0b22', rotated: '21d ago' },
  { name: 'DOCUSIGN_OAUTH', type: 'OAuth client',  masked: 'ds_live_••••••71fd', rotated: '4d ago' },
  { name: 'APPFOLIO_API',   type: 'API token',     masked: 'af_key_••••••9d4e',  rotated: '7d ago' },
  { name: 'STRIPE_RESTRICTED', type: 'Restricted key', masked: 'rk_live_••••••e10f', rotated: '2d ago' },
  { name: 'REALPAGE_API',   type: 'API token',     masked: 'rp_key_••••••55ad', rotated: '9d ago' },
  { name: 'NETSUITE_TBA',   type: 'Token-based auth', masked: 'ns_tba_••••••c41e', rotated: '15d ago' },
];

// ---- Units of Work ---------------------------------------------------------
// One atomic capability an AI employee can invoke against an ERP / property
// system. Secured via the Meridian Proxy: the UoW stores only a *reference* to
// a vault secret OR delegates the logged-in user's token — the raw key never
// lives in this config or the client.
export const UNITS_OF_WORK = [
  { id: 'uow-1', name: 'Pull Rent Roll', dept: 'Property Management',
    description: 'Read the current rent roll and delinquency status for a property.',
    endpoint: { baseUrl: 'https://api.yardi.com', path: '/voyager/{property}/rentroll', method: 'GET' },
    auth: { mode: 'vault-credential', secret: 'YARDI_OAUTH', scopes: ['rentroll:read'] },
    mapping: { manualMinutes: 30, manualCostUsd: 22, automatedMinutes: 2, automatedCostUsd: 0.6 },
    raci: { responsible: 'p-1', accountable: 'p-2', consulted: '', informed: 'p-3' } },
  { id: 'uow-2', name: 'Open Maintenance Work Order', dept: 'Property Management',
    description: 'Create a maintenance work order against a unit and assign a vendor.',
    endpoint: { baseUrl: 'https://api.yardi.com', path: '/voyager/workorders', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'YARDI_OAUTH', scopes: ['workorders:write'] },
    mapping: { manualMinutes: 18, manualCostUsd: 12, automatedMinutes: 1, automatedCostUsd: 0.4 },
    raci: { responsible: 'p-1', accountable: 'p-2', consulted: '', informed: '' } },
  { id: 'uow-3', name: 'Schedule Inspection', dept: 'Property Management',
    description: 'Read the requesting user’s calendar to book a unit inspection slot.',
    endpoint: { baseUrl: 'https://graph.microsoft.com', path: '/v1.0/me/calendarView', method: 'GET' },
    auth: { mode: 'proxy-delegated', secret: null, scopes: ['Calendars.ReadWrite'] },
    mapping: { manualMinutes: 12, manualCostUsd: 8, automatedMinutes: 1, automatedCostUsd: 0.3 } },
  { id: 'uow-4', name: 'Sync Property to ERP', dept: 'Property Management',
    description: 'Push updated property and unit records into the SAP ERP.',
    endpoint: { baseUrl: 'https://erp.acme.com', path: '/sap/opu/odata/RealEstate/Property', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'SAP_ERP_SVC', scopes: ['re:write'] },
    mapping: { manualMinutes: 25, manualCostUsd: 18, automatedMinutes: 2, automatedCostUsd: 0.7 } },
  { id: 'uow-5', name: 'Fetch Open Listings', dept: 'Leasing',
    description: 'Retrieve available units and listing status from AppFolio.',
    endpoint: { baseUrl: 'https://api.appfolio.com', path: '/v2/listings', method: 'GET' },
    auth: { mode: 'api-key', secret: 'APPFOLIO_API', scopes: ['listings:read'] },
    mapping: { manualMinutes: 18, manualCostUsd: 12, automatedMinutes: 1, automatedCostUsd: 0.4 },
    raci: { responsible: 'p-5', accountable: 'p-6', consulted: '', informed: '' } },
  { id: 'uow-6', name: 'Send Lease for e-Signature', dept: 'Leasing',
    description: 'Generate a lease envelope and route it to the tenant via DocuSign.',
    endpoint: { baseUrl: 'https://api.docusign.net', path: '/restapi/v2.1/envelopes', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'DOCUSIGN_OAUTH', scopes: ['signature'] },
    mapping: { manualMinutes: 22, manualCostUsd: 16, automatedMinutes: 2, automatedCostUsd: 0.6 } },
  { id: 'uow-7', name: 'Pull Invoice Batch from ERP', dept: 'Finance',
    description: 'Retrieve a batch of AP invoices from SAP for reconciliation.',
    endpoint: { baseUrl: 'https://erp.acme.com', path: '/sap/opu/odata/AP/Invoices', method: 'GET' },
    auth: { mode: 'vault-credential', secret: 'SAP_ERP_SVC', scopes: ['ap:read'] },
    mapping: { manualMinutes: 30, manualCostUsd: 22, automatedMinutes: 2, automatedCostUsd: 0.6 } },
  { id: 'uow-8', name: 'Reconcile Rent Payment', dept: 'Finance',
    description: 'Match an incoming rent payment to an open ledger entry and flag variance.',
    endpoint: { baseUrl: 'https://erp.acme.com', path: '/sap/opu/odata/AR/Reconcile', method: 'POST' },
    auth: { mode: 'proxy-delegated', secret: null, scopes: ['ar:write'] },
    mapping: { manualMinutes: 25, manualCostUsd: 18, automatedMinutes: 2, automatedCostUsd: 0.7 } },
  { id: 'uow-9', name: 'Pull Asset Valuation', dept: 'Asset Management',
    description: 'Retrieve the latest appraised value and cap-rate for a property from MRI.',
    endpoint: { baseUrl: 'https://api.mrisoftware.com', path: '/v1/assets/{property}/valuation', method: 'GET' },
    auth: { mode: 'vault-credential', secret: 'MRI_OAUTH', scopes: ['valuation:read'] },
    mapping: { manualMinutes: 35, manualCostUsd: 26, automatedMinutes: 2, automatedCostUsd: 0.6 } },
  { id: 'uow-10', name: 'Update Portfolio NOI', dept: 'Asset Management',
    description: 'Recompute net operating income and push the updated figure to the portfolio model.',
    endpoint: { baseUrl: 'https://api.mrisoftware.com', path: '/v1/portfolio/noi', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'MRI_OAUTH', scopes: ['portfolio:write'] },
    mapping: { manualMinutes: 28, manualCostUsd: 20, automatedMinutes: 2, automatedCostUsd: 0.7 } },
  { id: 'uow-11', name: 'Schedule Preventive Maintenance', dept: 'Facilities',
    description: 'Create a recurring preventive-maintenance task for building equipment in Procore.',
    endpoint: { baseUrl: 'https://api.procore.com', path: '/rest/v1.0/maintenance_schedules', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'PROCORE_OAUTH', scopes: ['maintenance:write'] },
    mapping: { manualMinutes: 20, manualCostUsd: 14, automatedMinutes: 1, automatedCostUsd: 0.4 } },
  { id: 'uow-12', name: 'Open Capital Project', dept: 'Facilities',
    description: 'Stand up a new capital-improvement project with budget and scope in Procore.',
    endpoint: { baseUrl: 'https://api.procore.com', path: '/rest/v1.0/projects', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'PROCORE_OAUTH', scopes: ['projects:write'] },
    mapping: { manualMinutes: 40, manualCostUsd: 30, automatedMinutes: 3, automatedCostUsd: 0.9 } },
  { id: 'uow-13', name: 'Pull Comparable Sales', dept: 'Acquisitions',
    description: 'Fetch recent comparable-sale transactions for a target submarket.',
    endpoint: { baseUrl: 'https://api.costar.com', path: '/v1/comps', method: 'GET' },
    auth: { mode: 'api-key', secret: 'COSTAR_API', scopes: ['comps:read'] },
    mapping: { manualMinutes: 45, manualCostUsd: 34, automatedMinutes: 2, automatedCostUsd: 0.7 } },
  { id: 'uow-14', name: 'Run Deal Underwriting', dept: 'Acquisitions',
    description: 'Run the underwriting model on a candidate deal and return IRR and equity multiple.',
    endpoint: { baseUrl: 'https://erp.acme.com', path: '/sap/opu/odata/Acq/Underwrite', method: 'POST' },
    auth: { mode: 'proxy-delegated', secret: null, scopes: ['deals:write'] },
    mapping: { manualMinutes: 60, manualCostUsd: 48, automatedMinutes: 3, automatedCostUsd: 1.0 } },
  { id: 'uow-15', name: 'Generate Lease Addendum', dept: 'Legal',
    description: 'Draft a lease addendum from an approved template and stage it for signature.',
    endpoint: { baseUrl: 'https://api.docusign.net', path: '/restapi/v2.1/templates/addendum', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'DOCUSIGN_OAUTH', scopes: ['signature'] },
    mapping: { manualMinutes: 30, manualCostUsd: 24, automatedMinutes: 2, automatedCostUsd: 0.6 } },
  { id: 'uow-16', name: 'File Compliance Disclosure', dept: 'Legal',
    description: 'Submit a required regulatory disclosure filing and archive the receipt.',
    endpoint: { baseUrl: 'https://api.acme-legal.com', path: '/v1/disclosures', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'LEGAL_FILING_KEY', scopes: ['filings:write'] },
    mapping: { manualMinutes: 35, manualCostUsd: 28, automatedMinutes: 2, automatedCostUsd: 0.7 } },
  { id: 'uow-17', name: 'Sync Lead to CRM', dept: 'Marketing',
    description: 'Push a new prospect lead into Salesforce and assign it to a leasing queue.',
    endpoint: { baseUrl: 'https://api.salesforce.com', path: '/services/data/v59.0/sobjects/Lead', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'SALESFORCE_OAUTH', scopes: ['leads:write'] },
    mapping: { manualMinutes: 15, manualCostUsd: 10, automatedMinutes: 1, automatedCostUsd: 0.3 } },
  { id: 'uow-18', name: 'Publish Listing Campaign', dept: 'Marketing',
    description: 'Launch a multi-channel listing campaign and schedule the ad spend.',
    endpoint: { baseUrl: 'https://api.salesforce.com', path: '/services/data/v59.0/marketing/campaigns', method: 'POST' },
    auth: { mode: 'vault-credential', secret: 'SALESFORCE_OAUTH', scopes: ['campaigns:write'] },
    mapping: { manualMinutes: 50, manualCostUsd: 38, automatedMinutes: 3, automatedCostUsd: 0.9 } },
];
export const uowById = (id) => UNITS_OF_WORK.find(u => u.id === id);

// ---- Workflows -------------------------------------------------------------
// Categorized only by trigger: 'reactive' | 'proactive'. Proactive carries a schedule.
export const WORKFLOWS = [
  { id: 'wf-1', name: 'Rent Roll Sweep', dept: 'Property Management', trigger: 'proactive',
    schedule: 'Daily at 07:00', uowIds: ['uow-1', 'uow-4'], successRate: 96 },
  { id: 'wf-2', name: 'Maintenance Dispatch', dept: 'Property Management', trigger: 'reactive',
    schedule: null, uowIds: ['uow-2', 'uow-3'], successRate: 98 },
  { id: 'wf-3', name: 'Listing Syndication', dept: 'Leasing', trigger: 'proactive',
    schedule: 'Mon/Wed/Fri at 08:00', uowIds: ['uow-5'], successRate: 95 },
  { id: 'wf-4', name: 'Lease Execution', dept: 'Leasing', trigger: 'reactive',
    schedule: null, uowIds: ['uow-6'], successRate: 97 },
  { id: 'wf-5', name: 'Invoice Reconciliation', dept: 'Finance', trigger: 'proactive',
    schedule: 'Weekdays at 07:30', uowIds: ['uow-7', 'uow-8'], successRate: 93 },
  { id: 'wf-6', name: 'Quarterly Valuation Refresh', dept: 'Asset Management', trigger: 'proactive',
    schedule: 'Quarterly on the 1st at 06:00', uowIds: ['uow-9', 'uow-10'], successRate: 94 },
  { id: 'wf-7', name: 'NOI Variance Watch', dept: 'Asset Management', trigger: 'reactive',
    schedule: null, uowIds: ['uow-10'], successRate: 91 },
  { id: 'wf-8', name: 'Preventive Maintenance Cycle', dept: 'Facilities', trigger: 'proactive',
    schedule: 'Weekly on Mon at 06:30', uowIds: ['uow-11'], successRate: 97 },
  { id: 'wf-9', name: 'Capital Project Intake', dept: 'Facilities', trigger: 'reactive',
    schedule: null, uowIds: ['uow-12', 'uow-11'], successRate: 92 },
  { id: 'wf-10', name: 'Deal Screening', dept: 'Acquisitions', trigger: 'reactive',
    schedule: null, uowIds: ['uow-13', 'uow-14'], successRate: 89 },
  { id: 'wf-11', name: 'Comp Set Refresh', dept: 'Acquisitions', trigger: 'proactive',
    schedule: 'Daily at 06:00', uowIds: ['uow-13'], successRate: 95 },
  { id: 'wf-12', name: 'Addendum Generation', dept: 'Legal', trigger: 'reactive',
    schedule: null, uowIds: ['uow-15'], successRate: 96 },
  { id: 'wf-13', name: 'Compliance Filing Sweep', dept: 'Legal', trigger: 'proactive',
    schedule: 'Monthly on the 5th at 08:00', uowIds: ['uow-16'], successRate: 90 },
  { id: 'wf-14', name: 'Lead Capture Sync', dept: 'Marketing', trigger: 'reactive',
    schedule: null, uowIds: ['uow-17'], successRate: 98 },
  { id: 'wf-15', name: 'Campaign Launch', dept: 'Marketing', trigger: 'proactive',
    schedule: 'Tue/Thu at 09:00', uowIds: ['uow-18', 'uow-17'], successRate: 93 },
];
export const wfById = (id) => WORKFLOWS.find(w => w.id === id);

// ---- Scale-out generators (deterministic, no RNG) --------------------------
// The curated UoWs/workflows above are the "featured" ones. Real departments
// run dozens more, so we deterministically synthesize the rest to reach
// ~50 Units of Work and ~20 Workflows per department. Same input → same output,
// so the data is stable across reloads.
const DEPT_META = {
  'Property Management': { base: 'https://api.yardi.com', path: '/voyager', secret: 'YARDI_OAUTH', scope: 'voyager',
    objects: ['Rent Roll','Work Order','Unit Turn','Tenant Ledger','Delinquency Report','Lease Charge','Move-in Checklist','Move-out Inspection','Vendor Invoice','Utility Bill','Amenity Booking','Parking Assignment','Property Record','Occupancy Snapshot','Renewal Offer','Late Fee','Concession','Service Request','Inspection Report','Notice to Vacate'] },
  'Leasing': { base: 'https://api.appfolio.com', path: '/v2', secret: 'APPFOLIO_API', scope: 'leasing',
    objects: ['Listing','Application','Screening Report','Lease Draft','Tour Slot','Guest Card','Availability Feed','Pricing Recommendation','Concession Offer','Renewal Notice','Lease Packet','Deposit Receipt','Co-signer Record','Waitlist Entry','Lead','Showing Feedback','Hold Agreement','Lease Audit','Occupancy Forecast','Unit Amenity'] },
  'Asset Management': { base: 'https://api.mrisoftware.com', path: '/v1', secret: 'MRI_OAUTH', scope: 'asset',
    objects: ['Asset Valuation','Portfolio NOI','Cap Rate','Debt Schedule','Cash Flow Model','Hold/Sell Analysis','Refinance Scenario','Investor Report','Budget Variance','Reserve Study','Market Comp','Rent Growth Forecast','Disposition Memo','Equity Waterfall','Covenant Test','Asset Plan','Distribution Run','Valuation Bridge','Performance Snapshot','Risk Flag'] },
  'Finance': { base: 'https://erp.acme.com', path: '/sap/opu/odata', secret: 'SAP_ERP_SVC', scope: 'fin',
    objects: ['Invoice Batch','Rent Payment','GL Entry','AP Voucher','AR Reconciliation','Bank Statement','Journal Entry','Expense Report','Budget Line','Cost Center','Tax Filing','Wire Transfer','Vendor Payment','Accrual','Month-end Close','Cash Position','Chargeback','Credit Memo','Fixed Asset','Trial Balance'] },
  'Facilities': { base: 'https://api.procore.com', path: '/rest/v1.0', secret: 'PROCORE_OAUTH', scope: 'facilities',
    objects: ['Maintenance Schedule','Capital Project','Equipment Asset','PM Task','Vendor SLA','Service Ticket','Inspection Round','Warranty Claim','Energy Reading','Compliance Cert','Punch List','Building Permit','Safety Audit','Elevator Log','HVAC Reading','Janitorial Route','Work Permit','Asset Warranty','Meter Read','Incident Report'] },
  'Acquisitions': { base: 'https://api.costar.com', path: '/v1', secret: 'COSTAR_API', scope: 'acq',
    objects: ['Comparable Sale','Deal Underwriting','Offer Memo','Due Diligence Item','Pipeline Deal','Submarket Report','Sourcing Lead','LOI Draft','Rent Comp','Sales Comp','Sensitivity Model','Closing Checklist','Title Review','Site Visit','Broker Outreach','Pro Forma','Capital Stack','Term Sheet','Market Study','Acquisition Memo'] },
  'Legal': { base: 'https://api.acme-legal.com', path: '/v1', secret: 'LEGAL_FILING_KEY', scope: 'legal',
    objects: ['Lease Addendum','Compliance Disclosure','Contract Clause','Estoppel Certificate','SNDA','NDA','Litigation Hold','Regulatory Filing','Vendor Agreement','Insurance Certificate','Title Document','Entity Filing','Policy Document','Dispute Record','Amendment','Consent Letter','Guaranty','Notice Letter','Compliance Log','Lien Release'] },
  'Marketing': { base: 'https://api.salesforce.com', path: '/services/data/v59.0', secret: 'SALESFORCE_OAUTH', scope: 'mktg',
    objects: ['Lead','Listing Campaign','Email Blast','Ad Spend','Landing Page','Social Post','Prospect Segment','Brand Asset','Event Invite','Referral','Nurture Sequence','UTM Report','Reputation Review','Content Brief','Channel Budget','Audience List','Promo Code','Newsletter','Webinar','Survey'] },
};
const READ_VERBS = ['Pull', 'Review', 'Audit', 'Validate', 'Fetch', 'Export'];
const WRITE_VERBS = ['Sync', 'Update', 'Open', 'Generate', 'Post', 'Reconcile', 'Archive', 'Schedule'];
const AUTH_CYCLE = ['vault-credential', 'proxy-delegated', 'api-key'];
const WF_SUFFIX = ['Sweep', 'Sync', 'Watch', 'Cycle', 'Audit', 'Pipeline', 'Refresh', 'Handler', 'Monitor', 'Reconciliation', 'Dispatch', 'Review', 'Rollup', 'Batch', 'Check'];
const WF_SCHEDULES = ['Daily at 06:00', 'Daily at 08:00', 'Weekdays at 07:30', 'Mon/Wed/Fri at 08:00', 'Weekly on Mon at 06:30', 'Tue/Thu at 09:00', 'Monthly on the 1st at 06:00', 'Quarterly on the 1st at 06:00'];
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '');

// Per-department targets vary between 10 and 25 (deterministic, no two the
// same formula) so the workspace doesn't look uniformly generated.
const uowTargetFor = (di) => 10 + ((di * 7 + 3) % 16);
const wfTargetFor = (di) => 10 + ((di * 5 + 9) % 16);

DEPARTMENTS.forEach((dept, di) => {
  const meta = DEPT_META[dept];
  if (!meta) return;
  const dslug = slug(dept);
  const UOW_TARGET = uowTargetFor(di);
  const WF_TARGET = wfTargetFor(di);

  // ---- Units of Work up to UOW_TARGET ----
  const existingNames = new Set(UNITS_OF_WORK.filter(u => u.dept === dept).map(u => u.name));
  let made = existingNames.size;
  let i = 0;
  while (made < UOW_TARGET && i < meta.objects.length * (READ_VERBS.length + WRITE_VERBS.length)) {
    const obj = meta.objects[i % meta.objects.length];
    const cycle = Math.floor(i / meta.objects.length);
    const isRead = cycle % 2 === 0;
    const verb = isRead ? READ_VERBS[cycle % READ_VERBS.length] : WRITE_VERBS[cycle % WRITE_VERBS.length];
    const name = `${verb} ${obj}`;
    i++;
    if (existingNames.has(name)) continue;
    existingNames.add(name);
    const mode = AUTH_CYCLE[made % AUTH_CYCLE.length];
    const manualMinutes = 12 + (made * 7) % 48;
    const autoMinutes = 1 + (made % 3);
    UNITS_OF_WORK.push({
      id: `uow-${dslug}-${made}`,
      name,
      dept,
      description: `${isRead ? 'Read' : 'Update'} the ${obj.toLowerCase()} for a property via the ${meta.base.replace('https://', '')} integration.`,
      endpoint: { baseUrl: meta.base, path: `${meta.path}/${slug(obj)}`, method: isRead ? 'GET' : 'POST' },
      auth: { mode, secret: mode === 'proxy-delegated' ? null : meta.secret, scopes: [`${meta.scope}:${isRead ? 'read' : 'write'}`] },
      mapping: {
        manualMinutes,
        manualCostUsd: Math.round(manualMinutes * 0.75),
        automatedMinutes: autoMinutes,
        automatedCostUsd: Number((0.3 + autoMinutes * 0.2).toFixed(2)),
      },
    });
    made++;
  }

  // ---- Workflows up to WF_TARGET ----
  const deptUows = UNITS_OF_WORK.filter(u => u.dept === dept);
  const existingWfNames = new Set(WORKFLOWS.filter(w => w.dept === dept).map(w => w.name));
  let wmade = existingWfNames.size;
  let j = 0;
  while (wmade < WF_TARGET && j < meta.objects.length * WF_SUFFIX.length) {
    const obj = meta.objects[j % meta.objects.length];
    const suffix = WF_SUFFIX[Math.floor(j / meta.objects.length) % WF_SUFFIX.length];
    const name = `${obj} ${suffix}`;
    j++;
    if (existingWfNames.has(name)) continue;
    existingWfNames.add(name);
    // Vary the trigger split (not a strict alternation) and the number of
    // Units of Work each workflow chains (1–3) so workflows don't look templated.
    const proactive = (wmade * 5 + 2) % 3 !== 0;
    const linkCount = 1 + ((wmade * 2 + di) % 3); // 1, 2 or 3
    const uowIds = [];
    for (let k = 0; k < linkCount && deptUows.length; k++) {
      const u = deptUows[(wmade * 3 + k) % deptUows.length];
      if (u && !uowIds.includes(u.id)) uowIds.push(u.id);
    }
    WORKFLOWS.push({
      id: `wf-${dslug}-${wmade}`,
      name,
      dept,
      trigger: proactive ? 'proactive' : 'reactive',
      schedule: proactive ? WF_SCHEDULES[wmade % WF_SCHEDULES.length] : null,
      uowIds,
      successRate: 88 + (wmade * 7) % 12,
    });
    wmade++;
  }
});

// ---- AI Employees ----------------------------------------------------------
export const EMPLOYEES = [
  { id: 'emp-1', name: 'Atlas', title: 'Property Ops Coordinator', archetype: 'Coordinator', dept: 'Property Management',
    status: 'active', model: 'sonnet-4-6', reasoning: 'medium', tokensMonth: 42_000_000, tasks_completed: 412,
    workflowIds: ['wf-1', 'wf-2'], description: 'Runs the rent roll, opens work orders and keeps property records in sync with the ERP.' },
  { id: 'emp-2', name: 'Scout', title: 'Maintenance Dispatcher', archetype: 'Coordinator', dept: 'Property Management',
    status: 'active', model: 'sonnet-4-6', reasoning: 'low', tokensMonth: 28_000_000, tasks_completed: 980,
    workflowIds: ['wf-2'], description: 'Triages maintenance requests and dispatches vendors to the right units.' },
  { id: 'emp-3', name: 'Sentinel', title: 'Lease Compliance Auditor', archetype: 'Auditor', dept: 'Property Management',
    status: 'active', model: 'opus-4-8', reasoning: 'high', tokensMonth: 18_000_000, tasks_completed: 156,
    workflowIds: ['wf-2'], description: 'Audits lease renewals and work orders for compliance and policy breaks.' },
  { id: 'emp-4', name: 'Cadence', title: 'Tenant Comms Agent', archetype: 'Coordinator', dept: 'Property Management',
    status: 'paused', model: 'sonnet-4-6', reasoning: 'minimal', tokensMonth: 12_000_000, tasks_completed: 240,
    workflowIds: ['wf-1'], description: 'Sends tenant notices and follows up on outstanding items.' },
  { id: 'emp-5', name: 'Ledger', title: 'Rent Reconciliation Agent', archetype: 'Analyst', dept: 'Finance',
    status: 'active', model: 'gpt-5-4', reasoning: 'medium', tokensMonth: 36_000_000, tasks_completed: 520,
    workflowIds: ['wf-5'], description: 'Reconciles rent payments against the ERP ledger and flags variances.' },
  { id: 'emp-6', name: 'Audit', title: 'AP Controls Auditor', archetype: 'Auditor', dept: 'Finance',
    status: 'active', model: 'opus-4-8', reasoning: 'high', tokensMonth: 15_000_000, tasks_completed: 98,
    workflowIds: ['wf-5'], description: 'Reviews high-value invoice reconciliations for control breaks.' },
  { id: 'emp-7', name: 'Pipeline', title: 'Listing Syndicator', archetype: 'Executor', dept: 'Leasing',
    status: 'active', model: 'gemini-2-5', reasoning: 'low', tokensMonth: 30_000_000, tasks_completed: 610,
    workflowIds: ['wf-3'], description: 'Publishes and refreshes unit listings across channels.' },
  { id: 'emp-8', name: 'Advise', title: 'Leasing Advisor', archetype: 'Advisor', dept: 'Leasing',
    status: 'active', model: 'gpt-5-4', reasoning: 'medium', tokensMonth: 22_000_000, tasks_completed: 145,
    workflowIds: ['wf-4'], description: 'Recommends concessions and next best actions on at-risk leases.' },
  { id: 'emp-9', name: 'Onboard', title: 'Tenant Onboarding Agent', archetype: 'Coordinator', dept: 'Leasing',
    status: 'active', model: 'sonnet-4-6', reasoning: 'low', tokensMonth: 16_000_000, tasks_completed: 188,
    workflowIds: ['wf-4'], description: 'Executes leases and walks new tenants through move-in.' },
  { id: 'emp-10', name: 'Brief', title: 'Marketing Content Agent', archetype: 'Executor', dept: 'Marketing',
    status: 'active', model: 'gemini-2-5', reasoning: 'low', tokensMonth: 26_000_000, tasks_completed: 333,
    workflowIds: [], description: 'Drafts listing copy and leasing campaign briefs.' },
  { id: 'emp-11', name: 'Counsel', title: 'Lease Reviewer', archetype: 'Auditor', dept: 'Legal',
    status: 'active', model: 'opus-4-8', reasoning: 'high', tokensMonth: 11_000_000, tasks_completed: 72,
    workflowIds: [], description: 'Flags non-standard clauses in leases and vendor agreements.' },
  { id: 'emp-12', name: 'Flow', title: 'Facilities Dispatcher', archetype: 'Coordinator', dept: 'Facilities',
    status: 'active', model: 'sonnet-4-6', reasoning: 'medium', tokensMonth: 33_000_000, tasks_completed: 455,
    workflowIds: ['wf-8'], description: 'Routes building service tickets and tracks vendor SLAs.' },
  // ---- coverage for departments that had workflows/UoW but no AI employees ----
  { id: 'emp-13', name: 'Valor', title: 'Portfolio Analyst', archetype: 'Analyst', dept: 'Asset Management',
    status: 'active', model: 'opus-4-8', reasoning: 'high', tokensMonth: 24_000_000, tasks_completed: 211,
    workflowIds: ['wf-6', 'wf-7'], description: 'Refreshes valuations and watches NOI variance across the portfolio.' },
  { id: 'emp-14', name: 'Vista', title: 'Asset Performance Agent', archetype: 'Advisor', dept: 'Asset Management',
    status: 'active', model: 'gpt-5-4', reasoning: 'medium', tokensMonth: 17_000_000, tasks_completed: 96,
    workflowIds: ['wf-7'], description: 'Surfaces hold/sell signals and flags underperforming assets.' },
  { id: 'emp-15', name: 'Quarry', title: 'Acquisitions Screener', archetype: 'Analyst', dept: 'Acquisitions',
    status: 'active', model: 'opus-4-8', reasoning: 'high', tokensMonth: 29_000_000, tasks_completed: 134,
    workflowIds: ['wf-10', 'wf-11'], description: 'Screens deals, pulls comps and runs first-pass underwriting.' },
  { id: 'emp-16', name: 'Beacon', title: 'Sourcing Agent', archetype: 'Coordinator', dept: 'Acquisitions',
    status: 'paused', model: 'sonnet-4-6', reasoning: 'low', tokensMonth: 9_000_000, tasks_completed: 41,
    workflowIds: ['wf-11'], description: 'Keeps the comp set fresh and tracks broker outreach.' },
  { id: 'emp-17', name: 'Quill', title: 'Compliance Filer', archetype: 'Auditor', dept: 'Legal',
    status: 'active', model: 'opus-4-8', reasoning: 'high', tokensMonth: 8_000_000, tasks_completed: 58,
    workflowIds: ['wf-12', 'wf-13'], description: 'Generates addenda and sweeps compliance filings on schedule.' },
];

// Give every AI employee a richer, realistic workflow portfolio — a guaranteed
// mix of PROACTIVE (scheduled) and REACTIVE (event-driven) processes from its
// department. Curated assignments are preserved; we top up to a deterministic
// 3–5 total so each profile shows a believable spread instead of a single flow.
EMPLOYEES.forEach((emp, ei) => {
  const deptWfs = WORKFLOWS.filter(w => w.dept === emp.dept);
  if (!deptWfs.length) return;
  const ids = [...(emp.workflowIds || [])];
  const proactive = deptWfs.filter(w => w.trigger === 'proactive');
  const reactive = deptWfs.filter(w => w.trigger === 'reactive');
  const hasTrigger = (t) => ids.some(id => wfById(id)?.trigger === t);
  // guarantee at least one of each category when the department has them
  if (!hasTrigger('proactive') && proactive.length) ids.push(proactive[ei % proactive.length].id);
  if (!hasTrigger('reactive') && reactive.length) ids.push(reactive[ei % reactive.length].id);
  // top up to a deterministic 3–5 from the department pool, deduped
  const target = 3 + (ei % 3);
  for (let k = 0; ids.length < target && k < deptWfs.length; k++) {
    const w = deptWfs[(ei * 4 + k * 3 + 1) % deptWfs.length];
    if (w && !ids.includes(w.id)) ids.push(w.id);
  }
  emp.workflowIds = [...new Set(ids)];
});

export const empById = (id) => EMPLOYEES.find(e => e.id === id);

// ---- Cost + effectiveness helpers (derived, not stored) --------------------
export function monthlyCost(emp) {
  const m = modelById(emp.model);
  const r = reasoningById(emp.reasoning);
  return Math.round((emp.tokensMonth / 1_000_000) * m.rate * r.mult);
}

export function employeeWorkflows(emp) {
  if (emp.composedWorkflows?.length) return emp.composedWorkflows;
  return (emp.workflowIds || []).map(wfById).filter(Boolean);
}

export function uowsForEmployee(emp) {
  const ids = new Set();
  employeeWorkflows(emp).forEach(w => (w.uowIds || []).forEach(u => ids.add(u)));
  return [...ids].map(uowById).filter(Boolean);
}

// ---- Multi-dimensional effectiveness & ROI --------------------------------
// Effectiveness is more than time saved. A mapping is evaluated across four
// dimensions: TIME (minutes/run), COST ($/run), VOLUME (runs/month — the lever
// that turns per-run savings into real ROI) and QUALITY (error/rework rate the
// manual process carried, which automation drives down). Older mappings only
// stored time & cost, so we backfill the newer dimensions deterministically.
export function normalizeMapping(m = {}) {
  const num = (v, d = 0) => (v === 'na' || v == null || Number.isNaN(Number(v)) ? d : Number(v));
  const manualMinutes = num(m.manualMinutes);
  const automatedMinutes = num(m.automatedMinutes, Math.max(1, Math.round(manualMinutes * 0.08)));
  const manualCostUsd = num(m.manualCostUsd);
  const automatedCostUsd = num(m.automatedCostUsd, Number((manualCostUsd * 0.03 + 0.3).toFixed(2)));
  // Volume — how often this runs in a month; scales per-run savings into ROI.
  const runsPerMonth = num(m.runsPerMonth, Math.max(20, Math.round(manualMinutes * 5)));
  // Quality — manual error/rework rate and the residual rate once automated.
  const manualErrorRate = num(m.manualErrorRate, Math.min(20, 4 + Math.round(manualMinutes / 6)));
  const automatedErrorRate = num(m.automatedErrorRate, Math.max(1, Math.round(manualErrorRate * 0.25)));
  // Headcount — how many people the manual version required (automation needs 0).
  const manualPeople = num(m.manualPeople, 1);
  return { manualMinutes, automatedMinutes, manualCostUsd, automatedCostUsd, runsPerMonth, manualErrorRate, automatedErrorRate, manualPeople };
}

// Compute the per-Unit-of-Work ROI projection from a (possibly partial) mapping.
export function uowRoi(mapping) {
  const m = normalizeMapping(mapping);
  const minsSavedPerRun = Math.max(0, m.manualMinutes - m.automatedMinutes);
  const costSavedPerRun = Math.max(0, m.manualCostUsd - m.automatedCostUsd);
  const monthlyHoursSaved = (minsSavedPerRun * m.runsPerMonth) / 60;
  const monthlyCostSaved = costSavedPerRun * m.runsPerMonth;
  const annualCostSaved = monthlyCostSaved * 12;
  const timeReductionPct = m.manualMinutes ? Math.round((1 - m.automatedMinutes / m.manualMinutes) * 100) : 0;
  const qualityUpliftPct = m.manualErrorRate ? Math.round((1 - m.automatedErrorRate / m.manualErrorRate) * 100) : 0;
  return { ...m, minsSavedPerRun, costSavedPerRun, monthlyHoursSaved, monthlyCostSaved, annualCostSaved, timeReductionPct, qualityUpliftPct };
}

export function effectiveness(emp) {
  const uows = uowsForEmployee(emp);
  const tasks = emp.tasks_completed;
  if (uows.length === 0) return { tasksCompleted: tasks, timeSavedHours: 0, costSaved: 0, effectivenessPct: 0, qualityUpliftPct: 0, hasMapping: false };
  // Skip 'N/A' mappings so they don't poison the average.
  const avg = (f) => {
    const nums = uows.map(f).filter(v => typeof v === 'number' && !Number.isNaN(v));
    return nums.length ? nums.reduce((a, v) => a + v, 0) / nums.length : 0;
  };
  const manualMin = avg(u => u.mapping.manualMinutes), autoMin = avg(u => u.mapping.automatedMinutes);
  const manualUsd = avg(u => u.mapping.manualCostUsd), autoUsd = avg(u => u.mapping.automatedCostUsd);
  const qualityUpliftPct = Math.round(avg(u => uowRoi(u.mapping).qualityUpliftPct));
  return {
    tasksCompleted: tasks,
    timeSavedHours: Math.round((tasks * (manualMin - autoMin)) / 60),
    costSaved: Math.round(tasks * (manualUsd - autoUsd)),
    effectivenessPct: Math.round((1 - autoMin / manualMin) * 100),
    qualityUpliftPct,
    hasMapping: true,
  };
}

// ---- Business KPIs --------------------------------------------------------
// The outcomes a department is measured on. Their source of truth is the
// connected systems (the ERP/CRM/etc). Each KPI has a direction (is higher or
// lower better), a unit, a manual baseline (pre-AI) and a current value, plus a
// target. AI employees get mapped to KPIs; the harness measures each KPI before
// and after a workflow run to compute an impact score.
export const KPIS = [
  // Property Management
  { id: 'kpi-pm-1', dept: 'Property Management', name: 'Rent Collection Rate', unit: '%', direction: 'up', source: 'AppFolio', baseline: 91, current: 96.4, target: 98 },
  { id: 'kpi-pm-2', dept: 'Property Management', name: 'Avg Days-to-Resolve Work Order', unit: 'days', direction: 'down', source: 'RealPage', baseline: 5.2, current: 2.8, target: 2 },
  { id: 'kpi-pm-3', dept: 'Property Management', name: 'Tenant Retention Rate', unit: '%', direction: 'up', source: 'AppFolio', baseline: 78, current: 84, target: 88 },
  // Leasing
  { id: 'kpi-le-1', dept: 'Leasing', name: 'Lead-to-Lease Conversion', unit: '%', direction: 'up', source: 'Salesforce', baseline: 9, current: 13.5, target: 16 },
  { id: 'kpi-le-2', dept: 'Leasing', name: 'Avg Days Vacant', unit: 'days', direction: 'down', source: 'RealPage', baseline: 34, current: 21, target: 18 },
  { id: 'kpi-le-3', dept: 'Leasing', name: 'Application Approval Time', unit: 'hrs', direction: 'down', source: 'Entrata', baseline: 28, current: 9, target: 6 },
  // Asset Management
  { id: 'kpi-am-1', dept: 'Asset Management', name: 'Portfolio Occupancy', unit: '%', direction: 'up', source: 'RealPage', baseline: 88, current: 92.5, target: 95 },
  { id: 'kpi-am-2', dept: 'Asset Management', name: 'NOI Margin', unit: '%', direction: 'up', source: 'Oracle NetSuite', baseline: 58, current: 62, target: 65 },
  { id: 'kpi-am-3', dept: 'Asset Management', name: 'Forecast Accuracy', unit: '%', direction: 'up', source: 'Oracle NetSuite', baseline: 81, current: 90, target: 93 },
  // Finance
  { id: 'kpi-fi-1', dept: 'Finance', name: 'Invoice Cycle Time', unit: 'days', direction: 'down', source: 'Oracle NetSuite', baseline: 9.5, current: 4.2, target: 3 },
  { id: 'kpi-fi-2', dept: 'Finance', name: 'AP 3-Way Match Rate', unit: '%', direction: 'up', source: 'Coupa', baseline: 84, current: 95, target: 98 },
  { id: 'kpi-fi-3', dept: 'Finance', name: 'Month-End Close Days', unit: 'days', direction: 'down', source: 'Sage Intacct', baseline: 8, current: 5, target: 4 },
  // Facilities
  { id: 'kpi-fa-1', dept: 'Facilities', name: 'PM Compliance Rate', unit: '%', direction: 'up', source: 'Procore', baseline: 72, current: 89, target: 95 },
  { id: 'kpi-fa-2', dept: 'Facilities', name: 'Mean Time to Repair', unit: 'hrs', direction: 'down', source: 'Procore', baseline: 26, current: 12, target: 8 },
  { id: 'kpi-fa-3', dept: 'Facilities', name: 'Vendor SLA Adherence', unit: '%', direction: 'up', source: 'Procore', baseline: 80, current: 91, target: 95 },
  // Acquisitions
  { id: 'kpi-ac-1', dept: 'Acquisitions', name: 'Deal Cycle Time', unit: 'days', direction: 'down', source: 'Salesforce', baseline: 62, current: 41, target: 35 },
  { id: 'kpi-ac-2', dept: 'Acquisitions', name: 'Underwriting Accuracy', unit: '%', direction: 'up', source: 'Dynamics 365', baseline: 83, current: 91, target: 94 },
  { id: 'kpi-ac-3', dept: 'Acquisitions', name: 'Pipeline Conversion', unit: '%', direction: 'up', source: 'Salesforce', baseline: 11, current: 16, target: 20 },
  // Legal
  { id: 'kpi-lg-1', dept: 'Legal', name: 'Contract Turnaround Time', unit: 'days', direction: 'down', source: 'DocuSign', baseline: 7, current: 2.5, target: 2 },
  { id: 'kpi-lg-2', dept: 'Legal', name: 'Compliance Filing On-Time Rate', unit: '%', direction: 'up', source: 'DocuSign', baseline: 86, current: 97, target: 99 },
  { id: 'kpi-lg-3', dept: 'Legal', name: 'Clause Risk Flags Caught', unit: '%', direction: 'up', source: 'DocuSign', baseline: 74, current: 90, target: 95 },
  // Marketing
  { id: 'kpi-mk-1', dept: 'Marketing', name: 'Cost per Lead', unit: '$', direction: 'down', source: 'Salesforce', baseline: 42, current: 28, target: 22 },
  { id: 'kpi-mk-2', dept: 'Marketing', name: 'Listing Time-on-Market', unit: 'days', direction: 'down', source: 'RealPage', baseline: 31, current: 19, target: 15 },
  { id: 'kpi-mk-3', dept: 'Marketing', name: 'Campaign ROI', unit: '%', direction: 'up', source: 'Salesforce', baseline: 120, current: 168, target: 200 },
];

export function kpisForDept(dept) { return KPIS.filter(k => k.dept === dept); }
export function kpiById(id) { return KPIS.find(k => k.id === id) || null; }

// KPIs an AI employee is mapped to. Explicit mapping (emp.kpiIds) wins; otherwise
// deterministically map a couple of the department's KPIs so seeded agents show
// impact without manual setup.
export function kpisForEmployee(emp) {
  if (emp.kpiIds?.length) return emp.kpiIds.map(kpiById).filter(Boolean);
  const dk = kpisForDept(emp.dept);
  if (!dk.length) return [];
  let h = 0; for (let i = 0; i < emp.id.length; i++) h = (h * 31 + emp.id.charCodeAt(i)) >>> 0;
  const start = h % dk.length;
  const n = 1 + (h % Math.min(2, dk.length)); // 1–2 KPIs
  return Array.from({ length: n }, (_, i) => dk[(start + i) % dk.length]);
}

// Before/after impact of an agent on a KPI, plus a 0–100 impact score blending
// improvement magnitude with progress toward target.
export function kpiImpact(kpi) {
  const before = kpi.baseline, after = kpi.current;
  const improved = kpi.direction === 'up' ? after >= before : after <= before;
  const changePct = before ? Math.round((Math.abs(after - before) / Math.abs(before)) * 100) : 0;
  const span = Math.abs(kpi.target - kpi.baseline) || 1;
  const progressed = kpi.direction === 'up' ? after - kpi.baseline : kpi.baseline - after;
  const score = Math.max(0, Math.min(100, Math.round((progressed / span) * 100)));
  return { before, after, improved, changePct, score };
}

// Synthesized activity feed for an employee (runs + tasks + UoW calls).
// Format an absolute "minutes ago" into a human relative label.
function agoLabel(mins) {
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / (60 * 24))}d ago`;
}

// A rich, deterministic activity feed for an AI employee. Synthesizes many
// believable events (workflow runs, Unit-of-Work calls, peer hand-offs, approval
// requests, memory writes, retries) spread across the last ~10 days, ordered
// most-recent first, so the Activity tab is long enough to scroll.
export function employeeActivity(emp, tasks) {
  const h = (() => { let x = 0; for (let i = 0; i < emp.id.length; i++) x = (x * 31 + emp.id.charCodeAt(i)) >>> 0; return x; })();
  const wfs = employeeWorkflows(emp);
  const uows = uowsForEmployee(emp);
  const peers = EMPLOYEES.filter(e => e.dept === emp.dept && e.id !== emp.id && e.status === 'active');
  const items = [];
  const push = (type, mins, text) => items.push({ type, mins, text });

  // Open tasks first — these stay "in progress" at the top.
  (tasks || []).filter(t => t.assignee === emp.id && t.status !== 'done').forEach((t, i) => {
    push('task', 8 + i * 3, `Working task “${t.title}”`);
  });

  // Recent workflow runs — each workflow has run several times across the window.
  wfs.forEach((w, wi) => {
    const runs = 2 + ((h >> wi) % 3); // 2–4 recent runs each
    for (let r = 0; r < runs; r++) {
      const mins = 90 + wi * 70 + r * (300 + (h % 240)); // spread out, ascending
      const suffix = w.trigger === 'proactive' ? ` · ${w.schedule}` : ' · on event';
      push('workflow', mins, `Ran workflow “${w.name}”${suffix}`);
    }
  });

  // Unit-of-Work calls via the proxy.
  uows.forEach((u, ui) => {
    const calls = 1 + ((h >> (ui + 2)) % 3); // 1–3 calls each
    for (let c = 0; c < calls; c++) {
      const mins = 200 + ui * 130 + c * (420 + (h % 300));
      push('uow', mins, `Called Unit of Work “${u.name}” via Meridian Proxy`);
    }
  });

  // Peer hand-offs.
  peers.slice(0, 2).forEach((p, pi) => {
    push('delegate', 600 + pi * 540 + (h % 300), `Handed off downstream steps to ${p.name} (${p.title})`);
  });

  // Approval requests routed to a human.
  if (uows[0]) push('approval', 320 + (h % 200), `Requested approval to call “${uows[0].name}”`);
  if (uows[1]) push('approval', 1500 + (h % 600), `Requested approval to call “${uows[1].name}”`);

  // Memory writes — the employee learning from its work.
  push('memory', 260 + (h % 180), `Saved a new memory from “${wfs[0]?.name || 'a recent run'}”`);
  push('memory', 1900 + (h % 700), 'Updated working context with this week’s patterns');

  // An occasional retry / self-heal, for realism.
  if (uows[0]) push('error', 740 + (h % 260), `Retried “${uows[0].name}” after a transient timeout — succeeded`);

  // Completed tasks, further back.
  (tasks || []).filter(t => t.assignee === emp.id && t.status === 'done').forEach((t, i) => {
    push('task', 1440 + i * 360, `Completed task “${t.title}”`);
  });

  // Sort most-recent first and attach relative labels.
  return items
    .sort((a, b) => a.mins - b.mins)
    .map(it => ({ ...it, when: it.type === 'task' && it.text.startsWith('Working') ? 'in progress' : agoLabel(it.mins) }));
}

// ---- People (curated, realistic) -------------------------------------------
export const PEOPLE = [
  { id: 'p-1', name: 'Alex Rivera',    email: 'alex.rivera@acme.com',    role: 'member', dept: 'Property Management', status: 'active' },
  { id: 'p-2', name: 'Priya Nair',     email: 'priya.nair@acme.com',     role: 'head',   dept: 'Property Management', status: 'active' },
  { id: 'p-3', name: 'Sam Chen',       email: 'sam.chen@acme.com',       role: 'admin',  dept: null,                 status: 'active' },
  { id: 'p-4', name: 'Marcus Holt',    email: 'marcus.holt@acme.com',    role: 'head',   dept: 'Finance',            status: 'active' },
  { id: 'p-5', name: 'Dana Whitfield', email: 'dana.whitfield@acme.com', role: 'member', dept: 'Leasing',            status: 'active' },
  { id: 'p-6', name: 'Lena Osei',      email: 'lena.osei@acme.com',      role: 'head',   dept: 'Leasing',            status: 'active' },
  { id: 'p-7', name: 'Tomas Vidal',    email: 'tomas.vidal@acme.com',    role: 'member', dept: 'Facilities',         status: 'invited' },
];

// ---- MCP Connectors (ERP + real estate systems) ----------------------------
export const CONNECTORS = [
  { id: 'c-sap',       brand: 'sap',       name: 'SAP S/4HANA',   category: 'ERP', protocol: 'rest', secret: 'SAP_ERP_SVC', connected: true,  dept: 'Finance' },
  { id: 'c-yardi',     brand: 'yardi',     name: 'Yardi Voyager', category: 'Property ERP', protocol: 'mcp', secret: 'YARDI_OAUTH', connected: true, dept: 'Property Management' },
  { id: 'c-docusign',  brand: 'docusign',  name: 'DocuSign',      category: 'e-Signature', protocol: 'rest', secret: 'DOCUSIGN_OAUTH', connected: true, dept: 'Legal' },
  { id: 'c-appfolio',  brand: 'appfolio',  name: 'AppFolio',      category: 'Property Mgmt', protocol: 'rest', secret: 'APPFOLIO_API', connected: true, dept: 'Leasing' },
  { id: 'c-mri',       brand: 'mri',       name: 'MRI Software',  category: 'Real Estate ERP', protocol: 'mcp', secret: null, connected: false, dept: 'Asset Management' },
  { id: 'c-stripe',    brand: 'stripe',    name: 'Stripe',        category: 'Rent Payments', protocol: 'rest', secret: 'STRIPE_RESTRICTED', connected: false, dept: 'Finance' },
  { id: 'c-procore',   brand: 'procore',   name: 'Procore',       category: 'Construction', protocol: 'rest', secret: null, connected: false, dept: 'Facilities' },
  { id: 'c-salesforce',brand: 'salesforce',name: 'Salesforce',    category: 'CRM', protocol: 'mcp', secret: null, connected: false, dept: 'Marketing' },
  // ---- more ERP / property-finance systems ----
  { id: 'c-realpage',  brand: 'realpage',  name: 'RealPage',      category: 'Property ERP', protocol: 'mcp', secret: 'REALPAGE_API', connected: true,  dept: 'Property Management' },
  { id: 'c-entrata',   brand: 'entrata',   name: 'Entrata',       category: 'Property ERP', protocol: 'rest', secret: null, connected: false, dept: 'Property Management' },
  { id: 'c-netsuite',  brand: 'netsuite',  name: 'Oracle NetSuite', category: 'ERP', protocol: 'rest', secret: 'NETSUITE_TBA', connected: true, dept: 'Finance' },
  { id: 'c-dynamics',  brand: 'dynamics',  name: 'Dynamics 365',  category: 'ERP', protocol: 'mcp', secret: null, connected: false, dept: 'Asset Management' },
  { id: 'c-sage',      brand: 'sage',      name: 'Sage Intacct',  category: 'Accounting ERP', protocol: 'rest', secret: null, connected: false, dept: 'Finance' },
  { id: 'c-buildium',  brand: 'buildium',  name: 'Buildium',      category: 'Property Mgmt', protocol: 'mcp', secret: null, connected: false, dept: 'Leasing' },
  { id: 'c-coupa',     brand: 'coupa',     name: 'Coupa',         category: 'Procurement ERP', protocol: 'rest', secret: null, connected: false, dept: 'Facilities' },
];

// ---- Tasks -----------------------------------------------------------------
export const TASKS = [
  { id: 'task-1', title: 'Generate June rent roll and flag delinquencies', dept: 'Property Management', status: 'in-progress', priority: 'high', type: 'analysis', assigneeType: 'ai', assignee: 'emp-1', delegateTo: 'emp-2', dueDate: '2026-06-26', owner: 'member-1' },
  { id: 'task-2', title: 'Dispatch 12 open maintenance work orders', dept: 'Property Management', status: 'in-progress', priority: 'medium', type: 'sync', assigneeType: 'ai', assignee: 'emp-2', delegateTo: null, dueDate: '2026-06-24', owner: 'member-1' },
  { id: 'task-3', title: 'Audit lease renewals for compliance', dept: 'Property Management', status: 'review', priority: 'critical', type: 'audit', assigneeType: 'ai', assignee: 'emp-3', delegateTo: null, dueDate: '2026-06-24', owner: 'head-1' },
  { id: 'task-4', title: 'Schedule inspection at Maple Court #12', dept: 'Property Management', status: 'todo', priority: 'low', type: 'sync', assigneeType: 'human', assignee: 'member-1', delegateTo: null, dueDate: '2026-06-27', owner: 'member-1' },
  { id: 'task-5', title: 'Draft tenant delinquency notices', dept: 'Property Management', status: 'todo', priority: 'medium', type: 'drafting', assigneeType: 'human', assignee: 'member-1', delegateTo: null, dueDate: '2026-06-28', owner: 'member-1' },
  { id: 'task-6', title: 'Reconcile May rent payments in ERP', dept: 'Finance', status: 'in-progress', priority: 'high', type: 'analysis', assigneeType: 'ai', assignee: 'emp-5', delegateTo: 'emp-6', dueDate: '2026-06-25', owner: 'head-1' },
  { id: 'task-7', title: 'Syndicate 8 new unit listings', dept: 'Leasing', status: 'done', priority: 'medium', type: 'sync', assigneeType: 'ai', assignee: 'emp-7', delegateTo: null, dueDate: '2026-06-20', owner: 'admin-1' },
  { id: 'task-8', title: 'Prepare Q3 leasing campaign brief', dept: 'Marketing', status: 'todo', priority: 'medium', type: 'drafting', assigneeType: 'ai', assignee: 'emp-10', delegateTo: null, dueDate: '2026-06-30', owner: 'admin-1' },
  { id: 'task-9', title: 'Onboard tenant at Birch Tower #204', dept: 'Leasing', status: 'done', priority: 'low', type: 'sync', assigneeType: 'ai', assignee: 'emp-9', delegateTo: null, dueDate: '2026-06-19', owner: 'admin-1' },
  { id: 'task-10', title: 'Review vendor service agreement redlines', dept: 'Legal', status: 'review', priority: 'high', type: 'audit', assigneeType: 'ai', assignee: 'emp-11', delegateTo: null, dueDate: '2026-06-26', owner: 'admin-1' },
  // Human tasks owned by the department head (so Head's My Work isn't empty)
  { id: 'task-11', title: 'Approve June rent roll variance for Maple Court', dept: 'Property Management', status: 'todo', priority: 'high', type: 'review', assigneeType: 'human', assignee: 'head-1', delegateTo: null, dueDate: '2026-06-26', owner: 'head-1' },
  { id: 'task-12', title: 'Finalize renewal terms with Cedar Lofts tenants', dept: 'Property Management', status: 'in-progress', priority: 'medium', type: 'drafting', assigneeType: 'human', assignee: 'head-1', delegateTo: null, dueDate: '2026-06-29', owner: 'head-1' },
  { id: 'task-13', title: 'Review Q3 staffing plan for the department', dept: 'Property Management', status: 'todo', priority: 'low', type: 'review', assigneeType: 'human', assignee: 'head-1', delegateTo: null, dueDate: '2026-07-02', owner: 'head-1' },
  // Platform-admin human tasks (so Sam Chen's My Work isn't empty)
  { id: 'task-14', title: 'Rotate Yardi & SAP vault credentials', dept: 'Governance', status: 'todo', priority: 'high', type: 'review', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-26', owner: 'admin-1' },
  { id: 'task-15', title: 'Approve Acquisitions department onboarding', dept: 'Acquisitions', status: 'todo', priority: 'medium', type: 'review', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-27', owner: 'admin-1' },
  { id: 'task-16', title: 'Review org-wide AI spend vs. budget guardrails', dept: 'Finance', status: 'in-progress', priority: 'high', type: 'analysis', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-25', owner: 'admin-1' },
  { id: 'task-17', title: 'Validate new Stripe connector OAuth scopes', dept: 'Finance', status: 'in-progress', priority: 'medium', type: 'audit', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-28', owner: 'admin-1' },
  { id: 'task-18', title: 'Sign off on quarterly governance & access audit', dept: 'Legal', status: 'review', priority: 'critical', type: 'audit', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-24', owner: 'admin-1' },
  { id: 'task-19', title: 'Review effectiveness rollup before board readout', dept: 'Asset Management', status: 'review', priority: 'high', type: 'review', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-26', owner: 'admin-1' },
  { id: 'task-20', title: 'Publish updated AI employee usage policy', dept: 'Governance', status: 'done', priority: 'medium', type: 'drafting', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-20', owner: 'admin-1' },
  { id: 'task-21', title: 'Decommission unused Marketing connector', dept: 'Marketing', status: 'done', priority: 'low', type: 'sync', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-18', owner: 'admin-1' },
  { id: 'task-22', title: 'Set org-wide model & reasoning cost guardrails', dept: 'Governance', status: 'todo', priority: 'high', type: 'review', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-29', owner: 'admin-1' },
  { id: 'task-23', title: 'Review pending RBAC role-change requests', dept: 'Governance', status: 'todo', priority: 'medium', type: 'review', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-30', owner: 'admin-1' },
  { id: 'task-24', title: 'Audit Knowledge Sphere source ingestion pipeline', dept: 'Asset Management', status: 'in-progress', priority: 'medium', type: 'audit', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-07-01', owner: 'admin-1' },
  { id: 'task-25', title: 'Reconcile vault secret rotation log for SOC 2', dept: 'Legal', status: 'review', priority: 'high', type: 'audit', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-27', owner: 'admin-1' },
  { id: 'task-26', title: 'Archive Q1 onboarding runbooks', dept: 'Governance', status: 'done', priority: 'low', type: 'drafting', assigneeType: 'human', assignee: 'admin-1', delegateTo: null, dueDate: '2026-06-15', owner: 'admin-1' },
];

// ---- Approvals (routed to a task owner, created by an AI employee) ----------
export const APPROVALS = [
  { id: 'app-1', title: 'Send delinquency notices to 9 tenants', type: 'deploy', risk: 'medium', dept: 'Property Management', requestedBy: 'emp-1', ownerId: 'member-1', createdAt: '2026-06-24T08:10:00Z', detail: 'Atlas wants to send delinquency notices via the tenant-notice Unit of Work.' },
  { id: 'app-2', title: 'Override rent variance on invoice #4821 in ERP', type: 'budget', risk: 'high', dept: 'Finance', requestedBy: 'emp-5', ownerId: 'head-1', createdAt: '2026-06-24T07:40:00Z', detail: 'Ledger found a $1,240 variance between Yardi and SAP and requests approval to reconcile.' },
  { id: 'app-3', title: 'Grant Scout work-order write scope on Maple Court', type: 'access', risk: 'low', dept: 'Property Management', requestedBy: 'emp-2', ownerId: 'member-1', createdAt: '2026-06-23T18:25:00Z', detail: 'Scout needs workorders:write on the Maple Court property to dispatch vendors.' },
  { id: 'app-4', title: 'Execute lease for Birch Tower #204', type: 'config', risk: 'medium', dept: 'Leasing', requestedBy: 'emp-9', ownerId: 'admin-1', createdAt: '2026-06-23T15:00:00Z', detail: 'Onboard wants to send the lease for e-signature via DocuSign.' },
];

// ---- Inbox questions -------------------------------------------------------
export const QUESTIONS = [
  { id: 'q-1', title: 'Override the ERP rent value for Maple Court or hold?', assignedTo: 'emp-5', dept: 'Finance', status: 'pending', urgency: 'high',
    body: 'I found a $1,240 variance between Yardi and the SAP ERP. Should I override the ERP value or hold for review?' },
  { id: 'q-2', title: 'Merge the duplicate leak work orders or escalate?', assignedTo: 'emp-2', dept: 'Property Management', status: 'pending', urgency: 'medium',
    body: 'Two tenants reported the same leak. Should I escalate to Facilities or batch them into one work order?' },
  { id: 'q-3', title: 'Is the 1st still the move-in date for Birch Tower #204?', assignedTo: 'emp-9', dept: 'Leasing', status: 'answered', urgency: 'low',
    body: 'Is the 1st still the move-in date for the new tenant?' },
  { id: 'q-4', title: 'Approve the 9% Cedar Lofts renewal or hold at 7%?', assignedTo: 'emp-3', dept: 'Property Management', status: 'pending', urgency: 'high',
    body: 'The Cedar Lofts renewal proposes a 9% rent increase, above the 7% policy cap. Approve the exception or hold at 7%?' },
  { id: 'q-5', title: 'Block the unmatched Apex HVAC invoice or route for approval?', assignedTo: 'emp-6', dept: 'Finance', status: 'pending', urgency: 'high',
    body: 'A $14,500 invoice from Apex HVAC has no matching purchase order. Should I block payment or route for manual approval?' },
  { id: 'q-6', title: 'Accept the vendor\'s indemnification redline or escalate?', assignedTo: 'emp-11', dept: 'Legal', status: 'pending', urgency: 'high',
    body: 'The vendor struck our indemnification clause. Accept their language or escalate to outside counsel?' },
  { id: 'q-7', title: 'Dispatch the on-call vendor for the burst pipe now?', assignedTo: 'emp-12', dept: 'Facilities', status: 'pending', urgency: 'high',
    body: 'Burst pipe reported at Oakwood #7 at 11pm. Dispatch the on-call vendor at premium rate or wait until morning?' },
  { id: 'q-8', title: 'Shift $3K from paid social to search?', assignedTo: 'emp-10', dept: 'Marketing', status: 'pending', urgency: 'medium',
    body: 'The Q3 listing campaign is pacing 20% under target. Shift $3K from paid social to search?' },
  { id: 'q-9', title: 'Keep underwriting Riverside or pause for the easement?', assignedTo: 'emp-15', dept: 'Acquisitions', status: 'pending', urgency: 'medium',
    body: 'The Riverside parcel has an unresolved easement on title. Continue underwriting or pause for legal review?' },
  { id: 'q-10', title: 'Model a concession plan for the South region or hold pricing?', assignedTo: 'emp-13', dept: 'Asset Management', status: 'pending', urgency: 'medium',
    body: 'Occupancy at the South region dropped to 88%. Should I model a concession plan or hold current pricing?' },
  { id: 'q-11', title: 'Send the delinquency reminder as-is or soften it?', assignedTo: 'emp-4', dept: 'Property Management', status: 'pending', urgency: 'low',
    body: 'Drafted a delinquency reminder for 14 tenants. Send as-is or soften the wording for first-time late payers?' },
  { id: 'q-12', title: 'Delist the duplicate Maple Court #12 listing or merge leads?', assignedTo: 'emp-7', dept: 'Leasing', status: 'pending', urgency: 'low',
    body: 'Unit Maple Court #12 appears on Zillow twice. Should I delist the older one or merge the leads?' },
  { id: 'q-13', title: 'Remind the owner or file the fair-housing cert provisionally?', assignedTo: 'emp-17', dept: 'Legal', status: 'pending', urgency: 'medium',
    body: 'The annual fair-housing certification is due in 3 days and one signature is missing. Remind the owner or file provisionally?' },
  { id: 'q-14', title: 'Send the 60-day rent-increase notices now or stagger them?', assignedTo: 'emp-1', dept: 'Property Management', status: 'pending', urgency: 'medium',
    body: 'State law requires 60 days notice for increases above 10%. Two units cross that threshold — send notices now or stagger them?' },
  { id: 'q-15', title: 'Refund the disputed $850 deposit or hold for photos?', assignedTo: 'emp-4', dept: 'Property Management', status: 'pending', urgency: 'high',
    body: 'A former tenant disputes $850 in damage deductions. Refund in full to avoid escalation or hold pending the inspection photos?' },
  { id: 'q-16', title: 'Merge the duplicate Apex HVAC vendor records?', assignedTo: 'emp-6', dept: 'Finance', status: 'pending', urgency: 'low',
    body: 'Apex HVAC appears under two vendor IDs with different tax info. Merge them or flag for the controller to reconcile?' },
  { id: 'q-17', title: 'Auto-book the after-hours Cedar Lofts tour or route to an agent?', assignedTo: 'emp-8', dept: 'Leasing', status: 'pending', urgency: 'medium',
    body: 'A high-intent lead came in for Cedar Lofts penthouse after hours. Auto-book a tour or route to a human agent first?' },
  { id: 'q-18', title: 'Reschedule the Oakwood booking clash or run split crews?', assignedTo: 'emp-12', dept: 'Facilities', status: 'pending', urgency: 'low',
    body: 'HVAC servicing and the fire-panel inspection are booked the same morning at Oakwood. Reschedule one or run both with split crews?' },
  { id: 'q-19', title: 'Re-run Riverside at 2% rent growth before the IC meeting?', assignedTo: 'emp-16', dept: 'Acquisitions', status: 'pending', urgency: 'medium',
    body: 'The Riverside model assumes 3% annual rent growth. Comps suggest 2%. Re-run at the conservative rate before the IC meeting?' },
  { id: 'q-20', title: 'Book the South region markdown or wait for the appraisal?', assignedTo: 'emp-14', dept: 'Asset Management', status: 'pending', urgency: 'high',
    body: 'The South region revaluation implies a 40bps cap-rate expansion. Book the markdown or wait for the next appraisal cycle?' },
  { id: 'q-21', title: 'Reply to the listing complaint publicly or move it to DM?', assignedTo: 'emp-10', dept: 'Marketing', status: 'pending', urgency: 'low',
    body: 'A prospect posted a complaint about a listing photo. Reply publicly with an apology or move it to DM first?' },
  { id: 'q-22', title: 'Block the roofing vendor with a lapsed COI or accept a renewal?', assignedTo: 'emp-11', dept: 'Legal', status: 'pending', urgency: 'high',
    body: 'A roofing vendor scheduled for tomorrow has a lapsed COI. Block them from site or accept a same-day renewal email?' },
  { id: 'q-23', title: 'Waive the $75 late fee after the bank error?', assignedTo: 'emp-5', dept: 'Finance', status: 'pending', urgency: 'medium',
    body: 'A long-tenured tenant asked to waive a $75 late fee after a bank error. Approve the one-time waiver or apply policy strictly?' },
  { id: 'q-24', title: 'Remind, call, or wait on the three unopened renewals?', assignedTo: 'emp-9', dept: 'Leasing', status: 'pending', urgency: 'low',
    body: 'Three renewal offers sent 10 days ago remain unopened. Send a reminder, call, or hold until the 30-day mark?' },
  { id: 'q-25', title: 'Source the back-ordered compressor at +15% or wait?', assignedTo: 'emp-2', dept: 'Property Management', status: 'pending', urgency: 'medium',
    body: 'The replacement compressor for Maple Court #9 is back-ordered two weeks. Source from an alternate vendor at +15% or wait?' },
  { id: 'q-26', title: 'Tag the uncertain PDF as an amendment or escalate for review?', assignedTo: 'emp-17', dept: 'Legal', status: 'pending', urgency: 'low',
    body: 'An uploaded PDF could be either an amendment or a fully restated lease. Tag it as amendment or escalate for human review?' },

  // ---- Genuine human-judgment calls: policy exceptions, risk/retention trade-offs,
  // legal/ethical decisions and capital approvals an AI shouldn't make on its own.
  { id: 'q-27', title: 'Evict or offer a payment plan to a 3-months-late tenant?', assignedTo: 'emp-1', dept: 'Property Management', status: 'pending', urgency: 'high',
    body: 'Birch Tower #112 is 3 months ($4,650) behind. They are a 6-year tenant who just lost a job. File for eviction per policy, or offer a 4-month repayment plan? This is your call.' },
  { id: 'q-28', title: 'Accept a below-market renewal to keep our anchor tenant?', assignedTo: 'emp-8', dept: 'Leasing', status: 'pending', urgency: 'high',
    body: 'Our anchor retail tenant at Harbor Point will only renew at $28/sqft vs the $33 asking. They drive foot traffic for the whole center. Hold firm or accept the $5 concession?' },
  { id: 'q-29', title: 'Approve the $86k roof replacement or patch for another season?', assignedTo: 'emp-12', dept: 'Facilities', status: 'pending', urgency: 'high',
    body: 'Engineer flags the Oakwood roof at end-of-life. Full replacement is $86,000 (above my $25k authority); a patch buys ~12 months at $9,000 but risks interior damage. Which way do you want to go?' },
  { id: 'q-30', title: 'Settle the slip-and-fall claim at $12k or refer to insurer/counsel?', assignedTo: 'emp-11', dept: 'Legal', status: 'pending', urgency: 'high',
    body: 'A tenant slipped on an un-salted walkway and is asking $12,000 to settle. Liability is arguable. Settle quietly, or refer to our insurer and risk a larger claim plus publicity? Needs a human decision.' },
  { id: 'q-31', title: 'Grant the ADA accommodation as requested, at $7k cost?', assignedTo: 'emp-4', dept: 'Property Management', status: 'pending', urgency: 'medium',
    body: 'A tenant requested a reserved accessible parking spot plus a ramp ($7,000). It is reasonable but reduces rentable spaces by two. Approve as requested, propose an alternative, or get counsel involved first?' },
  { id: 'q-32', title: 'Raise our LOI above the $14.2M model to win Riverside?', assignedTo: 'emp-15', dept: 'Acquisitions', status: 'pending', urgency: 'high',
    body: 'Riverside is going to best-and-final. To win we likely need ~$14.8M vs our $14.2M underwriting (drops IRR from 16% to 14%). Bid up, hold at model, or walk? Strategic call for you.' },
  { id: 'q-33', title: 'Waive the no-pet clause for an emotional-support animal?', assignedTo: 'emp-17', dept: 'Legal', status: 'pending', urgency: 'medium',
    body: 'A tenant submitted an ESA letter for a dog that exceeds our weight limit. Fair-housing law likely requires accommodation, but the letter looks templated. Accept it, request verification, or escalate to counsel?' },
  { id: 'q-34', title: 'Approve a hardship rent deferral for the Cedar Lofts tenant?', assignedTo: 'emp-5', dept: 'Finance', status: 'pending', urgency: 'medium',
    body: 'A tenant requests deferring $2,100 of rent over 3 months after a medical emergency. Policy says no, but they have a clean 4-year history. Approve the exception, offer partial, or decline?' },
  { id: 'q-35', title: 'Drop the vendor after a job-site safety incident?', assignedTo: 'emp-6', dept: 'Finance', status: 'pending', urgency: 'medium',
    body: 'Apex HVAC — our cheapest and fastest vendor — had an OSHA-reportable incident at another client. Keep them, require a safety plan before the next job, or switch to the 18%-pricier alternate?' },
  { id: 'q-36', title: 'Reclassify the South portfolio from hold to sell?', assignedTo: 'emp-13', dept: 'Asset Management', status: 'pending', urgency: 'medium',
    body: 'South region occupancy has slipped to 86% for two quarters and cap rates are softening. Recommend listing two assets now, holding for recovery, or refinancing? This shifts strategy — your decision.' },
  { id: 'q-37', title: 'Authorize legal action against the defaulting commercial tenant?', assignedTo: 'emp-11', dept: 'Legal', status: 'pending', urgency: 'high',
    body: 'The Sycamore Plaza commercial tenant is $31k in arrears and has stopped responding. Send a formal default notice and begin proceedings, or attempt one more negotiated workout? Needs your authorization.' },
  { id: 'q-38', title: 'Run a "luxury" campaign claim past fair-housing review?', assignedTo: 'emp-10', dept: 'Marketing', status: 'pending', urgency: 'medium',
    body: 'Draft listing copy describes Pinecrest as "perfect for young professionals." That phrasing could raise fair-housing concerns. Soften it myself, run it as-is, or hold for legal/your sign-off?' },
  { id: 'q-39', title: 'Accept early lease termination and waive the 2-month penalty?', assignedTo: 'emp-9', dept: 'Leasing', status: 'pending', urgency: 'low',
    body: 'A tenant relocating for work wants out 5 months early and asks us to waive the 2-month ($3,600) penalty. We can likely re-lease in 3 weeks. Waive it for goodwill, charge in full, or split the difference?' },
  { id: 'q-40', title: 'Pick the higher rent or the stronger applicant for Elm St #5?', assignedTo: 'emp-7', dept: 'Leasing', status: 'pending', urgency: 'medium',
    body: 'Two applications for Elm Street #5: one offers $200/mo above ask but a thin credit file; the other is well-qualified at asking. Both pass screening. Which do you want me to advance?' },
];

// ============================================================
// Knowledge graph — a GraphRAG-style real-estate ontology. Structured entities
// (owners, properties, units, leases…) carry rich properties + descriptions,
// and are GROUNDED in unstructured knowledge sources (documents, video, audio)
// linked by typed provenance edges — exactly what you'd inspect in GraphRAG.
// ============================================================
export const KG_CATEGORIES = ['Owner', 'Property', 'Unit', 'Lease', 'Tenant', 'Vendor', 'WorkOrder', 'Invoice', 'Document', 'Video', 'Audio'];
// Categories that represent unstructured knowledge sources (vs. structured entities).
export const KG_SOURCE_CATEGORIES = ['Document', 'Video', 'Audio'];

export function genKnowledgeGraph() {
  const nodes = []; const links = [];
  const add = (id, label, category, dept, weight = 4, meta = {}) => {
    nodes.push({ id, label, category, dept, weight, description: meta.description || '', properties: meta.properties || {} });
    return id;
  };
  const link = (source, target, type) => links.push({ source, target, type });

  const OWNERS = [
    { name: 'Northwind Capital', desc: 'Institutional real-estate investment firm; holds the Maple Court and Birch Tower assets in its core-plus fund.',
      props: { Type: 'Institutional investor', 'Portfolio AUM': '$1.24B', 'Assets held': '2 properties', 'Investor since': '2012', 'Primary contact': 'L. Brandt' } },
    { name: 'Cedar Holdings', desc: 'Private holding company owning the Oak Plaza and Cedar Lofts communities through a single-asset LLC structure.',
      props: { Type: 'Private holding co.', 'Portfolio AUM': '$680M', 'Assets held': '2 properties', 'Investor since': '2016', 'Primary contact': 'R. Vance' } },
  ];
  const PROPS = [
    { name: 'Maple Court', dept: 'Property Management', owner: 0, units: 3, address: '1420 Maple Ct, Austin TX', year: 2008, sqft: '184,000', cap: '5.8%', occ: '94%' },
    { name: 'Birch Tower', dept: 'Leasing', owner: 0, units: 3, address: '88 Birch Ave, Austin TX', year: 2015, sqft: '226,500', cap: '5.2%', occ: '97%' },
    { name: 'Oak Plaza', dept: 'Asset Management', owner: 1, units: 2, address: '500 Oak Plaza Blvd, Dallas TX', year: 2001, sqft: '142,000', cap: '6.4%', occ: '89%' },
    { name: 'Cedar Lofts', dept: 'Property Management', owner: 1, units: 2, address: '17 Cedar St, Dallas TX', year: 2019, sqft: '98,000', cap: '5.0%', occ: '92%' },
  ];
  const VENDORS = [
    { name: 'Apex HVAC', desc: 'Mechanical contractor handling heating, ventilation and AC across the Austin portfolio.', props: { Trade: 'HVAC / Mechanical', Rating: '4.7 / 5', 'Active work orders': 6, 'Contract ends': '2026-12-31', 'On-time rate': '96%' } },
    { name: 'BrightClean Co', desc: 'Janitorial and turn-cleaning vendor servicing common areas and unit make-readies.', props: { Trade: 'Janitorial', Rating: '4.4 / 5', 'Active work orders': 3, 'Contract ends': '2026-09-30', 'On-time rate': '91%' } },
    { name: 'SecureGuard', desc: 'Physical security and access-control provider monitoring building entry systems.', props: { Trade: 'Security', Rating: '4.6 / 5', 'Active work orders': 2, 'Contract ends': '2027-03-31', 'On-time rate': '98%' } },
  ];

  OWNERS.forEach((o, i) => add(`owner-${i}`, o.name, 'Owner', 'Asset Management', 7, { description: o.desc, properties: o.props }));
  VENDORS.forEach((v, i) => add(`vendor-${i}`, v.name, 'Vendor', 'Facilities', 5, { description: v.desc, properties: v.props }));

  let unitN = 0, leaseN = 0, tenantN = 0, woN = 0, invN = 0;
  PROPS.forEach((p, pi) => {
    const pid = add(`prop-${pi}`, p.name, 'Property', p.dept, 8, {
      description: `${p.name} is a ${p.units}-unit asset at ${p.address}, managed by ${p.dept}. Stabilized at ${p.occ} occupancy with a ${p.cap} cap rate.`,
      properties: { Address: p.address, Units: p.units, 'Rentable sqft': p.sqft, 'Year built': p.year, Occupancy: p.occ, 'Cap rate': p.cap, Manager: p.dept },
    });
    link(pid, `owner-${p.owner}`, 'owned_by');
    for (let u = 0; u < p.units; u++) {
      const beds = 1 + (unitN % 3), rent = 1800 + ((unitN * 175) % 1400);
      const uid = add(`unit-${unitN}`, `${p.name} #${100 + u}`, 'Unit', p.dept, 4, {
        description: `${beds}-bed unit in ${p.name}. ${(unitN + u) % 3 !== 2 ? 'Currently leased and occupied.' : 'Vacant — available for lease.'}`,
        properties: { Beds: beds, Baths: 1 + (unitN % 2), 'Floor area': `${680 + (unitN * 90) % 720} sqft`, 'Market rent': `$${rent.toLocaleString()}/mo`, Status: (unitN + u) % 3 !== 2 ? 'Occupied' : 'Vacant' },
      });
      link(pid, uid, 'has_unit');
      // most units are leased
      if ((unitN + u) % 3 !== 2) {
        const lid = add(`lease-${leaseN}`, `Lease L-${1000 + leaseN}`, 'Lease', 'Leasing', 4, {
          description: `12-month residential lease on ${p.name} #${100 + u} at $${rent.toLocaleString()}/mo, signed via DocuSign.`,
          properties: { Term: '12 months', 'Start date': `2025-${String(1 + (leaseN % 9)).padStart(2, '0')}-01`, 'Monthly rent': `$${rent.toLocaleString()}`, Deposit: `$${rent.toLocaleString()}`, Status: leaseN % 4 === 3 ? 'Expiring soon' : 'Active' },
        });
        link(uid, lid, 'leased_as');
        const tid = add(`tenant-${tenantN}`, `Tenant T-${200 + tenantN}`, 'Tenant', 'Leasing', 4, {
          description: `Resident of ${p.name} #${100 + u}. ${tenantN % 3 === 0 ? 'Has an outstanding balance under review.' : 'Account in good standing.'}`,
          properties: { 'Resident since': `2025-${String(1 + (tenantN % 9)).padStart(2, '0')}-04`, Balance: tenantN % 3 === 0 ? `$${(120 + tenantN * 47) % 1400}` : '$0', 'Credit score': 640 + (tenantN * 13) % 180, 'Contact pref': tenantN % 2 ? 'Email' : 'SMS' },
        });
        link(lid, tid, 'occupied_by');
        // an invoice billed to the tenant
        const amt = 1800 + ((invN * 230) % 1600);
        const iid = add(`inv-${invN}`, `Invoice INV-${4800 + invN}`, 'Invoice', 'Finance', 3, {
          description: `Rent invoice billed to Tenant T-${200 + tenantN}. ${invN % 4 === 0 ? 'Past due — escalated to collections workflow.' : 'Paid on time.'}`,
          properties: { Amount: `$${amt.toLocaleString()}`, Issued: '2026-06-01', Due: '2026-06-05', Status: invN % 4 === 0 ? 'Past due' : 'Paid', Method: invN % 2 ? 'ACH' : 'Card' },
        });
        link(iid, tid, 'billed_to');
        invN++; leaseN++; tenantN++;
      }
      // some units have an open work order serviced by a vendor
      if (unitN % 2 === 0) {
        const pri = ['Low', 'Medium', 'High'][woN % 3];
        const wid = add(`wo-${woN}`, `Work Order WO-${300 + woN}`, 'WorkOrder', 'Facilities', 3, {
          description: `${pri}-priority maintenance request on ${p.name} #${100 + u}, dispatched to ${VENDORS[woN % VENDORS.length].name}.`,
          properties: { Priority: pri, Status: woN % 3 === 0 ? 'Open' : woN % 3 === 1 ? 'In progress' : 'Closed', Opened: `2026-06-${String(10 + (woN % 18)).padStart(2, '0')}`, 'SLA target': `${24 + (woN % 3) * 24}h`, Category: ['Plumbing', 'HVAC', 'Electrical'][woN % 3] },
        });
        link(wid, uid, 'against_unit');
        link(wid, `vendor-${woN % VENDORS.length}`, 'serviced_by');
        woN++;
      }
      unitN++;
    }
  });

  // ---- Unstructured knowledge sources (GraphRAG provenance) -----------------
  // Each artifact is ingested, chunked/segmented and linked to the entities it
  // grounds. Clicking a source shows its format, size, ingest run and chunks.
  const SOURCES = [
    { id: 'doc-lease-0', label: 'Lease Agreement — L-1000.pdf', cat: 'Document', dept: 'Legal',
      desc: 'Executed 12-month residential lease for Maple Court #100, including rent schedule, deposit terms and signatures.',
      props: { Format: 'PDF', Pages: 14, Size: '2.1 MB', Uploaded: '2026-05-02', Source: 'DocuSign envelope', 'Chunks indexed': 38, OCR: 'Complete' },
      edges: [['lease-0', 'documents'], ['tenant-0', 'mentions'], ['unit-0', 'references']] },
    { id: 'doc-inspect-0', label: 'Inspection Report — Maple Court.pdf', cat: 'Document', dept: 'Facilities',
      desc: 'Annual property condition assessment for Maple Court covering roof, HVAC and life-safety systems.',
      props: { Format: 'PDF', Pages: 27, Size: '6.4 MB', Uploaded: '2026-04-18', Source: 'Procore export', 'Chunks indexed': 71, OCR: 'Complete' },
      edges: [['prop-0', 'describes'], ['wo-0', 'evidence_for']] },
    { id: 'doc-contract-0', label: 'Service Contract — Apex HVAC.pdf', cat: 'Document', dept: 'Legal',
      desc: 'Master service agreement governing HVAC maintenance SLAs, rates and coverage for the Austin portfolio.',
      props: { Format: 'PDF', Pages: 19, Size: '1.8 MB', Uploaded: '2026-01-09', Source: 'Vendor upload', 'Chunks indexed': 44, OCR: 'Complete' },
      edges: [['vendor-0', 'governs'], ['prop-0', 'covers']] },
    { id: 'doc-appraisal-0', label: 'Appraisal Report — Oak Plaza.pdf', cat: 'Document', dept: 'Asset Management',
      desc: 'Third-party valuation establishing Oak Plaza market value, comparable sales and income approach.',
      props: { Format: 'PDF', Pages: 52, Size: '9.2 MB', Uploaded: '2026-03-30', Source: 'CBRE Valuation', 'Chunks indexed': 118, OCR: 'Complete' },
      edges: [['prop-2', 'values'], ['owner-1', 'prepared_for']] },
    { id: 'doc-insurance-0', label: 'Insurance Policy — Northwind.pdf', cat: 'Document', dept: 'Legal',
      desc: 'Master property & casualty policy schedule covering the Northwind Capital portfolio with per-asset limits.',
      props: { Format: 'PDF', Pages: 33, Size: '4.7 MB', Uploaded: '2026-02-14', Source: 'Broker bordereau', 'Chunks indexed': 86, OCR: 'Complete' },
      edges: [['owner-0', 'covers'], ['prop-1', 'insures']] },
    { id: 'doc-ledger-0', label: 'Tenant Ledger — INV-4800.pdf', cat: 'Document', dept: 'Finance',
      desc: 'Resident ledger statement reconciling charges, payments and the outstanding balance behind invoice INV-4800.',
      props: { Format: 'PDF', Pages: 3, Size: '0.4 MB', Uploaded: '2026-06-02', Source: 'Yardi export', 'Chunks indexed': 9, OCR: 'Complete' },
      edges: [['inv-0', 'supports'], ['tenant-0', 'summarizes']] },
    { id: 'vid-tour-1', label: 'Property Walkthrough — Birch Tower.mp4', cat: 'Video', dept: 'Leasing',
      desc: 'Leasing walkthrough video of Birch Tower amenities and a representative unit, used for virtual tours.',
      props: { Format: 'MP4 · 1080p', Duration: '8m 42s', Size: '486 MB', Uploaded: '2026-05-21', Transcript: 'Auto-generated', 'Segments indexed': 52 },
      edges: [['prop-1', 'depicts']] },
    { id: 'vid-maint-0', label: 'Maintenance Recording — WO-300.mp4', cat: 'Video', dept: 'Facilities',
      desc: 'Body-cam capture of the HVAC repair performed under work order WO-300, retained for warranty evidence.',
      props: { Format: 'MP4 · 720p', Duration: '12m 05s', Size: '312 MB', Uploaded: '2026-06-12', Transcript: 'Auto-generated', 'Segments indexed': 41 },
      edges: [['wo-0', 'depicts'], ['vendor-0', 'performed_by']] },
    { id: 'vid-drone-2', label: 'Drone Survey — Oak Plaza.mp4', cat: 'Video', dept: 'Asset Management',
      desc: 'Aerial roof and façade survey of Oak Plaza captured for the capital-needs assessment.',
      props: { Format: 'MP4 · 4K', Duration: '5m 18s', Size: '1.1 GB', Uploaded: '2026-03-28', Transcript: 'N/A', 'Segments indexed': 33 },
      edges: [['prop-2', 'surveys']] },
    { id: 'aud-tenant-0', label: 'Tenant Call — T-200.mp3', cat: 'Audio', dept: 'Property Management',
      desc: 'Recorded support call with Tenant T-200 reporting an HVAC issue; transcript drives the work-order summary.',
      props: { Format: 'MP3', Duration: '6m 11s', Size: '8.7 MB', Recorded: '2026-06-09', Transcript: 'Available', 'Segments indexed': 18 },
      edges: [['tenant-0', 'records'], ['wo-0', 'evidence_for']] },
    { id: 'aud-vendor-0', label: 'Vendor Coordination Call — Apex.mp3', cat: 'Audio', dept: 'Facilities',
      desc: 'Scheduling call with Apex HVAC coordinating access and parts for the Maple Court repair.',
      props: { Format: 'MP3', Duration: '4m 03s', Size: '5.6 MB', Recorded: '2026-06-10', Transcript: 'Available', 'Segments indexed': 12 },
      edges: [['vendor-0', 'records'], ['prop-0', 'about']] },
  ];
  SOURCES.forEach(s => {
    add(s.id, s.label, s.cat, s.dept, 5, { description: s.desc, properties: s.props });
    s.edges.forEach(([target, type]) => link(s.id, target, type));
  });

  return { nodes, links, stats: { nodes: nodes.length, edges: links.length, categories: KG_CATEGORIES.length } };
}

const kgData = genKnowledgeGraph();
export const KNOWLEDGE_GRAPH = kgData;
export const KG_STATS = kgData.stats;

// ---- Agent avatars — deterministic professional gradient per agent ---------
export const AGENT_ANIMALS = ['🦊','🦁','🐯','🐼','🐨','🦄','🐧','🦉','🐙','🐢','🦋','🐬','🦅','🦔','🐝','🦦','🦝','🐺','🦒','🐘','🦛','🦏','🐳','🦈','🐶','🐱','🐰','🐹'];
export const AGENT_GRADS = [
  'linear-gradient(135deg, #3a7bd5, #4aa3c7)',
  'linear-gradient(135deg, #6a6fc4, #9277c0)',
  'linear-gradient(135deg, #2c9d8f, #4bb89a)',
  'linear-gradient(135deg, #c0617f, #d98a6a)',
  'linear-gradient(135deg, #4f8ac4, #5fb0a8)',
  'linear-gradient(135deg, #8169b8, #b06aa0)',
  'linear-gradient(135deg, #2f8fb0, #4cb3a0)',
  'linear-gradient(135deg, #c47a52, #cfa14a)',
];
const _hash = (id = '') => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; };
export const agentAnimal = (id = '') => AGENT_ANIMALS[_hash(id) % AGENT_ANIMALS.length];
export const agentGrad = (id = '') => AGENT_GRADS[_hash(id) % AGENT_GRADS.length];
export const agentSeed = (id = '') => _hash(id);
