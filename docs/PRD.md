<style>
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --accent: #38bdf8;
    --border: #334155;
  }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.7;
    color: var(--text-secondary);
    background-color: var(--bg-primary);
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }
  h1, h2, h3, h4, th {
    color: var(--text-primary);
    font-family: 'Outfit', 'Inter', sans-serif;
    font-weight: 600;
  }
  h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--accent); }
  h2 { font-size: 1.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-top: 2.5rem; }
  h3 { font-size: 1.25rem; margin-top: 1.5rem; color: var(--text-primary); }
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 1.5rem 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  th, td {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
  }
  th { background-color: var(--bg-secondary); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; }
  td { background-color: rgba(30, 41, 59, 0.3); }
  th:last-child, td:last-child { border-right: none; }
  tr:last-child td { border-bottom: none; }
  blockquote {
    border-left: 4px solid var(--accent);
    margin: 1.5rem 0;
    padding: 1rem 1.5rem;
    background: var(--bg-secondary);
    border-radius: 0 0.5rem 0.5rem 0;
    color: var(--text-primary);
  }
  code {
    background-color: var(--bg-secondary);
    color: #e2e8f0;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 0.9em;
  }
  ul, ol { padding-left: 1.5rem; }
  li { margin-bottom: 0.5rem; }
</style>

# ClientSpace

### Product Requirements Document

| Version    | 3.0 — Final                         |
| :--------- | :---------------------------------- |
| **Status** | Approved for Development            |
| **Date**   | March 2026                          |
| **Stack**  | Next.js · Supabase · tRPC · Drizzle |

| 1\. Product Overview |
| :------------------- |

ClientSpace is a fully managed B2B SaaS client portal where freelancers and small agencies centralize project management, file delivery, approval workflows, and invoicing — replacing fragmented email chains, scattered Drive links, and lost invoices with a single, professional workspace.

| Core Value Proposition Give freelancers and agencies a polished, branded portal that makes them look professional, keeps clients informed without constant check-ins, and ensures invoices never get buried in email again. |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## **Value Pillars**

| Pillar                 | One-liner                                         | Key Metric                                           |
| :--------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| **Project Visibility** | Clients always know where their project stands    | Client login rate \> 60% within 7 days of invite     |
| **File Handoff**       | One clean place to deliver work and get approvals | 70%+ of uploaded files get an approval action        |
| **Getting Paid**       | Invoices tracked, never lost in email             | 60%+ of invoices paid directly via portal (Phase 2\) |
| **Professionalism**    | Clients see a branded, polished portal            | CSAT score \> 4.5 / 5 post-project                   |
| **Team Collaboration** | Members stay aligned without Slack noise          | Zero cross-client data exposure incidents            |

## **Business Model**

- Who pays: Freelancer / agency (subscription, per organization)

- Who uses free: Their clients (portal access at no charge — reduces adoption friction)

- Deployment: Fully managed SaaS — no self-hosting, no ops burden for users

- Free tier: Permanently free Starter plan; no trial expiry — freemium drives organic growth

| 2\. Problem Statement |
| :-------------------- |

Freelancers and agencies managing multiple clients face five compounding friction points:

| \#    | Problem                       | Impact                                                                                                                                                  |
| :---- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | **Communication Overload**    | Dozens of email threads per project bury decisions, approvals, and status updates. Clients re-ask questions already answered — consuming billable time. |
| **2** | **File Version Chaos**        | Files scattered across email, Dropbox, and Drive. Clients open stale versions and give feedback on already-rejected work.                               |
| **3** | **Zero Project Visibility**   | No self-serve way for clients to check status triggers endless "where are we?" emails — killing flow for the freelancer.                                |
| **4** | **Lost Invoices**             | PDF invoices sent via email get buried. No persistent record means disputes, late payments, and poor cash-flow visibility.                              |
| **5** | **Unprofessional Experience** | Personal Gmail \+ free Drive links make freelancers look amateur. Agency clients expect a branded, professional portal.                                 |

| 3\. Target Users |
| :--------------- |

## **3.1 Freelancers (Primary Paying User)**

| Attribute           | Detail                                                                                 |
| :------------------ | :------------------------------------------------------------------------------------- |
| **Examples**        | Web developers, UI/UX designers, photographers, copywriters, video editors             |
| **Team size**       | 1 person                                                                               |
| **Active clients**  | 2–15                                                                                   |
| **Core need**       | Simple project management \+ file delivery \+ invoicing in one place                   |
| **Pain points**     | Juggling 5+ tools, looking unprofessional, chasing late payments                       |
| **Jobs to be done** | Set up new client \+ project in under 5 min; know instantly which invoices are overdue |

## **3.2 Small Agencies (Primary Paying User)**

| Attribute           | Detail                                                                             |
| :------------------ | :--------------------------------------------------------------------------------- |
| **Examples**        | Design studios, dev shops, marketing agencies, content agencies                    |
| **Team size**       | 2–20 people                                                                        |
| **Active clients**  | 5–50                                                                               |
| **Core need**       | Team collaboration \+ multi-client management \+ client-facing portal              |
| **Pain points**     | No centralized client-facing workspace; internal tools don't face clients          |
| **Jobs to be done** | Assign team members per project; track client approvals; manage retainer invoicing |

## **3.3 Clients (Free End User)**

| Attribute           | Detail                                                                                   |
| :------------------ | :--------------------------------------------------------------------------------------- |
| **Examples**        | Business owners, startup founders, marketing managers                                    |
| **Core need**       | See project progress, download deliverables, review and pay invoices                     |
| **Pain points**     | No idea what's happening; can't find files; invoices buried in email                     |
| **Jobs to be done** | Check project status without emailing freelancer; find and download latest approved file |

## **3.4 Guest (NEW — Read-Only Stakeholder)**

