import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client";
import { projectKeys } from "./queryKeys";
import { revalidateTagAction } from "@/lib/actions";

const GC_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to fetch the projects list with staleTime: Infinity.
 */
export function useProjectList(orgId: string, cursor?: string) {
  return trpc.projects.list.useQuery(
    { cursor, limit: 50 },
    {
      staleTime: Infinity,
      gcTime: GC_TIME,
    }
  );
}

/**
 * Hook to fetch a single project detail with staleTime: Infinity.
 */
export function useProjectDetail(orgId: string, projectId: string) {
  return trpc.projects.byId.useQuery(
    { id: projectId },
    {
      staleTime: Infinity,
      gcTime: GC_TIME,
      enabled: !!projectId,
    }
  );
}

/**
 * Mutation hook to create a new project.
 */
export function useCreateProjectMutation(orgId: string) {
  const queryClient = useQueryClient();

  return trpc.projects.create.useMutation({
    onSuccess: async () => {
      // Invalidate projects list query
      await queryClient.invalidateQueries({
        queryKey: projectKeys.list(orgId),
      });
      // Invalidate tRPC cache
      await revalidateTagAction(`org-${orgId}-projects`);
    },
  });
}

/**
 * Mutation hook to update a project. Performs an optimistic update on the project detail cache.
 */
export function useUpdateProjectMutation(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return trpc.projects.update.useMutation({
    onMutate: async (variables) => {
      const detailKey = projectKeys.detail(orgId, projectId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: detailKey });

      // Snapshot previous value
      const previousProject = queryClient.getQueryData(detailKey);

      // Optimistically update project detail cache
      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...variables.data,
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectKeys.detail(orgId, projectId),
          context.previousProject
        );
      }
    },
    onSuccess: async () => {
      // Invalidate project list and details
      await queryClient.invalidateQueries({
        queryKey: projectKeys.list(orgId),
      });
      await queryClient.invalidateQueries({
        queryKey: projectKeys.detail(orgId, projectId),
      });

      // Trigger server-side revalidations
      await revalidateTagAction(`org-${orgId}-projects`);
      await revalidateTagAction(`org-${orgId}-project-${projectId}`);
    },
  });
}

/**
 * Mutation hook to delete a project.
 */
export function useDeleteProjectMutation(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return trpc.projects.delete.useMutation({
    onSuccess: async () => {
      // Invalidate project list and details
      await queryClient.invalidateQueries({
        queryKey: projectKeys.list(orgId),
      });
      queryClient.removeQueries({
        queryKey: projectKeys.detail(orgId, projectId),
      });

      // Trigger server-side revalidations
      await revalidateTagAction(`org-${orgId}-projects`);
      await revalidateTagAction(`org-${orgId}-project-${projectId}`);
    },
  });
}
