import { cn } from "@/lib/utils";

type ProjectCardSkeletonProps = {
  viewMode?: "grid" | "list";
};

const shimmer = {
  background: "rgba(255,255,255,0.06)",
};

export function ProjectCardSkeleton({ viewMode = "grid" }: ProjectCardSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div
        className="relative flex items-center gap-4 rounded-xl px-5 py-3 md:gap-6"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="h-[6px] w-[6px] rounded-full animate-pulse" style={shimmer} />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-1/3 animate-pulse rounded" style={shimmer} />
        </div>
        <div className="hidden h-4 w-20 animate-pulse rounded lg:block" style={shimmer} />
        <div className="hidden h-4 w-16 animate-pulse rounded xl:block" style={shimmer} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[160px] flex-col overflow-hidden rounded-2xl border",
        "bg-white border-black/5 dark:bg-white/[0.03] dark:border-white/[0.07]"
      )}
    >
      {/* Top accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] animate-pulse"
        style={{ background: "rgba(108,99,255,0.3)" }}
      />

      {/* Client row */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full animate-pulse" style={shimmer} />
        <div className="h-2.5 w-24 animate-pulse rounded-full" style={shimmer} />
      </div>

      {/* Title */}
      <div className="mb-1.5 h-5 w-3/4 animate-pulse rounded" style={shimmer} />
      <div className="mb-4 h-5 w-1/2 animate-pulse rounded" style={shimmer} />

      {/* Progress */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between">
          <div className="h-2.5 w-16 animate-pulse rounded-full" style={shimmer} />
          <div className="h-2.5 w-8 animate-pulse rounded-full" style={shimmer} />
        </div>
        <div className="h-[3px] w-full animate-pulse rounded-full" style={shimmer} />
      </div>

      <div className="flex-1" />

      {/* Footer */}
      <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-2.5 w-12 animate-pulse rounded-full" style={shimmer} />
          <div className="h-2.5 w-16 animate-pulse justify-self-center rounded-full" style={shimmer} />
          <div className="h-2.5 w-10 animate-pulse justify-self-end rounded-full" style={shimmer} />
        </div>
      </div>
    </div>
  );
}