| New Role A CEO or external stakeholder who needs to view project progress but must not interact with files or download content. Access via a shareable, non-expiring read-only link. No account required. |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| 4\. User Roles & Permissions |
| :--------------------------- |

ClientSpace uses 4-tier RBAC scoped to each organization. Database-level Row Level Security (RLS) enforces tenant isolation — cross-client data access is physically impossible at the query layer.

| Permission                         | Owner / Admin | Member | Client   | Guest    |
| :--------------------------------- | :------------ | :----- | :------- | :------- |
| Create & archive projects          | **✓**         | **✓**  | **✗**    | **✗**    |
| Invite / remove team members       | **✓**         | **✗**  | **✗**    | **✗**    |
| Invite clients                     | **✓**         | **✗**  | **✗**    | **✗**    |
| Upload files                       | **✓**         | **✓**  | **✗**    | **✗**    |
| Approve / request changes on files | **✓**         | **✓**  | **✓**    | **✗**    |
| Download files                     | **✓**         | **✓**  | **✓**    | **✓**    |
| Create invoices                    | **✓**         | **✗**  | **✗**    | **✗**    |
| View invoices                      | **✓**         | **✓**  | Own only | **✗**    |
| Leave comments                     | **✓**         | **✓**  | **✓**    | **✗**    |
| View activity timeline             | **✓**         | **✓**  | Filtered | Filtered |
| Manage branding                    | **✓**         | **✗**  | **✗**    | **✗**    |
| View analytics                     | **✓**         | **✗**  | **✗**    | **✗**    |
| Manage billing & plan              | Owner only    | **✗**  | **✗**    | **✗**    |

| Key Constraint A Client can never see another client's projects, files, or invoices. Members only see projects they are explicitly assigned to. Owner uniqueness: each org has exactly one Owner (transferable). |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| 5\. Organization & Multi-Tenancy Model |
| :------------------------------------- |

ClientSpace uses a multi-org model (similar to Slack workspaces). Every paying user creates at least one organization. A user may belong to multiple organizations. Billing is per organization, not per user.

## **Onboarding Flow**

1. Sign up with email \+ password

2. Verify email address

3. Create first organization (name, type: Freelancer or Agency)

4. Guided onboarding: Add first client → Create first project → Upload first file

5. Land on populated Admin Dashboard

| 6\. Core Features — Phase 1 (MVP) |
| :-------------------------------- |

## **6.1 Authentication**

Email \+ password login with secure bcrypt hashing (cost factor 12). Session-based auth via HTTP-only secure cookies with 30-day rolling expiry. CSRF protection on all mutations.

- **Magic Links for Clients (Phase 1 Essential):** Passwordless login via email links.
  - **Login Link:** One-time use, expires in 15 minutes. Exchanges for a long-lived session cookie (30 days).
  - **Invitation Link:** Expires in 72 hours.

- Password reset via emailed time-limited token

- Invite tokens: single-use, HMAC-signed, 72-hour expiry

- Rate limiting: 20 req/min on auth endpoints; 100 req/min per authenticated user

- OAuth (Google \+ GitHub) deferred to Phase 2 to reduce MVP scope

## **6.2 Client Invitation System**

Clients cannot sign up publicly. Access is fully controlled by the admin.

6. Admin creates client profile (name, email, company name)

7. System sends invitation email with secure signed token link

8. Client clicks link → sets password → account activated

9. Client lands on their dashboard (only sees their assigned projects)

- Invitation tokens expire after 72 hours

- Admin can resend or revoke invitations (soft-delete: data preserved, login disabled)

- Client email must be unique within the organization

- One client can be assigned to multiple projects within the same org

## **6.3 Project Management**

| Field                | Type                  | Required | Notes                                                                 |
| :------------------- | :-------------------- | :------- | :-------------------------------------------------------------------- |
| **Project name**     | String (max 100\)     | **Yes**  |                                                                       |
| **Description**      | Rich text (max 5,000) | **Yes**  | Markdown supported                                                    |
| **Client**           | FK → clients          | **Yes**  | One client entity per project (Phase 2: Multi-contact per client org) |
| **Assigned members** | FK → members (multi)  | **Yes**  | Multiple members allowed                                              |
| **Start date**       | Date                  | **No**   |                                                                       |
| **Deadline**         | Date                  | **Yes**  | Triggers overdue indicator                                            |
| **Status**           | Enum                  | **Yes**  | Default: Not Started                                                  |
| **Priority**         | Enum                  | **Yes**  | Low / Medium / High / Urgent                                          |
| **Milestones**       | Array (ordered)       | **No**   | With due dates \+ checkboxes                                          |
| **Budget**           | Decimal               | **No**   | Display only — no auto-calculation                                    |
| **Tags**             | String array          | **No**   | For filtering in admin dashboard                                      |

**Status Workflow**

Not Started → In Progress → Review → Completed

         ↓                    ↓

      On Hold              Archived

- Only Owner/Admin can transition to Completed or Archived

- Members can move between Not Started, In Progress, Review, On Hold

- Clients can see status but cannot change it

- All status changes are logged in the Activity Timeline

## **6.4 File Sharing & Approval System**

| Attribute           | Specification                                                                                                                                                                    |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Max file size**   | 50 MB (Starter), 75 MB (Pro), 100 MB (Growth), Unlimited (Business)                                                                                                              |
| **Allowed types**   | Images (PNG, JPG, SVG, WebP, GIF), Docs (PDF, DOCX, XLSX, PPTX), Archives (ZIP, RAR), Design (PSD, AI, Figma, Sketch)                                                            |
| **Storage per org** | 2 GB (Starter) · 10 GB (Pro) · 25 GB (Growth) · **Unlimited BYOS (Bring Your Own Storage - AWS S3 / R2)** for Business                                                           |
| **BYOS Security**   | Strict CORS policy JSON provided. Auto-validate with 1KB test op on save. Client-Side Presigned Post URLs used for direct `Browser -> S3` uploads (server never touches binary). |
| **URL security**    | Supabase signed URLs, 1-hour expiry, regenerated on-demand                                                                                                                       |
| **Versioning**      | `assets` table (stable ID) \+ `file_versions` table. UI shows generic names (e.g. "Main Logo") with dropdown history.                                                            |
| **Soft delete**     | Recoverable for 30 days. Supabase: Auto-delete via Bucket Lifecycle Rule. BYOS: UI disclaimer shown.                                                                             |

