"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Clock, Download, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileTypeIcon } from "./FileTypeIcon";
import { formatFileSize, inferFileKind } from "../utils/file-helpers";
import { EmptyState } from "./EmptyStates";
import type { ProjectFile } from "../types";

type RecentUploadsSectionProps = {
  files: ProjectFile[];
  onDownload?: (storagePath: string) => void;
  onViewAll?: () => void;
};

export function RecentUploadsSection({
  files,
  onViewAll,
}: RecentUploadsSectionProps) {
  if (files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="rounded-xl border border-dashed p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Clock className="text-muted-foreground h-4 w-4" />
          <h3 className="text-sm font-semibold">Recent Uploads</h3>
        </div>
        <EmptyState type="no-recent" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground h-4 w-4" />
          <h3 className="text-sm font-semibold">Recent Uploads</h3>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        )}
      </div>

      <div className="divide-y">
        {files.slice(0, 5).map((file, index) => {
          const kind = inferFileKind(file.mimeType);
          const uploadedAt = new Date(file.updatedAt);

          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.12, delay: index * 0.03 }}
              className="group hover:bg-muted/50 flex items-center gap-3 px-4 py-2.5 transition-colors"
            >
              <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                <FileTypeIcon kind={kind} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(file.sizeBytes)} ·{" "}
                  {formatDistanceToNow(uploadedAt, { addSuffix: true })}
                </p>
              </div>

              {/* {file.storagePath && onDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onDownload(file.storagePath!)}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="sr-only">Download</span>
                </Button>
              )} */}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
