"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ChevronRight } from "lucide-react";
import { ProjectMember, OrgRole } from "../../types";

interface TeamPopoverProps {
  members: ProjectMember[];
  canManageTeam: boolean;
  onAddMember: (email: string, role: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onChangeRole: (userId: string, role: string) => Promise<void>;
  trigger: React.ReactNode;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-primary/20 text-primary",
  admin: "bg-primary/15 text-primary",
  member: "bg-muted text-foreground/70",
  client: "bg-emerald-500/15 text-emerald-400",
};

const ROLES: OrgRole[] = ["owner", "admin", "member", "client"];

export function TeamPopover({
  members,
  canManageTeam,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  trigger,
}: TeamPopoverProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteStatus, setInviteStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [inviteError, setInviteError] = useState("");

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteStatus("loading");
    setInviteError("");
    try {
      await onAddMember(inviteEmail.trim(), inviteRole);
      setInviteStatus("success");
      setInviteEmail("");
      setTimeout(() => setInviteStatus("idle"), 2000);
    } catch (err: unknown) {
      setInviteStatus("error");
      setInviteError(err instanceof Error ? err.message : "Failed to invite");
    }
  };

  return (
    <Popover>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="border-border bg-card w-80 p-0">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <span className="text-foreground text-[13px] font-semibold">
            Team ({members.length} members)
          </span>
          <button className="text-primary flex items-center gap-0.5 text-[11px] hover:underline">
            Manage <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Member list */}
        <div className="max-h-80 overflow-y-auto p-2">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={m.user?.avatar_url || ""} />
                <AvatarFallback className="text-[9px]">
                  {m.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-[12px] font-medium">
                  {m.user?.name || "Unknown"}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {m.user?.email}
                </p>
              </div>

              {/* Role badge */}
              {canManageTeam ? (
                <Select
                  value={m.role || "member"}
                  onValueChange={(val) => {
                    if (val) {
                      onChangeRole(m.user_id, val);
                    }
                  }}
                >
                  <SelectTrigger className="h-6 w-auto min-w-[70px] border-0 bg-transparent px-1.5 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-[11px]">
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[m.role || "member"]}`}
                >
                  {(m.role || "member").charAt(0).toUpperCase() +
                    (m.role || "member").slice(1)}
                </span>
              )}

              {/* Remove */}
              {canManageTeam && m.role !== "owner" && (
                <button
                  onClick={() => onRemoveMember(m.user_id)}
                  className="text-muted-foreground rounded p-1 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite section */}
        {canManageTeam && (
          <div className="border-border border-t p-3">
            <div className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="border-border bg-muted/50 h-8 text-[12px]"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              <Select
                value={inviteRole}
                onValueChange={(val) => val && setInviteRole(val)}
              >
                <SelectTrigger className="border-border bg-muted/50 h-8 w-24 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((r) => r !== "owner").map((r) => (
                    <SelectItem key={r} value={r} className="text-[11px]">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviteStatus === "loading"}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-7 w-full text-[11px]"
            >
              {inviteStatus === "loading"
                ? "Sending..."
                : inviteStatus === "success"
                  ? "Invite sent ✓"
                  : "Send invite"}
            </Button>
            {inviteStatus === "error" && (
              <p className="mt-1 text-[11px] text-red-400">{inviteError}</p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
