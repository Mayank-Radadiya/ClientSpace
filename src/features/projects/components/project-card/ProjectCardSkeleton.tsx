import { cn } from "@/lib/utils";

type ProjectCardSkeletonProps = {
  viewMode?: "grid" | "list";
};

// CSS shimmer animation defined as a style tag inside the component
// Works without any library. prefers-reduced-motion: disables shimmer.
const shimmerStyle = `
  @keyframes skeleton-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        rgb(255 255 255 / 0.04) 25%,
        rgb(255 255 255 / 0.10) 50%,
        rgb(255 255 255 / 0.04) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton-shimmer {
      background: rgb(255 255 255 / 0.06);
      animation: none;
    }
  }
`;

function ShimmerBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded", className)} />;
}

export function ProjectCardSkeleton({
  viewMode = "grid",
}: ProjectCardSkeletonProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />
      {viewMode === "list" ? (
        <div className="bg-card/30 ring-border/40 flex items-center gap-4 rounded-xl px-4 py-3 ring-1 md:gap-6">
          <ShimmerBlock className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerBlock className="h-4 w-36" />
            <ShimmerBlock className="h-3 w-24" />
          </div>
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <ShimmerBlock className="h-5 w-16 rounded-full" />
            <ShimmerBlock className="h-5 w-20 rounded-full" />
          </div>
          <ShimmerBlock className="hidden h-4 w-24 sm:block" />
          <ShimmerBlock className="hidden h-4 w-16 sm:block" />
        </div>
      ) : (
        <div className="bg-card/30 ring-border/40 flex h-full flex-col rounded-xl ring-1">
          <div className="space-y-3 px-5 pt-5 pb-4">
            {/* Header — name + badges */}
            <div className="flex items-start gap-3">
              <ShimmerBlock className="h-5 w-3/4 flex-1" />
              <div className="flex shrink-0 items-center gap-1.5">
                <ShimmerBlock className="h-5 w-20 rounded-full" />
                <ShimmerBlock className="h-5 w-14 rounded-full" />
              </div>
            </div>

            {/* Client row */}
            <div className="flex items-center gap-2">
              <ShimmerBlock className="h-5 w-5 shrink-0 rounded-full" />
              <ShimmerBlock className="h-3.5 w-32" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <ShimmerBlock className="h-3.5 w-full" />
              <ShimmerBlock className="h-3.5 w-4/5" />
            </div>

            {/* Tags */}
            <div className="flex gap-1.5">
              <ShimmerBlock className="h-5 w-16 rounded-md" />
              <ShimmerBlock className="h-5 w-20 rounded-md" />
            </div>
          </div>

          {/* Footer */}
          <div className="border-border/40 mt-auto flex items-center justify-between border-t px-5 py-3">
            <div className="flex items-center gap-1.5">
              <ShimmerBlock className="h-3.5 w-3.5" />
              <ShimmerBlock className="h-3.5 w-20" />
            </div>
            <div className="flex items-center gap-1">
              <ShimmerBlock className="h-3.5 w-3.5" />
              <ShimmerBlock className="h-3.5 w-16" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
