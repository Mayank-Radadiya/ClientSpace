import { Skeleton } from "@/components/ui/skeleton";

export function ProjectFilesHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-4 w-56" />
    </div>
  );
}
