"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Plus, LayoutGrid, List, Filter, ArrowUpDown } from "lucide-react";
import type { Milestone } from "../../types";

type ColumnId = "todo" | "in_progress" | "done";
const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: "todo", label: "TO DO" },
  { id: "in_progress", label: "IN PROGRESS" },
  { id: "done", label: "DONE" },
];

function getMilestoneStatus(m: Milestone): ColumnId {
  if (m.completed || m.status === "done") return "done";
  if (m.status === "in_progress") return "in_progress";
  return "todo";
}

function priorityDotColor(p?: string): string {
  switch (p) {
    case "low": return "var(--pd-priority-low)";
    case "medium": return "var(--pd-priority-medium)";
    case "high": return "var(--pd-priority-high)";
    default: return "var(--pd-text-muted)";
  }
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["#3B6FF0", "#3DAA72", "#C47F2A", "#E05C5C", "#8B5CF6"];
  return (
    <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
      style={{ background: colors[name.length % colors.length], color: "#fff", fontFamily: "var(--font-data)", fontSize: 9, fontWeight: 600 }}
      title={name}>{initials}</div>
  );
}

function InlineAddForm({ onSubmit, onCancel }: { onSubmit: (t: string) => void; onCancel: () => void }) {
  const [v, setV] = useState("");
  return (
    <div className="rounded-[10px] p-3" style={{ background: "var(--pd-surface)", border: "1px solid var(--pd-accent)", boxShadow: "0 0 0 3px var(--pd-accent-subtle)" }}>
      <input autoFocus value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onSubmit(v.trim()); setV(""); } if (e.key === "Escape") onCancel(); }}
        placeholder="Milestone name..." className="w-full border-none bg-transparent outline-none"
        style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--pd-text-primary)" }} />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="rounded-[8px] px-2.5 py-1 text-xs" style={{ fontFamily: "var(--font-data)", color: "var(--pd-text-secondary)" }}>Cancel</button>
        <button onClick={() => { if (v.trim()) { onSubmit(v.trim()); setV(""); } }} className="rounded-[8px] px-2.5 py-1 text-xs"
          style={{ fontFamily: "var(--font-data)", background: "var(--pd-accent)", color: "#fff" }}>Add</button>
      </div>
    </div>
  );
}

function EmptyColumnCard({ onClick, colId }: { onClick: () => void; colId: ColumnId }) {
  const emptyIcons = {
    todo: "🎯",
    in_progress: "🚀",
    done: "🎉"
  };
  
  return (
    <button onClick={onClick}
      className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl py-10 transition-all border border-dashed border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      style={{ minHeight: 160 }}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-xl transition-transform duration-300 group-hover:scale-110">
        {emptyIcons[colId] || "✨"}
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">No milestones</span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 transition-colors group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400">
          <Plus size={12} /> Add milestone
        </span>
      </div>
    </button>
  );
}

function MilestoneCard({ milestone, onClick, onDragStart }: {
  milestone: Milestone; onClick: () => void; onDragStart: (e: React.DragEvent, ms: Milestone) => void;
}) {
  const [hov, setHov] = useState(false);
  const isOverdue = useMemo(() => !milestone.due_date || milestone.completed ? false : new Date(milestone.due_date) < new Date(), [milestone]);
  const dueStr = useMemo(() => milestone.due_date ? new Date(milestone.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null, [milestone.due_date]);

  return (
    <div draggable onDragStart={(e) => onDragStart(e, milestone)} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="group cursor-pointer transition-all"
      style={{ background: "var(--pd-surface)", border: `1px solid ${hov ? "rgba(59,111,240,0.4)" : "var(--pd-border)"}`,
        borderRadius: 12, boxShadow: hov ? "var(--pd-shadow-elevated)" : "var(--pd-shadow-card)", padding: "14px 16px",
        transform: hov ? "translateY(-1px)" : "translateY(0)" }}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-40"
          style={{ color: "var(--pd-text-muted)", fontSize: 12, lineHeight: 1 }}>⠿</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate" style={{ fontFamily: "var(--font-data)", fontSize: 13, fontWeight: 500, color: "var(--pd-text-primary)" }}>{milestone.title}</h4>
            {milestone.priority && <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: priorityDotColor(milestone.priority) }} />}
          </div>
          {milestone.description && <p className="mt-1 line-clamp-2" style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--pd-text-muted)", lineHeight: 1.4 }}>{milestone.description}</p>}
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {dueStr && <span className="inline-flex items-center rounded-md px-1.5 py-0.5"
            style={{ fontFamily: "var(--font-data)", fontSize: 11, color: isOverdue ? "var(--pd-status-overdue)" : "var(--pd-text-muted)",
              background: isOverdue ? "var(--pd-status-overdue-bg)" : "var(--pd-elevated)" }}>{dueStr}</span>}
        </div>
        {milestone.assignee && <InitialsAvatar name={milestone.assignee.name} />}
      </div>
    </div>
  );
}

