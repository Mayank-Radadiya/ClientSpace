import { FilesHeaderSkeleton } from "@/features/files/components/FilesHeaderSkeleton";
import { FilesSidebarSkeleton } from "@/features/files/components/FilesSidebarSkeleton";
import { FilesContentSkeleton } from "@/features/files/components/FilesContentSkeleton";

export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FilesHeaderSkeleton />
      <div className="flex min-h-0 flex-1">
        <FilesSidebarSkeleton />
        <FilesContentSkeleton />
      </div>
    </div>
  );
}
