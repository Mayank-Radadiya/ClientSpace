"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gooeyToast } from "goey-toast";
import { format } from "date-fns";
import {
  PlusIcon,
  TrashIcon,
  Loader2,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

import {
  CURRENCIES,
  type Currency,
  calculateTotals,
  createInvoiceSchema,
  type CreateInvoiceInput,
  editInvoiceSchema,
  type EditInvoiceInput,
  formatCents,
} from "../schemas";
import { createInvoice, updateInvoice } from "../server/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InvoicePreview } from "./InvoicePreview";

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
  previewOpen?: boolean;
  setIsDirty?: (dirty: boolean) => void;
  invoiceId?: string;
  initialData?: any;
}

// ─── Default Values ───────────────────────────────────────────────────────────

const DEFAULT_ITEM = {
  description: "",
  quantity: 1,
  unitPriceCents: 0,
};

// ─── LocalStorage Autocomplete ────────────────────────────────────────────────
const useDescriptionHistory = () => {
  const [history, setHistory] = useState<
    Array<{ desc: string; price: number }>
  >([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("inv_desc_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const saveToHistory = (desc: string, price: number) => {
    if (!desc.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.desc !== desc);
      const newHistory = [{ desc, price }, ...filtered].slice(0, 10);
      try {
        localStorage.setItem("inv_desc_history", JSON.stringify(newHistory));
      } catch {}
      return newHistory;
    });
  };

  return { history, saveToHistory };
};

// ─── Helper: Field error message ─────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="font-dm-mono mt-1 text-xs text-red-500">{message}</p>;
}

