"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Trash2, Plus, Check, Calendar } from "lucide-react";
import type { Milestone, SubTask } from "../../types";

interface MilestoneSlideOverProps {
  milestone: Milestone | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Milestone>) => void;
  onDelete: (id: string) => void;
}

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export function MilestoneSlideOver({ milestone, onClose, onUpdate, onDelete }: MilestoneSlideOverProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || "");
      setStatus(milestone.status || (milestone.completed ? "done" : "todo"));
      setSubTasks([
        { id: "st-1", title: "Set up component architecture", completed: true },
        { id: "st-2", title: "Implement core functionality", completed: false },
        { id: "st-3", title: "Write unit tests", completed: false },
      ]);
    }
  }, [milestone]);

  const handleSave = useCallback(() => {
    if (!milestone) return;
    onUpdate(milestone.id, {
      title,
      description: description || undefined,
      status: status as Milestone["status"],
      completed: status === "done",
      completed_at: status === "done" ? new Date().toISOString() : null,
    });
    onClose();
  }, [milestone, title, description, status, onUpdate, onClose]);

  const handleDelete = useCallback(() => {
    if (!milestone) return;
    onDelete(milestone.id);
    onClose();
  }, [milestone, onDelete, onClose]);

  const addSubTask = useCallback(() => {
    if (!newSubTask.trim()) return;
    setSubTasks((prev) => [...prev, { id: crypto.randomUUID(), title: newSubTask.trim(), completed: false }]);
    setNewSubTask("");
  }, [newSubTask]);

  const toggleSubTask = useCallback((id: string) => {
    setSubTasks((prev) => prev.map((st) => st.id === id ? { ...st, completed: !st.completed } : st));
  }, []);

  if (!milestone) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="pd-animate-backdrop absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose} />

      {/* Panel */}
      <div ref={panelRef} className="pd-animate-slide-in pd-scroll relative flex w-[400px] flex-col"
        style={{ background: "var(--pd-surface)", boxShadow: "var(--pd-shadow-slide)", borderLeft: "1px solid var(--pd-border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--pd-divider)" }}>
          <div className="flex items-center gap-2.5">
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="rounded-full px-2.5 py-1 text-xs outline-none"
              style={{ background: status === "done" ? "var(--pd-status-done-bg)" : status === "in_progress" ? "var(--pd-status-progress-bg)" : "var(--pd-status-hold-bg)",
                color: status === "done" ? "var(--pd-status-done)" : status === "in_progress" ? "var(--pd-status-progress)" : "var(--pd-status-hold)",
                fontFamily: "var(--font-data)", border: "none" }}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--pd-text-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-subtle)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Title */}
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-full border-none bg-transparent outline-none"
            style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--pd-text-primary)", letterSpacing: "-0.01em" }}
            placeholder="Milestone title" />

          {/* Description */}
          <div className="mb-5">
            <label className="mb-1.5 block" style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "var(--pd-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full resize-none rounded-lg p-3 outline-none transition-colors"
              style={{ background: "var(--pd-elevated)", border: "1px solid var(--pd-border)", fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-primary)" }}
              placeholder="Add description..." />
          </div>

          {/* Due date */}
          <div className="mb-5">
            <label className="mb-1.5 flex items-center gap-1.5" style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "var(--pd-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <Calendar size={12} />Due Date
            </label>
            <div className="rounded-lg px-3 py-2" style={{ background: "var(--pd-elevated)", border: "1px solid var(--pd-border)", fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-primary)" }}>
              {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No due date"}
            </div>
          </div>

          {/* Assignee */}
          {milestone.assignee && (
            <div className="mb-5">
              <label className="mb-1.5 block" style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "var(--pd-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assignee</label>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--pd-elevated)", border: "1px solid var(--pd-border)" }}>
                <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--pd-accent)", color: "#fff", fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 600 }}>
                  {milestone.assignee.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <span style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-primary)" }}>{milestone.assignee.name}</span>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="my-4" style={{ height: 1, background: "var(--pd-divider)" }} />

          {/* Sub-tasks */}
          <div>
            <label className="mb-2 block" style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "var(--pd-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sub-tasks ({subTasks.filter(s => s.completed).length}/{subTasks.length})
            </label>
            <div className="flex flex-col gap-1.5">
              {subTasks.map((st) => (
                <button key={st.id} onClick={() => toggleSubTask(st.id)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors"
                  style={{ background: "var(--pd-elevated)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-subtle)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--pd-elevated)"; }}>
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
                    style={{ border: st.completed ? "none" : "1.5px solid var(--pd-border)", background: st.completed ? "var(--pd-accent)" : "transparent" }}>
                    {st.completed && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 13, color: st.completed ? "var(--pd-text-muted)" : "var(--pd-text-primary)",
                    textDecoration: st.completed ? "line-through" : "none" }}>{st.title}</span>
                </button>
              ))}
            </div>
            {/* Add subtask */}
            <div className="mt-2 flex items-center gap-2">
              <input value={newSubTask} onChange={(e) => setNewSubTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addSubTask(); }}
                placeholder="+ Add subtask" className="flex-1 border-none bg-transparent py-1.5 outline-none"
                style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-primary)" }} />
              {newSubTask.trim() && (
                <button onClick={addSubTask} className="flex h-6 w-6 items-center justify-center rounded"
                  style={{ background: "var(--pd-accent)", color: "#fff" }}><Plus size={12} /></button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: "var(--pd-divider)" }}>
          <button onClick={handleDelete} className="flex items-center gap-1.5 transition-colors"
            style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-status-overdue)" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            <Trash2 size={14} />Delete milestone
          </button>
          <button onClick={handleSave} className="rounded-full px-4 py-1.5 transition-all"
            style={{ background: "var(--pd-accent)", color: "#fff", fontFamily: "var(--font-data)", fontSize: 13, fontWeight: 500 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--pd-accent)"; }}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
