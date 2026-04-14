import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Milestone, Comment, Asset } from "../types";

export interface UseProjectDetailProps {
  projectId: string;
  orgId: string;
  initialMilestones?: Milestone[];
  initialDiscussions?: Comment[];
  initialFiles?: Asset[];
}

export function useProjectDetail({
  projectId,
  orgId,
  initialMilestones = [],
  initialDiscussions = [],
  initialFiles = [],
}: UseProjectDetailProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [discussions, setDiscussions] = useState<Comment[]>(initialDiscussions);
  const [files, setFiles] = useState<Asset[]>(initialFiles);
  const supabase = createClient();

  useEffect(() => {
    if (!projectId || !orgId) return;

    // Supabase real-time channels
    const milestonesChannel = supabase
      .channel(`project-milestones:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "milestones",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMilestones((prev) => [...prev, payload.new as Milestone]);
          } else if (payload.eventType === "UPDATE") {
            setMilestones((prev) =>
              prev.map((m) =>
                m.id === payload.new.id ? { ...m, ...payload.new } : m,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setMilestones((prev) =>
              prev.filter((m) => m.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    const discussionsChannel = supabase
      .channel(`project-discussions:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDiscussions((prev) => [...prev, payload.new as Comment]);
          } else if (payload.eventType === "UPDATE") {
            setDiscussions((prev) =>
              prev.map((c) =>
                c.id === payload.new.id ? { ...c, ...payload.new } : c,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setDiscussions((prev) =>
              prev.filter((c) => c.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    const filesChannel = supabase
      .channel(`project-files:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assets",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setFiles((prev) => [payload.new as Asset, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === payload.new.id ? { ...f, ...payload.new } : f,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setFiles((prev) => prev.filter((f) => f.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(milestonesChannel);
      supabase.removeChannel(discussionsChannel);
      supabase.removeChannel(filesChannel);
    };
  }, [projectId, orgId, supabase]);

  // Expose optimistic update helpers
  const updateMilestoneOptimistic = (
    id: string,
    updates: Partial<Milestone>,
  ) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
  };

  const addMilestoneOptimistic = (milestone: Milestone) => {
    setMilestones((prev) => [...prev, milestone]);
  };

  const addDiscussionOptimistic = (comment: Comment) => {
    setDiscussions((prev) => [...prev, comment]);
  };

  return {
    milestones,
    discussions,
    files,
    updateMilestoneOptimistic,
    addMilestoneOptimistic,
    addDiscussionOptimistic,
    setFiles,
  };
}
