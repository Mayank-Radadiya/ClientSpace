"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signupAction } from "../server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account..." : "Sign up"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(signupAction, {});

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your details below to create your account
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
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            minLength={2}
          />
          {state?.fieldErrors?.name && (
            <p className="text-destructive text-sm">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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

        <SubmitButton />
      </form>
      <div className="text-center text-sm">
        Already have an account?{" "}
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
