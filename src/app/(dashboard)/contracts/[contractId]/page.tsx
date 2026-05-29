// src/app/(dashboard)/contracts/[contractId]/page.tsx
// Contract detail page — editor (draft) or read-only view (sent/signed).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContractDetailClient } from "./_components/ContractDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ contractId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { contractId } = await params;
  return {
    title: `Contract | ClientSpace`,
    description: "View and manage this contract.",
  };
}

export default async function ContractDetailPage({ params }: PageProps) {
  const { contractId } = await params;

  if (!contractId) notFound();

  return <ContractDetailClient contractId={contractId} />;
}
