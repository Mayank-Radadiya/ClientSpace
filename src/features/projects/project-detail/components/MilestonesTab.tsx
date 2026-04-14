"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Milestone } from "../types";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  List as ListIcon,
  Plus,
  ChevronDown,
  Check,
  Columns3,
  CircleDashed,
  ListTodo,
} from "lucide-react";
import { gooeyToast } from "goey-toast";

interface MilestonesTabProps {
  milestones: Milestone[];
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onAddMilestone: (presetStatus?: string) => void;
}

const GROUPS = ["To Do", "In Progress", "Done"] as const;

export function MilestonesTab({
  milestones,
  onUpdateMilestone,
  onAddMilestone,
}: MilestonesTabProps) {
  const [view, setView] = useState<"list" | "board">("list");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "To Do": true,
    "In Progress": true,
    Done: true,
  });

  const toggleGroup = (group: string) => {
    setExpanded((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const mappedMilestones = useMemo(() => {
    return milestones.map((m) => {
      let status = m.completed ? "Done" : "To Do";
      return { ...m, uiStatus: status };
    });
  }, [milestones]);

  const isEmpty = milestones.length === 0;

  const handleToggleComplete = (
    milestone: Milestone & { uiStatus: string },
  ) => {
    const isCompleted = !milestone.completed;
    onUpdateMilestone(milestone.id, {
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    });
  };

  if (isEmpty) {
    return (
      <div className="bg-card border-border flex flex-col items-center justify-center rounded-xl border px-4 py-20 text-center shadow-sm">
        <div className="bg-muted/50 border-border/50 mb-6 flex h-20 w-20 items-center justify-center rounded-full border">
          <ListTodo className="text-muted-foreground/50 h-10 w-10" />
        </div>
        <h3 className="text-foreground mb-2 text-[16px] font-medium">
          No milestones yet
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm text-[14px]">
          Break your project into trackable deliverables
        </p>
        <Button onClick={() => onAddMilestone()}>
          <Plus className="mr-2 h-4 w-4" /> Add milestone
        </Button>
      </div>
    );
  }

  const StatusPill = ({ status }: { status: string }) => {
    if (status === "Done")
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
          <Check className="h-3 w-3" /> Done
        </div>
      );
    if (status === "In Progress")
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-500">
          <CircleDashed className="animate-spin-slow h-3 w-3" /> In Progress
        </div>
      );
    return (
      <div className="bg-muted text-muted-foreground border-border/50 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium">
        <div className="bg-muted-foreground/50 h-1.5 w-1.5 rounded-full" /> To
        Do
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground hidden text-[16px] font-medium md:block">
          Milestones
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-muted border-border/50 flex items-center rounded-md border p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-all ${view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ListIcon className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-all ${view === "board" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Columns3 className="h-4 w-4" /> Board
            </button>
          </div>
          <Button size="sm" onClick={() => onAddMilestone()}>
            <Plus className="mr-2 h-4 w-4" /> Add Milestone
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="flex flex-col gap-6">
          {GROUPS.map((group) => {
            const groupMilestones = mappedMilestones.filter(
              (m) => m.uiStatus === group,
            );
            if (groupMilestones.length === 0 && group !== "To Do") return null;

            return (
              <div key={group} className="flex flex-col">
                <button
                  onClick={() => toggleGroup(group)}
                  className="group mb-2 flex w-fit items-center gap-2 py-2"
                >
                  <ChevronDown
                    className={`text-muted-foreground h-4 w-4 transition-transform ${expanded[group] ? "" : "-rotate-90"}`}
                  />
                  <span className="text-foreground text-[13px] font-medium tracking-wide uppercase">
                    {group}
                  </span>
                  <span className="bg-muted border-border/50 text-muted-foreground rounded-full border px-1.5 py-0.5 text-[11px] font-medium">
                    {groupMilestones.length}
                  </span>
                </button>

                {expanded[group] && (
                  <div className="border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
                    {groupMilestones.length === 0 ? (
                      <div className="text-muted-foreground py-8 text-center text-[13px]">
                        No milestones in this group
                      </div>
                    ) : (
                      groupMilestones.map((m, i) => (
                        <div
                          key={m.id}
                          className={`group hover:bg-muted/50 flex items-center justify-between p-4 transition-colors ${i !== groupMilestones.length - 1 ? "border-border/50 border-b" : ""}`}
                        >
                          <div className="flex flex-1 items-center gap-4 overflow-hidden">
                            <button
                              onClick={() => handleToggleComplete(m)}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${m.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-input bg-card group-hover:border-indigo-500"}`}
                            >
                              {m.completed && <Check className="h-3 w-3" />}
                            </button>
                            <span
                              className={`truncate text-[14px] font-medium ${m.completed ? "text-muted-foreground/70 line-through" : "text-card-foreground"}`}
                            >
                              {m.title}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-6 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-[12px]"
                              onClick={() =>
                                gooeyToast.success("Edit milestone")
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-[12px] text-red-500 hover:bg-red-500/10 hover:text-red-600"
                              onClick={() =>
                                gooeyToast.success("Delete milestone")
                              }
                            >
                              Delete
                            </Button>
                          </div>

                          <div className="ml-4 flex shrink-0 items-center gap-6">
                            {m.assignee ? (
                              <div className="flex items-center gap-2">
                                {m.assignee.avatar_url ? (
                                  <img
                                    src={m.assignee.avatar_url}
                                    alt=""
                                    className="bg-muted h-6 w-6 rounded-full"
                                  />
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-medium text-indigo-500">
                                    {m.assignee.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-muted-foreground hidden text-[13px] sm:block">
                                  {m.assignee.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="border-input bg-muted/30 flex h-6 w-6 items-center justify-center rounded-full border border-dashed">
                                  <div className="bg-muted-foreground/30 h-2 w-2 rounded-full" />
                                </div>
                                <span className="text-muted-foreground/70 hidden text-[13px] sm:block">
                                  Unassigned
                                </span>
                              </div>
                            )}

                            <div className="w-24 text-right">
                              <span className="text-muted-foreground text-[13px]">
                                {m.due_date
                                  ? format(new Date(m.due_date), "MMM d")
                                  : "No date"}
                              </span>
                            </div>

                            <div className="flex w-24 justify-end">
                              <StatusPill status={m.uiStatus} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-border grid grid-cols-1 gap-6 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          {GROUPS.map((col) => {
            const colMilestones = mappedMilestones.filter(
              (m) => m.uiStatus === col,
            );
            return (
              <div
                key={col}
                className="flex flex-col py-4 first:px-0 last:px-0 md:px-4 md:py-0"
              >
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-foreground text-[13px] font-medium tracking-wide uppercase">
                    {col}
                  </h3>
                  <span className="bg-muted border-border/50 text-muted-foreground rounded-full border px-1.5 py-0.5 text-[11px] font-medium">
                    {colMilestones.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {colMilestones.map((m) => (
                    <div
                      key={m.id}
                      className="bg-card border-border flex cursor-pointer flex-col gap-3 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(m);
                          }}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${m.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-input bg-card hover:border-indigo-500"}`}
                        >
                          {m.completed && <Check className="h-3 w-3" />}
                        </button>
                        <span
                          className={`text-[14px] leading-snug font-medium ${m.completed ? "text-muted-foreground/70 line-through" : "text-card-foreground"}`}
                        >
                          {m.title}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between pl-8">
                        {m.assignee ? (
                          m.assignee.avatar_url ? (
                            <img
                              src={m.assignee.avatar_url}
                              alt=""
                              className="bg-muted h-5 w-5 rounded-full"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[9px] font-medium text-indigo-500">
                              {m.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div className="border-input bg-muted/30 h-5 w-5 rounded-full border border-dashed" />
                        )}
                        <span className="text-muted-foreground text-[12px]">
                          {m.due_date
                            ? format(new Date(m.due_date), "MMM d")
                            : "No date"}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => onAddMilestone()}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 border-input mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-[13px] font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add milestone
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
