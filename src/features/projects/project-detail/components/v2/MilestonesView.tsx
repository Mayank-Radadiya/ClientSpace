"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Milestone } from "../../types";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { MilestoneKanbanCard } from "./MilestoneKanbanCard";
import { MilestoneListView } from "./MilestoneListView";

type MilestoneStatus = "todo" | "in_progress" | "done";
type ViewMode = "kanban" | "list";

interface MilestonesViewProps {
  milestones: Milestone[];
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onAddMilestone: (presetStatus?: string) => void;
  onMilestoneClick: (milestone: Milestone) => void;
}

function deriveMilestoneStatus(m: Milestone): MilestoneStatus {
  if (m.status) return m.status;
  return m.completed ? "done" : "todo";
}

const COLUMNS: { key: MilestoneStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

/* ── Draggable card wrapper ─────────────────────────────────── */
function DraggableMilestoneCard({
  milestone,
  onMilestoneClick,
}: {
  milestone: Milestone;
  onMilestoneClick: (m: Milestone) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: milestone.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
    >
      <MilestoneKanbanCard
        milestone={milestone}
        onClick={() => onMilestoneClick(milestone)}
        dragListeners={listeners}
      />
    </div>
  );
}

/* ── Droppable column ───────────────────────────────────────── */
function KanbanColumn({
  label,
  status,
  items,
  onAdd,
  onMilestoneClick,
}: {
  label: string;
  status: MilestoneStatus;
  items: Milestone[];
  onAdd: () => void;
  onMilestoneClick: (milestone: Milestone) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[400px] flex-1 flex-col rounded-xl border transition-colors ${
        isOver
          ? "border-primary/50 bg-primary/5"
          : "border-border/5 bg-muted/50"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-foreground/70 text-[13px] font-medium">
            {label}
          </span>
          <span className="bg-muted text-muted-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px]">
            {items.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="text-muted-foreground hover:bg-muted hover:text-foreground/70 rounded-md p-1 transition-colors"
          aria-label={`Add milestone to ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
        {items.length === 0 ? (
          <div className="border-border flex flex-1 items-center justify-center rounded-lg border-[1.5px] border-dashed p-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                <Plus className="text-muted-foreground h-5 w-5" />
              </div>
              <p className="text-muted-foreground text-[12px]">No milestones</p>
              <button
                onClick={onAdd}
                className="text-primary text-[12px] hover:underline"
              >
                + Add one
              </button>
            </div>
          </div>
        ) : (
          items.map((milestone) => (
            <DraggableMilestoneCard
              key={milestone.id}
              milestone={milestone}
              onMilestoneClick={onMilestoneClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function MilestonesView({
  milestones,
  onUpdateMilestone,
  onAddMilestone,
  onMilestoneClick,
}: MilestonesViewProps) {
  const reduced = useReducedMotion();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const columns = useMemo(() => {
    const grouped: Record<MilestoneStatus, Milestone[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const m of milestones) {
      const status = deriveMilestoneStatus(m);
      grouped[status].push(m);
    }
    for (const key of Object.keys(grouped) as MilestoneStatus[]) {
      grouped[key].sort((a, b) => a.order - b.order);
    }
    return grouped;
  }, [milestones]);

  const activeDragMilestone = activeDragId
    ? (milestones.find((m) => m.id === activeDragId) ?? null)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const milestoneId = String(active.id);
    const overId = String(over.id);

    // Check if dropped on a column or a card in a column
    let targetStatus: MilestoneStatus | null = null;
    for (const col of COLUMNS) {
      if (col.key === overId) {
        targetStatus = col.key;
        break;
      }
    }

    if (targetStatus) {
      const completed = targetStatus === "done";
      onUpdateMilestone(milestoneId, {
        status: targetStatus,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      });
    }
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.15 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">Milestones</h2>
        <div className="flex items-center gap-2">
          <div className="border-border flex rounded-lg border p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`rounded-md p-1.5 ${viewMode === "kanban" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground/70"}`}
              aria-label="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground/70"}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 px-3 text-xs"
            onClick={() => onAddMilestone()}
          >
            <Plus className="h-3.5 w-3.5" /> Add Milestone
          </Button>
        </div>
      </div>

      {/* View */}
      <AnimatePresence mode="wait">
        {viewMode === "kanban" ? (
          <motion.div
            key="kanban"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.key}
                    label={col.label}
                    status={col.key}
                    items={columns[col.key]}
                    onAdd={() => onAddMilestone(col.key)}
                    onMilestoneClick={onMilestoneClick}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeDragMilestone && (
                  <MilestoneKanbanCard
                    milestone={activeDragMilestone}
                    isDragging
                    onClick={() => {}}
                  />
                )}
              </DragOverlay>
            </DndContext>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <MilestoneListView
              milestones={milestones}
              onUpdateMilestone={onUpdateMilestone}
              onMilestoneClick={onMilestoneClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
