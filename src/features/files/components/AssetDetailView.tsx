"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileCommentsSheet } from "@/features/comments/components/FileCommentsSheet";

type Role = "owner" | "admin" | "member" | "client";

type AssetDetailViewProps = {
  projectId: string;
  assetId: string;
  assetName: string;
  mimeType: string;
  updatedAt: string | Date;
  currentUserId: string;
  currentUserRole: Role;
};

export function AssetDetailView({
  assetId,
  assetName,
  mimeType,
  updatedAt,
  currentUserId,
  currentUserRole,
}: AssetDetailViewProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <div className="relative h-full w-full overflow-auto p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{assetName}</h1>
        <p className="text-muted-foreground text-sm">{mimeType}</p>
        <p className="text-muted-foreground text-sm">
          Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-6 right-6 z-10 gap-2 shadow-lg"
        onClick={() => setCommentsOpen(true)}
      >
        <MessageSquare className="h-4 w-4" />
        Comments
      </Button>

      <FileCommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        assetId={assetId}
        assetName={assetName}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
