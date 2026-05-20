"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Plus, GripVertical, LayoutGrid, List } from "lucide-react";
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

function statusLineColor(col: ColumnId): string {
  switch (col) {
    case "todo": return "var(--pd-text-muted)";
    case "in_progress": return "var(--pd-status-progress)";
    case "done": return "var(--pd-status-done)";
  }
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
  const colors = ["#4F7FFF", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"];
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
        <button onClick={onCancel} className="rounded-md px-2.5 py-1 text-xs" style={{ fontFamily: "var(--font-data)", color: "var(--pd-text-secondary)" }}>Cancel</button>
        <button onClick={() => { if (v.trim()) { onSubmit(v.trim()); setV(""); } }} className="rounded-md px-2.5 py-1 text-xs"
          style={{ fontFamily: "var(--font-data)", background: "var(--pd-accent)", color: "#fff" }}>Add</button>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone, columnId, onClick, onDragStart }: {
  milestone: Milestone; columnId: ColumnId; onClick: () => void; onDragStart: (e: React.DragEvent, ms: Milestone) => void;
}) {
  const [hov, setHov] = useState(false);
  const isOverdue = useMemo(() => !milestone.due_date || milestone.completed ? false : new Date(milestone.due_date) < new Date(), [milestone]);
  const dueStr = useMemo(() => milestone.due_date ? new Date(milestone.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null, [milestone.due_date]);

  return (
    <div draggable onDragStart={(e) => onDragStart(e, milestone)} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="group cursor-pointer rounded-[10px] transition-all"
      style={{ background: "var(--pd-surface)", border: `1px solid ${hov ? "var(--pd-accent)" : "var(--pd-border)"}`,
        boxShadow: hov ? "var(--pd-shadow-elevated)" : "var(--pd-shadow-card)", padding: "14px 16px",
        borderLeft: `3px solid ${statusLineColor(columnId)}` }}>
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="mt-0.5 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-40" style={{ color: "var(--pd-text-muted)" }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {milestone.priority && <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: priorityDotColor(milestone.priority) }} />}
            <h4 className="truncate" style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--pd-text-primary)" }}>{milestone.title}</h4>
          </div>
          {milestone.description && <p className="mt-1 line-clamp-2" style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "var(--pd-text-muted)" }}>{milestone.description}</p>}
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {dueStr && <span style={{ fontFamily: "var(--font-data)", fontSize: 11, color: isOverdue ? "var(--pd-status-overdue)" : "var(--pd-text-muted)" }}>{dueStr}</span>}
        </div>
        {milestone.assignee && <InitialsAvatar name={milestone.assignee.name} />}
      </div>
    </div>
  );
}

interface MilestonesKanbanProps {
  milestones: Milestone[];
  onMilestoneClick: (milestone: Milestone) => void;
  onAddMilestone: (status: string) => void;
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
    draggedRef.current = ms;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault(); setDragOverCol(null);
    if (draggedRef.current && getMilestoneStatus(draggedRef.current) !== colId) {
      onMoveMilestone(draggedRef.current.id, colId);
    }
    draggedRef.current = null;
  }, [onMoveMilestone]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--pd-text-primary)" }}>Milestones</h2>
        <div className="flex overflow-hidden rounded-lg" style={{ border: "1px solid var(--pd-border)" }}>
          <button className="px-2.5 py-1.5" style={{ background: "var(--pd-accent-subtle)", color: "var(--pd-accent)" }}><LayoutGrid size={14} /></button>
          <button className="px-2.5 py-1.5" style={{ color: "var(--pd-text-muted)" }}><List size={14} /></button>
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
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--pd-text-muted)" }}>{col.label}</span>
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1"
                    style={{ background: "var(--pd-accent-subtle)", color: "var(--pd-text-muted)", fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 600 }}>{items.length}</span>
                </div>
                <button onClick={() => setAddingTo(col.id)} className="flex h-6 w-6 items-center justify-center rounded-full transition-colors"
                  style={{ color: "var(--pd-text-muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-subtle)"; e.currentTarget.style.color = "var(--pd-accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--pd-text-muted)"; }}
                  title="Add milestone"><Plus size={14} /></button>
              </div>

              <div className="flex flex-col gap-2.5 rounded-xl p-1 transition-colors"
                style={{ minHeight: 120, background: isDragOver ? "var(--pd-accent-subtle)" : "transparent",
                  border: isDragOver ? "1px dashed var(--pd-accent)" : "1px dashed transparent", borderRadius: 12 }}>
                {items.length === 0 && addingTo !== col.id && (
                  <button onClick={() => setAddingTo(col.id)} className="flex h-20 w-full items-center justify-center rounded-[10px] transition-all"
                    style={{ border: "1px dashed rgba(79,127,255,0.25)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderStyle = "solid"; e.currentTarget.style.borderColor = "var(--pd-accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderStyle = "dashed"; e.currentTarget.style.borderColor = "rgba(79,127,255,0.25)"; }}>
                    <Plus size={16} style={{ color: "var(--pd-accent)", opacity: 0.5 }} />
                  </button>
                )}
                {items.map((ms) => (
                  <MilestoneCard key={ms.id} milestone={ms} columnId={col.id} onClick={() => onMilestoneClick(ms)} onDragStart={handleDragStart} />
                ))}
                {addingTo === col.id && <InlineAddForm onSubmit={(t) => { onAddMilestone(col.id); setAddingTo(null); }} onCancel={() => setAddingTo(null)} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
