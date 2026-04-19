"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentInputProps = {
  assetId: string;
  parentId?: string | null;
  onSubmit: (body: string, parentId?: string | null) => Promise<void> | void;
  onCancelReply?: () => void;
  replyingToName?: string;
  disabled?: boolean;
};

export function CommentInput({
  assetId: _assetId,
  parentId,
  onSubmit,
  onCancelReply,
  replyingToName,
  disabled,
}: CommentInputProps) {
  const [value, setValue] = useState("");

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    await onSubmit(trimmed, parentId ?? null);
    setValue("");
  };

  return (
    <div className="border-t p-3">
      {replyingToName && onCancelReply ? (
        <div className="mb-2 flex items-center justify-between rounded-md border bg-muted/40 px-2 py-1 text-xs">
          <span className="text-muted-foreground">
            Replying to <span className="font-medium text-foreground">{replyingToName}</span>
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      <Textarea
        className="min-h-[72px]"
        placeholder="Write a comment..."
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
        }}
      />

      <div className="mt-2 flex items-center justify-between">
        <p className="text-muted-foreground text-xs">Cmd/Ctrl + Enter to post</p>
        <Button size="sm" onClick={() => void submit()} disabled={disabled || !value.trim()}>
          Post
        </Button>
      </div>
    </div>
  );
}
