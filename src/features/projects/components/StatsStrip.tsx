"use client";
// src/features/projects/components/StatsStrip.tsx
// Horizontal metrics band with 5 chips + velocity sparkline.
// All values are precomputed server-side props — no hooks, no data fetching.
// Fix 12: Tailwind semantic classes only.

import { motion } from "framer-motion";
import { Clock, AlertCircle, FileCheck, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { VelocitySparkline } from "./VelocitySparkline";

interface StatsStripProps {
  // Deadline chip
  daysUntilDeadline: number | null; // negative = overdue
  // Milestones chip
  milestonesOverdue: number;
  // Files chip
  filesAwaitingApproval: number;
  // Budget chips
  paidCents: number;
  pendingCents: number;
  overdueCents: number;
  totalBudgetCents: number;
  // Sparkline
  dailyCompletions: number[];
  totalMilestones: number;
}

interface ChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  index: number;
}

function Chip({ icon, label, value, valueClass = "text-foreground", index }: ChipProps) {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
    >
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={cn("text-[13px] font-medium tabular-nums", valueClass)}>{value}</span>
      </div>
    </motion.div>
  );
}

function FinancialHealthBar({
  paidCents,
  pendingCents,
  overdueCents,
  index,
}: {
  paidCents: number;
  pendingCents: number;
  overdueCents: number;
  index: number;
}) {
  const total = paidCents + pendingCents + overdueCents;
  if (total === 0) return null;

  const paidPct = (paidCents / total) * 100;
  const pendingPct = (pendingCents / total) * 100;
  const overduePct = (overdueCents / total) * 100;

  const fmt = (c: number) =>
    `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <motion.div
      className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2 shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
    >
      <span className="text-[11px] text-muted-foreground">Financial Health</span>
      {/* 3-segment bar */}
      <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-muted">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${paidPct}%` }}
          title={`Paid: ${fmt(paidCents)}`}
        />
        <div
          className="bg-amber-400 transition-all"
          style={{ width: `${pendingPct}%` }}
          title={`Pending: ${fmt(pendingCents)}`}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${overduePct}%` }}
          title={`Overdue: ${fmt(overdueCents)}`}
        />
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        {paidCents > 0 && <span className="text-green-600">✓ {fmt(paidCents)}</span>}
        {pendingCents > 0 && <span className="text-amber-600">⏳ {fmt(pendingCents)}</span>}
        {overdueCents > 0 && <span className="text-red-600">! {fmt(overdueCents)}</span>}
      </div>
    </motion.div>
  );
}

export function StatsStrip({
  daysUntilDeadline,
  milestonesOverdue,
  filesAwaitingApproval,
  paidCents,
  pendingCents,
  overdueCents,
  totalBudgetCents,
  dailyCompletions,
  totalMilestones,
}: StatsStripProps) {
  const deadlineValue =
    daysUntilDeadline === null
      ? "No deadline"
      : daysUntilDeadline < 0
        ? `${Math.abs(daysUntilDeadline)}d overdue`
        : daysUntilDeadline === 0
          ? "Due today"
          : `${daysUntilDeadline}d left`;

  const deadlineClass =
    daysUntilDeadline === null
      ? "text-muted-foreground"
      : daysUntilDeadline < 7
        ? "text-red-600"
        : daysUntilDeadline < 14
          ? "text-amber-600"
          : "text-green-600";

  const paidFormatted = `$${(paidCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
  const totalFormatted = `$${(totalBudgetCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  return (
    <div className="flex items-center gap-3 overflow-x-auto px-8 py-3 scrollbar-none">
      {/* Chip 1 — Deadline */}
      <Chip
        index={0}
        icon={<Clock size={14} />}
        label="Deadline"
        value={deadlineValue}
        valueClass={deadlineClass}
      />

      {/* Chip 2 — Overdue milestones */}
      <Chip
        index={1}
        icon={<AlertCircle size={14} />}
        label="Overdue"
        value={milestonesOverdue > 0 ? `${milestonesOverdue} milestone${milestonesOverdue > 1 ? "s" : ""}` : "None"}
        valueClass={milestonesOverdue > 0 ? "text-red-600" : "text-muted-foreground"}
      />

      {/* Chip 3 — Files awaiting approval */}
      <Chip
        index={2}
        icon={<FileCheck size={14} />}
        label="Awaiting approval"
        value={filesAwaitingApproval > 0 ? `${filesAwaitingApproval} file${filesAwaitingApproval > 1 ? "s" : ""}` : "None"}
        valueClass={filesAwaitingApproval > 0 ? "text-purple-600" : "text-muted-foreground"}
      />

      {/* Chip 4 — Budget paid */}
      <Chip
        index={3}
        icon={<DollarSign size={14} />}
        label="Budget"
        value={totalBudgetCents > 0 ? `${paidFormatted} of ${totalFormatted}` : "No budget set"}
        valueClass="text-foreground"
      />

      {/* Chip 5 — Financial health bar */}
      <FinancialHealthBar
        index={4}
        paidCents={paidCents}
        pendingCents={pendingCents}
        overdueCents={overdueCents}
      />

      {/* Sparkline — fills remaining space */}
      <motion.div
        className="ml-auto flex-shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        <VelocitySparkline
          dailyCompletions={dailyCompletions}
          totalMilestones={totalMilestones}
        />
      </motion.div>
    </div>
  );
}
