// src/db/schema.ts
// All Drizzle table schemas, enums, and indexes — single source of truth.
// Architectural constraint: .enableRLS() on ALL tables for multi-tenant isolation.

import {
  pgTable,
  pgEnum,
  AnyPgColumn,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  real,
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
  | {
      event: "asset.approved";
      assetName: string;
      actorName: string;
      ipAddress?: string;
    }
  | {
      event: "asset.changes_requested";
      assetName: string;
      actorName: string;
      ipAddress?: string;
    }
  | { event: "invoice.sent"; invoiceNumber: number; amountCents: number }
  | { event: "invoice.paid"; invoiceNumber: number }
  | { event: "comment.created"; bodySnippet: string; assetId?: string }
  | { event: "client.invited"; email: string }
  | { event: "milestone.completed"; title: string }
  | { event: "contract.signed"; contractTitle: string; clientName: string };

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
export const clientLifecycleStatusEnum = pgEnum("client_lifecycle_status", [
  "prospect",
  "active",
  "on_hold",
  "churned",
  "archived",
]);
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
export const milestoneStatusEnum = pgEnum("milestone_status", [
  "todo",
  "in_progress",
  "done",
]);
export const milestonePriorityEnum = pgEnum("milestone_priority", [
  "low",
  "medium",
  "high",
  "urgent",
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
  phone: text("phone"),             // E.164 format e.g. +14155552671
  smsOptedIn: boolean("sms_opted_in").default(false).notNull(), // Explicit SMS consent
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

// Organizations
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    // ── White-label branding ───────────────────────────────────────────────────
    logoMarkUrl: text("logo_mark_url"), // Square icon/mark version for favicon and small placements
    accentColor: text("accent_color").default("#3b82f6"), // hex or oklch string
    accentColorDark: text("accent_color_dark"), // Darker hover variant; auto-computed if null
    brandName: text("brand_name"), // Portal display name — falls back to org.name
    faviconUrl: text("favicon_url"), // Custom favicon URL
    poweredByHidden: boolean("powered_by_hidden").default(false).notNull(), // true = enterprise: hides "Powered by ClientSpace"
    // ── Custom email sending domain (Resend) ──────────────────────────────────
    customEmailDomain: text("custom_email_domain"), // e.g. "acmecreative.com"
    customEmailFromName: text("custom_email_from_name"), // e.g. "Acme Creative"
    customEmailVerified: boolean("custom_email_verified").default(false).notNull(), // true once Resend verifies the domain
    customEmailDomainId: text("custom_email_domain_id"), // Resend's domain ID for verify/delete calls
    // ─────────────────────────────────────────────────────────────────────────
    plan: planEnum("plan").default("starter").notNull(),
    ownerId: uuid("owner_id")
      .references(() => users.id)
      .notNull(),
    nextInvoiceNumber: integer("next_invoice_number").default(1001).notNull(),
    stripeCustomerId: text("stripe_customer_id"), // Phase 2
    // ── Custom Domain (White-label portal) ────────────────────────────────────
    // Stored without protocol, lowercase. e.g. "portal.acmecreative.com"
    customDomain: text("custom_domain"),
    // true once Vercel confirms DNS has propagated
    customDomainVerified: boolean("custom_domain_verified").default(false).notNull(),
    // 'none' | 'pending' | 'verifying' | 'active' | 'error'
    customDomainStatus: text("custom_domain_status").default("none").notNull(),
    // Last error message from Vercel API — shown to user in settings
    customDomainError: text("custom_domain_error"),
    // When the domain was first submitted
    customDomainAddedAt: timestamp("custom_domain_added_at", { withTimezone: true }),
    // When DNS was confirmed active
    customDomainVerifiedAt: timestamp("custom_domain_verified_at", { withTimezone: true }),
    // ─────────────────────────────────────────────────────────────────────────
    whatsappEnabled: boolean("whatsapp_enabled").default(false), // Phase 2
    aiSummariesOptIn: boolean("ai_summaries_opt_in").default(false), // Phase 2
    // Notification channels
    // Security: slackWebhookUrl is NEVER returned in client-facing tRPC responses.
    // Filter it out at the router layer before sending to the browser.
    slackWebhookUrl: text("slack_webhook_url"), // Slack Incoming Webhook URL
    // Stripe Connect
    stripeAccountId: text("stripe_account_id"), // Connected Express account ID
    stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false).notNull(),
    stripeDefaultCurrency: text("stripe_default_currency").default("usd").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // Two orgs cannot share the same custom domain. Index on lower(custom_domain)
    // is enforced at DB level; we also validate in the tRPC layer.
    index("organizations_custom_domain_idx").on(t.customDomain),
  ],
).enableRLS();

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
  // Lifecycle state for the 5-state relationship selector (prospect → active → on_hold → churned → archived)
  lifecycleStatus: clientLifecycleStatusEnum("lifecycle_status").default("active").notNull(),
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
    index("projects_org_status_created_idx").on(t.orgId, t.status, t.createdAt.desc()),
  ],
).enableRLS();

