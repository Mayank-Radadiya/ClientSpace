"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Comment } from "../types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Lock, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DiscussionsTabProps {
  comments: Comment[];
  onSendMessage: (body: string, isInternal: boolean) => void;
  canViewInternal: boolean;
}

export function DiscussionsTab({
  comments,
  onSendMessage,
  canViewInternal,
}: DiscussionsTabProps) {
  const [inputVal, setInputVal] = useState("");
  const [internalMode, setInternalMode] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to bottom on new comments
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    onSendMessage(inputVal, internalMode);
    setInputVal("");
  };

  const filteredComments = comments.filter((c) => {
    const isInternal = c.metadata?.internal === true;
    if (isInternal && !canViewInternal) return false;
    return true; // project-level or asset-level chat
  });

  return (
    <div className="bg-background flex h-[650px] flex-col overflow-hidden rounded-lg border md:flex-row">
      {/* Threads Sidebar placeholder - In a full impl this would list specific threads instead of treating it as one big chat */}
      <div className="bg-muted/10 hidden w-full shrink-0 flex-col border-r md:flex md:w-72">
        <div className="flex h-14 shrink-0 items-center justify-between border-b p-4">
          <h3 className="text-sm font-semibold">Discussions</h3>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          <button className="bg-accent border-border/50 flex w-full cursor-pointer flex-col gap-1 rounded-md border p-3 text-left">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium">General Chat</span>
              <span className="text-muted-foreground text-[10px]">Now</span>
            </div>
            <span className="text-muted-foreground w-full truncate text-xs">
              Project-wide discussion...
            </span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="bg-card relative flex flex-1 flex-col">
        {/* Header */}
        <div className="bg-background/50 sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            General Chat
            {internalMode && (
              <Badge variant="secondary" className="h-5 text-[10px]">
                <Lock className="mr-1 h-3 w-3" /> Internal Mode
              </Badge>
            )}
          </div>
          {canViewInternal && (
            <Button
              variant={internalMode ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setInternalMode(!internalMode)}
            >
              <Lock
                className={`mr-2 h-4 w-4 ${internalMode ? "text-primary" : "text-muted-foreground"}`}
              />
              {internalMode ? "Internal Thread" : "Switch to Internal"}
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {filteredComments.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center space-y-2">
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs">Start the conversation below.</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className="group flex gap-4">
                <Avatar className="border-border/50 mt-1 h-8 w-8 shrink-0 border">
                  <AvatarImage src={comment.author?.avatar_url || ""} />
                  <AvatarFallback className="text-[11px]">
                    {comment.author?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="relative flex w-full flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">
                      {comment.author?.name || "Unknown"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(comment.created_at), "h:mm a")}
                    </span>
                    {comment.metadata?.internal && (
                      <span className="flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-widest text-amber-500 uppercase opacity-80 shadow-sm">
                        <Lock className="mr-1 h-3 w-3" /> Internal
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-full text-sm">
                    {/* Basic markdown emulation for bold/italic could go here, or a real parser */}
                    <p>{comment.body}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="bg-background shrink-0 border-t p-4">
          <div
            className={`bg-card focus-within:ring-primary relative flex items-end gap-2 rounded-xl border p-1 shadow-sm focus-within:ring-1 ${internalMode ? "border-amber-500/50 bg-amber-500/5" : ""}`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-9 w-9 shrink-0 hover:bg-transparent"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <textarea
              className={`placeholder:text-muted-foreground max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm focus:outline-none ${internalMode ? "text-amber-50" : "text-foreground"}`}
              placeholder={
                internalMode
                  ? "Type an internal note (only visible to team)..."
                  : "Write a message..."
              }
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.ctrlKey || e.metaKey || true)
                ) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              className="h-9 shrink-0 rounded-lg px-4 font-semibold"
              onClick={handleSend}
              disabled={!inputVal.trim()}
              variant={internalMode ? "secondary" : "default"}
            >
              <Send className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
