"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ProjectMember } from "../../types";

interface AddMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetStatus?: string;
  members: ProjectMember[];
  onSubmit: (data: {
    title: string;
    description: string;
    assigneeId: string | null;
    dueDate: Date | null;
    priority: string;
    status: string;
  }) => void;
}

export function AddMilestoneDialog({
  open,
  onOpenChange,
  presetStatus,
  members,
  onSubmit,
}: AddMilestoneDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState(presetStatus || "todo");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      priority,
      status,
    });

    // Reset
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setDueDate(undefined);
    setPriority("medium");
    setStatus("todo");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Milestone</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="text-muted-foreground mb-1 block text-[12px]">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Milestone title"
              className="border-border bg-muted/50 text-foreground text-[13px]"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-muted-foreground mb-1 block text-[12px]">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this milestone..."
              className="border-border bg-muted/50 text-foreground text-[13px]"
              rows={3}
            />
          </div>

          {/* Assignee + Due Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-[12px]">
                Assignee
              </label>
              <Select
                value={assigneeId}
                onValueChange={(val) => setAssigneeId(val || "")}
              >
                <SelectTrigger className="border-border bg-muted/50 text-foreground text-[12px]">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.user?.name || m.user?.email || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-[12px]">
                Due Date
              </label>
              <DatePicker date={dueDate} onDateChange={setDueDate} />
            </div>
          </div>

          {/* Priority + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-[12px]">
                Priority
              </label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val || "")}
              >
                <SelectTrigger className="border-border bg-muted/50 text-foreground text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-[12px]">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val || "")}
              >
                <SelectTrigger className="border-border bg-muted/50 text-foreground text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-foreground/70 text-[12px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-[12px]"
            >
              Add Milestone
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
