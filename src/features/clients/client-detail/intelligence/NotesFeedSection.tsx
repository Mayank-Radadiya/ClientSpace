"use client";

import { useCallback, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { motion, AnimatePresence } from "motion/react";
import { Pin, PinOff, Edit2, Trash2, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelative } from "../../utils/formatters";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteItem {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
}

interface NotesFeedSectionProps {
  clientId: string;
  role: "owner" | "admin" | "member" | "client";
}

// ─── Author Avatar ────────────────────────────────────────────────────────────

function AuthorAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-6 w-6 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
      {initials}
    </span>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────

interface NoteCardProps {
  note: NoteItem;
  role: "owner" | "admin" | "member" | "client";
  currentUserId?: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  isUpdating: boolean;
}

function NoteCard({
  note,
  role,
  currentUserId,
  onEdit,
  onDelete,
  onTogglePin,
  isUpdating,
}: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canEdit =
    role === "owner" ||
    role === "admin" ||
    (role === "member" && note.authorId === currentUserId);

  const canPin = role === "owner" || role === "admin";

  function startEdit() {
    setEditContent(note.content);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function cancelEdit() {
    setEditing(false);
    setEditContent(note.content);
  }

  function saveEdit() {
    if (!editContent.trim()) return;
    onEdit(note.id, editContent.trim());
    setEditing(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "border-border bg-card group rounded-2xl border p-4",
        note.isPinned && "border-primary/20 bg-primary/[0.02]",
      )}
    >
      {editing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            rows={3}
            className={cn(
              "text-foreground placeholder-muted-foreground w-full resize-none rounded-xl",
              "border border-primary/30 bg-primary/[0.03] px-3 py-2.5 text-[13px]",
              "outline-none focus:border-primary transition-colors",
            )}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={!editContent.trim() || isUpdating}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-3 w-3" aria-hidden="true" /> Save
            </button>
            <button
              onClick={cancelEdit}
              className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] transition-colors"
            >
              <X className="h-3 w-3" aria-hidden="true" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AuthorAvatar
                name={note.authorName}
                avatarUrl={note.authorAvatarUrl}
              />
              <span className="text-foreground text-[12px] font-medium">
                {note.authorName}
              </span>
              <span className="text-muted-foreground text-[11px]">
                {formatRelative(note.createdAt)}
              </span>
              {note.isPinned && (
                <span className="text-primary flex items-center gap-0.5 text-[10px] font-semibold">
                  <Pin className="h-3 w-3" aria-hidden="true" />
                  Pinned
                </span>
              )}
            </div>
            {/* Actions — revealed on hover */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {canPin && (
                <button
                  onClick={() => onTogglePin(note.id)}
                  aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                  aria-pressed={note.isPinned}
                  disabled={isUpdating}
                  className="text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                >
                  {note.isPinned ? (
                    <PinOff className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
              {canEdit && (
                <button
                  onClick={startEdit}
                  aria-label="Edit note"
                  className="text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onDelete(note.id)}
                  aria-label="Delete note"
                  disabled={isUpdating}
                  className="text-muted-foreground hover:text-destructive flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-foreground text-[13px] leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
        </>
      )}
    </motion.div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function NotesFeedSection({ clientId, role }: NotesFeedSectionProps) {
  const utils = trpc.useUtils();
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Hidden entirely for client role
  if (role === "client") return null;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.clientNotes.list.useInfiniteQuery(
    { clientId, limit: 20 },
    {
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000,
    },
  );

  const allNotes: NoteItem[] = data?.pages.flatMap((p) => p.items) ?? [];
  const pinned = allNotes.filter((n) => n.isPinned);
  const unpinned = allNotes.filter((n) => !n.isPinned);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createNote = trpc.clientNotes.create.useMutation({
    onSuccess: () => {
      utils.clientNotes.list.invalidate({ clientId });
      setDraft("");
      setComposing(false);
      toast.success("Note saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateNote = trpc.clientNotes.update.useMutation({
    onSuccess: () => utils.clientNotes.list.invalidate({ clientId }),
    onError: (err) => toast.error(err.message),
  });

  const deleteNote = trpc.clientNotes.delete.useMutation({
    onMutate: async ({ noteId }) => {
      await utils.clientNotes.list.cancel({ clientId });
      const prev = utils.clientNotes.list.getInfiniteData({ clientId });
      // Optimistic removal
      utils.clientNotes.list.setInfiniteData({ clientId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((n) => n.id !== noteId),
          })),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        utils.clientNotes.list.setInfiniteData({ clientId }, ctx.prev);
      }
      toast.error("Failed to delete note");
    },
    onSettled: () => utils.clientNotes.list.invalidate({ clientId }),
  });

  const togglePin = trpc.clientNotes.togglePin.useMutation({
    onSuccess: () => utils.clientNotes.list.invalidate({ clientId }),
    onError: (err) => toast.error(err.message),
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = useCallback(() => {
    if (!draft.trim()) return;
    createNote.mutate({ clientId, content: draft.trim() });
  }, [clientId, createNote, draft]);

  const handleEdit = useCallback(
    (noteId: string, content: string) => {
      updateNote.mutate({ noteId, content });
    },
    [updateNote],
  );

  const handleDelete = useCallback(
    (noteId: string) => {
      deleteNote.mutate({ noteId });
    },
    [deleteNote],
  );

  const handleTogglePin = useCallback(
    (noteId: string) => {
      togglePin.mutate({ noteId });
    },
    [togglePin],
  );

  const isPending =
    updateNote.isPending ||
    deleteNote.isPending ||
    togglePin.isPending;

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-muted h-24 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-destructive text-sm">
        Failed to load notes. Please refresh.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pinned section */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">
            Pinned
          </h4>
          <AnimatePresence>
            {pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                role={role}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                isUpdating={isPending}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Notes list */}
      {unpinned.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <h4 className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">
              Notes
            </h4>
          )}
          <AnimatePresence>
            {unpinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                role={role}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                isUpdating={isPending}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {allNotes.length === 0 && !composing && (
        <div className="border-border bg-card flex flex-col items-center justify-center rounded-2xl border py-12">
          <p className="text-muted-foreground text-[13px] font-medium">
            No notes yet
          </p>
          <p className="text-muted-foreground mt-1 text-[12px]">
            Internal notes are only visible to your team
          </p>
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-muted-foreground hover:text-foreground w-full text-[11px] transition-colors disabled:opacity-50"
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}

      {/* Composer */}
      {composing ? (
        <div className="bg-card rounded-2xl border border-primary/30 p-4 space-y-3">
          <div className="relative">
            <textarea
              ref={composerRef}
              autoFocus
              rows={4}
              aria-label="Write a note"
              aria-multiline="true"
              className={cn(
                "text-foreground placeholder-muted-foreground w-full resize-none rounded-xl",
                "border border-border bg-muted/30 px-4 py-3 text-[13px]",
                "outline-none focus:border-primary transition-colors",
              )}
              placeholder="Add an internal note..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                  handleCreate();
                if (e.key === "Escape") {
                  setComposing(false);
                  setDraft("");
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-[10px]">
              ⌘+Enter to save · Esc to cancel
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setComposing(false);
                  setDraft("");
                }}
                className="border-border text-muted-foreground hover:text-foreground rounded-xl border px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!draft.trim() || createNote.isPending}
                className="rounded-xl bg-primary px-4 py-1.5 text-[11px] font-bold tracking-wide text-white uppercase transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {createNote.isPending ? "Saving…" : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setComposing(true);
            setTimeout(() => composerRef.current?.focus(), 50);
          }}
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-primary/30 px-5 py-4 text-[12px] font-semibold text-primary transition-all hover:border-primary hover:bg-primary/[0.03]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add Note
        </button>
      )}

      {/* Live region for async status */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {createNote.isPending ? "Saving note…" : ""}
      </div>
    </div>
  );
}
