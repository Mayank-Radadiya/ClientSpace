import { Search } from "lucide-react";

type ClientsEmptyStateProps = {
  clearFilters: () => void;
};

export function ClientsEmptyState({ clearFilters }: ClientsEmptyStateProps) {
  return (
    <div className="border-border bg-muted/30 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed">
      <Search className="text-muted-foreground mb-4 h-8 w-8 opacity-50" />
      <p className="text-xl font-medium">No matching clients</p>
      <p className="text-muted-foreground mt-2 text-xs tracking-wide uppercase">
        Try adjusting your filters
      </p>
      <button
        onClick={clearFilters}
        className="text-primary mt-6 text-xs tracking-wide uppercase hover:underline"
      >
        Clear Filters
      </button>
    </div>
  );
}
