"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Download, MoreVertical, Trash2 } from "lucide-react";
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

// ─── FileEntry: unified display type for server + optimistic files ──────────

export type FileEntry = {
  id: string;
  name: string;
  mimeType: string;
  approvalStatus: "pending_review" | "approved" | "changes_requested";
  versionNumber: number | null;
  sizeBytes: number | null;
  updatedAt: Date | string; // server returns ISO string, optimistic is Date
  storagePath: string | null;
};

// ─── Props ────────────────────────────────────────────────────────────────────

type FileRowProps = {
  file: FileEntry;
  index: number;
  onDownload?: (storagePath: string) => void;
  onDelete?: (fileId: string) => void;
};

// ─── Row (List View) ─────────────────────────────────────────────────────────

export function FileRow({ file, index, onDownload, onDelete }: FileRowProps) {
  const kind = inferFileKind(file.mimeType);
  const uploadedAt =
    file.updatedAt instanceof Date ? file.updatedAt : new Date(file.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, delay: index * 0.025 }}
      className="group hover:bg-muted/40 flex items-center gap-4 border-b px-4 py-3 transition-colors duration-100 last:border-b-0"
    >
      {/* File icon */}
      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
        <FileTypeIcon kind={kind} />
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
          <span>{formatFileSize(file.sizeBytes)}</span>
          {file.versionNumber !== null && <span>v{file.versionNumber}</span>}
          <span>{formatDistanceToNow(uploadedAt, { addSuffix: true })}</span>
        </div>
      </div>

      {/* Type badge */}
      <div className="hidden shrink-0 sm:block">
        <FileTypeBadge kind={kind} />
      </div>

      {/* Hover actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
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
    </motion.div>
  );
}
