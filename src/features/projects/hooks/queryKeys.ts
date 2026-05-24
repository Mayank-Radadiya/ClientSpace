export const projectKeys = {
  all: (orgId: string) => ["projects", orgId] as const,
  list: (orgId: string, filters?: Record<string, any>) =>
    [...projectKeys.all(orgId), "list", filters ?? {}] as const,
  detail: (orgId: string, id: string) =>
    [...projectKeys.all(orgId), "detail", id] as const,
  members: (orgId: string, projectId: string) =>
    [...projectKeys.detail(orgId, projectId), "members"] as const,
};
