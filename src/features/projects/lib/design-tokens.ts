/**
 * Projects Design Tokens — JS-accessible constants
 *
 * These map 1:1 with the CSS custom properties defined in globals.css
 * under the `--pd-*` namespace. Use these in components that need
 * dynamic inline styles (e.g., status-colored progress bars, gradients).
 *
 * For static styling, prefer Tailwind classes or CSS variables directly.
 */

/* ── Primary accent ──────────────────────────────────────────── */
export const ACCENT = "#6C63FF" as const;
export const ACCENT_HOVER = "#5B54EE" as const;
export const ACCENT_LIGHT = "#8B83FF" as const;
export const ACCENT_SUBTLE = "rgba(108,99,255,0.10)" as const;
export const ACCENT_BORDER = "rgba(108,99,255,0.25)" as const;

/* ── Semantic colors ─────────────────────────────────────────── */
export const TEAL = "#00F5D4" as const;
export const SUCCESS = "#34D399" as const;
export const WARNING = "#F59E0B" as const;
export const DANGER = "#FF4D6D" as const;

/* ── Status config — maps project status → visual properties ── */
export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "review"
  | "completed"
  | "on_hold"
  | "archived";

export const STATUS_COLORS: Record<
  ProjectStatus,
  { color: string; bg: string; label: string }
> = {
  not_started: {
    color: "#9CA3AF",
    bg: "rgba(156,163,175,0.10)",
    label: "Not Started",
  },
  in_progress: {
    color: ACCENT,
    bg: "rgba(108,99,255,0.10)",
    label: "In Progress",
  },
  review: {
    color: TEAL,
    bg: "rgba(0,245,212,0.10)",
    label: "In Review",
  },
  completed: {
    color: SUCCESS,
    bg: "rgba(52,211,153,0.10)",
    label: "Completed",
  },
  on_hold: {
    color: WARNING,
    bg: "rgba(245,158,11,0.10)",
    label: "On Hold",
  },
  archived: {
    color: "#6B7280",
    bg: "rgba(107,114,128,0.10)",
    label: "Archived",
  },
} as const;

/* ── Priority config ─────────────────────────────────────────── */
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export const PRIORITY_COLORS: Record<
  ProjectPriority,
  { color: string; bg: string; label: string }
> = {
  low: {
    color: SUCCESS,
    bg: "rgba(52,211,153,0.10)",
    label: "Low",
  },
  medium: {
    color: WARNING,
    bg: "rgba(245,158,11,0.10)",
    label: "Medium",
  },
  high: {
    color: DANGER,
    bg: "rgba(255,77,109,0.10)",
    label: "High",
  },
  urgent: {
    color: DANGER,
    bg: "rgba(255,77,109,0.10)",
    label: "Urgent",
  },
} as const;

/* ── Helpers ─────────────────────────────────────────────────── */

/** Returns the accent color for a given status, with overdue override */
export function getStatusAccent(status: string, isOverdue = false): string {
  if (isOverdue) return DANGER;
  return (
    STATUS_COLORS[status as ProjectStatus]?.color ?? "rgba(156,163,175,0.5)"
  );
}

/** Returns a deterministic gradient for a client name (for avatars) */
export function getClientGradient(name: string): string {
  const pairs = [
    [ACCENT, "#9B59B6"],
    [TEAL, "#00B4D8"],
    [WARNING, "#EF4444"],
    [SUCCESS, "#06B6D4"],
    [DANGER, "#C0392B"],
    ["#6366F1", "#8B5CF6"],
  ] as const;
  const idx = (name?.charCodeAt(0) ?? 0) % pairs.length;
  return `linear-gradient(135deg, ${pairs[idx]![0]}, ${pairs[idx]![1]})`;
}

/** Formats a budget number as compact currency */
export function formatBudgetShort(raw: string | number | null | undefined): string {
  if (raw == null) return "";
  const num = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[$,]/g, ""));
  if (isNaN(num)) return String(raw);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${Math.round(num / 1_000)}K`;
  return `$${num}`;
}
