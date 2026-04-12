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

type StatusVisual = {
  color: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: LucideIcon;
  ring: string;
  glow: string;
};

type PriorityVisual = {
  dot: string;
  badge: string;
};

export const STATUS_CONFIG: Record<ProjectStatus, StatusVisual> = {
  not_started: {
    color: "from-gray-500 to-gray-700",
    bg: "bg-gray-500/10",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-500/25",
    dot: "bg-gray-500",
    icon: Circle,
    ring: "hover:ring-gray-500/40",
    glow: "from-gray-500/12 via-gray-400/0",
  },
  in_progress: {
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/25",
    dot: "bg-blue-500",
    icon: RotateCcw,
    ring: "hover:ring-blue-500/40",
    glow: "from-blue-500/16 via-indigo-400/0",
  },
  review: {
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/25",
    dot: "bg-amber-500",
    icon: Clock,
    ring: "hover:ring-amber-500/40",
    glow: "from-amber-500/16 via-orange-400/0",
  },
  completed: {
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/25",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    ring: "hover:ring-emerald-500/40",
    glow: "from-emerald-500/16 via-teal-400/0",
  },
  on_hold: {
    color: "from-orange-500 to-red-500",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/25",
    dot: "bg-amber-500",
    icon: PauseCircle,
    ring: "hover:ring-amber-500/40",
    glow: "from-amber-500/16 via-red-400/0",
  },
  archived: {
    color: "from-gray-500 to-gray-700",
    bg: "bg-gray-500/10",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-500/25",
    dot: "bg-gray-500",
    icon: Archive,
    ring: "hover:ring-gray-500/40",
    glow: "from-gray-500/12 via-gray-400/0",
  },
};

export const PRIORITY_CONFIG: Record<ProjectPriority, PriorityVisual> = {
  low: {
    dot: "bg-gray-400",
    badge: "text-gray-700 bg-gray-500/10 border-gray-500/25 dark:text-gray-300",
  },
  medium: {
    dot: "bg-amber-500",
    badge:
      "text-amber-700 bg-amber-500/10 border-amber-500/25 dark:text-amber-300",
  },
  high: {
    dot: "bg-red-500",
    badge: "text-red-700 bg-red-500/10 border-red-500/25 dark:text-red-300",
  },
  urgent: {
    dot: "bg-red-500",
    badge: "text-red-700 bg-red-500/10 border-red-500/25 dark:text-red-300",
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
