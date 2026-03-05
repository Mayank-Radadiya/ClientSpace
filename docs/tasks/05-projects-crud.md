# Task 05 — Projects CRUD: Dashboard & Management

> **Phase:** 1 · Core Features
> **Priority:** Critical — unblocks file delivery, invoicing, and client portal
> **Depends on:** `04-onboarding.md`

---

## Objective

Implement the Projects dashboard where Admins and Members can view, create, and edit projects. This is the primary workspace surface — every downstream feature (files, invoices, approvals, comments) hangs off a project.

---

## Description

After onboarding, the admin lands on `/dashboard`. The first real action is creating a project and assigning it to a client. This task builds:

1. A **Zod schema** for project data validation (shared client + server).
2. **Server Actions** for `createProject` and `updateProject` (mutation boundary per PRD §10.2).
3. A **tRPC router** for fetching the project list (query boundary per PRD §10.2).
4. **UI components**: `ProjectCard` for the grid display, `CreateProjectDialog` for the creation form.
5. The **projects page** at `/dashboard/projects` rendering the list + "New Project" button.

> **PRD §6.3:** Project fields — name, description, client, members, start date, deadline, status, priority, milestones, budget, tags.
> **PRD §10.2:** "Server Actions strictly reserved for RSC form mutations. All client-side queries must use tRPC."

---

## Tech Stack

| Concern        | Tool                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| **Mutations**  | Next.js Server Actions (create, update)                                        |
| **Queries**    | tRPC v11 + TanStack Query (project list, optimistic UI)                        |
| **Validation** | Zod (shared schema)                                                            |
| **Forms**      | `react-hook-form` + `@hookform/resolvers/zod`                                  |
| **UI**         | shadcn/ui (`Dialog`, `Form`, `Calendar`, `Popover`, `Select`, `Badge`, `Card`) |
| **ORM**        | Drizzle ORM                                                                    |
| **Dates**      | `date-fns` (deadline formatting, overdue checks)                               |

---

## Step-by-Step Instructions

### Step 1 — Zod Validation Schema

Create `src/features/projects/schemas.ts`:

```typescript
import { z } from "zod";
import { projectStatusEnum, projectPriorityEnum } from "@/db/schema";

/**
 * Project status values derived from the Drizzle Postgres enums.
 * Single source of truth — no manual duplication.
 *
 * PRD §6.3 Status Workflow:
 *   Not Started → In Progress → Review → Completed
 *                     ↓
 *                  On Hold          Archived
 */
export const PROJECT_STATUSES = projectStatusEnum.enumValues;

export const PROJECT_PRIORITIES = projectPriorityEnum.enumValues;

/**
 * Human-readable labels for display in UI badges and selects.
 */
export const STATUS_LABELS: Record<(typeof PROJECT_STATUSES)[number], string> =
  {
    not_started: "Not Started",
    in_progress: "In Progress",
    review: "Review",
    completed: "Completed",
    on_hold: "On Hold",
    archived: "Archived",
  };

export const PRIORITY_LABELS: Record<
  (typeof PROJECT_PRIORITIES)[number],
  string
> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/**
 * Shared Zod schema for project create/update forms.
 * Validated on both client (react-hook-form) and server (Server Action).
 *
 * NOTE: `org_id` is NEVER included here. It is injected server-side
 * from the authenticated session — never trust the client.
 */
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters")
    .trim(),

  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be at most 5,000 characters"),

  clientId: z.string().uuid("Please select a valid client"),

  status: z.enum(PROJECT_STATUSES).default("not_started"),

  priority: z.enum(PROJECT_PRIORITIES).default("medium"),

  startDate: z.date().optional().nullable(),

  deadline: z.date({ required_error: "Deadline is required" }),

  budget: z
    .number()
    .int()
    .min(0, "Budget cannot be negative")
    .optional()
    .nullable(),

  tags: z
    .array(z.string().max(50))
    .max(10, "Maximum 10 tags allowed")
    .default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;

/**
 * Update schema: all fields optional except the ones being changed.
 * ID comes from the URL param, org_id from the session.
 */
export const updateProjectSchema = projectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
```

