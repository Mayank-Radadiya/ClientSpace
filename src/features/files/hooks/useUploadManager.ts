"use client";

import { useCallback, useState } from "react";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { trpc } from "@/lib/trpc/client";
import { getUploadToken, createFileVersion } from "../server/actions";

export type UploadQueueItem = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

type UseUploadManagerProps = {
  projectId: string;
  onSuccess?: () => void;
};

function makeId(file: File) {
  return `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useUploadManager({
  projectId,
  onSuccess,
}: UseUploadManagerProps) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const utils = trpc.useUtils();

  const update = useCallback(
    (id: string, patch: Partial<UploadQueueItem>) =>
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    [],
  );

  const uploadSingle = useCallback(
    async (id: string, file: File) => {
      update(id, { status: "uploading", progress: 10 });

      // ── Step 1: Get signed upload URL via server action ──────────────
      const tokenResult = await getUploadToken({
        projectId,
        folderId: null,
        existingAssetId: null,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      if (tokenResult.error ?? !tokenResult.data) {
        update(id, {
          status: "error",
          error: tokenResult.error ?? "Failed to get upload token.",
        });
        toast.error(`Upload failed: ${tokenResult.error ?? "Unknown error"}`);
        return;
      }

      const { signedUrl, storagePath, pendingAssetName } = tokenResult.data as {
        signedUrl: string;
        storagePath: string;
        pendingAssetName: string;
      };

      update(id, { progress: 35 });

      // ── Step 2: PUT binary directly to Supabase Storage ──────────────
      try {
        const res = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) throw new Error(res.statusText);
        update(id, { progress: 70 });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload to storage failed.";
        update(id, { status: "error", error: message });
        toast.error(`Upload failed: ${message}`);
        return;
      }

      // ── Step 3: Record metadata in Postgres ──────────────────────────
      const recordResult = await createFileVersion({
        projectId,
        storagePath,
        fileSize: file.size,
        fileType: file.type,
        fileName: pendingAssetName,
        folderId: null,
        existingAssetId: null,
      });

      if (recordResult.error) {
        update(id, { status: "error", error: recordResult.error });
        toast.error(`Upload failed: ${recordResult.error}`);
        return;
      }

      update(id, { status: "success", progress: 100 });
      toast.success(`${file.name} uploaded`);
      await utils.file.getAssets.invalidate({ projectId });
      onSuccess?.();
    },
    [projectId, onSuccess, update, utils],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const items: UploadQueueItem[] = files.map((file) => ({
        id: makeId(file),
        file,
        status: "pending",
        progress: 0,
      }));
      setQueue((prev) => [...prev, ...items]);
      items.forEach((item) => void uploadSingle(item.id, item.file));
    },
    [uploadSingle],
  );

  const retry = useCallback(
    (id: string) => {
      const item = queue.find((q) => q.id === id);
      if (!item) return;
      update(id, { status: "pending", error: undefined, progress: 0 });
      void uploadSingle(id, item.file);
    },
    [queue, update, uploadSingle],
  );

  const remove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const hasActive = queue.some(
    (item) => item.status === "pending" || item.status === "uploading",
  );

  return { queue, addFiles, retry, remove, hasActive };
}
