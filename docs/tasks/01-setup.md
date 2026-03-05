# Task 01 — Project Initialization & Setup

> **Phase:** 1 · Foundation
> **Priority:** Critical — blocks all subsequent tasks
> **Depends on:** None (first task)

---

## Objective

Initialize the Next.js 14+ (App Router) project with Bun, install the full PRD tech stack, configure environment variables, and scaffold the "Feature-Sliced" directory structure.

---

## Description

ClientSpace is a fully managed B2B SaaS client portal. This task establishes the foundation: a clean Next.js project with TypeScript strict mode, Tailwind CSS, all core dependencies installed, and a folder structure designed for scale.

---

## Tech Stack (PRD §10)

### Core Framework

- `next` (latest) — App Router, Server Components
- `react` / `react-dom` (latest)
- `typescript` (strict mode)
- `bun` — Runtime & Package Manager

### Styling & UI

- `tailwindcss` / `postcss` / `autoprefixer`
- `shadcn/ui` (CLI init)
- `framer-motion` / `@auto-animate/react` — Animations
- `sonner` — Toasts
- `cmdk` — Command Palette
- `vaul` — Mobile Drawers
- `recharts` — Charts
- `lucide-react` — Icons

### Forms & Data

- `react-hook-form` / `@hookform/resolvers` / `zod`
- `nuqs` — URL State

### Backend & DB

- `@trpc/server` / `@trpc/client` / `@trpc/react-query`
- `@tanstack/react-query`
- `drizzle-orm` / `drizzle-kit` / `postgres`
- `@supabase/supabase-js` / `@supabase/ssr`

### Infrastructure

- `resend` / `@react-email/components`
- `inngest` — Background Jobs
- `@react-pdf/renderer`
- `@upstash/ratelimit` / `@upstash/redis`

---

## Step-by-Step Instructions

### Step 1 — Initialize Next.js Project

```bash
# Initialize with Bun
bun create next-app ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Step 2 — Install Core Dependencies

```bash
# UI & Styling
bun add framer-motion @auto-animate/react sonner cmdk vaul recharts clsx tailwind-merge lucide-react

# Forms & Validation
bun add react-hook-form @hookform/resolvers zod nuqs date-fns react-dropzone

# Data Layer (tRPC, Query, ORM)
# NOTE: @trpc/next is for Pages Router only — do NOT install it.
# App Router uses @trpc/server + @trpc/client + @trpc/react-query with a manual TanStack Query provider.
bun add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
bun add drizzle-orm postgres
bun add -d drizzle-kit

# Auth & Database
bun add @supabase/supabase-js @supabase/ssr

# Infrastructure (Email, Jobs, PDF, Redis)
bun add resend @react-email/components
bun add -d react-email
bun add inngest
bun add @react-pdf/renderer
bun add @upstash/ratelimit @upstash/redis

# Dev Tools
bun add -d prettier prettier-plugin-tailwindcss
```

### Step 3 — Initialize shadcn/ui

```bash
# Use --bun flag to ensure compatibility
bunx --bun shadcn@latest init
```

**Configuration:**

- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

**Install Primitives:**

```bash
bunx --bun shadcn@latest add button card input label textarea select badge dialog dropdown-menu separator avatar tabs tooltip sheet skeleton table
```

### Step 4 — Clean Up Boilerplate

1. **Clear `src/app/globals.css`**: Keep only `@tailwind` directives.

2. **Clear `src/app/page.tsx`**: Replace with:

```tsx
export default function Home() {
  return <h1>ClientSpace Setup Complete</h1>;
}
```

3. **Update `src/app/layout.tsx`**:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClientSpace",
  description: "Client Portal for Freelancers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

### Step 5 — Environment Configuration

Create `.env.local`:

```ini
# Supabase (Auth & DB)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# ⚠️ DANGER: BYPASSES ALL POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES.
# USE ONLY IN BACKGROUND JOBS / WEBHOOKS (e.g., Inngest functions, Stripe webhooks).
# NEVER use this key to initialize a Supabase client inside a Server Action or page.
SUPABASE_SERVICE_ROLE_KEY=

