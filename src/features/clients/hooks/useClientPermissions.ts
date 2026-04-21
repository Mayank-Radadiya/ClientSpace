"use client";

type OrgRole = "owner" | "admin" | "member" | "client";

export type ClientPermissions = {
  canViewClients: boolean;
  canInviteClient: boolean;
  canEditClient: boolean;
  canArchiveClient: boolean;
  canDeleteClient: boolean;
};

export function useClientPermissions(role: OrgRole): ClientPermissions {
  const canManage = role === "owner" || role === "admin";

  return {
    canViewClients: role !== "client",
    canInviteClient: canManage,
    canEditClient: canManage,
    canArchiveClient: canManage,
    canDeleteClient: canManage,
  };
}
