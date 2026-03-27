"use client";

import { useCallback } from "react";
import { gooeyToast } from "@/components/ui/goey-toaster";
import { trpc } from "@/lib/trpc/client";

type UseFileDeleteOptions = {
  projectId: string;
  onSuccess?: () => void;
};

export function useFileDelete({ projectId, onSuccess }: UseFileDeleteOptions) {
  const utils = trpc.useUtils();

  const { mutateAsync: deleteAsset, isPending: isDeleting } =
    trpc.file.deleteAsset.useMutation({
      onSuccess: async () => {
        // Invalidate the assets cache so the deleted file is removed from the list
        await utils.file.getAssets.invalidate({ projectId });
        onSuccess?.();
      },
    });

  const deleteFile = useCallback(
    async (assetId: string) => {
      return gooeyToast.promise(deleteAsset({ assetId, projectId }), {
        loading: "Deleting file...",
        success: "File deleted successfully",
        error: "Failed to delete file",
        description: {
          success: "File deleted successfully",
          error: "Failed to delete file",
        },
      });
    },
    [deleteAsset, projectId],
  );

  return { deleteFile, isDeleting };
}
