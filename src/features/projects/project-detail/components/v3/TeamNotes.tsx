"use client";

// src/features/projects/project-detail/components/v3/TeamNotes.tsx
// Contenteditable team scratchpad with debounced auto-save.
// Uses existing useProjectNotes hook and projectNotesRouter.

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/lib/trpc/client";

type SaveState = "idle" | "saving" | "saved" | "error";

interface TeamNotesProps {
  projectId: string;
}

export function TeamNotes({ projectId }: TeamNotesProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial notes
  const { data: notesData } = trpc.projectNotes.get.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  // Upsert mutation
  const upsertMut = trpc.projectNotes.upsert.useMutation({
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      // Clear "Saved" after 2 seconds
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: () => {
      setSaveState("error");
      // Clear error after 3 seconds
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveState("idle"), 3000);
    },
  });

  // Set initial content once loaded
  useEffect(() => {
    if (editorRef.current && notesData?.content && !editorRef.current.textContent) {
      editorRef.current.textContent = notesData.content;
    }
  }, [notesData]);

  // Debounced save on input
  const handleInput = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const content = editorRef.current?.textContent ?? "";
      upsertMut.mutate({ projectId, content });
    }, 500);
  }, [projectId, upsertMut]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {!isRevealed ? (
        <button
          onClick={() => setIsRevealed(true)}
          className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{
            borderColor: "var(--pd-border)",
          }}
        >
          <span
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--pd-text-muted)" }}
          >
            <span className="text-lg">🔒</span>
            Click to reveal team notes
          </span>
        </button>
      ) : (
        <>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            className="team-notes-editor min-h-[80px] max-h-[200px] overflow-y-auto rounded-lg p-3 outline-none transition-colors focus:ring-1"
            style={{
              background: "var(--pd-elevated)",
              border: "1px solid var(--pd-border)",
              fontFamily: "var(--font-data)",
              fontSize: 13,
              color: "var(--pd-text-primary)",
              lineHeight: 1.5,
            }}
            role="textbox"
            aria-label="Internal team notes"
            aria-multiline="true"
          />

          {/* Empty state placeholder via CSS */}
          <style>{`
            .team-notes-editor:empty::before {
              content: "Add internal team notes...";
              color: var(--pd-text-muted);
              pointer-events: none;
              font-style: italic;
              font-size: 12px;
            }
            .team-notes-editor:focus {
              border-color: var(--pd-accent) !important;
              ring-color: var(--pd-accent);
            }
          `}</style>

          {/* Save state indicator */}
          <AnimatePresence mode="wait">
            {saveState !== "idle" && (
              <motion.span
                key={saveState}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color:
                    saveState === "error"
                      ? "var(--pd-status-overdue)"
                      : saveState === "saved"
                        ? "var(--pd-status-done)"
                        : "var(--pd-text-muted)",
                }}
              >
                {saveState === "saving" && "Saving…"}
                {saveState === "saved" && "Saved ✓"}
                {saveState === "error" && "Failed to save"}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
