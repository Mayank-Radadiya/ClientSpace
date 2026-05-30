"use client";

// src/features/projects/project-detail/components/v3/MilestoneCommandPanel.tsx
// Full milestone detail panel — position: absolute inside relative wrapper.
// Replaces MilestoneSlideOver.tsx (position: fixed + backdrop).

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Plus,
  Check,
  Calendar,
  User,
} from "lucide-react";
import type { Milestone, SubTask } from "../../types";
import { trpc } from "@/lib/trpc/client";

/* ── Status Segmented Control ─────────────────────────────── */
const STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
] as const;

function statusSegmentColor(s: string, isActive: boolean): { bg: string; color: string } {
  if (!isActive) return { bg: "transparent", color: "var(--pd-text-muted)" };
  switch (s) {
    case "todo":
      return { bg: "var(--pd-status-hold-bg)", color: "var(--pd-status-hold)" };
    case "in_progress":
      return { bg: "var(--pd-status-progress-bg)", color: "var(--pd-status-progress)" };
    case "review":
      return { bg: "rgba(139,92,246,0.1)", color: "#8B5CF6" };
    case "done":
      return { bg: "var(--pd-status-done-bg)", color: "var(--pd-status-done)" };
    default:
      return { bg: "transparent", color: "var(--pd-text-muted)" };
  }
}

/* ── Priority Selector ────────────────────────────────────── */
const PRIORITIES = [
  { value: "low", label: "Low", color: "var(--pd-priority-low)" },
  { value: "medium", label: "Medium", color: "var(--pd-priority-medium)" },
  { value: "high", label: "High", color: "var(--pd-priority-high)" },
  { value: "urgent", label: "Urgent", color: "#EF4444" },
] as const;

/* ── Main Component ───────────────────────────────────────── */
interface MilestoneCommandPanelProps {
  milestone: Milestone | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Milestone>) => void;
  onDelete: (id: string) => void;
}

