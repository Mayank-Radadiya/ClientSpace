import { cn } from "@/lib/utils";

/**
 * Shimmer skeleton block — use for text/image placeholders.
 * No layout shift: always pass explicit width/height via className.
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800",
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
    </div>
  );
}
