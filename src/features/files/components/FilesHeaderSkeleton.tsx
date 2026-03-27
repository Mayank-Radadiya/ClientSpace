import { Shimmer } from "@/components/ui/shimmer";

export function FilesHeaderSkeleton() {
  return (
    <div className="border-b px-6 py-4">
      <Shimmer className="mb-2 h-3 w-48 rounded" />
      <Shimmer className="h-8 w-32 rounded" />
      <Shimmer className="mt-1 h-4 w-40 rounded" />
    </div>
  );
}
