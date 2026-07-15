// Live cost lever for Cost Control (`/cost-control`). Formula:
//   monthlyCost(agent) = (agent.tokenUsage / 1_000_000) * model.rate * reasoning.mult
// where model comes from MODEL_CATALOG[agent.costModelId] and reasoning
// comes from REASONING_LEVELS[agent.reasoningLevel].

export interface CostModel {
  id: string;
  name: string;
  rate: number; // $ per million tokens
}

export const MODEL_CATALOG: Record<string, CostModel> = {
  "gpt-4o":            { id: "gpt-4o",            name: "GPT-4o",            rate: 8 },
  "gpt-4o-mini":       { id: "gpt-4o-mini",       name: "GPT-4o-mini",       rate: 2 },
  "claude-3-5-sonnet": { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", rate: 6 },
};

export interface ReasoningLevel {
  id: "Minimal" | "Low" | "Medium" | "High";
  label: string;
  mult: number;
  note: string;
}

export const REASONING_LEVELS: ReasoningLevel[] = [
  { id: "Minimal", label: "Minimal", mult: 0.6,  note: "Fast, shallow. Routine lookups, status checks." },
  { id: "Low",     label: "Low",     mult: 0.85, note: "Light reasoning. Standard classification, simple scoring." },
  { id: "Medium",  label: "Medium",  mult: 1.0,  note: "Default depth. Most day-to-day decisions." },
  { id: "High",    label: "High",    mult: 1.7,  note: "Deep reasoning. Audits, complex planning, root-cause analysis." },
];

export function monthlyCost(tokenUsage: number, costModelId: string, reasoningLevel: string): number {
  const model = MODEL_CATALOG[costModelId] ?? MODEL_CATALOG["gpt-4o"];
  const reasoning = REASONING_LEVELS.find((r) => r.id === reasoningLevel) ?? REASONING_LEVELS[2];
  return (tokenUsage / 1_000_000) * model.rate * reasoning.mult;
}
