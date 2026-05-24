"use client";
// src/features/projects/components/hooks/useProjectDetail.ts
// tRPC query hook for project detail. staleTime: Infinity — data served from
// HydrationBoundary on first render, only re-fetched on explicit invalidation.

import { trpc } from "@/lib/trpc/client";

export function useProjectDetail(projectId: string) {
  const { data, isLoading, error } = trpc.projects.byId.useQuery(
    { id: projectId },
    {
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000,
    },
  );

  return { project: data ?? null, isLoading, error };
}
