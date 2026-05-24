"use client";
// src/features/projects/components/SlideToApprove.tsx
// Drag-to-approve gesture component using Framer Motion.
// Accessible fallback: keyboard-focusable "Approve" button appears on focus-visible.

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideToApproveProps {
  onApprove: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}

const TRACK_WIDTH = 240;
const THUMB_SIZE = 36;
const MAX_DRAG = TRACK_WIDTH - THUMB_SIZE - 4; // 4px padding
const APPROVE_THRESHOLD = 0.8; // 80% of track

export function SlideToApprove({ onApprove, disabled, className }: SlideToApproveProps) {
  const [approved, setApproved] = useState(false);
  const x = useMotionValue(0);
  const progress = useTransform(x, [0, MAX_DRAG], [0, 1]);

  // Track fill opacity follows thumb position
  const fillWidth = useTransform(x, [0, MAX_DRAG], [THUMB_SIZE, TRACK_WIDTH]);

  const handleDragEnd = async () => {
    if (x.get() / MAX_DRAG >= APPROVE_THRESHOLD) {
      // Snap to end
      await animate(x, MAX_DRAG, { duration: 0.15 });
      setApproved(true);
      await onApprove();
    } else {
      // Spring back
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  if (approved) {
    return (
      <div className="flex h-10 w-60 items-center justify-center gap-2 rounded-full bg-green-500 text-white">
        <Check size={14} />
        <span className="text-sm font-medium">Approved</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Track */}
      <div
        className="relative flex h-10 items-center overflow-hidden rounded-full border border-border bg-muted"
        style={{ width: TRACK_WIDTH }}
      >
        {/* Fill */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-green-500/20"
          style={{ width: fillWidth }}
        />

        {/* Label */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-muted-foreground">
          Slide to approve →
        </span>

        {/* Draggable thumb */}
        <motion.div
          className="absolute left-0.5 flex h-9 w-9 cursor-grab items-center justify-center rounded-full bg-green-500 text-white shadow-md active:cursor-grabbing"
          drag={disabled ? false : "x"}
          dragConstraints={{ left: 0, right: MAX_DRAG }}
          dragElastic={0}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.05 }}
          role="button"
          aria-label="Slide to approve"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              setApproved(true);
              onApprove();
            }
          }}
        >
          <Check size={16} />
        </motion.div>
      </div>

      {/* Keyboard-accessible fallback button (focus-visible only) */}
      <button
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:right-0 focus-visible:top-12 focus-visible:rounded-md focus-visible:bg-green-500 focus-visible:px-3 focus-visible:py-1 focus-visible:text-sm focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        onClick={() => {
          setApproved(true);
          onApprove();
        }}
        disabled={disabled}
        aria-label="Approve this file"
      >
        Approve
      </button>
    </div>
  );
}
