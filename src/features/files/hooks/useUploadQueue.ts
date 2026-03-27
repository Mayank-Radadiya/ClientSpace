"use client";

import { useCallback, useState } from "react";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { getUploadToken, createFileVersion } from "../server/actions";
import { inferFileKind } from "../components/FileMeta";
import type { ProjectFile } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UploadStatus = "uploading" | "success" | "error";

export type UploadItem = {
  id: string; // stable key = file name + timestamp
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
  // populated once metadata is saved — used for optimistic list injection
  resolvedFile?: ProjectFile;
};

type UseUploadQueueOptions = {
  projectId: string;
  folderId?: string | null;
  /** Called after the server metadata step succeeds so the list can refetch. */
  onUploadSuccess?: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId(file: File) {
  return `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUploadQueue({
  projectId,
  folderId,
  onUploadSuccess,
}: UseUploadQueueOptions) {
  const [queue, setQueue] = useState<UploadItem[]>([]);

  const update = useCallback(
    (id: string, patch: Partial<UploadItem>) =>
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    [],
  );

  const remove = useCallback(
    (id: string) => setQueue((prev) => prev.filter((item) => item.id !== id)),
    [],
  );

  const uploadSingle = useCallback(
    async (id: string, file: File) => {
      update(id, { status: "uploading", progress: 10 });

      // Step 1 — signed URL
      const tokenResult = await getUploadToken({
        projectId,
        folderId: folderId ?? null,
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
        toast.error("Upload failed. Try again.");
        return;
      }

      const { signedUrl, storagePath, pendingAssetName } = tokenResult.data as {
        signedUrl: string;
        storagePath: string;
        pendingAssetName: string;
      };

      update(id, { progress: 35 });

      // Step 2 — PUT binary to Supabase Storage
      try {
        const res = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) throw new Error(res.statusText);
        update(id, { progress: 70 });
      } catch {
        update(id, {
          status: "error",
          error: "Upload to storage failed. Please try again.",
        });
        toast.error("Upload failed. Try again.");
        return;
      }

      // Step 3 — record metadata in Postgres
      const recordResult = await createFileVersion({
        projectId,
        storagePath,
        fileSize: file.size,
        fileType: file.type,
        fileName: pendingAssetName,
        folderId: folderId ?? null,
        existingAssetId: null,
      });

      if (recordResult.error) {
        update(id, { status: "error", error: recordResult.error });
        toast.error("Upload failed. Try again.");
        return;
      }

      // Build optimistic ProjectFile for immediate list injection
      const optimistic: ProjectFile = {
        id,
        name: pendingAssetName,
        mimeType: file.type,
        fileKind: inferFileKind(file.type),
        approvalStatus: "pending_review",
        versionNumber: 1,
        sizeBytes: file.size,
        updatedAt: new Date(),
        storagePath,
      };

      update(id, {
        status: "success",
        progress: 100,
        resolvedFile: optimistic,
      });
      toast.success("File uploaded successfully");
      onUploadSuccess?.();
    },
    [projectId, folderId, onUploadSuccess, update],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const items: UploadItem[] = files.map((file) => ({
        id: makeId(file),
        file,
        status: "uploading",
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
      update(id, { status: "uploading", progress: 0, error: undefined });
      void uploadSingle(id, item.file);
    },
    [queue, update, uploadSingle],
  );

  /** Optimistic files from completed uploads — injected into the list immediately. */
  const optimisticFiles: ProjectFile[] = queue
    .filter((item) => item.status === "success" && item.resolvedFile)
    .map((item) => item.resolvedFile!);

  return { queue, addFiles, retry, remove, optimisticFiles };
}
