"use client";

import { useFormStatus } from "react-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useCreateProject } from "./useCreateProject";
import { ACTIVE_STATUS_OPTIONS, PRIORITY_OPTIONS } from "./project.constants";

type Client = { id: string; companyName: string | null; email: string };

interface CreateProjectFormProps {
  clients: Client[];
  onSuccess?: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="shadow-primary/20 h-11 w-full rounded-xl px-8 font-black tracking-widest shadow-xl sm:w-auto"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          EXECUTING…
        </>
      ) : (
        "LAUNCH PROJECT"
      )}
    </Button>
  );
}

export function CreateProjectForm({
  clients,
  onSuccess,
}: CreateProjectFormProps) {
  const {
    state,
    formAction,
    formRef,
    startDate,
    setStartDate,
    deadline,
    setDeadline,
    startDateOpen,
    setStartDateOpen,
    deadlineOpen,
    setDeadlineOpen,
    selectedClientId,
    setSelectedClientId,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
  } = useCreateProject(onSuccess);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedStatusLabel = ACTIVE_STATUS_OPTIONS.find(
    (o) => o.value === selectedStatus,
  )?.label;
  const selectedPriorityLabel = PRIORITY_OPTIONS.find(
    (o) => o.value === selectedPriority,
  )?.label;

  return (
    <form action={formAction} ref={formRef} className="space-y-8 p-8 pt-4">
      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold tracking-wide text-red-500">
          {state.error.toUpperCase()}
        </div>
      )}

      <div className="grid gap-6">
        {/* Row 1: Project name */}
        <div className="space-y-2.5">
          <Label
            htmlFor="name"
            className="ml-1 text-[10px] font-black tracking-widest uppercase opacity-40"
          >
            Project Identifier *
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="E.g., Phoenix Strategy"
            required
            className="border-input bg-background focus-visible:ring-primary/40 h-12 rounded-xl px-5"
          />
        </div>

        {/* Row 2: Counterparty + Budget */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2.5">
            <Label
              htmlFor="clientId"
              className="ml-1 text-[10px] font-black tracking-widest uppercase opacity-40"
            >
              Counterparty *
            </Label>
            <Select
              name="clientId"
              required
              value={selectedClientId}
              onValueChange={(val) => setSelectedClientId(val)}
            >
              <SelectTrigger
                id="clientId"
                className="border-input bg-background focus:ring-primary/40 h-12 rounded-xl transition-all"
              >
                <SelectValue placeholder="Select entity">
                  {selectedClient
                    ? selectedClient.companyName || selectedClient.email
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/95 rounded-2xl backdrop-blur-3xl">
                {clients.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    className="rounded-lg py-2.5"
                  >
                    {c.companyName || c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="budget"
              className="ml-1 text-[10px] font-black tracking-widest uppercase opacity-40"
            >
              Budget ($)
            </Label>
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-black text-emerald-500">
                $
              </span>
              <Input
                id="budget"
                name="budget"
                type="number"
                placeholder="0"
                className="border-input bg-background h-12 rounded-xl pl-9 font-mono font-bold text-emerald-500 focus-visible:ring-emerald-500/40"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Status + Priority */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2.5">
            <Label
              htmlFor="status"
              className="ml-1 text-[10px] font-black tracking-widest uppercase opacity-40"
            >
              Status
            </Label>
            <Select
              name="status"
              value={selectedStatus}
              onValueChange={(val) => setSelectedStatus(val)}
            >
              <SelectTrigger
                id="status"
                className="border-input bg-background focus:ring-primary/40 h-12 rounded-xl transition-all"
              >
                <SelectValue placeholder="Status">
                  {selectedStatusLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/95 rounded-2xl backdrop-blur-3xl">
                {ACTIVE_STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="rounded-lg py-2.5 text-[10px] font-bold tracking-wider uppercase"
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2.5">
            <Label
              htmlFor="priority"
              className="ml-1 text-[10px] font-black tracking-widest uppercase opacity-40"
            >
              Priority
            </Label>
            <Select
              name="priority"
              value={selectedPriority}
              onValueChange={(val) => setSelectedPriority(val)}
            >
              <SelectTrigger
                id="priority"
                className="border-input bg-background focus:ring-primary/40 h-12 rounded-xl transition-all"
              >
                <SelectValue placeholder="Priority">
                  {selectedPriorityLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border bg-popover/95 rounded-2xl backdrop-blur-3xl">
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="rounded-lg py-2.5 text-[10px] font-bold tracking-wider uppercase"
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 4: Dates */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2.5">
            <Label className="ml-1 text-[8px] font-black tracking-widest uppercase opacity-40">
              Commencement
            </Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger>
                <div className="flex h-12 w-fit cursor-pointer items-center justify-start rounded-xl border-white/8 bg-white/3 px-4 text-left text-xs font-semibold hover:border-white/40 hover:bg-white/10 hover:shadow hover:shadow-white/20">
                  <CalendarIcon className="text-primary mr-2 h-4 w-4" />
                  <span className="font-mono text-neutral-200">
                    {startDate
                      ? format(startDate, "MMM d, yyyy")
                      : "SELECT DATE"}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden rounded-2xl p-0 shadow-2xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setStartDateOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            <input
              type="hidden"
              name="startDate"
              value={startDate?.toISOString() || ""}
            />
          </div>

          <div className="flex flex-col space-y-2.5">
            <Label className="ml-1 text-[8px] font-black tracking-widest uppercase opacity-40">
              Deadline *
            </Label>
            <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
              <PopoverTrigger>
                <div className="flex h-12 w-fit cursor-pointer items-center justify-start rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 text-left text-xs font-bold text-amber-500 transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="font-mono">
                    {deadline
                      ? format(deadline, "MMM d, yyyy")
                      : "DECIDE TIMELINE"}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden rounded-2xl border-white/10 p-0 shadow-2xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(date) => {
                    setDeadline(date);
                    setDeadlineOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            <input
              type="hidden"
              name="deadline"
              value={deadline?.toISOString() || ""}
            />
          </div>
        </div>

        {/* Strategic Overview */}
        <div className="space-y-2.5">
          <Label
            htmlFor="description"
            className="ml-1 text-[10px] font-black tracking-widest uppercase opacity-40"
          >
            Strategic Overview *
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Mission parameters and execution details…"
            required
            className="border-input bg-background focus-visible:ring-primary/40 h-28 resize-none rounded-xl p-4 text-[13px] leading-relaxed transition-all placeholder:opacity-50"
          />
        </div>
      </div>

      <DialogFooter className="border-border bg-muted/30 -mx-8 border-t px-8 pt-4">
        <SubmitButton />
      </DialogFooter>
    </form>
  );
}
