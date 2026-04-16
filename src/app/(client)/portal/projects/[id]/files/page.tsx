import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getServerCaller } from "@/lib/trpc/server";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, folders, projects } from "@/db/schema";
import { PortalAssetList } from "@/features/portal/components/PortalAssetList";
import { ClientFileUploader } from "@/features/portal/components/ClientFileUploader";

type ProjectFilesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PortalProjectFilesPage({
  params,
}: ProjectFilesPageProps) {
  const { id: projectId } = await params;
  const caller = await getServerCaller();
  const session = await getSessionContext();

  if (!caller || !session) redirect("/login");

  const [project, assets, orgBranding] = await Promise.all([
    caller.portal.projectById({ projectId }).catch(() => null),
    caller.portal.projectAssets({ projectId }).catch(() => null),
    caller.portal.orgBranding(),
  ]);

  if (!project || !assets || !orgBranding) {
    notFound();
  }

  const folder = await withRLS(session, async (tx) => {
    const client = await tx.query.clients.findFirst({
      where: and(
        eq(clients.userId, session.userId),
        eq(clients.orgId, session.orgId),
      ),
      columns: { id: true, orgId: true },
    });
    if (!client) return null;

    const ownedProject = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.clientId, client.id),
        eq(projects.orgId, client.orgId),
      ),
      columns: { id: true },
    });
    if (!ownedProject) return null;

    return tx.transaction(async (trx) => {
      const existing = await trx.query.folders.findFirst({
        where: and(
          eq(folders.projectId, projectId),
          eq(folders.name, "Client Uploads"),
        ),
      });
      if (existing) return existing;

      const [created] = await trx
        .insert(folders)
        .values({
          projectId,
          name: "Client Uploads",
          parentId: null,
          orgId: client.orgId,
        })
        .returning();

      return created ?? null;
    });
  });

  if (!folder) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Project Files</h1>
        <p className="text-muted-foreground mt-1 text-sm">{project.name}</p>
      </div>

      <PortalAssetList assets={assets} projectId={projectId} />

      <ClientFileUploader
        projectId={projectId}
        folderId={folder.id}
        orgPlan={orgBranding.plan}
      />
    </div>
  );
}
