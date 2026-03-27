import { Shimmer } from "@/components/ui/shimmer";

export function FilesSidebarSkeleton() {
  return (
    <div className="bg-sidebar w-[280px] shrink-0 border-r p-6">
      <Shimmer className="mb-6 h-10 w-full rounded-lg" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Shimmer className="h-4 w-20 rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Shimmer key={i} className="h-5 w-full rounded" />
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <Shimmer className="mb-2 h-4 w-16 rounded" />
          <Shimmer className="h-3 w-24 rounded" />
          <Shimmer className="mt-1 h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}
