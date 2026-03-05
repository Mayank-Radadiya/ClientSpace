# Task 02 — Database Schema & Drizzle Setup

> **Phase:** 1 · Foundation
> **Priority:** Critical — blocks auth, projects, invoices, and all data features
> **Depends on:** `01-setup.md`

---

## Objective

Define the complete Drizzle ORM schema for all Phase 1 tables (+ Phase 2 stubs), create the Drizzle client singleton, configure composite indexes, and run the first migration against Supabase PostgreSQL.

---

## Description

This task translates PRD §11 into a production Drizzle schema at `src/db/schema.ts`. All 18 tables, their relationships, enums, indexes, and the DB trigger for file versioning are defined here. Phase 2 stub tables (`contracts`, `csat_responses`) are included to prevent destructive migrations later.

---

## Subtasks

### 2.1 — Enums

Define PostgreSQL enums used across the schema:

```ts
// src/db/schema.ts
import { pgEnum } from "drizzle-orm/pg-core";

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
```

### 2.2 — Core Tables

Define all tables using `pgTable`. Key conventions:

- **IDs:** `uuid` with `defaultRandom()` as PK.
- **Timestamps:** `created_at` with `defaultNow()`, `updated_at` where needed.
- **Money:** Stored as `integer` (cents). Tax as `integer` (basis points).
- **Foreign Keys:** All `actor_id`, `author_id`, `uploaded_by` are `FK → users.id`, **non-nullable**.

#### Users (Profile Table)

> **Supabase Auth owns passwords.** This table mirrors `auth.users` as a public profile. The `id` column MUST match the Supabase Auth UID. Never store `password_hash` here.

```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Matches auth.users.id — NOT defaultRandom()
  email: text("email").notNull().unique(), // Synced from auth.users via trigger
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

#### Organizations

```ts
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
});
```

#### Org Memberships

```ts
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
);
```

#### Clients

```ts
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
});
```

#### Projects

```ts
export const projects = pgTable("projects", {
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
});
```

#### Milestones

```ts
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
```

#### Project Members

```ts
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
);
```

#### Folders

```ts
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
```

#### Assets

```ts
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
    // PRD §6.4: Auto-approve after N business days if no action taken.
    // The Inngest cron job checks this column. null = auto-approve disabled.
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
    index("assets_org_project_idx").on(t.orgId, t.projectId), // Composite per PRD §11
    index("assets_auto_approve_idx").on(t.autoApproveAt), // Inngest cron hot path
  ],
).enableRLS();
```

#### File Versions

```ts
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
```

#### Comments

```ts
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
    // FIX: onDelete: "cascade" added — deleting an asset must remove its file comments.
    // Without this, the DB throws a FK constraint error when an asset is deleted.
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
```

#### Invoices

```ts
export const invoices = pgTable("invoices", {
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
});
```

#### Invoice Line Items

```ts
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(), // Fractional hours
  unitPriceCents: integer("unit_price_cents").notNull(),
});
```

#### Activity Logs

```ts
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
```

#### Notifications

```ts
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
```

#### Invitations

```ts
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
});
```

#### Share Links

```ts
export const shareLinks = pgTable("share_links", {
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
});
```

### 2.3 — Phase 2 Stub Tables

Include now to prevent destructive migrations later:

#### Contracts (E-Signature — Phase 2)

```ts
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
});
```

#### CSAT Responses (Phase 2)

```ts
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
});
```

### 2.4 — Drizzle Relations

Define Drizzle `relations()` for type-safe query joins:

```ts
// src/db/relations.ts
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(orgMemberships),
  projectAssignments: many(projectMembers),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [organizations.ownerId],
      references: [users.id],
    }),
    memberships: many(orgMemberships),
    clients: many(clients),
    projects: many(projects),
    invoices: many(invoices),
  }),
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  members: many(projectMembers),
  milestones: many(milestones),
  assets: many(assets),
  folders: many(folders),
  comments: many(comments),
  activityLogs: many(activityLogs),
}));

