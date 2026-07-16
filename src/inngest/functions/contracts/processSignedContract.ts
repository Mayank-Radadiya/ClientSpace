// src/inngest/functions/contracts/processSignedContract.ts
// Triggered when a client signs a contract ('contracts/signed' event).
//
// Step sequence:
//   1. fetch-contract-data   → load full contract + org + client from DB
//   2. generate-contract-pdf → @react-pdf/renderer → Buffer
//   3. upload-contract-pdf   → Supabase Storage 'contracts-pdf' bucket
//   4. update-contract-record → write pdfUrl to DB
//   5. send-client-email     → Resend: signed copy to client
//   6. send-agency-email     → Resend: notification to org owner email
//
// Security:
//   - orgId from event is cross-checked against DB (NonRetriableError on mismatch)
//   - Admin Supabase client (service role) used for storage — correct for Inngest jobs

import { NonRetriableError } from "inngest";
import { renderToBuffer } from "@react-pdf/renderer";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { contracts, organizations } from "@/db/schema";
import { ContractPDF } from "@/features/contracts/components/ContractPDF";
import { ContractSigningRequest } from "@/emails/ContractSigningRequest";
import { ContractSignedAgencyNotification } from "@/emails/ContractSignedAgencyNotification";
import { ContractSignedClientCopy } from "@/emails/ContractSignedClientCopy";

// ─── Event types ──────────────────────────────────────────────────────────────

interface ContractSignedEvent {
  name: "contracts/signed";
  data: { contractId: string; orgId: string };
}

interface ContractSendRequestedEvent {
  name: "contracts/send.requested";
  data: { contractId: string; orgId: string };
}

// ─── Process signed contract ──────────────────────────────────────────────────

export const processSignedContract = inngest.createFunction(
  {
    id: "contracts-process-signed",
    retries: 3,
    concurrency: {
      limit: 5,
      key: "event.data.orgId",
    },
  },
  { event: "contracts/signed" as ContractSignedEvent["name"] },
  async ({ event, step }) => {
    const { contractId, orgId } = event.data as ContractSignedEvent["data"];

    // ── Step 1: Fetch contract data ────────────────────────────────────────
    const contractData = await step.run("fetch-contract-data", async () => {
      const contract = await db.query.contracts.findFirst({
        where: and(eq(contracts.id, contractId), eq(contracts.orgId, orgId)),
        with: {
          organization: { columns: { id: true, name: true, logoUrl: true } },
          client: { columns: { id: true, contactName: true, companyName: true, email: true } },
        },
      });

      if (!contract) {
        throw new NonRetriableError(
          `Contract ${contractId} not found or does not belong to org ${orgId}`,
        );
      }

      if (contract.status !== "signed") {
        throw new NonRetriableError(
          `Contract ${contractId} has status '${contract.status}', expected 'signed'`,
        );
      }

      // Fetch org owner email for agency notification
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { id: true, name: true, logoUrl: true },
      });

      if (!org) {
        throw new NonRetriableError(`Organization ${orgId} not found`);
      }

      return { contract, org };
    });

    // ── Step 2: Generate signed PDF ────────────────────────────────────────
    const compiledPdf = await step.run("generate-contract-pdf", async () => {
      const { contract, org } = contractData;

      const pdfDoc = ContractPDF({
        contract: {
          id: contract.id,
          title: contract.title,
          bodyPlainText: contract.bodyPlainText,
          signerName: contract.signerName ?? "",
          signerEmail: contract.signerEmail ?? "",
          signerIp: contract.signerIp,
          signedAt: new Date(contract.signedAt as unknown as string),
          signatureHash: contract.signatureHash ?? "",
          signatureImageUrl: contract.signatureImageUrl,
        },
        org: {
          name: org.name,
          logoUrl: org.logoUrl ?? null,
        },
      });

      const buffer = await renderToBuffer(pdfDoc);
      // Inngest serializes step results as JSON — Buffer → Uint8Array → Array<number>
      return { data: Array.from(buffer) };
    });

    // ── Step 3: Upload to Supabase Storage ────────────────────────────────
    const pdfPublicUrl = await step.run("upload-contract-pdf", async () => {
      const buffer = Buffer.from(compiledPdf.data);
      const storagePath = `${orgId}/${contractId}/signed-contract.pdf`;

      const supabase = createAdminClient();

      const { error: uploadError } = await supabase.storage
        .from("contracts-pdf")
        .upload(storagePath, buffer, {
          contentType: "application/pdf",
          cacheControl: "public, max-age=31536000",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("contracts-pdf")
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to resolve public PDF URL after upload");
      }

      return urlData.publicUrl;
    });

    // ── Step 4: Update contract record with pdfUrl ─────────────────────────
    await step.run("update-contract-record", async () => {
      await db
        .update(contracts)
        .set({ pdfUrl: pdfPublicUrl, updatedAt: new Date() } as any)
        .where(and(eq(contracts.id, contractId), eq(contracts.orgId, orgId)));
    });

    // ── Step 5: Send client email ──────────────────────────────────────────
    await step.run("send-client-email", async () => {
      const { contract } = contractData;
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from:
          process.env.DEFAULT_FROM_EMAIL ??
          process.env.CONTRACTS_FROM_EMAIL ??
          process.env.ONBOARDING_FROM_EMAIL ??
          "ClientSpace <hello@clientspace.qzz.io>",
        to: contract.signerEmail ?? (contract.client as any)?.email ?? "",
        subject: `Your signed copy: ${contract.title}`,
        react: ContractSignedClientCopy({
          contractTitle: contract.title,
          signerName: contract.signerName ?? "there",
          signedAt: new Date(contract.signedAt as unknown as string).toLocaleDateString("en-US", { dateStyle: "long" }),
          pdfUrl: pdfPublicUrl,
          orgName: (contract.organization as any)?.name ?? "The team",
        }),
      });
    });

    // ── Step 6: Send agency email ──────────────────────────────────────────
    await step.run("send-agency-email", async () => {
      const { contract, org } = contractData;
      const resend = new Resend(process.env.RESEND_API_KEY);

      const toEmail =
        process.env.SYSTEM_NOTIFICATION_EMAIL ?? "hello@example.com";

      await resend.emails.send({
        from:
          process.env.DEFAULT_FROM_EMAIL ??
          process.env.CONTRACTS_FROM_EMAIL ??
          "ClientSpace <hello@clientspace.qzz.io>",
        to: toEmail,
        subject: `✅ ${contract.signerName ?? "Client"} signed: ${contract.title}`,
        react: ContractSignedAgencyNotification({
          contractTitle: contract.title,
          contractId,
          signerName: contract.signerName ?? "Client",
          signerEmail: contract.signerEmail ?? "",
          signerIp: contract.signerIp ?? "—",
          signedAt: new Date(contract.signedAt as unknown as string).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }),
          signatureHash: contract.signatureHash ?? "",
          pdfUrl: pdfPublicUrl,
          orgName: org.name,
        }),
      });
    });

    return { ok: true, contractId, pdfUrl: pdfPublicUrl };
  },
);

