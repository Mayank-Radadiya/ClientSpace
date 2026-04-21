export const CLIENT_DISPLAY_STATUSES = [
  "active",
  "inactive",
  "pending",
  "archived",
] as const;

export type ClientDisplayStatus = (typeof CLIENT_DISPLAY_STATUSES)[number];

export const CLIENT_SORT_OPTIONS = [
  "name_asc",
  "name_desc",
  "last_activity_desc",
  "last_activity_asc",
  "revenue_desc",
  "outstanding_desc",
] as const;

export type ClientSortOption = (typeof CLIENT_SORT_OPTIONS)[number];

export type ClientListItem = {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string;
  dbStatus: "active" | "revoked";
  displayStatus: ClientDisplayStatus;
  invitedAt: string | null;
  activeProjectCount: number;
  outstandingAmountCents: number;
  totalRevenueCents: number;
  pendingInvite: boolean;
  lastActivityAt: string | null;
};

export type ClientBootstrapStats = {
  totalClients: number;
  activeClients: number;
  activeProjects: number;
  outstandingInvoicesCents: number;
};

export type ClientProjectItem = {
  id: string;
  name: string;
  status:
    | "not_started"
    | "in_progress"
    | "review"
    | "completed"
    | "on_hold"
    | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  updatedAt: string;
};

export type ClientInvoiceItem = {
  id: string;
  number: number;
  status: "draft" | "sent" | "paid" | "overdue";
  amountCents: number;
  dueDate: string | null;
  updatedAt: string;
};

export type ClientActivityItem = {
  id: string;
  eventType: string;
  createdAt: string;
  metadata: unknown;
};