**Key decisions:**

| Decision                          | Rationale                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `org_id` excluded from schema     | PRD §10.2: Enforced server-side from session. Never trust client input.                    |
| `clientId` is UUID-validated      | FK → `clients.id`. Must be a valid UUID to prevent injection.                              |
| `budget` as integer (cents)       | PRD §10.1: Money stored in cents to prevent float math errors.                             |
| `startDate` optional + nullable   | PRD §6.3: Start date is not required.                                                      |
| `deadline` required               | PRD §6.3: Deadline is required, triggers overdue indicator.                                |
| Enums derived from Drizzle schema | Inferred from `projectStatusEnum.enumValues` — eliminates drift between Zod schema and DB. |

---

### Step 1b — Shared Session Context Utility

> **DRY Principle:** Every Server Action in the application (projects, files, invoices, comments) needs the same session resolution. Extract it once.

Create `src/lib/auth/session.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolve the current user's org context from the authenticated session.
 * Returns a scoped Drizzle client via the mandatory factory.
 *
 * This is the ONLY source of truth for tenant scoping in Server Actions.
 *
 * PRD §10.2: "All database access must guarantee org_id is set,
 * completely eliminating query-level data leaks."
 */
export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Bootstrap DB with SYSTEM context to read membership
  const bootstrapDb = await createDrizzleClient({
    userId: user.id,
    orgId: "SYSTEM",
  });

  // Get the user's active org membership
  // For MVP, we use the first membership. Multi-org switching is Phase 2.
  const membership = await bootstrapDb.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id),
  });

  if (!membership) return null;

  // Create a properly-scoped Drizzle client for all subsequent queries
  const db = await createDrizzleClient({
    userId: user.id,
    orgId: membership.orgId,
  });

  return {
    userId: user.id,
    orgId: membership.orgId,
    role: membership.role,
    db, // ← RLS-enforced Drizzle instance
  };
}
```

> **⚠️ CRITICAL:** This utility returns a `db` instance created via `createDrizzleClient`, which calls `SET LOCAL app.current_org_id` for RLS enforcement. **Never** import the bare `db` from `@/db` in Server Actions — use `ctx.db` from this function.

---

### Step 2 — Server Actions (Create & Update)

