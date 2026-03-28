import { Skeleton } from "@/components/ui/skeleton";

type ProjectCardSkeletonProps = {
  viewMode?: "grid" | "list";
};

export function ProjectCardSkeleton({
  viewMode = "grid",
}: ProjectCardSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div className="bg-card flex items-center gap-4 rounded-xl p-4 shadow-sm md:gap-6">
        {/* Left avatar */}
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

        {/* Title and Client */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32 rounded-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20 rounded-sm" />
            <Skeleton className="h-1 w-1 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-sm" />
          </div>
        </div>

        {/* Badges */}
        <div className="hidden min-w-[240px] shrink-0 items-center justify-end gap-3 lg:flex">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Arrow indicator */}
        <div className="flex shrink-0 items-center justify-end pl-2">
          <Skeleton className="h-5 w-5 rounded-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card flex h-full flex-col justify-between rounded-2xl p-6 shadow-sm">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 rounded-sm" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-1/2 rounded-sm" />
            </div>
          </div>

          {/* Badges container (Status & Priority) */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full rounded-sm" />
          <Skeleton className="h-4 w-4/5 rounded-sm" />
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-14 rounded-md" />
        </div>
      </div>

      {/* Footer */}
      <div className="border-border/50 mt-6 flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-20 rounded-sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-16 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
