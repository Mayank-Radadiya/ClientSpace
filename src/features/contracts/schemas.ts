// src/features/contracts/schemas.ts
// Zod schemas for all contracts tRPC procedures.

import { z } from "zod";

export const CONTRACT_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "signed",
  "declined",
  "expired",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

// ─── Input schemas ────────────────────────────────────────────────────────────

export const contractIdSchema = z.object({
  contractId: z.string().uuid("Invalid contract ID"),
});

export const createContractSchema = z.object({
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid("Client is required"),
  title: z.string().min(1, "Title is required").max(255),
  bodyHtml: z.string().default(""),
});

export const updateContractSchema = z.object({
  contractId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  bodyHtml: z.string().optional(),
});

export const listContractsSchema = z.object({
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
});

export const sendContractSchema = z.object({
  contractId: z.string().uuid(),
});

export const voidContractSchema = z.object({
  contractId: z.string().uuid(),
});

// ─── Placeholder system ───────────────────────────────────────────────────────

export const PLACEHOLDERS = [
  { key: "client_name",     label: "Client Name" },
  { key: "project_name",   label: "Project Name" },
  { key: "contract_value", label: "Contract Value" },
  { key: "start_date",     label: "Start Date" },
  { key: "agency_name",    label: "Agency Name" },
] as const;

export type PlaceholderKey = (typeof PLACEHOLDERS)[number]["key"];

/** Resolve all known {{placeholders}} in HTML with actual values. */
export function resolvePlaceholders(
  html: string,
  data: Partial<Record<PlaceholderKey, string>>,
): string {
  let resolved = html;
  for (const { key } of PLACEHOLDERS) {
    const value = data[key] ?? `{{${key}}}`;
    // Match both raw {{key}} and the styled chip variant
    resolved = resolved.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      `<strong>${value}</strong>`,
    );
    resolved = resolved.replace(
      new RegExp(`<span[^>]*data-placeholder="${key}"[^>]*>.*?</span>`, "g"),
      `<strong>${value}</strong>`,
    );
  }
  return resolved;
}

/** Strip HTML to plain text (server-side safe — no DOM dependency). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<hr\s*\/?>/gi, "\n─────────────────────\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