interface MilestonesKanbanProps {
  milestones: Milestone[];
  onMilestoneClick: (milestone: Milestone) => void;
  onAddMilestone: (status: string, title: string) => void;
  onMoveMilestone: (id: string, newStatus: string) => void;
}

export function MilestonesKanban({ milestones, onMilestoneClick, onAddMilestone, onMoveMilestone }: MilestonesKanbanProps) {
  const [addingTo, setAddingTo] = useState<ColumnId | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const draggedRef = useRef<Milestone | null>(null);

  const grouped = useMemo(() => {
    const r: Record<ColumnId, Milestone[]> = { todo: [], in_progress: [], done: [] };
    milestones.forEach((m) => r[getMilestoneStatus(m)].push(m));
    Object.values(r).forEach((a) => a.sort((x, y) => x.order - y.order));
    return r;
  }, [milestones]);

  const handleDragStart = useCallback((e: React.DragEvent, ms: Milestone) => {
    draggedRef.current = ms; e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault(); setDragOverCol(null);
    if (draggedRef.current && getMilestoneStatus(draggedRef.current) !== colId) onMoveMilestone(draggedRef.current.id, colId);
    draggedRef.current = null;
  }, [onMoveMilestone]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--pd-text-primary)" }}>Milestones</h2>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden" style={{ border: "1px solid var(--pd-border)", borderRadius: 8 }}>
            <button className="flex items-center justify-center px-2.5 py-1.5" style={{ background: "var(--pd-accent-subtle)", color: "var(--pd-accent)" }}><LayoutGrid size={14} /></button>
            <button className="flex items-center justify-center px-2.5 py-1.5" style={{ color: "var(--pd-text-muted)" }}><List size={14} /></button>
          </div>
          <button className="flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 transition-colors"
            style={{ borderColor: "var(--pd-border)", color: "var(--pd-text-muted)", fontFamily: "var(--font-data)", fontSize: 12 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--pd-accent)"; e.currentTarget.style.color = "var(--pd-text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--pd-border)"; e.currentTarget.style.color = "var(--pd-text-muted)"; }}>
            <Filter size={12} />Filter</button>
          <button className="flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 transition-colors"
            style={{ borderColor: "var(--pd-border)", color: "var(--pd-text-muted)", fontFamily: "var(--font-data)", fontSize: 12 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--pd-accent)"; e.currentTarget.style.color = "var(--pd-text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--pd-border)"; e.currentTarget.style.color = "var(--pd-text-muted)"; }}>
            <ArrowUpDown size={12} />Sort</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const items = grouped[col.id];
          const isDragOver = dragOverCol === col.id;
          return (
            <div key={col.id} className="flex flex-col"
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
              onDrop={(e) => handleDrop(e, col.id)} onDragLeave={() => setDragOverCol(null)}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--pd-text-muted)" }}>{col.label}</span>
                  <span className="flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-0.5"
                    style={{ background: "var(--pd-elevated)", color: "var(--pd-text-muted)", fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 600 }}>{items.length}</span>
                </div>
                <button onClick={() => setAddingTo(col.id)} className="flex h-[18px] w-[18px] items-center justify-center rounded-full transition-all"
                  style={{ color: "var(--pd-text-muted)", opacity: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-subtle)"; e.currentTarget.style.color = "var(--pd-accent)"; e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--pd-text-muted)"; e.currentTarget.style.opacity = "0"; }}
                  title="Add milestone"><Plus size={12} /></button>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl p-3 transition-colors"
                style={{ minHeight: 300, background: isDragOver ? "var(--pd-accent-subtle)" : "rgba(0,0,0,0.02)",
                  border: isDragOver ? "1px dashed var(--pd-accent)" : "1px solid transparent" }}>
                {items.length === 0 && addingTo !== col.id && <EmptyColumnCard colId={col.id} onClick={() => setAddingTo(col.id)} />}
                {items.map((ms) => (<MilestoneCard key={ms.id} milestone={ms} onClick={() => onMilestoneClick(ms)} onDragStart={handleDragStart} />))}
                {addingTo === col.id && <InlineAddForm onSubmit={(title) => { onAddMilestone(col.id, title); setAddingTo(null); }} onCancel={() => setAddingTo(null)} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
