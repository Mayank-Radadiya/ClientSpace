import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ProjectCardSkeletonProps = {
  viewMode?: "grid" | "list";
};

export function ProjectCardSkeleton({
  viewMode = "grid",
}: ProjectCardSkeletonProps) {
  if (viewMode === "list") {
    return (
      <Card className="border-border/70 bg-card/95 relative overflow-hidden shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <div className="flex h-[72px] items-stretch">
          <div className="bg-muted/40 w-1" />
          <div className="flex flex-1 items-center justify-between gap-4 px-5">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-1.5 w-full flex-1" />
                <Skeleton className="h-2 w-8" />
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="min-w-24 shrink-0 space-y-1 text-right">
              <Skeleton className="ml-auto h-2.5 w-12" />
              <Skeleton className="ml-auto h-2.5 w-20" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card/95 relative flex h-full flex-col overflow-hidden shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
      <div className="bg-muted/40 h-1 w-full" />
      <CardHeader className="px-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-4/5" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 px-5 pb-4">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-2 w-12" />
            <Skeleton className="h-2 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-md" />
        </div>
      </CardContent>

      <CardFooter className="border-t border-black/5 px-5 pt-3 dark:border-white/5">
        <div className="w-full space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
