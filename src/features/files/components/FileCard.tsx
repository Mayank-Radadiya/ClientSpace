"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Download, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
import { ApprovalBadge } from "./FileMeta";
import { formatFileSize, inferFileKind } from "../utils/file-helpers";
import type { ProjectFile } from "../types";

type FileCardProps = {
  projectId: string;
  file: ProjectFile;
  index: number;
  onDownload?: (storagePath: string, fileName: string) => void;
  onDelete?: (assetId: string, fileName: string) => void;
};

export function FileCard({
  projectId,
  file,
  index,
  onDownload,
  onDelete,
}: FileCardProps) {
  const kind = inferFileKind(file.mimeType);
  const uploadedAt = new Date(file.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.04 }}
      className={cn(
        "group bg-card hover:border-border/80 relative flex flex-col rounded-xl border p-4 transition-all duration-150 hover:shadow-sm",
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-xl">
          <FileTypeIcon kind={kind} />
        </div>

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
      </div>

      <Link
        href={`/projects/${projectId}/files/${file.id}`}
        className="mb-1 line-clamp-2 text-sm leading-snug font-medium hover:underline"
      >
        {file.name}
      </Link>

      <div className="text-muted-foreground mt-auto flex items-center justify-between pt-2 text-xs">
        <span>{formatFileSize(file.sizeBytes)}</span>
        <span>{formatDistanceToNow(uploadedAt, { addSuffix: true })}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ApprovalBadge status={file.approvalStatus} />
        <FileTypeBadge kind={kind} />
      </div>
    </motion.div>
  );
}
