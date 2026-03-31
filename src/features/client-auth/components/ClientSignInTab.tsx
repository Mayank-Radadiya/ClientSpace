"use client";

import { Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import type { InvitationWithDetails } from "@/features/clients/server/queries";

type ClientSignInTabProps = {
  invitation: InvitationWithDetails;
  token: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="group relative w-full overflow-hidden"
      disabled={pending}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 font-medium text-white">
        {pending ? "Signing in..." : "Sign In & Accept"}
      </span>
      <div className="group-hover:animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </Button>
  );
}

export function ClientSignInTab({
  invitation,
  token,
  fieldErrors,
}: ClientSignInTabProps) {
  return (
    <div className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={invitation.email} />

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <div className="group relative">
          <Mail className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
          <Input
            type="email"
            value={invitation.email}
            readOnly
            disabled
            className="bg-muted/50 h-12 cursor-not-allowed rounded-xl border-white/10 pr-4 pl-12 font-medium"
          />
        </div>
        <p className="text-muted-foreground px-1 text-xs">
          This email is locked to your invitation
        </p>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="group relative">
          <Lock className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transition-colors" />
          <Input
            id="signin-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            className="bg-background/40 focus:bg-background/80 h-12 rounded-xl border-white/10 pr-4 pl-12 font-medium transition-all hover:border-white/20"
          />
        </div>
        {fieldErrors?.password && (
          <p className="text-destructive px-1 text-xs" role="alert">
            {fieldErrors.password[0]}
          </p>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <SubmitButton />
        <p className="text-muted-foreground text-center text-xs">
          Don't have an account? Use the "Create Account" tab instead.
        </p>
      </div>
    </div>
  );
}
