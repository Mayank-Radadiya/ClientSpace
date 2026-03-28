"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gooeyToast } from "goey-toast";
import { format } from "date-fns";
import { PlusIcon, TrashIcon, Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

import {
  CURRENCIES,
  type Currency,
  calculateTotals,
  createInvoiceSchema,
  type CreateInvoiceInput,
  formatCents,
} from "../schemas";
import { createInvoice } from "../server/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string;
}

interface Project {
  id: string;
  clientId: string;
  name: string;
}

interface InvoiceBuilderProps {
  clients: Client[];
  projects: Project[];
  defaultCurrency?: Currency;
  onSuccess?: (invoiceId: string) => void;
  onCancel?: () => void;
}

// ─── Default Values ───────────────────────────────────────────────────────────

const DEFAULT_ITEM = {
  description: "",
  quantity: 1,
  unitPriceCents: 0,
};

// ─── Helper: Field error message ─────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoiceBuilder({
  clients,
  projects,
  defaultCurrency = "USD",
  onSuccess,
  onCancel,
}: InvoiceBuilderProps) {
  const utils = trpc.useUtils();
  const [isPending, startTransition] = useTransition();
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientId: "",
      projectId: "",
      currency: defaultCurrency,
      taxRateBasisPoints: 0,
      dueDate: undefined,
      notes: "",
      items: [{ ...DEFAULT_ITEM }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // ── Live Preview ─────────────────────────────────────────────────

  const watchedItems = useWatch({ control, name: "items" });
  const watchedTax = useWatch({ control, name: "taxRateBasisPoints" });
  const watchedCurrency = useWatch({ control, name: "currency" }) as Currency;
  const watchedClientId = watch("clientId");

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const trigger = document.getElementById("clientId");
      trigger?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const availableProjects = useMemo(
    () =>
      watchedClientId
        ? projects.filter((project) => project.clientId === watchedClientId)
        : projects,
    [projects, watchedClientId],
  );

  const selectedClientLabel = useMemo(() => {
    if (!watchedClientId) return "";
    const selectedClient = clients.find(
      (client) => client.id === watchedClientId,
    );
    if (!selectedClient) return "";
    return (
      selectedClient.companyName ??
      selectedClient.contactName ??
      selectedClient.email ??
      "Unnamed Client"
    );
  }, [clients, watchedClientId]);

  const watchedProjectId = watch("projectId");

  const selectedProjectLabel = useMemo(() => {
    if (!watchedProjectId) return "";
    return (
      projects.find((project) => project.id === watchedProjectId)?.name ?? ""
    );
  }, [projects, watchedProjectId]);

  const safeItems = (watchedItems ?? []).map((item) => ({
    description: item?.description ?? "",
    quantity: Number(item?.quantity) || 0,
    unitPriceCents: Number(item?.unitPriceCents) || 0,
  }));

  const totals = calculateTotals(safeItems, Number(watchedTax) || 0);

  // ── Submit ────────────────────────────────────────────────────────

  const onSubmit = (data: CreateInvoiceInput) => {
    const normalized: CreateInvoiceInput = {
      ...data,
      projectId: data.projectId?.trim() ? data.projectId : undefined,
    };

    startTransition(async () => {
      try {
        const result = await createInvoice(normalized);
        if (result.success && result.data) {
          await utils.invoice.getAll.invalidate();
          gooeyToast.success(
            `Invoice ${result.data.formattedNumber} created successfully!`,
          );
          reset({
            clientId: "",
            projectId: "",
            currency: defaultCurrency,
            taxRateBasisPoints: 0,
            dueDate: undefined,
            notes: "",
            items: [{ ...DEFAULT_ITEM }],
          });
          onSuccess?.(result.data.invoiceId);
        } else {
          gooeyToast.error(result.error ?? "Failed to create invoice.");
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, messages]) => {
              setError(field as keyof CreateInvoiceInput, {
                message: messages?.[0] ?? "Invalid value",
              });
            });
          }
        }
      } catch {
        gooeyToast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  const taxPercent = ((Number(watchedTax) || 0) / 100).toFixed(2);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="border-border/70 bg-card space-y-4 rounded-xl border p-6">
        <div className="space-y-1">
          <h3 className="text-foreground text-sm font-semibold tracking-wide">
            Basic Info
          </h3>
          <p className="text-muted-foreground text-sm">
            Configure recipient, project context, and invoice settings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientId" className="text-sm font-medium">
              Client *
            </Label>
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const currentProject = watch("projectId");
                    if (
                      currentProject &&
                      !projects.some(
                        (project) =>
                          project.id === currentProject &&
                          project.clientId === value,
                      )
                    ) {
                      setValue("projectId", "");
                    }
                  }}
                  value={field.value}
                >
                  <SelectTrigger id="clientId" className="h-11">
                    <span
                      className={cn(
                        "block flex-1 truncate pr-2 text-left",
                        !selectedClientLabel && "text-muted-foreground",
                      )}
                    >
                      {selectedClientLabel || "Select a client"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-accent/30 w-(--anchor-width) max-w-(--anchor-width)">
                    {clients.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No clients found
                      </SelectItem>
                    ) : (
                      clients.map((c) => {
                        const label =
                          c.companyName ?? c.contactName ?? "Unnamed Client";
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="block truncate">
                              {`${label} (${c.email})`}
                            </span>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.clientId?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId" className="text-sm font-medium">
              Project
            </Label>
            <Controller
              control={control}
              name="projectId"
              render={({ field }) => (
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "__none" ? "" : value)
                  }
                  value={field.value || "__none"}
                >
                  <SelectTrigger id="projectId" className="h-11">
                    <span
                      className={cn(
                        "block flex-1 truncate pr-2 text-left",
                        !selectedProjectLabel && "text-muted-foreground",
                      )}
                    >
                      {selectedProjectLabel || "Optional project"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="w-(--anchor-width) max-w-(--anchor-width)">
                    <SelectItem value="__none">No project</SelectItem>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="block truncate">{project.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.projectId?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium">
              Currency *
            </Label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="currency" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.currency?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </Label>
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => {
                const dateValue = field.value
                  ? new Date(field.value)
                  : undefined;
                return (
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger
                      id="dueDate"
                      className={cn(
                        "border-input bg-background hover:bg-accent/40 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-11 w-full items-center rounded-lg border px-3 text-left text-sm font-normal shadow-xs/5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-1",
                        !dateValue && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateValue
                        ? format(dateValue, "MMM d, yyyy")
                        : "Select date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd") : undefined,
                          );
                          setDueDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                );
              }}
            />
            <FieldError message={errors.dueDate?.message} />
          </div>

          <div className="space-y-2 sm:col-span-2 sm:max-w-[320px]">
            <Label htmlFor="taxRate" className="text-sm font-medium">
              Tax Rate (%)
            </Label>
            <Controller
              control={control}
              name="taxRateBasisPoints"
              render={({ field }) => (
                <div className="relative">
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    className="h-11 pr-8"
                    value={
                      !field.value || field.value === 0
                        ? ""
                        : (Number(field.value) / 100).toString()
                    }
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value);
                      field.onChange(isNaN(pct) ? 0 : Math.round(pct * 100));
                    }}
                  />
                  <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                    %
                  </span>
                </div>
              )}
            />
            <FieldError message={errors.taxRateBasisPoints?.message} />
          </div>
        </div>
      </section>

      <section className="border-border/70 bg-card space-y-4 rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-foreground text-sm font-semibold tracking-wide">
              Line Items
            </h3>
            <p className="text-muted-foreground text-sm">
              Add billable services or products.
            </p>
          </div>
          <span className="text-muted-foreground text-xs">
            {fields.length} {fields.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="border-border/60 text-muted-foreground hidden grid-cols-[minmax(0,1fr)_110px_140px_140px_44px] gap-6 border-b px-1 pb-3 text-xs font-semibold tracking-wide uppercase sm:grid">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit Price</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        <div className="space-y-3">
          {fields.map((field, idx) => {
            const qty = Number(watchedItems?.[idx]?.quantity) || 0;
            const price = Number(watchedItems?.[idx]?.unitPriceCents) || 0;
            const lineTotal = Math.round(qty * price);

            return (
              <div
                key={field.id}
                className="border-border/60 hover:bg-muted/30 rounded-lg border px-3 py-3 transition-colors"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_110px_140px_140px_44px] sm:items-start sm:gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:hidden">Description</Label>
                    <Input
                      placeholder="Service or item description"
                      {...register(`items.${idx}.description`)}
                      aria-label="Item description"
                      className="h-11"
                    />
                    <FieldError
                      message={errors.items?.[idx]?.description?.message}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:hidden">Quantity</Label>
                    <Controller
                      control={control}
                      name={`items.${idx}.quantity`}
                      render={({ field: f }) => (
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="1"
                          className="h-11 text-right"
                          value={f.value === 0 ? "" : f.value}
                          onChange={(e) =>
                            f.onChange(parseFloat(e.target.value) || 0)
                          }
                          aria-label="Quantity"
                        />
                      )}
                    />
                    <FieldError
                      message={errors.items?.[idx]?.quantity?.message}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:hidden">Unit Price</Label>
                    <Controller
                      control={control}
                      name={`items.${idx}.unitPriceCents`}
                      render={({ field: f }) => (
                        <div className="relative">
                          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="h-11 pl-7 text-right"
                            value={
                              f.value === 0 ? "" : (f.value / 100).toString()
                            }
                            onChange={(e) => {
                              const dollars = parseFloat(e.target.value);
                              f.onChange(
                                isNaN(dollars) ? 0 : Math.round(dollars * 100),
                              );
                            }}
                            aria-label="Unit price"
                          />
                        </div>
                      )}
                    />
                    <FieldError
                      message={errors.items?.[idx]?.unitPriceCents?.message}
                    />
                  </div>

                  <div className="bg-muted/35 flex h-11 items-center justify-between rounded-md px-3 sm:justify-end sm:bg-transparent sm:px-0">
                    <Label className="text-xs sm:hidden">Total</Label>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCents(lineTotal, watchedCurrency)}
                    </span>
                  </div>

                  <div className="flex h-11 items-center justify-end sm:justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(idx)}
                      disabled={fields.length === 1}
                      aria-label="Remove line item"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {fields.length < 50 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ ...DEFAULT_ITEM })}
            className="h-10 w-full sm:w-auto"
          >
            <PlusIcon className="h-4 w-4" />
            Add Line Item
          </Button>
        )}

        {errors.items?.message && (
          <p className="text-destructive text-sm">{errors.items.message}</p>
        )}
        {errors.items?.root?.message && (
          <p className="text-destructive text-sm">
            {errors.items.root.message}
          </p>
        )}
      </section>

      <section className="border-border/70 bg-card space-y-4 rounded-xl border p-6">
        <div className="space-y-1">
          <h3 className="text-foreground text-sm font-semibold tracking-wide">
            Notes
          </h3>
          <p className="text-muted-foreground text-sm">
            Optional payment terms, references, or delivery details.
          </p>
        </div>

        <div className="space-y-2">
          <Textarea
            id="notes"
            placeholder="Add any additional information..."
            maxLength={1000}
            rows={4}
            className="resize-none"
            {...register("notes")}
          />
          <FieldError message={errors.notes?.message} />
        </div>
      </section>

      <section className="border-border/70 bg-background/20 space-y-4 rounded-xl border p-6">
        <h3 className="text-foreground text-sm font-semibold tracking-wide">
          Summary
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">
              {formatCents(totals.subtotal, watchedCurrency)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax ({taxPercent}%)</span>
            <span className="font-medium tabular-nums">
              {formatCents(totals.tax, watchedCurrency)}
            </span>
          </div>

          <Separator />

          <div className="flex items-end justify-between">
            <span className="text-base font-semibold">Total</span>
            <span className="text-3xl font-bold tracking-tight tabular-nums">
              {formatCents(totals.total, watchedCurrency)}
            </span>
          </div>
        </div>
      </section>

      <section className="border-border/70 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="h-10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="h-10 min-w-[170px]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Invoice"
          )}
        </Button>
      </section>
    </form>
  );
}
