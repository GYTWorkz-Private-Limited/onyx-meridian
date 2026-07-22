import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

export function useGetTasks<T = unknown[]>() {
  return useQuery({ queryKey: ["tasks"], queryFn: () => fetchJson<T>("/tasks") });
}

export interface CreateTaskInput {
  title: string;
  priority: "p1" | "p2" | "p3";
  owner: string;
  ownerType?: "human" | "ai" | "shared";
  linkedKpi?: string | null;
  dueDate?: string | null;
  businessUnitId?: string | null;
  department?: string | null;
  workflow?: string | null;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => postJson("/tasks", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useGetAuditLogs<T = unknown[]>() {
  return useQuery({ queryKey: ["audit-logs"], queryFn: () => fetchJson<T>("/governance/audit-logs") });
}
