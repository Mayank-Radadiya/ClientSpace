export const fileKeys = {
  all: (orgId: string) => ["files", orgId] as const,
  list: (orgId: string, projectId: string, folderId: string | null, filters?: Record<string, any>) =>
    [...fileKeys.all(orgId), "list", projectId, folderId ?? "root", filters ?? {}] as const,
  versions: (orgId: string, assetId: string) =>
    [...fileKeys.all(orgId), "versions", assetId] as const,
};
