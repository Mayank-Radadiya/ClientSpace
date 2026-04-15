export type OrgRole = "owner" | "admin" | "member" | "client";

export interface Project {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  description: string;
  status:
    | "not_started"
    | "in_progress"
    | "review"
    | "completed"
    | "on_hold"
    | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  start_date: string | null;
  deadline: string;
  budget: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  client?: {
    company_name: string | null;
    contact_name: string | null;
    email: string;
  };
}

export interface Milestone {
  id: string;
  org_id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  order: number;
  priority?: "low" | "medium" | "high";
  status?: "todo" | "in_progress" | "done";
  assignee?: { id: string; name: string; avatar_url: string | null };
}

export interface ProjectMember {
  user_id: string;
  project_id: string;
  assigned_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  role?: OrgRole; // derived from org_memberships
}

export interface Folder {
  id: string;
  org_id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
}

export interface Asset {
  id: string;
  org_id: string;
  project_id: string;
  folder_id: string | null;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  size?: number; // from file_versions
}

export interface Comment {
  id: string;
  org_id: string;
  project_id: string;
  asset_id: string | null;
  author_id: string;
  body: string;
  parent_id: string | null;
  hidden: boolean;
  metadata: any | null; // e.g., { internal: boolean }
  created_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface Invoice {
  id: string;
  org_id: string;
  client_id: string;
  project_id: string | null;
  number: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string | null;
  currency: string;
  amount_cents: number;
  pdf_url: string | null;
  created_at: string;
}

export type ActiveSection = "milestones" | "files" | "invoices" | "activity";