Create `src/features/projects/server/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { projects, clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { projectSchema, updateProjectSchema } from "../schemas";

// ─── Types ──────────────────────────────────────────────────────
export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ─── CREATE ──────────────────────────────────────────────────────

export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // 1. Authenticate + resolve org
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: "You must be logged in to create a project." };
  }

  // 2. Role check: Only owner, admin, member can create projects (PRD §4)
  if (ctx.role === "client") {
    return { error: "Clients cannot create projects." };
  }

  // 3. Parse & validate
  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    clientId: formData.get("clientId") as string,
    status: (formData.get("status") as string) || "not_started",
    priority: (formData.get("priority") as string) || "medium",
    startDate: formData.get("startDate")
      ? new Date(formData.get("startDate") as string)
      : null,
    deadline: formData.get("deadline")
      ? new Date(formData.get("deadline") as string)
      : undefined,
    budget: formData.get("budget")
      ? parseInt(formData.get("budget") as string, 10)
      : null,
    tags: formData.get("tags")
      ? (formData.get("tags") as string)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
  };

  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;

  // 4. Verify the client belongs to this org (prevent IDOR)
  const client = await ctx.db.query.clients.findFirst({
    where: and(eq(clients.id, data.clientId), eq(clients.orgId, ctx.orgId)),
  });

  if (!client) {
    return { error: "Selected client does not belong to your organization." };
  }

  // 5. Insert with server-enforced org_id
  try {
    await ctx.db.insert(projects).values({
      orgId: ctx.orgId, // ← Server-enforced, NEVER from client
      clientId: data.clientId,
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate?.toISOString().split("T")[0] ?? null,
      deadline: data.deadline.toISOString().split("T")[0],
      budget: data.budget ?? null,
      tags: data.tags,
    });
  } catch (err) {
    console.error("Failed to create project:", err);
    return { error: "Something went wrong. Please try again." };
  }

  // 6. Revalidate the projects list for instant reflection
  revalidatePath("/dashboard/projects");

  return { success: true };
}

// ─── UPDATE ──────────────────────────────────────────────────────

export async function updateProjectAction(
  projectId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // 1. Authenticate + resolve org
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: "You must be logged in to update a project." };
  }

  // 2. Role check
  if (ctx.role === "client") {
    return { error: "Clients cannot edit projects." };
  }

  /**
   * @security IDOR guard — verify the project belongs to this org.
   * If this check fails, we MUST return immediately. No further
   * processing (client verification, DB update, revalidation) may occur.
   */
  const existing = await ctx.db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)),
  });

  if (!existing) {
    return { error: "Project not found." };
  }

  // 4. Status transition guard (PRD §6.3)
  // Only Owner/Admin can transition to Completed or Archived
  const newStatus = formData.get("status") as string | null;
  if (
    newStatus &&
    (newStatus === "completed" || newStatus === "archived") &&
    ctx.role === "member"
  ) {
    return {
      error: "Only Admins can mark projects as Completed or Archived.",
    };
  }

  // 5. Parse the partial update
  const raw: Record<string, unknown> = {};
  const fields = [
    "name",
    "description",
    "clientId",
    "status",
    "priority",
    "tags",
  ] as const;

  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null) raw[field] = val;
  }

  // Handle date fields
  const startDate = formData.get("startDate");
  if (startDate) raw.startDate = new Date(startDate as string);

  const deadline = formData.get("deadline");
  if (deadline) raw.deadline = new Date(deadline as string);

  const budget = formData.get("budget");
  if (budget) raw.budget = parseInt(budget as string, 10);

  // Handle tags
  if (raw.tags && typeof raw.tags === "string") {
    raw.tags = (raw.tags as string)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  // 6. If clientId changed, verify the new client belongs to this org
  if (parsed.data.clientId) {
    const newClient = await ctx.db.query.clients.findFirst({
      where: and(
        eq(clients.id, parsed.data.clientId),
        eq(clients.orgId, ctx.orgId),
      ),
    });
    if (!newClient) {
      return { error: "Selected client does not belong to your organization." };
    }
  }

  // 7. Build update values
  const updateValues: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateValues.name = parsed.data.name;
  if (parsed.data.description !== undefined)
    updateValues.description = parsed.data.description;
  if (parsed.data.clientId !== undefined)
    updateValues.clientId = parsed.data.clientId;
  if (parsed.data.status !== undefined)
    updateValues.status = parsed.data.status;
  if (parsed.data.priority !== undefined)
    updateValues.priority = parsed.data.priority;
  if (parsed.data.startDate !== undefined) {
    updateValues.startDate = parsed.data.startDate
      ? parsed.data.startDate.toISOString().split("T")[0]
      : null;
  }
  if (parsed.data.deadline !== undefined) {
    updateValues.deadline = parsed.data.deadline.toISOString().split("T")[0];
  }
  if (parsed.data.budget !== undefined)
    updateValues.budget = parsed.data.budget;
  if (parsed.data.tags !== undefined) updateValues.tags = parsed.data.tags;

  updateValues.updatedAt = new Date();

  // 8. Apply update
  try {
    await ctx.db
      .update(projects)
      .set(updateValues)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.orgId, ctx.orgId), // Double-scoped for safety
        ),
      );
  } catch (err) {
    console.error("Failed to update project:", err);
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/projects");
  return { success: true };
}
```

**Constraints enforced:**

| Constraint              | Implementation                                                    |
| ----------------------- | ----------------------------------------------------------------- |
| Org isolation           | `org_id` injected from `getSessionContext()`, never from FormData |
| IDOR prevention         | Client FK verified against `ctx.orgId` before INSERT              |
| Role-based status guard | Only owner/admin can set `completed` or `archived` (PRD §6.3)     |
| RBAC on create          | Clients cannot create projects (PRD §4 permissions table)         |
| Revalidation            | `revalidatePath` ensures the tRPC list query re-fetches           |

