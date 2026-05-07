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
    setNotes((prev) => [{ id: Math.random().toString(36).slice(2), content: draft.trim(), createdAt: now, updatedAt: now }, ...prev]);
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
      prev.map((n) => n.id === editingId ? { ...n, content: editContent.trim(), updatedAt: new Date().toISOString() } : n),
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
        <div className="rounded-2xl border border-[rgba(79,127,255,0.3)] bg-card p-4 space-y-3">
          <textarea
            autoFocus
            rows={4}
            className="w-full resize-none rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[13px] font-[var(--font-data)] text-foreground placeholder-muted-foreground outline-none focus:border-[#4F7FFF]"
            placeholder="Add an internal note..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote();
              if (e.key === "Escape") { setComposing(false); setDraft(""); }
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-[var(--font-data)]">⌘+Enter to save · Esc to cancel</p>
            <div className="flex gap-2">
              <button onClick={() => { setComposing(false); setDraft(""); }} className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors font-[var(--font-data)]">
                Cancel
              </button>
              <button onClick={addNote} disabled={!draft.trim()} className="rounded-xl bg-[#4F7FFF] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-[#6B95FF] disabled:opacity-50 transition-colors font-[var(--font-data)]">
                Save Note
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setComposing(true)}
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-[rgba(79,127,255,0.3)] px-5 py-4 text-[12px] font-semibold text-[#4F7FFF] hover:border-[#4F7FFF] hover:bg-[rgba(79,127,255,0.04)] transition-all font-[var(--font-data)]"
        >
          <Plus className="h-4 w-4" /> Add Note
        </button>
      )}

      {/* Notes list */}
      {notes.length === 0 && !composing && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-12">
          <p className="text-[13px] font-medium text-muted-foreground font-[var(--font-data)]">No notes yet</p>
          <p className="mt-1 text-[12px] text-muted-foreground font-[var(--font-data)]">Internal notes are only visible to your team</p>
        </div>
      )}

      {notes.map((note) => (
        <div key={note.id} className="rounded-2xl border border-border bg-card p-5 group">
          {editingId === note.id ? (
            <div className="space-y-3">
              <textarea
                autoFocus
                rows={3}
                className="w-full resize-none rounded-xl border border-[rgba(79,127,255,0.3)] bg-[rgba(79,127,255,0.04)] px-4 py-3 text-[13px] font-[var(--font-data)] text-foreground outline-none focus:border-[#4F7FFF]"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1.5 rounded-xl bg-[#4F7FFF] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#6B95FF] transition-colors font-[var(--font-data)]">
                  <Check className="h-3 w-3" /> Save
                </button>
                <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-[var(--font-data)]">
                  <X className="h-3 w-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground font-[var(--font-data)]">{note.content}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground font-[var(--font-data)]">{formatRelative(note.createdAt)}</p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(note)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-[#EF4444] transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      <p className="text-center text-[10px] text-muted-foreground font-[var(--font-data)]">
        Notes are stored locally — persistence coming in a future update
      </p>
    </div>
  );
}
