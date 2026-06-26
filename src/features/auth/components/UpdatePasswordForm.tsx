"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { updatePasswordAction } from "../server/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { KeyRound, Loader, Lock, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { PasswordField } from "./PasswordField";

type PasswordActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

const MotionButton = motion(Button);

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(
    updatePasswordAction as (
      ...args: unknown[]
    ) => Promise<PasswordActionState>,
    {} as PasswordActionState,
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
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:shadow-black/40 sm:p-10"
    >
      {/* Decorative top gradient line */}
      <div className="via-primary/50 absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent to-transparent opacity-80" />

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
          <form action={formAction} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-foreground text-sm font-medium"
              >
                New Password
              </Label>
              <PasswordField
                id="password"
                name="password"
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
              {state?.fieldErrors?.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-destructive mt-1.5 flex items-center gap-1.5 text-xs font-medium"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {state.fieldErrors.password[0]}
                </motion.p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-foreground text-sm font-medium"
              >
                Confirm Password
              </Label>
              <PasswordField
                id="confirmPassword"
                name="confirmPassword"
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
              {state?.fieldErrors?.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-destructive mt-1.5 flex items-center gap-1.5 text-xs font-medium"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {state.fieldErrors.confirmPassword[0]}
                </motion.p>
              )}
            </div>

            <MotionButton
              type="submit"
              disabled={pending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="group mt-2 h-11 w-full rounded-xl font-medium text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 ease-out"
            >
              {pending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </MotionButton>

            {state?.error && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Alert
                  variant="error"
                  className="bg-destructive/10 border-destructive/20 text-destructive mt-4 flex items-center gap-2 rounded-xl"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{state.error}</span>
                </Alert>
              </motion.div>
            )}

            {state?.success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-success/10 border-success/20 text-success mt-4 flex items-center gap-2.5 rounded-xl border p-3 text-sm font-medium"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                </motion.span>
                <span>Password updated successfully!</span>
              </motion.div>
            )}
          </form>

          {/* Action Buttons */}
          <div className="mt-8 flex w-full flex-col items-center">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground group flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:underline underline-offset-4"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Back to login</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
