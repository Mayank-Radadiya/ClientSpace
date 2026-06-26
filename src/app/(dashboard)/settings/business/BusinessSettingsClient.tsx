"use client";

import React, { useRef, useState, useTransition } from "react";
import { Camera, Trash2, Loader2, Building } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { uploadLogoAction, removeLogoAction } from "@/features/settings/server/brandingActions";

interface OrgDetails {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  taxNumber: string | null;
}

export function BusinessSettingsClient({
  org,
  isOwnerOrAdmin
}: {
  org: OrgDetails;
  isOwnerOrAdmin: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(org.name);
  const [address, setAddress] = useState(org.address || "");
  const [taxNumber, setTaxNumber] = useState(org.taxNumber || "");

  // updateBusiness tRPC Mutation
  const updateMutation = trpc.organizations.updateBusiness.useMutation({
    onSuccess: () => {
      gooeyToast.success("Business details updated successfully!");
      utils.organizations.getEmailDomainStatus.invalidate(); // Invalidate organization caches
    },
    onError: (err) => {
      gooeyToast.error(err.message || "Failed to update details.");
    }
  });

  // Logo upload handler
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await uploadLogoAction(formData, "logo");
      if (res.success) {
        gooeyToast.success("Business logo updated!");
        // Force reload page state by invalidate queries or window reload
        window.location.reload();
      } else {
        gooeyToast.error(res.error || "Failed to upload logo.");
      }
    } catch {
      gooeyToast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Logo remove handler
  const handleLogoRemove = async () => {
    if (confirm("Are you sure you want to remove your company logo?")) {
      setIsUploading(true);
      try {
        const res = await removeLogoAction("logo");
        if (res.success) {
          gooeyToast.success("Logo removed.");
          window.location.reload();
        } else {
          gooeyToast.error("Failed to remove logo.");
        }
      } catch {
        gooeyToast.error("An error occurred.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleTriggerFileSelect = () => {
    if (!isOwnerOrAdmin) return;
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      gooeyToast.error("Company name is required.");
      return;
    }

    updateMutation.mutate({
      name,
      address: address || null,
      taxNumber: taxNumber || null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--inv-divider)] pb-4">
        <h2 className="font-display text-lg font-bold text-[var(--inv-text-primary)]">
          Business Settings
        </h2>
        <p className="text-xs text-[var(--inv-text-muted)] mt-1">
          Manage your organization details, billing address, and tax settings for invoicing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {/* Logo Section */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-[var(--inv-text-muted)] uppercase">
            Company Logo
          </Label>
          <div className="flex items-center gap-6">
            <div
              className={cn(
                "relative group rounded-2xl border border-[var(--inv-divider)] bg-[var(--inv-surface)] flex h-20 w-40 items-center justify-center p-2",
                isOwnerOrAdmin && "cursor-pointer"
              )}
              onClick={handleTriggerFileSelect}
            >
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-[var(--inv-text-muted)]">
                  <Building className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">No Logo</span>
                </div>
              )}
              {isOwnerOrAdmin && (
                <>
                  {isUploading ? (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  )}
                </>
              )}
            </div>

            {isOwnerOrAdmin && (
              <div className="space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
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
                    Upload Logo
                  </Button>
                  {org.logoUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleLogoRemove}
                      disabled={isUploading}
                      className="h-8 rounded-lg text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-[var(--inv-text-muted)]">
                  PNG, JPG, WEBP or SVG. Max size 5MB.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Company Name */}
          <div className="space-y-1.5">
            <Label htmlFor="orgName" className="text-xs font-semibold text-[var(--inv-text-muted)]">
              Company / Business Name *
            </Label>
            <Input
              id="orgName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Creative Agency"
              required
              disabled={!isOwnerOrAdmin}
              className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)] disabled:opacity-60"
            />
          </div>

          {/* Tax Number / VAT */}
          <div className="space-y-1.5">
            <Label htmlFor="taxNumber" className="text-xs font-semibold text-[var(--inv-text-muted)]">
              Tax ID / VAT Number
            </Label>
            <Input
              id="taxNumber"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="e.g. US-123456789 or EU-987654321"
              disabled={!isOwnerOrAdmin}
              className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)] disabled:opacity-60"
            />
            <p className="text-[10px] text-[var(--inv-text-muted)]">
              Printed on your generated PDF invoices.
            </p>
          </div>

          {/* Billing Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-[var(--inv-text-muted)]">
              Billing Address
            </Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Company Street 123&#10;10000 New York, USA"
              rows={4}
              disabled={!isOwnerOrAdmin}
              className="inv-input-focus h-24 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)] resize-none disabled:opacity-60"
            />
            <p className="text-[10px] text-[var(--inv-text-muted)]">
              Physical address printed on invoice headers.
            </p>
          </div>
        </div>

        {/* Save Button */}
        {isOwnerOrAdmin && (
          <div className="border-t border-[var(--inv-divider)] pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-10 rounded-xl px-6 text-sm font-bold bg-[var(--inv-accent-primary)] text-white hover:bg-[var(--inv-accent-hover)]"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
