import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <div className="flex gap-6">
        <div className="w-48 space-y-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <div className="bg-card flex-1 rounded-xl border p-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="mt-4 h-4 w-40" />
          <Skeleton className="mt-6 h-10 w-full" />
          <Skeleton className="mt-4 h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
