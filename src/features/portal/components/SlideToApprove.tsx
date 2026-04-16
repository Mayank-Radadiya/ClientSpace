"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideToApproveProps {
  onApprove: () => void;
  disabled?: boolean;
}

const THRESHOLD = 0.9;

export function SlideToApprove({ onApprove, disabled }: SlideToApproveProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const confettiCount = useMemo(() => 10, []);

  const updateProgress = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const thumbSize = 36;
    const max = rect.width - thumbSize;
    const next = Math.min(
      Math.max(clientX - rect.left - thumbSize / 2, 0),
      max,
    );
    setProgress(max <= 0 ? 0 : next / max);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || done) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateProgress(event.clientX);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || disabled || done) return;
    updateProgress(event.clientX);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || disabled || done) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);

    if (progress >= THRESHOLD) {
      setDone(true);
      setProgress(1);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }
      onApprove();
      return;
    }

    setProgress(0);
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className={cn(
          "bg-muted relative h-10 w-full overflow-hidden rounded-full border",
          disabled && "opacity-60",
        )}
      >
        <div
          className="bg-primary/20 absolute inset-y-0 left-0 transition-[width] duration-150"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
        <span className="text-muted-foreground absolute inset-0 flex items-center justify-center text-xs font-medium">
          {done ? "Approved" : "Slide to approve"}
        </span>

        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          disabled={disabled || done}
          className="bg-primary text-primary-foreground absolute top-0.5 left-0.5 flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            transform: `translateX(calc(${progress * 100}% - ${progress * 36}px))`,
          }}
          aria-label="Slide to approve"
        >
          {done ? (
            <Check className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {done ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {Array.from({ length: confettiCount }).map((_, i) => (
            <span
              key={i}
              className="animate-confetti-burst absolute h-1.5 w-1.5 rounded-full"
              style={
                {
                  backgroundColor: [
                    "#22c55e",
                    "#3b82f6",
                    "#eab308",
                    "#ef4444",
                    "#8b5cf6",
                  ][i % 5],
                  animationDelay: `${i * 30}ms`,
                  "--x": `${(i % 2 === 0 ? 1 : -1) * (6 + i * 6)}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
