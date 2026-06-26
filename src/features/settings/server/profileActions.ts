"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { users } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB limit for avatars
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "org-assets";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().max(30).nullable().optional(),
});

export async function updateProfileAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const raw = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string | null,
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { name, phone } = parsed.data;

  try {
    await withRLS(ctx, async (tx) => {
      await tx
        .update(users)
        .set({
          name,
          phone: phone || null,
        })
        .where(eq(users.id, ctx.userId));
    });

    revalidatePath("/settings/profile");
    return { success: true };
  } catch (err: any) {
    console.error("[updateProfileAction] Failed to update profile:", err);
    return { success: false, error: "Failed to update profile details." };
  }
}

export async function uploadAvatarAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "Avatar file must be 3MB or less." };
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Unsupported file type. Allowed: ${ALLOWED_AVATAR_TYPES.join(", ")}`,
    };
  }

  const fileBuffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const filename = `avatar-${Date.now()}.${ext}`;
  const storagePath = `avatars/${ctx.userId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  try {
    await withRLS(ctx, async (tx) => {
      await tx
        .update(users)
        .set({
          avatarUrl: publicUrl,
        })
        .where(eq(users.id, ctx.userId));
    });

    revalidatePath("/settings/profile");
    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error("[uploadAvatarAction] Database save failed:", err);
    return { success: false, error: "Failed to save avatar image in profile." };
  }
}

export async function removeAvatarAction() {
  const ctx = await getSessionContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  try {
    await withRLS(ctx, async (tx) => {
      await tx
        .update(users)
        .set({ avatarUrl: null })
        .where(eq(users.id, ctx.userId));
    });

    revalidatePath("/settings/profile");
    return { success: true };
  } catch (err: any) {
    console.error("[removeAvatarAction] Database reset failed:", err);
    return { success: false, error: "Failed to remove avatar image." };
  }
}
