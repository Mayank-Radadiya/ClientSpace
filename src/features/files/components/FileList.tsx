"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileIcon, FolderOpen } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Shimmer } from "@/components/ui/shimmer";
import { FileRow } from "./FileRow";
import { FileCard } from "./FileCard";
import { FilesToolbar } from "./FilesToolbar";
import { inferFileKind } from "./fileMeta";
import type { FileEntry } from "./FileRow";
import type { SortBy, ViewMode, TypeFilter } from "./FilesToolbar";

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="divide-y">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Shimmer className="h-8 w-8 shrink-0 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3.5 w-2/5 rounded" />
            <Shimmer className="h-2.5 w-1/5 rounded" />
          </div>
          <Shimmer className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-xl border p-4">
          <Shimmer className="mb-3 h-10 w-10 rounded-lg" />
          <Shimmer className="mb-1.5 h-3.5 w-3/4 rounded" />
          <Shimmer className="h-2.5 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border">
        {hasQuery ? (
          <FolderOpen
            className="text-muted-foreground h-7 w-7"
            strokeWidth={1.5}
          />
        ) : (
          <FileIcon
            className="text-muted-foreground h-7 w-7"
            strokeWidth={1.5}
          />
        )}
      </div>
      <p className="text-sm font-semibold">
        {hasQuery ? "No matching files" : "No files yet"}
      </p>
      <p className="text-muted-foreground mt-1.5 max-w-xs text-sm leading-relaxed">
        {hasQuery
          ? "Try adjusting your search or filter."
          : "Upload your first deliverable above."}
      </p>
    </motion.div>
  );
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

type AssetRow = {
  id: string;
  name: string;
  type: string;
  approvalStatus: "pending_review" | "approved" | "changes_requested";
  versionNumber: number | null;
  size: number | null;
  updatedAt: string;
  storagePath: string | null;
};

function toFileEntry(row: AssetRow): FileEntry {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.type,
    approvalStatus: row.approvalStatus,
    versionNumber: row.versionNumber,
    sizeBytes: row.size,
    updatedAt: row.updatedAt,
    storagePath: row.storagePath,
  };
}

// ─── Sorting + filtering (pure, no re-fetch needed) ─────────────────────────

function applyFilters(
  files: FileEntry[],
  query: string,
  sortBy: SortBy,
  typeFilter: TypeFilter,
): FileEntry[] {
  const q = query.trim().toLowerCase();

  let result = files.filter((f) => {
    const matchesQuery = !q || f.name.toLowerCase().includes(q);
    const matchesType = (() => {
      if (typeFilter === "all") return true;
      const kind = inferFileKind(f.mimeType);
      switch (typeFilter) {
        case "image":
          return kind === "image";
        case "pdf":
          return kind === "pdf";
        case "doc":
          return kind === "doc";
        case "spreadsheet":
          return kind === "xls" || kind === "xlsx" || kind === "csv";
        case "presentation":
          return kind === "ppt" || kind === "pptx";
        case "media":
          return kind === "video" || kind === "audio";
        case "archive":
          return kind === "archive" || kind === "zip" || kind === "rar";
        case "other":
          return kind === "other";
        default:
          return false;
      }
    })();
    return matchesQuery && matchesType;
  });

  result = [...result].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "size") return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
    // "recent" — sort descending by updatedAt
    const aDate =
      a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
    const bDate =
      b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
    return bDate.getTime() - aDate.getTime();
  });

  return result;
}

// ─── Props ────────────────────────────────────────────────────────────────────

type FileListProps = {
  projectId: string;
  folderId?: string | null;
  optimisticFiles: FileEntry[];
  onDownload: (storagePath: string) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FileList({
  projectId,
  folderId,
  optimisticFiles,
  onDownload,
}: FileListProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const isValidProject = !!projectId && projectId !== "undefined";

  const { data = [], isLoading } = trpc.file.getAssets.useQuery(
    { projectId, folderId: folderId ?? null },
    { enabled: isValidProject },
  );

  const serverFiles = useMemo(
    () => (data as AssetRow[]).map(toFileEntry),
    [data],
  );

  // Merge optimistic (de-dup by storagePath)
  const serverPaths = new Set(serverFiles.map((f) => f.storagePath));
  const allFiles = [
    ...serverFiles,
    ...optimisticFiles.filter((f) => !serverPaths.has(f.storagePath)),
  ];

  // Apply client-side sort + filter (no extra queries)
  const visible = useMemo(
    () => applyFilters(allFiles, query, sortBy, typeFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, optimisticFiles, query, sortBy, typeFilter],
  );

  const isEmpty = !isLoading && allFiles.length === 0;
  const hasQuery = query.length > 0 || typeFilter !== "all";

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <FilesToolbar
        query={query}
        setQuery={setQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalCount={visible.length}
      />

      {/* File list/grid panel */}
      <div className="overflow-hidden rounded-xl border">
        {isLoading ? (
          viewMode === "list" ? (
            <ListSkeleton />
          ) : (
            <div className="p-4">
              <GridSkeleton />
            </div>
          )
        ) : isEmpty ? (
          <EmptyState hasQuery={hasQuery} />
        ) : viewMode === "list" ? (
          <AnimatePresence initial={false}>
            {visible.length === 0 ? (
              <EmptyState hasQuery={hasQuery} />
            ) : (
              <div className="divide-y">
                <AnimatePresence initial={false}>
                  {visible.map((file, i) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      index={i}
                      onDownload={onDownload}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </AnimatePresence>
        ) : (
          // Grid view
          <div className="p-4">
            {visible.length === 0 ? (
              <EmptyState hasQuery={hasQuery} />
            ) : (
              <AnimatePresence initial={false}>
                <motion.div
                  layout
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                >
                  {visible.map((file, i) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      index={i}
                      onDownload={onDownload}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
