"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, ChevronRight, MessageSquare, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Annotation } from "./types";

// ─── Utility: User Initials ──────────────────────────────────────────────────
function initials(name: string | null, email: string) {
  const displayName = name || email;
  return displayName
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── 1. Inline Comment Input Popover ─────────────────────────────────────────
interface InlinePopoverProps {
  x: number;
  y: number;
  onSave: (body: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function InlinePopover({ x, y, onSave, onCancel, isSaving }: InlinePopoverProps) {
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quadrant-aware anchoring: If in right/bottom parts, show left/above.
  const isRightHalf = x > 50;
  const isBottomHalf = y > 60;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isSaving) return;
    onSave(body.trim());
  };

  return (
    <div
      className="absolute z-50 flex w-[280px] flex-col rounded-xl border border-white/20 bg-background/90 p-3 shadow-xl backdrop-blur-md transition-all duration-200"
      style={{
        top: isBottomHalf ? undefined : `${y}%`,
        bottom: isBottomHalf ? `${100 - y}%` : undefined,
        left: isRightHalf ? undefined : `${x}%`,
        right: isRightHalf ? `${100 - x}%` : undefined,
        transform: `translate(${isRightHalf ? "-12px" : "12px"}, ${isBottomHalf ? "-12px" : "12px"})`,
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          ref={textareaRef}
          className="w-full resize-none rounded-lg border border-border bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          rows={3}
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isSaving}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="xs"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
            disabled={!body.trim() || isSaving}
          >
            {isSaving ? "Saving..." : "Add Pin"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── 2. Thread Side Panel ─────────────────────────────────────────────────────
interface ThreadSidePanelProps {
  annotation: Annotation | null;
  onClose: () => void;
  onReply: (body: string) => Promise<void>;
  onResolve: () => Promise<void>;
  currentUserId: string;
  currentUserRole: string;
  isAgency: boolean;
}

export function ThreadSidePanel({
  annotation,
  onClose,
  onReply,
  onResolve,
  currentUserId,
  currentUserRole,
  isAgency,
}: ThreadSidePanelProps) {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (annotation) {
      repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [annotation?.replies?.length, annotation]);

  if (!annotation) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReply(replyText.trim());
      setReplyText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Dim overlay over the canvas (10% black) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
      />

      {/* Drawer Container */}
      <motion.div
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        exit={{ x: 320 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="absolute right-0 top-0 bottom-0 z-50 flex w-[320px] flex-col border-l border-border bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white ring-2 ring-white">
              {annotation.metadata?.pinNumber}
            </span>
            <span className="text-sm font-semibold">Feedback Thread</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isAgency && !annotation.resolved && (
              <Button
                variant="outline"
                size="xs"
                className="gap-1 border-emerald-200/50 hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/20"
                onClick={onResolve}
              >
                <Check className="h-3 w-3" />
                Resolve
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chronological Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Original Comment */}
          <div className="flex gap-2">
            <Avatar className="h-7 w-7 ring-1 ring-border">
              <AvatarImage src={annotation.author.avatarUrl ?? ""} />
              <AvatarFallback className="text-[10px] font-medium bg-blue-100 text-blue-800">
                {initials(annotation.author.name, annotation.author.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold truncate">
                  {annotation.author.name || annotation.author.email}
                </span>
                {annotation.author.role === "client" ? (
                  <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-medium text-muted-foreground uppercase">
                    Client
                  </span>
                ) : (
                  <span className="rounded bg-blue-50 dark:bg-blue-950/50 px-1 py-0.2 text-[9px] font-medium text-blue-600 dark:text-blue-400 uppercase">
                    Agency
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
              </p>
              <p className="text-sm mt-1.5 text-foreground leading-relaxed whitespace-pre-wrap">
                {annotation.body}
              </p>
            </div>
          </div>

          {/* Replies */}
          {annotation.replies && annotation.replies.length > 0 && (
            <div className="border-l-2 border-muted/80 pl-3 ml-3 space-y-4 mt-4">
              {annotation.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <Avatar className="h-6 w-6 ring-1 ring-border">
                    <AvatarImage src={reply.author.avatarUrl ?? ""} />
                    <AvatarFallback className="text-[9px] font-semibold bg-muted">
                      {initials(reply.author.name, reply.author.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">
                        {reply.author.name || reply.author.email}
                      </span>
                      {reply.author.role === "client" ? (
                        <span className="rounded bg-muted px-1 py-0.2 text-[8px] font-medium text-muted-foreground uppercase">
                          Client
                        </span>
                      ) : (
                        <span className="rounded bg-blue-50 dark:bg-blue-950/50 px-1 py-0.2 text-[8px] font-medium text-blue-600 uppercase">
                          Agency
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </p>
                    <p className="text-xs mt-1 text-foreground leading-relaxed whitespace-pre-wrap">
                      {reply.body}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={repliesEndRef} />
            </div>
          )}
        </div>

        {/* Reply Footer Input */}
        <div className="border-t border-border p-3 bg-muted/5">
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <textarea
              className="flex-1 max-h-[72px] min-h-[36px] resize-none rounded-lg border border-border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
              placeholder="Reply to this thread..."
              rows={1}
              value={replyText}
              disabled={isSubmitting}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon-xs"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shrink-0"
              disabled={!replyText.trim() || isSubmitting}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </motion.div>
    </>
  );
}

// ─── 3. Annotations Sidebar Toggle / Panel ────────────────────────────────────
interface AnnotationsSidebarProps {
  annotations: Annotation[];
  resolvedAnnotations: Annotation[];
  onSelectPin: (id: string, page: number | null) => void;
  openCount: number;
}

export function AnnotationsSidebar({
  annotations,
  resolvedAnnotations,
  onSelectPin,
  openCount,
}: AnnotationsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedExpanded, setResolvedExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3 shrink-0 w-64 border-r border-border p-4 bg-muted/10 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">Annotations</h3>
        <span className="flex h-5 px-2 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-700 dark:text-amber-400">
          {openCount} Open
        </span>
      </div>

      {/* Unresolved feed */}
      <div className="space-y-2 flex-1">
        {annotations.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-4 text-center">
            No active pins on this file.
          </p>
        ) : (
          annotations.map((ann) => (
            <button
              key={ann.id}
              onClick={() => onSelectPin(ann.id, ann.metadata?.page ?? null)}
              className="w-full text-left p-2.5 rounded-lg border border-border bg-background hover:bg-muted/40 transition-all flex gap-2.5 group"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white group-hover:scale-105 transition-all">
                {ann.metadata?.pinNumber}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate text-foreground">
                    {ann.author.name || ann.author.email}
                  </span>
                  {ann.metadata?.page && (
                    <span className="text-[9px] bg-muted px-1 py-0.1 font-medium text-muted-foreground rounded shrink-0">
                      Pg {ann.metadata.page}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 truncate">
                  {ann.body}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Resolved section */}
      {resolvedAnnotations.length > 0 && (
        <div className="border-t border-border pt-3 mt-auto">
          <button
            onClick={() => setResolvedExpanded(!resolvedExpanded)}
            className="flex items-center justify-between w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          >
            <div className="flex items-center gap-1">
              {resolvedExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <span>Resolved ({resolvedAnnotations.length})</span>
            </div>
          </button>

          {resolvedExpanded && (
            <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
              {resolvedAnnotations.map((ann) => (
                <div
                  key={ann.id}
                  className="w-full p-2 rounded border border-dashed border-border bg-muted/20 flex gap-2 opacity-60"
                >
                  <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-muted-foreground text-[9px] font-bold text-white">
                    {ann.metadata?.pinNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-muted-foreground truncate">
                      {ann.author.name || ann.author.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 truncate">
                      {ann.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
