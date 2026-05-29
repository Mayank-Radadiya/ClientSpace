"use server";

// src/app/(public)/sign/[token]/_components/signContract.ts
// Server Action: validates signing token, captures signer data, computes
// integrity hash, uploads signature canvas PNG (if drawn), updates contract.
//
// Security:
//   - Re-validates token on every call (no client trust)
//   - signerIp read from x-forwarded-for header (set by Vercel/reverse proxy)
//   - signatureHash is SHA-256 integrity proof ONLY — not a legal signature
//     (see ESIGN Act / eIDAS for jurisdiction-specific requirements)
//   - TODO (GDPR production): Hash signerIp before storing

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { contracts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";

interface SignContractInput {
  token: string;
  contractId: string;
  signerName: string;
  signerEmail: string;
  signatureDataUrl?: string; // base64 PNG from canvas draw tab
  tabMode: "type" | "draw";
}

export async function signContractAction(input: SignContractInput): Promise<void> {
  const { token, contractId, signerName, signerEmail, signatureDataUrl, tabMode } = input;

  // ── Step 1: Re-validate token server-side ───────────────────────────────
  const db = await createDrizzleClient();

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.signingToken, token),
    columns: {
      id: true,
      orgId: true,
      title: true,
      status: true,
      signingTokenExpiresAt: true,
      clientId: true,
    },
    with: {
      client: { columns: { contactName: true, companyName: true } },
    },
  });

  if (!contract) {
    throw new Error("Invalid signing link.");
  }

  if (contract.id !== contractId) {
    throw new Error("Token/contract mismatch.");
  }

  if (contract.status === "signed" || contract.status === "declined") {
    throw new Error("This contract has already been completed.");
  }

  if (
    contract.status === "expired" ||
    contract.status === "draft" ||
    !["sent", "viewed"].includes(contract.status)
  ) {
    throw new Error("This signing link is no longer active.");
  }

  if (contract.signingTokenExpiresAt && new Date() > new Date(contract.signingTokenExpiresAt)) {
    await db.update(contracts).set({ status: "expired", updatedAt: new Date() } as any).where(eq(contracts.id, contractId));
    throw new Error("This signing link has expired.");
  }

  // ── Step 2: Read request metadata ───────────────────────────────────────
  const headersList = await headers();
  // TODO (GDPR production): Hash signerIp with SHA-256 before storing:
  //   const rawIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  //   const signerIp = rawIp ? createHash("sha256").update(rawIp).digest("hex") : null;
  const signerIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const signerUserAgent = headersList.get("user-agent") ?? null;

  // ── Step 3: Upload signature image (draw mode only) ────────────────────
  let signatureImageUrl: string | null = null;

  if (tabMode === "draw" && signatureDataUrl) {
    // signatureDataUrl is "data:image/png;base64,..."
    const base64 = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    const supabase = createAdminClient();
    const storagePath = `${contract.orgId}/${contractId}/signature.png`;

    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(storagePath, buffer, {
        contentType: "image/png",
        cacheControl: "public, max-age=31536000",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload signature: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(storagePath);
    signatureImageUrl = urlData?.publicUrl ?? null;
  }

  // ── Step 4: Compute integrity hash ──────────────────────────────────────
  // SHA-256(signerName + signerEmail + contractId + timestamp)
  // IMPORTANT: This hash proves that these four fields have not been tampered
  // with after signing. It is NOT a legal e-signature by itself.
  // Consult ESIGN Act (US), eIDAS (EU), or relevant jurisdiction law.
  const signingTimestamp = Date.now().toString();
  const signatureHash = createHash("sha256")
    .update(signerName + signerEmail + contractId + signingTimestamp)
    .digest("hex");

  // ── Step 5: Update contract record ──────────────────────────────────────
  await db
    .update(contracts)
    .set({
      status: "signed",
      signerName,
      signerEmail,
      signatureImageUrl,
      signatureHash,
      signerIp,
      signerUserAgent,
      signedAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .where(eq(contracts.id, contractId));

  // ── Step 6: Dispatch Inngest (PDF generation + emails) ──────────────────
  await inngest.send({
    name: "contracts/signed",
    data: {
      contractId,
      orgId: contract.orgId,
    },
  });

  // ── Step 7: Redirect to success page ────────────────────────────────────
  redirect(`/sign/${token}/success`);
}
