// ============================================================================
// AI Employee Memory — the persistent workspace each employee reads from.
//
// Modelled on Google Cloud's Open Knowledge Format (OKF v0.1): a flat *bundle*
// of markdown *concept* files, one concept per file, each carrying YAML
// frontmatter whose only required key is `type`. Reserved files `index.md`
// (listing) and `log.md` (history) bookend the bundle. No nested folders.
//   file: { type:'file', name, kind:'md', updated, content }  (size derived)
//
// Everything is generated from the employee's own fields (dept, archetype,
// model, Units of Work) so the bundle is stable across renders.
// ============================================================================
import { modelById, reasoningById, uowsForEmployee } from './store.js';

const slug = (s = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Fixed reference "today" so file dates don't churn between renders.
const REF = new Date('2026-06-24T09:00:00');
function daysAgo(n) {
  const d = new Date(REF.getTime() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

const file = (name, kind, content, updatedDaysAgo = 0) => ({
  type: 'file', name, kind, updated: daysAgo(updatedDaysAgo), content,
});

// ---- Open Knowledge Format (OKF) helpers -----------------------------------
// Google Cloud's OKF (v0.1, June 2026) represents knowledge as a flat *bundle*
// of markdown files — one concept per file, each carrying YAML frontmatter whose
// only required key is `type`. We adopt it verbatim for employee memory: a
// simple bundle the agent reads directly, no folders, no bespoke tooling.
//   https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
function frontmatter({ type, title, description, tags, daysOld = 0 }) {
  const lines = [`type: ${type}`];
  if (title) lines.push(`title: ${title}`);
  if (description) lines.push(`description: ${description}`);
  if (tags && tags.length) lines.push(`tags: [${tags.join(', ')}]`);
  lines.push(`timestamp: ${daysAgo(daysOld)}T09:00:00Z`);
  return `---\n${lines.join('\n')}\n---\n\n`;
}

// A concept = one OKF markdown file (frontmatter + body).
const concept = (name, meta, body) =>
  file(name, 'md', frontmatter(meta) + body, meta.daysOld || 0);

// Build the employee's memory as a flat OKF bundle (root children). Reserved
// files `index.md` (bundle listing) and `log.md` (update history) bookend a
// handful of concept files — no nested folders, no tasks/outputs churn.
export function employeeMemory(emp) {
  if (!emp) return [];
  const m = modelById(emp.model), r = reasoningById(emp.reasoning);
  const dept = emp.dept;
  const playbook = `${slug(dept)}-playbook.md`;
  const uows = uowsForEmployee(emp);
  const connectors = [...new Set(uows.map(u => u.endpoint?.baseUrl).filter(Boolean))];

  return [
    // index.md — reserved: the bundle's table of contents.
    concept('index.md', {
      type: 'Index',
      title: `${emp.name} — Memory Bundle`,
      description: `Open Knowledge Format bundle of everything ${emp.name} reads from.`,
      daysOld: 0,
    },
`# ${emp.name} — Memory

This workspace is an **Open Knowledge Format** bundle: one concept per file, each
with YAML frontmatter. ${emp.name} reads these directly — no special tooling.

## Concepts
- [Identity](/identity.md) — role, mandate and reporting line
- [Operating Policies](/operating-policies.md) — how I act and what I escalate
- [Preferences](/preferences.md) — learned owner preferences
- [${dept} Playbook](/${playbook}) — standard operating procedures
- [Connected Systems](/connectors.md) — systems reached via the Meridian Proxy
- [Glossary](/glossary.md) — shared terms`),

    concept('identity.md', {
      type: 'Identity',
      title: `${emp.name} — ${emp.title}`,
      description: `Who ${emp.name} is and the mandate it operates under.`,
      tags: [slug(dept), slug(emp.archetype)],
      daysOld: 14,
    },
`# ${emp.name} — ${emp.title}

- **Department:** ${dept}
- **Archetype:** ${emp.archetype}
- **Model:** ${m.name} (${r.label} reasoning)
- **Status:** ${emp.status}

## Mandate
${emp.description}

I operate continuously, pick up assigned tasks and proactive workflow runs,
and escalate anything that needs a human decision.`),

    concept('operating-policies.md', {
      type: 'Policy',
      title: 'Operating Policies',
      description: 'The rules I follow on every run.',
      tags: ['governance', 'safety'],
      daysOld: 14,
    },
`# Operating Policies

1. **Least privilege** — I only call Units of Work composed into my workflows.
2. **Approvals** — any write/irreversible action is routed to a human owner
   before it completes. Read-only steps run autonomously.
3. **Secrets** — credentials are never read directly; every system call goes
   through the Meridian Proxy with vault-held credentials.
4. **Provenance** — every run records the workflow, Units of Work called and
   records touched into the activity log.`),

    concept('preferences.md', {
      type: 'Preferences',
      title: 'Learned Preferences',
      description: 'Owner preferences I have learned over time.',
      tags: ['owner', 'tuning'],
      daysOld: 3,
    },
`# Learned Preferences

- Owner prefers concise summaries with the decision up top.
- Batch low-risk items; surface exceptions individually.
- Quiet hours: no proactive notifications 21:00–06:00 local.`),

    concept(playbook, {
      type: 'Playbook',
      title: `${dept} Playbook`,
      description: `Standard operating procedures for ${dept} work.`,
      tags: [slug(dept), 'sop'],
      daysOld: 6,
    },
`# ${dept} Playbook

Standard operating procedures distilled from past runs.

## Triage order
1. Time-sensitive / SLA-bound items first.
2. High dollar-value exceptions.
3. Routine batch work.

## Known edge cases
- Records missing a unit reference → hold for owner review.
- Duplicate inbound events within 5 min → dedupe by external id.`),

    concept('connectors.md', {
      type: 'Reference',
      title: 'Connected Systems',
      description: 'Systems I reach, all brokered through the Meridian Proxy.',
      tags: ['systems', 'proxy'],
      daysOld: 9,
    },
`# Connected Systems

${connectors.length ? connectors.map(c => `- ${c}`).join('\n') : '- (no systems mapped yet)'}

All access is brokered through the Meridian Proxy. Scopes are granted per
Unit of Work; nothing here is a stored credential.`),

    concept('glossary.md', {
      type: 'Glossary',
      title: 'Glossary',
      description: 'Shared terms used across the platform.',
      tags: ['terms'],
      daysOld: 20,
    },
`# Glossary

- **UoW** — Unit of Work, an atomic, governed capability.
- **Run** — one execution of a workflow.
- **Baseline** — the manual time/cost a UoW replaces.`),

    // log.md — reserved: the bundle's update history.
    concept('log.md', {
      type: 'Log',
      title: 'Update history',
      daysOld: 0,
    },
`# Update history

- ${daysAgo(3)} — refreshed preferences from owner feedback
- ${daysAgo(6)} — added edge cases to the ${dept} playbook
- ${daysAgo(20)} — bundle initialized in Open Knowledge Format`),
  ];
}

// Byte size of a file's content (for display).
export function fileSize(node) {
  const bytes = node && node.content ? node.content.length : 0;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// Flatten counts for the header summary.
export function memoryStats(tree) {
  let folders = 0, files = 0;
  const walk = (nodes) => nodes.forEach(n => {
    if (n.type === 'folder') { folders++; walk(n.children || []); }
    else files++;
  });
  walk(tree);
  return { folders, files };
}
