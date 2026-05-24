"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to trigger Next.js cache revalidation.
 * Safe to call from client-side hooks or event handlers.
 */
export async function revalidateTagAction(tag: string) {
  try {
    revalidateTag(tag, "max");
    return { success: true };
  } catch (error) {
    console.error(`[revalidateTagAction] Failed to revalidate tag: ${tag}`, error);
    return { success: false, error: "Failed to revalidate cache tag." };
  }
}