// ... continue for all tables with FK relationships
```

### 2.5 — Indexes

All indexes are now co-located inside each `pgTable()`'s third argument (see table definitions above). The full index map for reference:

| Index Name                    | Table           | Columns                      | Purpose                   |
| ----------------------------- | --------------- | ---------------------------- | ------------------------- |
| `assets_org_project_idx`      | `assets`        | `(org_id, project_id)`       | O(1) RLS + project filter |
| `assets_auto_approve_idx`     | `assets`        | `(auto_approve_at)`          | Inngest cron hot path     |
| `milestones_org_project_idx`  | `milestones`    | `(org_id, project_id)`       | O(1) RLS + project filter |
| `folders_org_project_idx`     | `folders`       | `(org_id, project_id)`       | O(1) RLS                  |
| `file_versions_org_asset_idx` | `file_versions` | `(org_id, asset_id)`         | O(1) RLS                  |
| `comments_org_project_idx`    | `comments`      | `(org_id, project_id)`       | O(1) RLS + project filter |
| `comments_asset_idx`          | `comments`      | `(asset_id)`                 | File-level thread fetch   |
| `activity_org_project_idx`    | `activity_logs` | `(org_id, project_id)`       | Timeline feed             |
| `projects_org_client_idx`     | `projects`      | `(org_id, client_id)`        | Dashboard list            |
| `invoices_org_client_idx`     | `invoices`      | `(org_id, client_id)`        | Invoice list              |
| `invoices_overdue_idx`        | `invoices`      | `(org_id, status, due_date)` | Overdue cron hot path     |
| `notifications_user_idx`      | `notifications` | `(user_id, read)`            | Bell icon unread count    |
| `share_entity_idx`            | `share_links`   | `(entity_id, entity_type)`   | Share link lookup         |

> **Key pattern:** Every child table that is accessed independently from its parent now carries `org_id` as the leading column of its primary query index. This enables RLS policies to use `org_id = (auth.jwt()->>'org_id')::uuid` — an O(1) JWT claim check — rather than a cascading JOIN back to `projects` or `organizations`.

### 2.6 — Database Trigger (File Versioning)

Apply via Supabase SQL Editor or a raw migration:

```sql
-- Trigger: Auto-update asset.current_version_id on new file_version insert
CREATE OR REPLACE FUNCTION update_asset_latest_version()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE assets
    SET current_version_id = NEW.id,
        updated_at = NOW()
    WHERE id = NEW.asset_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_version_upload
AFTER INSERT ON file_versions
FOR EACH ROW
EXECUTE FUNCTION update_asset_latest_version();
```

### 2.7 — Drizzle Client Singleton

```ts
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for Supabase Transaction Pooler compatibility
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
```

> **⚠️ Production code must NOT use `db` directly.** Task 03 implements the `createDrizzleClient(session)` factory that sets `app.current_org_id` for RLS enforcement. Bare `db` usage is only permitted in seed scripts and migrations.

### 2.8 — First Migration

```bash
# Generate the migration SQL from schema
bun run db:generate

# Push to Supabase (dev shortcut — skips migration history)
bun run db:push

# Or apply via migration for production traceability
bun run db:migrate
```

### 2.9 — Seed Script Stub

```ts
// src/db/seed.ts
import { db } from "./index";
// PRD §12 DX: 50+ varied events for Activity Timeline testing
// Full implementation in a later task; scaffold now.

async function seed() {
  console.log("🌱 Seeding database...");
  // TODO: Create test org, users, clients, projects, files, invoices, events
  console.log("✅ Seed complete.");
}

seed().catch(console.error);
```

---

## File Outputs

| File                  | Purpose                               |
| --------------------- | ------------------------------------- |
| `src/db/schema.ts`    | All table definitions, enums, indexes |
| `src/db/relations.ts` | Drizzle relational query config       |
| `src/db/index.ts`     | Drizzle client singleton              |
| `src/db/seed.ts`      | Seed script stub                      |
| `drizzle/`            | Generated migration SQL files         |

---

## Validation Checklist

- [ ] `bun run db:generate` completes with zero errors.
- [ ] `bun run db:push` applies schema to Supabase — all 20 tables visible in Supabase Dashboard.
- [ ] `bun run db:studio` launches Drizzle Studio and shows all tables with correct columns.
- [ ] Enums are visible in Supabase: `org_role`, `project_status`, `invoice_status`, etc.
- [ ] **OrgId propagation:** Verify `milestones`, `folders`, `assets`, `file_versions`, `comments` all have an `org_id` column in Supabase Dashboard.
- [ ] **RLS enabled:** Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` in Supabase SQL Editor. Every table must show `rowsecurity = true`.
- [ ] **Composite indexes exist:** `assets_org_project_idx`, `milestones_org_project_idx`, `comments_org_project_idx`, `invoices_overdue_idx`, `activity_org_project_idx`.
- [ ] **Auto-approve field:** `assets` table has an `auto_approve_at` column (nullable timestamp).
- [ ] **Cascade on delete:** Insert a comment linked to an asset, delete the asset — comment row must be deleted automatically.
- [ ] File versioning trigger works: inserting into `file_versions` auto-updates `assets.current_version_id`.
- [ ] Phase 2 stub tables exist: `contracts`, `csat_responses`.
- [ ] `src/db/index.ts` connects with `{ prepare: false }` for Supabase pooler compatibility.
- [ ] TypeScript compiles without errors: `bun tsc --noEmit` — the `ActivityEventMetadata` union resolves across the codebase.

---

## References

- PRD §11 — Database Schema (tables, relationships, Phase 2 stubs)
- PRD §11 — Database Indexes
- PRD §11 — Database Triggers
- PRD §10.1 — Core Data Validation (Zod schemas for money)
- PRD §10.2 — Drizzle RLS Factory, Invoice Sequence Lock
- PRD §9 — Pricing (plan enum values)
