"use client";

import { useCallback } from "react";
import { gooeyToast } from "goey-toast";
import { trpc } from "@/lib/trpc/client";

export function useFileDownload() {
  const { mutateAsync: getSignedUrl } =
    trpc.file.getSignedDownloadUrl.useMutation();

  const downloadFile = useCallback(
    async (storagePath: string, fileName?: string) => {
      try {
        const { url } = await getSignedUrl({ storagePath });

        // Trigger browser download
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName ?? storagePath.split("/").pop() ?? "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        gooeyToast.error("Failed to download file", {
          description: "Please try again or contact support.",
        });
      }
    },
    [getSignedUrl],
  );

  return { downloadFile };
}
