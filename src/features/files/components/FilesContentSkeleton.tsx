import { Shimmer } from "@/components/ui/shimmer";

export function FilesContentSkeleton({
  view = "list",
}: {
  view?: "list" | "grid";
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-4 p-6">
        {/* ── Recent Uploads Section Placeholder ────────────────── */}
        <div className="bg-card/50 overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-4 rounded-sm opacity-20" />
              <Shimmer className="h-4 w-28 rounded" />
            </div>
            <Shimmer className="h-8 w-16 rounded-md" />
          </div>
          <div className="divide-border/50 divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <Shimmer className="h-8 w-8 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Shimmer className="h-3.5 w-[60%] rounded" />
                  <div className="flex items-center gap-1.5">
                    <Shimmer className="h-2.5 w-12 rounded" />
                    <span className="text-muted-foreground/20 text-[10px]">
                      ·
                    </span>
                    <Shimmer className="h-2.5 w-20 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Toolbar Placeholder ──────────────────────────────── */}
        <div className="bg-accent/10 mb-4 flex h-14 items-center justify-between gap-4 rounded-xl px-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shimmer className="h-9 w-[280px] rounded-lg" />
            </div>
            <Shimmer className="h-9 w-32 rounded-lg" />
          </div>

          <div className="flex items-center gap-2">
            <Shimmer className="mr-2 hidden h-4 w-12 rounded lg:block" />
            <div className="border-border/50 flex overflow-hidden rounded-md border">
              <Shimmer className="border-border/30 h-8 w-8 rounded-none border-r" />
              <Shimmer className="h-8 w-8 rounded-none" />
            </div>
          </div>
        </div>

        {/* ── File List / Grid Placeholder ──────────────────────── */}
        {view === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="border-border/60 flex flex-col rounded-xl border p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <Shimmer className="h-12 w-12 rounded-xl" />
                  <Shimmer className="h-6 w-6 rounded-md opacity-20" />
                </div>
                <div className="mb-4 space-y-1.5">
                  <Shimmer className="h-3.5 w-full rounded" />
                  <Shimmer className="h-3.5 w-2/3 rounded" />
                </div>
                <div className="border-border/40 mt-auto flex items-center justify-between border-t pt-2">
                  <Shimmer className="h-2.5 w-10 rounded" />
                  <Shimmer className="h-2.5 w-14 rounded" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Shimmer className="h-5 w-14 rounded-full" />
                  <Shimmer className="h-5 w-18 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-border/60 divide-border/60 divide-y rounded-xl border">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Shimmer className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Shimmer className="mb-1.5 h-4 w-48 rounded" />
                  <div className="flex items-center gap-1.5 opacity-60">
                    <Shimmer className="h-3 w-10 rounded" />
                    <span className="text-muted-foreground/30 text-[10px]">
                      ·
                    </span>
                    <Shimmer className="h-3 w-6 rounded" />
                    <span className="text-muted-foreground/30 text-[10px]">
                      ·
                    </span>
                    <Shimmer className="h-3 w-16 rounded" />
                  </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Shimmer className="h-5.5 w-18 rounded-full" />
                  <Shimmer className="h-5.5 w-22 rounded-full" />
                </div>
                <Shimmer className="h-8 w-8 rounded-md opacity-10" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
