import {
  ProjectFilesHeaderSkeleton,
} from "@/features/files/components/ProjectFilesHeaderSkeleton";
import {
  ProjectFilesListSkeleton,
} from "@/features/files/components/ProjectFilesListSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <ProjectFilesHeaderSkeleton />
      <ProjectFilesListSkeleton />
    </div>
  );
}
