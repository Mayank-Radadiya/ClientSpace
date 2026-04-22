import type { ClientDisplayStatus } from "./client.types";

export const STATUS_STYLES: Record<ClientDisplayStatus, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-muted/50 text-muted-foreground border-border",
  pending: "bg-primary/10 text-primary border-primary/20",
  archived: "bg-red-500/10 text-red-500 border-red-500/20",
};

export const STATUS_DOT: Record<ClientDisplayStatus, string> = {
  active: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]",
  inactive: "bg-muted-foreground",
  pending: "bg-primary shadow-[0_0_6px_rgba(var(--primary),0.5)]",
  archived: "bg-red-500",
};

export const CUBIC_BEZIER = [0.16, 1, 0.3, 1] as const;
