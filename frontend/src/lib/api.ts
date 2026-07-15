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
