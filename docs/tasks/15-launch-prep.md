# Task 15 — Launch Preparation

## Goal

Harden the ClientSpace application for its **first production deployment**: add polished error pages for 404 and 500 conditions, enrich the global metadata with Open Graph tags and a title template, inject production-grade HTTP security headers via `next.config.mjs`, and perform a clean `bun run build` to eliminate any residual TypeScript errors from previous tasks.

This task finalises **Phase 1**.

---

## Description

Before going live, three gaps must be closed:

1. **Error Pages** — Next.js renders a plain-text fallback when a route isn't found or an unexpected error is thrown. Both conditions must instead render a branded, on-theme UI using `shadcn/ui` components, giving visitors a clear recovery path (link back to Dashboard or Home).

2. **Metadata & SEO** — The root `layout.tsx` must expose a title template (`%s | ClientSpace`) so every page's `<title>` is consistent without repetition, plus Open Graph tags (title, description, URL, type) and a `theme-color` that matches the design system's primary hue. The PRD mandates "Powered by ClientSpace" attribution in the meta description strictly for the Starter tier; this must be dynamically injected based on the organization's plan tier to protect the white-labeling for Pro/Growth/Business users.

3. **Security Headers** — The `next.config.mjs` headers block must add the minimum set of headers required for production: `X-Content-Type-Options`, `Referrer-Policy`, and a baseline `Content-Security-Policy` that allows Supabase and Resend origins while blocking everything else by default.

### Artifacts delivered in this task

| Artifact           | Path                    | Purpose                                |
| :----------------- | :---------------------- | :------------------------------------- |
| 404 page           | `src/app/not-found.tsx` | Polished "Page Not Found" UI           |
| 500 page           | `src/app/error.tsx`     | Polished "Something Went Wrong" UI     |
| Root layout update | `src/app/layout.tsx`    | Title template + OG meta + theme-color |
| Config update      | `next.config.mjs`       | Production HTTP security headers       |
| Error Telemetry    | `sentry.*.config.ts`    | Sentry client/server/edge config       |

---

## Tech Stack

| Concern          | Library / Pattern                                                        |
| :--------------- | :----------------------------------------------------------------------- |
| Error pages      | Next.js App Router conventions — `not-found.tsx`, `error.tsx`            |
| UI components    | `shadcn/ui` — `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle` |
| Icons            | `lucide-react` — `AlertCircle`, `ArrowLeft`, `Home`, `SearchX`           |
| Metadata         | Next.js `Metadata` type, `metadataBase`                                  |
| Security headers | `next.config.mjs` `headers()` async function                             |
| Error tracking   | Sentry SDK (`@sentry/nextjs`)                                            |

No new `bun install` required — all dependencies are already present.

---

## Instructions

### Step 1 — Create `src/app/not-found.tsx`

This file is the **global 404 handler**. Next.js renders it automatically whenever `notFound()` is called from any Server Component, or when no matching route exists.

```tsx
// src/app/not-found.tsx
import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Rendered by Next.js whenever notFound() is called or a URL has no match.
 * Must be a Server Component (no "use client") — Next.js requirement.
 * PRD constraint: the app must never crash on 404s; this page is the guarantee.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <span className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
          </span>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            404
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Double-check the URL or navigate back to safety.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default">
            {/* Admins land on /dashboard; clients land on /portal (Task 10).
                Linking to /dashboard is safe because the Middleware (Task 3)
                bounces unauthenticated users to /login and redirects
                clients from /dashboard → /portal based on their role. */}
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>

        {/* Brand */}
        <p className="text-xs text-muted-foreground">Powered by ClientSpace</p>
      </div>
    </main>
  );
}
```

> **Why no `"use client"`?** Next.js requires `not-found.tsx` to be a Server Component. If you need client-side interactivity here in the future, extract it into a separate `"use client"` child component.

---

### Step 2 — Create `src/app/error.tsx`

This file is the **global error boundary**. Next.js renders it when an unhandled exception escapes a Server or Client Component in the tree. It **must** be a Client Component (the `"use client"` directive is required by Next.js — the `reset` function is a client-side callback).

```tsx
// src/app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary — rendered when an unhandled exception escapes
 * any component below the root layout.
 *
 * "use client" is REQUIRED by Next.js (reset is a client-side callback).
 * The digest is a server-generated hash for correlating errors in logs
 * without leaking stack traces to the browser.
 */
export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to your observability stack (e.g. Sentry) here in the future.
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <span className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </span>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            500
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Our team has been notified. You can
            try again, or head back to the dashboard.
          </p>
          {/* Show the digest only — never the raw stack trace in production */}
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Brand */}
        <p className="text-xs text-muted-foreground">Powered by ClientSpace</p>
      </div>
    </main>
  );
}
```

> **Security note:** Only `error.digest` is exposed to the browser — never `error.message` or `error.stack`. The digest is a short hash Next.js generates server-side that can be cross-referenced with server logs without leaking implementation details.

---

### Step 3 — Update `src/app/layout.tsx`

