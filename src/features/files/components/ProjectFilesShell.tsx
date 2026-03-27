"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Grid2X2, List, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectFilesView } from "@/features/files/hooks/useProjectFilesView";
import { FileCard } from "@/features/files/components/FileCard";
import { FileRow } from "@/features/files/components/FileRow";
import { UploadDropzone } from "@/features/files/components/UploadDropzone";
import { ProjectFilesEmptyState } from "@/features/files/components/ProjectFilesEmptyState";
import { useUploadQueue } from "@/features/files/hooks/useUploadQueue";
import {
  formatFileSize,
  FileTypeIcon,
} from "@/features/files/components/fileMeta";
import type { ProjectFilesPageData } from "@/features/files/types";

type ProjectFilesShellProps = {
  projectId: string;
  data: ProjectFilesPageData;
};

export function ProjectFilesShell({ projectId, data }: ProjectFilesShellProps) {
  const router = useRouter();
  const [openUploadDialog, setOpenUploadDialog] = useState<(() => void) | null>(
    null,
  );

  const { queue, addFiles, retry, remove, optimisticFiles } = useUploadQueue({
    projectId,
    onUploadSuccess: () => {
      router.refresh();
    },
  });

  const allFiles = useMemo(
    () => [...optimisticFiles, ...data.files],
    [optimisticFiles, data.files],
  );

  const {
    filteredFiles,
    query,
    setQuery,
    sortBy,
    setSortBy,
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode,
  } = useProjectFilesView(data.files);

  const downloadMutation = trpc.file.getSignedDownloadUrl.useMutation({
    onSuccess: (payload) => {
      window.open(payload.url, "_blank", "noopener,noreferrer");
    },
  });

  const recent = useMemo(
    () => data.recentUploads.slice(0, 4),
    [data.recentUploads],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="space-y-6"
    >
      <header className="space-y-3">
        <nav className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>Projects</span>
          <span>/</span>
          <span>{data.project.name}</span>
          <span>/</span>
          <span className="text-foreground">Files</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {data.project.name} Files
            </h1>
            <p className="text-muted-foreground text-sm">
              {data.project.clientName ? `${data.project.clientName} • ` : ""}
              {data.files.length} files, {data.folders.length} folders
            </p>
          </div>

          <Button className="h-9 px-4" onClick={() => openUploadDialog?.()}>
            <Upload className="mr-1.5 h-4 w-4" />
            Upload file
          </Button>
        </div>
      </header>

      <UploadDropzone
        queue={queue}
        onFilesAdded={addFiles}
        onRetry={retry}
        onRemove={remove}
        onOpenDialogReady={setOpenUploadDialog}
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files"
              className="h-9 w-full sm:w-56"
            />

            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(
                  value as
                    | "all"
                    | "pdf"
                    | "image"
                    | "doc"
                    | "archive"
                    | "other",
                )
              }
            >
              <SelectTrigger className="h-9 w-37.5">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="doc">Doc</SelectItem>
                <SelectItem value="archive">Archive</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "recent" | "name" | "size")
              }
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">File size</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center rounded-lg border p-0.5">
              <Button
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("grid")}
              >
                <Grid2X2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <ProjectFilesEmptyState
              onUploadClick={() => openUploadDialog?.()}
            />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {viewMode === "grid" ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredFiles.map((file, index) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      index={index}
                      onDownload={(storagePath) =>
                        downloadMutation.mutate({ storagePath })
                      }
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="rounded-xl border"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((file, index) => (
                        <FileRow
                          key={file.id}
                          file={file}
                          index={index}
                          onDownload={(storagePath) =>
                            downloadMutation.mutate({ storagePath })
                          }
                        />
                      ))}
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {data.folders.length > 0 && (
            <section className="rounded-xl border p-4">
              <h3 className="mb-3 text-sm font-medium">Top-level folders</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-2 rounded-lg border p-3"
                  >
                    <Folder className="text-muted-foreground h-4 w-4" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {folder.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Created{" "}
                        {formatDistanceToNow(folder.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="rounded-xl border p-4">
          <h3 className="mb-3 text-sm font-medium">Recent uploads</h3>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent uploads</p>
          ) : (
            <div className="space-y-2">
              {recent.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <FileTypeIcon kind={item.fileKind} />
                    <p className="truncate text-sm font-medium">
                      {item.fileName}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(item.sizeBytes)} •{" "}
                    {item.uploaderName ?? "Unknown"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </motion.div>
  );
}
