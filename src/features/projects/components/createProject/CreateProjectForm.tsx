"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc/client";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { projectSchema, type ProjectInput } from "../../schemas";
import { ACTIVE_STATUS_OPTIONS, PRIORITY_OPTIONS } from "./project.constants";
import { cn } from "@/lib/utils";
import { z } from "zod";

type Client = { id: string; companyName: string | null; email: string };

interface CreateProjectFormProps {
  clients: Client[];
  onSuccess?: () => void;
}

// Form-specific schema that includes the tagsInput helper field
const formSchema = projectSchema.extend({
  tagsInput: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Helper to parse tags from comma-separated string
function parseTags(value: string): string[] {
  if (!value || value.trim() === "") return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function CreateProjectForm({
  clients,
  onSuccess,
}: CreateProjectFormProps) {
  const utils = trpc.useUtils();
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    setFocus,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      clientId: "",
      status: "not_started",
      priority: "medium",
      startDate: null,
      deadline: undefined as any,
      budget: null,
      tags: [],
      tagsInput: "",
    },
    mode: "onBlur", // Validate on blur for better UX
    reValidateMode: "onChange", // Re-validate on change after first blur
  });

  // Watch form values for controlled components
  const clientId = watch("clientId");
  const status = watch("status");
  const priority = watch("priority");
  const startDate = watch("startDate");
  const deadline = watch("deadline");
  const tagsInput = watch("tagsInput");

  // tRPC mutation for creating project
  const createProjectMutation = trpc.project.create.useMutation({
    onSuccess: async () => {
      // Invalidate queries to refresh data
      await utils.project.getAll.invalidate();
      await utils.project.getBootstrap.invalidate();

      // Show success toast
      toast.dismiss();
      toast.success("Project launched successfully!", {
        duration: 4000,
      });

      // Reset form
      reset();

      // Call onSuccess callback (closes dialog)
      onSuccess?.();
    },
    onError: (error) => {
      // Handle different error types
      if (error.message.includes("client does not belong")) {
        setError("clientId", {
          type: "manual",
          message: "Selected client does not belong to your organization",
        });
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        setError("root.serverError", {
          type: "manual",
          message: "Network error. Please check your connection and try again.",
        });
      } else if (error.data?.code === "UNAUTHORIZED") {
        setError("root.serverError", {
          type: "manual",
          message: "You are not authorized to create projects.",
        });
      } else if (error.data?.code === "FORBIDDEN") {
        setError("root.serverError", {
          type: "manual",
          message: "You do not have permission to create projects.",
        });
      } else {
        setError("root.serverError", {
          type: "manual",
          message: error.message || "Something went wrong. Please try again.",
        });
      }

      // Show error toast
      toast.error("Failed to create project", {
        duration: 5000,
      });
    },
  });

  // Handle form submission
  const onSubmit = useCallback(
    async (data: ProjectInput & { tagsInput?: string }) => {
      try {
        // Clear any previous errors
        clearErrors("root.serverError");

        // Parse tags from comma-separated string
        const tags = parseTags(data.tagsInput || "");

        // Prepare data for mutation
        const payload: ProjectInput = {
          name: data.name,
          description: data.description,
          clientId: data.clientId,
          status: data.status,
          priority: data.priority,
          startDate: data.startDate,
          deadline: data.deadline,
          budget: data.budget,
          tags,
        };

        // Submit via tRPC mutation
        await createProjectMutation.mutateAsync(payload);
      } catch (error) {
        // Error is handled by mutation's onError callback
        console.error("Form submission error:", error);
      }
    },
    [createProjectMutation, clearErrors],
  );

  // Auto-focus first error field when validation fails
  useEffect(() => {
    if (Object.keys(errors).length > 0 && !isSubmitting) {
      // Get first error field name
      const firstErrorField = Object.keys(errors)[0] as keyof typeof errors;

      // Skip root errors (they don't have fields)
      if (firstErrorField !== "root") {
        // Focus the field
        setFocus(firstErrorField as any);
      }
    }
  }, [errors, isSubmitting, setFocus]);

  // Clear field errors on input change
  const handleFieldChange = useCallback(
    (fieldName: keyof ProjectInput) => {
      if (errors[fieldName]) {
        clearErrors(fieldName);
      }
      // Also clear root errors when user starts fixing issues
      if (errors.root?.serverError) {
        clearErrors("root.serverError");
      }
    },
    [errors, clearErrors],
  );

  // Get selected client display name
  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedStatusLabel = ACTIVE_STATUS_OPTIONS.find(
    (o) => o.value === status,
  )?.label;
  const selectedPriorityLabel = PRIORITY_OPTIONS.find(
    (o) => o.value === priority,
  )?.label;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 overflow-auto p-8 pt-4"
      noValidate // We handle validation with Zod
    >
      {/* Global error message */}
      {errors.root?.serverError && (
        <Alert variant="error" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-bold tracking-wide">
            {errors.root.serverError.message}
          </AlertDescription>
        </Alert>
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
            {...register("name", {
              onChange: () => handleFieldChange("name"),
            })}
            placeholder="E.g., Phoenix Strategy"
            className={cn(
              "border-input bg-background focus-visible:ring-primary/40 h-12 rounded-xl px-5",
              errors.name && "border-red-500 focus-visible:ring-red-500/40",
            )}
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p
              id="name-error"
              className="text-xs font-bold tracking-wide text-red-400"
              role="alert"
            >
              {errors.name.message}
            </p>
          )}
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
              value={clientId || ""}
              onValueChange={(value) => {
                // Ensure value is always a string (Select always returns string)
                setValue("clientId", value as string, { shouldValidate: true });
                handleFieldChange("clientId");
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="clientId"
                className={cn(
                  "border-input bg-background focus:ring-primary/40 h-12 rounded-xl transition-all",
                  errors.clientId && "border-red-500 focus:ring-red-500/40",
                )}
                aria-invalid={!!errors.clientId}
                aria-describedby={
                  errors.clientId ? "clientId-error" : undefined
                }
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
            {errors.clientId && (
              <p
                id="clientId-error"
                className="text-xs font-bold tracking-wide text-red-400"
                role="alert"
              >
                {errors.clientId.message}
              </p>
            )}
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
                type="number"
                {...register("budget", {
                  onChange: () => handleFieldChange("budget"),
                  setValueAs: (v) => (v === "" ? null : parseFloat(v)),
                })}
                placeholder="0"
                className={cn(
                  "border-input bg-background h-12 rounded-xl pl-9 font-mono font-bold text-emerald-500 focus-visible:ring-emerald-500/40",
                  errors.budget &&
                    "border-red-500 focus-visible:ring-red-500/40",
                )}
                disabled={isSubmitting}
                aria-invalid={!!errors.budget}
                aria-describedby={errors.budget ? "budget-error" : undefined}
              />
            </div>
            {errors.budget && (
              <p
                id="budget-error"
                className="text-xs font-bold tracking-wide text-red-400"
                role="alert"
              >
                {errors.budget.message}
              </p>
            )}
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
              value={status || "not_started"}
              onValueChange={(value) => {
                setValue("status", value as any, { shouldValidate: true });
                handleFieldChange("status");
              }}
              disabled={isSubmitting}
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
              value={priority || "medium"}
              onValueChange={(value) => {
                setValue("priority", value as any, { shouldValidate: true });
                handleFieldChange("priority");
              }}
              disabled={isSubmitting}
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
            <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
              <PopoverTrigger
                className="border-input bg-accent dark:bg-accent/50 focus:ring-primary/40 flex h-12 w-fit cursor-pointer items-center justify-start rounded-xl px-4 text-left text-xs font-semibold shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                <CalendarIcon className="text-primary mr-2 h-4 w-4" />
                <span className="font-mono">
                  {startDate ? format(startDate, "MMM d, yyyy") : "SELECT DATE"}
                </span>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden rounded-2xl p-0 shadow-2xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={startDate ?? undefined}
                  onSelect={(date) => {
                    setValue("startDate", date ?? null, {
                      shouldValidate: true,
                    });
                    handleFieldChange("startDate");
                    setIsStartDateOpen(false);
                  }}
                  disabled={isSubmitting}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col space-y-2.5">
            <Label className="ml-1 text-[8px] font-black tracking-widest uppercase opacity-40">
              Deadline
            </Label>
            <Popover open={isDeadlineOpen} onOpenChange={setIsDeadlineOpen}>
              <PopoverTrigger
                className={cn(
                  "flex h-12 w-fit cursor-pointer items-center justify-start rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 text-left text-xs font-bold text-amber-500 transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.deadline &&
                    "border-red-500/40 bg-red-500/10 text-red-500 hover:border-red-500/60",
                )}
                disabled={isSubmitting}
                aria-invalid={!!errors.deadline}
                aria-describedby={
                  errors.deadline ? "deadline-error" : undefined
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="font-mono">
                  {deadline
                    ? format(deadline, "MMM d, yyyy")
                    : "DECIDE TIMELINE"}
                </span>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden rounded-2xl border-white/10 p-0 shadow-2xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(date) => {
                    setValue("deadline", date!, { shouldValidate: true });
                    handleFieldChange("deadline");
                    setIsDeadlineOpen(false);
                  }}
                  disabled={isSubmitting}
                />
              </PopoverContent>
            </Popover>
            {errors.deadline && (
              <p
                id="deadline-error"
                className="text-xs font-bold tracking-wide text-red-400"
                role="alert"
              >
                {errors.deadline.message}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2.5">
          <Label
            htmlFor="tags"
            className="ml-1 text-[10px] font-black tracking-widest uppercase opacity-40"
          >
            Tags (comma-separated)
          </Label>
          <Input
            id="tags"
            {...register("tagsInput", {
              onChange: () => handleFieldChange("tags"),
            })}
            placeholder="E.g., React, Node, AI"
            className={cn(
              "border-input bg-background focus-visible:ring-primary/40 h-12 rounded-xl px-5",
              errors.tags && "border-red-500 focus-visible:ring-red-500/40",
            )}
            disabled={isSubmitting}
            aria-invalid={!!errors.tags}
            aria-describedby={errors.tags ? "tags-error" : undefined}
          />
          {errors.tags && (
            <p
              id="tags-error"
              className="text-xs font-bold tracking-wide text-red-400"
              role="alert"
            >
              {errors.tags.message}
            </p>
          )}
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
            {...register("description", {
              onChange: () => handleFieldChange("description"),
            })}
            placeholder="Mission parameters and execution details…"
            rows={3}
            className={cn(
              "border-input bg-background focus-visible:ring-primary/40 h-28 resize-none rounded-xl p-4 text-[13px] leading-relaxed transition-all placeholder:opacity-50",
              errors.description &&
                "border-red-500 focus-visible:ring-red-500/40",
            )}
            disabled={isSubmitting}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
          />
          {errors.description && (
            <p
              id="description-error"
              className="text-xs font-bold tracking-wide text-red-400"
              role="alert"
            >
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <DialogFooter className="border-border bg-muted/30 -mx-8 border-t px-8 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="shadow-primary/20 h-11 w-full rounded-xl px-8 font-black tracking-widest text-white shadow-xl sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              EXECUTING…
            </>
          ) : (
            "LAUNCH PROJECT"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