Add a `metadata` export with a **title template**, Open Graph tags, and a theme color. Do **not** remove the existing `<html>`, `<body>`, or provider tree — only add/replace the `metadata` export and add the `<meta name="theme-color">` tag.

```tsx
// src/app/layout.tsx  (partial — show only additions/changes)
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  // Fetch the organization's plan tier here (e.g., from DB or auth token)
  // const orgTier = await getOrgTier();
  const isStarter = true; // Replace with actual check
  const baseDescription =
    "Manage your client projects, invoices, and file approvals — all in one place.";
  const description = isStarter
    ? `${baseDescription} Powered by ClientSpace.`
    : baseDescription;

  return {
    // Title template: leaf pages set `export const metadata = { title: "Invoices" }`
    // and the browser tab renders "Invoices | ClientSpace".
    title: {
      template: "%s | ClientSpace",
      default: "ClientSpace — Client Portal & Project Management",
    },
    description: description,
    // ⚠️  new URL() throws a RangeError at build time if the string has no
    // protocol (e.g. NEXT_PUBLIC_APP_URL=localhost:3000 without "http://").
    // The helper below guarantees a valid URL regardless of how the env var
    // is set. Always prefix with "http://" in .env.local and "https://" in CI.
    metadataBase: (() => {
      const raw = process.env.NEXT_PUBLIC_APP_URL ?? "https://clientspace.app";
      const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
      return new URL(withProtocol);
    })(),
    openGraph: {
      title: "ClientSpace",
      description:
        "Client portal and project management for freelancers and agencies.",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "https://clientspace.app",
      siteName: "ClientSpace",
      type: "website",
      // Place og:image at /public/og-image.png (1200×630 px recommended).
      // images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "ClientSpace",
      description:
        "Client portal and project management for freelancers and agencies.",
    },
    robots: {
      // Prevent search engines from indexing admin/client portal pages.
      // Individual public-facing pages can override with their own robots metadata.
      index: false,
      follow: false,
    },
  };
}

// Inside the RootLayout component's <head> (or via viewport export):
// Add theme-color so the browser chrome matches the design system.
// Next.js 14+ recommends the separate `viewport` export for this.
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// ... rest of layout unchanged
```

> **`robots: false`** is correct for an authenticated app — you do not want Googlebot crawling `/dashboard/invoices/123`. Public marketing pages (if added later) can override with `robots: { index: true, follow: true }` in their own `metadata` export.

---

### Step 4 — Update `next.config.mjs` with security headers

Replace or extend the existing `next.config.mjs`. The `headers()` function appends HTTP response headers to every route matched by `source`.

```javascript
// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... preserve any existing config (images, experimental, etc.)

  async headers() {
    /**
     * SECURITY HEADERS — applied to every route.
     *
     * These are the strictly necessary headers for a production SaaS app
     * that talks to Supabase and uses Resend for transactional email.
     *
     * References:
     *  - https://nextjs.org/docs/app/building-your-application/deploying#http-response-headers
     *  - https://securityheaders.com
     */
    const securityHeaders = [
      {
        // Prevents browsers from MIME-sniffing a response away from the
        // declared Content-Type. Mitigates drive-by download attacks.
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        // Sends full URL as referrer for same-origin requests, only the
        // origin for cross-origin HTTPS requests, nothing for HTTP.
        key: "Referrer-Policy",
        value: "origin-when-cross-origin",
      },
      {
        // Prevents the page from being embedded in an iframe on other domains.
        // Mitigates clickjacking attacks.
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        // Baseline Content-Security-Policy.
        //
        // default-src 'self'        — block everything not explicitly allowed
        // script-src                — allow Next.js chunks + Supabase realtime client
        // connect-src               — allow Supabase REST/realtime + your app URL
        // style-src 'unsafe-inline' — required by Next.js + shadcn CSS-in-JS
        // img-src                   — allow data URIs and Supabase Storage
        // font-src 'self'           — local fonts only
        // frame-ancestors 'none'    — belt-and-suspenders vs clickjacking
        //
        // IMPORTANT: Replace the placeholder origins with your actual values
        // from .env.local (NEXT_PUBLIC_SUPABASE_URL).
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' needed by Next.js dev; tighten post-launch
          `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co"} wss://*.supabase.co https://api.resend.com https://*.s3.amazonaws.com https://*.r2.cloudflarestorage.com`,
          "style-src 'self' 'unsafe-inline'",
          `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co"} https://*.s3.amazonaws.com https://*.r2.cloudflarestorage.com`,
          "font-src 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      },
    ];

    return [
      {
        // Apply to all routes.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

> **`'unsafe-eval'` in `script-src`:** Next.js requires this during development for fast refresh. In production the built output no longer uses `eval`, but removing it can break some third-party analytics or error-tracking scripts. Leave it in place for Phase 1 and tighten the CSP in Phase 2 once external scripts are audited.

---

### Step 5 — Configure Error Telemetry (Sentry)

PRD §10 lists "Error tracking via Sentry (recommended)". To ensure we know when the new 500 error pages are triggered, configure the Sentry SDK.

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,
});
```

```typescript
// sentry.edge.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,
});
```

> **Note:** Ensure `@sentry/nextjs` is installed and the Next.js plugin is wrapped around the config in `next.config.mjs` (via `withSentryConfig`).

---

### Step 6 — Build Verification

Run a full production build locally and fix any TypeScript / ESLint errors that surface.

```bash
# From the project root
bun run build
```

**Common errors to watch for:**

| Error pattern                                            | Likely source                                         | Fix                                                              |
| :------------------------------------------------------- | :---------------------------------------------------- | :--------------------------------------------------------------- |
| `Type 'X' is not assignable to type 'Y'`                 | Missing `"use client"` on a component that uses hooks | Add `"use client"` at the top                                    |
| `Argument of type 'string \| null' is not assignable...` | Unhandled nullable from Drizzle                       | Add nullish coalescing (`?? ""`)                                 |
| `Module not found: Can't resolve '@/...'`                | Missing barrel export                                 | Add the export to the relevant `index.ts`                        |
| `'reset' is defined but never used`                      | `error.tsx` props                                     | Ensure `reset` is wired to the Try Again button                  |
| CSP `process.env` undefined at build time                | `.env.local` not loaded                               | Verify `.env.local` exists and `NEXT_PUBLIC_SUPABASE_URL` is set |

