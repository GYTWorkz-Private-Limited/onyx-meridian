// Deterministic OKF-style ("Open Knowledge Format") memory bundle per agent —
// 8 flat markdown files. Generated from the agent's own static fields so
// it's stable across renders, not randomized.

export interface MemoryFile {
  name: string;
  kind: "md";
  updated: string;
  content: string;
}

export function buildMemoryBundle(agent: any): MemoryFile[] {
  const updated = "2026-07-06";
  const identity: MemoryFile = {
    name: "identity.md", kind: "md", updated,
    content: `# Identity\n\n- **Name:** ${agent.name}\n- **Employee ID:** ${agent.employeeId}\n- **Role:** ${agent.role}\n- **Department:** ${agent.department}\n- **Business Unit:** ${agent.bu}\n- **Model:** ${agent.model}\n- **Autonomy Level:** ${agent.autonomy}\n- **Version:** ${agent.version}\n`,
  };
  const policies: MemoryFile = {
    name: "operating-policies.md", kind: "md", updated,
    content: `# Operating Policies\n\n- Escalate any action outside the ${agent.autonomy} autonomy boundary to a human approver.\n- No autonomous execution of financial, contractual, or PII-access actions.\n- Policy compliance floor: ${agent.policyCompliance ?? 95}%. Below this, actions require Supervised review.\n- Hallucination ceiling: ${agent.hallucination ?? 2}%. Above this, flag for retraining review.\n`,
  };
  const preferences: MemoryFile = {
    name: "preferences.md", kind: "md", updated,
    content: `# Learned Preferences\n\n- Prioritizes ${agent.kpisImproved?.[0] ?? "primary KPI"} improvements when trade-offs arise.\n- Prefers batching similar Unit of Work calls where SLA allows.\n- Reports anomalies with a confidence threshold above 80%.\n`,
  };
  const playbook: MemoryFile = {
    name: `${(agent.bu || "department")}-playbook.md`, kind: "md", updated,
    content: `# ${agent.department} Playbook\n\n1. Monitor linked KPIs: ${(agent.kpisImproved || []).join(", ") || "—"}.\n2. On threshold breach, run standard diagnostic sequence before recommending action.\n3. Route financial or contractual actions to the Approvals queue — never execute directly.\n`,
  };
  const connectors: MemoryFile = {
    name: "connectors.md", kind: "md", updated,
    content: `# Connected Systems\n\n${(agent.systems || []).map((s: string) => `- ${s} (via Meridian Proxy — no raw credentials in this bundle)`).join("\n") || "- None recorded"}\n`,
  };
  const glossary: MemoryFile = {
    name: "glossary.md", kind: "md", updated,
    content: `# Shared Terms\n\n- **EEI** — Enterprise Execution Index.\n- **OEE** — Overall Equipment Effectiveness.\n- **Unit of Work** — One atomic, proxied API call this agent is authorized to invoke.\n`,
  };
  const log: MemoryFile = {
    name: "log.md", kind: "md", updated,
    content: `# Update Log (last 30 days)\n\n- ${updated}: Reasoning level and skill set last reviewed.\n- Health score currently ${agent.health ?? "—"}/100, SLA ${agent.sla ?? "—"}%.\n- Tasks completed to date: ${agent.tasks ?? 0}.\n`,
  };
  const index: MemoryFile = {
    name: "index.md", kind: "md", updated,
    content: `# Memory Bundle — ${agent.name}\n\n1. identity.md\n2. operating-policies.md\n3. preferences.md\n4. ${playbook.name}\n5. connectors.md\n6. glossary.md\n7. log.md\n`,
  };
  return [index, identity, policies, preferences, playbook, connectors, glossary, log];
}
