"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS, type PlanTier } from "@/config/plans";
import {
  getUploadToken,
  createFileVersion,
} from "@/features/files/server/actions";

interface ClientFileUploaderProps {
  projectId: string;
  folderId: string;
  orgPlan: PlanTier;
}

export function ClientFileUploader({
  projectId,
  folderId,
  orgPlan,
}: ClientFileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const maxSize = useMemo(
    () => PLAN_LIMITS[orgPlan].maxUploadSizeBytes,
    [orgPlan],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          const tokenResult = await getUploadToken({
            projectId,
            folderId,
            existingAssetId: null,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          });

          if (tokenResult.error || !tokenResult.data) {
            toast.error(tokenResult.error ?? `Failed to upload ${file.name}`);
            continue;
          }

          const { signedUrl, storagePath, pendingAssetName } =
            tokenResult.data as {
              signedUrl: string;
              storagePath: string;
              pendingAssetName: string;
            };

          const putRes = await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!putRes.ok) {
            toast.error(`Failed upload: ${file.name}`);
            continue;
          }

          const recordResult = await createFileVersion({
            projectId,
            storagePath,
            fileSize: file.size,
            fileType: file.type,
            fileName: pendingAssetName,
            folderId,
            existingAssetId: null,
          });

          if (recordResult.error) {
            toast.error(recordResult.error);
            continue;
          }

          toast.success(`${file.name} uploaded`);
        }
      } finally {
        setUploading(false);
      }
    },
    [projectId, folderId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    disabled: uploading,
  });

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Upload files</h3>
        <span className="text-muted-foreground text-xs">
          Client Uploads folder
        </span>
      </div>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border border-dashed p-6 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="text-muted-foreground mx-auto mb-2 h-5 w-5" />
        <p className="text-sm font-medium">
          {isDragActive
            ? "Drop files to upload"
            : "Drag files here or click to browse"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Max file size: {Math.round(maxSize / (1024 * 1024))} MB
        </p>
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" disabled={uploading}>
          {uploading ? "Uploading..." : "Ready"}
        </Button>
      </div>
    </div>
  );
}
