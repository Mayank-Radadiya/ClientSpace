"use client";

import { useState, useTransition } from "react";
import { Building2, Check } from "lucide-react";
import { switchOrgAction } from "./actions";
import { cn } from "@/lib/utils";

type Organization = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
};

type OrgSwitcherGridProps = {
  organizations: Organization[];
  currentOrgId: string;
};

export function OrgSwitcherGrid({
  organizations,
  currentOrgId,
}: OrgSwitcherGridProps) {
  const [isPending, startTransition] = useTransition();
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);

  const handleSwitch = (orgId: string) => {
    setSwitchingOrgId(orgId);
    startTransition(async () => {
      await switchOrgAction(orgId);
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => {
        const isActive = org.orgId === currentOrgId;
        const isSwitching = switchingOrgId === org.orgId && isPending;

        return (
          <button
            key={org.orgId}
            onClick={() => handleSwitch(org.orgId)}
            disabled={isActive || isPending}
            className={cn(
              "group relative rounded-lg border bg-white/50 p-6 text-left backdrop-blur-sm transition-all hover:shadow-md dark:bg-neutral-900/50",
              isActive &&
                "ring-primary/50 border-primary/50 bg-primary/5 dark:bg-primary/10 ring-2",
              isPending && !isSwitching && "pointer-events-none opacity-50",
              isSwitching && "opacity-75",
            )}
          >
            {/* Active checkmark */}
            {isActive && (
              <div className="bg-primary text-primary-foreground absolute top-4 right-4 rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}

            {/* Organization icon */}
            <div className="bg-primary/10 text-primary mb-4 inline-flex rounded-lg p-3">
              <Building2 className="h-6 w-6" />
            </div>

            {/* Organization details */}
            <h3 className="text-lg font-semibold">{org.orgName}</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Role: <span className="capitalize">{org.role}</span>
            </p>

            {/* Switch indicator */}
            {!isActive && (
              <p className="text-muted-foreground mt-3 text-xs">
                {isSwitching ? "Switching..." : "Click to switch"}
              </p>
            )}

            {/* Active indicator */}
            {isActive && (
              <p className="text-primary mt-3 text-xs font-medium">
                Currently active
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
