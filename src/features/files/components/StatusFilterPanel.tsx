"use client";

import { motion } from "framer-motion";
import { Folder, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusFilter } from "../hooks/useFilesFilters";

type StatusFilterPanelProps = {
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  statusCounts?: Record<StatusFilter, number>;
};

const statusFilters: {
  value: StatusFilter;
  label: string;
  icon: typeof Folder;
}[] = [
  { value: "all", label: "All Statuses", icon: Folder },
  { value: "pending_review", label: "Pending Review", icon: Clock },
  { value: "approved", label: "Approved", icon: CheckCircle },
  { value: "changes_requested", label: "Changes Requested", icon: AlertCircle },
];

export function StatusFilterPanel({
  selectedStatus,
  onStatusChange,
  statusCounts,
}: StatusFilterPanelProps) {
  return (
    <div className="mt-6 space-y-1">
      <h3 className="text-muted-foreground mb-2 px-1 text-xs font-medium tracking-wider uppercase">
        Approval Status
      </h3>
      {statusFilters.map((filter, index) => {
        const Icon = filter.icon;
        const count = statusCounts?.[filter.value];
        const isSelected = selectedStatus === filter.value;

        return (
          <motion.button
            key={filter.value}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.12, delay: index * 0.02 }}
            onClick={() => onStatusChange(filter.value)}
            className={cn(
              "group hover:bg-muted hover:text-foreground hover:border-primary flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:scale-105 hover:border-r-2 hover:border-l-2",
              isSelected
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "h-4 w-4",
                  isSelected
                    ? "text-primary"
                    : "text-muted-foreground/70 group-hover:text-foreground",
                )}
              />
              <span>{filter.label}</span>
            </div>
            {count !== undefined && (
              <span
                className={cn(
                  "text-xs",
                  isSelected ? "text-primary/70" : "text-muted-foreground/50",
                )}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
