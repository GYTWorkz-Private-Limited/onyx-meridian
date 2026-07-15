/** Stable department id helpers — shared by org-model and agents-registry. */

export function deptSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function deptTwinId(buId: string, name: string): string {
  return `${buId}:${deptSlug(name)}`;
}
