"use client";
// src/features/projects/components/hooks/useMilestones.ts
// tRPC query + optimistic mutations for milestones.
// On mutation success: calls revalidateMilestones() Server Action (Fix 7).

import { useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { revalidateMilestones } from "@/features/projects/server/actions";
import type { Milestone, MilestoneStatus, SubTask } from "../types";

export function useMilestones(projectId: string) {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const queryKey = getQueryKey(trpc.milestones.list, { projectId }, "query");

  // ── Query ────────────────────────────────────────────────────────────────
  const { data: milestones = [], isLoading } = trpc.milestones.list.useQuery(
    { projectId },
    { staleTime: Infinity, gcTime: 10 * 60 * 1000 },
  );

  // ── Helpers ──────────────────────────────────────────────────────────────
  const setOptimistic = useCallback(
    (updater: (prev: Milestone[]) => Milestone[]) => {
      queryClient.setQueryData<Milestone[]>(queryKey, (prev) =>
        updater(prev ?? []),
      );
    },
    [queryClient, queryKey],
  );

  // ── updateStatus mutation ─────────────────────────────────────────────────
  const updateStatusMut = trpc.milestones.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Milestone[]>(queryKey);
      setOptimistic((ms) =>
        ms.map((m) =>
          m.id === id
            ? {
                ...m,
                status,
                completed: status === "done",
                completedAt: status === "done" ? new Date().toISOString() : null,
              }
            : m,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSuccess: () => revalidateMilestones(projectId),
  });

  // ── update mutation ───────────────────────────────────────────────────────
  const updateMut = trpc.milestones.update.useMutation({
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Milestone[]>(queryKey);
      const { id, ...fields } = vars;
      setOptimistic((ms) =>
        ms.map((m) => (m.id === id ? { ...m, ...fields } : m)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSuccess: () => revalidateMilestones(projectId),
  });

  // ── updateSubTasks mutation ───────────────────────────────────────────────
  const updateSubTasksMut = trpc.milestones.updateSubTasks.useMutation({
    onMutate: async ({ id, subTasks }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Milestone[]>(queryKey);
      setOptimistic((ms) => ms.map((m) => (m.id === id ? { ...m, subTasks } : m)));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSuccess: () => revalidateMilestones(projectId),
  });

  // ── reorder mutation ──────────────────────────────────────────────────────
  const reorderMut = trpc.milestones.reorder.useMutation({
    onMutate: async ({ items }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Milestone[]>(queryKey);
      setOptimistic((ms) =>
        ms.map((m) => {
          const item = items.find((i) => i.id === m.id);
          return item ? { ...m, order: item.order, status: item.status as MilestoneStatus } : m;
        }),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSuccess: () => revalidateMilestones(projectId),
  });

  // ── create mutation ───────────────────────────────────────────────────────
  const createMut = trpc.milestones.create.useMutation({
    onSuccess: async () => {
      await utils.milestones.list.invalidate({ projectId });
      await revalidateMilestones(projectId);
    },
  });

  // ── delete mutation ───────────────────────────────────────────────────────
  const deleteMut = trpc.milestones.delete.useMutation({
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Milestone[]>(queryKey);
      setOptimistic((ms) => ms.filter((m) => m.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSuccess: () => revalidateMilestones(projectId),
  });

  return {
    milestones: milestones as Milestone[],
    isLoading,
    // Mutations
    updateStatus: (id: string, status: MilestoneStatus) =>
      updateStatusMut.mutate({ id, status }),
    update: (id: string, fields: Parameters<typeof updateMut.mutate>[0]) =>
      updateMut.mutate(fields),
    updateSubTasks: (id: string, subTasks: SubTask[]) =>
      updateSubTasksMut.mutate({ id, subTasks }),
    reorder: (items: Array<{ id: string; order: number; status: MilestoneStatus }>) =>
      reorderMut.mutate({ projectId, items }),
    create: createMut.mutateAsync,
    delete: (id: string) => deleteMut.mutate({ id }),
    // Pending states
    isReordering: reorderMut.isPending,
  };
}
