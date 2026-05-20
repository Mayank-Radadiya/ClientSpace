/**
 * Sample data for the Project Detail v3 redesign.
 * Used as fallback/demo data when real project data is sparse.
 */

import type { Milestone, Invoice, Asset } from "../../types";

/* ── Project ──────────────────────────────────────────────── */
export const SAMPLE_PROJECT = {
  id: "proj-flowx-pro",
  org_id: "org-1",
  client_id: "client-apple",
  name: "FlowX Pro",
  description: "End-to-end SaaS platform redesign and API modernization",
  status: "in_progress" as const,
  priority: "high" as const,
  start_date: "2026-04-30T00:00:00Z",
  deadline: "2026-05-13T00:00:00Z",
  budget: 2000000, // $20,000 in cents
  tags: ["React", "Node.js", "API"],
  created_at: "2026-04-30T10:00:00Z",
  updated_at: "2026-05-18T14:30:00Z",
  client: {
    company_name: "Apple",
    contact_name: "Sarah Chen",
    email: "sarah@apple.com",
  },
};

/* ── Team ─────────────────────────────────────────────────── */
export const SAMPLE_MEMBERS = [
  {
    user_id: "u1",
    project_id: "proj-flowx-pro",
    assigned_at: "2026-04-30T10:00:00Z",
    user: { id: "u1", name: "Alex Rivera", email: "alex@team.com", avatar_url: null },
    role: "owner" as const,
  },
  {
    user_id: "u2",
    project_id: "proj-flowx-pro",
    assigned_at: "2026-05-01T09:00:00Z",
    user: { id: "u2", name: "Jordan Lee", email: "jordan@team.com", avatar_url: null },
    role: "admin" as const,
  },
  {
    user_id: "u3",
    project_id: "proj-flowx-pro",
    assigned_at: "2026-05-02T11:00:00Z",
    user: { id: "u3", name: "Sam Patel", email: "sam@team.com", avatar_url: null },
    role: "member" as const,
  },
];

/* ── Milestones ───────────────────────────────────────────── */
export const SAMPLE_MILESTONES: Milestone[] = [
  // Done
  {
    id: "ms-1",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    title: "Project Kickoff",
    description: "Initial kickoff meeting with stakeholders and team alignment",
    due_date: "2026-04-30T00:00:00Z",
    completed: true,
    completed_at: "2026-04-30T16:00:00Z",
    order: 0,
    priority: "high",
    status: "done",
    assignee: { id: "u1", name: "Alex Rivera", avatar_url: null },
  },
  {
    id: "ms-2",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    title: "Requirements Doc",
    description: "Complete functional and technical requirements documentation",
    due_date: "2026-05-05T00:00:00Z",
    completed: true,
    completed_at: "2026-05-05T12:00:00Z",
    order: 1,
    priority: "medium",
    status: "done",
    assignee: { id: "u2", name: "Jordan Lee", avatar_url: null },
  },
  // In Progress
  {
    id: "ms-3",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    title: "Design System",
    description: "Build component library with Figma tokens and Storybook docs",
    due_date: "2026-05-25T00:00:00Z",
    completed: false,
    completed_at: null,
    order: 2,
    priority: "high",
    status: "in_progress",
    assignee: { id: "u3", name: "Sam Patel", avatar_url: null },
  },
  {
    id: "ms-4",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    title: "Backend Setup",
    description: "API scaffolding, database schema, authentication layer",
    due_date: "2026-05-20T00:00:00Z",
    completed: false,
    completed_at: null,
    order: 3,
    priority: "high",
    status: "in_progress",
    assignee: { id: "u1", name: "Alex Rivera", avatar_url: null },
  },
  // To Do
  {
    id: "ms-5",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    title: "API Integration",
    description: "Connect frontend to backend APIs with error handling",
    due_date: "2026-06-01T00:00:00Z",
    completed: false,
    completed_at: null,
    order: 4,
    priority: "medium",
    status: "todo",
    assignee: { id: "u2", name: "Jordan Lee", avatar_url: null },
  },
  {
    id: "ms-6",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    title: "Testing & QA",
    description: "End-to-end testing, accessibility audit, performance benchmarks",
    due_date: "2026-06-10T00:00:00Z",
    completed: false,
    completed_at: null,
    order: 5,
    priority: "low",
    status: "todo",
    assignee: { id: "u3", name: "Sam Patel", avatar_url: null },
  },
];

