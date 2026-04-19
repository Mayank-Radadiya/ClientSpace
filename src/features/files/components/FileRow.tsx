"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Download, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileTypeBadge } from "./FileTypeBadge";
import { FileTypeIcon } from "./FileTypeIcon";
import { formatFileSize, inferFileKind } from "../utils/file-helpers";
import type { ProjectFile } from "../types";
import { ApprovalBadge } from "./FileMeta";

type FileRowProps = {
  projectId: string;
  file: ProjectFile;
  index: number;
  onDownload?: (storagePath: string, fileName: string) => void;
  onDelete?: (assetId: string, fileName: string) => void;
};

export function FileRow({
  projectId,
  file,
  index,
  onDownload,
  onDelete,
}: FileRowProps) {
  const kind = inferFileKind(file.mimeType);
  const uploadedAt = new Date(file.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, delay: index * 0.025 }}
      className="group hover:bg-muted/40 flex items-center gap-4 border-b px-4 py-3 transition-colors duration-100 last:border-b-0"
    >
      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <FileTypeIcon kind={kind} />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/projects/${projectId}/files/${file.id}`}
          className="truncate text-sm font-medium hover:underline"
        >
          {file.name}
        </Link>
        <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
          <span>{formatFileSize(file.sizeBytes)}</span>
          {file.versionNumber !== null && (
            <span className="text-foreground/60">v{file.versionNumber}</span>
          )}
          <span className="text-foreground/40">
            {formatDistanceToNow(uploadedAt, { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 sm:flex sm:items-center sm:gap-2">
        <FileTypeBadge kind={kind} />
        <ApprovalBadge status={file.approvalStatus} />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">File actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {file.storagePath && onDownload && (
            <DropdownMenuItem
              onClick={() => onDownload(file.storagePath!, file.name)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              {file.storagePath && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => onDelete(file.id, file.name)}
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