export function MilestoneCommandPanel({
  milestone,
  onClose,
  onUpdate,
  onDelete,
}: MilestoneCommandPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState("");
  const [subTasksDirty, setSubTasksDirty] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // FIX: subtask mutation for persistence
  const updateSubTasksMut = trpc.milestones.updateSubTasks.useMutation();

  // Populate from milestone data
  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || "");
      setStatus(
        milestone.status || (milestone.completed ? "done" : "todo"),
      );
      setPriority(milestone.priority || "medium");
      // Use persisted sub_tasks if available, fallback to empty
      setSubTasks(
        (milestone as Milestone & { sub_tasks?: SubTask[] }).sub_tasks ?? [],
      );
      setSubTasksDirty(false);
    }
  }, [milestone]);

  // Focus title on open
  useEffect(() => {
    if (milestone && titleRef.current) {
      titleRef.current.focus();
    }
  }, [milestone]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = useCallback(() => {
    if (!milestone) return;
    onUpdate(milestone.id, {
      title,
      description: description || undefined,
      status: status as Milestone["status"],
      priority: priority as Milestone["priority"],
      completed: status === "done",
      completed_at: status === "done" ? new Date().toISOString() : null,
    });
    // FIX: Persist subtask changes to the DB via updateSubTasks mutation
    if (subTasksDirty && milestone.id) {
      updateSubTasksMut.mutate({ id: milestone.id, subTasks });
    }
    onClose();
  }, [milestone, title, description, status, priority, subTasks, subTasksDirty, onUpdate, onClose, updateSubTasksMut]);

  const handleDelete = useCallback(() => {
    if (!milestone) return;
    onDelete(milestone.id);
    onClose();
  }, [milestone, onDelete, onClose]);

  const addSubTask = useCallback(() => {
    if (!newSubTask.trim()) return;
    setSubTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: newSubTask.trim(),
        completed: false,
      },
    ]);
    setSubTasksDirty(true);
    setNewSubTask("");
  }, [newSubTask]);

  const toggleSubTask = useCallback((id: string) => {
    setSubTasks((prev) =>
      prev.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st,
      ),
    );
    setSubTasksDirty(true);
  }, []);

  const removeSubTask = useCallback((id: string) => {
    setSubTasks((prev) => prev.filter((st) => st.id !== id));
    setSubTasksDirty(true);
  }, []);

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="pd-scroll absolute top-0 right-0 z-30 flex h-full flex-col"
          style={{
            width: 420,
            background: "var(--pd-surface)",
            boxShadow: "var(--pd-shadow-slide)",
            borderLeft: "1px solid var(--pd-border)",
          }}
          role="complementary"
          aria-label={`Milestone details: ${milestone.title}`}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--pd-divider)" }}
          >
            <span
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--pd-text-muted)",
              }}
            >
              Milestone Details
            </span>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--pd-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--pd-accent-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              aria-label="Close milestone panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Title */}
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-5 w-full border-none bg-transparent outline-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--pd-text-primary)",
                letterSpacing: "-0.01em",
              }}
              placeholder="Milestone title"
            />

            {/* Status — Segmented control */}
            <div className="mb-5">
              <label
                className="mb-2 block"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--pd-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Status
              </label>
              <div
                className="flex overflow-hidden rounded-lg"
                style={{
                  border: "1px solid var(--pd-border)",
                  background: "var(--pd-elevated)",
                }}
                role="radiogroup"
                aria-label="Milestone status"
              >
                {STATUSES.map((s) => {
                  const isActive = status === s.value;
                  const colors = statusSegmentColor(s.value, isActive);
                  return (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className="flex-1 py-2 text-center transition-all"
                      style={{
                        fontFamily: "var(--font-data)",
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        background: colors.bg,
                        color: colors.color,
                        borderRight:
                          s.value !== "done"
                            ? "1px solid var(--pd-divider)"
                            : "none",
                      }}
                      role="radio"
                      aria-checked={isActive}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="mb-5">
              <label
                className="mb-2 block"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--pd-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Priority
              </label>
              <div className="flex gap-2" role="listbox" aria-label="Milestone priority">
                {PRIORITIES.map((p) => {
                  const isActive = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all"
                      style={{
                        fontFamily: "var(--font-data)",
                        fontSize: 12,
                        background: isActive
                          ? `${p.color}15`
                          : "var(--pd-elevated)",
                        border: isActive
                          ? `1px solid ${p.color}40`
                          : "1px solid var(--pd-border)",
                        color: isActive ? p.color : "var(--pd-text-secondary)",
                        fontWeight: isActive ? 500 : 400,
                      }}
                      role="option"
                      aria-selected={isActive}
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          p.value === "urgent" && isActive
                            ? "pd-pulse-critical"
                            : ""
                        }`}
                        style={{ background: p.color }}
                      />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <label
                className="mb-1.5 block"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--pd-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg p-3 outline-none transition-colors focus:ring-1"
                style={{
                  background: "var(--pd-elevated)",
                  border: "1px solid var(--pd-border)",
                  fontFamily: "var(--font-data)",
                  fontSize: 13,
                  color: "var(--pd-text-primary)",
                  lineHeight: 1.5,
                }}
                placeholder="Add description..."
              />
            </div>

            {/* Due date */}
            <div className="mb-5">
              <label
                className="mb-1.5 flex items-center gap-1.5"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--pd-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Calendar size={12} />
                Due Date
              </label>
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: "var(--pd-elevated)",
                  border: "1px solid var(--pd-border)",
                  fontFamily: "var(--font-data)",
                  fontSize: 13,
                  color: "var(--pd-text-primary)",
                }}
              >
                {milestone.due_date
                  ? new Date(milestone.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No due date"}
              </div>
            </div>

            {/* Assignee */}
            {milestone.assignee && (
              <div className="mb-5">
                <label
                  className="mb-1.5 flex items-center gap-1.5"
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 11,
                    color: "var(--pd-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <User size={12} />
                  Assignee
                </label>
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: "var(--pd-elevated)",
                    border: "1px solid var(--pd-border)",
                  }}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      background: "var(--pd-accent)",
                      color: "#fff",
                      fontFamily: "var(--font-data)",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {milestone.assignee.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-data)",
                      fontSize: 13,
                      color: "var(--pd-text-primary)",
                    }}
                  >
                    {milestone.assignee.name}
                  </span>
                </div>
              </div>
            )}

            {/* Divider */}
            <div
              className="my-4"
              style={{ height: 1, background: "var(--pd-divider)" }}
            />

            {/* Sub-tasks */}
            <div>
              <label
                className="mb-2 block"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--pd-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Sub-tasks (
                {subTasks.filter((s) => s.completed).length}/
                {subTasks.length})
              </label>
              <div className="flex flex-col gap-1.5">
                {subTasks.map((st) => (
                  <div
                    key={st.id}
                    className="group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors"
                    style={{ background: "var(--pd-elevated)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--pd-accent-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "var(--pd-elevated)";
                    }}
                  >
                    <button
                      onClick={() => toggleSubTask(st.id)}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
                      style={{
                        border: st.completed
                          ? "none"
                          : "1.5px solid var(--pd-border)",
                        background: st.completed
                          ? "var(--pd-accent)"
                          : "transparent",
                      }}
                      aria-label={
                        st.completed
                          ? `Mark "${st.title}" as incomplete`
                          : `Mark "${st.title}" as complete`
                      }
                    >
                      {st.completed && (
                        <Check size={10} color="#fff" strokeWidth={3} />
                      )}
                    </button>
                    <span
                      className="flex-1"
                      style={{
                        fontFamily: "var(--font-data)",
                        fontSize: 13,
                        color: st.completed
                          ? "var(--pd-text-muted)"
                          : "var(--pd-text-primary)",
                        textDecoration: st.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {st.title}
                    </span>
                    <button
                      onClick={() => removeSubTask(st.id)}
                      className="h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-60"
                      style={{
                        color: "var(--pd-text-muted)",
                        display: "flex",
                      }}
                      aria-label={`Remove "${st.title}"`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {/* Add subtask */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSubTask();
                  }}
                  placeholder="+ Add subtask"
                  className="flex-1 border-none bg-transparent py-1.5 outline-none"
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 13,
                    color: "var(--pd-text-primary)",
                  }}
                />
                {newSubTask.trim() && (
                  <button
                    onClick={addSubTask}
                    className="flex h-6 w-6 items-center justify-center rounded"
                    style={{
                      background: "var(--pd-accent)",
                      color: "#fff",
                    }}
                    aria-label="Add subtask"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between border-t px-5 py-3"
            style={{ borderColor: "var(--pd-divider)" }}
          >
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 transition-colors"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 13,
                color: "var(--pd-status-overdue)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={handleSave}
              className="rounded-full px-4 py-1.5 transition-all active:scale-[0.98]"
              style={{
                background: "var(--pd-accent)",
                color: "#fff",
                fontFamily: "var(--font-data)",
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--pd-accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--pd-accent)";
              }}
            >
              Save changes
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
