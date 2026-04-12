// src/db/schema.ts
// All Drizzle table schemas, enums, and indexes — single source of truth.
// Architectural constraint: .enableRLS() on ALL tables for multi-tenant isolation.

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  date,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── Discriminated Union for activity_logs.metadata (PRD §10.2) ───────────────
// Add new event shapes here as the product grows. All consumers typecast via this union.
export type ActivityEventMetadata =
  | { event: "project.created"; projectName: string }
  | { event: "project.status_changed"; from: string; to: string }
  | { event: "asset.uploaded"; assetName: string; versionNumber: number }
  | { event: "asset.approved"; assetName: string; actorName: string }
  | { event: "asset.changes_requested"; assetName: string; actorName: string }
  | { event: "invoice.sent"; invoiceNumber: number; amountCents: number }
  | { event: "invoice.paid"; invoiceNumber: number }
  | { event: "comment.created"; bodySnippet: string; assetId?: string }
  | { event: "client.invited"; email: string }
  | { event: "milestone.completed"; title: string };

// ─── Enums ────────────────────────────────────────────────────────────────────

export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "member",
  "client",
]);
export const projectStatusEnum = pgEnum("project_status", [
  "not_started",
  "in_progress",
  "review",
  "completed",
  "on_hold",
  "archived",
]);
export const projectPriorityEnum = pgEnum("project_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
]);
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending_review",
  "approved",
  "changes_requested",
]);
export const clientStatusEnum = pgEnum("client_status", ["active", "revoked"]);
export const invitationTypeEnum = pgEnum("invitation_type", [
  "member",
  "client",
  "signer",
]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "in_use",
  "accepted",
  "expired",
  "revoked",
]);
export const planEnum = pgEnum("plan", [
  "starter",
  "pro",
  "growth",
  "business",
]);
export const currencyEnum = pgEnum("currency", [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
]);
export const shareEntityTypeEnum = pgEnum("share_entity_type", [
  "project",
  "asset",
  "file_group",
]);

// ─── Core Tables ──────────────────────────────────────────────────────────────

// Users (Profile Table)
// Supabase Auth owns passwords. This table mirrors auth.users as a public profile.
// The id column MUST match the Supabase Auth UID. Never store password_hash here.
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Matches auth.users.id — NOT defaultRandom()
  email: text("email").notNull().unique(), // Synced from auth.users via trigger
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

// Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  accentColor: text("accent_color").default("#3b82f6"),
  plan: planEnum("plan").default("starter").notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id)
    .notNull(),
  nextInvoiceNumber: integer("next_invoice_number").default(1001).notNull(),
  stripeCustomerId: text("stripe_customer_id"), // Phase 2
  customDomain: text("custom_domain"), // Phase 2
  whatsappEnabled: boolean("whatsapp_enabled").default(false), // Phase 2
  aiSummariesOptIn: boolean("ai_summaries_opt_in").default(false), // Phase 2
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

// Org Memberships
export const orgMemberships = pgTable(
  "org_memberships",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    role: orgRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.orgId] })],
).enableRLS();

// Clients
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").references(() => users.id), // Nullable: Admin creates client before signup
  companyName: text("company_name"),
  contactName: text("contact_name"), // Primary contact person for this client
  email: text("email").notNull(), // Invite target email
  invitedAt: timestamp("invited_at", { withTimezone: true }).defaultNow(),
  status: clientStatusEnum("status").default("active").notNull(),
}).enableRLS();

// Projects
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id)
      .notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: projectStatusEnum("status").default("not_started").notNull(),
    priority: projectPriorityEnum("priority").default("medium").notNull(),
    startDate: date("start_date"),
    deadline: date("deadline").notNull(),
    budget: integer("budget"), // Display only, cents
    tags: text("tags").array().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("projects_org_client_idx").on(t.orgId, t.clientId), // Dashboard list
    index("projects_org_created_idx").on(t.orgId, t.createdAt), // getAll sort hot path
    index("projects_org_status_priority_created_idx").on(
      t.orgId,
      t.status,
      t.priority,
      t.createdAt,
    ), // Filtered getAll path
  ],
).enableRLS();

// Milestones
export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // orgId de-normalized for O(1) RLS — avoids JOIN to projects on every query.
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    dueDate: date("due_date"),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    order: integer("order").notNull(),
  },
  (t) => [
    index("milestones_org_project_idx").on(t.orgId, t.projectId), // Composite per PRD §11
  ],
).enableRLS();

// Project Members
export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
).enableRLS();

// Folders
export const folders = pgTable(
  "folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // orgId de-normalized for O(1) RLS.
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    parentId: uuid("parent_id"), // Self-referencing FK
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("folders_org_project_idx").on(t.orgId, t.projectId)],
).enableRLS();