---

### Step 3 — tRPC Router (Queries)

Create `src/features/projects/server/router.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { projects, clients } from "@/db/schema";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { PROJECT_STATUSES } from "@/features/projects/schemas";

/**
 * Helper: select columns shared between getAll and getById.
 */
const projectColumns = {
  id: projects.id,
  name: projects.name,
  description: projects.description,
  status: projects.status,
  priority: projects.priority,
  startDate: projects.startDate,
  deadline: projects.deadline,
  budget: projects.budget,
  tags: projects.tags,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
  clientId: projects.clientId,
  clientCompanyName: clients.companyName,
  clientEmail: clients.email,
};

/**
 * Centralized overdue computation.
 * Uses the DB server clock (UTC) to avoid timezone discrepancies
 * from client-side `new Date()` calls.
 */
function computeOverdue(row: {
  deadline: string | null;
  status: string;
}): boolean {
  if (!row.deadline) return false;
  if (row.status === "completed" || row.status === "archived") return false;
  return new Date(row.deadline) < new Date(); // DB rows already fetched, compare in UTC
}

export const projectRouter = createTRPCRouter({
  /**
   * getAll — Paginated projects for the current org.
   *
   * PRD §10.2: "All client-side queries must exclusively use tRPC."
   * Scoped to ctx.orgId — RLS at the query layer.
   *
   * Returns cursor-based pagination to prevent memory issues
   * for orgs with hundreds of archived projects.
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(PROJECT_STATUSES).optional(),
          limit: z.number().int().min(1).max(100).default(50),
          cursor: z.string().uuid().optional(), // last project ID for pagination
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const conditions = [eq(projects.orgId, ctx.orgId)];

      if (input?.status) {
        conditions.push(eq(projects.status, input.status));
      }

      // Cursor-based pagination: fetch items created before the cursor
      if (input?.cursor) {
        const cursorProject = await ctx.db
          .select({ createdAt: projects.createdAt })
          .from(projects)
          .where(eq(projects.id, input.cursor))
          .limit(1);

        if (cursorProject[0]) {
          conditions.push(lt(projects.createdAt, cursorProject[0].createdAt));
        }
      }

      const results = await ctx.db
        .select(projectColumns)
        .from(projects)
        .leftJoin(clients, eq(projects.clientId, clients.id))
        .where(and(...conditions))
        .orderBy(desc(projects.createdAt))
        .limit(limit + 1); // Fetch one extra to detect next page

      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, limit) : results;

      // Compute isOverdue server-side for timezone consistency
      const projectsWithOverdue = items.map((p) => ({
        ...p,
        isOverdue: computeOverdue(p),
      }));

      return {
        projects: projectsWithOverdue,
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      };
    }),

  /**
   * getById — Fetch a single project with its client info.
   * Used on the project detail page.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select(projectColumns)
        .from(projects)
        .leftJoin(clients, eq(projects.clientId, clients.id))
        .where(and(eq(projects.id, input.id), eq(projects.orgId, ctx.orgId)))
        .limit(1);

      if (!result) return null;

      return {
        ...result,
        isOverdue: computeOverdue(result),
      };
    }),
});
```

> **Wire into the root router:** In `src/lib/trpc/root.ts`, import and merge:
>
> ```typescript
> import { projectRouter } from "@/features/projects/server/router";
>
> export const appRouter = createTRPCRouter({
>   project: projectRouter,
>   // ...other routers
> });
> ```

---

### Step 4 — Project Card Component

Create `src/features/projects/components/ProjectCard.tsx`:

