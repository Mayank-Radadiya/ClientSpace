// src/db/seed/setup-invoice-storage.ts
// One-time setup script to create the Supabase Storage bucket and RLS policy
// for invoice PDF files.
//
// Run: bun run src/db/seed/setup-invoice-storage.ts
//
// Prerequisites:
//   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
//   - Run ONCE per environment (dev, staging, prod)

import "dotenv/config";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "invoices-pdf";
const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

async function main() {
  const supabase = createAdminClient();

  console.log(`Setting up Supabase Storage bucket: "${BUCKET_NAME}"...`);

  // ── 1. Create bucket ──────────────────────────────────────────────────────

  const { data: existing } = await supabase.storage.getBucket(BUCKET_NAME);

  if (existing) {
    console.log(`✓ Bucket "${BUCKET_NAME}" already exists. Skipping creation.`);
  } else {
    const { error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true, // PDFs are served via public URLs (no signed URL needed)
        fileSizeLimit: FILE_SIZE_LIMIT,
        allowedMimeTypes: ["application/pdf"],
      },
    );

    if (createError) {
      throw new Error(`Failed to create bucket: ${createError.message}`);
    }

    console.log(`✓ Created bucket "${BUCKET_NAME}" (public, 10MB limit, PDF-only)`);
  }

  // ── 2. Storage RLS policies ───────────────────────────────────────────────
  // NOTE: Supabase's storage bucket RLS is managed in the Supabase dashboard
  // or via SQL migrations. The bucket's "public: true" setting allows GET
  // (download) for all, while uploads are restricted to service role via the
  // Inngest worker (which bypasses RLS with SUPABASE_SERVICE_ROLE_KEY).
  //
  // Add the following SQL in your Supabase SQL editor or migration for fine-grained
  // read access scoped to org:
  //
  // CREATE POLICY "invoices_pdf_select_policy"
  // ON storage.objects FOR SELECT
  // USING (
  //   bucket_id = 'invoices-pdf'
  //   AND (storage.foldername(name))[1] IN (
  //     SELECT org_id::text FROM org_memberships WHERE user_id = auth.uid()
  //   )
  // );
  //
  // Uploads are service-role only (Inngest worker) — no INSERT policy needed for users.

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Storage setup complete!

Next step — add the following RLS policy in Supabase SQL editor:

  CREATE POLICY "invoices_pdf_select_policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices-pdf'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_memberships WHERE user_id = auth.uid()
    )
  );

Public URL format for PDFs:
  {SUPABASE_URL}/storage/v1/object/public/invoices-pdf/{orgId}/{invoiceId}/invoice-{number}.pdf
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
