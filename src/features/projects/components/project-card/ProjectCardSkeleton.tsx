import { cn } from "@/lib/utils";

type ProjectCardSkeletonProps = {
  viewMode?: "grid" | "list";
};

export function ProjectCardSkeleton({ viewMode = "grid" }: ProjectCardSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "relative flex items-center gap-4 rounded-xl border px-5 py-3 md:gap-6",
          "bg-white border-[#EBEBF0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "dark:bg-[#111118]/60 dark:backdrop-blur-md dark:border-white/5 dark:shadow-none",
        )}
      >
        <div className="h-[6px] w-[6px] rounded-full animate-pulse bg-[#EBEBF0] dark:bg-white/10" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
        </div>
        <div className="hidden lg:block h-4 w-20 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
        <div className="hidden xl:block h-4 w-16 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border p-6",
        "bg-white border-[#EBEBF0] shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
        "dark:bg-[#111118]/80 dark:backdrop-blur-md dark:border-white/5 dark:shadow-none",
      )}
    >
      {/* Client row */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full animate-pulse bg-[#EBEBF0] dark:bg-white/5" />
        <div className="h-3 w-24 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
      </div>

      {/* Title */}
      <div className="mb-4 h-5 w-2/3 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />

      {/* Progress */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
          <div className="h-3 w-8 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
        </div>
        <div className="h-[2px] w-full animate-pulse rounded-full bg-[#EBEBF0] dark:bg-white/5" />
      </div>

      <div className="flex-1" />

      {/* Footer */}
      <div className="border-t border-[#EBEBF0] dark:border-white/5 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="h-3 w-12 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
          <div className="h-3 w-16 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5 justify-self-center" />
          <div className="h-3 w-10 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5 justify-self-end" />
        </div>
      </div>
    </div>
  );
}
