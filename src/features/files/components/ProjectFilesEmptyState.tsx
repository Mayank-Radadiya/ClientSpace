"use client";

import { motion } from "framer-motion";
import { FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProjectFilesEmptyStateProps = {
  onUploadClick: () => void;
};

export function ProjectFilesEmptyState({
  onUploadClick,
}: ProjectFilesEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center"
    >
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border bg-background">
        <FolderSearch className="h-5 w-5 text-muted-foreground" />
      </span>
      <h3 className="text-base font-semibold tracking-tight">No files yet</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
        Upload your first project file. PDFs, docs, images, and assets will show
        up here with status, versions, and recent activity.
      </p>
      <Button onClick={onUploadClick} className="mt-6 h-9 px-4">
        Upload first file
      </Button>
    </motion.div>
  );
}