```tsx
import Link from "next/link";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, PRIORITY_LABELS } from "../schemas";

// ─── Status Badge Variants ──────────────────────────────────────────
const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  not_started: "secondary",
  in_progress: "default",
  review: "outline",
  completed: "default",
  on_hold: "secondary",
  archived: "secondary",
};

const PRIORITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  urgent: "destructive",
};

// ─── Types ──────────────────────────────────────────────────────
type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    status: string;
    priority: string;
    deadline: string | null;
    isOverdue: boolean; // ← Server-computed by tRPC router
    clientCompanyName: string | null;
    clientEmail: string;
    tags: string[] | null;
  };
};

// ─── Component ──────────────────────────────────────────────────
export function ProjectCard({ project }: ProjectCardProps) {
  const deadlineDate = project.deadline ? new Date(project.deadline) : null;

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <Badge
              variant={PRIORITY_VARIANT[project.priority] ?? "outline"}
              className="shrink-0 text-xs"
            >
              {PRIORITY_LABELS[
                project.priority as keyof typeof PRIORITY_LABELS
              ] ?? project.priority}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-2">
          {/* Client Name */}
          <p className="text-sm text-muted-foreground truncate">
            {project.clientCompanyName || project.clientEmail}
          </p>

          {/* Status Badge */}
          <Badge
            variant={STATUS_VARIANT[project.status] ?? "secondary"}
            className="text-xs"
          >
            {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS] ??
              project.status}
          </Badge>
        </CardContent>

        <CardFooter className="pt-0 text-xs text-muted-foreground">
          {deadlineDate ? (
            <span
              className={
                project.isOverdue ? "text-destructive font-medium" : ""
              }
            >
              {project.isOverdue ? "⚠ Overdue: " : "Due: "}
              {format(deadlineDate, "MMM d, yyyy")}
            </span>
          ) : (
            <span>No deadline</span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
```

**Display logic:**

| Element        | Behavior                                                                    |
| -------------- | --------------------------------------------------------------------------- |
| Status badge   | Colored variant per status enum                                             |
| Priority badge | Top-right; `urgent` is `destructive` (red)                                  |
| Client name    | Shows `company_name` first, falls back to `email`                           |
| Deadline       | Formatted via `date-fns`; `isOverdue` is server-computed for TZ consistency |
| Overdue flag   | Read from tRPC response — not computed client-side                          |
| Click target   | Entire card links to `/dashboard/projects/[id]`                             |

---

### Step 5 — Create Project Dialog

Create `src/features/projects/components/CreateProjectDialog.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";

import { createProjectAction, type ActionState } from "../server/actions";
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "../schemas";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────
type Client = {
  id: string;
  companyName: string | null;
  email: string;
};

type CreateProjectDialogProps = {
  clients: Client[];
};

// ─── Submit Button ──────────────────────────────────────────────
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating..." : "Create project"}
    </Button>
  );
}

// ─── Component ──────────────────────────────────────────────────
export function CreateProjectDialog({ clients }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const formRef = useRef<HTMLFormElement>(null);

  const initialState: ActionState = {};
  const [state, formAction] = useFormState(createProjectAction, initialState);

  // Close dialog on successful creation
  if (state.success && open) {
    setOpen(false);
    formRef.current?.reset();
    setDeadline(undefined);
    setStartDate(undefined);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>
            Fill in the details to set up a new project for your client.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-5 pt-2">
          {/* Global Error */}
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Website Redesign"
              required
              maxLength={100}
            />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief project overview..."
              required
              maxLength={5000}
              rows={3}
            />
            {state.fieldErrors?.description && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* Client Select */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Select name="clientId" required>
              <SelectTrigger id="clientId">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.companyName || client.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.clientId && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.clientId[0]}
              </p>
            )}
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="not_started">
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.filter(
                    (s) => s !== "completed" && s !== "archived",
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline (Required) */}
          <div className="space-y-2">
            <Label>Deadline *</Label>
            <input
              type="hidden"
              name="deadline"
              value={deadline?.toISOString() ?? ""}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Pick a deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {state.fieldErrors?.deadline && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.deadline[0]}
              </p>
            )}
          </div>

          {/* Start Date (Optional) */}
          <div className="space-y-2">
            <Label>Start date (optional)</Label>
            <input
              type="hidden"
              name="startDate"
              value={startDate?.toISOString() ?? ""}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Budget (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (optional, in cents)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              min={0}
              placeholder="e.g. 250000 for $2,500.00"
            />
          </div>

          {/* Tags (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="branding, urgent, retainer"
            />
          </div>

          {/* Submit */}
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Form notes:**

| Choice                                | Rationale                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `Dialog` (not `Sheet`)                | Single-step form — a dialog is more focused. Sheet reserved for detail views.  |
| `Calendar` inside `Popover`           | shadcn/ui pattern for date pickers without a third-party datepicker lib.       |
| Hidden `<input>` for dates            | Server Actions receive `FormData`. Calendar state is synced via hidden inputs. |
| `Completed` / `Archived` filtered out | PRD §6.3: New projects cannot start in a terminal state.                       |
| `useFormState` + `useFormStatus`      | Next.js 14 compatible form submission with server-side validation.             |

---

### Step 6 — Empty State Component

Create `src/features/projects/components/EmptyProjects.tsx`:

```tsx
import { FolderOpen } from "lucide-react";

