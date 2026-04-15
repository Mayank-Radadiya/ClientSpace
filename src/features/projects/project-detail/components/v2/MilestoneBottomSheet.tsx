"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { format } from "date-fns";
import {
  X,
  GripHorizontal,
  CheckCircle2,
  Trash2,
  Plus,
  Pencil,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Milestone } from "../../types";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface MilestoneBottomSheetProps {
  milestone: Milestone | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Milestone>) => void;
  onDelete: (id: string) => void;
}

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function MilestoneBottomSheet({
  milestone,
  onClose,
  onUpdate,
  onDelete,
}: MilestoneBottomSheetProps) {
  const reduced = useReducedMotion();
  const dragControls = useDragControls();

  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || "");
      setSubtasks([]);
      setIsEditingTitle(false);
      setIsEditingDesc(false);
    }
  }, [milestone]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  if (!milestone) return null;

  const status = milestone.status || (milestone.completed ? "done" : "todo");
  const doneCount = subtasks.filter((s) => s.done).length;
  const subtaskProgress =
    subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const handleTitleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== milestone.title) {
      onUpdate(milestone.id, { title: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleStatusChange = (val: string | null) => {
    if (!val) return;
    const completed = val === "done";
    onUpdate(milestone.id, {
      status: val as Milestone["status"],
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
  };

  const handlePriorityChange = (val: string | null) => {
    if (!val) return;
    onUpdate(milestone.id, { priority: val as Milestone["priority"] });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newSubtask.trim(), done: false },
    ]);
    setNewSubtask("");
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );
  };

  const handleMarkComplete = () => {
    onUpdate(milestone.id, {
      completed: true,
      completed_at: new Date().toISOString(),
      status: "done",
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Delete this milestone?")) {
      onDelete(milestone.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {milestone && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={reduced ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 400, damping: 40 }
            }
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="bg-card border-border fixed right-0 bottom-0 left-0 z-[95] mx-auto flex max-w-[720px] flex-col overflow-hidden rounded-t-2xl border"
            style={{
              height: "70vh",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Milestone detail"
          >
            {/* Drag handle */}
            <div
              className="flex cursor-grab items-center justify-center py-3 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Title */}
              <div className="mb-4">
                {isEditingTitle ? (
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setTitle(milestone.title);
                        setIsEditingTitle(false);
                      }
                    }}
                    className="border-primary text-foreground w-full border-b-2 bg-transparent text-xl font-semibold outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-foreground hover:text-foreground/70 text-left text-xl font-semibold"
                  >
                    {milestone.title}
                  </button>
                )}
              </div>

              {/* Status + Priority badges */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="border-border bg-muted/50 h-8 w-auto min-w-[110px] text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={milestone.priority || "low"}
                  onValueChange={handlePriorityChange}
                >
                  <SelectTrigger className="border-border bg-muted/50 h-8 w-auto min-w-[100px] text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {milestone.due_date && (
                  <span className="bg-muted text-foreground/70 rounded-md px-2.5 py-1 text-[12px]">
                    {format(new Date(milestone.due_date), "MMM d, yyyy")}
                  </span>
                )}

                {milestone.assignee && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={milestone.assignee.avatar_url || ""} />
                      <AvatarFallback className="text-[9px]">
                        {milestone.assignee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground/70 text-[12px]">
                      {milestone.assignee.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-foreground/70 text-[13px] font-medium">
                    Description
                  </h3>
                  <button
                    onClick={() => setIsEditingDesc(!isEditingDesc)}
                    className="text-muted-foreground hover:bg-muted/50 flex items-center gap-1 rounded px-2 py-0.5 text-[11px]"
                  >
                    {isEditingDesc ? (
                      <>
                        <Eye className="h-3 w-3" /> Preview
                      </>
                    ) : (
                      <>
                        <Pencil className="h-3 w-3" /> Edit
                      </>
                    )}
                  </button>
                </div>
                {isEditingDesc ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-border bg-muted/50 text-foreground/70 placeholder:text-muted-foreground focus:border-primary min-h-[120px] w-full resize-y rounded-lg border p-3 text-[13px] focus:outline-none"
                    placeholder="Add a description..."
                  />
                ) : (
                  <div className="bg-muted/50 text-foreground/70 min-h-[60px] rounded-lg p-3 text-[13px] leading-relaxed">
                    {description || (
                      <span className="text-muted-foreground">
                        No description
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Subtasks / Checklist */}
              <div className="mb-6">
                <h3 className="text-foreground/70 mb-2 text-[13px] font-medium">
                  Sub-tasks
                </h3>

                {subtasks.length > 0 && (
                  <div className="mb-3">
                    <div className="text-muted-foreground mb-1 flex items-center justify-between text-[11px]">
                      <span>
                        {doneCount}/{subtasks.length} completed
                      </span>
                      <span>{subtaskProgress}%</span>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${subtaskProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {subtasks.map((task) => (
                    <div
                      key={task.id}
                      className="hover:bg-muted/50 flex items-center gap-2 rounded-lg px-2 py-1.5"
                    >
                      <button
                        onClick={() => toggleSubtask(task.id)}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          task.done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {task.done && (
                          <CheckCircle2 className="text-foreground h-3 w-3" />
                        )}
                      </button>
                      <span
                        className={`text-[13px] ${task.done ? "text-muted-foreground line-through" : "text-foreground/70"}`}
                      >
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    placeholder="Add a sub-task..."
                    className="text-foreground/70 placeholder:text-muted-foreground flex-1 bg-transparent text-[13px] focus:outline-none"
                  />
                  <button
                    onClick={addSubtask}
                    className="text-muted-foreground hover:text-foreground/70 rounded p-1"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Footer info */}
              <div className="border-border text-muted-foreground border-t pt-4 text-[11px]">
                <p>
                  Created{" "}
                  {milestone.completed_at
                    ? format(
                        new Date(milestone.completed_at),
                        "MMM d, yyyy 'at' h:mm a",
                      )
                    : "—"}
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-border flex shrink-0 items-center justify-between border-t px-6 py-3">
              {!milestone.completed && (
                <Button
                  size="sm"
                  onClick={handleMarkComplete}
                  className="h-8 bg-emerald-600 text-[12px] hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Complete
                </Button>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-[12px] text-red-400/60 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete milestone
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
