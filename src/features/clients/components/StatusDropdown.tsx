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
    dot: "bg-emerald-500 shadow-emerald-500/40 shadow-sm",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20",
    label: "Active",
  },
  inactive: {
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
    label: "Inactive",
  },
  pending: {
    dot: "bg-amber-500 shadow-amber-500/40 shadow-sm",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20",
    label: "Pending",
  },
  archived: {
    dot: "bg-neutral-500",
    badge: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-500 border-neutral-500/20",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-[var(--font-data)] font-bold uppercase transition-colors duration-200",
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
            className="bg-popover border-border absolute top-full right-0 z-50 mt-1 w-[130px] overflow-hidden rounded-xl border py-1 shadow-2xl backdrop-blur-xl"
          >
            {ALL_STATUSES.map((s) => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-[0.12em] uppercase transition-colors duration-100 hover:bg-muted",
                    s === status ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                >
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
                  {c.label}
                  {s === status && (
                    <svg className="text-primary ml-auto h-3 w-3" viewBox="0 0 12 12" fill="none">
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