// SubTask shape stored in milestones.subTasks JSONB column.
// TypeScript type: Array<{ id: string; label: string; completed: boolean }>

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
    description: text("description"),
    status: milestoneStatusEnum("status").default("todo").notNull(),
    priority: milestonePriorityEnum("priority").default("medium").notNull(),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    assigneeId: uuid("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Array of { id: string; label: string; completed: boolean }
    subTasks: jsonb("sub_tasks").default([]).notNull(),
    order: integer("order").notNull(),
  },
  (t) => [
    index("milestones_org_project_idx").on(t.orgId, t.projectId), // Composite per PRD §11
    index("milestones_status_idx").on(t.projectId, t.status),
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
    // Revenue dashboard: file manager query — WHERE project_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC
    // Covers the high-frequency soft-delete filter without the folder_id column so the planner
    // can use an index-only scan on the two most selective predicates.
    index("assets_project_deleted_updated_idx").on(
      t.projectId,
      t.deletedAt,
      t.updatedAt,
    ),
    index("assets_auto_approve_idx").on(t.autoApproveAt), // Inngest cron hot path
    index("assets_project_folder_created_idx").on(t.projectId, t.folderId, t.createdAt.desc()),
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
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "set null",
    }), // Threaded replies (max 2 levels)
    hidden: boolean("hidden").default(false).notNull(),
    resolved: boolean("resolved").default(false).notNull(),
    metadata: jsonb("metadata").$type<{
      x: number;
      y: number;
      page: number | null;
      resolved: boolean;
      pinNumber: number;
    }>(), // Annotations: { x, y, page, resolved, pinNumber }
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("comments_org_project_idx").on(t.orgId, t.projectId), // Composite per PRD §11
    index("comments_asset_idx").on(t.assetId),
    index("comments_asset_resolved_idx").on(t.assetId, t.resolved),
    index("comments_parent_idx").on(t.parentId),
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
    pdfUrl: text("pdf_url"), // Public URL of the pre-compiled PDF in Supabase Storage
    pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }), // When the PDF was last compiled by Inngest
    pdfStatus: text("pdf_status").default("pending").notNull(), // 'pending' | 'generating' | 'ready' | 'failed'
    // Stripe payment tracking
    stripePaymentIntentId: text("stripe_payment_intent_id"), // Nullable: set when client initiates payment
    stripeCheckoutSessionId: text("stripe_checkout_session_id"), // Nullable: reserved for future Checkout use
    paymentMethod: text("payment_method"), // 'card' | 'link' | 'us_bank_account' | 'sepa_debit'
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
    index("invoices_org_status_due_date_idx").on(t.orgId, t.status, t.dueDate),
    // Agency revenue dashboard: WHERE org_id = $1 AND status IN ('paid','overdue') ORDER BY paid_at DESC LIMIT 50
    // With this index, Postgres can satisfy the entire query from the index (index-only scan),
    // eliminating the full table scan over all org invoices.
    index("invoices_org_status_paid_idx").on(t.orgId, t.status, t.paidAt),
    // Nightly cron: WHERE org_id = $1 AND pdf_status = 'failed' — hot path for retry job
    index("invoices_pdf_status_idx").on(t.orgId, t.pdfStatus),
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
    type: text("type").notNull(), // NotificationEventType e.g. 'invoice.paid'
    title: text("title").notNull(),
    body: text("body"),
    actionUrl: text("action_url"),   // Deep link to the relevant resource
    actionLabel: text("action_label"), // CTA label e.g. "View invoice"
    read: boolean("read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    // Which channel delivered this notification
    channel: text("channel").notNull().default("in_app"), // 'in_app' | 'email' | 'slack' | 'sms'
    // Delivery tracking — updated by the Inngest worker after dispatch
    deliveryStatus: text("delivery_status").notNull().default("pending"), // 'pending' | 'delivered' | 'failed'
    deliveryError: text("delivery_error"), // Populated on failure
    // Channel-specific metadata e.g. { messageId: 'msg_123' } for Resend
    metadata: jsonb("metadata"),
    // Backwards-compat alias — kept for existing queries that reference 'link'
    link: text("link"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // Primary in-app bell query: unread first, then recent
    index("notifications_user_read_created_idx").on(t.userId, t.read, t.createdAt),
    // Org-wide notification history (admin view)
    index("notifications_org_type_created_idx").on(t.orgId, t.type, t.createdAt),
    // Per-channel delivery audit
    index("notifications_user_channel_created_idx").on(t.userId, t.channel, t.createdAt),
  ],
).enableRLS();

// Notification Preferences — per-user, per-org channel opt-in/out matrix
// preferences JSONB shape: Record<NotificationEventType, { in_app: boolean; email: boolean; slack: boolean; sms: boolean }>
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(), // One row per user (across all orgs they belong to)
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    preferences: jsonb("preferences").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("notif_prefs_user_org_idx").on(t.userId, t.orgId),
  ],
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

