"use client";

import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import { SidebarUser } from "./SidebarUser";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { trpc } from "@/lib/trpc/client";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";

export const SidebarUserContainer = memo(() => {
  const router = useRouter();

  // Initialize once to prevent unnecessary effect triggers on re-renders
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);

  const { data: profile } = trpc.auth.me.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    // 1. Fetch initial user immediately to prevent UI flashing
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    // 2. Listen for subsequent auth changes purely via the session object
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Use session?.user directly instead of making another network request
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      // Supabase returns an error object rather than throwing exceptions
      if (error) throw error;

      toast.success("Successfully logged out");
      router.push("/login");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Failed to log out");
    }
  }, [router, supabase]);

  const name =
    profile?.name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    null;

  const image = profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? null;

  return (
    <SidebarUser
      name={name}
      email={user?.email ?? null}
      image={image}
      onLogout={handleLogout}
    />
  );
});

SidebarUserContainer.displayName = "SidebarUserContainer";
