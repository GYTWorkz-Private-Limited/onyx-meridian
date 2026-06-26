// ============================================================================
// AI Employee Memory — the persistent workspace each employee reads & writes.
//
// Every employee gets a deterministic *base* memory structure (instructions it
// operates from + knowledge it has learned) and a growing set of *task
// artifacts* written as work happens. The shape is a simple folder/file tree:
//   folder: { type:'folder', name, children:[] }
//   file:   { type:'file', name, kind, updated, content }  (size derived)
//
// Everything is generated from the employee's own fields (dept, archetype,
// model, workflows, Units of Work) so the tree is stable across renders.
// ============================================================================
import {
  modelById, reasoningById, employeeWorkflows, uowsForEmployee, uowById,
} from './store.js';

// Deterministic hash so per-employee variety is stable across renders.
function seed(s = '') {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

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
const folder = (name, children) => ({ type: 'folder', name, children });

// ---- Base instructions every employee carries ------------------------------
function instructionsFolder(emp) {
  const m = modelById(emp.model), r = reasoningById(emp.reasoning);
  return folder('instructions', [
    file('identity.md', 'md',
`# ${emp.name} — ${emp.title}

- **Department:** ${emp.dept}
- **Archetype:** ${emp.archetype}
- **Model:** ${m.name} (${r.label} reasoning)
- **Status:** ${emp.status}

## Mandate
${emp.description}

I operate continuously, pick up assigned tasks and proactive workflow runs,
and escalate anything that needs a human decision.`, 14),
    file('operating-policies.md', 'md',
`# Operating Policies

1. **Least privilege** — I only call Units of Work composed into my workflows.
2. **Approvals** — any write/irreversible action is routed to a human owner
   before it completes. Read-only steps run autonomously.
3. **Secrets** — credentials are never read directly; every system call goes
   through the Meridian Proxy with vault-held credentials.
4. **Provenance** — every run records the workflow, Units of Work called and
   records touched into \`tasks/\`.`, 14),
    file('preferences.md', 'md',
`# Learned Preferences

- Owner prefers concise summaries with the decision up top.
- Batch low-risk items; surface exceptions individually.
- Quiet hours: no proactive notifications 21:00–06:00 local.`, 3),
  ]);
}

// ---- Knowledge the employee has accumulated --------------------------------
function knowledgeFolder(emp) {
  const uows = uowsForEmployee(emp);
  const connectors = [...new Set(uows.map(u => u.endpoint?.baseUrl).filter(Boolean))];
  return folder('knowledge', [
    file(`${slug(emp.dept)}-playbook.md`, 'md',
`# ${emp.dept} Playbook

Standard operating procedures distilled from past runs.

## Triage order
1. Time-sensitive / SLA-bound items first.
2. High dollar-value exceptions.
3. Routine batch work.

## Known edge cases
- Records missing a unit reference → hold for owner review.
- Duplicate inbound events within 5 min → dedupe by external id.`, 6),
    file('connectors.md', 'md',
`# Connected Systems

${connectors.length ? connectors.map(c => `- ${c}`).join('\n') : '- (no systems mapped yet)'}

All access is brokered through the Meridian Proxy. Scopes are granted per
Unit of Work; nothing here is a stored credential.`, 9),
    file('glossary.md', 'md',
`# Glossary

- **UoW** — Unit of Work, an atomic, governed capability.
- **Run** — one execution of a workflow.
- **Baseline** — the manual time/cost a UoW replaces.`, 20),
  ]);
}

// ---- Task artifacts — written as work happens ------------------------------
function tasksFolder(emp) {
  const wfs = employeeWorkflows(emp);
  const uows = uowsForEmployee(emp);
  const base = seed(emp.id);
  // Synthesize a handful of recent runs from the employee's workflows.
  const runs = (wfs.length ? wfs : [{ name: `${emp.dept} Run`, uowIds: uows.slice(0, 2).map(u => u.id) }])
    .slice(0, 5)
    .flatMap((w, wi) => {
      const count = 1 + ((base >> wi) % 2); // 1–2 runs per workflow
      return Array.from({ length: count }, (_, k) => {
        const idx = wi * 2 + k;
        const ago = idx; // most recent first
        const calledUows = (w.uowIds || []).map(uowById).filter(Boolean);
        const records = 6 + ((base >> (idx + 1)) % 40);
        const dir = `${daysAgo(ago)}-${slug(w.name)}${count > 1 ? `-${k + 1}` : ''}`;
        return folder(dir, [
          file('run.md', 'md',
`# ${w.name}

- **When:** ${daysAgo(ago)}
- **Trigger:** ${w.trigger || 'on event'}${w.schedule ? ` · ${w.schedule}` : ''}
- **Records processed:** ${records}
- **Outcome:** ${idx % 4 === 0 ? 'completed — 1 item routed for approval' : 'completed'}

## Units of Work called
${calledUows.length ? calledUows.map(u => `- ${u.name}`).join('\n') : '- (none)'}`, ago),
          file('result.json', 'json',
JSON.stringify({
  workflow: w.name,
  date: daysAgo(ago),
  recordsProcessed: records,
  unitsOfWork: calledUows.map(u => u.name),
  status: idx % 4 === 0 ? 'awaiting-approval' : 'done',
}, null, 2), ago),
        ]);
      });
    });
  return folder('tasks', runs);
}

// ---- Generated outputs -----------------------------------------------------
function outputsFolder(emp) {
  return folder('outputs', [
    file(`${slug(emp.dept)}-weekly-summary.md`, 'md',
`# Weekly Summary — ${emp.dept}

Auto-generated rollup of this week's runs and exceptions for the owner.`, 1),
    file('exceptions.csv', 'csv',
`date,item,reason,status
${daysAgo(1)},INV-4821,missing unit ref,held
${daysAgo(2)},WO-2290,duplicate event,resolved
${daysAgo(4)},LSE-1187,over threshold,approved`, 1),
  ]);
}

// Build the full memory tree for an employee (root children).
export function employeeMemory(emp) {
  if (!emp) return [];
  return [
    instructionsFolder(emp),
    knowledgeFolder(emp),
    tasksFolder(emp),
    outputsFolder(emp),
    folder('scratch', [
      file('notes.md', 'md', `# Scratchpad\n\nWorking notes for in-flight reasoning. Cleared periodically.`, 0),
    ]),
  ].filter(Boolean);
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
