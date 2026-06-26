"use client";
// src/features/projects/components/tabs/KanbanBoard.tsx
// Drag-and-drop Kanban board using @dnd-kit/sortable.
// Columns: Todo | In Progress | Done
// Dragging a card between columns updates milestone status optimistically.

import { useState, useMemo } from "react";
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import { GripVertical, Loader2 } from "lucide-react";
import { useMilestones } from "../hooks/useMilestones";
import { MilestoneCommandPanel } from "../MilestoneCommandPanel";
import type { Milestone, MilestoneStatus } from "../types";
import { cn } from "@/lib/utils";

// ── Column config ──────────────────────────────────────────────────────────────
const COLUMNS: {
  id: MilestoneStatus;
  label: string;
  color: string;
  dot: string;
}[] = [
  {
    id: "todo",
    label: "To Do",
    color: "border-t-slate-400",
    dot: "bg-slate-400",
  },
  {
    id: "in_progress",
    label: "In Progress",
    color: "border-t-blue-500",
    dot: "bg-blue-500",
  },
  {
    id: "done",
    label: "Done",
    color: "border-t-green-500",
    dot: "bg-green-500",
  },
];

// ── Card component ─────────────────────────────────────────────────────────────
interface KanbanCardProps {
  milestone: Milestone;
  onClick: () => void;
  overlay?: boolean;
}

function KanbanCard({ milestone, onClick, overlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedSubs = milestone.subTasks.filter((s) => s.completed).length;
  const totalSubs = milestone.subTasks.length;
  const subPct = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group border-border bg-card flex flex-col gap-2 rounded-lg border p-3 shadow-sm transition-shadow",
        isDragging && "opacity-30",
        overlay && "shadow-xl",
      )}
      onClick={onClick}
      role="button"
      aria-label={`Milestone: ${milestone.title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      {/* Drag handle + title */}
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground mt-0.5 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={13} />
        </button>
        <span
          className={cn(
            "text-foreground flex-1 text-sm leading-snug font-medium",
            milestone.status === "done" && "text-muted-foreground line-through",
          )}
        >
          {milestone.title}
        </span>
      </div>

      {/* Sub-task progress bar */}
      {subPct !== null && (
        <div className="flex items-center gap-2">
          <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${subPct}%` }}
            />
          </div>
          <span className="text-muted-foreground text-[10px] tabular-nums">
            {completedSubs}/{totalSubs}
          </span>
        </div>
      )}

      {/* Due date */}
      {milestone.dueDate && (
        <span
          className={cn(
            "text-muted-foreground text-[10px]",
            !milestone.completed &&
              new Date(milestone.dueDate).getTime() < Date.now() &&
              "text-red-600",
          )}
        >
          Due{" "}
          {new Date(milestone.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
    </div>
  );
}

// ── Column component ───────────────────────────────────────────────────────────
interface KanbanColumnProps {
  column: (typeof COLUMNS)[number];
  milestones: Milestone[];
  onCardClick: (m: Milestone) => void;
}

function KanbanColumn({ column, milestones, onCardClick }: KanbanColumnProps) {
  const ids = milestones.map((m) => m.id);

  return (
    <div
      className={cn(
        "border-border bg-muted/30 flex min-w-[240px] flex-1 flex-col gap-3 rounded-xl border border-t-2 p-3",
        column.color,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", column.dot)} aria-hidden />
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {column.label}
        </h3>
        <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium">
          {milestones.length}
        </span>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          className="flex flex-col gap-2"
          role="list"
          aria-label={`${column.label} milestones`}
        >
          <AnimatePresence initial={false}>
            {milestones.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                role="listitem"
              >
                <KanbanCard milestone={m} onClick={() => onCardClick(m)} />
              </motion.div>
            ))}
          </AnimatePresence>

          {milestones.length === 0 && (
            <div className="border-border text-muted-foreground rounded-md border border-dashed py-8 text-center text-xs">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────────────────────────
interface KanbanBoardProps {
  projectId: string;
  members?: Array<{ userId: string; name: string; avatarUrl: string | null }>;
}

export function KanbanBoard({ projectId, members }: KanbanBoardProps) {
  const { milestones, isLoading, reorder, isReordering } =
    useMilestones(projectId);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(
    null,
  );
  const [panelMilestone, setPanelMilestone] = useState<Milestone | null>(null);
  const [localMilestones, setLocalMilestones] = useState<Milestone[] | null>(
    null,
  );

  // Use local state during drag for instant feedback, fall back to server state
  const displayedMilestones = localMilestones ?? milestones;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byColumn = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, col) => {
          acc[col.id] = displayedMilestones.filter((m) => m.status === col.id);
          return acc;
        },
        {} as Record<MilestoneStatus, Milestone[]>,
      ),
    [displayedMilestones],
  );

  function handleDragStart(event: DragStartEvent) {
    const activeId = event.active.id as string;
    const m = milestones.find((m) => m.id === activeId) ?? null;
    setActiveMilestone(m);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    const overColumn = COLUMNS.find((c) => c.id === overId);
    const activeMil = displayedMilestones.find((m) => m.id === activeId);

    if (!activeMil) return;

    let targetStatus: MilestoneStatus;

    if (overColumn) {
      // Dropped on column header
      targetStatus = overColumn.id;
    } else {
      // Dropped on another card — use its column
      const overMil = displayedMilestones.find((m) => m.id === overId);
      if (!overMil) return;
      targetStatus = overMil.status;
    }

    if (activeMil.status !== targetStatus) {
      setLocalMilestones((prev) =>
        (prev ?? milestones).map((m) =>
          m.id === activeId
            ? { ...m, status: targetStatus, completed: targetStatus === "done" }
            : m,
        ),
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveMilestone(null);

    if (!over) {
      setLocalMilestones(null);
      return;
    }

    const current = localMilestones ?? milestones;

    // Build reorder payload
    const items = current.map((m, idx) => ({
      id: m.id,
      order: idx,
      status: m.status,
    }));

    reorder(items);
    setLocalMilestones(null);
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-24">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] gap-4 overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            milestones={byColumn[col.id]}
            onCardClick={(m) => setPanelMilestone(m)}
          />
        ))}

        <DragOverlay>
          {activeMilestone && (
            <KanbanCard
              milestone={activeMilestone}
              onClick={() => {}}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Milestone detail panel */}
      <MilestoneCommandPanel
        milestone={panelMilestone}
        projectId={projectId}
        onClose={() => setPanelMilestone(null)}
        members={members}
      />
    </div>
  );
}
