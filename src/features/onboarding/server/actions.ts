"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createOrgSchema, type CreateOrgInput } from "../schemas";
import { revalidatePath } from "next/cache";
import { onboardClientSchema, type OnboardClientInput } from "../schemas";
import { createClientInDb, createOrganizationInDb } from "./mutations";
import { getUserExistingMembership } from "./queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendFirstClientAddedEmail, sendClientInviteEmail } from "@/emails/send";

export type CreateOrgState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof CreateOrgInput, string[]>>;
};

export async function createOrganizationAction(
  _prevState: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  // Step 1: Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create an organization." };
  }

  // Step 2: Validate
  const validationResult = createOrgSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!validationResult.success) {
    return {
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { name, type } = validationResult.data;

  // Step 3: Execute DB Mutation
  try {
    await createOrganizationInDb(user.id, name);
  } catch (error) {
    if (error instanceof Error && error.message === "NAME_CONFLICT") {
      return {
        error:
          "That organization name is taken or invalid. Please try another.",
      };
    }
    console.error("createOrganizationAction error:", error);
    return {
      error: "Something went wrong creating your workspace. Please try again.",
    };
  }

  // Step 4: Securely persist org type in Supabase app_metadata
  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: { org_type: type }, // Safely updating server-controlled metadata
    });
  } catch (error) {
    console.error("Failed to update app_metadata:", error);
    // Non-fatal error: We don't want to block the user if just the metadata fails
  }

  // Step 5: Set middleware cookie flag
  const cookieStore = await cookies();
  cookieStore.set("has_org", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // Step 6: Redirect
  redirect("/onboarding/add-client");
}

export type OnboardClientState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof OnboardClientInput, string[]>>;
};

export async function onboardClientAction(
  _prevState: OnboardClientState,
  formData: FormData,
): Promise<OnboardClientState> {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to complete this action." };
  }

  // 2. Validate input
  const validationResult = onboardClientSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
  });

  if (!validationResult.success) {
    return {
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  // 3. Execute Business Logic
  try {
    // Re-use our centralized query
    const membership = await getUserExistingMembership(user.id);

    if (!membership) {
      return { error: "No organization found for this account." };
    }

    const email = validationResult.data.email.toLowerCase();
    const companyName = validationResult.data.companyName;
    const contactName = validationResult.data.contactName;

    // Generate client invitation token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Call our abstracted mutation, passing the invitation metadata
    const { isFirstClient, orgName } = await createClientInDb(
      user.id,
      membership.orgId,
      validationResult.data,
      { tokenHash, expiresAt },
    );

    // Send invitation email to the newly created client
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const inviteUrl = `${appUrl}/client/auth?token=${rawToken}`;
      try {
        await sendClientInviteEmail({
          to: email,
          contactName,
          companyName,
          inviterName: orgName,
          inviteUrl,
          orgId: membership.orgId,
        });
      } catch (emailError) {
        console.error(
          "onboardClientAction warning: client invitation email failed:",
          emailError,
        );
      }
    } else {
      console.warn(
        "onboardClientAction warning: NEXT_PUBLIC_APP_URL is missing, client invite email not sent.",
      );
    }

    if (isFirstClient && user.email) {
      try {
        await sendFirstClientAddedEmail({
          to: user.email,
          clientCompanyName: companyName,
          clientContactName: contactName,
          clientEmail: email,
          orgId: membership.orgId,
        });
      } catch (emailError) {
        console.error(
          "onboardClientAction warning: first-client email failed:",
          emailError,
        );
      }
    }
  } catch (err) {
    console.error("onboardClientAction error:", err);
    return {
      error: "Something went wrong creating the client. Please try again.",
    };
  }

  // 4. Invalidate Cache & Redirect
  // Crucial: Clear the dashboard cache so the newly added client appears instantly
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
