"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { resetPasswordAction } from "../../server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Loader, Mail, AlertCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";

type ResetPasswordActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    email?: string[];
  };
};

const MotionButton = motion(Button);

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <MotionButton
      type="submit"
      disabled={pending}
      whileTap={{ scale: 0.98 }}
      className="group mt-2 h-11 w-full rounded-xl font-medium text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 ease-out"
    >
      {pending ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Sending reset link...
        </>
      ) : (
        "Send reset link"
      )}
    </MotionButton>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    resetPasswordAction as (
      ...args: unknown[]
    ) => Promise<ResetPasswordActionState>,
    {} as ResetPasswordActionState,
  );

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
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:shadow-black/40"
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
            Reset password
          </h1>
          <p className="text-muted-foreground mx-auto max-w-[280px] text-[15px] leading-relaxed">
            Enter your email and we will send you a secure link to reset it.
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
                htmlFor="email"
                className="text-foreground text-sm font-medium"
              >
                Email address
              </Label>
              <div className="relative flex items-center justify-between">
                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:border-primary/40 h-11 items-center rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 pr-3 pl-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  aria-invalid={!!state?.fieldErrors?.email}
                />
              </div>
              {state?.fieldErrors?.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="text-red-500 dark:text-red-400 mt-1.5 flex items-center gap-1.5 text-xs font-medium"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {state.fieldErrors.email[0]}
                </motion.p>
              )}
            </div>

            <SubmitButton />

            {state?.error && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Alert
                  variant="error"
                  className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 mt-4 flex items-center gap-2 rounded-xl"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{state.error}</span>
                </Alert>
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

export default ForgotPasswordForm;
