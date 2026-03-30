"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, gt } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, invitations } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { sendClientInviteEmail } from "@/emails/send";
import {
  inviteClientSchema,
  acceptInviteSignUpSchema,
  acceptInviteSignInSchema,
  type AcceptInviteSignUpInput,
  type AcceptInviteSignInInput,
} from "../schemas";
import { getInvitationByToken } from "./queries";
import { createClient } from "@/lib/supabase/server";
import { orgMemberships, users, organizations } from "@/db/schema";
import { redirect } from "next/navigation";

export type InviteActionResult =
  | { success: true; warning?: string }
  | { error: string | Record<string, string[]> };

export async function inviteClientAction(
  rawInput: unknown,
): Promise<InviteActionResult> {
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: "Unauthorized." };
  }

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only admins can invite clients." };
  }

  const parsed = inviteClientSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const companyName = parsed.data.companyName;
  const contactName = parsed.data.contactName;
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  let inviterName = "ClientSpace";

  try {
    await withRLS(ctx, async (tx) => {
      const org = await tx.query.organizations.findFirst({
        where: eq(organizations.id, ctx.orgId),
        columns: { name: true },
      });
      if (org) {
        inviterName = org.name;
      }

      const existingClient = await tx.query.clients.findFirst({
        where: and(eq(clients.orgId, ctx.orgId), eq(clients.email, email)),
      });

      let clientId = existingClient?.id;

      if (existingClient) {
        const pendingInvite = await tx.query.invitations.findFirst({
          where: and(
            eq(invitations.clientId, existingClient.id),
            eq(invitations.status, "pending"),
            gt(invitations.expiresAt, new Date()),
          ),
          orderBy: (invitation, { desc }) => [desc(invitation.createdAt)],
        });

        if (pendingInvite) {
          throw new Error("DUPLICATE_PENDING_INVITE");
        }
      } else {
        const [newClient] = await tx
          .insert(clients)
          .values({
            orgId: ctx.orgId,
            email,
            companyName,
            contactName,
            userId: null,
            status: "active",
          })
          .returning({ id: clients.id });

        if (!newClient) {
          throw new Error("CLIENT_INSERT_FAILED");
        }

        clientId = newClient.id;
      }

      await tx.insert(invitations).values({
        orgId: ctx.orgId,
        clientId: clientId!,
        email,
        type: "client",
        tokenHash,
        status: "pending",
        expiresAt,
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE_PENDING_INVITE") {
      return {
        error:
          'A pending invitation already exists for this client. Use "Resend Invite" to send a new link.',
      };
    }

    console.error("[inviteClientAction] Transaction failed:", err);
    return { error: "Database error. Please try again." };
  }

  revalidatePath("/dashboard/clients");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return {
      success: true,
      warning:
        "Client was created, but NEXT_PUBLIC_APP_URL is missing so the invitation email was not sent.",
    };
  }

  const inviteUrl = `${appUrl}/invite/accept?token=${rawToken}`;

  try {
    await sendClientInviteEmail({
      to: email,
      contactName,
      companyName,
      inviterName,
      inviteUrl,
    });
  } catch (err) {
    console.error("[inviteClientAction] Email delivery failed:", err);
    return {
      success: true,
      warning:
        'Client record created, but the invitation email could not be delivered. Use "Resend Invite" from the client list.',
    };
  }

  return { success: true };
}

export async function resendInviteAction(_clientId: string): Promise<never> {
  throw new Error("Not yet implemented - see Task 09.");
}

export async function revokeInviteAction(
  _invitationId: string,
): Promise<never> {
  throw new Error("Not yet implemented - see Task 09.");
}

// ─── Accept Invite Actions ───────────────────────────────────────────────────

export type AcceptInviteResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<
    Record<
      keyof AcceptInviteSignUpInput | keyof AcceptInviteSignInInput,
      string[]
    >
  >;
};

/**
 * Accept client invitation by creating a new account (sign up flow)
 */
