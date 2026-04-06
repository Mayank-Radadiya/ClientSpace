"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, invitations } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { sendClientInviteEmail } from "@/emails/send";
import { setActiveOrg } from "@/lib/auth/orgSwitcher";
import { inviteRateLimit } from "@/lib/rateLimit";
import {
  inviteClientSchema,
  acceptInviteSignUpSchema,
  acceptInviteSignInSchema,
  type AcceptInviteSignUpInput,
  type AcceptInviteSignInInput,
} from "../schemas";
import { reserveInvitationByToken } from "./queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { orgMemberships, organizations } from "@/db/schema";
import { redirect } from "next/navigation";
import { pool } from "@/db/pool";

async function rollbackInvitationToPending(
  invitationId: string,
  _orgId: string,
  _userId = "SYSTEM",
) {
  try {
    await pool`
      UPDATE invitations
      SET status = 'pending'
      WHERE id = ${invitationId}
        AND status = 'in_use'
    `;
  } catch (rollbackError) {
    console.error(
      "[rollbackInvitationToPending] Failed to rollback invitation:",
      rollbackError,
    );
  }
}

export type InviteActionResult =
  | { success: true; warning?: string }
  | { error: string | Record<string, string[]> };

async function getRequestMetadata() {
  const requestHeaders = await headers();
  return {
    ip:
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
    userAgent: requestHeaders.get("user-agent") || "unknown",
  };
}

