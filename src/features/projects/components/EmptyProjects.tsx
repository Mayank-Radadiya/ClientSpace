"use client";

import { motion } from "motion/react";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="flex min-h-[400px] flex-col items-center justify-center py-24 text-center"
    >
      {/* Animated SVG illustration */}
      <div className="relative mb-10 h-32 w-32">
        {/* Outer orbiting ring */}
        <svg
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: "12s" }}
          viewBox="0 0 128 128"
          fill="none"
        >
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="url(#orbit-grad)"
            strokeWidth="1"
            strokeDasharray="8 14"
            opacity="0.4"
          />
          <defs>
            <linearGradient id="orbit-grad" x1="0" y1="0" x2="128" y2="128">
              <stop stopColor="#6C63FF" />
              <stop offset="1" stopColor="#00F5D4" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Counter-orbiting ring */}
        <svg
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: "8s", animationDirection: "reverse" }}
          viewBox="0 0 128 128"
          fill="none"
        >
          <circle
            cx="64"
            cy="64"
            r="44"
            stroke="url(#orbit-grad-2)"
            strokeWidth="0.75"
            strokeDasharray="4 10"
            opacity="0.3"
          />
          <defs>
            <linearGradient id="orbit-grad-2" x1="0" y1="0" x2="128" y2="128">
              <stop stopColor="#00F5D4" />
              <stop offset="1" stopColor="#6C63FF" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center icon group */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border bg-white border-black/10 shadow-xl dark:bg-[#08090D] dark:border-white/[0.08] dark:shadow-none"
          >
            {/* Inner glow */}
            <div
              className="absolute inset-0 rounded-2xl hidden dark:block"
              style={{
                boxShadow: "inset 0 0 20px rgba(108,99,255,0.2)",
              }}
            />
            {/* Mini floating project cards */}
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              {/* Card stack */}
              <rect x="4" y="10" width="22" height="16" rx="3" className="fill-indigo-500/30 stroke-indigo-500/60" strokeWidth="0.75" />
              <rect x="7" y="7" width="22" height="16" rx="3" className="fill-teal-500/15 stroke-teal-500/40" strokeWidth="0.75" />
              <rect x="10" y="4" width="22" height="16" rx="3" className="fill-white/10 stroke-white/20" strokeWidth="0.75" />
              {/* Plus on top card */}
              <line x1="19" y1="9" x2="19" y2="13" className="stroke-white/50" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="17" y1="11" x2="21" y2="11" className="stroke-white/50" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Orbital dot — violet */}
        <div
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{
            background: "#6C63FF",
            boxShadow: "0 0 8px #6C63FF",
            top: "5px",
            left: "50%",
            transform: "translateX(-50%)",
            animation: "orbit-dot 12s linear infinite",
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background:
              "radial-gradient(circle at center, rgba(108,99,255,0.08) 0%, transparent 60%)",
          }}
        />
      </div>

      <h3
        className="mb-2 text-2xl font-bold text-gray-900 dark:text-[#F4F4FF]"
      >
        {isFiltered ? "No projects match" : "No projects yet"}
      </h3>

      <p
        className="mb-8 max-w-[300px] text-[12px] leading-relaxed tracking-[0.04em] text-gray-500 dark:text-white/35"
        style={{
          fontFamily: "var(--font-data, monospace)",
        }}
      >
        {isFiltered
          ? "Try adjusting your search or clearing the active filters."
          : "Create your first project to track work, budgets, and deadlines in one beautiful space."}
      </p>

      {isFiltered && onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-[11px] tracking-[0.08em] uppercase transition-opacity duration-200 hover:opacity-70"
          style={{
            color: "#6C63FF",
            fontFamily: "var(--font-data, monospace)",
          }}
        >
          Clear filters
        </button>
      ) : (
        onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className="group relative flex h-[44px] items-center gap-2 overflow-hidden rounded-xl px-6 text-[12px] font-bold tracking-wide text-white transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #6C63FF, #5B54EE)",
              boxShadow: "0 0 0 1px rgba(108,99,255,0.4), 0 8px 32px rgba(108,99,255,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 1px rgba(108,99,255,0.6), 0 12px 40px rgba(108,99,255,0.45)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 1px rgba(108,99,255,0.4), 0 8px 32px rgba(108,99,255,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Shimmer */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )
      )}

      <style jsx>{`
        @keyframes orbit-dot {
          from { transform: translateX(-50%) rotate(0deg) translateY(-55px) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg) translateY(-55px) rotate(-360deg); }
        }
      `}</style>
    </motion.div>
  );
}
