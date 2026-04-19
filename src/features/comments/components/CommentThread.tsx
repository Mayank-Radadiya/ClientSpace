"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { trpc } from "@/lib/trpc/client";
import {
  createCommentAction,
  deleteCommentAction,
} from "@/features/comments/server/actions";
import { CommentInput } from "./CommentInput";
import { CommentItem, type CommentView } from "./CommentItem";

type Role = "owner" | "admin" | "member" | "client";

type ThreadedComment = CommentView & { replies: CommentView[] };

type CommentThreadProps = {
  assetId: string;
  currentUserId: string;
  currentUserRole: Role;
};

function buildThreads(flat: CommentView[]): ThreadedComment[] {
  const map = new Map<string, ThreadedComment>();
  const roots: ThreadedComment[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of flat) {
    const node = map.get(c.id);
    if (!node) continue;
    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function CommentThread({
  assetId,
  currentUserId,
  currentUserRole,
}: CommentThreadProps) {
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const queryKey = getQueryKey(trpc.comments.byAssetId, { assetId }, "query");

  const { data: flatComments = [], isLoading } = trpc.comments.byAssetId.useQuery({
    assetId,
  });

  const createMutation = useMutation({
    mutationFn: async ({ body, parentId }: { body: string; parentId?: string | null }) => {
      const result = await createCommentAction({ body, assetId, parentId: parentId ?? null });
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    onMutate: async ({ body, parentId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommentView[]>(queryKey) ?? [];
      const optimistic: CommentView = {
        id: `optimistic-${Date.now()}`,
        body,
        parentId: parentId ?? null,
        createdAt: new Date(),
        editedAt: null,
        isDeleted: false,
        author: {
          id: currentUserId,
          name: "You",
          avatarUrl: null,
          email: "",
          role: currentUserRole,
        },
      };

      queryClient.setQueryData<CommentView[]>(queryKey, [...previous, optimistic]);
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(error.message || "Failed to post comment.");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const hideMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await deleteCommentAction({ commentId });
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommentView[]>(queryKey) ?? [];
      const next = previous.map((c) =>
        c.id === commentId ? { ...c, body: "[deleted]", isDeleted: true } : c,
      );
      queryClient.setQueryData<CommentView[]>(queryKey, next);
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(error.message || "Failed to hide comment.");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [flatComments.length]);

  const threads = useMemo(() => buildThreads(flatComments as CommentView[]), [flatComments]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? <p className="text-muted-foreground text-sm">Loading comments...</p> : null}

        {!isLoading && threads.length === 0 ? (
          <p className="text-muted-foreground text-sm">No comments yet. Start the conversation.</p>
        ) : null}

        {threads.map((thread) => (
          <div key={thread.id} className="space-y-2">
            <CommentItem
              comment={thread}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onReply={(id, name) => setReplyTo({ id, name })}
              onHide={(id) => hideMutation.mutate(id)}
            />
            {thread.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={1}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onHide={(id) => hideMutation.mutate(id)}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <CommentInput
        assetId={assetId}
        parentId={replyTo?.id ?? null}
        replyingToName={replyTo?.name}
        onCancelReply={() => setReplyTo(null)}
        disabled={createMutation.isPending}
        onSubmit={async (body, parentId) => {
          await createMutation.mutateAsync({ body, parentId });
          setReplyTo(null);
        }}
      />
    </div>
  );
}
