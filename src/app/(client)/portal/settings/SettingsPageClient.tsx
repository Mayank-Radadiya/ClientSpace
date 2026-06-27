"use client";

import { useState } from "react";
import { User, Lock, Bell, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";

interface SettingsPageClientProps {
  email: string;
  name: string;
  avatarUrl: string | null;
}

type Section = "profile" | "password" | "notifications";

export function SettingsPageClient({
  email,
  name,
  avatarUrl,
}: SettingsPageClientProps) {
  const [section, setSection] = useState<Section>("profile");
  const [displayName, setDisplayName] = useState(name);
  const [displayEmail, setDisplayEmail] = useState(email);
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [invoiceAlerts, setInvoiceAlerts] = useState(true);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Profile updated.");
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      toast.error("Passwords don't match.");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Password changed.");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setSaving(false);
  };

  const sections: {
    key: Section;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Password", icon: Lock },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-1 lg:w-48 lg:flex-col">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(s.key)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  section === s.key
                    ? "portal-nav-active"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {s.label}
              </button>
            );
          })}
        </nav>

        <div className="bg-card min-h-0 flex-1 rounded-xl border p-6">
          {section === "profile" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="text-lg">
                    {displayName
                      ? displayName.charAt(0).toUpperCase()
                      : email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {displayName || "Update your name"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {displayEmail}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={displayEmail}
                    onChange={(e) => setDisplayEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>
          )}

          {section === "password" && (
            <div className="max-w-sm space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-pw">Current password</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pw">New password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirm new password</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={saving || !currentPw || !newPw || !confirmPw}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Change password
              </Button>
            </div>
          )}

          {section === "notifications" && (
            <div className="space-y-5">
              {[
                {
                  label: "Email notifications",
                  desc: "Receive updates via email",
                  checked: emailNotifs,
                  onChange: setEmailNotifs,
                },
                {
                  label: "Project updates",
                  desc: "File uploads, status changes, milestones",
                  checked: projectUpdates,
                  onChange: setProjectUpdates,
                },
                {
                  label: "Invoice alerts",
                  desc: "New invoices, payment confirmations, reminders",
                  checked: invoiceAlerts,
                  onChange: setInvoiceAlerts,
                },
              ].map((n) => (
                <div
                  key={n.label}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-muted-foreground text-xs">{n.desc}</p>
                  </div>
                  <Switch checked={n.checked} onCheckedChange={n.onChange} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
