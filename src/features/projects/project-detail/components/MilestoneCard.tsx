"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { format, isPast, differenceInDays } from "date-fns";
import { Milestone } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MilestoneCardProps {
  milestone: Milestone;
  onStatusChange?: (id: string, completed: boolean) => void;
}

export const MilestoneCard = memo(function MilestoneCard({
  milestone,
  onStatusChange,
}: MilestoneCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: milestone.id,
    data: {
      type: "Milestone",
      milestone,
    },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const isOverdue =
    milestone.due_date &&
    isPast(new Date(milestone.due_date)) &&
    !milestone.completed;
  const isDueSoon =
    milestone.due_date &&
    !milestone.completed &&
    differenceInDays(new Date(milestone.due_date), new Date()) <= 3;

  let urgencyBorder = "border-transparent";
  if (isOverdue) urgencyBorder = "border-l-destructive";
  else if (isDueSoon) urgencyBorder = "border-l-warning";

  return (
    <Sheet>
      <SheetTrigger>
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className={`group bg-card relative flex cursor-grab flex-col gap-3 rounded-lg border border-l-4 p-4 shadow-sm hover:shadow-md ${urgencyBorder}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-foreground line-clamp-2 text-sm leading-tight font-semibold">
              {milestone.title}
            </span>
            <div
              className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full"
              aria-label="Priority indicator"
            />
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="text-muted-foreground flex items-center text-xs">
              {milestone.due_date
                ? format(new Date(milestone.due_date), "MMM d")
                : "No date"}
            </div>
            {milestone.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={milestone.assignee.avatar_url || ""} />
                <AvatarFallback className="text-[10px]">
                  {milestone.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Milestone Details</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div>
            <h3 className="mb-2 text-xl font-semibold">{milestone.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={milestone.completed ? "success" : "default"}>
                {milestone.completed ? "Done" : "Pending"}
              </Badge>
              {milestone.due_date && (
                <span className="text-muted-foreground text-sm">
                  Due: {format(new Date(milestone.due_date), "PPP")}
                </span>
              )}
            </div>
          </div>
          {/* Detail form could go here (editable title, description) */}
          <div className="bg-muted/20 rounded-md border p-4 text-sm">
            <span className="text-muted-foreground italic">
              Edit capability placeholder. This sheet allows inline editing of
              milestone checklist and details.
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