**"WeTransfer" Style Handoff (Quick Share)**
Allow "Quick Share" where a file group is accessible via a public (password-optional) link outside the dashboard UI for stakeholders who refuse to log in.

- **Expiration:** Hard-coded to expire in **7 days** (non-configurable).
- **Watermark:** Preview overlaid with a "Viewed via ClientSpace Guest Link" banner.
- **Upsell Nudge:** Viewing a Quick Share link 3 times triggers a prompt: _"Want to see previous versions? Ask [Freelancer Name] for a portal invite."_

**Approval Workflow ("Digital Signature" Ceremony)**

10. Member/Admin uploads file → status \= "Pending Review"
    - **Auto-Approval:** Optional setting per file to "Auto-approve after 5 business days if no action taken", logging an automated timeline event to unblock agencies.

11. Client receives in-app and email notification

12. Client views file → clicks "Approve" or "Request Changes"

13. If approved → **"Slide to Approve" Interaction:** Physical slider mechanism (e.g. "Slide to Approve v2"). Dragging the handle confirms approval, capturing IP address \+ timestamp. Feedback includes haptic click/confetti, and status badge instantly flips to Green/Approved. _Dev Note: Ensure the slider component has `touch-action: none;` to prevent the browser from hijacking the gesture on mobile._

14. If changes requested → client leaves comment → status \= "Changes Requested" → member notified.
    - **Visual Feedback:** For images/PDFs, Point-and-Click Annotations allow clients to click _on_ a specific area and type (e.g., using `react-image-annotation`).

15. Member uploads new version → cycle repeats

- Clients can view and download all files in their assigned projects

- Clients CAN upload reference files strictly to a dedicated "Client Uploads" sub-folder (prevents root folder clutter while ensuring a frictionless feedback loop)

- Folder structure: each project has a root folder; admins can create subfolders

## **6.5 Invoice Management**

| Field              | Type             | Required | Notes                                                                                 |
| :----------------- | :--------------- | :------- | :------------------------------------------------------------------------------------ |
| **Invoice number** | Auto-generated   | **Yes**  | Sequence based on org.next_invoice_number (e.g., 1001). Configurable starting number. |
| **Client**         | FK → clients     | **No**   | Invoice can exist without a project                                                   |
| **Line items**     | Array            | **Yes**  | Description \+ qty \+ unit price                                                      |
| **Tax rate**       | Integer (Basis)  | **No**   | Basis points (e.g., 5.5% = 550)                                                       |
| **Currency**       | ISO 4217         | **Yes**  | Default: USD                                                                          |
| **Amount**         | Integer (Cents)  | **Yes**  | Stored in cents (e.g., 1000 = $10.00)                                                 |
| **Status**         | Enum             | **Yes**  | Draft → Sent → Paid / Overdue                                                         |
| **Due date**       | Date             | **No**   | Triggers auto-overdue cron                                                            |
| **Notes**          | Text (max 1,000) | **No**   | Payment terms, instructions                                                           |

- Auto-generated PDF with org branding (logo \+ accent color)

- Downloadable by both admin and client

- System auto-flags overdue invoices daily via cron job (due_date \< today AND status \= "Sent")

- Automatic email reminders: 7 days before due, and on the day it becomes Overdue

- Phase 1: Admin manually marks invoices as Paid. Stripe direct payment in Phase 2\.

## **6.6 Comments**

Comments exist at two levels:

- Project-level comments — general discussion about the project

- File-level comments — targeted feedback on a specific uploaded file

- All 4 roles can comment on projects/files they have access to

- Supports @mentions — mentioned users receive in-app notification

- Threaded replies supported (max 2 levels deep)

- Comments are NOT deletable by the author (preserves audit trail integrity)

- Admins can hide inappropriate comments (soft-delete with placeholder)

## **6.7 Activity Timeline**

Every project maintains a chronological, immutable activity log — the source of truth for dispute resolution.

| Event Type                 | Example Entry                                                 |
| :------------------------- | :------------------------------------------------------------ |
| **Project created**        | "Sarah created project Website Redesign"                      |
| **Status changed**         | "Sarah changed status from In Progress to Review"             |
| **File uploaded**          | "Mike uploaded logo-v2.png"                                   |
| **File approved**          | "Client approved logo-v2.png"                                 |
| **Changes requested**      | "Client requested changes on homepage-draft.pdf"              |
| **Comment added**          | "Sarah commented on Website Redesign"                         |
| **Invoice created**        | "Sarah created Invoice INV-CS-004"                            |
| **Invoice status changed** | "Invoice INV-CS-004 marked as Paid"                           |
| **Member assigned**        | "Sarah assigned Mike to Website Redesign"                     |
| **Client invited**         | "Sarah invited alex@startup.com"                              |
| **Milestone completed**    | "Mike marked Wireframes milestone as complete"                |
| **CSAT submitted**         | "Client submitted CSAT survey for Website Redesign" (Phase 2) |

- Display: reverse chronological, grouped by date, filterable by event type

- Clients see a filtered view (no internal-only events like member assignments)

## **6.8 Notifications**

**Smart Batching (Spam Prevention)**

- Implementation of **Inngest** for durable execution and background jobs to batch events.
- Events trigger a `.step.sleep('5m')` function. Subsequent events for the same project/user within the window are merged.
- Example: "Sarah uploaded 'Logo-v1.png' and 4 other files." (Instead of 5 separate emails).

**In-App Notifications**

