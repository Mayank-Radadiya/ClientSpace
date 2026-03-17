/**
 * SidebarUserContainer Component
 * ------------------------------
 * Container component responsible for connecting authentication data
 * to the SidebarUser presentation component.
 *
 * Responsibilities:
 *  - Read the current authenticated session from Supabase
 *  - Map session data into SidebarUser props
 *  - Handle user logout flow and redirection
 *
 * This component separates authentication logic from UI rendering,
 * keeping SidebarUser purely presentational.
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SidebarUser } from "./SidebarUser";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";

export const SidebarUserContainer = () => {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  /**
   * Session data
   * ------------
   * Retrieved from Supabase client.
   *
   * data.user contains:
   *  - email
   *  - user_metadata (name, avatar_url, etc)
   */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  /**
   * handleLogout
   * ------------
   * Triggers the sign-out process and handles post-logout behavior.
   *
   * Flow:
   *  1. Call Supabase signOut
   *  2. Show success toast
   *  3. Redirect user to sign-in page
   */
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully logged out");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  }, [router, supabase]);

  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    null;
  const image = user?.user_metadata?.avatar_url ?? null;

  return (
    <SidebarUser
      name={name}
      email={user?.email ?? null}
      image={image}
      onLogout={handleLogout}
    />
  );
};
