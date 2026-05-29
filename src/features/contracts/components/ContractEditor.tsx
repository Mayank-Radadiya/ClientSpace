"use client";

// src/features/contracts/components/ContractEditor.tsx
// Rich-text contract editor using TipTap with:
//   - Bold, Italic, Headings, Lists, Horizontal Rule
//   - Placeholder chip insertion from toolbar dropdown
//   - Preview mode (resolves {{placeholders}} with actual data)
//   - Autosave: debounced 1.5s, shows "Saving…" / "Saved ✓" indicator

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PLACEHOLDERS, resolvePlaceholders } from "../schemas";
import type { PlaceholderKey } from "../schemas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Minus,
  ChevronDown,
  Eye,
  Pencil,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlaceholderData {
  client_name?: string;
  project_name?: string;
  contract_value?: string;
  start_date?: string;
  agency_name?: string;
}

interface ContractEditorProps {
  contractId: string;
  initialHtml: string;
  readOnly?: boolean;
  resolvedData?: PlaceholderData;
  onSave?: (html: string) => void;
}

// ─── Save state indicator ─────────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_INDICATOR: Record<SaveState, { text: string; className: string }> = {
  idle:   { text: "",          className: "" },
  saving: { text: "Saving…",  className: "text-neutral-400" },
  saved:  { text: "Saved ✓",  className: "text-emerald-500" },
  error:  { text: "Save failed", className: "text-red-500" },
};

// ─── Editor Component ─────────────────────────────────────────────────────────

export function ContractEditor({
  contractId,
  initialHtml,
  readOnly = false,
  resolvedData = {},
  onSave,
}: ContractEditorProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => setSaveState("saved"),
    onError:   () => setSaveState("error"),
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start drafting your contract…" }),
    ],
    content: initialHtml,
    editable: !readOnly && !previewMode,
    editorProps: {
      attributes: {
        class: "prose prose-neutral dark:prose-invert max-w-none min-h-[400px] focus:outline-none p-6",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onSave?.(html);

      // Debounced autosave
      clearTimeout(saveTimerRef.current);
      setSaveState("idle");
      saveTimerRef.current = setTimeout(() => {
        setSaveState("saving");
        updateMutation.mutate({ contractId, bodyHtml: html });
      }, 1500);
    },
  });

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  // Reset "Saved" indicator after 3s
  useEffect(() => {
    if (saveState === "saved") {
      const t = setTimeout(() => setSaveState("idle"), 3000);
      return () => clearTimeout(t);
    }
  }, [saveState]);

  // Insert a placeholder chip at cursor position
  const insertPlaceholder = useCallback(
    (key: PlaceholderKey, label: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertContent(
          `<span data-placeholder="${key}" class="inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm px-2 py-0.5 font-mono cursor-default select-none">{{${key}}}</span>`,
        )
        .run();
      setShowPlaceholderMenu(false);
    },
    [editor],
  );

  const saveIndicator = SAVE_INDICATOR[saveState];

  // ── Preview mode: resolve placeholders and render static HTML ──────────────
  if (previewMode) {
    const resolvedHtml = resolvePlaceholders(editor?.getHTML() ?? initialHtml, resolvedData);
    return (
      <div className="flex flex-col">
        <EditorToolbar
          editor={null}
          previewMode={previewMode}
          onTogglePreview={() => setPreviewMode(false)}
          onInsertPlaceholder={insertPlaceholder}
          showPlaceholderMenu={showPlaceholderMenu}
          onTogglePlaceholderMenu={() => setShowPlaceholderMenu((v) => !v)}
          saveState={saveState}
          readOnly={readOnly}
        />
        <div
          className="prose prose-neutral dark:prose-invert max-w-none p-6 rounded-b-lg border border-t-0 border-neutral-200 dark:border-neutral-800 min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: resolvedHtml }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <EditorToolbar
        editor={editor}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(true)}
        onInsertPlaceholder={insertPlaceholder}
        showPlaceholderMenu={showPlaceholderMenu}
        onTogglePlaceholderMenu={() => setShowPlaceholderMenu((v) => !v)}
        saveState={saveState}
        readOnly={readOnly}
      />
      <EditorContent editor={editor} className="bg-white dark:bg-neutral-950/50" />
      {saveIndicator.text && (
        <div className={cn("px-4 py-2 text-xs border-t border-neutral-200 dark:border-neutral-800", saveIndicator.className)}>
          {saveIndicator.text}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor> | null;
  previewMode: boolean;
  onTogglePreview: () => void;
  onInsertPlaceholder: (key: PlaceholderKey, label: string) => void;
  showPlaceholderMenu: boolean;
  onTogglePlaceholderMenu: () => void;
  saveState: SaveState;
  readOnly: boolean;
}

function EditorToolbar({
  editor,
  previewMode,
  onTogglePreview,
  onInsertPlaceholder,
  showPlaceholderMenu,
  onTogglePlaceholderMenu,
  readOnly,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 p-2 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex-wrap">
      {/* Formatting buttons — only in edit mode */}
      {!previewMode && !readOnly && editor && (
        <>
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading"
          >
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Ordered List"
          >
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus size={14} />
          </ToolbarButton>

          {/* Divider */}
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />

          {/* Placeholder insertion dropdown */}
          <div className="relative">
            <ToolbarButton
              active={showPlaceholderMenu}
              onClick={onTogglePlaceholderMenu}
              title="Insert Placeholder"
            >
              <span className="text-xs font-mono">{"{ }"}</span>
              <ChevronDown size={10} className="ml-0.5" />
            </ToolbarButton>
            {showPlaceholderMenu && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg py-1">
                {PLACEHOLDERS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => onInsertPlaceholder(key, label)}
                  >
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{`{{${key}}}`}</span>
                    <span className="text-neutral-500">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />
        </>
      )}

      {/* Preview toggle */}
      {!readOnly && (
        <ToolbarButton
          active={previewMode}
          onClick={onTogglePreview}
          title={previewMode ? "Edit mode" : "Preview mode"}
        >
          {previewMode ? <Pencil size={14} /> : <Eye size={14} />}
          <span className="text-xs ml-1">{previewMode ? "Edit" : "Preview"}</span>
        </ToolbarButton>
      )}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center h-7 px-2 rounded-md text-sm transition-colors",
        active
          ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
      )}
    >
      {children}
    </button>
  );
}
