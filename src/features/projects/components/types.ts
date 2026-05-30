// src/features/projects/components/types.ts
// v4 type definitions — isolated from v3 project-detail/types.ts

export type OrgRole = "owner" | "admin" | "member" | "client";

export type MilestoneStatus = "todo" | "in_progress" | "done";
export type MilestonePriority = "low" | "medium" | "high" | "urgent";
export type MilestoneView = "board" | "timeline";
export type PreviewMode = "guest" | null;
export type RiskLevel = "high" | "medium" | "low";
export type SaveStatus = "idle" | "saving" | "saved";

/** Sub-task stored in milestones.sub_tasks JSONB column. */
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface MilestoneAssignee {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Milestone {
  id: string;
  orgId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  priority: MilestonePriority;
  startDate: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  assigneeId: string | null;
  assignee?: MilestoneAssignee | null;
  subTasks: SubTask[];
  order: number;
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  assignedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  role?: OrgRole;
}

export interface Asset {
  id: string;
  orgId: string;
  projectId: string;
  folderId: string | null;
  name: string;
  type: string; // MIME type
  approvalStatus: "pending_review" | "approved" | "changes_requested";
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  versions?: AssetVersion[];
}

export interface AssetVersion {
  id: string;
  assetId: string;
  versionNumber: number;
  storagePath: string;
  size: number;
  uploadedBy: string;
  uploadedByUser?: { name: string; avatarUrl: string | null };
  createdAt: string;
}

export interface Invoice {
  id: string;
  orgId: string;
  clientId: string;
  projectId: string | null;
  number: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string | null;
  currency: string;
  amountCents: number;
  pdfUrl: string | null;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  timestamp: string;
  category: "project" | "milestone" | "file" | "invoice" | "comment";
  color: "blue" | "green" | "red" | "amber";
}

export interface ProjectNotes {
  projectId: string;
  content: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  orgId: string;
  clientId: string;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "review" | "completed" | "on_hold" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  startDate: string | null;
  deadline: string;
  budget: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  client?: {
    companyName: string | null;
    contactName: string | null;
    email: string;
  };
}
