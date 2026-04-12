// src/features/invoices/schemas.ts
// Shared validation schemas, business logic, and formatting utilities for invoices.
// Used on both client (InvoiceBuilder live preview) and server (actions, router).

import { z } from "zod";

// ─── Status & Currency Enums ──────────────────────────────────────────────────

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

export const STATUS_COLORS: Record<
  InvoiceStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  draft: "secondary",
  sent: "default",
  paid: "outline",
  overdue: "destructive",
};

// Valid state machine transitions
export const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent"],
  sent: ["paid"],
  overdue: ["paid"],
  paid: [],
};

export function canTransition(
  current: InvoiceStatus,
  next: InvoiceStatus,
): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

export function getNextStatus(current: InvoiceStatus): InvoiceStatus | null {
  const transitions = VALID_TRANSITIONS[current];
  return transitions.length > 0 ? (transitions[0] ?? null) : null;
}

export const NEXT_STATUS_LABELS: Record<InvoiceStatus, string | null> = {
  draft: "Mark as Sent",
  sent: "Mark as Paid",
  overdue: "Mark as Paid",
  paid: null,
};

// ─── Currency Symbols ─────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
};

// ─── Money Math Utilities ─────────────────────────────────────────────────────

/**
 * Formats an integer cents value to a human-readable currency string.
 * Uses integer arithmetic only — no float division for display.
 *
 * @example formatCents(1050, "USD") → "$10.50"
 */
export function formatCents(cents: number, currency: Currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export interface LineItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface InvoiceTotals {
  subtotal: number; // integer cents
  tax: number; // integer cents
  total: number; // integer cents
}

/**
 * Deterministic invoice totals calculation.
 * Single source of truth — called identically on client (preview) and server (storage).
 * Uses integer arithmetic only to avoid floating-point precision loss.
 *
 * @param items Line items with quantity and unitPriceCents
 * @param taxRateBasisPoints Tax rate in basis points (e.g., 550 = 5.5%)
 * @returns { subtotal, tax, total } — all integer cents
 */
export function calculateTotals(
  items: LineItemInput[],
  taxRateBasisPoints: number,
): InvoiceTotals {
  const subtotal = items.reduce((acc, item) => {
    const lineTotal = Math.round(item.quantity * item.unitPriceCents);
    return acc + lineTotal;
  }, 0);

  const tax = Math.round((subtotal * taxRateBasisPoints) / 10000);
  const total = subtotal + tax;

  return { subtotal, tax, total };
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const invoiceLineItemSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be at most 500 characters"),
  quantity: z
    .number()
    .positive("Quantity must be positive")
    .multipleOf(0.01, "Quantity allows at most 2 decimal places"),
  unitPriceCents: z
    .number()
    .int("Unit price must be a whole number (cents)")
    .positive("Unit price must be positive"),
});

export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;

export const createInvoiceSchema = z
  .object({
    clientId: z.string(),
    projectId: z.string().optional(),
    currency: z.enum(CURRENCIES),
    taxRateBasisPoints: z
      .number()
      .int("Tax rate must be a whole number of basis points")
      .min(0, "Tax rate cannot be negative")
      .max(10000, "Tax rate cannot exceed 100%"),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
    notes: z
      .string()
      .max(1000, "Notes must be at most 1000 characters")
      .optional(),
    items: z
      .array(invoiceLineItemSchema)
      .min(1, "At least one line item is required")
      .max(50, "Maximum 50 line items allowed"),
  })
  .refine(
    (data) => {
      const { total } = calculateTotals(data.items, data.taxRateBasisPoints);
      return total > 0;
    },
    { message: "Invoice total must be greater than zero", path: ["items"] },
  );

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  status: z.enum(["sent", "paid"] as const),
});

export type UpdateInvoiceStatusInput = z.infer<
  typeof updateInvoiceStatusSchema
>;
