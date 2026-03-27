"use client";

import { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileIcon,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ALLOWED_MIME_TYPES } from "../schemas";
import type { UploadItem } from "../hooks/useUploadQueue";

// ─── Props ────────────────────────────────────────────────────────────────────

type UploadDropzoneProps = {
  queue: UploadItem[];
  onFilesAdded: (files: File[]) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenDialogReady?: (openFn: () => void) => void;
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="bg-border mt-1.5 h-1 w-full overflow-hidden rounded-full">
      <motion.div
        className="bg-primary h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Status Icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: UploadItem["status"] }) {
  if (status === "success")
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />;
  if (status === "error")
    return <AlertCircle className="text-destructive h-4 w-4 shrink-0" />;
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
    >
      <FileIcon className="text-muted-foreground h-4 w-4 shrink-0" />
    </motion.div>
  );
}

// ─── Upload Queue Item ────────────────────────────────────────────────────────

function QueueItem({
  item,
  onRetry,
  onRemove,
}: {
  item: UploadItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const done = item.status === "success" || item.status === "error";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-card border-border flex items-center gap-3 rounded-lg border px-3 py-2.5"
    >
      <StatusIcon status={item.status} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.file.name}</p>
        {item.status === "uploading" && <ProgressBar value={item.progress} />}
        {item.status === "uploading" && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            Uploading ({item.progress}%)
          </p>
        )}
        {item.status === "success" && (
          <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
            Uploaded
          </p>
        )}
        {item.status === "error" && (
          <p className="text-destructive mt-0.5 text-xs">
            {item.error ?? "Upload failed"}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {item.status === "error" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRetry(item.id)}
            title="Retry"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        {done && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRemove(item.id)}
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── UploadDropzone ───────────────────────────────────────────────────────────

export function UploadDropzone({
  queue,
  onFilesAdded,
  onRetry,
  onRemove,
  onOpenDialogReady,
}: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => onFilesAdded(acceptedFiles),
    [onFilesAdded],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ALLOWED_MIME_TYPES.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {} as Record<string, string[]>,
    ),
    maxFiles: 10,
  });

  useEffect(() => {
    if (onOpenDialogReady && open) {
      onOpenDialogReady(() => open);
    }
  }, [open, onOpenDialogReady]);

  return (
    <div className="space-y-3">
      {/* ── Drop Target ── */}
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-150",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Upload
            className={cn(
              "mx-auto mb-3 h-9 w-9 transition-colors",
              isDragActive ? "text-primary" : "text-muted-foreground",
            )}
          />
        </motion.div>
        <p className="text-sm font-medium">
          {isDragActive
            ? "Drop files here…"
            : "Drag & drop files, or click to browse"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Images, PDFs, Documents, Design files • Max 10 files at once
        </p>
      </div>

      {/* ── Upload Queue ── */}
      <AnimatePresence initial={false}>
        {queue.map((item) => (
          <QueueItem
            key={item.id}
            item={item}
            onRetry={onRetry}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
