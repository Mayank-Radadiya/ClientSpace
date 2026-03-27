"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "../utils/file-helpers";

export type UploadQueueItem = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

type UploadDropzoneProps = {
  queue: UploadQueueItem[];
  onFilesAdded: (files: File[]) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
};

export function UploadDropzone({
  queue,
  onFilesAdded,
  onRetry,
  onRemove,
}: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAdded(acceptedFiles);
      setIsDragActive(false);
    },
    [onFilesAdded],
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const hasActiveUploads = queue.some(
    (item) => item.status === "pending" || item.status === "uploading",
  );

  return (
    <div className="space-y-4">
      {/* Use plain div for dropzone – motion.div conflicts with react-dropzone event types */}
      <div
        {...getRootProps()}
        style={{
          transform: isDragActive ? "scale(1.01)" : "scale(1)",
          borderColor: isDragActive
            ? "var(--primary)"
            : isDragReject
              ? "var(--destructive)"
              : "var(--border)",
          backgroundColor: isDragActive
            ? "oklch(var(--primary) / 0.03)"
            : "transparent",
          transition:
            "transform 0.1s, border-color 0.1s, background-color 0.1s",
        }}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8",
          "hover:border-border/80 hover:bg-muted/30",
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        >
          <UploadCloud className="text-primary h-7 w-7" />
        </motion.div>

        <p className="mb-1 text-sm font-semibold">
          {isDragActive
            ? "Drop files here"
            : isDragReject
              ? "Invalid file type"
              : "Drag and drop files here"}
        </p>
        <p className="text-muted-foreground text-sm">
          or{" "}
          <span className="text-primary font-medium underline-offset-2 hover:underline">
            browse
          </span>{" "}
          to choose files
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          Supports: PDF, Images, Documents, Spreadsheets, Presentations
        </p>
      </div>

      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border"
          >
            <div className="border-b px-4 py-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Uploading {queue.length} file{queue.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="max-h-[300px] divide-y overflow-y-auto">
              {queue.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.1, delay: index * 0.02 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                    <File className="text-muted-foreground h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.file.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {item.status === "uploading" && (
                        <Progress
                          value={item.progress}
                          className="h-1.5 w-20"
                        />
                      )}
                      <span className="text-muted-foreground text-xs">
                        {item.status === "pending" && "Waiting..."}
                        {item.status === "uploading" && `${item.progress}%`}
                        {item.status === "success" && (
                          <span className="text-green-600">Complete</span>
                        )}
                        {item.status === "error" && (
                          <span className="text-destructive">{item.error}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {item.status === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {item.status === "error" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onRetry(item.id)}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => onRemove(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