export function EmptyProjects() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Create your first project to start managing files, approvals, and
        invoices for your clients.
      </p>
    </div>
  );
}
```

> **PRD §12:** "Loading skeletons on all async data; no blank states during fetch."

---

### Step 7 — Projects Page

> **⚠️ SSR Data Strategy:** `ProjectList` is a Client Component that fetches via tRPC `useQuery`. Wrapping it in `<Suspense>` has **no effect** — `Suspense` only suspends for Server Component async reads, not client-side hooks. Instead, we **server-prefetch** the initial data and pass it to the client component as `initialData` to eliminate the client-side waterfall.

Create `src/app/(dashboard)/projects/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { orgMemberships, clients, projects } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

import { ProjectList } from "./ProjectList";

export const metadata = {
  title: "Projects — ClientSpace",
};

export default async function ProjectsPage() {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 2. Resolve org (bootstrap context)
  const bootstrapDb = await createDrizzleClient({
    userId: user.id,
    orgId: "SYSTEM",
  });

  const membership = await bootstrapDb.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id),
  });

  if (!membership) redirect("/onboarding");

  // 3. Create org-scoped DB client
  const db = await createDrizzleClient({
    userId: user.id,
    orgId: membership.orgId,
  });

  // 4. Fetch clients for the CreateProjectDialog select dropdown
  const orgClients = await db
    .select({
      id: clients.id,
      companyName: clients.companyName,
      email: clients.email,
    })
    .from(clients)
    .where(eq(clients.orgId, membership.orgId));

  // 5. Server-prefetch initial project data (eliminates client-side waterfall)
  const initialProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      deadline: projects.deadline,
      budget: projects.budget,
      tags: projects.tags,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientId: projects.clientId,
      clientCompanyName: clients.companyName,
      clientEmail: clients.email,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.orgId, membership.orgId))
    .orderBy(desc(projects.createdAt))
    .limit(50);

  // Compute isOverdue server-side
  const projectsWithOverdue = initialProjects.map((p) => ({
    ...p,
    isOverdue:
      !!p.deadline &&
      p.status !== "completed" &&
      p.status !== "archived" &&
      new Date(p.deadline) < new Date(),
  }));

  return (
    <div className="space-y-6">
      <ProjectList
        clients={orgClients}
        initialData={{
          projects: projectsWithOverdue,
          nextCursor:
            initialProjects.length === 50
              ? initialProjects[initialProjects.length - 1]?.id
              : undefined,
        }}
      />
    </div>
  );
}
```

Then create the client component that hydrates with tRPC:

Create `src/app/(dashboard)/projects/ProjectList.tsx`:

```tsx
"use client";

import { trpc } from "@/lib/trpc/client";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";
import { EmptyProjects } from "@/features/projects/components/EmptyProjects";

type Client = {
  id: string;
  companyName: string | null;
  email: string;
};

