// ── Status labels ─────────────────────────────────────────────
export const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
  on_hold: "On Hold",
  archived: "Archived",
  cancelled: "Cancelled",
  draft: "Draft",
};

export function formatStatus(raw: string): string {
  return STATUS_LABELS[raw] ?? raw;
}

// ── Priority labels & colors ─────────────────────────────────
export interface PriorityStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export const PRIORITY_MAP: Record<string, PriorityStyle> = {
  urgent: {
    label: "Urgent",
    bg: "bg-red-500/15",
    text: "text-red-500",
    border: "border-red-500/30",
  },
  high: {
    label: "High",
    bg: "bg-red-500/15",
    text: "text-red-500",
    border: "border-red-500/30",
  },
  medium: {
    label: "Medium",
    bg: "bg-amber-500/15",
    text: "text-amber-500",
    border: "border-amber-500/30",
  },
  low: {
    label: "Low",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

export function getPriorityStyle(raw: string): PriorityStyle {
  return (
    PRIORITY_MAP[raw] ?? {
      label: raw,
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
    }
  );
}

// ── Client name formatting ───────────────────────────────────
export function formatClientName(raw: string | null | undefined): string {
  if (!raw) return "Unassigned";
  const cleaned = raw.replace(/,+\s*$/g, "").trim();
  return cleaned || "Unassigned";
}

// ── Currency formatting ──────────────────────────────────────
export function formatCurrency(cents: number | null | undefined): string {
  if (cents == null) return "Unset";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