// ─── Client Schema for both Edit and Create Form ──────────────────────────────
import { z } from "zod";
const clientInvoiceSchema = createInvoiceSchema.extend({
  id: z.string().uuid().optional(),
});
type FormValues = CreateInvoiceInput & { id?: string };

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoiceBuilder({
  clients,
  projects,
  defaultCurrency = "USD",
  onSuccess,
  onCancel,
  previewOpen = false,
  setIsDirty,
  invoiceId,
  initialData,
}: InvoiceBuilderProps) {
  const utils = trpc.useUtils();
  const [isPending, startTransition] = useTransition();
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const { history, saveToHistory } = useDescriptionHistory();

  // If notes exist in initialData, expand the notes field
  useEffect(() => {
    if (initialData?.notes) {
      setNotesExpanded(true);
    }
  }, [initialData]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(clientInvoiceSchema),
    defaultValues: initialData || {
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

  useEffect(() => {
    setIsDirty?.(isDirty);
  }, [isDirty, setIsDirty]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        gooeyToast.info("Draft saved locally (demo)");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit]);

  // ── Live Preview Data ─────────────────────────────────────────────

  const watchedItems = useWatch({ control, name: "items" });
  const watchedTax = useWatch({ control, name: "taxRateBasisPoints" });
  const watchedCurrency = useWatch({ control, name: "currency" }) as Currency;
  const watchedClientId = watch("clientId");
  const formValues = watch();

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

  const onSubmit = (data: FormValues) => {
    const normalized = {
      ...data,
      projectId: data.projectId?.trim() ? data.projectId : undefined,
    };

    // Save items to history
    normalized.items.forEach((item) => {
      saveToHistory(item.description, item.unitPriceCents);
    });

    startTransition(async () => {
      try {
        const result = invoiceId
          ? await updateInvoice({ id: invoiceId, ...normalized } as any)
          : await createInvoice(normalized as any);

        if (result.success && result.data) {
          await utils.invoice.getAll.invalidate();
          gooeyToast.success(
            `Invoice ${result.data.formattedNumber} ${invoiceId ? "updated" : "created"} successfully!`,
          );
          setIsDirty?.(false);
          if (!invoiceId) {
            reset({
              clientId: "",
              projectId: "",
              currency: defaultCurrency,
              taxRateBasisPoints: 0,
              dueDate: undefined,
              notes: "",
              items: [{ ...DEFAULT_ITEM }],
            });
          }
          onSuccess?.(result.data.invoiceId);
        } else {
          gooeyToast.error(result.error ?? "Failed to save invoice.");
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, messages]) => {
              setError(field as keyof FormValues, {
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
    <>
      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${previewOpen ? "w-1/2 border-r border-[var(--inv-divider)]" : "w-full"}`}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="relative flex flex-1 flex-col"
          id="invoice-form"
        >
          <div className="flex-1 space-y-12 p-6 pb-[140px]">
            {/* SECTION 1 */}
            <section>
              <h3 className="font-dm-mono mb-4 text-[11px] tracking-[0.10em] text-(--inv-accent-primary) uppercase">
                01 — Details
              </h3>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div className="space-y-1.5">
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
                        <SelectTrigger
                          id="clientId"
                          className="inv-input-focus h-12 rounded-[10px] border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-[var(--inv-text-primary)]"
                        >
                          <span
                            className={cn(
                              "font-dm-mono block flex-1 truncate pr-2 text-left text-sm",
                              !selectedClientLabel &&
                                "text-[var(--inv-text-muted)]",
                            )}
                          >
                            {selectedClientLabel || "Client * (required)"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="w-(--anchor-width) max-w-(--anchor-width) border-[var(--inv-divider)] bg-[var(--inv-modal-section)] shadow-xl">
                          {clients.length === 0 ? (
                            <SelectItem value="_none" disabled>
                              No clients found
                            </SelectItem>
                          ) : (
                            clients.map((c) => {
                              const label =
                                c.companyName ??
                                c.contactName ??
                                "Unnamed Client";
                              return (
                                <SelectItem
                                  key={c.id}
                                  value={c.id}
                                  className="focus:bg-[var(--inv-input-bg)]"
                                >
                                  <span className="font-dm-mono block truncate text-sm">
                                    {`${label} (${c.email})`}
                                  </span>
                                </SelectItem>
                              );
                            })
                          )}
                          <div className="mt-1 border-t border-[var(--inv-divider)] p-1">
                            <button className="font-dm-mono w-full rounded-sm px-2 py-1.5 text-left text-sm text-(--inv-accent-primary) transition-colors hover:bg-[var(--inv-accent-primary)]/10">
                              Add new client →
                            </button>
                          </div>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.clientId?.message} />
                </div>

                <div className="space-y-1.5">
                  <Controller
                    control={control}
                    name="projectId"
                    render={({ field }) => (
                      <Select
                        disabled={!watchedClientId}
                        onValueChange={(value) =>
                          field.onChange(value === "__none" ? "" : value)
                        }
                        value={field.value || "__none"}
                      >
                        <SelectTrigger
                          id="projectId"
                          className="inv-input-focus h-12 rounded-[10px] border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-[var(--inv-text-primary)] disabled:opacity-50"
                        >
                          <span
                            className={cn(
                              "font-dm-mono block flex-1 truncate pr-2 text-left text-sm",
                              !selectedProjectLabel &&
                                "text-[var(--inv-text-muted)]",
                            )}
                          >
                            {selectedProjectLabel || "Select project"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="w-(--anchor-width) max-w-(--anchor-width) border-[var(--inv-divider)] bg-[var(--inv-modal-section)] shadow-xl">
                          <SelectItem
                            value="__none"
                            className="font-dm-mono text-sm"
                          >
                            No project
                          </SelectItem>
                          {availableProjects.map((project) => (
                            <SelectItem
                              key={project.id}
                              value={project.id}
                              className="font-dm-mono text-sm"
                            >
                              <span className="block truncate">
                                {project.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.projectId?.message} />
                </div>

                <div className="space-y-1.5">
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          id="currency"
                          className="inv-input-focus font-dm-mono h-12 rounded-[10px] border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="font-dm-mono border-[var(--inv-divider)] bg-[var(--inv-modal-section)] text-sm shadow-xl">
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c === "USD"
                                ? "🇺🇸 USD"
                                : c === "EUR"
                                  ? "🇪🇺 EUR"
                                  : c === "GBP"
                                    ? "🇬🇧 GBP"
                                    : c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.currency?.message} />
                </div>

                <div className="space-y-1.5">
                  <Controller
                    control={control}
                    name="dueDate"
                    render={({ field }) => {
                      const dateValue = field.value
                        ? new Date(field.value)
                        : undefined;
                      return (
                        <Popover
                          open={dueDateOpen}
                          onOpenChange={setDueDateOpen}
                        >
                          <PopoverTrigger
                            id="dueDate"
                            className={cn(
                              "inv-input-focus font-dm-mono flex h-12 w-full items-center rounded-[10px] border border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] px-3 text-sm text-[var(--inv-text-primary)] transition-all",
                              !dateValue && "text-[var(--inv-text-muted)]",
                            )}
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 opacity-70" />
                            {dateValue
                              ? format(dateValue, "MMM d, yyyy")
                              : "Due Date"}
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto border-[var(--inv-divider)] bg-[var(--inv-modal-section)] p-0 shadow-xl"
                            align="start"
                          >
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
                            <div className="flex justify-center gap-2 border-t border-[var(--inv-divider)] p-2">
                              {[15, 30, 60].map((days) => (
                                <button
                                  key={days}
                                  type="button"
                                  className="font-dm-mono rounded-full border border-[var(--inv-divider)] bg-[var(--inv-input-bg)] px-2 py-1 text-[10px] text-[var(--inv-text-primary)] transition-colors hover:border-[var(--inv-accent-primary)] hover:text-(--inv-accent-primary)"
                                  onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + days);
                                    field.onChange(format(d, "yyyy-MM-dd"));
                                    setDueDateOpen(false);
                                  }}
                                >
                                  Net {days}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                  <FieldError message={errors.dueDate?.message} />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Controller
                    control={control}
                    name="taxRateBasisPoints"
                    render={({ field }) => (
                      <div className="relative w-full">
                        <Input
                          id="taxRate"
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          placeholder="Tax Rate"
                          className="inv-input-focus no-spinners font-dm-mono h-12 w-full rounded-[10px] border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] pr-8 pl-3 text-right text-sm text-[var(--inv-text-primary)]"
                          value={
                            !field.value || field.value === 0
                              ? ""
                              : (Number(field.value) / 100).toString()
                          }
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value);
                            field.onChange(
                              isNaN(pct) ? 0 : Math.round(pct * 100),
                            );
                          }}
                        />
                        <span className="font-dm-mono absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--inv-text-muted)]">
                          %
                        </span>
                      </div>
                    )}
                  />
                  <FieldError message={errors.taxRateBasisPoints?.message} />
                </div>
              </div>
            </section>

            {/* SECTION 2 */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-dm-mono text-[11px] tracking-[0.10em] text-(--inv-accent-primary) uppercase">
                  02 — Line Items
                </h3>
                <span className="font-dm-mono text-xs text-[var(--inv-text-muted)]">
                  {fields.length} {fields.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="font-dm-mono hidden grid-cols-[16px_minmax(0,1fr)_90px_110px_100px_32px] gap-3 border-b border-[var(--inv-divider)] px-3 pb-2 text-[10px] tracking-wide text-[var(--inv-text-muted)] uppercase sm:grid">
                <span />
                <span>Description</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Unit Price</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              <div className="mt-3 space-y-3">
                {fields.map((field, idx) => {
                  const qty = Number(watchedItems?.[idx]?.quantity) || 0;
                  const price =
                    Number(watchedItems?.[idx]?.unitPriceCents) || 0;
                  const lineTotal = Math.round(qty * price);

                  return (
                    <div
                      key={field.id}
                      className="group animate-inv-slide-down flex flex-col gap-3 rounded-[10px] border border-[var(--inv-divider)]/50 bg-[var(--inv-modal-section)] p-3 sm:grid sm:grid-cols-[16px_minmax(0,1fr)_90px_110px_100px_32px] sm:items-start"
                    >
                      {/* Drag Handle (Desktop) */}
                      <div className="hidden h-10 w-4 cursor-grab items-center justify-center text-[var(--inv-text-muted)] opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                        ⠿
                      </div>

                      {/* Description with Autocomplete */}
                      <div className="relative">
                        <Label className="font-dm-mono mb-1 text-[10px] text-[var(--inv-text-muted)] uppercase sm:hidden">
                          Description
                        </Label>
                        <Input
                          placeholder="Service or item description"
                          {...register(`items.${idx}.description`)}
                          className="inv-input-focus font-dm-mono h-10 rounded-lg border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
                          list={`desc-history-${idx}`}
                          autoComplete="off"
                        />
                        <datalist id={`desc-history-${idx}`}>
                          {history.map((h, i) => (
                            <option key={i} value={h.desc} />
                          ))}
                        </datalist>
                        <FieldError
                          message={errors.items?.[idx]?.description?.message}
                        />
                      </div>

                      {/* Qty with Custom Stepper */}
                      <div>
                        <Label className="font-dm-mono mb-1 text-[10px] text-[var(--inv-text-muted)] uppercase sm:hidden">
                          Quantity
                        </Label>
                        <Controller
                          control={control}
                          name={`items.${idx}.quantity`}
                          render={({ field: f }) => (
                            <div className="inv-input-focus flex h-10 items-center rounded-lg border border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] p-1 focus-within:border-[var(--inv-input-border-focus)]">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="flex h-full w-5 items-center justify-center rounded-[6px] text-(--inv-text-secondary)"
                                onClick={() =>
                                  f.onChange(Math.max(1, (f.value || 0) - 1))
                                }
                              >
                                −
                              </Button>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="font-dm-mono h-full w-full min-w-0 flex-1 appearance-none border-none bg-transparent p-0 text-center text-sm text-[var(--inv-text-primary)] shadow-none outline-none focus:ring-0 focus:outline-none"
                                value={f.value === 0 ? "" : f.value}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  f.onChange(isNaN(val) ? 0 : val);
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="flex h-full w-5 items-center justify-center rounded-[6px] text-(--inv-text-secondary)"
                                onClick={() => f.onChange((f.value || 0) + 1)}
                              >
                                +
                              </Button>
                            </div>
                          )}
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        <Label className="font-dm-mono mb-1 text-[10px] text-[var(--inv-text-muted)] uppercase sm:hidden">
                          Unit Price
                        </Label>
                        <Controller
                          control={control}
                          name={`items.${idx}.unitPriceCents`}
                          render={({ field: f }) => (
                            <div className="relative">
                              <span className="font-dm-mono absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--inv-text-muted)]">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="inv-input-focus no-spinners font-dm-mono h-10 rounded-lg border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] pl-7 text-right text-sm text-[var(--inv-text-primary)]"
                                value={
                                  f.value === 0
                                    ? ""
                                    : (f.value / 100).toString()
                                }
                                onChange={(e) => {
                                  const dollars = parseFloat(e.target.value);
                                  f.onChange(
                                    isNaN(dollars)
                                      ? 0
                                      : Math.round(dollars * 100),
                                  );
                                }}
                              />
                            </div>
                          )}
                        />
                      </div>

                      {/* Total */}
                      <div className="flex h-10 items-center justify-between px-2 sm:justify-end sm:px-0">
                        <Label className="font-dm-mono mb-1 text-[10px] text-[var(--inv-text-muted)] uppercase sm:hidden">
                          Total
                        </Label>
                        <span
                          className="font-barlow-condensed animate-inv-scale-bounce text-lg text-[var(--inv-text-primary)]"
                          key={lineTotal}
                        >
                          {formatCents(lineTotal, watchedCurrency)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <div className="mt-2 flex h-10 items-center justify-center sm:mt-0 sm:w-8">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--inv-text-muted)] transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 sm:opacity-0"
                          onClick={() => remove(idx)}
                          disabled={fields.length === 1}
                          title="Remove item"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {fields.length < 50 && (
                <button
                  type="button"
                  onClick={() => append({ ...DEFAULT_ITEM })}
                  className="font-dm-mono mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-[var(--inv-accent-primary)]/30 text-sm text-(--inv-accent-primary) transition-all hover:border-[var(--inv-accent-primary)] hover:bg-[var(--inv-accent-subtle)]"
                >
                  <PlusIcon className="h-4 w-4 stroke-[1.5px]" />
                  Add Line Item
                </button>
              )}
            </section>

            {/* SECTION 3 */}
            <section>
              <div
                className="group flex cursor-pointer items-center justify-between"
                onClick={() => setNotesExpanded(!notesExpanded)}
              >
                <h3 className="font-dm-mono text-[11px] tracking-[0.10em] text-(--inv-accent-primary) uppercase transition-opacity group-hover:opacity-80">
                  03 — Notes
                </h3>
                <div className="flex items-center gap-2 text-[var(--inv-text-muted)]">
                  {!notesExpanded && (
                    <span className="font-dm-mono max-w-[200px] truncate text-xs">
                      {watch("notes") || "Optional payment terms..."}
                    </span>
                  )}
                  {notesExpanded ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "overflow-hidden transition-[max-height] duration-200 ease-out",
                  notesExpanded ? "mt-4 max-h-[300px]" : "max-h-0",
                )}
              >
                <div className="relative">
                  <Textarea
                    placeholder="Add payment terms, references, or delivery details..."
                    maxLength={500}
                    rows={5}
                    className="inv-input-focus font-dm-mono min-h-[120px] resize-y rounded-[10px] border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] p-4 pb-8 text-sm text-[var(--inv-text-primary)]"
                    {...register("notes")}
                  />
                  <span className="font-dm-mono absolute right-4 bottom-3 text-[11px] text-[var(--inv-text-muted)]">
                    {watch("notes")?.length || 0} / 500
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* SECTION 4: SUMMARY (Sticky Bottom) */}
          <div className="absolute right-0 bottom-0 left-0 z-10 border-t border-[var(--inv-divider)] bg-[var(--inv-modal-section)] p-6">
            <div className="flex justify-end">
              <div className="w-[60%] space-y-2">
                <div className="font-dm-mono flex items-center justify-between text-sm">
                  <span className="text-[var(--inv-text-primary)]">
                    Subtotal
                  </span>
                  <span className="text-[var(--inv-text-primary)]">
                    {formatCents(totals.subtotal, watchedCurrency)}
                  </span>
                </div>
                <div className="font-dm-mono flex items-center justify-between text-sm text-[var(--inv-text-muted)]">
                  <span>Tax ({taxPercent}%)</span>
                  <span>{formatCents(totals.tax, watchedCurrency)}</span>
                </div>
                {/* Optional Discount Hook */}
                <div className="my-2 flex items-end justify-between border-t border-[var(--inv-divider)] pt-2">
                  <span className="font-dm-mono text-sm text-[var(--inv-text-primary)]">
                    Total
                  </span>
                  <span
                    className="font-barlow-condensed animate-inv-scale-bounce text-[32px] leading-none font-bold text-[var(--inv-text-primary)]"
                    key={totals.total}
                  >
                    {formatCents(totals.total, watchedCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-between border-t border-[var(--inv-divider)] bg-[var(--inv-modal-bg)] p-4 px-6">
          <button
            type="button"
            className="font-dm-mono text-sm text-[var(--inv-text-muted)] transition-colors hover:text-[var(--inv-text-primary)]"
            onClick={() => gooeyToast.info("Draft saved locally (demo)")}
          >
            Save as Draft
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-full border border-[var(--inv-input-border)] px-6 text-sm font-medium text-[var(--inv-text-muted)] transition-colors hover:bg-[var(--inv-text-primary)]/5"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="invoice-form"
              disabled={isPending}
              className="group flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-full bg-[var(--inv-accent-primary)] px-6 text-sm font-medium text-white transition-all hover:bg-[var(--inv-accent-hover)] disabled:opacity-70 dark:shadow-[0_0_15px_rgba(79,127,255,0.4)]"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {invoiceId ? "Update Invoice" : "Create Invoice"}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-[3px]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW PANE */}
      {previewOpen && (
        <div className="animate-in fade-in slide-in-from-left-4 hidden w-1/2 min-w-0 border-l border-[var(--inv-divider)] bg-[var(--inv-modal-section)] duration-300 md:block">
          <InvoicePreview data={formValues} clients={clients} />
        </div>
      )}
    </>
  );
}
