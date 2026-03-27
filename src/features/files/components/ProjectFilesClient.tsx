"use client";

import { useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { useUploadQueue } from "../hooks/useUploadQueue";
import { UploadDropzone } from "./UploadDropzone";
import { FileList } from "./FileList";

type ProjectFilesClientProps = {
  projectId: string;
};

export function ProjectFilesClient({ projectId }: ProjectFilesClientProps) {
  const utils = trpc.useUtils();
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleUploadSuccess = useCallback(() => {
    void utils.file.getAssets.invalidate();
  }, [utils]);

  const { queue, addFiles, retry, remove, optimisticFiles } = useUploadQueue({
    projectId,
    onUploadSuccess: handleUploadSuccess,
  });

  const downloadMutation = trpc.file.getSignedDownloadUrl.useMutation({
    onSuccess: (data) => window.open(data.url, "_blank"),
  });

  const handleDownload = useCallback(
    (storagePath: string) => downloadMutation.mutate({ storagePath }),
    [downloadMutation],
  );

  const scrollToDropzone = () => {
    dropzoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      {/* Upload CTA strip */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            Drag & drop files below or click&nbsp;
            <button
              onClick={scrollToDropzone}
              className="text-primary font-medium underline-offset-2 hover:underline focus:outline-none"
            >
              Upload Files
            </button>
            &nbsp;to get started.
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <div ref={dropzoneRef}>
        <UploadDropzone
          queue={queue}
          onFilesAdded={addFiles}
          onRetry={retry}
          onRemove={remove}
        />
      </div>

      {/* File list */}
      <FileList
        projectId={projectId}
        optimisticFiles={optimisticFiles}
        onDownload={handleDownload}
      />
    </div>
  );
}
