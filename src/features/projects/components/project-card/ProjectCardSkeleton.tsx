import { cn } from "@/lib/utils";

type ProjectCardSkeletonProps = {
  viewMode?: "grid" | "list";
};

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.06)]",
        className,
      )}
    />
  );
}

export function ProjectCardSkeleton({
  viewMode = "grid",
}: ProjectCardSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl border px-5 py-3 md:gap-6",
          "border-[#EBEBF0] bg-white dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111118]",
        )}
      >
        <ShimmerBlock className="h-2 w-2 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <ShimmerBlock className="h-4 w-36" />
          <ShimmerBlock className="h-3 w-20" />
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <ShimmerBlock className="h-6 w-6 rounded-full" />
          <ShimmerBlock className="h-3.5 w-24" />
        </div>
        <ShimmerBlock className="hidden h-6 w-20 rounded-full lg:block" />
        <ShimmerBlock className="hidden h-3.5 w-16 xl:block" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full max-w-[400px] flex-col overflow-hidden rounded-[14px] border",
        "border-[#EBEBF0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)]",
        "dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111118] dark:shadow-none",
      )}
    >
      {/* Left edge line */}
      <div className="absolute top-0 left-0 h-full w-[3px] bg-[rgba(79,127,255,0.2)]" />

      {/* Section A: Header */}
      <div className="px-5 pt-[18px]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShimmerBlock className="h-7 w-7 rounded-full" />
            <ShimmerBlock className="h-3 w-24" />
          </div>
          <ShimmerBlock className="h-7 w-7 rounded-md" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <ShimmerBlock className="h-5 w-3/4" />
          <ShimmerBlock className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Section B: Description */}
      <div className="space-y-1.5 px-5 pt-2.5">
        <ShimmerBlock className="h-3.5 w-full" />
        <ShimmerBlock className="h-3.5 w-4/5" />
      </div>

      {/* Section C: Tags */}
      <div className="flex gap-1.5 px-5 pt-3 pb-3.5">
        <ShimmerBlock className="h-5 w-14 rounded-md" />
        <ShimmerBlock className="h-5 w-16 rounded-md" />
      </div>

      {/* Section D: Progress */}
      <div className="px-5 pb-3.5">
        <div className="mb-1.5 flex justify-between">
          <ShimmerBlock className="h-3 w-12" />
          <ShimmerBlock className="h-3 w-8" />
        </div>
        <ShimmerBlock className="h-1 w-full rounded-[2px]" />
      </div>

      {/* Section E: Divider */}
      <div className="flex-1" />
      <div className="h-px w-full bg-[#F0F0F5] dark:bg-[rgba(255,255,255,0.04)]" />

      {/* Section F: Footer */}
      <div className="bg-[#FAFAFA] px-5 py-3 dark:bg-[rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShimmerBlock className="h-3 w-14" />
            <ShimmerBlock className="h-3 w-20" />
          </div>
          <ShimmerBlock className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
