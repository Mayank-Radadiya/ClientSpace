import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { getSessionContext } from "@/lib/auth/session";
import { getServerCaller } from "@/lib/trpc/server";
import { AssetDetailView } from "@/features/files/components/AssetDetailView";

type AssetPageProps = {
  params: Promise<{ projectId: string; assetId: string }>;
};

export default async function AssetPage({ params }: AssetPageProps) {
  const { projectId, assetId } = await params;

  const user = await getUser();
  if (!user) redirect("/login");

  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const caller = await getServerCaller();
  if (!caller) notFound();

  const asset = await caller.file.getAssetById({ assetId }).catch(() => null);
  if (!asset || asset.projectId !== projectId) notFound();

  return (
    <AssetDetailView
      projectId={projectId}
      assetId={assetId}
      assetName={asset.name}
      mimeType={asset.type}
      updatedAt={asset.updatedAt}
      currentUserId={user.id}
      currentUserRole={ctx.role}
    />
  );
}