- Uses **`sonner`** for modern toast notifications (e.g., "Link Copied", "File Saved", "Invoice Sent") with swipe-to-dismiss.
- Bell icon with unread count badge

- Events: file uploaded, file approved/rejected, comment posted, invoice created/overdue, project status changed, @mention

- Mark as read / mark all as read

- Each notification links to the relevant project/file/invoice

**Email Notifications**

- Transactional emails via Resend for all notification event types (Templates built beautifully using **`react-email`**)

- Configurable per user: All / Important Only / None

- "Important Only" \= invoice created, file approved, project completed

- Unsubscribe link in every email; one-click re-subscribe from settings

## **6.9 Admin Dashboard**

- **"View as Client" Toggle:** Persistent toggle `[ 👁️ View as Client ]` in the Navbar. Dynamically reloads the UI mocking the Client's RLS permissions to completely remove freelancer anxiety before sharing portals.
- **Global Search (Cmd+K):** Fast command menu (via `cmdk`) allowing power users to jump instantly across projects, invoices, and clients without touching the mouse.
- **Project Health Score:** Colored ring (1-100) aggregating pending approvals, upcoming deadlines, and invoice status per project for instant triage oversight.
- Overview cards: Active projects count, pending approvals, total outstanding, overdue invoices

- Revenue chart: 30/60/90 day selectable view

- Projects needing attention: overdue deadline, pending file approvals, unsent invoices

- Quick actions: Create project, Invite client, Create invoice

- Recent activity feed: last 20 events across all projects

## **6.10 Client Dashboard**

- **"What Happens Next" Banner:** Contextual next-action prompt (e.g., "Mike is waiting for your approval on Logo v3 — takes 30 seconds") to radically increase daily engagement rates.

- Active Projects — cards with status, deadline, and progress indicator

- Recent Files — last 5 uploads across projects with approval status badges

- Invoices — open/overdue invoices with amounts and due dates highlighted

- Recent Activity — last 10 activity events across their projects

- No sidebar navigation for clients — single scrollable page, zero learning curve

- Overdue invoices highlighted with warning badge

- Empty states with clear messaging ("No files yet — your team is working on it\!")

- **The Upsell Loop:** When a project status is "Completed," display a prominent CTA card: _"Need more work? Request a Phase 2 or Retainer."_ This turns a passive repository into a lead generation tool for the freelancer.

## **6.11 Organization Branding (Basic)**

- Logo upload: displayed in client portal header and invoice PDFs (max 2 MB, PNG/SVG/JPG)

- Accent color: single hex color applied to buttons, links, status badges in client portal

- Organization name shown in portal header and invitation emails

- Custom subdomains (e.g., `portal.agency.com`) available on Pro/Growth/Business minimum tiers. Full white-label (ClientSpace branding removal) deferred to Phase 3.

- **"Powered by ClientSpace" Viral Loop:** Starter tier includes a discreet branded footer on client portals with a referral link.

| 7\. Phase 2 Features |
| :------------------- |

_Engineering Note: Phase 2 contains six "High" priority items carrying non-trivial dependency risks. To mitigate execution risk in a 3-month window, these will be sequenced sequentially during sprint planning, prioritizing revenue and access blockers (Stripe + OAuth) in Phase 2a, and moving complex schema expansions (E-Signature, Multi-Contact) to Phase 2b._

| Feature                         | Description                                                                                                                                                                                          | Priority   |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **Stripe Payment Integration**  | Clients pay invoices directly via Stripe Checkout (card \+ ACH). Stripe webhook auto-updates invoice to Paid. Stripe Connect (Standard) — no platform fee, users pay Stripe fees directly.           | **High**   |
| **OAuth Login**                 | Google and GitHub OAuth. Account linking (connect OAuth to existing email/password account).                                                                                                         | **High**   |
| **Custom Domains**              | Subdomain proxying (portal.youragency.com). Highly critical for professional agency branding.                                                                                                        | **High**   |
| **WhatsApp/SMS Reminders**      | Automated payment and approval reminders via WhatsApp/SMS to drastically improve open rates and response times.                                                                                      | **High**   |
| **E-Signature Workflows**       | Built-in contract signing for project agreements and SOWs. Basic IP-capture checkbox to cover 80% of workflows efficiently.                                                                          | **High**   |
| **Multi-Contact Clients**       | Expand the 1:1 client-to-project schema to allow multiple distinct client stakeholders per organization.                                                                                             | **High**   |
| **Built-in Messaging**          | Persistent threaded message board per project. Not real-time chat — async message threads with subject lines, flat replies, and file attachments. Email notifications for new messages.              | **Medium** |
| **Kanban Task Board**           | Per-project Kanban with columns per status. Drag-and-drop status changes. Filter by client, priority, deadline. Tasks have assignees, due dates, and file attachments. Clients view but cannot edit. | **Medium** |
| **Recurring Invoices**          | Auto-generate invoices on weekly/monthly/quarterly schedules. Stripe auto-charge optional. Admin can pause or cancel a recurring series.                                                             | **Medium** |
| **GitHub Integration (Plugin)** | Connect a GitHub repo to a project (opt-in per org). Read-only: displays last 10 commits, open PRs, recent closed issues. Auto-creates activity log entries for merged PRs. No write access.         | **Medium** |
| **Client Satisfaction (CSAT)**  | After project moves to Completed, client receives a 3-question survey. Aggregated CSAT score shown on client profiles.                                                                               | **Low**    |
| **Public Progress Page**        | Optional shareable link (no login required) showing project status and milestones.                                                                                                                   | **Low**    |
| **AI Project Summaries**        | On-demand AI summary of the project activity timeline.                                                                                                                                               | **Low**    |

| 8\. Phase 3 Features (Future) |
| :---------------------------- |

