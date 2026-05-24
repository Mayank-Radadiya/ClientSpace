"use client";

import React, { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/features/projects/hooks/queryKeys";
import { fileKeys } from "@/features/files/hooks/queryKeys";
import { invoiceKeys } from "@/features/invoices/hooks/queryKeys";

type RealtimeProviderProps = {
  children: React.ReactNode;
  orgId: string;
};

/**
 * Subscribes to real-time Postgres changes for projects, assets, and invoices tables,
 * scoped by orgId, and invalidates corresponding TanStack Query cache keys.
 * Removes channels cleanly on unmount or orgId switch.
 */
export function GlobalRealtimeProvider({ children, orgId }: RealtimeProviderProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orgId) return;

    const supabase = createClient();

    // 1. Projects subscription
    const projectsChannel = supabase
      .channel(`realtime:org-${orgId}-projects`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: projectKeys.list(orgId) });
        }
      )
      .subscribe();

    // 2. Files (assets) subscription
    const filesChannel = supabase
      .channel(`realtime:org-${orgId}-files`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assets",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: fileKeys.all(orgId) });
        }
      )
      .subscribe();

    // 3. Invoices subscription
    const invoicesChannel = supabase
      .channel(`realtime:org-${orgId}-invoices`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: invoiceKeys.list(orgId) });
        }
      )
      .subscribe();

    // Unsubscribe cleanly
    return () => {
      void supabase.removeChannel(projectsChannel);
      void supabase.removeChannel(filesChannel);
      void supabase.removeChannel(invoicesChannel);
    };
  }, [orgId, queryClient]);

  return <>{children}</>;
}
