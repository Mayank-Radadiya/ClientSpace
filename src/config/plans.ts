// src/config/plans.ts
// PRD §12: Plan limits configuration — single source of truth for tier-based feature gates.
// TODO (Task 03): Define plan limits (storage, members, projects) per tier.
export const PLAN_LIMITS = {
  free: {
    maxProjects: 3,
    maxClients: 5,
    maxStorageGb: 1,
    maxTeamMembers: 1,
  },
  pro: {
    maxProjects: 25,
    maxClients: 50,
    maxStorageGb: 25,
    maxTeamMembers: 5,
  },
  business: {
    maxProjects: Infinity,
    maxClients: Infinity,
    maxStorageGb: 100,
    maxTeamMembers: Infinity,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
