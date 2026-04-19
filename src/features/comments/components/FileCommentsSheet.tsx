"use client";

import { MessageSquare } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CommentThread } from "./CommentThread";

type Role = "owner" | "admin" | "member" | "client";

type FileCommentsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
  currentUserId: string;
  currentUserRole: Role;
};

export function FileCommentsSheet({
  open,
  onOpenChange,
  assetId,
  assetName,
  currentUserId,
  currentUserRole,
}: FileCommentsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
          </SheetTitle>
          <SheetDescription className="truncate">{assetName}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0">
          <CommentThread
            assetId={assetId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
