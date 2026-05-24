"use client";
// src/features/projects/components/MilestoneCommandPanel.tsx
// Right-side drawer panel for detailed milestone editing.
// Fix 5: position: absolute inside `relative flex min-h-screen` wrapper.
// Opens on row click in the KanbanBoard / MilestonesTab.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  Calendar,
  Flag,
  User,
  CheckSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { useMilestones } from "./hooks/useMilestones";
import type { Milestone, MilestoneStatus, MilestonePriority, SubTask } from "./types";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS: { value: MilestonePriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-slate-500" },
  { value: "medium", label: "Medium", color: "text-blue-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
];

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

interface MilestoneCommandPanelProps {
  milestone: Milestone | null;
  projectId: string;
  onClose: () => void;
  /** Members available for assignee selection */
  members?: Array<{ userId: string; name: string; avatarUrl: string | null }>;
}

export function MilestoneCommandPanel({
  milestone,
  projectId,
  onClose,
  members = [],
}: MilestoneCommandPanelProps) {
  const { update, updateStatus, updateSubTasks, delete: deleteMilestone } = useMilestones(projectId);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [newSubTask, setNewSubTask] = useState("");

  // Update title on open (controlled contenteditable)
  useEffect(() => {
    if (milestone && titleRef.current) {
      titleRef.current.textContent = milestone.title;
    }
  }, [milestone?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleTitleBlur = () => {
    if (!milestone) return;
    const text = titleRef.current?.textContent?.trim() ?? "";
    if (text && text !== milestone.title) {
      update(milestone.id, { id: milestone.id, title: text });
    }
  };

  const handleAddSubTask = () => {
    if (!milestone || !newSubTask.trim()) return;
    const next: SubTask[] = [
      ...milestone.subTasks,
      { id: crypto.randomUUID(), label: newSubTask.trim(), completed: false },
    ];
    updateSubTasks(milestone.id, next);
    setNewSubTask("");
  };

  const handleToggleSubTask = (id: string) => {
    if (!milestone) return;
    const next = milestone.subTasks.map((st) =>
      st.id === id ? { ...st, completed: !st.completed } : st,
    );
    updateSubTasks(milestone.id, next);
  };

  const handleDeleteSubTask = (id: string) => {
    if (!milestone) return;
    const next = milestone.subTasks.filter((st) => st.id !== id);
    updateSubTasks(milestone.id, next);
  };

  return (
    <AnimatePresence>
      {milestone && (
        <motion.aside
          key="milestone-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 38 }}
          // Fix 5: absolute positioning inside relative min-h-screen wrapper
          className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto border-l border-border bg-background shadow-2xl"
          aria-label="Milestone details panel"
          role="complementary"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Close milestone panel"
            >
              <ChevronRight size={14} />
              Hide
            </button>
            <button
              onClick={() => {
                deleteMilestone(milestone.id);
                onClose();
              }}
              className="text-muted-foreground transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Delete milestone"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-5 px-4 py-4">
            {/* Editable title */}
            <h2
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleTitleBlur}
              className="min-h-[1.5rem] text-base font-semibold text-foreground outline-none ring-0 focus:border-b focus:border-ring"
              data-placeholder="Milestone title"
            />

            {/* Status */}
            <FieldRow icon={<CheckSquare size={13} />} label="Status">
              <select
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={milestone.status}
                onChange={(e) => updateStatus(milestone.id, e.target.value as MilestoneStatus)}
                aria-label="Milestone status"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FieldRow>

            {/* Priority */}
            <FieldRow icon={<Flag size={13} />} label="Priority">
              <select
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={milestone.priority}
                onChange={(e) =>
                  update(milestone.id, {
                    id: milestone.id,
                    priority: e.target.value as MilestonePriority,
                  })
                }
                aria-label="Milestone priority"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </FieldRow>

            {/* Due date */}
            <FieldRow icon={<Calendar size={13} />} label="Due date">
              <input
                type="date"
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={milestone.dueDate ?? ""}
                onChange={(e) =>
                  update(milestone.id, {
                    id: milestone.id,
                    dueDate: e.target.value || null,
                  })
                }
                aria-label="Milestone due date"
              />
            </FieldRow>

            {/* Assignee */}
            {members.length > 0 && (
              <FieldRow icon={<User size={13} />} label="Assignee">
                <select
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={milestone.assigneeId ?? ""}
                  onChange={(e) =>
                    update(milestone.id, {
                      id: milestone.id,
                      assigneeId: e.target.value || null,
                    })
                  }
                  aria-label="Assigned team member"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </FieldRow>
            )}

            {/* Description */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Notes</span>
              <textarea
                className="min-h-[80px] resize-y rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Add notes or context…"
                defaultValue={milestone.description ?? ""}
                onBlur={(e) =>
                  update(milestone.id, {
                    id: milestone.id,
                    description: e.target.value || null,
                  })
                }
                aria-label="Milestone notes"
              />
            </div>

            {/* Sub-tasks */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Sub-tasks ({milestone.subTasks.filter((s) => s.completed).length}/
                {milestone.subTasks.length})
              </span>
              <ul className="flex flex-col gap-1" role="list">
                {milestone.subTasks.map((st) => (
                  <li
                    key={st.id}
                    className="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubTask(st.id)}
                      className="h-3.5 w-3.5 accent-primary"
                      aria-label={`Sub-task: ${st.label}`}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        st.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {st.label}
                    </span>
                    <button
                      onClick={() => handleDeleteSubTask(st.id)}
                      className="hidden text-muted-foreground hover:text-red-500 group-hover:block focus-visible:block focus-visible:outline-none"
                      aria-label={`Delete sub-task ${st.label}`}
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Add sub-task input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubTask();
                    }
                  }}
                  placeholder="Add sub-task…"
                  className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label="New sub-task name"
                />
                <button
                  onClick={handleAddSubTask}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Add sub-task"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
