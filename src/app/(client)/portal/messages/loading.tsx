import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border">
      <div className="w-80 space-y-3 border-r p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="h-6 w-48" />
      </div>
    </div>
  );
}
