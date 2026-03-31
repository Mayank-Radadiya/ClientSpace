import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { TimeoutError, withTimeout } from "@/lib/auth/timeout";

export const getUser = cache(async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await withTimeout(
      supabase.auth.getUser(),
      5000,
      "supabase.auth.getUser",
    );

    return user;
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error("[getUser] Timeout while fetching user:", error.message);
      return null;
    }

    console.error("[getUser] Failed to fetch user:", error);
    return null;
  }
});