// ─── Send signing request email ───────────────────────────────────────────────

export const sendContractEmail = inngest.createFunction(
  {
    id: "contracts-send-email",
    retries: 3,
  },
  { event: "contracts/send.requested" as ContractSendRequestedEvent["name"] },
  async ({ event, step }) => {
    const { contractId, orgId } = event.data as ContractSendRequestedEvent["data"];

    await step.run("send-signing-request-email", async () => {
      const contract = await db.query.contracts.findFirst({
        where: and(eq(contracts.id, contractId), eq(contracts.orgId, orgId)),
        columns: {
          id: true,
          title: true,
          signingToken: true,
          signerEmail: true,
        },
        with: {
          client: { columns: { email: true, contactName: true, companyName: true } },
          organization: { columns: { name: true } },
        },
      });

      if (!contract?.signingToken) {
        throw new NonRetriableError("Contract or signing token not found");
      }

      const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${contract.signingToken}`;
      const clientEmail = (contract.client as any)?.email;
      const clientName  = (contract.client as any)?.companyName ?? (contract.client as any)?.contactName ?? "there";
      const orgName     = (contract.organization as any)?.name ?? "Your partner";

      if (!clientEmail) {
        throw new NonRetriableError("Client email not found");
      }

      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from:
          process.env.DEFAULT_FROM_EMAIL ??
          process.env.CONTRACTS_FROM_EMAIL ??
          "ClientSpace <hello@clientspace.qzz.io>",
        to: clientEmail,
        subject: `${orgName} sent you a contract: ${contract.title}`,
        react: ContractSigningRequest({
          contractTitle: contract.title,
          clientName,
          orgName,
          signingUrl,
          expiresInDays: 30,
        }),
      });
    });

    return { ok: true, contractId };
  },
);
