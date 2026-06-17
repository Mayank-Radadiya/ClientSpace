// src/app/(public)/sign/[token]/page.tsx
// Public contract signing page — no authentication required.
//
// Security:
//   - bodyHtml is sanitized with isomorphic-dompurify BEFORE dangerouslySetInnerHTML
//   - signerIp is NOT shown on this page (agency-only)
//   - Token lookup uses admin Drizzle (no RLS) — correct for public routes
//   - First view: marks viewedAt, updates status to 'viewed'

import { createHash } from "node:crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { db } from "@/db";
import { contracts, organizations, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SigningPageClient } from "./_components/SigningPageClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  return {
    title: "Review & Sign Contract | ClientSpace",
    description: "Review and electronically sign this contract.",
    robots: { index: false, follow: false }, // Never index signing URLs
  };
}

// ─── Error states ─────────────────────────────────────────────────────────────

function SigningError({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-md text-center space-y-3">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
        <p className="text-sm text-neutral-500">{message}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SignContractPage({ params }: PageProps) {
  const { token } = await params;

  if (!token) return notFound();

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.signingToken, tokenHash),
    columns: {
      id: true,
      title: true,
      status: true,
      bodyHtml: true,
      orgId: true,
      clientId: true,
      signingTokenExpiresAt: true,
      signedAt: true,
      declinedAt: true,
    },
    with: {
      organization: { columns: { id: true, name: true, logoUrl: true } },
      client: { columns: { id: true, contactName: true, companyName: true, email: true } },
    },
  });

  // Token not found
  if (!contract) {
    return (
      <SigningError
        title="Link not found"
        message="This signing link doesn't exist or has already been used. Please contact the sender for a new link."
      />
    );
  }

  // Already signed
  if (contract.status === "signed") {
    return (
      <SigningError
        title="Already signed"
        message={`This contract was signed on ${new Date(contract.signedAt!).toLocaleDateString("en-US", { dateStyle: "long" })}. Check your email for your copy.`}
      />
    );
  }

  // Declined
  if (contract.status === "declined") {
    return (
      <SigningError
        title="Contract declined"
        message="This contract was declined. Please contact the sender if you'd like to reconsider."
      />
    );
  }

  // Expired or voided
  if (contract.status === "expired" || contract.status === "draft") {
    return (
      <SigningError
        title="Link expired"
        message="This signing link is no longer active. Please contact the sender to receive a new one."
      />
    );
  }

  // Token past expiry date
  if (contract.signingTokenExpiresAt && new Date() > new Date(contract.signingTokenExpiresAt)) {
    // Update status to expired
    await db
      .update(contracts)
      .set({ status: "expired", updatedAt: new Date() } as any)
      .where(eq(contracts.id, contract.id));

    return (
      <SigningError
        title="Link expired"
        message="This signing link expired. Please contact the sender to receive a fresh link."
      />
    );
  }

  // Mark as viewed (idempotent — only on first open)
  if (contract.status === "sent") {
    await db
      .update(contracts)
      .set({ status: "viewed", viewedAt: new Date(), updatedAt: new Date() } as any)
      .where(eq(contracts.id, contract.id));
  }

  // ── Sanitize HTML server-side before sending to client ────────────────────
  // isomorphic-dompurify works in Node.js (Next.js server runtime)
  const sanitizedHtml = DOMPurify.sanitize(contract.bodyHtml, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4",
      "ul", "ol", "li", "hr", "blockquote", "span", "a",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "data-placeholder", "class"],
    FORCE_BODY: true,
  });

  const clientLabel = (contract.client as any)?.companyName
    ?? (contract.client as any)?.contactName
    ?? (contract.client as any)?.email
    ?? "";

  const signerEmail = (contract.client as any)?.email ?? "";
  const emailSuffix = signerEmail.length >= 4 ? signerEmail.slice(-4) : signerEmail;

  return (
    <SigningPageClient
      contractId={contract.id}
      token={token}
      title={contract.title}
      sanitizedHtml={sanitizedHtml}
      signerEmail={signerEmail}
      emailSuffix={emailSuffix}
      org={{
        name: (contract.organization as any)?.name ?? "Agency",
        logoUrl: (contract.organization as any)?.logoUrl ?? null,
      }}
    />
  );
}
