import { Skeleton } from "@/components/ui/skeleton";
import { ProjectsStatsSkeleton } from "@/features/projects/components/ProjectsStats";
import { ProjectCardSkeleton } from "@/features/projects/components/project-card/ProjectCardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-44 rounded-lg" />
            <Skeleton className="h-4 w-56 rounded" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      <ProjectsStatsSkeleton />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProjectCardSkeleton key={index} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}
