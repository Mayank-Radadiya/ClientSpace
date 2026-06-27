"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Send, Paperclip, MessageSquare, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  from: "client" | "agency";
  author: string;
  text: string;
  timestamp: Date;
  attachments?: { name: string; size: string }[];
};

type Thread = {
  id: string;
  subject: string;
  projectName: string;
  lastMessage: string;
  lastDate: Date;
  unread: number;
  messages: Message[];
};

const INITIAL_THREADS: Thread[] = [
  {
    id: "1",
    subject: "Website design feedback",
    projectName: "Website Redesign",
    lastMessage: "We've updated the hero section based on your feedback.",
    lastDate: new Date(Date.now() - 1000 * 60 * 30),
    unread: 2,
    messages: [
      {
        id: "m1",
        from: "agency",
        author: "Sarah (Designer)",
        text: "Hi! We've uploaded the first draft of the homepage. Let us know what you think!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        id: "m2",
        from: "client",
        author: "You",
        text: "Looks great overall! Can we make the hero section a bit more prominent?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
      {
        id: "m3",
        from: "agency",
        author: "Sarah (Designer)",
        text: "Sure, I'll work on that and update you.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        id: "m4",
        from: "agency",
        author: "Sarah (Designer)",
        text: "We've updated the hero section based on your feedback. The new version is in the project files.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
    ],
  },
  {
    id: "2",
    subject: "Q4 invoice questions",
    projectName: "Brand Identity Package",
    lastMessage:
      "The invoice has been sent. Let me know if you have questions.",
    lastDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unread: 0,
    messages: [
      {
        id: "m5",
        from: "agency",
        author: "Mike (Accounts)",
        text: "Hi! Just a heads up that your Q4 invoice has been generated.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        id: "m6",
        from: "client",
        author: "You",
        text: "Thanks Mike. Can you break down the line items a bit more?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
      },
      {
        id: "m7",
        from: "agency",
        author: "Mike (Accounts)",
        text: "The invoice has been sent. Let me know if you have questions.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ],
  },
  {
    id: "3",
    subject: "New project kickoff",
    projectName: "Mobile App Development",
    lastMessage: "Looking forward to working together!",
    lastDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
    unread: 0,
    messages: [
      {
        id: "m8",
        from: "agency",
        author: "Alex (PM)",
        text: "Welcome! We're excited to start the mobile app project. I'll share the timeline this week.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
      {
        id: "m9",
        from: "client",
        author: "You",
        text: "Looking forward to working together!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 47),
      },
    ],
  },
];

function formatRelative(d: Date) {
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / 3600000)}h ago`;
  return format(d, "MMM d");
}

// ponytail: mock data, replace with tRPC + DB tables when messages schema exists

export function MessagesPageClient({
  brandName: _brandName,
}: {
  brandName: string;
}) {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages.length]);

  const handleSend = () => {
    if (!input.trim() || !activeThreadId) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      from: "client",
      author: "You",
      text: input.trim(),
      timestamp: new Date(),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastMessage: msg.text,
              lastDate: msg.timestamp,
              unread: 0,
              messages: [...t.messages, msg],
            }
          : t,
      ),
    );
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="bg-card flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border">
      {/* Thread list */}
      <div
        className={cn(
          "flex w-full flex-col border-r md:w-80 lg:w-96",
          showMobileList ? "block" : "hidden md:block",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">Messages</h2>
            {totalUnread > 0 && (
              <p className="text-muted-foreground text-xs">
                {totalUnread} unread
              </p>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center text-sm">
              <MessageSquare className="h-8 w-8" />
              <p>No conversations yet.</p>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setShowMobileList(false);
                  setThreads((prev) =>
                    prev.map((t) =>
                      t.id === thread.id ? { ...t, unread: 0 } : t,
                    ),
                  );
                }}
                className={cn(
                  "hover:bg-accent/50 flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors",
                  activeThreadId === thread.id && "bg-accent/30",
                )}
              >
                <Avatar className="mt-0.5 h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {thread.projectName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {thread.subject}
                    </p>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatRelative(thread.lastDate)}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {thread.projectName}
                  </p>
                  <p className="text-muted-foreground mt-0.5 truncate text-sm">
                    {thread.lastMessage}
                  </p>
                </div>
                {thread.unread > 0 && (
                  <span className="portal-accent-bg mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message area */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          showMobileList ? "hidden md:flex" : "flex",
        )}
      >
        {!activeThread ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <MessageSquare className="h-10 w-10" />
            <p className="text-sm">Select a conversation to view messages</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <button
                type="button"
                className="md:hidden"
                onClick={() => setShowMobileList(true)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {activeThread.projectName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{activeThread.subject}</p>
                <p className="text-muted-foreground text-xs">
                  {activeThread.projectName}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {activeThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.from === "client" && "flex-row-reverse",
                    )}
                  >
                    {msg.from !== "client" && (
                      <Avatar className="mt-0.5 h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {msg.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5",
                        msg.from === "client"
                          ? "portal-accent-bg rounded-br-md"
                          : "bg-muted rounded-bl-md",
                      )}
                    >
                      {msg.from !== "client" && (
                        <p className="mb-1 text-[11px] font-medium opacity-70">
                          {msg.author}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] opacity-60",
                          msg.from === "client" && "text-right",
                        )}
                      >
                        {format(msg.timestamp, "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </div>

            <div className="border-t p-3">
              <div className="flex items-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="min-h-[40px] resize-none"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