function logClientInviteAccepted(event: {
  method: "signup" | "signin";
  invitationId: string;
  orgId: string;
  clientId: string;
  userId: string;
  ip: string;
  userAgent: string;
}) {
  const sanitizedIp = event.ip.slice(0, 128);
  const sanitizedUserAgent = event.userAgent.slice(0, 512);

  console.info("[AUDIT] client_invite_accepted", {
    ...event,
    ip: sanitizedIp,
    userAgent: sanitizedUserAgent,
    timestamp: new Date().toISOString(),
  });
}

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

  const inviteUrl = `${appUrl}/client/auth?token=${rawToken}`;

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
  const requestMeta = await getRequestMetadata();
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

  // 0. Rate limit check by email
  const rateLimitResult = inviteRateLimit(email);
  if (!rateLimitResult.allowed) {
    return {
      error:
        rateLimitResult.error || "Too many attempts. Please try again later.",
    };
  }

  // 1. Validate invitation
  const invitation = await reserveInvitationByToken(token);
  if (!invitation) {
    return {
      error:
        "Invalid or expired invitation link. Please contact the organization for a new invitation.",
    };
  }

  // 2. Verify email matches invitation
  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    await rollbackInvitationToPending(invitation.id, invitation.orgId);
    return {
      error: "Email address does not match the invitation.",
    };
  }

  // 3. Create Supabase auth account with email auto-confirmed (using admin API)
  // Since this is an invited client, we bypass email verification
  const adminClient = createAdminClient();
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for invited users
      user_metadata: { name },
    });

  if (authError || !authData.user) {
    console.error("[acceptInviteSignUpAction] Auth error:", authError);
    await rollbackInvitationToPending(invitation.id, invitation.orgId);
    return {
      error:
        authError?.message ||
        "Failed to create account. Please try again or contact support.",
    };
  }

  const userId = authData.user.id;

  // 3.5. Sign in the newly created user
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error(
      "[acceptInviteSignUpAction] Auto-signin failed after user creation:",
      signInError,
    );
    await rollbackInvitationToPending(invitation.id, invitation.orgId, userId);
    return {
      error:
        "Account created but sign-in failed. Please try signing in manually from the Sign In tab.",
    };
  }

  // DEBUG: Log auth state immediately after signup
  console.info("[acceptInviteSignUpAction] User created in auth.users:", {
    userId,
    email,
    emailConfirmed: authData.user.email_confirmed_at ? "yes" : "no",
    invitationId: invitation.id,
    orgId: invitation.orgId,
  });

  // 4. Ensure the user exists in public.users before the RLS-scoped transaction.
  // withRLS switches to the 'authenticated' role, which is blocked by the RLS
  // policy on the users table. Using pool (service role) bypasses RLS safely.
  // This is an upsert — if the Supabase trigger already ran it's a no-op.
  try {
    await pool`
      INSERT INTO users (id, email, name)
      VALUES (${userId}, ${email}, ${name})
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (userInsertErr) {
    console.error(
      "[acceptInviteSignUpAction] Failed to upsert user record:",
      userInsertErr,
    );
    await rollbackInvitationToPending(invitation.id, invitation.orgId, userId);
    return {
      error:
        "Failed to create user profile. Please try again or contact support.",
    };
  }

  // 4.5. Verify user exists in database before proceeding to RLS transaction
  // Small delay to ensure trigger has completed if it was running async
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify user actually exists by querying with service role
  const userVerification = await pool`
    SELECT id, email, name FROM users WHERE id = ${userId} LIMIT 1
  `;

  if (!userVerification || userVerification.length === 0) {
    console.error(
      "[acceptInviteSignUpAction] User record not found after insert:",
      {
        userId,
        email,
        triggerMayHaveFailed: true,
        manualInsertAttempted: true,
      },
    );
    await rollbackInvitationToPending(invitation.id, invitation.orgId, userId);
    return {
      error:
        "Failed to create user profile. The account was created but profile setup failed. Please contact support.",
    };
  }

  console.info("[acceptInviteSignUpAction] User verified in public.users:", {
    userId,
    email: userVerification[0]?.email,
    name: userVerification[0]?.name,
  });

  // 5. Link client record and create org membership atomically
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
    console.error("[acceptInviteSignUpAction] Database error:", {
      error: err,
      errorMessage: err instanceof Error ? err.message : String(err),
      userId,
      orgId: invitation.orgId,
      clientId: invitation.clientId,
      invitationId: invitation.id,
      // PostgreSQL error details
      code: (err as any)?.code,
      detail: (err as any)?.detail,
      constraint: (err as any)?.constraint,
      table: (err as any)?.table_name,
    });
    await rollbackInvitationToPending(invitation.id, invitation.orgId, userId);

    if (err instanceof Error && err.message === "CLIENT_ALREADY_LINKED") {
      return {
        error:
          "This client is already linked to another account. Please contact the organization for assistance.",
      };
    }

    // Check if it's the specific FK constraint error for missing user
    if (
      (err as any)?.code === "23503" &&
      (err as any)?.constraint === "org_memberships_user_id_users_id_fk"
    ) {
      return {
        error:
          "Account creation incomplete. The user profile was not found in the database. Please try again or contact support. (Error: FK constraint violation)",
      };
    }

    return {
      error:
        "Failed to complete invitation acceptance. Please try again or contact support.",
    };
  }

  // 6. Set active org cookie and redirect to client portal
  await setActiveOrg(invitation.orgId);
  logClientInviteAccepted({
    method: "signup",
    invitationId: invitation.id,
    orgId: invitation.orgId,
    clientId: invitation.clientId,
    userId,
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });
  revalidatePath("/client-portal");
  redirect("/client-portal");
}

/**
 * Accept client invitation by signing in with existing account
 */
export async function acceptInviteSignInAction(
  _prevState: AcceptInviteResult,
  formData: FormData,
): Promise<AcceptInviteResult> {
  const requestMeta = await getRequestMetadata();
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

  // 0. Rate limit check by email
  const rateLimitResult = inviteRateLimit(email);
  if (!rateLimitResult.allowed) {
    return {
      error:
        rateLimitResult.error || "Too many attempts. Please try again later.",
    };
  }

  // 1. Validate invitation
  const invitation = await reserveInvitationByToken(token);
  if (!invitation) {
    return {
      error:
        "Invalid or expired invitation link. Please contact the organization for a new invitation.",
    };
  }

  // 2. Verify email matches invitation
  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    await rollbackInvitationToPending(invitation.id, invitation.orgId);
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
    await rollbackInvitationToPending(invitation.id, invitation.orgId);
    return {
      error:
        authError?.message === "Invalid login credentials"
          ? "Invalid password. Please try again or use the 'Create Account' option."
          : authError?.message || "Failed to sign in. Please try again.",
    };
  }

  const userId = authData.user.id;

  // DEBUG: Log auth state for sign-in flow
  console.info("[acceptInviteSignInAction] User signed in:", {
    userId,
    email,
    invitationId: invitation.id,
    orgId: invitation.orgId,
  });

  // 4. Verify authenticated email matches invitation (security check)
  if (authData.user.email?.toLowerCase() !== email.toLowerCase()) {
    await supabase.auth.signOut();
    await rollbackInvitationToPending(invitation.id, invitation.orgId, userId);
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
    console.error("[acceptInviteSignInAction] Database error:", {
      error: err,
      errorMessage: err instanceof Error ? err.message : String(err),
      userId,
      orgId: invitation.orgId,
      clientId: invitation.clientId,
      invitationId: invitation.id,
      // PostgreSQL error details
      code: (err as any)?.code,
      detail: (err as any)?.detail,
      constraint: (err as any)?.constraint,
      table: (err as any)?.table_name,
    });
    await rollbackInvitationToPending(invitation.id, invitation.orgId, userId);

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

  // 6. Set active org cookie and redirect to client portal
  await setActiveOrg(invitation.orgId);
  logClientInviteAccepted({
    method: "signin",
    invitationId: invitation.id,
    orgId: invitation.orgId,
    clientId: invitation.clientId,
    userId,
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });
  revalidatePath("/client-portal");
  redirect("/client-portal");
}
