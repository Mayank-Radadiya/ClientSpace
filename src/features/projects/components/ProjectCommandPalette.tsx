"use client";
// src/features/projects/components/ProjectCommandPalette.tsx
// ⌘K command palette using cmdk for milestone quick-add and navigation.
// Fix 5 variant: absolute positioned inside relative wrapper (no portal needed).

import { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Flag, LayoutGrid, FileText, DollarSign, Activity, Search } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface ProjectCommandPaletteProps {
  projectId: string;
  onNavigate: (tab: string) => void;
  onMilestoneCreated?: (id: string) => void;
}

export function ProjectCommandPalette({
  projectId,
  onNavigate,
  onMilestoneCreated,
}: ProjectCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const createMilestone = trpc.milestones.create.useMutation({
    onSuccess: (data) => {
      setOpen(false);
      setQuery("");
      setCreating(false);
      if (data?.id) {
        onMilestoneCreated?.(data.id);
      }
    },
    onError: () => setCreating(false),
  });

  // Toggle on ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleCreateMilestone = useCallback(() => {
    if (!query.trim()) return;
    setCreating(true);
    createMilestone.mutate({
      projectId,
      title: query.trim(),
      status: "todo",
      priority: "medium",
      order: 9999, // Will be sorted
    });
  }, [query, projectId, createMilestone]);

  const navItems = [
    { tab: "milestones", label: "Milestones", icon: <Flag size={14} /> },
    { tab: "kanban", label: "Kanban Board", icon: <LayoutGrid size={14} /> },
    { tab: "files", label: "Files", icon: <FileText size={14} /> },
    { tab: "invoices", label: "Invoices", icon: <DollarSign size={14} /> },
    { tab: "activity", label: "Activity", icon: <Activity size={14} /> },
  ];

  return (
    <>
      {/* Trigger button */}
      <button
        id="project-command-palette-trigger"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open command palette (⌘K)"
        aria-keyshortcuts="Meta+K"
      >
        <Search size={12} />
        <span>Search or create…</span>
        <kbd className="ml-auto rounded border border-border bg-background px-1 text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Palette portal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                role="dialog"
                aria-modal
                aria-label="Command palette"
              >
                <Command shouldFilter={false}>
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search size={14} className="text-muted-foreground" />
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Add milestone or navigate…"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      autoFocus
                    />
                    <kbd className="rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
                      ESC
                    </kbd>
                  </div>

                  <Command.List className="max-h-64 overflow-y-auto p-1">
                    <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                      {query ? "Press Enter to create this milestone" : "Type to search…"}
                    </Command.Empty>

                    {/* Quick create */}
                    {query.trim() && (
                      <Command.Group heading="Create">
                        <Command.Item
                          value={`create-${query}`}
                          onSelect={handleCreateMilestone}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                          disabled={creating}
                        >
                          <Plus size={14} className="text-green-600" />
                          <span>
                            {creating ? "Creating…" : (
                              <>Add milestone <strong>"{query}"</strong></>
                            )}
                          </span>
                        </Command.Item>
                      </Command.Group>
                    )}

                    {/* Navigation */}
                    <Command.Group heading="Navigate">
                      {navItems
                        .filter(
                          (item) =>
                            !query ||
                            item.label.toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((item) => (
                          <Command.Item
                            key={item.tab}
                            value={`nav-${item.tab}`}
                            onSelect={() => {
                              onNavigate(item.tab);
                              setOpen(false);
                              setQuery("");
                            }}
                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                          >
                            <span className="text-muted-foreground">{item.icon}</span>
                            {item.label}
                          </Command.Item>
                        ))}
                    </Command.Group>
                  </Command.List>
                </Command>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