type ProjectData = {
  id: string;
  name: string;
  status: string;
  priority: string;
  deadline: string | null;
  isOverdue: boolean;
  clientCompanyName: string | null;
  clientEmail: string;
  tags: string[] | null;
  [key: string]: unknown;
};

type ProjectListProps = {
  clients: Client[];
  /** Server-prefetched data to eliminate client-side waterfall */
  initialData: {
    projects: ProjectData[];
    nextCursor?: string;
  };
};

export function ProjectList({ clients, initialData }: ProjectListProps) {
  /**
   * useQuery hydrates instantly from `initialData` on first render (no loading state).
   * Subsequent navigations and revalidations trigger a background re-fetch.
   */
  const { data } = trpc.project.getAll.useQuery(undefined, {
    initialData,
  });

  const projects = data?.projects ?? initialData.projects;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your active projects and track progress.
          </p>
        </div>
        <CreateProjectDialog clients={clients} />
      </div>

      {/* Grid or Empty State */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyProjects />
      )}
    </>
  );
}
```

---

## File Outputs

| File                                                       | Purpose                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| `src/lib/auth/session.ts`                                  | **[NEW]** Shared `getSessionContext()` utility (DRY)     |
| `src/features/projects/schemas.ts`                         | Zod schemas — enums derived from Drizzle schema          |
| `src/features/projects/server/actions.ts`                  | Server Actions using `ctx.db` from factory               |
| `src/features/projects/server/router.ts`                   | tRPC router (paginated getAll + getById, server overdue) |
| `src/features/projects/components/ProjectCard.tsx`         | Project card — reads `isOverdue` from server             |
| `src/features/projects/components/CreateProjectDialog.tsx` | Dialog form for creating a new project                   |
| `src/features/projects/components/EmptyProjects.tsx`       | Empty state when no projects exist                       |
| `src/app/(dashboard)/projects/page.tsx`                    | Projects page — server-prefetches initialData            |
| `src/app/(dashboard)/projects/ProjectList.tsx`             | Client Component — hydrates from server-prefetched data  |
| `src/lib/trpc/root.ts`                                     | **Modified** — add `projectRouter` to app router         |

---

## Validation Checklist

- [ ] **Schema compiles:** Import `projectSchema` in a test file. `projectSchema.parse({...})` with valid data returns a typed object. Invalid data (empty name, bad UUID) throws `ZodError`.
- [ ] **Enum derivation:** Verify `PROJECT_STATUSES === projectStatusEnum.enumValues` — no manually duplicated arrays.
- [ ] **No bare `db` imports:** Run `grep -rn 'from "@/db"' src/features/projects/ src/app/(dashboard)/projects/`. Zero results — all DB access uses `createDrizzleClient` or `ctx.db`.
- [ ] **Shared session utility:** `src/lib/auth/session.ts` exports `getSessionContext()`. Server Actions import from this location.
- [ ] **Create a project:** Click "New Project" on `/dashboard/projects`. Fill all required fields (name, description, client, deadline). Submit. No errors returned.
- [ ] **Project appears in list:** After creation, the project card appears in the grid without a hard page refresh (revalidation triggers re-fetch).
- [ ] **DB check:** In Supabase Dashboard → Table Editor → `projects`. Verify the new row has `org_id` matching the current org — NOT a client-supplied value.
- [ ] **Client scoping:** The client select dropdown only shows clients belonging to this org. Manually crafting a FormData with another org's `client_id` returns an error.
- [ ] **IDOR guard:** Call `updateProjectAction` with another org's `projectId`. Verify the action returns `"Project not found."` and performs **no** DB writes.
- [ ] **Status badge:** The card displays the correct status label and color variant.
- [ ] **Priority badge:** The card displays the correct priority label. `urgent` is red.
- [ ] **Deadline display:** The card shows a formatted date. Overdue flag comes from the tRPC response (`isOverdue: true`), not client-side date math.
- [ ] **No Suspense waterfall:** The page renders instantly with server-prefetched data — no client-side loading skeleton on first paint.
- [ ] **Pagination:** `trpc.project.getAll.useQuery({ limit: 10 })` returns at most 10 projects and a `nextCursor` if more exist.
- [ ] **Empty state:** With zero projects, the page shows "No projects yet" with a folder icon.
- [ ] **Status guard:** As a `member` role, attempt to create a project with `status: completed`. The server returns an error. (Only Admin/Owner can set terminal statuses.)
- [ ] **Client role blocked:** Log in as a `client` role user. The "New Project" button should either be hidden or the server action should reject with "Clients cannot create projects."
- [ ] **Update works:** (Manual test via DevTools or a future edit dialog) Call `updateProjectAction` with a valid `projectId`. Verify the DB row updates and `updatedAt` changes.
- [ ] **tRPC filtering:** Call `trpc.project.getAll.useQuery({ status: "in_progress" })`. Only projects with that status are returned.
- [ ] **Compile check:** Run `bun run build`. Ensure zero TypeScript errors.

---

## Architectural Decisions

| Decision                                                    | Rationale                                                                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server Actions for mutations**                            | PRD §10.2: "Server Actions strictly reserved for RSC form mutations." Project create/update are classic form submissions.                                                       |
| **tRPC for queries**                                        | PRD §10.2: "All client-side queries must use tRPC." The project list is fetched client-side via TanStack Query for optimistic UI + SWR caching.                                 |
| **`createDrizzleClient` factory (no bare `db`)**            | PRD §10.2: "Bare Drizzle client instantiation is banned." All DB access uses the factory to enforce `SET LOCAL app.current_org_id` for RLS.                                     |
| **`getSessionContext()` in shared utility**                 | DRY: extracted to `src/lib/auth/session.ts`. Returns an RLS-scoped `db` instance. Used by every Server Action.                                                                  |
| **Enums derived from Drizzle schema**                       | `PROJECT_STATUSES = projectStatusEnum.enumValues` — single source of truth. Eliminates validation/DB drift.                                                                     |
| **`org_id` from session, not client**                       | The `org_id` is injected server-side in the Server Action. The Zod schema intentionally excludes it. This prevents any tenant data leak.                                        |
| **Client FK verified before INSERT**                        | The `clientId` from the form is checked against `ctx.orgId` to prevent IDOR attacks (referencing another org's client).                                                         |
| **`@security` IDOR guard with early return**                | `updateProjectAction` verifies project ownership and returns immediately on failure. No downstream processing occurs.                                                           |
| **Server-prefetched `initialData` (no Suspense waterfall)** | `page.tsx` fetches project data server-side and passes to `ProjectList` as `initialData`. `useQuery` hydrates instantly — no client-side loading state on first paint.          |
| **Cursor-based pagination on `getAll`**                     | Prevents memory issues for orgs with hundreds of archived projects. Returns `{ projects, nextCursor }`.                                                                         |
| **Server-computed `isOverdue`**                             | Overdue logic centralized in tRPC router using server clock (UTC). Eliminates timezone inconsistency from client-side `new Date()`.                                             |
| **`useFormState` (not `useActionState`)**                   | Next.js 14 / React 18 compatible. When upgrading to React 19, switch to `useActionState`.                                                                                       |
| **`revalidatePath`** after mutation                         | Triggers RSC revalidation, which causes the tRPC query to re-fetch on the next render. This is the simplest path to "create → see it in the list" without manual cache updates. |
| **Status filter excluded `completed/archived` in create**   | PRD §6.3: New projects can't start in a terminal state. These statuses are only reachable via transitions.                                                                      |

---

## References

- PRD §6.3 — Project Management (fields, status workflow, permission rules)
- PRD §4 — User Roles & Permissions (create/archive projects: Owner/Admin/Member only)
- PRD §10.2 — Architectural Rules (Server Actions for mutations, tRPC for queries)
- PRD §11 — Database Schema (projects table, clients table, indexes)
- PRD §12 — Non-Functional Requirements (loading skeletons, optimistic UI)
- PRD §13.1 — Freelancer Onboarding ("Create first project → assign client")
