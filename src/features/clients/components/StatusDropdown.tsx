"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { ClientDisplayStatus } from "../client.types";
import { statusLabel } from "../utils/formatters";

const STATUS_CONFIG: Record<
  ClientDisplayStatus,
  { dot: string; badge: string; label: string }
> = {
  active: {
    dot: "bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.4)]",
    badge: "bg-[rgba(34,197,94,0.10)] text-[#22C55E] border-[rgba(34,197,94,0.20)]",
    label: "Active",
  },
  inactive: {
    dot: "bg-[#6B6B7E]",
    badge: "bg-[rgba(107,107,126,0.10)] text-[#6B6B7E] border-[rgba(107,107,126,0.20)]",
    label: "Inactive",
  },
  pending: {
    dot: "bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.4)]",
    badge: "bg-[rgba(245,158,11,0.10)] text-[#F59E0B] border-[rgba(245,158,11,0.20)]",
    label: "Pending",
  },
  archived: {
    dot: "bg-[#3D3D4E]",
    badge: "bg-[rgba(61,61,78,0.10)] text-[#3D3D4E] border-[rgba(61,61,78,0.20)]",
    label: "Archived",
  },
};

const ALL_STATUSES: ClientDisplayStatus[] = ["active", "inactive", "pending", "archived"];

type StatusDropdownProps = {
  status: ClientDisplayStatus;
  onChange?: (newStatus: ClientDisplayStatus) => void;
  disabled?: boolean;
  /** If false, only renders a display badge (no interactivity) */
  interactive?: boolean;
};

export function StatusDropdown({
  status,
  onChange,
  disabled,
  interactive = true,
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = STATUS_CONFIG[status];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const badge = (
    <motion.div
      layout
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.15em] uppercase transition-colors duration-200",
        config.badge,
        interactive && !disabled && "cursor-pointer hover:opacity-90",
      )}
      onClick={(e) => {
        if (!interactive || disabled || !onChange) return;
        e.stopPropagation();
        setOpen((v) => !v);
      }}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-200", config.dot)}
      />
      <motion.span
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {config.label}
      </motion.span>
      {interactive && onChange && (
        <svg
          className={cn("h-2.5 w-2.5 transition-transform duration-150", open && "rotate-180")}
          viewBox="0 0 10 6"
          fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </motion.div>
  );

  if (!interactive || !onChange) return badge;

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {badge}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 z-50 mt-1 w-[130px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#16161F] py-1 shadow-2xl backdrop-blur-xl"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)" }}
          >
            {ALL_STATUSES.map((s) => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-[0.12em] uppercase transition-colors duration-100 hover:bg-white/5",
                    s === status ? "text-white" : "text-[#6B6B7E] hover:text-white",
                  )}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                >
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
                  {c.label}
                  {s === status && (
                    <svg className="ml-auto h-3 w-3 text-[#4F7FFF]" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
