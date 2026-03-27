import { Shimmer } from "@/components/ui/shimmer";

export function FilesHeaderSkeleton() {
  return (
    <div className="border-border bg-background flex shrink-0 flex-col gap-4 px-6 py-5">
      <div className="flex items-center gap-1.5 text-xs">
        <Shimmer className="h-3 w-14 rounded" />
        <span className="text-muted-foreground/30">/</span>
        <Shimmer className="h-3 w-10 rounded" />
        <span className="text-muted-foreground/30">/</span>
        <Shimmer className="text-primary h-3 w-8 rounded" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Shimmer className="h-8 w-24 rounded-lg" />
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-3.5 w-3.5 rounded-sm opacity-70" />
          <Shimmer className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}
