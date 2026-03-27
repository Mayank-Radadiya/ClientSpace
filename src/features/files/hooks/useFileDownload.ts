"use client";

import { useCallback } from "react";
import { gooeyToast } from "@/components/ui/goey-toaster";
import { trpc } from "@/lib/trpc/client";

export function useFileDownload() {
  const { mutateAsync: getSignedUrl, isPending: isDownloading } =
    trpc.file.getSignedDownloadUrl.useMutation();

  const downloadFile = useCallback(
    async (storagePath: string, fileName?: string) => {
      const doDownload = async () => {
        const { url } = await getSignedUrl({ storagePath, fileName });

        // Trigger browser download via hidden link
        const link = document.createElement("a");
        link.href = url;
        // The server now sends Content-Disposition: attachment; filename="..."
        // so the browser will respect the exact fileName.
        link.download = fileName ?? storagePath.split("/").pop() ?? "download";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      return gooeyToast.promise(doDownload(), {
        loading: "Preparing download...",
        success: fileName ? `Downloading ${fileName}` : "Download started",
        error: "Failed to download file",
        description: {
          success: "Your file download will begin shortly.",
          error: "The file may have been moved, deleted, or is unavailable.",
        },
      });
    },
    [getSignedUrl],
  );

  return { downloadFile, isDownloading };
}
