import type { ClientDisplayStatus } from "../client.types";

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function statusLabel(status: ClientDisplayStatus): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  if (status === "pending") return "Pending";
  return "Archived";
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "No activity";
  const ms = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (ms < day) return "Today";
  if (ms < day * 2) return "Yesterday";
  const days = Math.floor(ms / day);
  return `${days}d ago`;
}
