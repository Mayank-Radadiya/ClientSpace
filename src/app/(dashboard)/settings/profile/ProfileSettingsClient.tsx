"use client";

import React, { useRef, useState, useTransition } from "react";
import { Camera, Trash2, User, Loader2 } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfileAction,
  uploadAvatarAction,
  removeAvatarAction,
} from "@/features/settings/server/profileActions";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
}

export function ProfileSettingsClient({ user }: { user: UserProfile }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");

  // Avatar upload handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await uploadAvatarAction(formData);
      if (res.success) {
        gooeyToast.success("Profile photo updated!");
      } else {
        gooeyToast.error(res.error || "Failed to upload photo.");
      }
    } catch {
      gooeyToast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Avatar remove handler
  const handleAvatarRemove = async () => {
    if (confirm("Are you sure you want to remove your profile photo?")) {
      setIsUploading(true);
      try {
        const res = await removeAvatarAction();
        if (res.success) {
          gooeyToast.success("Profile photo removed.");
        } else {
          gooeyToast.error(res.error || "Failed to remove photo.");
        }
      } catch {
        gooeyToast.error("An error occurred.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Save profile details
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      gooeyToast.error("Name is required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);

    startUpdateTransition(async () => {
      const res = await updateProfileAction(formData);
      if (res.success) {
        gooeyToast.success("Profile updated successfully!");
      } else {
        gooeyToast.error(res.error || "Failed to update profile.");
      }
    });
  };

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--inv-divider)] pb-4">
        <h2 className="font-display text-lg font-bold text-[var(--inv-text-primary)]">
          Profile Settings
        </h2>
        <p className="text-xs text-[var(--inv-text-muted)] mt-1">
          Manage your personal details and avatar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {/* Avatar Section */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-[var(--inv-text-muted)] uppercase">
            Profile Photo
          </Label>
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={handleTriggerFileSelect}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-20 w-20 rounded-2xl object-cover border border-[var(--inv-divider)] transition-opacity group-hover:opacity-75"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-2xl transition-opacity group-hover:opacity-75">
                  {initials}
                </div>
              )}
              {isUploading ? (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTriggerFileSelect}
                  disabled={isUploading}
                  className="h-8 rounded-lg text-xs"
                >
                  Change Photo
                </Button>
                {user.avatarUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleAvatarRemove}
                    disabled={isUploading}
                    className="h-8 rounded-lg text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-[var(--inv-text-muted)]">
                JPG, PNG or WEBP. Max size 3MB.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-[var(--inv-text-muted)]">
              Email Address
            </Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] opacity-60 text-sm text-[var(--inv-text-primary)] cursor-not-allowed"
            />
            <p className="text-[10px] text-[var(--inv-text-muted)]">
              Email cannot be changed (synced with auth provider).
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-[var(--inv-text-muted)]">
              Display Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold text-[var(--inv-text-muted)]">
              Phone Number
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +14155552671"
              className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t border-[var(--inv-divider)] pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isUpdating}
            className="h-10 rounded-xl px-6 text-sm font-bold bg-[var(--inv-accent-primary)] text-white hover:bg-[var(--inv-accent-hover)]"
          >
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
