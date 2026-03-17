"use client";

import { useEffect, useState, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createProjectAction } from "../server/actions";
import { PRIORITY_LABELS, STATUS_LABELS } from "../schemas";

type Client = { id: string; companyName: string | null; email: string };

type CreateProjectDialogProps = {
  clients: Client[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        "Create Project"
      )}
    </Button>
  );
}

export function CreateProjectDialog({ clients }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createProjectAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Date picker states to manage controlled values for hidden inputs
  const [startDate, setStartDate] = useState<Date>();
  const [deadline, setDeadline] = useState<Date>();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      formRef.current?.reset();
      setStartDate(undefined);
      setDeadline(undefined);
    }
  }, [state.success]);

  const activeStatuses = Object.entries(STATUS_LABELS).filter(
    ([key]) => key !== "completed" && key !== "archived",
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="flex items-center gap-2">
          <Plus />
          <span>New Project</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Add a new project for a client. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} ref={formRef} className="space-y-4">
          {state.error && (
            <div className="text-destructive text-sm font-medium">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="E.g., Website Redesign"
              required
            />
            {state.fieldErrors?.name && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Select name="clientId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName || c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.clientId && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.clientId[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="not_started">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {activeStatuses.map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="startDate"
                value={startDate ? startDate.toISOString() : ""}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Deadline *</Label>
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? (
                      format(deadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="deadline"
                value={deadline ? deadline.toISOString() : ""}
              />
              {state.fieldErrors?.deadline && (
                <p className="text-destructive text-xs">
                  {state.fieldErrors.deadline[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (optional, in cents)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              min="0"
              placeholder="E.g., 500000"
            />
            {state.fieldErrors?.budget && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.budget[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional, comma-separated)</Label>
            <Input id="tags" name="tags" placeholder="react, design, Q3" />
            {state.fieldErrors?.tags && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.tags[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detailed project description..."
              required
              className="h-24 resize-none"
            />
            {state.fieldErrors?.description && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
