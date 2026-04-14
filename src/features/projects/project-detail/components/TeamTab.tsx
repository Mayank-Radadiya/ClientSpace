"use client";

import { useState } from "react";
import { ProjectMember } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Trash2, UserPlus } from "lucide-react";
import { gooeyToast } from "goey-toast";

interface TeamTabProps {
  members: ProjectMember[];
  onAddMember: (email: string, role: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onChangeRole: (userId: string, role: string) => Promise<void>;
  canManageTeam: boolean;
}

export function TeamTab({
  members,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  canManageTeam,
}: TeamTabProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await onAddMember(email, role);
      setEmail("");
      gooeyToast.success("Member invited successfully");
    } catch (error: any) {
      gooeyToast.error("Error inviting member: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeColor = (r?: string) => {
    switch (r) {
      case "owner":
        return "border-purple-500 text-purple-500 bg-purple-500/10";
      case "admin":
        return "border-blue-500 text-blue-500 bg-blue-500/10";
      case "member":
        return "border-muted-foreground text-muted-foreground bg-muted/50";
      case "client":
        return "border-green-500 text-green-500 bg-green-500/10";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {canManageTeam && (
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Add Team Member</h3>
          <form
            onSubmit={handleInvite}
            className="flex flex-wrap items-end gap-4 sm:flex-nowrap"
          >
            <div className="flex-1 space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-full space-y-1 sm:w-48">
              <label className="text-muted-foreground text-xs font-medium">
                Role
              </label>
              <Select value={role} onValueChange={(val) => setRole(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </form>
        </div>
      )}

      <div className="bg-card overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-muted-foreground p-4 font-medium">
                Team Member
              </th>
              <th className="text-muted-foreground w-40 p-4 font-medium">
                Role
              </th>
              {canManageTeam && (
                <th className="text-muted-foreground w-24 p-4 text-right font-medium">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.user_id} className="hover:bg-muted/30">
                <td className="flex items-center gap-3 p-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user?.avatar_url || ""} />
                    <AvatarFallback>
                      {member.user?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-foreground font-medium">
                      {member.user?.name || "Unknown"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {member.user?.email || "No email"}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  {canManageTeam && member.role !== "owner" ? (
                    <Select
                      defaultValue={member.role || "member"}
                      onValueChange={(val) =>
                        onChangeRole(member.user_id, val || "")
                      }
                    >
                      <SelectTrigger
                        className={`h-8 w-[110px] text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`capitalize ${getRoleBadgeColor(member.role)}`}
                    >
                      {member.role || "Unknown"}
                    </Badge>
                  )}
                </td>
                {canManageTeam && (
                  <td className="p-4 text-right">
                    {member.role !== "owner" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (
                            confirm(`Remove ${member.user?.name} from project?`)
                          )
                            onRemoveMember(member.user_id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        title="Cannot remove owner"
                      >
                        <AlertCircle className="text-muted-foreground h-4 w-4 opacity-50" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
