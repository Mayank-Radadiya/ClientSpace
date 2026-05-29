import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getServerCaller } from "@/lib/trpc/server";
import { createTRPCContext } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ClientPortalPresenceWidget } from "@/features/projects/presence/ClientPortalPresenceWidget";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PortalProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const caller = await getServerCaller();

  if (!caller) redirect("/login");

  const project = await caller.portal
    .projectById({ projectId: id })
    .catch(() => null);

  if (!project) {
    notFound();
  }

  // Fetch current user identity for presence tracking
  // SECURITY: Only name + avatarUrl — no email or sensitive data
  const ctx = await createTRPCContext();
  let currentUserId = "";
  let currentUserName = "Client";
  let currentUserAvatarUrl: string | null = null;

  if (ctx) {
    currentUserId = ctx.userId;
    try {
      const userProfile = await withRLS(
        { userId: ctx.userId, orgId: ctx.orgId },
        async (tx) => {
          return tx.query.users.findFirst({
            where: eq(users.id, ctx.userId),
            columns: { name: true, avatarUrl: true },
          });
        },
      );
      if (userProfile) {
        currentUserName = userProfile.name;
        currentUserAvatarUrl = userProfile.avatarUrl ?? null;
      }
    } catch (err) {
      console.error("[PortalProjectDetailPage] Failed to fetch user profile for presence:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Presence Widget — shows agency members who are online */}
      {currentUserId && (
        <ClientPortalPresenceWidget
          projectId={id}
          currentUser={{
            userId: currentUserId,
            name: currentUserName,
            avatarUrl: currentUserAvatarUrl,
            activeTab: "overview",
            joinedAt: Date.now(),
            isClient: true,
          }}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {project.description}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {project.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="bg-card rounded-xl border p-4 text-sm">
        <p className="text-muted-foreground">
          Deadline:{" "}
          <span className="text-foreground">
            {format(new Date(project.deadline), "MMM d, yyyy")}
          </span>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <div className="space-y-2">
          {project.milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="bg-card flex items-center gap-3 rounded-lg border p-3 text-sm"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  milestone.completed
                    ? "bg-green-500"
                    : "bg-muted-foreground/40"
                }`}
              />
              <span>{milestone.title}</span>
            </div>
          ))}
        </div>
      </section>

      <div>
        <Link
          href={`/portal/projects/${project.id}/files`}
          className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium"
        >
          View Files
        </Link>
      </div>
    </div>
  );
}