// Assets
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // orgId de-normalized for O(1) RLS — avoids cascading JOINs on every query.
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    folderId: uuid("folder_id").references(() => folders.id),
    name: text("name").notNull(),
    type: text("type").notNull(), // MIME type string (e.g. "image/png") — text, not enum (100+ types)
    currentVersionId: uuid("current_version_id"), // Updated by DB trigger
    approvalStatus: approvalStatusEnum("approval_status")
      .default("pending_review")
      .notNull(),
    // Inngest cron checks this column to auto-approve files with no action taken.
    // null means auto-approve is disabled for this asset.
    autoApproveAt: timestamp("auto_approve_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft delete
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("assets_org_project_idx").on(t.orgId, t.projectId),
    index("assets_project_folder_deleted_updated_idx").on(
      t.projectId,
      t.folderId,
      t.deletedAt,
      t.updatedAt,
    ),
    index("assets_auto_approve_idx").on(t.autoApproveAt), // Inngest cron hot path
  ],
).enableRLS();

// File Versions
export const fileVersions = pgTable(
  "file_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // orgId de-normalized for O(1) RLS.
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    assetId: uuid("asset_id")
      .references(() => assets.id, { onDelete: "cascade" })
      .notNull(),
    versionNumber: integer("version_number").notNull(),
    storagePath: text("storage_path").notNull(),
    size: integer("size").notNull(), // Bytes
    uploadedBy: uuid("uploaded_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("file_versions_org_asset_idx").on(t.orgId, t.assetId)],
).enableRLS();

// Comments
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // orgId de-normalized for O(1) RLS.
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    // onDelete: "cascade" — deleting an asset must remove its file comments.
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "cascade",
    }), // Null = project-level comment
    authorId: uuid("author_id")
      .references(() => users.id)
      .notNull(),
    body: text("body").notNull(),
    parentId: uuid("parent_id"), // Threaded replies (max 2 levels)
    hidden: boolean("hidden").default(false).notNull(),
    metadata: jsonb("metadata"), // Annotations: { x, y, width, height }
    editedAt: timestamp("edited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("comments_org_project_idx").on(t.orgId, t.projectId), // Composite per PRD §11
    index("comments_asset_idx").on(t.assetId),
  ],
).enableRLS();

// Invoices
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id)
      .notNull(),
    projectId: uuid("project_id").references(() => projects.id),
    number: integer("number").notNull(), // Auto-generated via atomic UPDATE...RETURNING
    status: invoiceStatusEnum("status").default("draft").notNull(),
    dueDate: date("due_date"),
    currency: currencyEnum("currency").default("USD").notNull(),
    amountCents: integer("amount_cents").notNull(),
    taxRateBasisPoints: integer("tax_rate_basis_points").default(0),
    notes: text("notes"),
    paidAt: timestamp("paid_at", { withTimezone: true }), // Set when status → "paid"; used for revenue chart grouping
    pdfUrl: text("pdf_url"), // Cached signed URL after "Send"
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("invoices_org_client_idx").on(t.orgId, t.clientId), // Invoice list
    index("invoices_overdue_idx").on(t.orgId, t.status, t.dueDate), // Overdue cron hot path
  ],
).enableRLS();

// Invoice Line Items
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(), // Fractional hours
  unitPriceCents: integer("unit_price_cents").notNull(),
}).enableRLS();

// Activity Logs
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    actorId: uuid("actor_id")
      .references(() => users.id)
      .notNull(),
    eventType: text("event_type").notNull(),
    // $type enforces the discriminated union at the ORM level (PRD §10.2).
    // Drizzle passes this through as-is at runtime; TypeScript enforces it at compile time.
    metadata: jsonb("metadata").$type<ActivityEventMetadata>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // orgId already first — matches existing composite per PRD §11.
    index("activity_org_project_idx").on(t.orgId, t.projectId),
  ],
).enableRLS();

// Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    read: boolean("read").default(false).notNull(),
    link: text("link"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.read)],
).enableRLS();

// Invitations
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull(),
  type: invitationTypeEnum("type").notNull(),
  tokenHash: text("token_hash").notNull(), // SHA-256 of the raw token — raw token is NEVER stored
  status: invitationStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

// Share Links
export const shareLinks = pgTable(
  "share_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: shareEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    token: text("token").notNull().unique(),
    passwordHash: text("password_hash"), // bcrypt hash — never store cleartext
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("share_entity_idx").on(t.entityId, t.entityType)],
).enableRLS();

// Plan Limits
export const planLimits = pgTable("plan_limits", {
  plan: planEnum("plan").primaryKey(),
  maxProjects: integer("max_projects").notNull(),
  maxClients: integer("max_clients").notNull(),
  maxStorageGb: integer("max_storage_gb").notNull(),
  maxMembers: integer("max_members").notNull(),
});

// ─── Phase 2 Stub Tables ─────────────────────────────────────────────────────
// Included now to prevent destructive migrations later.

// Contracts (E-Signature — Phase 2)
export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  orgId: uuid("org_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  signerId: uuid("signer_id").references(() => users.id),
  status: text("status").default("pending"),
  ipAddress: text("ip_address"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

// CSAT Responses (Phase 2)
export const csatResponses = pgTable("csat_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  score: integer("score").notNull(), // 1-5
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();
