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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-[300px] flex-col items-center justify-center py-20 text-center"
    >
      {/* Geometric SVG — overlapping rectangles + circles */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-8 opacity-30"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle cx="60" cy="60" r="45" stroke="#4F7FFF" strokeWidth="1" opacity="0.2" />
        <circle cx="60" cy="60" r="30" stroke="#4F7FFF" strokeWidth="1" opacity="0.15" />

        {/* Overlapping rectangles */}
        <rect x="30" y="35" width="35" height="25" rx="4" stroke="#4F7FFF" strokeWidth="1.5" opacity="0.4" />
        <rect x="45" y="50" width="35" height="25" rx="4" stroke="#4F7FFF" strokeWidth="1.5" opacity="0.3" fill="rgba(79,127,255,0.04)" />
        <rect x="55" y="60" width="35" height="25" rx="4" stroke="#4F7FFF" strokeWidth="1.5" opacity="0.2" />

        {/* Accent dots */}
        <circle cx="38" cy="42" r="2" fill="#4F7FFF" opacity="0.5" />
        <circle cx="72" cy="68" r="2" fill="#4F7FFF" opacity="0.4" />
        <circle cx="60" cy="55" r="3" fill="#4F7FFF" opacity="0.3" />

        {/* Plus icon in center */}
        <line x1="57" y1="90" x2="63" y2="90" stroke="#4F7FFF" strokeWidth="1.5" opacity="0.5" />
        <line x1="60" y1="87" x2="60" y2="93" stroke="#4F7FFF" strokeWidth="1.5" opacity="0.5" />
      </svg>

      <h3 className="font-(--font-display) mb-2 text-[22px] font-bold text-[#0D0D14] dark:text-[#F2F2F5]">
        {isFiltered ? "No projects match your filters" : "No projects yet"}
      </h3>

      <p className="font-(--font-data) mb-8 max-w-[320px] text-[14px] leading-relaxed text-[#6B6B7E]">
        {isFiltered
          ? "Try adjusting your search or clearing filters."
          : "Create your first project to track work, budgets, and deadlines."}
      </p>

      {isFiltered && onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="font-(--font-data) text-[13px] text-[#4F7FFF] transition-colors hover:text-[#6B95FF]"
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
              "font-(--font-data) text-[12px] tracking-[0.04em] uppercase",
              "bg-[#4F7FFF] text-white shadow-[0_2px_8px_rgba(79,127,255,0.3)]",
              "transition-all duration-180",
              "hover:bg-[#6B95FF] hover:shadow-[0_4px_16px_rgba(79,127,255,0.35)]",
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
