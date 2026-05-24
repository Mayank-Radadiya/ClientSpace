"use client";
// src/features/projects/components/GuestPreviewBar.tsx
// Sticky top bar shown when ?preview=guest is active.
// Fix 12: Tailwind semantic classes only.

import { Eye, X } from "lucide-react";

interface GuestPreviewBarProps {
  onExit: () => void;
}

export function GuestPreviewBar({ onExit }: GuestPreviewBarProps) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-2 dark:border-amber-800/40 dark:bg-amber-950/40">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
        <Eye size={14} />
        <span className="text-sm font-medium">
          You are previewing as a guest stakeholder.
        </span>
      </div>
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-400 dark:hover:bg-amber-900/30"
        aria-label="Exit guest preview"
      >
        Exit preview
        <X size={13} />
      </button>
    </div>
  );
}