| Feature                                | Description                                                                                           |
| :------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Full White-Label**                   | Remove all ClientSpace branding. Complete custom branding for agency portals.                         |
| **"Embed Your Portal" Widget**         | A JS snippet providing a portal drawer directly on an agency's portfolio site (`<script src="...">`). |
| **Analytics Dashboard**                | Revenue trends, project completion rates, client activity heatmaps, file approval rates.              |
| **Recurring Billing with Auto-Charge** | Full Stripe Subscription integration for retainer clients.                                            |
| **Time Tracking**                      | Track hours per project. Auto-calculate invoice line items from tracked time.                         |
| **Public API \+ Webhooks**             | REST API for third-party integrations. Outgoing webhooks for key events (Zapier, HubSpot, Slack).     |
| **Mobile-Optimized PWA**               | Progressive Web App with offline support. Push notifications for clients on mobile.                   |

| 9\. Pricing |
| :---------- |

|                       | Starter $0 / mo | Pro $19 / mo      | Growth $35 / mo   | Business $49 / mo          |
| :-------------------- | --------------- | ----------------- | ----------------- | -------------------------- |
| **Active Projects**   | 3               | **15**            | **30**            | **Unlimited**              |
| **Clients**           | 5               | **10**            | **25**            | **Unlimited**              |
| **Team Members**      | 1 (Owner)       | **3**             | **5**             | **Unlimited**              |
| **Storage**           | 2 GB            | **10 GB**         | **25 GB**         | **Unlimited (BYOS S3/R2)** |
| **File Upload Limit** | 50 MB           | **75 MB**         | **100 MB**        | **Unlimited**              |
| **Invoices**          | 5 / month       | **Unlimited**     | **Unlimited**     | **Unlimited**              |
| **Branding**          | Logo \+ color   | **Logo \+ color** | **Custom Domain** | **Full white-label (P3)**  |
| **Stripe Payments**   | —               | **Phase 2**       | **Phase 2**       | **Phase 2**                |
| **Custom Domain**     | —               | **Included**      | **Included**      | **Included**               |
| **Priority Support**  | —               | **—**             | **—**             | **✓**                      |

- **Seat-Based Add-Ons:** Additional team members can be added to any paid plan for $8/month per seat.
- **Soft Limits & Grace Periods:** Attempting to exceed Starter limits (e.g., 4th project) triggers a 7-day grace period rather than a hard wall, dramatically improving upgrade conversion.
- **Viral Referral Loop:** Starter tier includes a "Powered by ClientSpace" footer on client portals to drive organic freelancer acquisition.

| 10\. Technical Architecture |
| :-------------------------- |

| Layer             | Stack                                                                                                                                                                                                                                                          |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | Next.js 14+ (App Router, Server Components) · React 18+ · TypeScript (strict mode) · Tailwind CSS · React Hook Form + Zod · **`nuqs`** (type-safe URL params) · **`auto-animate`** (list animations) · **`date-fns`** (dates) · **`framer-motion`** (gestures) |
| **UI Components** | shadcn/ui, Coss UI, Tripled UI, Magic UI, Spotlight Card, **`sonner`** (toasts), **`cmdk`** (command palette), **`vaul`** (mobile drawers), **`recharts`** (charts), **`react-dropzone`** (BYOS S3 uploads)                                                    |
| **Backend**       | Next.js API Routes + Server Actions · tRPC v11 · Optimistic UI Updates via TanStack Query · **`inngest`** (Durable background jobs) · **`@react-pdf/renderer`** (Server-side PDFs) · **`@vercel/og`** (Dynamic social preview images)                          |
| **ORM**           | Drizzle ORM — type-safe queries and migrations over PostgreSQL                                                                                                                                                                                                 |
| **Database**      | PostgreSQL via Supabase · Row Level Security (RLS) optimized via JWT Custom Claims (O(1) complexity) · Connection pooling via Supabase pooler                                                                                                                  |
| **Auth**          | Supabase Auth · Session cookies (HTTP-only, secure, 30-day rolling) · CSRF tokens on all mutations · bcrypt password hashing (cost factor 12\)                                                                                                                 |
| **Storage**       | Supabase Storage (S3-compatible) · Signed URLs with 1-hour expiry for secure file access                                                                                                                                                                       |
| **Email & SMS**   | Resend for transactional emails · **`react-email`** for building rich HTML email templates · WhatsApp Business API (Phase 2 reminders)                                                                                                                         |
| **Payments**      | Stripe Connect (Standard) — Phase 2 · Stripe Checkout for client payments · Webhook listener for payment confirmation                                                                                                                                          |
| **Hosting**       | Vercel for frontend \+ serverless functions · Supabase for database, auth, and storage                                                                                                                                                                         |
| **Rate Limiting** | Upstash Redis for rate limiting and caching                                                                                                                                                                                                                    |
| **Monitoring**    | Vercel Analytics · Supabase dashboard · Error tracking via Sentry (recommended)                                                                                                                                                                                |

### **10.1 Core Data Validation (Zod)**

```typescript
import { z } from "zod";

// Value Object for Money to prevent float math errors
const MoneySchema = z.number().int().min(0).describe("Amount in cents");

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.1, "Quantity must be positive"), // Allow fractional hours
  unit_price_cents: MoneySchema,
});

export const CreateInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  due_date: z.date().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]), // Expand as needed
  items: z.array(InvoiceItemSchema).min(1, "At least one item required"),
  notes: z.string().max(1000).optional(),
  // Tax rate is stored as basis points (e.g., 5.5% = 550) to avoid floats
  tax_rate_basis_points: z.number().int().min(0).max(10000).optional(),
});

// Helper to calculate totals safely on the server
export const calculateInvoiceTotal = (
  items: z.infer<typeof InvoiceItemSchema>[],
) => {
  return items.reduce((acc, item) => {
    return acc + Math.round(item.quantity * item.unit_price_cents);
  }, 0);
};
```

### **10.2 Architectural Rules & Safety**

