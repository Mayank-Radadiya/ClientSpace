"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ReceiptText,
  FileSignature,
  Settings,
  BarChart3,
  Activity,
  Bell,
  Search,
  ArrowRight,
} from "lucide-react";

const STATIC_PAGES = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Contracts", href: "/contracts", icon: FileSignature },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };

    const customHandler = () => setOpen(true);

    window.addEventListener("keydown", handler);
    window.addEventListener("open-command-palette", customHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-command-palette", customHandler);
    };
  }, [toggle]);

  const navigate = (href: string) => {
    setOpen(false);
    setSearch("");
    router.push(href);
  };

  const filtered = search.trim()
    ? STATIC_PAGES.filter((p) =>
        p.label.toLowerCase().includes(search.toLowerCase()),
      )
    : STATIC_PAGES;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[20vh] left-1/2 z-50 w-full max-w-[540px] -translate-x-1/2 px-4"
          >
            <Command
              className="overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
              shouldFilter={false}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-border px-4">
                <Search size={16} className="shrink-0 text-muted-foreground" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search pages, projects, clients…"
                  className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-flex">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-[360px] overflow-y-auto p-2">
                <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                <Command.Group
                  heading="Pages"
                  className="[&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {filtered.map((page) => (
                    <Command.Item
                      key={page.href}
                      value={page.label}
                      onSelect={() => navigate(page.href)}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                        <page.icon size={14} className="text-muted-foreground" />
                      </div>
                      <span className="flex-1">{page.label}</span>
                      <ArrowRight
                        size={14}
                        className="text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
                      />
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                <span className="text-xs text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-xs">
                    ↑↓
                  </kbd>{" "}
                  navigate
                </span>
                <span className="text-xs text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-xs">
                    ↵
                  </kbd>{" "}
                  open
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
