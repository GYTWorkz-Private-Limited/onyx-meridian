import { MFG_AGENTS } from "@/data/enterprise-data";

export interface Adapter {
  id: string;
  name: string;
  kind: string;
  status: "connected" | "available";
  runtime: "local" | "cloud" | "webhook";
  description: string;
}

export const ADAPTER_CATALOG: Adapter[] = [
  { id: "claude-code", name: "Claude Code",       kind: "claude", status: "connected", runtime: "local",   description: "Anthropic's agentic coding runtime — full tool access, local execution." },
  { id: "codex",       name: "Codex",             kind: "codex",  status: "connected", runtime: "local",   description: "OpenAI's agentic runtime for code and structured task execution." },
  { id: "gemini-cli",  name: "Gemini CLI",        kind: "gemini", status: "connected", runtime: "local",   description: "Google's CLI agent runtime." },
  { id: "cursor",      name: "Cursor Agent",      kind: "cursor", status: "connected", runtime: "cloud",   description: "Cloud-hosted agent runtime, IDE-integrated." },
  { id: "http-webhook",name: "HTTP / Webhook Bot",kind: "http",   status: "available", runtime: "webhook", description: "Generic webhook-driven agent — bring any HTTP-callable runtime." },
  { id: "bash",        name: "Bash Agent",        kind: "bash",   status: "available", runtime: "local",   description: "Lightweight shell-scripted runtime for deterministic, low-risk automations." },
];

export function connectedAgentsFor(adapterId: string) {
  return MFG_AGENTS.filter((a: any) => a.adapterId === adapterId);
}
