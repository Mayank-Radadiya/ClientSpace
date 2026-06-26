"use client";

import { useRouter } from "next/navigation";
import { InvoiceBuilder } from "@/features/invoices/components/InvoiceBuilder";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Client {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string;
}

interface Project {
  id: string;
  clientId: string;
  name: string;
}

export function InvoiceCreateClient({
  clients,
  projects,
}: {
  clients: Client[];
  projects: Project[];
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--inv-modal-bg)]">
      {/* Top sticky header bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--inv-divider)] bg-[var(--inv-modal-bg)]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/invoices" passHref legacyBehavior>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--inv-text-muted)] hover:bg-[var(--inv-surface-elevated)]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-[var(--inv-text-primary)]">
              Create New Invoice
            </h1>
            <p className="font-dm-mono text-[11px] text-[var(--inv-text-muted)]">
              Draft and issue a new invoice to your client
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <InvoiceBuilder
          clients={clients}
          projects={projects}
          previewOpen={true}
          onSuccess={() => router.push("/invoices")}
          onCancel={() => router.push("/invoices")}
        />
      </div>
    </div>
  );
}
