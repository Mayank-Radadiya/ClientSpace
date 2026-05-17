"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { formatRelative } from "../../utils/formatters";

type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export function NotesTab({ clientId: _ }: { clientId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  function addNote() {
    if (!draft.trim()) return;
    const now = new Date().toISOString();
    setNotes((prev) => [
      {
        id: Math.random().toString(36).slice(2),
        content: draft.trim(),
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);
    setDraft("");
    setComposing(false);
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function saveEdit() {
    if (!editContent.trim() || !editingId) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === editingId
          ? {
              ...n,
              content: editContent.trim(),
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    setEditingId(null);
    setEditContent("");
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Compose */}
      {composing ? (
        <div className="bg-card space-y-3 rounded-2xl border border-[rgba(79,127,255,0.3)] p-4">
          <textarea
            autoFocus
            rows={4}
            className="text-foreground placeholder-muted-foreground w-full resize-none rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[13px] outline-none focus:border-[#4F7FFF]"
            placeholder="Add an internal note..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote();
              if (e.key === "Escape") {
                setComposing(false);
                setDraft("");
              }
            }}
          />
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
                className="border-border text-muted-foreground hover:text-foreground rounded-xl border px-3 py-1.5 text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addNote}
                disabled={!draft.trim()}
                className="rounded-xl bg-[#4F7FFF] px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] text-white uppercase transition-colors hover:bg-[#6B95FF] disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setComposing(true)}
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-[rgba(79,127,255,0.3)] px-5 py-4 text-[12px] font-semibold text-[#4F7FFF] transition-all hover:border-[#4F7FFF] hover:bg-[rgba(79,127,255,0.04)]"
        >
          <Plus className="h-4 w-4" /> Add Note
        </button>
      )}

      {/* Notes list */}
      {notes.length === 0 && !composing && (
        <div className="border-border bg-card flex flex-col items-center justify-center rounded-2xl border py-12">
          <p className="text-muted-foreground text-[13px] font-medium">
            No notes yet
          </p>
          <p className="text-muted-foreground mt-1 text-[12px]">
            Internal notes are only visible to your team
          </p>
        </div>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className="border-border bg-card group rounded-2xl border p-5"
        >
          {editingId === note.id ? (
            <div className="space-y-3">
              <textarea
                autoFocus
                rows={3}
                className="text-foreground w-full resize-none rounded-xl border border-[rgba(79,127,255,0.3)] bg-[rgba(79,127,255,0.04)] px-4 py-3 text-[13px] outline-none focus:border-[#4F7FFF]"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1.5 rounded-xl bg-[#4F7FFF] px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#6B95FF]"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] transition-colors"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-foreground text-[13px] leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-muted-foreground text-[10px]">
                  {formatRelative(note.createdAt)}
                </p>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(note)}
                    className="text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-muted-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:text-[#EF4444]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      <p className="text-muted-foreground text-center text-[10px]">
        Notes are stored locally — persistence coming in a future update
      </p>
    </div>
  );
}
