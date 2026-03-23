import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { projectStatusEnum, projectPriorityEnum } from "@/db/schema";
import { getQueryKey } from "@trpc/react-query";
import { withRLS } from "@/db/createDrizzleClient";
import { clients } from "@/db/schema";
import { ProjectList } from "../../../features/projects/components/ProjectList";
// import { getUser } from "@/lib/auth/getUser";
import { trpc } from "@/lib/trpc/client";
import { getQueryClient } from "@/lib/trpc/query-client";
import { getServerCaller } from "@/lib/trpc/server";
import { createTRPCContext } from "@/lib/trpc/init";

export const metadata = { title: "Projects — ClientSpace" };

const DEFAULT_FILTERS = {
  search: "",
  status: [] as (typeof projectStatusEnum.enumValues)[number][],
  priority: [] as (typeof projectPriorityEnum.enumValues)[number][],
  limit: 50,
};

export default async function ProjectsPage() {
  // const user = await getUser();
  // if (!user) redirect("/login");

  const ctx = await createTRPCContext();
  if (!ctx) redirect("/onboarding");

  // Server-side trpc caller uses cached ctx
  const queryClient = getQueryClient();
  const caller = await getServerCaller();

  // Fetch only the client list (lightweight — needed for the create-project form)
  // AND prefetch projects concurrently
  const [orgClients] = await Promise.all([
    withRLS(ctx, async (tx) =>
      tx
        .select({
          id: clients.id,
          companyName: clients.companyName,
          email: clients.email,
        })
        .from(clients)
        .where(eq(clients.orgId, ctx.orgId)),
    ),
    (async () => {
      if (caller) {
        const queryKey = getQueryKey(
          trpc.project.getAll,
          DEFAULT_FILTERS,
          "infinite",
        );
        await queryClient.prefetchInfiniteQuery({
          queryKey,
          queryFn: () => caller.project.getAll(DEFAULT_FILTERS),
          initialPageParam: undefined,
        });
      }
    })(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <ProjectList
          clients={orgClients}
          userRole={ctx.role as "admin" | "owner" | "member" | "client"}
        />
      </div>
    </HydrationBoundary>
  );
}
