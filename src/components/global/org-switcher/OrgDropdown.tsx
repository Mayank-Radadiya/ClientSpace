"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ChevronDown, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { switchOrgAction } from "./actions";
import { cn } from "@/lib/utils";
import { useSidebar } from "../sidebar/components/SidebarContext";

type Organization = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
};

type OrgDropdownProps = {
  organizations: Organization[];
  currentOrgId: string;
  currentOrgName: string;
  currentRole: string;
};

export function OrgDropdown({
  organizations,
  currentOrgId,
  currentOrgName,
  currentRole,
}: OrgDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { open: sidebarOpen } = useSidebar();

  // Don't show dropdown if user only has one org
  if (organizations.length <= 1) {
    return null;
  }

  const handleSwitch = (orgId: string) => {
    setIsOpen(false);
    startTransition(async () => {
      await switchOrgAction(orgId);
    });
  };

  return (
    <div className="relative">
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
          isOpen && "bg-neutral-100 dark:bg-neutral-800",
          isPending && "pointer-events-none opacity-50",
        )}
      >
        <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <Building2 className="h-4 w-4" />
        </div>

        {sidebarOpen && (
          <>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{currentOrgName}</p>
              <p className="text-muted-foreground truncate text-xs capitalize">
                {currentRole}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border bg-white p-2 shadow-lg dark:bg-neutral-900"
          >
            <div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
              Your Organizations
            </div>

            <div className="space-y-1">
              {organizations.map((org) => {
                const isActive = org.orgId === currentOrgId;

                return (
                  <button
                    key={org.orgId}
                    onClick={() => handleSwitch(org.orgId)}
                    disabled={isActive || isPending}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      isActive && "bg-primary/10 text-primary font-medium",
                    )}
                  >
                    <div className="flex-1">
                      <p className="truncate">{org.orgName}</p>
                      <p className="text-muted-foreground truncate text-xs capitalize">
                        {org.role}
                      </p>
                    </div>
                    {isActive && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 border-t pt-2">
              <Link
                href="/switch-org"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>View All Organizations</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