export async function acceptInviteSignUpAction(
  _prevState: AcceptInviteResult,
  formData: FormData,
): Promise<AcceptInviteResult> {
  const parsed = acceptInviteSignUpSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<
        Record<keyof AcceptInviteSignUpInput, string[]>
      >,
    };
  }

  const { token, email, name, password } = parsed.data;

  // 1. Validate invitation
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return {
      error:
        "Invalid or expired invitation link. Please contact the organization for a new invitation.",
    };
  }

  // 2. Verify email matches invitation
  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    return {
      error: "Email address does not match the invitation.",
    };
  }

  // 3. Create Supabase auth account
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });

  if (authError || !authData.user) {
    console.error("[acceptInviteSignUpAction] Auth error:", authError);
    return {
      error:
        authError?.message ||
        "Failed to create account. Please try again or contact support.",
    };
  }

  const userId = authData.user.id;

  // 4. Link client record and create org membership atomically
  try {
    await withRLS({ userId, orgId: invitation.orgId }, async (tx) => {
      // 4a. Check if client is already linked to another user
      const existingClient = await tx.query.clients.findFirst({
        where: eq(clients.id, invitation.clientId),
      });

      if (existingClient?.userId && existingClient.userId !== userId) {
        throw new Error("CLIENT_ALREADY_LINKED");
      }

      // 4b. Update client record to link to new user
      await tx
        .update(clients)
        .set({ userId })
        .where(eq(clients.id, invitation.clientId));

      // 4c. Create org membership with 'client' role (idempotent check)
      const existingMembership = await tx.query.orgMemberships.findFirst({
        where: and(
          eq(orgMemberships.userId, userId),
          eq(orgMemberships.orgId, invitation.orgId),
        ),
      });

      if (!existingMembership) {
        await tx.insert(orgMemberships).values({
          userId,
          orgId: invitation.orgId,
          role: "client",
        });
      }

      // 4d. Mark invitation as accepted
      await tx
        .update(invitations)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(invitations.id, invitation.id));
    });
  } catch (err) {
    console.error("[acceptInviteSignUpAction] Database error:", err);

    if (err instanceof Error && err.message === "CLIENT_ALREADY_LINKED") {
      return {
        error:
          "This client is already linked to another account. Please contact the organization for assistance.",
      };
    }

    return {
      error:
        "Failed to complete invitation acceptance. Please try again or contact support.",
    };
  }

  // 5. Revalidate and redirect to dashboard
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Accept client invitation by signing in with existing account
 */
export async function acceptInviteSignInAction(
  _prevState: AcceptInviteResult,
  formData: FormData,
): Promise<AcceptInviteResult> {
  const parsed = acceptInviteSignInSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<
        Record<keyof AcceptInviteSignInInput, string[]>
      >,
    };
  }

  const { token, email, password } = parsed.data;

  // 1. Validate invitation
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return {
      error:
        "Invalid or expired invitation link. Please contact the organization for a new invitation.",
    };
  }

  // 2. Verify email matches invitation
  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    return {
      error: "Email address does not match the invitation.",
    };
  }

  // 3. Sign in with existing account
  const supabase = await createClient();
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    console.error("[acceptInviteSignInAction] Auth error:", authError);
    return {
      error:
        authError?.message === "Invalid login credentials"
          ? "Invalid password. Please try again or use the 'Create Account' option."
          : authError?.message || "Failed to sign in. Please try again.",
    };
  }

  const userId = authData.user.id;

  // 4. Verify authenticated email matches invitation (security check)
  if (authData.user.email?.toLowerCase() !== email.toLowerCase()) {
    await supabase.auth.signOut();
    return {
      error:
        "Authentication email mismatch. Please contact support for assistance.",
    };
  }

  // 5. Link client record and create org membership atomically
  try {
    await withRLS({ userId, orgId: invitation.orgId }, async (tx) => {
      // 5a. Check if client is already linked to another user
      const existingClient = await tx.query.clients.findFirst({
        where: eq(clients.id, invitation.clientId),
      });

      if (existingClient?.userId && existingClient.userId !== userId) {
        throw new Error("CLIENT_ALREADY_LINKED");
      }

      // 5b. Update client record to link to this user
      await tx
        .update(clients)
        .set({ userId })
        .where(eq(clients.id, invitation.clientId));

      // 5c. Create org membership with 'client' role (idempotent check)
      const existingMembership = await tx.query.orgMemberships.findFirst({
        where: and(
          eq(orgMemberships.userId, userId),
          eq(orgMemberships.orgId, invitation.orgId),
        ),
      });

      if (!existingMembership) {
        await tx.insert(orgMemberships).values({
          userId,
          orgId: invitation.orgId,
          role: "client",
        });
      }

      // 5d. Mark invitation as accepted
      await tx
        .update(invitations)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(invitations.id, invitation.id));
    });
  } catch (err) {
    console.error("[acceptInviteSignInAction] Database error:", err);

    if (err instanceof Error && err.message === "CLIENT_ALREADY_LINKED") {
      return {
        error:
          "This client is already linked to another account. Please contact the organization for assistance.",
      };
    }

    return {
      error:
        "Failed to complete invitation acceptance. Please try again or contact support.",
    };
  }

  // 6. Revalidate and redirect to dashboard
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
