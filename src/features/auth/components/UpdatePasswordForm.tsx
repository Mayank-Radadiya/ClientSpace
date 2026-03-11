"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { updatePasswordAction } from "../server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { KeyRound, Loader, Lock, ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";

export function UpdatePasswordForm() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction] = useActionState<any, FormData>(
    updatePasswordAction,
    {},
  );
  const { pending } = useFormStatus();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.6,
            ease: [0.23, 1, 0.32, 1],
            staggerChildren: 0.1,
            delayChildren: 0.1,
          },
        },
      }}
      className="bg-background relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
    >
      {/* Decorative top gradient line */}
      <div className="via-primary/50 absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent to-transparent opacity-80" />

      {/* Background ambient glow inside the card */}
      <div className="from-primary/10 pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] via-transparent to-transparent opacity-50" />

      <div className="flex flex-col items-center">
        {/* Animated Icon Wrapper */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.5, rotate: -10 },
            visible: { opacity: 1, scale: 1, rotate: 0 },
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative mt-2 mb-8"
        >
          {/* Outer ripples */}
          <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl" />

          <div className="bg-primary/10 text-primary group border-primary/20 relative flex h-24 w-24 items-center justify-center rounded-full border shadow-inner">
            <KeyRound className="h-10 w-10 stroke-[1.5] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-12" />
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 },
          }}
          className="w-full space-y-2 text-center"
        >
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Update password
          </h1>
          <p className="text-muted-foreground mx-auto max-w-[280px] text-[15px] leading-relaxed">
            Enter your new password below to secure your account.
          </p>
        </motion.div>

        {/* Form elements */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 },
          }}
          className="mt-8 w-full"
        >
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <form action={formAction} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-foreground text-sm font-medium"
              >
                New Password
              </Label>
              <div className="relative flex items-center justify-between">
                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-muted/40 hover:bg-muted/80 focus-visible:bg-background focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 items-center rounded-xl border-transparent pr-3 pl-10 shadow-sm transition-all focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={!!state?.fieldErrors?.password}
                />
              </div>
              {state?.fieldErrors?.password && (
                <p className="text-destructive text-xs">
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-foreground text-sm font-medium"
              >
                Confirm Password
              </Label>
              <div className="relative flex items-center justify-between">
                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="bg-muted/40 hover:bg-muted/80 focus-visible:bg-background focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 items-center rounded-xl border-transparent pr-3 pl-10 shadow-sm transition-all focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={!!state?.fieldErrors?.confirmPassword}
                />
              </div>
              {state?.fieldErrors?.confirmPassword && (
                <p className="text-destructive text-xs">
                  {state.fieldErrors.confirmPassword[0]}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="group mt-2 h-11 w-full rounded-xl font-medium text-white shadow-sm transition-all active:scale-[0.98]"
            >
              {pending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>

            {state?.error && (
              <Alert
                variant="error"
                className="bg-destructive/10 border-destructive/20 text-destructive mt-4"
              >
                {state.error}
              </Alert>
            )}
          </form>

          {/* Action Buttons */}
          <div className="mt-8 flex w-full flex-col items-center">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground group flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to login</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