# Drizzle (Transaction Pooler - Port 6543)
# If migrations fail with "prepared statement" errors, swap to Session Pooler (Port 5432)
DATABASE_URL=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend
RESEND_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Internal API Secret (used for server-to-server PDF generation calls)
# Generate with: openssl rand -hex 32
INTERNAL_API_SECRET=
```

Run `cp .env.local .env.example` to save the template.

### Step 6 — Config Files

**1. `tsconfig.json`**: Ensure strict mode.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**2. `drizzle.config.ts`**:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**3. `package.json` Scripts**:

Add the following scripts block:

```json
"scripts": {
  "preinstall": "npx only-allow bun",
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

> **Why `preinstall`?** The `npx only-allow bun` hook aborts any `npm install` or `yarn install` invocation with a clear error, preventing a stale `package-lock.json` from causing dependency resolution conflicts.

### Step 7 — Feature-Sliced Folder Structure

Execute the following commands to scaffold the application architecture:

```bash
# 1. Feature Modules (The Logic)
# Create core feature folders without barrel files to encourage explicit imports
mkdir -p src/features/auth/{components,server,hooks}
mkdir -p src/features/onboarding/{components,server,hooks}
mkdir -p src/features/projects/{components,server,hooks,utils}
mkdir -p src/features/files/{components,server,hooks,utils}
mkdir -p src/features/invoices/{components,server,hooks,utils}
mkdir -p src/features/clients/{components,server,hooks}
mkdir -p src/features/comments/{components,server,hooks}
mkdir -p src/features/notifications/{components,server,hooks}
mkdir -p src/features/activity/{components,server}
mkdir -p src/features/settings/{components,server}

# 2. App Routing (The Views)
# Auth
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/signup
mkdir -p src/app/\(auth\)/verify
mkdir -p src/app/\(auth\)/reset-password

# Dashboard (Protected)
mkdir -p src/app/\(dashboard\)/dashboard
mkdir -p src/app/\(dashboard\)/projects/[projectId]/{files,invoices,activity}
mkdir -p src/app/\(dashboard\)/clients/[clientId]
mkdir -p src/app/\(dashboard\)/invoices/[invoiceId]
mkdir -p src/app/\(dashboard\)/settings/{branding,team,billing}

# Client Portal
mkdir -p src/app/\(client\)/portal/projects/[projectId]
mkdir -p src/app/\(client\)/portal/invoices

# Public
mkdir -p src/app/\(public\)/invite/[token]
mkdir -p src/app/\(public\)/share/[token]

# API
mkdir -p src/app/api/trpc/[trpc]
mkdir -p src/app/api/inngest
mkdir -p src/app/api/webhooks/stripe

# 3. Infrastructure
mkdir -p src/db
mkdir -p src/lib
mkdir -p src/trpc
mkdir -p src/inngest
mkdir -p src/config
mkdir -p src/emails
mkdir -p src/types
mkdir -p src/components/layout
```

### Step 8 — Placeholder Files

Create these files to prevent import errors and scaffold critical security patterns on Day 1:

```bash
touch src/db/schema.ts
touch src/db/index.ts
touch src/db/seed.ts
touch src/db/createDrizzleClient.ts
touch src/config/plans.ts
# src/lib/utils.ts should already exist from shadcn init
```

**`src/db/createDrizzleClient.ts`** — The mandatory secure factory stub (PRD §10.2):

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// PRD §10.2: All database access MUST go through this factory.
// It MUST be called with a sessionContext that carries the authenticated user's ID
// so that Drizzle can set the `app.current_user_id` Postgres config variable,
// which the RLS policies depend on.
//
// NEVER export a bare `drizzle(...)` instance from this file or src/db/index.ts.
// Direct instantiation bypasses Row Level Security and is BANNED.
export function createDrizzleClient(sessionContext: { userId: string }) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(sql, { schema });
  // TODO (Task 03): Execute `SET app.current_user_id = '${sessionContext.userId}'`
  // before returning db, to activate RLS policies.
  void sessionContext; // Remove this line once RLS is wired in Task 03.
  return db;
}
```

**`src/db/seed.ts`** — Dummy data script stub (PRD §12):

```ts
// Seed script: populates the database with dummy data for local development.
// Required by PRD §12 to test the Activity Timeline and other data-dependent features.
// TODO (Task 02): Implement after schema is defined.
async function seed() {
  console.log(
    "🌱 Seed not yet implemented — add dummy data here after Task 02.",
  );
}

