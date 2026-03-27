"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileCard } from "./FileCard";
import { FileRow } from "./FileRow";
import { FilesToolbar } from "./FilesToolbar";
import { RecentUploadsSection } from "./RecentUploadsSection";
import { FileListEmpty } from "./EmptyStates";
import { UploadDropzone } from "./UploadDropzone";
import type { ProjectFile } from "../types";
import type { TypeFilter } from "../utils/file-filtering";
import type { SortBy } from "../utils/file-sorting";
import type { UploadQueueItem } from "../hooks/useUploadManager";

type FilesContentProps = {
  files: ProjectFile[];
  recentFiles: ProjectFile[];
  query: string;
  onQueryChange: (q: string) => void;
  sortBy: SortBy;
  onSortChange: (s: SortBy) => void;
  viewMode: "list" | "grid";
  onViewChange: (v: "list" | "grid") => void;
  typeFilter: TypeFilter;
  totalCount: number;
  // Upload
  uploadQueue: UploadQueueItem[];
  onFilesAdded: (files: File[]) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  // Download
  onDownload?: (storagePath: string, fileName: string) => void;
  onDelete?: (assetId: string, fileName: string) => void;
  onUploadClick?: () => void;
  onViewAll?: () => void;
};

export function FilesContent({
  files,
  recentFiles,
  query,
  onQueryChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewChange,
  typeFilter,
  totalCount,
  uploadQueue,
  onFilesAdded,
  onRetry,
  onRemove,
  onDownload,
  onDelete,
  onUploadClick,
  onViewAll,
}: FilesContentProps) {
  const hasFilters = query.trim().length > 0 || typeFilter !== "all";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-4 p-6">
        {/* Recent Uploads */}
        <RecentUploadsSection files={recentFiles} onViewAll={onViewAll} />

        {/* Toolbar */}
        <FilesToolbar
          query={query}
          onQueryChange={onQueryChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          viewMode={viewMode}
          onViewChange={onViewChange}
          totalCount={totalCount}
          filteredCount={files.length}
        />

        {/* File List / Grid */}
        <AnimatePresence mode="wait">
          {files.length === 0 ? (
            <FileListEmpty
              key="empty"
              hasFilters={hasFilters}
              onUploadClick={onUploadClick}
            />
          ) : viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="rounded-xl border"
            >
              {files.map((file, index) => (
                <FileRow
                  key={file.id}
                  file={file}
                  index={index}
                  onDownload={onDownload}
                  onDelete={onDelete}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {files.map((file, index) => (
                <FileCard
                  key={file.id}
                  file={file}
                  index={index}
                  onDownload={onDownload}
                  onDelete={onDelete}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Dropzone */}
        <div id="upload-dropzone" className="mt-2">
          <UploadDropzone
            queue={uploadQueue}
            onFilesAdded={onFilesAdded}
            onRetry={onRetry}
            onRemove={onRemove}
          />
        </div>
      </div>
    </div>
  );
}
