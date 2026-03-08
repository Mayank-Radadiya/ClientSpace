"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePasswordAction } from "../server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Updating password..." : "Update password"}
    </Button>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, {});

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Update password
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your new password below.
        </p>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
          />
          {state?.fieldErrors?.password && (
            <p className="text-destructive text-sm">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
          />
          {state?.fieldErrors?.confirmPassword && (
            <p className="text-destructive text-sm">
              {state.fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
