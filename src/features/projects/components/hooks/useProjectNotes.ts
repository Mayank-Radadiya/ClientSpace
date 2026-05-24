"use client";
// src/features/projects/components/hooks/useProjectNotes.ts
// Auto-saving project notes hook with 500ms debounce.
// Calls revalidateProjectNotes() Server Action on success (Fix 7).

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { revalidateProjectNotes } from "@/features/projects/server/actions";
import type { SaveStatus } from "../types";

export function useProjectNotes(projectId: string) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = trpc.projectNotes.get.useQuery(
    { projectId },
    { staleTime: Infinity, gcTime: 10 * 60 * 1000 },
  );

  const upsertMut = trpc.projectNotes.upsert.useMutation({
    onSuccess: async () => {
      setSaveStatus("saved");
      await revalidateProjectNotes(projectId);
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: () => setSaveStatus("idle"),
  });

  /** Debounced save — called from onInput on the contenteditable div. */
  const debouncedSave = useCallback(
    (content: string) => {
      setSaveStatus("saving");
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        upsertMut.mutate({ projectId, content });
      }, 500);
    },
    [projectId, upsertMut],
  );

  return {
    content: data?.content ?? "",
    isLoading,
    saveStatus,
    debouncedSave,
  };
}
