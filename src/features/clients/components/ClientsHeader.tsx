import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { InviteClientDialog } from "./InviteClientDialog";
import { PaddedNumber } from "./PaddedNumber";

type ClientsHeaderProps = {
  counts: { all: number; active: number };
  search: string;
  setSearch: (value: string) => void;
  view: "grid" | "list";
  setView: (view: "grid" | "list") => void;
  canInviteClient: boolean;
};

export function ClientsHeader({
  counts,
  search,
  setSearch,
  view,
  setView,
  canInviteClient,
}: ClientsHeaderProps) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <h1 className="text-5xl font-(--font-display) tracking-tight">
          Clients
        </h1>
        <p className="text-muted-foreground flex items-center gap-2 text-sm font-(--font-data) tracking-widest uppercase">
          <span className="text-foreground inline-block min-w-[20px] text-center font-bold">
            <PaddedNumber value={counts.all} />
          </span>{" "}
          client
          <span className="mx-1 opacity-50">·</span>
          <span className="inline-block min-w-[20px] text-center font-bold text-green-500">
            <PaddedNumber value={counts.active} />
          </span>{" "}
          active
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Bar */}
        <div className="group relative w-full sm:w-[320px]">
          <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 transition-colors" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records..."
            className="border-border bg-muted/50 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary h-11 rounded-xl pl-11 text-sm font-(--font-data) backdrop-blur-md transition-all focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / List Switcher */}
          <div className="border-border bg-muted/30 flex h-11 items-center rounded-xl border p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "flex h-full w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-all duration-200",
                view === "grid"
                  ? "bg-accent text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex h-full w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-all duration-200",
                view === "list"
                  ? "bg-accent text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {canInviteClient && (
            <div className="*:border-border *:bg-muted *:text-primary h-11 transition-all *:h-full *:rounded-xl *:text-xs *:font-(--font-data) *:tracking-widest *:uppercase hover:*:bg-transparent hover:*:shadow-sm">
              <InviteClientDialog />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
