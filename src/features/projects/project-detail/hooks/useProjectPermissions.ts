import { OrgRole } from "../types";

export interface ProjectPermissions {
  canEdit: boolean;
  canManageTeam: boolean;
  canViewBudget: boolean;
  canViewInvoices: boolean;
  canViewPriority: boolean;
  canArchiveDelete: boolean;
  canViewInternalThreads: boolean;
}

export function useProjectPermissions(
  role: OrgRole | undefined,
): ProjectPermissions {
  // If role is undefined, we assume the strictest permissions (viewer with no access)
  const safeRole = role ?? "client";

  return {
    canEdit: safeRole !== "client",
    canManageTeam: safeRole === "owner" || safeRole === "admin",
    canViewBudget: safeRole !== "client",
    canViewInvoices: safeRole !== "client",
    canViewPriority: safeRole !== "client",
    canArchiveDelete: safeRole === "owner" || safeRole === "admin",
    canViewInternalThreads: safeRole !== "client",
  };
}
