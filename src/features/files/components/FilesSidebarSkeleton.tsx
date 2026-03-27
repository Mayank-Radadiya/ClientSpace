import { Shimmer } from "@/components/ui/shimmer";

export function FilesSidebarSkeleton() {
  return (
    <div className="bg-sidebar/50 w-[280px] shrink-0 border-r">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Upload Button Placeholder */}
        <Shimmer className="h-11 w-full rounded-lg" />

        {/* Type Filters Placeholder */}
        <div className="space-y-1">
          <div className="mb-3 px-1">
            <Shimmer className="h-3 w-16 rounded" />
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Shimmer className="h-4 w-4 rounded-sm" />
                <Shimmer className="h-4 w-24 rounded" />
              </div>
              <Shimmer className="h-3 w-4 rounded" />
            </div>
          ))}
        </div>

        {/* Status Filters Placeholder */}
        <div className="mt-6 space-y-1">
          <div className="mb-3 px-1">
            <Shimmer className="h-3 w-28 rounded" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Shimmer className="h-4 w-4 rounded-sm" />
                <Shimmer className="h-4 w-28 rounded" />
              </div>
              <Shimmer className="h-3 w-4 rounded" />
            </div>
          ))}
        </div>

        {/* Stats Placeholder */}
        <div className="space-y-3 border-t pt-4">
          <Shimmer className="mb-2 h-3 w-12 rounded" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-12 rounded" />
              <Shimmer className="h-4 w-4 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-16 rounded" />
              <Shimmer className="h-4 w-20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
