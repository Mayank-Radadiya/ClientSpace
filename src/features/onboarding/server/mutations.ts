import { count, eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients } from "@/db/schema";
import type { OnboardClientInput } from "../schemas";
import { organizations, orgMemberships } from "@/db/schema";
import { generateSlug } from "../utils/slug";

const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

/**
 * Inserts a new client into the database under the specified organization.
 */
export async function createClientInDb(
  userId: string,
  orgId: string,
  clientData: OnboardClientInput,
) {
  return await withRLS({ userId, orgId }, async (tx) => {
    const clientCountRows = await tx
      .select({ totalClients: count() })
      .from(clients)
      .where(eq(clients.orgId, orgId));
    const totalClients = clientCountRows[0]?.totalClients ?? 0;

    await tx.insert(clients).values({
      orgId,
      companyName: clientData.companyName,
      contactName: clientData.contactName,
      email: clientData.email,
      status: "active", // Consider making this a default value at the DB schema level
    });

    return { isFirstClient: totalClients === 0 };
  });
}

export async function createOrganizationInDb(
  userId: string,
  name: string,
): Promise<{ id: string; slug: string }> {
  const slug = generateSlug(name);

  try {
    return await withRLS({ userId, orgId: "SYSTEM" }, async (tx) => {
      // 1. Create Organization
      const [org] = await tx
        .insert(organizations)
        .values({
          name,
          slug,
          ownerId: userId,
          plan: "starter",
          nextInvoiceNumber: 1001,
        })
        .returning({ id: organizations.id });

      if (!org) throw new Error("Organization insert returned no row");

      // 2. Assign Owner Membership
      await tx.insert(orgMemberships).values({
        userId,
        orgId: org.id,
        role: "owner",
      });

      return { id: org.id, slug };
    });
  } catch (error) {
    // Safely check for Postgres unique constraint violation without `any`
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as Record<string, unknown>).code === POSTGRES_UNIQUE_VIOLATION_CODE
    ) {
      throw new Error("NAME_CONFLICT");
    }
    throw error;
  }
}