seed().catch(console.error);
```

Add the seed script to `package.json`:

```json
"db:seed": "bun src/db/seed.ts"
```

### Step 9 — ESLint Boundaries

Install and configure `eslint-plugin-boundaries` to programmatically enforce the import direction rules from PRD §10.2 (`app/ → features/ → lib/`):

```bash
bun add -d eslint-plugin-boundaries
```

Add to `.eslintrc.json` (or `eslint.config.mjs`):

```json
{
  "plugins": ["boundaries"],
  "settings": {
    "boundaries/elements": [
      { "type": "app", "pattern": "src/app/**" },
      { "type": "features", "pattern": "src/features/**" },
      { "type": "lib", "pattern": "src/lib/**" },
      { "type": "db", "pattern": "src/db/**" },
      { "type": "ui", "pattern": "src/components/**" }
    ]
  },
  "rules": {
    "boundaries/element-types": [
      "error",
      {
        "default": "disallow",
        "rules": [
          { "from": "app", "allow": ["features", "lib", "db", "ui"] },
          { "from": "features", "allow": ["lib", "db", "ui"] },
          { "from": "lib", "allow": ["db"] }
        ]
      }
    ]
  }
}
```

> This blocks any `import` from `src/features/` into `src/app/` as a lint error, preventing accidental coupling of the routing layer with the business logic layer.

---

## Architectural Rules — Feature-Sliced Architecture

> **The Golden Rule: `src/app/` is for ROUTING. `src/features/` is for LOGIC.**

### 1. Routing Layer (`src/app/`)

- `page.tsx` files contain **zero business logic**.
- They fetch data and render a Feature Component.
- Example: `src/app/(dashboard)/projects/page.tsx` → `import { ProjectListPage } from "@/features/projects/components/ProjectListPage"`.

### 2. Feature Layer (`src/features/{domain}/`)

Each business domain gets a folder with a **fractal inner structure**:

| Sub-folder    | Purpose                                                   |
| ------------- | --------------------------------------------------------- |
| `components/` | React components scoped to this feature                   |
| `server/`     | Server Actions, data queries (`actions.ts`, `queries.ts`) |
| `hooks/`      | Custom React hooks scoped to this feature                 |
| `utils/`      | Helper functions scoped to this feature                   |

> **⚠️ No `index.ts` barrel files in features.** Next.js App Router tree-shaking can leak Server Actions into client bundles when client + server exports are mixed in a single barrel. Use explicit deep imports:
>
> ```ts
> // ✅ Correct — explicit deep import
> import { ProjectCard } from "@/features/projects/components/ProjectCard";
>
> // ❌ Avoid — barrel re-export breaks code splitting
> import { ProjectCard } from "@/features/projects";
> ```

### 3. Shared Resources

- **`src/components/ui/`** — Generic UI primitives only (shadcn/ui). **No business logic.**
- **`src/components/layout/`** — Sidebar, Header, PageShell (shared chrome).
- **`src/lib/`** — Global singletons (Supabase client, Redis client, `cn()` helper).
- **`src/db/`** — Drizzle schema, client, seed. Single source of truth for data layer.
- **`src/trpc/`** — tRPC router configuration, context, middleware.
- **`src/inngest/`** — Inngest client, background functions.

### 4. Import Direction (Enforced)

```text
app/ → features/ → lib/ | db/ | components/ui/
         ↓
     (NEVER upward to app/)
```

---

## Validation Checklist

- [ ] Run `bun run dev`. Access `http://localhost:3000` → Should see "ClientSpace Setup Complete".
- [ ] Check `src/components/ui`. Should contain button, card, input, etc.
- [ ] Check `src/features/`. Should contain `auth`, `projects`, `invoices`, etc.
- [ ] Check `package.json`. Confirm all dependencies (Drizzle, Supabase, tRPC) are present. **Confirm `@trpc/next` is NOT listed.**
- [ ] Check `package.json`. Confirm `"preinstall": "npx only-allow bun"` is present.
- [ ] Run `npm install` in the project root → Should **fail** with an error from `only-allow`.
- [ ] Check `drizzle.config.ts`. Should point to `src/db/schema.ts`.
- [ ] Check `src/db/createDrizzleClient.ts` exists and exports a `createDrizzleClient` function.
- [ ] Check `src/db/seed.ts` exists.
- [ ] Run `bun lint`. Should pass with zero errors (eslint-plugin-boundaries installed).

---

## References

- PRD §10 — Technical Architecture (full stack listing)
- PRD §10.2 — Architectural Rules & Safety
- PRD §11 — Database Schema (folder/schema path convention)
- PRD §12 — Non-Functional Requirements (DX & Safety — seed.ts, plan_limits config)
