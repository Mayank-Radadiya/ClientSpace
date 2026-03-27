"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertCircle, CheckCircle2, FileIcon, Upload, X } from "lucide-react";
import { getUploadToken, createFileVersion } from "../server/actions";
import { ALLOWED_MIME_TYPES } from "../schemas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type FileUploadState = {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

type FileUploaderProps = {
  projectId: string;
  folderId?: string | null;
  existingAssetId?: string | null;
  onUploadComplete?: () => void;
};

export function FileUploader({
  projectId,
  folderId,
  existingAssetId,
  onUploadComplete,
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);

  const updateUpload = (index: number, update: Partial<FileUploadState>) => {
    setUploads((prev) =>
      prev.map((u, i) => (i === index ? { ...u, ...update } : u)),
    );
  };

  const uploadFile = useCallback(
    async (file: File, index: number) => {
      updateUpload(index, { status: "uploading", progress: 10 });

      // Step 1: Get signed URL from server
      const tokenResult = await getUploadToken({
        projectId,
        folderId: folderId ?? null,
        existingAssetId: existingAssetId ?? null,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      if (tokenResult.error || !tokenResult.data) {
        updateUpload(index, {
          status: "error",
          error: tokenResult.error ?? "Failed to get upload token.",
        });
        return;
      }

      updateUpload(index, { progress: 30 });

      const { signedUrl, storagePath, pendingAssetName } = tokenResult.data as {
        signedUrl: string;
        storagePath: string;
        pendingAssetName: string;
        existingAssetId: string | null;
        folderId: string | null;
        autoApproveAfterDays: number | null;
      };

      // Step 2: Upload binary directly to Supabase Storage
      try {
        const res = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        updateUpload(index, { progress: 70 });
      } catch {
        updateUpload(index, {
          status: "error",
          error: "Upload to storage failed. Please try again.",
        });
        return;
      }

      // Step 3: Record metadata in Postgres
      const recordResult = await createFileVersion({
        projectId,
        storagePath,
        fileSize: file.size,
        fileType: file.type,
        fileName: pendingAssetName,
        folderId: folderId ?? null,
        existingAssetId: existingAssetId ?? null,
      });

      if (recordResult.error) {
        updateUpload(index, { status: "error", error: recordResult.error });
        return;
      }

      updateUpload(index, { status: "success", progress: 100 });
      onUploadComplete?.();
    },
    [projectId, folderId, existingAssetId, onUploadComplete],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const startIndex = uploads.length;
      const newUploads: FileUploadState[] = acceptedFiles.map((f) => ({
        file: f,
        status: "pending",
        progress: 0,
      }));
      setUploads((prev) => [...prev, ...newUploads]);
      acceptedFiles.forEach((file, i) => uploadFile(file, startIndex + i));
    },
    [uploads.length, uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_MIME_TYPES.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {} as Record<string, string[]>,
    ),
    maxFiles: 10,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
        <p className="text-sm font-medium">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop files, or click to browse"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Images, PDFs, Documents, Design files • Max 10 files at once
        </p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={`${upload.file.name}-${index}`}
              className="bg-card flex items-center gap-3 rounded-lg border p-3"
            >
              {upload.status === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              ) : upload.status === "error" ? (
                <AlertCircle className="text-destructive h-5 w-5 shrink-0" />
              ) : (
                <FileIcon className="text-muted-foreground h-5 w-5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {upload.file.name}
                </p>
                {upload.status === "uploading" && (
                  <Progress value={upload.progress} className="mt-1 h-1.5" />
                )}
                {upload.error && (
                  <p className="text-destructive mt-1 text-xs">
                    {upload.error}
                  </p>
                )}
              </div>
              {(upload.status === "success" || upload.status === "error") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() =>
                    setUploads((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
