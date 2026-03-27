import { Shimmer } from "@/components/ui/shimmer";

export function FilesContentSkeleton({
  view = "list",
}: {
  view?: "list" | "grid";
}) {
  if (view === "grid") {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 border-b pb-4">
          <Shimmer className="h-10 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-xl border p-4">
              <Shimmer className="mb-3 h-12 w-12 rounded-xl" />
              <Shimmer className="mb-2 h-4 w-3/4 rounded" />
              <Shimmer className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4 border-b pb-4">
        <Shimmer className="h-10 w-full rounded-lg" />
      </div>
      <div className="divide-y rounded-xl border">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Shimmer className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-2/5 rounded" />
              <Shimmer className="h-3 w-1/4 rounded" />
            </div>
            <Shimmer className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
