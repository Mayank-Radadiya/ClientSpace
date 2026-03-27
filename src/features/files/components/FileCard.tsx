"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Download, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileTypeBadge,
  FileTypeIcon,
  formatFileSize,
  inferFileKind,
} from "./fileMeta";
import type { FileEntry } from "./FileRow";

// ─── Props ────────────────────────────────────────────────────────────────────

type FileCardProps = {
  file: FileEntry;
  index: number;
  onDownload?: (storagePath: string) => void;
  onDelete?: (fileId: string) => void;
};

// ─── Card (Grid View) ─────────────────────────────────────────────────────────

export function FileCard({ file, index, onDownload, onDelete }: FileCardProps) {
  const kind = inferFileKind(file.mimeType);
  const uploadedAt =
    file.updatedAt instanceof Date ? file.updatedAt : new Date(file.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.04 }}
      className={cn(
        "group bg-card relative flex flex-col rounded-xl border p-4 transition-all duration-150",
        "hover:border-border/80 hover:shadow-sm",
      )}
    >
      {/* Top: icon + type chip + actions */}
      <div className="mb-3 flex items-start justify-between">
        {/* File icon */}
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
          <FileTypeIcon kind={kind} />
        </div>

        {/* Hover actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
              <span className="sr-only">File actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {file.storagePath && onDownload && (
              <DropdownMenuItem onClick={() => onDownload(file.storagePath!)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(file.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* File name */}
      <p className="mb-1 line-clamp-2 text-sm leading-snug font-medium">
        {file.name}
      </p>

      {/* Meta row */}
      <div className="text-muted-foreground mt-auto flex items-center justify-between pt-2 text-xs">
        <span>{formatFileSize(file.sizeBytes)}</span>
        <span>{formatDistanceToNow(uploadedAt, { addSuffix: true })}</span>
      </div>

      {/* Type badge — bottom left */}
      <div className="mt-2">
        <FileTypeBadge kind={kind} />
      </div>
    </motion.div>
  );
}
