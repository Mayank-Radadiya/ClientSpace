"use client";
// src/features/projects/components/tabs/MilestonesTab.tsx
// Flat list view of milestones with status filters.
// Click a row to open MilestoneCommandPanel.

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Circle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMilestones } from "../hooks/useMilestones";
import { MilestoneCommandPanel } from "../MilestoneCommandPanel";
import type { Milestone, MilestoneStatus, MilestonePriority } from "../types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<MilestoneStatus, { bg: string; text: string; dot: string }> = {
  todo: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
  in_progress: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  done: { bg: "bg-green-50 dark:bg-green-950/40", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
};

const PRIORITY_STYLES: Record<MilestonePriority, string> = {
  low: "text-slate-400",
  medium: "text-blue-400",
  high: "text-orange-500",
  urgent: "text-red-600",
};

const PRIORITY_ICON: Record<MilestonePriority, string> = {
  low: "▽",
  medium: "◇",
  high: "▲",
  urgent: "⬆",
};

interface MilestonesTabProps {
  projectId: string;
  members?: Array<{ userId: string; name: string; avatarUrl: string | null }>;
}

type FilterState = "all" | MilestoneStatus;

export function MilestonesTab({ projectId, members }: MilestonesTabProps) {
  const { milestones, isLoading, create } = useMilestones(projectId);
  const [activeFilter, setActiveFilter] = useState<FilterState>("all");
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? milestones
        : milestones.filter((m) => m.status === activeFilter),
    [milestones, activeFilter],
  );

  const counts = useMemo(
    () => ({
      all: milestones.length,
      todo: milestones.filter((m) => m.status === "todo").length,
      in_progress: milestones.filter((m) => m.status === "in_progress").length,
      done: milestones.filter((m) => m.status === "done").length,
    }),
    [milestones],
  );

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      await create({
        projectId,
        title: newTitle.trim(),
        status: "todo",
        priority: "medium",
        order: milestones.length,
      });
      setNewTitle("");
      setIsCreating(false);
    } catch {
      setIsCreating(false);
    }
  };

  const filters: { key: FilterState; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "todo", label: `To Do (${counts.todo})` },
    { key: "in_progress", label: `In Progress (${counts.in_progress})` },
    { key: "done", label: `Done (${counts.done})` },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Filter row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeFilter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
            aria-pressed={activeFilter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Milestone list */}
      <ul className="flex flex-col divide-y divide-border" role="list">
        <AnimatePresence initial={false}>
          {filtered.length === 0 && (
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-sm text-muted-foreground"
            >
              {activeFilter === "all" ? "No milestones yet." : `No milestones with status "${activeFilter}".`}
            </motion.li>
          )}
          {filtered.map((m, i) => {
            const st = STATUS_STYLES[m.status];
            const isOverdue =
              !m.completed && m.dueDate && new Date(m.dueDate).getTime() < Date.now();
            const completedSubs = m.subTasks.filter((s) => s.completed).length;

            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                onClick={() => setActiveMilestone(m)}
                className="group flex cursor-pointer items-center gap-3 px-1 py-3 transition-colors hover:bg-muted/50"
                role="button"
                aria-label={`Edit milestone: ${m.title}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActiveMilestone(m);
                }}
              >
                {/* Status dot */}
                <span className={cn("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", st.dot)} aria-hidden />

                {/* Title + meta */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate text-sm font-medium text-foreground",
                      m.status === "done" && "line-through text-muted-foreground",
                    )}
                  >
                    {m.title}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {m.dueDate && (
                      <span className={cn(isOverdue && "text-red-600")}>
                        {format(new Date(m.dueDate), "MMM d")}
                      </span>
                    )}
                    {m.subTasks.length > 0 && (
                      <span>{completedSubs}/{m.subTasks.length} sub-tasks</span>
                    )}
                  </div>
                </div>

                {/* Priority icon */}
                <span
                  className={cn("flex-shrink-0 text-sm", PRIORITY_STYLES[m.priority])}
                  aria-label={`Priority: ${m.priority}`}
                  title={m.priority}
                >
                  {PRIORITY_ICON[m.priority]}
                </span>

                {/* Status badge */}
                <span
                  className={cn(
                    "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    st.bg,
                    st.text,
                  )}
                >
                  {m.status.replace("_", " ")}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {/* Quick-add row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          placeholder="Add milestone…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="New milestone title"
        />
        <button
          onClick={handleCreate}
          disabled={isCreating || !newTitle.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          aria-label="Create milestone"
        >
          {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        </button>
      </div>

      {/* Detail panel */}
      <MilestoneCommandPanel
        milestone={activeMilestone}
        projectId={projectId}
        onClose={() => setActiveMilestone(null)}
        members={members}
      />
    </div>
  );
}
