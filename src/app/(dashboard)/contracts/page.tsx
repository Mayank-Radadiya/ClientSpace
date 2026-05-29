// src/app/(dashboard)/contracts/page.tsx
// Contracts list page — agency dashboard.

import type { Metadata } from "next";
import { ContractsPageClient } from "./_components/ContractsPageClient";

export const metadata: Metadata = {
  title: "Contracts | ClientSpace",
  description: "Manage client contracts, e-signing requests, and signed documents.",
};

export const dynamic = "force-dynamic";

export default function ContractsPage() {
  return <ContractsPageClient />;
}
