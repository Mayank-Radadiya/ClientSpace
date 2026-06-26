"use client";

// src/features/projects/project-detail/components/v3/ProjectCommandPalette.tsx
// ⌘K command palette using cmdk for milestone quick-add and navigation.
// Positioned inside Zone 6 relative wrapper.

import { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Flag,
  LayoutGrid,
  FileText,
  DollarSign,
  Activity,
  Search,
  FileDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import type { OrgRole, ActiveSection } from "../../types";

interface ProjectCommandPaletteProps {
  projectId: string;
  role: OrgRole;
  onNavigate: (tab: ActiveSection) => void;
  onMilestoneCreated?: (id: string) => void;
  onGenerateReport?: () => void;
}

export function ProjectCommandPalette({
  projectId,
  role,
  onNavigate,
  onMilestoneCreated,
  onGenerateReport,
}: ProjectCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const createMilestone = trpc.milestones.create.useMutation({
    onSuccess: (data) => {
      setOpen(false);
      setQuery("");
      setCreating(false);
      if (data) onMilestoneCreated?.(data.id);
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
    if (!query.trim() || role === "client") return;
    setCreating(true);
    createMilestone.mutate({
      projectId,
      title: query.trim(),
      status: "todo",
      priority: "medium",
      order: 9999,
    });
  }, [query, projectId, createMilestone, role]);

  const navItems = [
    { tab: "milestones" as ActiveSection, label: "Milestones", icon: <Flag size={14} /> },
    { tab: "files" as ActiveSection, label: "Files & Assets", icon: <FileText size={14} /> },
    { tab: "invoices" as ActiveSection, label: "Invoices", icon: <DollarSign size={14} /> },
    { tab: "activity" as ActiveSection, label: "Activity Log", icon: <Activity size={14} /> },
  ];

  // Filter invoices for clients only if needed — keep all tabs visible
  const visibleNavItems = role === "client"
    ? navItems.filter((i) => i.tab !== "invoices")
    : navItems;

  return (
    <>
      {/* Trigger button */}
      <button
        id="project-command-palette-trigger"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors"
        style={{
          borderColor: "var(--pd-border)",
          background: "var(--pd-elevated)",
          fontFamily: "var(--font-data)",
          fontSize: 12,
          color: "var(--pd-text-muted)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--pd-accent)";
          e.currentTarget.style.color = "var(--pd-text-secondary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--pd-border)";
          e.currentTarget.style.color = "var(--pd-text-muted)";
        }}
        aria-label="Open command palette (⌘K)"
        aria-keyshortcuts="Meta+K"
      >
        <Search size={12} />
        <span>Search or create…</span>
        <kbd
          className="ml-auto rounded border px-1"
          style={{
            borderColor: "var(--pd-border)",
            background: "var(--pd-surface)",
            fontFamily: "var(--font-data)",
            fontSize: 10,
            color: "var(--pd-text-muted)",
          }}
        >
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
                className="w-full max-w-md overflow-hidden rounded-xl"
                style={{
                  background: "var(--pd-surface)",
                  border: "1px solid var(--pd-border)",
                  boxShadow: "var(--pd-shadow-elevated)",
                }}
                role="dialog"
                aria-modal
                aria-label="Command palette"
              >
                <Command shouldFilter={false}>
                  <div
                    className="flex items-center gap-2 border-b px-3 py-2"
                    style={{ borderColor: "var(--pd-divider)" }}
                  >
                    <Search
                      size={14}
                      style={{ color: "var(--pd-text-muted)" }}
                    />
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Add milestone or navigate…"
                      className="flex-1 bg-transparent outline-none"
                      style={{
                        fontFamily: "var(--font-data)",
                        fontSize: 13,
                        color: "var(--pd-text-primary)",
                      }}
                      autoFocus
                    />
                    <kbd
                      className="rounded border px-1.5"
                      style={{
                        borderColor: "var(--pd-border)",
                        background: "var(--pd-elevated)",
                        fontFamily: "var(--font-data)",
                        fontSize: 10,
                        color: "var(--pd-text-muted)",
                      }}
                    >
                      ESC
                    </kbd>
                  </div>

                  <Command.List className="max-h-64 overflow-y-auto p-1">
                    <Command.Empty
                      className="py-8 text-center"
                      style={{
                        fontFamily: "var(--font-data)",
                        fontSize: 13,
                        color: "var(--pd-text-muted)",
                      }}
                    >
                      {query
                        ? "Press Enter to create this milestone"
                        : "Type to search…"}
                    </Command.Empty>

                    {/* Quick create — hidden for client role */}
                    {query.trim() && role !== "client" && (
                      <Command.Group
                        heading={
                          <span
                            style={{
                              fontFamily: "var(--font-data)",
                              fontSize: 10,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: "var(--pd-text-muted)",
                            }}
                          >
                            Create
                          </span>
                        }
                      >
                        <Command.Item
                          value={`create-${query}`}
                          onSelect={handleCreateMilestone}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 transition-colors aria-selected:bg-[var(--pd-accent-subtle)]"
                          style={{
                            fontFamily: "var(--font-data)",
                            fontSize: 13,
                            color: "var(--pd-text-primary)",
                          }}
                          disabled={creating}
                        >
                          <Plus
                            size={14}
                            style={{ color: "var(--pd-status-done)" }}
                          />
                          <span>
                            {creating ? (
                              "Creating…"
                            ) : (
                              <>
                                Add milestone <strong>"{query}"</strong>
                              </>
                            )}
                          </span>
                        </Command.Item>
                      </Command.Group>
                    )}

                    {/* Navigation */}
                    <Command.Group
                      heading={
                        <span
                          style={{
                            fontFamily: "var(--font-data)",
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "var(--pd-text-muted)",
                          }}
                        >
                          Navigate
                        </span>
                      }
                    >
                      {visibleNavItems
                        .filter(
                          (item) =>
                            !query ||
                            item.label
                              .toLowerCase()
                              .includes(query.toLowerCase()),
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
                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 transition-colors aria-selected:bg-[var(--pd-accent-subtle)]"
                            style={{
                              fontFamily: "var(--font-data)",
                              fontSize: 13,
                              color: "var(--pd-text-primary)",
                            }}
                          >
                            <span style={{ color: "var(--pd-text-muted)" }}>
                              {item.icon}
                            </span>
                            {item.label}
                          </Command.Item>
                        ))}
                    </Command.Group>

                    {/* Project actions — non-client only */}
                    {role !== "client" && onGenerateReport && (
                      <Command.Group
                        heading={
                          <span
                            style={{
                              fontFamily: "var(--font-data)",
                              fontSize: 10,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: "var(--pd-text-muted)",
                            }}
                          >
                            Actions
                          </span>
                        }
                      >
                        <Command.Item
                          value="generate-report"
                          onSelect={() => {
                            onGenerateReport();
                            setOpen(false);
                            setQuery("");
                          }}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 transition-colors aria-selected:bg-[var(--pd-accent-subtle)]"
                          style={{
                            fontFamily: "var(--font-data)",
                            fontSize: 13,
                            color: "var(--pd-text-primary)",
                          }}
                        >
                          <FileDown
                            size={14}
                            style={{ color: "var(--pd-text-muted)" }}
                          />
                          Generate Report
                        </Command.Item>
                      </Command.Group>
                    )}
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
