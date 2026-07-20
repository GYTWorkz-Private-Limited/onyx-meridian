import { useQuery } from "@tanstack/react-query";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

export function useGetTasks<T = unknown[]>() {
  return useQuery({ queryKey: ["tasks"], queryFn: () => fetchJson<T>("/tasks") });
}

export function useGetAuditLogs<T = unknown[]>() {
  return useQuery({ queryKey: ["audit-logs"], queryFn: () => fetchJson<T>("/governance/audit-logs") });
}

export interface KpiRecord {
  id: string;
  name: string;
  abbreviation: string | null;
  fullName: string;
  category: string;
  value: string;
  target: string;
  trend: "up" | "down" | "flat";
  delta: string;
  variance: string;
  healthScore: number;
  status: "on-track" | "watch" | "critical";
  owner: string;
  buIds: string[];
  linked: string[];
  formula: string;
  dataSource: string;
  updateFrequency: string;
  forecastNext: string;
  dependsOn: string[];
  feeds: string[];
  goalIds: string[];
  rootCauses: { cause: string; confidence: number }[];
  aiSummary: string;
}

export function useKpis() {
  return useQuery({ queryKey: ["kpis"], queryFn: () => fetchJson<KpiRecord[]>("/kpis") });
}

export interface KpiChartSpec {
  type: "bar" | "line" | "pie";
  xKey: string;
  yKeys: string[];
  title?: string;
}

export interface SavedKpiChat {
  id: string;
  question: string;
  answer: string;
  sqlQuery: string | null;
  resultData: Record<string, unknown>[];
  chartSpec: KpiChartSpec | null;
  createdAt: string;
}

export type SavedKpiChatDetail = SavedKpiChat;

export function useSavedKpiChats() {
  return useQuery({ queryKey: ["kpi-chat-saved"], queryFn: () => fetchJson<SavedKpiChat[]>("/kpi-chat/saved") });
}

export async function saveKpiChat(body: {
  question: string;
  answer: string;
  sqlQuery?: string;
  resultData?: Record<string, unknown>[];
  chartSpec?: KpiChartSpec | null;
}): Promise<SavedKpiChatDetail> {
  const res = await fetch("/api/kpi-chat/saved", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function deleteSavedKpiChat(id: string): Promise<void> {
  const res = await fetch(`/api/kpi-chat/saved/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

export async function refreshSavedKpiChat(id: string): Promise<SavedKpiChatDetail> {
  const res = await fetch(`/api/kpi-chat/saved/${id}/refresh`, { method: "POST", credentials: "include" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
