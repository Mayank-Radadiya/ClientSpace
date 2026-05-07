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
    bar: "bg-[#22C55E]",
    bg: "border-[rgba(34,197,94,0.15)]",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-[#22C55E]" viewBox="0 0 16 16" fill="none">
        <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    bar: "bg-[#EF4444]",
    bg: "border-[rgba(239,68,68,0.15)]",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-[#EF4444]" viewBox="0 0 16 16" fill="none">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    bar: "bg-[#4F7FFF]",
    bg: "border-[rgba(79,127,255,0.15)]",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-[#4F7FFF]" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  warning: {
    bar: "bg-[#F59E0B]",
    bg: "border-[rgba(245,158,11,0.15)]",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-[#F59E0B]" viewBox="0 0 16 16" fill="none">
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
                "pointer-events-auto relative flex w-[320px] items-start gap-3 overflow-hidden rounded-xl border bg-[#111118] px-4 py-3 shadow-2xl backdrop-blur-xl",
                style.bg,
              )}
            >
              {/* Left accent bar */}
              <div className={cn("absolute top-0 left-0 h-full w-[3px]", style.bar)} />

              {/* Icon */}
              <div className="mt-0.5 ml-2">{style.icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium leading-snug text-[#F2F2F5] font-[var(--font-data)]">
                  {toast.message}
                </p>
                {toast.undoLabel && toast.onUndo && (
                  <button
                    className="mt-1 text-[11px] font-semibold tracking-wide text-[#4F7FFF] hover:text-[#6B95FF] transition-colors uppercase"
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
                className="mt-0.5 shrink-0 text-[#3D3D4E] hover:text-[#6B6B7E] transition-colors"
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
