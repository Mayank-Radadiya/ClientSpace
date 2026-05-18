import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  PauseCircle,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "review"
  | "completed"
  | "on_hold"
  | "archived";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export type ProjectCardData = {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: string | null;
  startDate: string | null;
  isOverdue: boolean;
  clientCompanyName: string | null;
  clientEmail: string | null;
  tags: string[] | null;
  description: string | null;
  budget: number | null;
  createdAt: string;
};

/* ─── Industrial Antigravity Status Colors ──────────────────────────── */

type StatusVisual = {
  /** Hex color for dots, lines, fills */
  hex: string;
  /** Tailwind bg at 10% opacity */
  bg: string;
  /** Text color */
  text: string;
  /** Border at 25% opacity */
  border: string;
  /** Solid dot bg */
  dot: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Left-edge / top-edge line inline style color */
  lineColor: string;
  /** Light theme: faint tinted background for status pills */
  lightBg: string;
};

type PriorityVisual = {
  hex: string;
  dot: string;
  text: string;
};

export const STATUS_CONFIG: Record<ProjectStatus, StatusVisual> = {
  not_started: {
    hex: "#6B6B7E",
    bg: "bg-[rgba(107,107,126,0.08)]",
    text: "text-[#6B6B7E]",
    border: "border-[rgba(107,107,126,0.20)]",
    dot: "bg-[#6B6B7E]",
    icon: Circle,
    lineColor: "#6B6B7E",
    lightBg: "bg-[rgba(107,107,126,0.06)]",
  },
  in_progress: {
    hex: "#0090FF",
    bg: "bg-[rgba(0,144,255,0.08)]",
    text: "text-[#00C8FF]",
    border: "border-[rgba(0,144,255,0.20)]",
    dot: "bg-[#0090FF]",
    icon: RotateCcw,
    lineColor: "#0090FF",
    lightBg: "bg-[rgba(0,144,255,0.06)]",
  },
  review: {
    hex: "#F59E0B",
    bg: "bg-[rgba(245,158,11,0.08)]",
    text: "text-[#F59E0B]",
    border: "border-[rgba(245,158,11,0.20)]",
    dot: "bg-[#F59E0B]",
    icon: Clock,
    lineColor: "#F59E0B",
    lightBg: "bg-[rgba(245,158,11,0.06)]",
  },
  completed: {
    hex: "#34D399",
    bg: "bg-[rgba(52,211,153,0.08)]",
    text: "text-[#34D399]",
    border: "border-[rgba(52,211,153,0.20)]",
    dot: "bg-[#34D399]",
    icon: CheckCircle2,
    lineColor: "#34D399",
    lightBg: "bg-[rgba(52,211,153,0.06)]",
  },
  on_hold: {
    hex: "#F59E0B",
    bg: "bg-[rgba(245,158,11,0.08)]",
    text: "text-[#F59E0B]",
    border: "border-[rgba(245,158,11,0.20)]",
    dot: "bg-[#F59E0B]",
    icon: PauseCircle,
    lineColor: "#F59E0B",
    lightBg: "bg-[rgba(245,158,11,0.06)]",
  },
  archived: {
    hex: "#6B6B7E",
    bg: "bg-[rgba(107,107,126,0.08)]",
    text: "text-[#6B6B7E]",
    border: "border-[rgba(107,107,126,0.20)]",
    dot: "bg-[#6B6B7E]",
    icon: Archive,
    lineColor: "#6B6B7E",
    lightBg: "bg-[rgba(107,107,126,0.06)]",
  },
};

export const PRIORITY_CONFIG: Record<ProjectPriority, PriorityVisual> = {
  low: {
    hex: "#34D399",
    dot: "bg-[#34D399]",
    text: "text-[#34D399]",
  },
  medium: {
    hex: "#F59E0B",
    dot: "bg-[#F59E0B]",
    text: "text-[#F59E0B]",
  },
  high: {
    hex: "#EF4444",
    dot: "bg-[#EF4444]",
    text: "text-[#EF4444]",
  },
  urgent: {
    hex: "#EF4444",
    dot: "bg-[#EF4444]",
    text: "text-[#EF4444]",
  },
};

export const DEADLINE_ICONS = {
  overdue: AlertTriangle,
  soon: Clock,
  date: Calendar,
} as const;

export const STATUS_PROGRESS: Record<ProjectStatus, number> = {
  not_started: 10,
  in_progress: 55,
  review: 85,
  completed: 100,
  on_hold: 45,
  archived: 100,
};

/* ─── Shared Design Tokens (Industrial Antigravity) ─────────────────── */

export const ANTIGRAVITY = {
  /** Spring-like easing for smooth deceleration */
  cubic: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** SVG noise overlay data URI */
  noise: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  /** Deep Space background (dark) */
  bg: "#0D0F16",
  /** Light theme background */
  bgLight: "#F0F0F5",
  /** Panel surface translucent (dark) */
  surface: "rgba(26,29,39,0.50)",
  /** Light theme card surface */
  surfaceLight: "#FFFFFF",
  /** Light theme border */
  borderLight: "#EBEBF0",
  /** Light theme primary text */
  textLight: "#0D0D14",
  /** Light theme secondary text */
  textMutedLight: "#6B6B7E",
  /** Primary gradient */
  gradient: "linear-gradient(90deg, #00F7FF, #0090FF)",
  /** Cyan accent */
  cyan: "#00F7FF",
  /** Blue accent */
  blue: "#0090FF",
} as const;

/** @deprecated Use ANTIGRAVITY instead */
export const OBSIDIAN = ANTIGRAVITY;
