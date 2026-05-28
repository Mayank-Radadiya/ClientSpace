"use client";

/**
 * SlideToApprove — production-quality tactile approval gesture
 *
 * Features:
 *   - Framer Motion drag (pointer-event-based; works on iOS/Android touch)
 *   - canvas-confetti burst on confirmed server success
 *   - Keyboard fallback: hold Enter/Space 500 ms to confirm (progress ring shown)
 *   - prefers-reduced-motion: renders a plain button instead of drag UI
 *   - No double-submission: disabled once onApproved() is in flight
 *   - Error path: thumb snaps back, toast shown
 *   - Self-contained — no external CSS file
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";

// ─── Spring presets ────────────────────────────────────────────────────────────
const SPRING_SNAP = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const SPRING_SETTLE = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

// ─── Confetti ─────────────────────────────────────────────────────────────────
type ConfettiFn = (opts: {
  particleCount: number;
  spread: number;
  origin: { x: number; y: number };
  colors: string[];
  gravity: number;
  scalar: number;
}) => void;

let confettiFn: ConfettiFn | null = null;

async function loadConfetti(): Promise<ConfettiFn> {
  if (confettiFn) return confettiFn;
  const mod = await import("canvas-confetti");
  confettiFn = mod.default as unknown as ConfettiFn;
  return confettiFn;
}

function fireConfetti() {
  loadConfetti()
    .then((fire) => {
      const opts = {
        particleCount: 80,
        spread: 60,
        origin: { x: 0.5, y: 0.8 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
        gravity: 1.2,
        scalar: 0.9,
      };
      fire(opts);
      // Staggered second burst for celebration feel
      setTimeout(() => {
        fire({ ...opts, particleCount: 40, spread: 40 });
      }, 800);
    })
    .catch(() => {
      // Confetti is optional; ignore load errors
    });
}

// ─── Constants ────────────────────────────────────────────────────────────────
const THUMB_SIZE = 48; // px — diameter of the draggable handle
const TRACK_PADDING = 4; // px — gap between thumb edge and track edge
const KEYBOARD_HOLD_MS = 500; // ms to hold Enter/Space before confirming

// ─── Keyboard progress ring ───────────────────────────────────────────────────
function KeyboardProgressRing({ progress }: { progress: number }) {
  const r = 10;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="absolute inset-0 m-auto">
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 50ms linear" }}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M10 2a8 8 0 0 1 8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Icons (inline SVGs — Tabler-style chevrons-right & check) ───────────────
function ChevronRightDouble() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 6l6 6-6 6" />
      <path d="M12 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface SlideToApproveProps {
  label?: string;
  sublabel?: string;
  onApproved: () => Promise<void>;
  disabled?: boolean;
  variant?: "default" | "destructive";
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SlideToApprove({
  label = "Slide to approve",
  sublabel,
  onApproved,
  disabled = false,
  variant = "default",
}: SlideToApproveProps) {
  // ── Reduced-motion gate ──────────────────────────────────────────────────
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const trackRef = useRef<HTMLDivElement>(null);
  const confettiFiredRef = useRef(false);

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Keyboard hold state
  const [keyProgress, setKeyProgress] = useState(0);
  const keyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keyStartRef = useRef<number | null>(null);

  // ── Motion values ─────────────────────────────────────────────────────────
  const x = useMotionValue(0);

  // Derive label opacity from thumb position (fades out as thumb slides right)
  const labelOpacity = useTransform(x, () => {
    const track = trackRef.current;
    if (!track) return 1;
    const maxX = track.clientWidth - THUMB_SIZE - TRACK_PADDING * 2;
    return Math.max(0, 1 - (x.get() / maxX) * 1.4);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isEffectivelyDisabled =
    disabled || phase === "loading" || phase === "success";

  const getMaxX = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    return track.clientWidth - THUMB_SIZE - TRACK_PADDING * 2;
  }, []);

  const snapBack = useCallback(() => {
    void animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  }, [x]);

  const snapForward = useCallback(() => {
    void animate(x, getMaxX(), { type: "spring", stiffness: 200, damping: 25 });
  }, [x, getMaxX]);

  // ── Approval execution ────────────────────────────────────────────────────
  const executeApproval = useCallback(async () => {
    if (isEffectivelyDisabled) return;
    setPhase("loading");
    snapForward();

    // Haptic feedback (mobile)
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }
    } catch {
      // Not supported — ignore
    }

    try {
      await onApproved();

      // Confetti only fires on confirmed server success, once per session
      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true;
        fireConfetti();
      }

      setPhase("success");
    } catch (err) {
      setPhase("error");
      snapBack();

      const message =
        err instanceof Error ? err.message : "Approval failed. Please try again.";
      toast.error(message);

      // Reset to idle after showing error
      setTimeout(() => setPhase("idle"), 2000);
    }
  }, [isEffectivelyDisabled, onApproved, snapForward, snapBack]);

  // ── Drag completion check ─────────────────────────────────────────────────
  const onDragEnd = useCallback(() => {
    const maxX = getMaxX();
    // Success threshold: within 8px of right edge
    if (x.get() >= maxX - 8) {
      void executeApproval();
    } else {
      snapBack();
    }
  }, [x, getMaxX, executeApproval, snapBack]);

  // ── Keyboard interaction ──────────────────────────────────────────────────
  const startKeyHold = useCallback(() => {
    if (isEffectivelyDisabled || keyTimerRef.current) return;
    keyStartRef.current = Date.now();
    keyTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - (keyStartRef.current ?? Date.now());
      const progress = Math.min(elapsed / KEYBOARD_HOLD_MS, 1);
      setKeyProgress(progress);
      if (progress >= 1) {
        clearInterval(keyTimerRef.current!);
        keyTimerRef.current = null;
        setKeyProgress(0);
        void executeApproval();
      }
    }, 16);
  }, [isEffectivelyDisabled, executeApproval]);

  const cancelKeyHold = useCallback(() => {
    if (keyTimerRef.current) {
      clearInterval(keyTimerRef.current);
      keyTimerRef.current = null;
    }
    setKeyProgress(0);
    keyStartRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (keyTimerRef.current) clearInterval(keyTimerRef.current);
    };
  }, []);

  // ── Track colours by state ────────────────────────────────────────────────
  const trackStyle: React.CSSProperties =
    phase === "success"
      ? {
          background: "oklch(0.872 0.107 152.814)", // green-300 oklch approx
          borderColor: "oklch(0.696 0.17 162.48)",
        }
      : phase === "error"
        ? {
            background: "oklch(0.936 0.032 17.717)", // red-100
            borderColor: "oklch(0.704 0.191 22.216)",
          }
        : variant === "destructive"
          ? {
              background: "var(--muted)",
              borderColor: "var(--destructive)",
            }
          : {
              background: "var(--muted)",
              borderColor: "var(--border)",
            };

  const thumbStyle: React.CSSProperties =
    phase === "success"
      ? {
          background: "oklch(0.527 0.154 162.48)", // emerald-600
          color: "white",
          borderColor: "oklch(0.432 0.132 162.48)",
        }
      : phase === "error"
        ? {
            background: "oklch(0.704 0.191 22.216)",
            color: "white",
            borderColor: "oklch(0.577 0.175 24.461)",
          }
        : variant === "destructive"
          ? {
              background: "var(--destructive)",
              color: "oklch(1 0 0)",
              borderColor: "var(--destructive)",
            }
          : {
              background: "var(--card)",
              color: "var(--foreground)",
              borderColor: "var(--border)",
            };

  // ── Reduced-motion fallback ───────────────────────────────────────────────
  if (reducedMotion) {
    return (
      <div className="space-y-1.5">
        {sublabel && (
          <p className="text-muted-foreground text-xs">{sublabel}</p>
        )}
        <button
          type="button"
          onClick={() => void executeApproval()}
          disabled={isEffectivelyDisabled}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-all",
            "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
            phase === "success"
              ? "border-emerald-500 bg-emerald-100 text-emerald-700"
              : phase === "loading"
                ? "cursor-wait opacity-75"
                : variant === "destructive"
                  ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                  : "border-border bg-muted hover:bg-muted/80",
            isEffectivelyDisabled && "cursor-not-allowed opacity-50",
          )}
          aria-label={
            phase === "success"
              ? "Assets approved"
              : "Confirm approval"
          }
        >
          {phase === "loading" ? (
            <Spinner />
          ) : phase === "success" ? (
            <>
              <CheckIcon />
              Approved
            </>
          ) : (
            label
          )}
        </button>
      </div>
    );
  }

  // ── Full drag UI ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-1.5">
      {sublabel && (
        <p className="text-muted-foreground text-xs text-center">{sublabel}</p>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        role="button"
        tabIndex={isEffectivelyDisabled ? -1 : 0}
        aria-label="Slide to approve asset delivery"
        aria-disabled={isEffectivelyDisabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            startKeyHold();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            cancelKeyHold();
          }
        }}
        onBlur={cancelKeyHold}
        style={{
          position: "relative",
          height: 56,
          borderRadius: 28,
          border: "0.5px solid",
          overflow: "hidden",
          userSelect: "none",
          WebkitUserSelect: "none",
          transition: "background 0.4s, border-color 0.4s",
          cursor: isEffectivelyDisabled ? "not-allowed" : "default",
          opacity: disabled ? 0.55 : 1,
          ...trackStyle,
        }}
        className="focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2"
      >
        {/* Label */}
        <motion.span
          style={{ opacity: phase === "success" ? 1 : labelOpacity }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium"
          aria-hidden
          transition={{ duration: 0.2 }}
        >
          <span
            style={{
              color:
                phase === "success"
                  ? "oklch(0.265 0.09 162.48)"
                  : "var(--muted-foreground)",
              transition: "color 0.3s",
              marginLeft: THUMB_SIZE + TRACK_PADDING * 2,
            }}
          >
            {phase === "success" ? "Approved ✓" : label}
          </span>
        </motion.span>

        {/* Keyboard progress ring overlay */}
        {keyProgress > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="bg-background/60 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm">
              <KeyboardProgressRing progress={keyProgress} />
            </div>
          </div>
        )}

        {/* Draggable thumb */}
        <motion.div
          drag={!isEffectivelyDisabled ? "x" : false}
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={onDragEnd}
          style={{
            x,
            position: "absolute",
            top: TRACK_PADDING,
            left: TRACK_PADDING,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid",
            cursor: isEffectivelyDisabled
              ? "not-allowed"
              : phase === "idle" || phase === "error"
                ? "grab"
                : "default",
            flexShrink: 0,
            zIndex: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
            transition: "background 0.3s, border-color 0.3s",
            ...thumbStyle,
          }}
          whileDrag={{ scale: 1.06, boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
        >
          {phase === "loading" ? (
            <Spinner />
          ) : phase === "success" ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <CheckIcon />
            </motion.div>
          ) : (
            <motion.div
              animate={
                phase === "idle"
                  ? { x: [0, 3, 0] }
                  : {}
              }
              transition={{
                repeat: Infinity,
                repeatDelay: 2,
                duration: 0.6,
                ease: "easeInOut",
              }}
            >
              <ChevronRightDouble />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
