<div align="center">

<img src="./public/logo.svg" alt="ClientSpace Logo" width="80" />

# ✦ ClientSpace

**The modern client management platform for freelancers & agencies.**  
Projects · Invoices · Contracts · Files · Real-time Collaboration — all in one workspace.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![tRPC](https://img.shields.io/badge/tRPC-v11-398CCB?style=flat-square)](https://trpc.io/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square)](https://orm.drizzle.team/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

</div>

---

## 📖 What is ClientSpace?

**ClientSpace** is a full-stack SaaS platform built for freelancers and small agencies who need a professional, centralized workspace to manage their clients, projects, invoices, and deliverables — without juggling ten different tools.

Clients get their own **white-labeled portal** to view project status, approve assets, sign contracts, and pay invoices. You get a powerful dashboard with AI-powered project health analysis, real-time collaboration, and deep analytics.

---

## ✨ Features

### 🏢 Organization & Multi-Tenancy
- Multi-org support with role-based access control (`owner`, `admin`, `member`)
- Custom **white-label domains** per organization (via Vercel Domains API)
- Organization-level branding (logo, colors, portal preview)
- Team invitations with secure token-based onboarding

### 👥 Client Management
- Full client lifecycle: lead → active → archived
- Client detail sheets with contact info, activity history, and notes
- Client-specific portals with isolated, secure access
- CSAT response tracking and client health metrics

### 📁 Project Management
- Create & manage projects with statuses, priorities, and milestones
- **Kanban milestone board** with drag-and-drop (dnd-kit)
- Real-time presence indicators so you know who's online
- AI-powered **Project Health Analysis** via Google Gemini — nightly risk scoring (budget, schedule, velocity)
- Project-level permissions and member management

### 📄 File Management & Approvals
- File upload with versioning and folder organization
- Per-file approval workflow (`pending → approved / needs_revision`)
- File type detection, previews, and download management
- Comments & threaded discussions on individual files

### 📑 Contracts
- Rich-text contract builder with PDF generation
- Secure **e-signature** flow for clients (token-authenticated signing page)
- Audit trail with cryptographic hash verification
- Automated email delivery via Resend

### 🧾 Invoices
- Invoice builder with line items, tax, and currency support
- **PDF generation** via `@react-pdf/renderer` + Inngest background jobs
- Stripe Connect integration for online payments
- Invoice status lifecycle: `draft → sent → paid → overdue`
- Financial summary charts with animated sparklines

### 🔔 Notifications
- Granular notification preference centre (per-event, per-channel)
- In-app notification feed + email delivery
- Real-time updates via Supabase Realtime subscriptions
- Activity log across all workspace entities

### 📊 Analytics & Reporting
- Dashboard with revenue metrics, project stats, and client overview
- Interactive charts (Recharts) with smooth count-up animations
- Exportable PDF reports for projects

### 🔐 Security
- **Row Level Security (RLS)** enforced at the database layer via Drizzle
- JWT blocklist via Upstash Redis for instant token revocation
- Rate limiting on all mutation endpoints
- MFA/TOTP support for admin & owner roles
- Timing-safe comparisons and CSRF protection
- Auth audit log with append-only event sourcing

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4, shadcn/ui, Radix UI |
| **Animation** | Framer Motion, GSAP, Motion |
| **API** | tRPC v11 + TanStack Query v5 |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Drizzle ORM |
| **Auth** | Supabase Auth (email/OTP, OAuth) |
| **Background Jobs** | Inngest |
| **Caching / Rate Limiting** | Upstash Redis |
| **Email** | Resend + React Email |
| **Payments** | Stripe Connect |
| **AI** | Google Gemini API |
| **File Storage** | Supabase Storage |
| **PDF Generation** | @react-pdf/renderer |
| **Testing** | Vitest |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) `>= 1.0`
- [Node.js](https://nodejs.org/) `>= 18`
- A [Supabase](https://supabase.com/) project
- An [Upstash Redis](https://upstash.com/) database
- A [Resend](https://resend.com/) account
- A [Stripe](https://stripe.com/) account (for payments)
- A [Google AI Studio](https://aistudio.google.com/) key (for Gemini AI health analysis)

### 1. Clone the Repository

```bash
git clone https://github.com/Mayank-Radadiya/ClientSpace.git
cd ClientSpace
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in all the values in `.env.local`:

```ini
# Supabase (Auth & DB)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Database (Drizzle)
DATABASE_URL="postgresql://postgres.your-project:your-password@aws-1-region.pooler.supabase.com:5432/postgres"

# Upstash Redis (caching + rate limiting)
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Resend (transactional email)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# Inngest (background jobs)
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""

# Stripe (payments)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google Gemini (AI project health)
GEMINI_API_KEY="AIza..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
INTERNAL_API_SECRET="your-internal-api-secret"
```

### 4. Set Up the Database

```bash
# Generate migration files
bun run db:generate

# Apply migrations to your Supabase database
bun run db:migrate

# (Optional) Seed with sample data
bun run db:seed
```

### 5. Start the Development Server

```bash
bun run dev
```

The app will be running at **[http://localhost:3000](http://localhost:3000)**.

---

## 📂 Project Structure

```
clientspace/
├── src/
│   ├── app/                    # Next.js App Router pages & layouts
│   │   ├── (auth)/             # Auth routes: login, signup, onboarding
│   │   ├── (dashboard)/        # Protected workspace: projects, clients, invoices
│   │   ├── (client)/           # Client portal: isolated, white-labeled views
│   │   ├── (marketing)/        # Public landing page
│   │   └── api/                # API routes (tRPC, Inngest, Stripe webhooks)
│   │
│   ├── features/               # Feature-based modules (self-contained)
│   │   ├── auth/               # Login, signup, OTP, password reset
│   │   ├── clients/            # Client CRUD, notes, portal access
│   │   ├── projects/           # Projects, milestones, members, health
│   │   ├── invoices/           # Invoice builder, PDF, Stripe payments
│   │   ├── contracts/          # Contract builder, e-signing, audit trail
│   │   ├── files/              # File uploads, versioning, approvals
│   │   ├── comments/           # Threaded comments on files & projects
│   │   ├── notifications/      # In-app & email notifications
│   │   ├── analytics/          # Dashboard metrics and charts
│   │   ├── billing/            # Stripe Connect & subscription management
│   │   ├── organizations/      # Org settings, members, custom domains
│   │   └── settings/           # Branding, preferences
│   │
│   ├── db/                     # Drizzle schema, migrations, client factory
│   ├── lib/                    # Auth helpers, tRPC client/server, Redis, utils
│   ├── emails/                 # React Email templates
│   ├── inngest/                # Background job functions (PDF gen, health analysis)
│   └── components/             # Shared UI components (shadcn/ui based)
│
├── drizzle/                    # SQL migration files
├── supabase/                   # Supabase config & edge functions
├── docs/                       # Architecture & implementation docs
└── scripts/                    # Utility scripts
```

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with Turbopack |
| `bun run build` | Create production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run test` | Run Vitest test suite |
| `bun run test:watch` | Run tests in watch mode |
| `bun run db:generate` | Generate Drizzle migration files |
| `bun run db:migrate` | Apply migrations to the database |
| `bun run db:push` | Push schema directly (dev only) |
| `bun run db:studio` | Open Drizzle Studio (DB GUI) |
| `bun run db:seed` | Seed database with sample data |
| `bun reset.ts` | ⚠️ Wipe all data from Supabase (dev only) |

---

## 🚢 Deployment

### Deploy on Vercel (Recommended)

1. Push your repository to GitHub
2. Import it on [vercel.com](https://vercel.com/new)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Deploy — Vercel will automatically detect the Next.js project

> **Custom Domain Support:** ClientSpace supports white-labeling via the Vercel Domains API. Each organization can connect their own domain which gets routed to their isolated client portal.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by [Mayank Radadiya](https://github.com/Mayank-Radadiya)

</div>
