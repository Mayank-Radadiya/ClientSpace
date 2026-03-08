"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations, orgMemberships } from "@/db/schema";
import { createOrgSchema, type CreateOrgInput } from "../schemas";
import { generateSlug } from "../utils/slug";

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
  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as CreateOrgState["fieldErrors"],
    };
  }

  const { name, type } = parsed.data;
  const slug = generateSlug(name);

  // Step 3: Transactional INSERT — org + owner membership
  // orgId: "SYSTEM" is the only legitimate sentinel use.
  // No RLS-gated data is queried — only new rows are inserted.
  try {
    await withRLS({ userId: user.id, orgId: "SYSTEM" }, async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name,
          slug,
          ownerId: user.id,
          plan: "starter",
          nextInvoiceNumber: 1001,
        })
        .returning({ id: organizations.id });

      if (!org) throw new Error("Organization insert returned no row");

      await tx.insert(orgMemberships).values({
        userId: user.id,
        orgId: org.id,
        role: "owner",
      });
    });
  } catch (err) {
    // Unique constraint violation on slug — random suffix collision (rare)
    if (
      err instanceof Error &&
      "code" in err &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err as any).code === "23505"
    ) {
      return { error: "Name conflict — please try again." };
    }
    console.error("createOrganizationAction error:", err);
    return { error: "Something went wrong. Please try again." };
  }

  // Step 4: Persist org type in Supabase app_metadata for personalization
  // app_metadata is server-controlled (unlike user_metadata which users can write)
  await supabase.auth.updateUser({
    data: { org_type: type },
  });

  // Step 5: Set middleware cookie flag
  const cookieStore = await cookies();
  cookieStore.set("has_org", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // Step 6: Redirect to guided setup step 2 (add first client)
  // /onboarding/add-client is built in Task 08
  redirect("/onboarding/add-client");
}
