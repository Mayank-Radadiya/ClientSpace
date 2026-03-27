"use client";

import { motion } from "framer-motion";
import { FolderOpen, SearchX, UploadCloud } from "lucide-react";

type EmptyStateProps = {
  type: "no-files" | "no-results" | "no-recent" | "no-filters";
  onUploadClick?: () => void;
};

const stateConfig = {
  "no-files": {
    icon: FolderOpen,
    title: "No files yet",
    description: "Upload your first deliverable to get started",
    action: { label: "Upload Files", show: true },
  },
  "no-results": {
    icon: SearchX,
    title: "No matching files",
    description: "Try adjusting your search or filters",
    action: { label: "", show: false },
  },
  "no-recent": {
    icon: UploadCloud,
    title: "No recent uploads",
    description: "Files you upload will appear here",
    action: { label: "", show: false },
  },
  "no-filters": {
    icon: SearchX,
    title: "No matching files",
    description: "Try adjusting your search or filters",
    action: { label: "", show: false },
  },
};

export function EmptyState({ type, onUploadClick }: EmptyStateProps) {
  const config = stateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border">
        <Icon className="text-muted-foreground h-7 w-7" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold">{config.title}</p>
      <p className="text-muted-foreground mt-1.5 max-w-xs text-sm leading-relaxed">
        {config.description}
      </p>
      {config.action.show && onUploadClick && (
        <button
          onClick={onUploadClick}
          className="text-primary mt-4 text-sm font-medium underline-offset-2 hover:underline"
        >
          {config.action.label}
        </button>
      )}
    </motion.div>
  );
}

export function FileListEmpty({
  hasFilters,
  onUploadClick,
}: {
  hasFilters: boolean;
  onUploadClick?: () => void;
}) {
  return (
    <div className="rounded-xl border">
      <EmptyState
        type={hasFilters ? "no-results" : "no-files"}
        onUploadClick={onUploadClick}
      />
    </div>
  );
}
