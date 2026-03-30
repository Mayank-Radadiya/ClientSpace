import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { invitations, organizations, clients } from "@/db/schema";

export type InvitationWithDetails = {
  id: string;
  email: string;
  clientId: string;
  orgId: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: Date;
  acceptedAt: Date | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  client: {
    id: string;
    companyName: string | null;
    contactName: string | null;
    email: string;
  };
};

/**
 * Fetches a valid invitation by raw token (hashes it first).
 * Returns null if token is invalid, expired, or already accepted.
 */
export async function getInvitationByToken(
  rawToken: string,
): Promise<InvitationWithDetails | null> {
  // Hash the raw token to match stored tokenHash
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  try {
    // Use SYSTEM context since user is not authenticated yet
    const invitation = await withRLS(
      { userId: "SYSTEM", orgId: "SYSTEM" },
      async (tx) => {
        const result = await tx
          .select({
            id: invitations.id,
            email: invitations.email,
            clientId: invitations.clientId,
            orgId: invitations.orgId,
            status: invitations.status,
            expiresAt: invitations.expiresAt,
            acceptedAt: invitations.acceptedAt,
            organizationId: organizations.id,
            organizationName: organizations.name,
            organizationSlug: organizations.slug,
            clientId_: clients.id,
            clientCompanyName: clients.companyName,
            clientContactName: clients.contactName,
            clientEmail: clients.email,
          })
          .from(invitations)
          .innerJoin(organizations, eq(invitations.orgId, organizations.id))
          .innerJoin(clients, eq(invitations.clientId, clients.id))
          .where(
            and(
              eq(invitations.tokenHash, tokenHash),
              eq(invitations.type, "client"),
              eq(invitations.status, "pending"),
              gt(invitations.expiresAt, new Date()),
            ),
          )
          .limit(1);

        const row = result[0];

        if (!row) {
          return null;
        }

        return {
          id: row.id,
          email: row.email,
          clientId: row.clientId,
          orgId: row.orgId,
          status: row.status,
          expiresAt: row.expiresAt,
          acceptedAt: row.acceptedAt,
          organization: {
            id: row.organizationId,
            name: row.organizationName,
            slug: row.organizationSlug,
          },
          client: {
            id: row.clientId_,
            companyName: row.clientCompanyName,
            contactName: row.clientContactName,
            email: row.clientEmail,
          },
        };
      },
    );

    return invitation;
  } catch (error) {
    console.error("[getInvitationByToken] Query failed:", error);
    return null;
  }
}