- **Mutation Boundary:** Next.js Server Actions are strictly reserved for RSC form mutations (e.g., initial invoice creation). All client-side queries and real-time adjacent patterns must exclusively use tRPC to prevent pattern fragmentation.
- **Drizzle RLS Factory:** Bare Drizzle client instantiation is banned outside tests. All database access must use a secure factory pattern `createDrizzleClient(sessionContext)` that guarantees `app.current_org_id` is set, completely eliminating query-level data leaks.
- **Inngest Idempotency:** Every Inngest background job must explicitly derive an ID (e.g., `${orgId}:${projectId}:${eventType}`) to guarantee idempotency. This mathematically prevents duplicate emails (like invoicing overdue triggers) during Vercel cold-starts or webhook replays.
- **PDF Caching Mechanism:** Due to `@react-pdf/renderer` CPU overhead, PDFs are generated exactly _once_ upon 'Send' and pushed to Supabase Storage. Subsequent client requests return a cached signed URL rather than regenerating on the fly.
- **Edge Caching & Performance:** The Client Dashboard heavily utilizes React Query's SWR strategy alongside Next.js ISR (Incremental Static Regeneration) to guarantee < 1.0s LCP even in degraded 4G mobile states.
- **Invoice Sequence Lock:** Invoice number generation must natively use an atomic `UPDATE ... RETURNING` statement within the database transaction, never a read-modify-write in application code. This mathematically prevents TOCTOU race conditions where simultaneous drafts yield duplicate sequence numbers.

| 11\. Database Schema |
| :------------------- |

| Table                  | Key Fields                                                                                                                                                        |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **users**              | id, email, name, avatar_url, password_hash, created_at                                                                                                            |
| **organizations**      | id, name, slug, logo_url, accent_color, plan, owner_id, next_invoice_number, stripe_customer_id, custom_domain, whatsapp_enabled, ai_summaries_opt_in, created_at |
| **org_memberships**    | user_id, org_id, role (owner/admin/member/client)                                                                                                                 |
| **share_links**        | id, entity_type, entity_id, token, expires_at, created_by (Guest Read-Only access tokens)                                                                         |
| **clients**            | id, org_id, user_id, company_name, invited_at, status (active/revoked)                                                                                            |
| **projects**           | id, org_id, client_id, name, description, status, priority, deadline, budget, tags\[\]                                                                            |
| **milestones**         | id, project_id, title, due_date, completed, completed_at, order                                                                                                   |
| **project_members**    | project_id, user_id, assigned_at                                                                                                                                  |
| **assets**             | id, project_id, folder_id, name, type, current_version_id, approval_status, deleted_at                                                                            |
| **file_versions**      | id, asset_id, version_number, storage_path, size, uploaded_by, created_at                                                                                         |
| **folders**            | id, project_id, parent_id, name                                                                                                                                   |
| **comments**           | id, project_id, asset_id, author_id, body, parent_id, hidden, edited_at                                                                                           |
| **invoices**           | id, org_id, client_id, project_id, number, status, due_date, currency, amount_cents, tax_rate_basis_points, notes                                                 |
| **invoice_line_items** | id, invoice_id, description, quantity, unit_price_cents                                                                                                           |
| **activity_logs**      | id, project_id, org_id, actor_id, event_type, metadata (JSONB), created_at                                                                                        |
| **notifications**      | id, user_id, org_id, type, title, body, read, link, created_at                                                                                                    |
| **invitations**        | id, org_id, email, type (member/client/signer), token (UNIQUE), expires_at, accepted_at                                                                           |
| **csat_responses**     | id, project_id, client_id, score, feedback, created_at                                                                                                            |

**Key Relationships & Phase 2 Schema Stubs**

- users ↔ org_memberships ↔ organizations

- organizations → clients → projects → assets → comments

- projects → milestones, project_members, activity_logs, folders

- organizations → clients → invoices → invoice_line_items

- **org_memberships:** Role enum is strictly: `owner`, `admin`, `member`, `client`.
- **Foreign Keys:** All actor/author/uploaded_by fields across tables are strictly `FK → users.id`, non-nullable, to guarantee referential integrity for logs and comment tracking.
- **Guest Access:** Guests do not possess a user or membership record. Their access is managed entirely via the `share_links` table mapping tokens to specific entities.
- **Annotations:** Image/PDF visual annotations are stored inside the `comments` table using a `metadata JSONB` column (e.g., `{ x, y, width, height }`).
- **E-Signature (Phase 2):** Requires a `contracts` table stub (`id, project_id, org_id, signer_id, status, ip_address, signed_at, document_url`) populated in Phase 1 schema to prevent destructive migrations.
- **CSAT Responses (Phase 2):** `csat_responses` is pre-created in the initial schema migration but remains unpopulated until Phase 2 is initiated.
- **Activity Log Validation:** The `activity_logs.metadata` column mandates a TypeScript discriminated union mapping per event type (e.g., `{ type: 'file_approved', file_id: string, version_id: string, ip: string }`) to enforce absolute querying reliability.

### **Database Indexes**

- Complete index strategy prioritized for tRPC query speed:
  - Composite: `(org_id, project_id)` on `assets`, `milestones`, `comments`, `activity_logs`.
  - Composite: `(org_id, client_id)` on `projects`, `invoices`.
  - Composite: `(org_id, status, due_date)` on `invoices` for instant overdue cron resolution.
  - Unique: `(token)` on `share_links` for guest token read-only hot path lookup.
  - Composite (Partial): `(entity_id, entity_type)` on `share_links` for admin token enumeration.

### **Database Triggers**

```sql
-- Trigger: When a new version is inserted, update the parent asset
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

### **Proposed RLS Policy (SQL)**

```sql
-- 1. Create a secure function to check org access via JWT claims (Fast)
create or replace function get_current_org_role()
returns text as $$
  select (auth.jwt() -> 'app_metadata' ->> 'org_role')::text;
