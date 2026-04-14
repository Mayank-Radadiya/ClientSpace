// src/app/(dashboard)/projects/[projectId]/invoices/page.tsx
// Project-scoped invoices page with financial summary

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { eq } from "drizzle-orm";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { getServerCaller } from "@/lib/trpc/server";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, projects } from "@/db/schema";
import { createTRPCContext } from "@/lib/trpc/init";
import { trpc } from "@/lib/trpc/client";
import { getQueryClient } from "@/lib/trpc/query-client";

// Components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProjectInvoicesPageClient } from "@/features/invoices/components/ProjectInvoicesPageClient";
import { Skeleton } from "@/components/ui/skeleton";

type InvoicesPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectInvoicesPage({
  params,
}: InvoicesPageProps) {
  const { projectId } = await params;

  // Get context for auth and org
  const ctx = await createTRPCContext();
  if (!ctx) redirect("/login");

  // Get caller for data fetching
  const caller = await getServerCaller();
  if (!caller) notFound();

  const queryClient = getQueryClient();

  // Fetch project details
  const project = await caller.project
    .getById({ id: projectId })
    .catch(() => null);
  if (!project) notFound();

  // Fetch clients and projects for the invoice builder
  const [orgClients, orgProjects, projectInvoices, projectFinancials] =
    await Promise.all([
      withRLS(ctx, async (tx) =>
        tx
          .select({
            id: clients.id,
            companyName: clients.companyName,
            contactName: clients.contactName,
            email: clients.email,
          })
          .from(clients)
          .where(eq(clients.orgId, ctx.orgId)),
      ),
      withRLS(ctx, async (tx) =>
        tx
          .select({
            id: projects.id,
            clientId: projects.clientId,
            name: projects.name,
          })
          .from(projects)
          .where(eq(projects.orgId, ctx.orgId)),
      ),
      caller.invoice.getByProject({ projectId }),
      caller.invoice.getProjectFinancials({ projectId }),
    ]);

  queryClient.setQueryData(
    getQueryKey(trpc.invoice.getByProject, { projectId }, "query"),
    projectInvoices,
  );
  queryClient.setQueryData(
    getQueryKey(trpc.invoice.getProjectFinancials, { projectId }, "query"),
    projectFinancials,
  );

  const isOwnerOrAdmin = ctx.role === "owner" || ctx.role === "admin";

  return (
    <div className="bg-background flex h-full w-full flex-col overflow-hidden">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header className="border-border bg-background flex shrink-0 flex-col gap-4 border-b px-6 py-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/projects"
                className="hover:text-foreground transition-colors"
              >
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/projects/${projectId}`}
                className="hover:text-foreground max-w-50 truncate transition-colors hover:cursor-pointer"
              >
                {project.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">Invoices</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="bg-muted/10 flex min-h-0 flex-1 overflow-auto">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<ProjectInvoicesPageSkeleton />}>
            <ProjectInvoicesPageClient
              projectInfo={{
                id: project.id,
                name: project.name,
                clientId: project.clientId,
                clientCompanyName: project.clientCompanyName,
              }}
              clients={orgClients}
              projects={orgProjects}
              isOwnerOrAdmin={isOwnerOrAdmin}
            />
          </Suspense>
        </HydrationBoundary>
      </main>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProjectInvoicesPageSkeleton() {
  return (
    <div className="w-full space-y-6 p-6 md:p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
