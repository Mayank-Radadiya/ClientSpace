"use client";

import { Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "./FilterPanel";
import { StatusFilterPanel } from "./StatusFilterPanel";
import type { TypeFilter } from "../utils/file-filtering";
import type { StatusFilter } from "../hooks/useFilesFilters";
import type { ProjectFile } from "../types";
import { inferFileKind } from "../utils/file-helpers";
import { formatFileSize } from "../utils/file-helpers";

type FilesSidebarProps = {
  selectedType: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  files: ProjectFile[];
  onUploadClick: () => void;
};

function buildTypeCounts(files: ProjectFile[]): Record<TypeFilter, number> {
  const counts: Record<TypeFilter, number> = {
    all: files.length,
    image: 0,
    pdf: 0,
    doc: 0,
    spreadsheet: 0,
    presentation: 0,
    media: 0,
    archive: 0,
    other: 0,
  };

  for (const file of files) {
    const kind = inferFileKind(file.mimeType);
    switch (kind) {
      case "image":
        counts.image++;
        break;
      case "pdf":
        counts.pdf++;
        break;
      case "doc":
        counts.doc++;
        break;
      case "xls":
      case "xlsx":
      case "csv":
        counts.spreadsheet++;
        break;
      case "ppt":
      case "pptx":
        counts.presentation++;
        break;
      case "video":
      case "audio":
        counts.media++;
        break;
      case "archive":
      case "zip":
      case "rar":
        counts.archive++;
        break;
      default:
        counts.other++;
    }
  }

  return counts;
}

function buildStatusCounts(files: ProjectFile[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    all: files.length,
    pending_review: 0,
    approved: 0,
    changes_requested: 0,
  };

  for (const file of files) {
    if (file.approvalStatus && counts[file.approvalStatus] !== undefined) {
      counts[file.approvalStatus]++;
    }
  }

  return counts;
}

export function FilesSidebar({
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  files,
  onUploadClick,
}: FilesSidebarProps) {
  const typeCounts = buildTypeCounts(files);
  const statusCounts = buildStatusCounts(files);
  const totalSize = files.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-sidebar/50 flex w-[280px] shrink-0 flex-col border-r"
    >
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Upload CTA */}
        <Button size="lg" className="w-full" onClick={onUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>

        {/* Type Filters */}
        <FilterPanel
          selectedType={selectedType}
          onTypeChange={onTypeChange}
          typeCounts={typeCounts}
        />

        {/* Status Filters */}
        <StatusFilterPanel
          selectedStatus={selectedStatus}
          onStatusChange={onStatusChange}
          statusCounts={statusCounts}
        />

        {/* Stats */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
            Stats
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Files: </span>
              <span className="font-medium">{files.length}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Total size: </span>
              <span className="font-medium">{formatFileSize(totalSize)}</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