/* ── Files ────────────────────────────────────────────────── */
export const SAMPLE_FILES: Asset[] = [
  {
    id: "file-1",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    folder_id: null,
    name: "Contract.pdf",
    type: "application/pdf",
    created_at: "2026-04-30T10:30:00Z",
    updated_at: "2026-04-30T10:30:00Z",
    size: 250880, // 245KB
  },
  {
    id: "file-2",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    folder_id: null,
    name: "Design Mockups.fig",
    type: "application/figma",
    created_at: "2026-05-08T15:00:00Z",
    updated_at: "2026-05-12T09:20:00Z",
    size: 12582912, // 12MB
  },
  {
    id: "file-3",
    org_id: "org-1",
    project_id: "proj-flowx-pro",
    folder_id: null,
    name: "API Specs.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    created_at: "2026-05-10T11:00:00Z",
    updated_at: "2026-05-10T11:00:00Z",
    size: 91136, // 89KB
  },
];

/* ── Invoices ─────────────────────────────────────────────── */
export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "inv-1001",
    org_id: "org-1",
    client_id: "client-apple",
    project_id: "proj-flowx-pro",
    number: 1001,
    status: "paid",
    due_date: "2026-05-15T00:00:00Z",
    currency: "USD",
    amount_cents: 500000, // $5,000
    pdf_url: null,
    created_at: "2026-05-01T10:00:00Z",
  },
  {
    id: "inv-1002",
    org_id: "org-1",
    client_id: "client-apple",
    project_id: "proj-flowx-pro",
    number: 1002,
    status: "sent",
    due_date: "2026-05-25T00:00:00Z",
    currency: "USD",
    amount_cents: 350000, // $3,500
    pdf_url: null,
    created_at: "2026-05-10T14:00:00Z",
  },
];

/* ── Activity Log ─────────────────────────────────────────── */
export interface ActivityEntry {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  timestamp: string;
  category: "project" | "milestone" | "invoice" | "file" | "status";
  color: "blue" | "green" | "amber" | "red" | "gray";
}

export const SAMPLE_ACTIVITY: ActivityEntry[] = [
  {
    id: "act-1",
    eventType: "project.created",
    description: "Project created",
    actor: "Alex Rivera",
    timestamp: "2026-04-30T10:00:00Z",
    category: "project",
    color: "blue",
  },
  {
    id: "act-2",
    eventType: "status.changed",
    description: "Status changed to In Progress",
    actor: "Alex Rivera",
    timestamp: "2026-04-30T10:05:00Z",
    category: "status",
    color: "blue",
  },
  {
    id: "act-3",
    eventType: "milestone.added",
    description: 'Milestone "Design Mockups" added',
    actor: "Jordan Lee",
    timestamp: "2026-05-02T09:00:00Z",
    category: "milestone",
    color: "amber",
  },
  {
    id: "act-4",
    eventType: "milestone.completed",
    description: 'Milestone "Project Kickoff" marked Done',
    actor: "Alex Rivera",
    timestamp: "2026-04-30T16:00:00Z",
    category: "milestone",
    color: "green",
  },
  {
    id: "act-5",
    eventType: "invoice.created",
    description: "Invoice INV-1001 created — $5,000",
    actor: "Alex Rivera",
    timestamp: "2026-05-01T10:00:00Z",
    category: "invoice",
    color: "blue",
  },
  {
    id: "act-6",
    eventType: "invoice.paid",
    description: "Invoice INV-1001 paid",
    actor: "System",
    timestamp: "2026-05-14T08:00:00Z",
    category: "invoice",
    color: "green",
  },
  {
    id: "act-7",
    eventType: "project.overdue",
    description: "Project is 7 days overdue",
    actor: "System",
    timestamp: "2026-05-20T00:00:00Z",
    category: "status",
    color: "red",
  },
  {
    id: "act-8",
    eventType: "file.uploaded",
    description: 'File "Contract.pdf" uploaded',
    actor: "Sam Patel",
    timestamp: "2026-04-30T10:30:00Z",
    category: "file",
    color: "gray",
  },
];
