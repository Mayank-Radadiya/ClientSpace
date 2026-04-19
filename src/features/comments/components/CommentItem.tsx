"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { editCommentAction } from "@/features/comments/server/actions";

type Role = "owner" | "admin" | "member" | "client";

export type CommentView = {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: string | Date;
  editedAt: string | Date | null;
  isDeleted: boolean;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    role: Role | null;
  };
};

type CommentItemProps = {
  comment: CommentView;
  currentUserId: string;
  currentUserRole: Role;
  depth?: number;
  onReply?: (commentId: string, authorName: string) => void;
  onHide?: (commentId: string) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
  depth = 0,
  onReply,
  onHide,
}: CommentItemProps) {
  const isOwner = comment.author.id === currentUserId;
  const canHide = currentUserRole === "admin" || currentUserRole === "owner";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [saving, setSaving] = useState(false);

  const displayName = comment.author.name ?? comment.author.email;
  const relative = useMemo(
    () => formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }),
    [comment.createdAt],
  );

  const handleSaveEdit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const result = await editCommentAction({ commentId: comment.id, body: draft.trim() });
      if ("error" in result) {
        toast.error(result.error ?? "Failed to edit comment.");
        return;
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={depth > 0 ? "ml-8" : ""}>
      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={comment.author.avatarUrl ?? ""} />
              <AvatarFallback>{initials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{displayName}</p>
                {comment.author.role === "client" ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Client</span>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">
                {relative}
                {comment.editedAt ? " (edited)" : ""}
              </p>
            </div>
          </div>

          {!comment.isDeleted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Comment actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? <DropdownMenuItem onClick={() => setEditing(true)}>Edit</DropdownMenuItem> : null}
                {canHide && onHide ? (
                  <DropdownMenuItem variant="destructive" onClick={() => onHide(comment.id)}>
                    Hide
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.currentTarget.value)} />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.body);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => void handleSaveEdit()} disabled={saving}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className={comment.isDeleted ? "text-sm italic text-muted-foreground" : "text-sm"}>
            {comment.body}
          </p>
        )}

        {!comment.isDeleted && depth === 0 && onReply ? (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onReply(comment.id, comment.author.name ?? "Unknown")}
            >
              Reply
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
