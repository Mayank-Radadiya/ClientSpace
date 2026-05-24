import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client";
import { fileKeys } from "./queryKeys";
import { revalidateTagAction } from "@/lib/actions";

const GC_TIME = 10 * 60 * 1000;

/**
 * Hook to fetch project files list with staleTime: Infinity.
 */
export function useFileList(orgId: string, projectId: string, folderId: string | null) {
  return trpc.files.list.useQuery(
    { projectId, folderId, limit: 50 },
    {
      staleTime: Infinity,
      gcTime: GC_TIME,
      enabled: !!projectId,
    }
  );
}

/**
 * Hook to fetch file version history.
 */
export function useFileVersionHistory(orgId: string, assetId: string) {
  return trpc.files.versions.useQuery(
    { assetId },
    {
      staleTime: Infinity,
      gcTime: GC_TIME,
      enabled: !!assetId,
    }
  );
}

/**
 * Mutation to upload/create a file version.
 */
export function useCreateFileVersionMutation(
  orgId: string,
  projectId: string,
  folderId: string | null,
  assetId?: string | null
) {
  const queryClient = useQueryClient();

  return trpc.files.create.useMutation({
    onSuccess: async (data) => {
      const targetAssetId = assetId || data?.asset?.id;

      // Invalidate file lists
      await queryClient.invalidateQueries({
        queryKey: fileKeys.list(orgId, projectId, folderId),
      });

      // Invalidate specific asset versions query
      if (targetAssetId) {
        await queryClient.invalidateQueries({
          queryKey: fileKeys.versions(orgId, targetAssetId),
        });
      }

      // Revalidate Next.js cache tags
      await revalidateTagAction(`org-${orgId}-files`);
      if (targetAssetId) {
        await revalidateTagAction(`org-${orgId}-asset-${targetAssetId}`);
      }
    },
  });
}

/**
 * Mutation to delete an asset.
 */
export function useDeleteAssetMutation(
  orgId: string,
  projectId: string,
  folderId: string | null,
  assetId: string
) {
  const queryClient = useQueryClient();

  return trpc.files.delete.useMutation({
    onSuccess: async () => {
      // Invalidate file lists
      await queryClient.invalidateQueries({
        queryKey: fileKeys.list(orgId, projectId, folderId),
      });

      // Remove specific asset versions from client cache
      queryClient.removeQueries({
        queryKey: fileKeys.versions(orgId, assetId),
      });

      // Revalidate Next.js cache tags
      await revalidateTagAction(`org-${orgId}-files`);
      await revalidateTagAction(`org-${orgId}-asset-${assetId}`);
    },
  });
}
