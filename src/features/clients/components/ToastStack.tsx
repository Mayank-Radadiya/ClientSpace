"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ToastItem } from "../hooks/useToast";

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const TYPE_STYLES: Record<
  ToastItem["type"],
  { bar: string; icon: React.ReactNode; bg: string }
> = {
  success: {
    bar: "bg-emerald-500",
    bg: "border-emerald-500/15",
    icon: (
      <svg className="text-emerald-500 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
        <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    bar: "bg-destructive",
    bg: "border-destructive/15",
    icon: (
      <svg className="text-destructive h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    bar: "bg-primary",
    bg: "border-primary/15",
    icon: (
      <svg className="text-primary h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  warning: {
    bar: "bg-amber-500",
    bg: "border-amber-500/15",
    icon: (
      <svg className="text-amber-500 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-[9999] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = TYPE_STYLES[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "bg-popover/95 pointer-events-auto relative flex w-[320px] items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl",
                style.bg,
              )}
            >
              {/* Left accent bar */}
              <div className={cn("absolute top-0 left-0 h-full w-[3px]", style.bar)} />

              {/* Icon */}
              <div className="mt-0.5 ml-2">{style.icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-[13px] font-[var(--font-data)] font-medium leading-snug">
                  {toast.message}
                </p>
                {toast.undoLabel && toast.onUndo && (
                  <button
                    className="text-primary hover:text-primary/80 mt-1 text-[11px] font-semibold tracking-wide uppercase transition-colors"
                    onClick={() => {
                      toast.onUndo?.();
                      onDismiss(toast.id);
                    }}
                  >
                    {toast.undoLabel}
                  </button>
                )}
              </div>

              {/* Dismiss button */}
              <button
                className="text-muted-foreground/60 hover:text-muted-foreground mt-0.5 shrink-0 transition-colors"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
