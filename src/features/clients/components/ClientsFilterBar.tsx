import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusLabel } from "../utils/formatters";
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

const SORT_OPTIONS: Record<string, string> = {
  last_activity_desc: "Last Activity",
  name_asc: "Name A→Z",
  name_desc: "Name Z→A",
  revenue_desc: "Revenue ↑",
  outstanding_desc: "Outstanding ↑",
  last_activity_asc: "Oldest First",
};

export function ClientsFilterBar({
  counts,
  statusFilter,
  setStatusFilter,
  totalFiltered,
  sort,
  setSort,
}: ClientsFilterBarProps) {
  const tabs = ["all", "active", "inactive", "pending", "archived"] as const;

  return (
    <section className="flex flex-col gap-4 border-b border-[rgba(0,0,0,0.06)] pb-4 md:flex-row md:items-end md:justify-between dark:border-[rgba(255,255,255,0.05)]">
      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center gap-1 rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-black/5 p-1 dark:border-[rgba(255,255,255,0.05)] dark:bg-white/5">
        {tabs.map((status) => {
          const label = status === "all" ? "All" : statusLabel(status);
          const count = status === "all" ? counts.all : counts[status];
          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "relative flex h-7 items-center gap-1.5 rounded-[8px] px-3 transition-colors duration-200",
                isActive
                  ? "text-[#0D0D14] dark:text-[#F2F2F5]"
                  : "text-[#6B6B7E] hover:bg-black/5 hover:text-[#0D0D14] dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-[8px] bg-[#0A0A0F]/5 dark:bg-white/5"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative z-10 text-[11px] tracking-[0.08em] capitalize">
                {label}
              </span>
              <span
                className={cn(
                  "relative z-10 flex items-center justify-center rounded-[4px] px-1 text-[9px] font-bold",
                  isActive
                    ? "bg-[#0A0A0F]/10 text-[#0D0D14] dark:bg-white/10 dark:text-[#F2F2F5]"
                    : "bg-black/5 text-[#6B6B7E] dark:bg-white/5",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
        {/* RESULTS COUNT */}
        <span className="text-[12px] text-[#6B6B7E]">
          {statusFilter === "all" && !sort.includes("search") // Approximation if search is passed in
            ? `Showing ${totalFiltered} clients`
            : `${totalFiltered} of ${counts.all} clients`}
        </span>

        {/* SORT DROPDOWN */}
        <div className="relative isolate">
          <Select value={sort} onValueChange={(value) => setSort(value as any)}>
            <SelectTrigger className="flex h-8 w-[180px] items-center justify-between rounded-full border border-[rgba(0,0,0,0.12)] bg-transparent px-3 text-[11px] tracking-wide text-[#6B6B7E] transition-colors hover:bg-black/5 focus:ring-0 focus-visible:ring-0 dark:border-[rgba(255,255,255,0.12)] dark:hover:bg-white/5 [&>svg]:opacity-0">
              <span className="flex items-center gap-1.5">
                <span className="opacity-60">↑↓</span>{" "}
                {SORT_OPTIONS[sort] || "Sort by"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
            </SelectTrigger>
            <SelectContent className="w-[200px] overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white p-1 shadow-[0_8px_32px_rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#16161F]">
              <div className="px-2 py-1.5 text-[9px] font-bold tracking-widest text-[#6B6B7E] uppercase">
                Sort by
              </div>
              <SelectItem
                value="last_activity_desc"
                className="flex h-9 cursor-pointer items-center rounded-lg px-2 text-[12px] focus:bg-[rgba(59,111,239,0.06)] focus:text-[#3B6FEF] dark:focus:bg-[rgba(79,127,255,0.06)] dark:focus:text-[#4F7FFF]"
              >
                Last Activity
              </SelectItem>
              <SelectItem
                value="name_asc"
                className="flex h-9 cursor-pointer items-center rounded-lg px-2 text-[12px] focus:bg-[rgba(59,111,239,0.06)] focus:text-[#3B6FEF] dark:focus:bg-[rgba(79,127,255,0.06)] dark:focus:text-[#4F7FFF]"
              >
                Name A→Z
              </SelectItem>
              <SelectItem
                value="name_desc"
                className="flex h-9 cursor-pointer items-center rounded-lg px-2 text-[12px] focus:bg-[rgba(59,111,239,0.06)] focus:text-[#3B6FEF] dark:focus:bg-[rgba(79,127,255,0.06)] dark:focus:text-[#4F7FFF]"
              >
                Name Z→A
              </SelectItem>
              <div className="mt-1 border-t border-[rgba(0,0,0,0.05)] px-2 py-1.5 text-[9px] font-bold tracking-widest text-[#6B6B7E] uppercase dark:border-[rgba(255,255,255,0.05)]">
                Amount
              </div>
              <SelectItem
                value="outstanding_desc"
                className="flex h-9 cursor-pointer items-center rounded-lg px-2 text-[12px] focus:bg-[rgba(59,111,239,0.06)] focus:text-[#3B6FEF] dark:focus:bg-[rgba(79,127,255,0.06)] dark:focus:text-[#4F7FFF]"
              >
                Outstanding ↑
              </SelectItem>
              <SelectItem
                value="revenue_desc"
                className="flex h-9 cursor-pointer items-center rounded-lg px-2 text-[12px] focus:bg-[rgba(59,111,239,0.06)] focus:text-[#3B6FEF] dark:focus:bg-[rgba(79,127,255,0.06)] dark:focus:text-[#4F7FFF]"
              >
                Revenue ↑
              </SelectItem>
              <div className="mt-1 border-t border-[rgba(0,0,0,0.05)] px-2 py-1.5 text-[9px] font-bold tracking-widest text-[#6B6B7E] uppercase dark:border-[rgba(255,255,255,0.05)]">
                Date
              </div>
              <SelectItem
                value="last_activity_asc"
                className="flex h-9 cursor-pointer items-center rounded-lg px-2 text-[12px] focus:bg-[rgba(59,111,239,0.06)] focus:text-[#3B6FEF] dark:focus:bg-[rgba(79,127,255,0.06)] dark:focus:text-[#4F7FFF]"
              >
                Oldest First
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
