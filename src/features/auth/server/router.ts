import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.id, ctx.userId),
        columns: {
          id: true,
          name: true,
          avatarUrl: true,
          email: true,
        },
      });

      return user ?? null;
    });
  }),
});
