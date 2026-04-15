"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Settings,
  ArrowRight,
  Plus,
  Archive,
  Trash2,
  FileText,
  Receipt,
  Activity,
  Users,
  Link2,
  FileDown,
  MessageCircle,
} from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { ActiveSection } from "../../types";

interface CommandAction {
  id: string;
  label: string;
  icon: React.ElementType;
  group: string;
  onSelect: () => void;
  destructive?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: ActiveSection) => void;
  onAddMilestone: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onOpenChat: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onAddMilestone,
  onArchive,
  onDelete,
  onOpenChat,
}: CommandPaletteProps) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: CommandAction[] = useMemo(
    () => [
      {
        id: "edit",
        label: "Edit project info",
        icon: Settings,
        group: "Project actions",
        onSelect: () => {
          onClose();
          document.getElementById("edit-project-trigger")?.click();
        },
      },
      {
        id: "add-milestone",
        label: "Add milestone",
        icon: Plus,
        group: "Project actions",
        onSelect: () => {
          onClose();
          onAddMilestone();
        },
      },
      {
        id: "archive",
        label: "Archive project",
        icon: Archive,
        group: "Project actions",
        onSelect: () => {
          onClose();
          onArchive();
        },
      },
      {
        id: "delete",
        label: "Delete project",
        icon: Trash2,
        group: "Project actions",
        onSelect: () => {
          onClose();
          onDelete();
        },
        destructive: true,
      },
      {
        id: "nav-files",
        label: "Files & Assets",
        icon: FileText,
        group: "Navigate to",
        onSelect: () => {
          onClose();
          onNavigate("files");
        },
      },
      {
        id: "nav-invoices",
        label: "Invoices",
        icon: Receipt,
        group: "Navigate to",
        onSelect: () => {
          onClose();
          onNavigate("invoices");
        },
      },
      {
        id: "nav-activity",
        label: "Activity log",
        icon: Activity,
        group: "Navigate to",
        onSelect: () => {
          onClose();
          onNavigate("activity");
        },
      },
      {
        id: "copy-link",
        label: "Copy project link",
        icon: Link2,
        group: "Quick actions",
        onSelect: () => {
          navigator.clipboard.writeText(window.location.href);
          onClose();
        },
      },
      {
        id: "export-pdf",
        label: "Export as PDF",
        icon: FileDown,
        group: "Quick actions",
        onSelect: () => {
          onClose();
        },
      },
      {
        id: "open-discussion",
        label: "Open discussion",
        icon: MessageCircle,
        group: "Quick actions",
        onSelect: () => {
          onClose();
          onOpenChat();
        },
      },
    ],
    [onClose, onAddMilestone, onArchive, onDelete, onNavigate, onOpenChat],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  // Group filtered items
  const groups = useMemo(() => {
    const map = new Map<string, CommandAction[]>();
    for (const a of filtered) {
      const list = map.get(a.group) ?? [];
      list.push(a);
      map.set(a.group, list);
    }
    return map;
  }, [filtered]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[selectedIndex]?.onSelect();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, selectedIndex, onClose],
  );

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="border-border bg-card w-full max-w-xl overflow-hidden rounded-xl border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="border-border flex items-center gap-3 border-b px-4 py-3">
              <Search className="text-muted-foreground h-4 w-4 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search actions…"
                className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-[14px] focus:outline-none"
              />
            </div>

            {/* Action groups */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-[13px]">
                  No results found
                </p>
              ) : (
                Array.from(groups.entries()).map(([group, items]) => (
                  <div key={group} className="mb-2">
                    <p className="text-muted-foreground px-3 py-1 text-[10px] font-medium tracking-[0.06em] uppercase">
                      {group}
                    </p>
                    {items.map((action) => {
                      const isSelected =
                        filtered.indexOf(action) === selectedIndex;
                      return (
                        <button
                          key={action.id}
                          onClick={action.onSelect}
                          onMouseEnter={() =>
                            setSelectedIndex(filtered.indexOf(action))
                          }
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                            isSelected ? "bg-muted" : "hover:bg-muted/50"
                          } ${action.destructive ? "text-red-400" : "text-foreground/70"}`}
                        >
                          {isSelected && (
                            <span className="bg-primary absolute left-[6px] h-6 w-[3px] rounded-full" />
                          )}
                          <action.icon className="h-4 w-4 shrink-0 opacity-50" />
                          <span>{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="border-border flex items-center gap-4 border-t px-4 py-2">
              <span className="text-muted-foreground text-[10px]">
                ↑↓ Navigate · Enter Select · Esc Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