// Project Notes (internal team notes per project — never visible to clients)
export const projectNotes = pgTable(
  "project_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull()
      .unique(), // one notes doc per project
    content: text("content").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("project_notes_org_project_idx").on(t.orgId, t.projectId)],
).enableRLS();

// Client Notes (internal team notes per client — never visible to clients)
export const clientNotes = pgTable(
  "client_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // orgId de-normalized for O(1) RLS — avoids JOIN to clients on every query.
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    authorId: uuid("author_id")
      .references(() => users.id)
      .notNull(),
    content: text("content").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("client_notes_org_client_idx").on(t.orgId, t.clientId),
    index("client_notes_client_created_idx").on(t.clientId, t.createdAt.desc()),
  ],
).enableRLS();

// ─── Contracts (E-Signing) ────────────────────────────────────────────────────
// Full e-signing system — replaces DocuSign/HelloSign for standard agency contracts.
// Security model: signingToken is a UUID (unguessable). "link = consent" — same
// as DocuSign email-based signing links. The token is stored in plaintext because
// it IS the public signing URL — it is not a secret in the traditional sense.

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "sent",
  "viewed",
  "signed",
  "declined",
  "expired",
]);

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id").references(() => projects.id), // Nullable — standalone contracts allowed
    clientId: uuid("client_id")
      .references(() => clients.id)
      .notNull(),
    title: text("title").notNull(),
    status: contractStatusEnum("status").default("draft").notNull(),
    // NOTE: Do NOT allow status to go backwards (e.g. signed → sent).
    // Enforced in tRPC mutation layer. A Postgres CHECK constraint can be added
    // manually in production: CHECK (status IN ('draft','sent','viewed','signed','declined','expired'))
    bodyHtml: text("body_html").notNull().default(""),      // Stored with placeholder markup; always sanitize before render
    bodyPlainText: text("body_plain_text").notNull().default(""), // Plain text for email previews
    // ── Signing Token ───────────────────────────────────────────────────────────
    signingToken: text("signing_token").unique(), // UUID generated on send; used in public signing URL
    signingTokenExpiresAt: timestamp("signing_token_expires_at", { withTimezone: true }), // 30 days from send
    // ── Signer Data (populated when client signs) ───────────────────────────────
    signerName: text("signer_name"),   // Typed full name from signing page
    signerEmail: text("signer_email"),
    signatureImageUrl: text("signature_image_url"), // Public URL of canvas PNG in Supabase Storage
    // SHA-256 of (signerName + signerEmail + contractId + signingTimestamp)
    // This is an INTEGRITY PROOF, not a legal signature.
    // E-sign legality depends on jurisdiction (ESIGN Act, eIDAS, etc.).
    signatureHash: text("signature_hash"),
    // TODO (GDPR production): Hash signerIp with SHA-256 before storing.
    // Raw IP is stored here for development/audit purposes only.
    signerIp: text("signer_ip"),        // AGENCY-ONLY — never expose in client-facing UI
    signerUserAgent: text("signer_user_agent"),
    // ── Timestamps ──────────────────────────────────────────────────────────────
    signedAt: timestamp("signed_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }), // First time client opened the signing link
    declinedAt: timestamp("declined_at", { withTimezone: true }),
    declineReason: text("decline_reason"),
    // ── Output ──────────────────────────────────────────────────────────────────
    pdfUrl: text("pdf_url"), // Public URL of signed PDF in Supabase Storage (set by Inngest)
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("contracts_org_client_idx").on(t.orgId, t.clientId),
    index("contracts_org_project_idx").on(t.orgId, t.projectId),
    index("contracts_signing_token_idx").on(t.signingToken), // Hot path: public signing URL lookup (no RLS)
  ],
).enableRLS();

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

// ─── AI Project Health (Nightly Gemini Analysis) ──────────────────────────────
// One row per project per nightly analysis run — dashboard reads the latest.

export const projectHealth = pgTable(
  "project_health",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    riskScore: text("risk_score").notNull(), // 'low' | 'medium' | 'high' | 'critical'
    summary: text("summary").notNull(), // 2-sentence AI executive summary (≤300 chars)
    velocityTrend: text("velocity_trend").notNull(), // 'improving' | 'stable' | 'declining'
    overdueCount: integer("overdue_count").notNull(),
    unresolvedAnnotations: integer("unresolved_annotations").notNull(),
    openChangeRequests: integer("open_change_requests").notNull(),
    milestoneCompletionRate: real("milestone_completion_rate").notNull(), // 0.0 – 1.0
    rawMetrics: jsonb("raw_metrics"), // full metrics + Gemini token usage
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    modelUsed: text("model_used").notNull(), // e.g. 'gemini-2.5-flash'
  },
  (t) => [
    index("ph_project_generated_idx").on(t.projectId, t.generatedAt.desc()),
    index("ph_org_risk_idx").on(t.orgId, t.riskScore),
  ],
).enableRLS();
