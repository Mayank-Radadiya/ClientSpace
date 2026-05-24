"use client";

// src/features/projects/project-detail/components/v3/GuestPreviewBar.tsx
// 48px sticky amber bar at Zone 0.
// Activated when `isPreviewMode` is true.

import { Eye, X } from "lucide-react";

interface GuestPreviewBarProps {
  onExitPreview: () => void;
}

export function GuestPreviewBar({ onExitPreview }: GuestPreviewBarProps) {
  return (
    <div
      className="flex w-full items-center justify-center gap-3 px-8"
      style={{
        height: 48,
        background: "hsla(38, 92%, 50%, 0.08)",
        borderBottom: "1px solid hsla(38, 92%, 50%, 0.2)",
      }}
    >
      <Eye
        size={14}
        style={{ color: "hsl(38, 80%, 45%)", flexShrink: 0 }}
      />
      <span
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 13,
          color: "hsl(38, 80%, 45%)",
          fontWeight: 500,
        }}
      >
        You're previewing this project as your client would see it
      </span>
      <button
        onClick={onExitPreview}
        className="flex items-center gap-1.5 rounded-md px-3 py-1 transition-colors"
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 12,
          fontWeight: 500,
          color: "hsl(38, 80%, 45%)",
          background: "hsla(38, 92%, 50%, 0.1)",
          border: "1px solid hsla(38, 92%, 50%, 0.25)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "hsla(38, 92%, 50%, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "hsla(38, 92%, 50%, 0.1)";
        }}
      >
        Exit preview →
      </button>
    </div>
  );
}