$$ language sql stable;

-- 2. Files Policy
create policy "Users can view files in their org"
on storage.objects for select
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

create policy "Only inner org roles can upload files"
on storage.objects for insert
with check (
  bucket_id = 'project-files'
  and get_current_org_role() in ('owner', 'admin', 'member') -- clients & guests excluded
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

-- PATCH: Allow Clients to upload ONLY to the "Client Uploads" folder
create policy "Clients can upload to Client Uploads folder"
on storage.objects for insert
with check (
  bucket_id = 'project-files'
  and get_current_org_role() = 'client'
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
  and (storage.foldername(name))[2] = 'Client Uploads' -- Strict Folder Lock
);

-- 3. Share Links Policy
create policy "Users view share links for their org"
on share_links for select
using (
  created_by in (
    select id from users
    where id = auth.uid()
    and (auth.jwt() -> 'app_metadata' ->> 'org_id') is not null
  )
);
-- Note: Guest token resolution is handled via a privileged server-side route. It completely bypasses public client queries.
```

| 12\. Non-Functional Requirements |
| :------------------------------- |

## **Performance**

| Metric                            | Target        |
| :-------------------------------- | :------------ |
| Dashboard initial load (LCP)      | **\< 1.0 s**  |
| tRPC API response (p95)           | **\< 300 ms** |
| File upload feedback (signed URL) | **\< 500 ms** |
| Search results                    | **\< 500 ms** |
| PDF invoice generation            | **\< 3 s**    |

## **Security**

| Mechanism            | Implementation                                                        |
| :------------------- | :-------------------------------------------------------------------- |
| **Authentication**   | Session-based, HTTP-only secure cookies, CSRF tokens on all mutations |
| **Tenant isolation** | PostgreSQL Row Level Security (RLS) per organization on every table   |
| **File access**      | Supabase signed URLs with 1-hour expiry; regenerated on-demand        |
| **Password storage** | bcrypt with salt (cost factor 12\)                                    |
| **Rate limiting**    | 100 req/min per user, 20 req/min for auth endpoints (Upstash Redis)   |
| **Input validation** | Server-side Zod schema validation on all inputs                       |
| **HTTPS**            | Enforced on all endpoints; HSTS header set                            |
| **OWASP Top 10**     | SQL injection, XSS, CSRF, and path traversal mitigations in place     |

## **Reliability & Scalability**

- Uptime target: 99.5% (allows \~3.6 hrs downtime/month)

- Daily automated database backups, 30-day retention

- File durability: 99.99% (Supabase Storage / S3-backed)

- MVP scalability target: 500 organizations, 5,000 users, 200 concurrent, 1 TB storage

- Stateless API layer enables horizontal scaling via Vercel edge functions when needed

## **Accessibility & UX**

- WCAG 2.1 AA compliance

- Mobile-responsive across breakpoints: sm / md / lg / xl

- Client portal must be fully usable with zero onboarding documentation

- Loading skeletons on all async data; no blank states during fetch

- Optimistic UI for comments and status updates

## **Developer Experience (DX) & Safety**

- **Database Seeding:** A strict requirement for a `seed.ts` script to populate the database with dummy organizations, clients, projects, and 50+ varied events to accurately develop and test the Activity Timeline.
- **Email Previews:** Local preview server implementation for `react-email` templates. No real emails should be sent to test rendering logic.
- **Single Source of Truth for Limits:** Implement a `plan_limits` DB table or a strict `config/plans.ts` constants file. Hardcoding numbers for storage caps or project limits is completely banned to ensure effortless iterative adjustments to pricing architecture.

| 13\. Key User Flows |
| :------------------ |

## **13.1 Freelancer Onboarding**

16. Sign up (email \+ password) → verify email

17. Create organization (name, type: Freelancer or Agency)

18. Guided setup: "Add your first client"

19. Create first project → assign client

20. Upload first file → dashboard populated

## **13.2 Client First Login**

21. Receive invitation email with Magic Link (secure long-lived token)

22. Click link → account instantly activated, automatically logged in

23. Land on client dashboard (only sees their projects)

24. View files, invoices, and activity feed

## **13.3 File Delivery & Approval**

25. Member uploads file → status \= "Pending Review"

26. Client receives in-app \+ email notification

27. Client views file → clicks "Approve" or "Request Changes"

28. If approved: logged in timeline; member notified

29. If changes: client adds comment; member uploads new version; cycle repeats

## **13.4 Invoice Lifecycle**

30. Admin creates invoice (Draft) → adds line items

31. Previews PDF with org branding

32. Sends to client (Draft → Sent) → client receives email notification

33. Client views and downloads PDF from their dashboard

34. Admin marks as Paid — OR — system auto-flags Overdue

35. Phase 2: Client pays directly via Stripe Checkout in portal

| 14\. Decision Log |
| :---------------- |

| \#     | Decision                                      | Alternatives                  | Rationale                                                                                                                                        |
| :----- | :-------------------------------------------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | **Fully managed SaaS**                        | Self-hosted, open-core        | Target users (freelancers) want zero-ops — they won't self-host. Managed SaaS \= faster onboarding.                                              |
| **2**  | **Freelancer pays, clients free**             | Both pay, per-seat            | Reduces adoption friction. Clients won't pay for a portal they didn't choose. B2B viral loop.                                                    |
| **3**  | **Email+password MVP, OAuth Phase 2**         | Magic links MVP, OAuth MVP    | Email+password is simplest to implement correctly. Magic links and OAuth add Phase 2 polish without blocking launch.                             |
| **4**  | **4-role RBAC \+ Guest**                      | Many granular roles           | Freelancers don't need "tester" vs "developer" distinctions. Project assignment handles scoping. Guest added for non-participating stakeholders. |
| **5**  | **Invoice management first, Stripe Phase 2**  | Full payments in MVP          | Manual "mark as paid" is acceptable for launch. Stripe integration is non-trivial and should not block shipping.                                 |
| **6**  | **Client uploads scoped to 'Client Uploads'** | Allow unconstrained uploads   | Isolated folder prevents root clutter while enabling the feedback loop.                                                                          |
| **7**  | **Comments MVP, messaging Phase 2**           | Full messaging in MVP         | Comments cover 80% of the need (file feedback \+ project discussion). Full async messaging is Phase 2\.                                          |
| **8**  | **Basic branding in MVP**                     | No branding, full white-label | Logo \+ accent color is a strong selling point for paid tiers and straightforward to implement. Full white-label is Phase 3\.                    |
| **9**  | **Permanently free Starter tier**             | Trial-only, paid-only         | Freemium drives organic growth. Freelancers start free, upgrade when they succeed. No time pressure \= lower churn.                              |
| **10** | **GitHub as optional plugin**                 | Core feature or removed       | Only relevant for dev-focused freelancers. Shouldn't be forced on designers or copywriters.                                                      |

| 15\. Explicit Out of Scope (Phase 1 \+ 2\) |
| :----------------------------------------- |

The following will NOT be built in Phase 1 or Phase 2:

- Native mobile apps (iOS / Android) — responsive web \+ PWA is sufficient

- Time tracking and timesheet management

- CRM features (lead pipeline, deal stages)

- Full GDPR / CCPA "Right to Erasure" automated hard-deletion compliance flows (Phase 3). For Phase 1/2, data deletion requests are manually serviced by support.

- Public marketplace for clients to discover freelancers

- Video calls or screen recording integrations

- Real-time chat (typing indicators, read receipts) — async messaging board is sufficient

| 16\. Success Metrics |
| :------------------- |

## **Activation (Week 1\)**

- Admin creates first project within 10 minutes of signup

- First client invite sent within 24 hours of project creation

- Client completes invite flow and logs in (primary activation event)

## **Engagement (Monthly)**

| Metric                       | Target (6 months post-launch)                     |
| :--------------------------- | :------------------------------------------------ |
| Registered organizations     | **200+**                                          |
| Monthly Active Organizations | **50%+ of registered**                            |
| Projects created per org     | **3+ average**                                    |
| Files uploaded per org       | **10+ average**                                   |
| Invoices generated per org   | **2+ average**                                    |
| Client login rate            | **60%+ of invited clients log in within 7 days**  |
| File approval rate           | **70%+ of uploaded files get an approval action** |
| DAU/MAU ratio                | **30%+**                                          |

## **Revenue (after Phase 2\)**

- Free → Paid conversion: 5–10%

- Monthly churn: \< 5%

- MRR growth: 15%+ month-over-month

- Target: $10k MRR by Month 6

| 17\. Roadmap Summary |
| :------------------- |

| Phase              | Timeline   | Key Deliverables                                                                                                                                                                                                                       |
| :----------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MVP (Phase 1\)** | Months 1–3 | Auth \+ invitations, project management \+ milestones, file sharing \+ versioning \+ approvals, invoice management \+ PDF, activity timeline, notifications (in-app \+ email), admin \+ client dashboards, basic branding, RBAC \+ RLS |
| **Phase 2**        | Months 4–6 | Stripe payments, OAuth login, async messaging, Kanban board, recurring invoices, GitHub integration plugin, CSAT surveys, public progress pages, AI summaries, WhatsApp/SMS reminders, e-signature workflows, multi-contact clients    |
| **Phase 3**        | Months 7+  | Full custom domains, full white-label, analytics dashboard, time tracking, public API \+ webhooks, PWA, "Embed Your Portal" widget                                                                                                     |

| 18\. Risks & Mitigations |
| :----------------------- |

| Risk                                       | Likelihood | Impact       | Mitigation                                                                                                                                                                                               |
| :----------------------------------------- | :--------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Low client adoption (clients don't log in) | **Medium** | **High**     | Excellent invitation flow, email reminders, clear value on first login, empty state guidance                                                                                                             |
| GDPR / CCPA "Right to Erasure" Compliance  | **Low**    | **Medium**   | Automating hard-deletes across multi-tenant schemas is risky for early MVPs. Mitigate by manually executing database deletions via support request until Phase 3 automation.                             |
| Storage costs grow unexpectedly            | **Medium** | **Medium**   | Tier-based storage limits, image compression on upload, monitoring alerts                                                                                                                                |
| Freelancers find it too complex            | **Low**    | **High**     | Guided onboarding, minimal required fields, progressive disclosure of advanced features                                                                                                                  |
| Security breach (client data leak)         | **Low**    | **Critical** | RLS on every table, signed URLs, rate limiting, regular security audits, penetration testing                                                                                                             |
| Stripe integration delays Phase 2          | **Medium** | **Medium**   | Phase 1 fully functional without payments — invoicing works standalone with manual payment tracking                                                                                                      |
| Multi-tenant data bleed                    | **Low**    | **Critical** | RLS enforced at database layer; tRPC middleware validates org membership on every request                                                                                                                |
| WhatsApp Business API Approval Limits      | **Medium** | **Medium**   | The integration sequence poses a 2-4 week delay. Twilio is positioned as a Phase 2 fallback to ensure launch deadlines if Meta locks the validation request.                                             |
| AI Summary Internal Privacy Gap            | **Low**    | **High**     | Using Anthropic/OpenAI APIs means confidential deliverable metadata leaves our infrastructure. Implement strict ToS disclosures and offer an org-level explicit opt-in toggle before enabling.           |
| **Email Deliverability Failure**           | **Medium** | **Critical** | Use dedicated subdomain (`notifications.clientspace.com`). Enforce DKIM/SPF/DMARC strictly. Build a hidden "Admin Debug" view for Super Admins to manually retrieve/send Magic Links if emails hit spam. |

ClientSpace — Confidential · PRD v3.0 · March 2026 · Full-Stack Engineering Reference
