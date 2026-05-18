"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type EmptyProjectsProps = {
  isFiltered?: boolean;
  onCreateClick?: () => void;
  onClearFilters?: () => void;
};

export function EmptyProjects({
  isFiltered,
  onCreateClick,
  onClearFilters,
}: EmptyProjectsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="flex min-h-[300px] flex-col items-center justify-center py-20 text-center"
    >
      {/* Geometric SVG — precision instrument aesthetic */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-8 opacity-20 dark:opacity-20"
        aria-hidden="true"
      >
        {/* Concentric rings */}
        <circle
          cx="60"
          cy="60"
          r="45"
          className="stroke-[#0090FF]"
          strokeWidth="0.5"
          opacity="0.3"
        />
        <circle
          cx="60"
          cy="60"
          r="30"
          className="stroke-[#0090FF]"
          strokeWidth="0.5"
          opacity="0.2"
        />
        <circle
          cx="60"
          cy="60"
          r="15"
          className="stroke-[#00C8FF] dark:stroke-[#00F7FF]"
          strokeWidth="0.5"
          opacity="0.15"
        />

        {/* Overlapping rectangles */}
        <rect
          x="30"
          y="35"
          width="35"
          height="25"
          rx="2"
          className="stroke-[#0090FF]"
          strokeWidth="0.75"
          opacity="0.3"
        />
        <rect
          x="45"
          y="50"
          width="35"
          height="25"
          rx="2"
          className="stroke-[#0090FF]"
          strokeWidth="0.75"
          opacity="0.2"
        />
        <rect
          x="55"
          y="60"
          width="35"
          height="25"
          rx="2"
          className="stroke-[#00C8FF] dark:stroke-[#00F7FF]"
          strokeWidth="0.75"
          opacity="0.15"
        />

        {/* Crosshair */}
        <line
          x1="57"
          y1="90"
          x2="63"
          y2="90"
          className="stroke-[#00C8FF] dark:stroke-[#00F7FF]"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="60"
          y1="87"
          x2="60"
          y2="93"
          className="stroke-[#00C8FF] dark:stroke-[#00F7FF]"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>

      <h3 className="mb-2 text-[22px] font-bold text-[#0D0D14] dark:text-gray-50">
        {isFiltered ? "No projects match your filters" : "No projects yet"}
      </h3>

      <p className="mb-8 max-w-[320px] text-[12px] leading-relaxed font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-500">
        {isFiltered
          ? "Try adjusting your search or clearing filters."
          : "Create your first project to track work, budgets, and deadlines."}
      </p>

      {isFiltered && onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-[11px] font-(--font-data) tracking-widest text-[#0090FF] uppercase transition-colors hover:text-[#006ACC] dark:text-[#00C8FF] dark:hover:text-[#00F7FF]"
        >
          Clear filters
        </button>
      ) : (
        onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className={cn(
              "flex h-[40px] items-center gap-2 rounded-[10px] px-5",
              "text-[12px] font-bold tracking-wide",
              "bg-linear-to-r from-[#00F7FF] to-[#0090FF] text-black",
              "shadow-[0_2px_12px_rgba(0,144,255,0.30)]",
              "transition-all duration-200",
              "hover:shadow-[0_4px_20px_rgba(0,144,255,0.45)] hover:brightness-110",
            )}
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )
      )}
    </motion.div>
  );
}
