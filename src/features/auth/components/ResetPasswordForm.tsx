"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { resetPasswordAction } from "../server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending reset link..." : "Send reset link"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, {});

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your email address and we will send you a password reset link.
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
          />
          {state?.fieldErrors?.email && (
            <p className="text-destructive text-sm">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <SubmitButton />
      </form>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