A successful build outputs:

```text
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

No TypeScript errors, no `[Error]` lines — only then is the app considered **Phase 1 complete**.

---

## Validation Checklist

### Error Pages

- [ ] Navigate to `http://localhost:3000/this-url-does-not-exist`. The browser renders the custom Not Found page with the `SearchX` icon, the "404" label, the headline, and two action buttons — **not** the default Next.js 404 text.
- [ ] The page title in the browser tab reads **"ClientSpace — Client Portal & Project Management"** (the `default` title, because `not-found.tsx` does not set its own).
- [ ] Both buttons on the 404 page are functional: "Back to Dashboard" navigates to `/dashboard`, "Go to Home" navigates to `/`.
- [ ] To test the 500 page during development, temporarily add `throw new Error("test")` inside any Server Component, load the page, confirm the branded error UI renders, then remove the throw.
- [ ] The 500 page's "Try Again" button calls `reset()` and retries the render (confirm by observing the component re-mount in React DevTools).
- [ ] Neither error page leaks stack traces or internal file paths — only the `digest` hash (if present) is visible.
- [ ] Both pages display **"Powered by ClientSpace"** in the footer area.

---

### Metadata & SEO

- [ ] Open `http://localhost:3000/dashboard` (or any page with its own `title` metadata export). Inspect `<head>` in DevTools. The `<title>` element reads **"Dashboard | ClientSpace"** (or the equivalent page-specific title).
- [ ] Pages without their own `title` export (e.g. the 404 page) display **"ClientSpace — Client Portal & Project Management"**.
- [ ] The following `<meta>` tags are present in the root `<head>`:
  - `<meta property="og:title" content="ClientSpace" />`
  - `<meta property="og:type" content="website" />`
  - `<meta name="description" content="...Powered by ClientSpace." />` (Only if Starter tier)
  - `<meta name="theme-color" ...>` (two entries for light/dark)
- [ ] `NEXT_PUBLIC_APP_URL` is set in `.env.local`. The OG `url` and `metadataBase` resolve to that URL, not the placeholder.

---

### Security Headers

- [ ] Start the production build locally: `bun run build && bun run start`.
- [ ] In a terminal, run:

  ```bash
  curl -I http://localhost:3000/dashboard
  ```

- [ ] Confirm the following headers are present in the response:

  | Header                    | Expected value                   |
  | :------------------------ | :------------------------------- |
  | `X-Content-Type-Options`  | `nosniff`                        |
  | `Referrer-Policy`         | `origin-when-cross-origin`       |
  | `X-Frame-Options`         | `SAMEORIGIN`                     |
  | `Content-Security-Policy` | Starts with `default-src 'self'` |

- [ ] Open [https://securityheaders.com](https://securityheaders.com) and scan your production URL once deployed. The report should return **grade A** or better. Address any new findings before Phase 2.

---

### Build Verification

- [ ] `bun run build` completes with **zero TypeScript errors** and **zero ESLint errors**.
- [ ] The build output lists `not-found` and `error` in the route table.
- [ ] `bun run start` serves the production build on `localhost:3000` without any startup errors in the terminal.
- [ ] A smoke-test pass through the critical flows works on the production build:
  - [ ] Sign in as Admin → `/dashboard` loads with KPI cards.
  - [ ] Sign in as Client → `/portal` loads with project list (Middleware redirects clients from `/dashboard` → `/portal`).
  - [ ] 404 route → custom error page.
  - [ ] Invoice PDF download → file renders in browser.

---

> **Phase 1 is complete** once all checkboxes above are green and `bun run build` is clean. Commit with message: `feat: launch prep — error pages, OG metadata, security headers, sentry`.
