"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { X, Paperclip, AtSign, Send, Lock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Comment, ProjectMember } from "../../types";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  members: ProjectMember[];
  onSendMessage: (body: string, isInternal: boolean) => void;
  canViewInternal: boolean;
}

/* Deterministic color from name hash */
function nameToColor(name: string): string {
  const colors = [
    "bg-primary",
    "bg-primary",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] || "bg-primary";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* Simple markdown rendering for bold, italic, code */
function renderMessageBody(body: string): React.ReactNode {
  const parts = body.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-muted text-primary rounded px-1 py-0.5 text-[12px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-primary font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

const THREADS = ["General", "Bug Reports", "Design Feedback"] as const;

export function ChatPanel({
  isOpen,
  onClose,
  comments,
  members,
  onSendMessage,
  canViewInternal,
}: ChatPanelProps) {
  const reduced = useReducedMotion();
  const [inputVal, setInputVal] = useState("");
  const [internalMode, setInternalMode] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string>("General");
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      const isInternal = c.metadata?.internal === true;
      if (isInternal && !canViewInternal) return false;
      return true;
    });
  }, [comments, canViewInternal]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredComments.length, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputVal]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    onSendMessage(inputVal, internalMode);
    setInputVal("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const unreadCount = 0; // Placeholder for unread logic

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={reduced ? false : { x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 30 }
          }
          className="border-border bg-muted/30 flex h-[calc(100vh-64px)] w-[400px] shrink-0 flex-col border-l"
        >
          {/* Panel header */}
          <div className="border-border flex h-14 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <span className="text-foreground text-[14px] font-semibold">
                Project Discussion
              </span>
              {unreadCount > 0 && (
                <span className="text-primary-foreground bg-primary flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Thread selector */}
              <div className="relative">
                <button
                  onClick={() => setShowThreadMenu(!showThreadMenu)}
                  className="text-foreground/70 hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-[11px]"
                >
                  {selectedThread}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showThreadMenu && (
                  <div className="border-border bg-card absolute top-full right-0 z-10 mt-1 w-44 rounded-lg border p-1 shadow-xl">
                    {THREADS.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedThread(t);
                          setShowThreadMenu(false);
                        }}
                        className={`flex w-full items-center rounded-md px-3 py-1.5 text-[12px] ${selectedThread === t ? "bg-primary/15 text-primary" : "text-foreground/70 hover:bg-muted/50"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-muted-foreground hover:bg-muted hover:text-foreground/70 rounded-md p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-5">
              {filteredComments.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2">
                  <p className="text-muted-foreground text-[13px]">
                    No messages yet.
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Start the conversation below.
                  </p>
                </div>
              ) : (
                filteredComments.map((comment, i) => (
                  <motion.div
                    key={comment.id}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3"
                  >
                    <Avatar
                      className={`h-8 w-8 shrink-0 ${nameToColor(comment.author?.name || "?")}`}
                    >
                      <AvatarFallback className="text-foreground text-[10px] font-medium">
                        {getInitials(comment.author?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-foreground text-[13px] font-medium">
                          {comment.author?.name || "Unknown"}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {comment.metadata?.internal && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400/70">
                            <Lock className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-foreground/70 text-[13px] leading-relaxed">
                        {renderMessageBody(comment.body)}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={endRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="border-border shrink-0 border-t p-3">
            {canViewInternal && (
              <div className="mb-2 flex items-center gap-2">
                <button
                  onClick={() => setInternalMode(!internalMode)}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors ${
                    internalMode
                      ? "bg-amber-500/15 text-amber-400"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  <Lock className="h-3 w-3" />
                  {internalMode ? "Internal" : "Team only"}
                </button>
              </div>
            )}
            <div
              className={`flex flex-col rounded-lg border p-2 ${
                internalMode
                  ? "border-amber-500/30 bg-amber-500/[0.05]"
                  : "border-border bg-muted/50"
              }`}
            >
              <textarea
                ref={textareaRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message the team..."
                className="text-foreground placeholder:text-muted-foreground max-h-32 min-h-[40px] resize-none bg-transparent text-[13px] focus:outline-none"
                rows={1}
              />
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="text-muted-foreground hover:text-foreground/70 rounded p-1">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground/70 rounded p-1">
                    <AtSign className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!inputVal.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 gap-1 px-2.5 text-[11px] disabled:opacity-30"
                >
                  <Send className="h-3 w-3" /> Send
                </Button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
