import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusLabel } from "../utils/formatters";
import { PaddedNumber } from "./PaddedNumber";
import type { ClientDisplayStatus } from "../client.types";

type ClientsFilterBarProps = {
  counts: Record<ClientDisplayStatus | "all", number>;
  statusFilter: string;
  setStatusFilter: (status: ClientDisplayStatus | "all") => void;
  totalFiltered: number;
  sort: string;
  setSort: (
    sort:
      | "last_activity_desc"
      | "last_activity_asc"
      | "name_asc"
      | "name_desc"
      | "revenue_desc"
      | "outstanding_desc",
  ) => void;
};

export function ClientsFilterBar({
  counts,
  statusFilter,
  setStatusFilter,
  totalFiltered,
  sort,
  setSort,
}: ClientsFilterBarProps) {
  return (
    <section className="border-border flex flex-col gap-4 border-b pb-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "active", "inactive", "pending", "archived"] as const).map(
          (status) => {
            const label = status === "all" ? "All" : statusLabel(status);
            const count = status === "all" ? counts.all : counts[status];
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "font-data)] flex h-9 items-center gap-2 rounded-full border px-4 text-xs font-semibold tracking-widest uppercase transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground border-[primary] shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent",
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold opacity-70",
                    isActive ? "text-primary-foreground" : "",
                  )}
                >
                  <PaddedNumber value={count} />
                </span>
              </button>
            );
          },
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="font-data)] text-muted-foreground text-[11px] tracking-[0.15em] uppercase">
          <PaddedNumber value={totalFiltered} /> Results
        </span>

        <div className="relative isolate">
          <Select value={sort} onValueChange={(value) => setSort(value as any)}>
            <SelectTrigger className="border-border bg-muted/50 font-data)] h-9 w-[220px] rounded-full rounded-r-none border border-r-0 px-4 text-xs tracking-wide focus:ring-0 focus:ring-offset-0 focus-visible:border-[primary] focus-visible:ring-0 [&>svg]:opacity-0">
              <SelectValue />
            </SelectTrigger>
            <div className="border-border bg-muted/50 pointer-events-none absolute top-0 right-0 flex h-full w-9 items-center justify-center rounded-r-full border border-l-0">
              <ChevronDown className="text-muted-foreground group-hover:text-foreground h-3 w-3 transition-transform" />
            </div>
            <SelectContent className="border-border bg-popover border shadow-xl">
              <SelectItem
                value="last_activity_desc"
                className="font-data)] focus:bg-primary/10 focus:text-primary text-xs"
              >
                Last activity (new)
              </SelectItem>
              <SelectItem
                value="last_activity_asc"
                className="font-data)] focus:bg-primary/10 focus:text-primary text-xs"
              >
                Last activity (old)
              </SelectItem>
              <SelectItem
                value="name_asc"
                className="font-data)] focus:bg-primary/10 focus:text-primary text-xs"
              >
                Name A-Z
              </SelectItem>
              <SelectItem
                value="name_desc"
                className="font-data)] focus:bg-primary/10 focus:text-primary text-xs"
              >
                Name Z-A
              </SelectItem>
              <SelectItem
                value="revenue_desc"
                className="font-data)] focus:bg-primary/10 focus:text-primary text-xs"
              >
                Revenue high-low
              </SelectItem>
              <SelectItem
                value="outstanding_desc"
                className="font-data)] focus:bg-primary/10 focus:text-primary text-xs"
              >
                Outstanding high-low
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
