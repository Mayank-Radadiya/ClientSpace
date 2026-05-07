import { Search } from "lucide-react";

type ClientsEmptyStateProps = {
  clearFilters: () => void;
};

export function ClientsEmptyState({ clearFilters }: ClientsEmptyStateProps) {
  return (
    <div className="border-border bg-muted/30 flex h-60 flex-col items-center justify-center rounded-2xl border border-dashed">
      <Search className="text-muted-foreground mb-3 h-6 w-6 opacity-50" />
      <p className="text-lg font-medium">No matching clients</p>
      <button
        onClick={clearFilters}
        className="text-primary mt-4 text-xs tracking-wide uppercase hover:underline"
      >
        Clear Filters
      </button>
    </div>
  );
}
