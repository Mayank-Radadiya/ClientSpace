"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  resendOtpAction,
  verifyOtpAction,
} from "@/features/auth/server/actions";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

interface VerifyOtpFormProps {
  email: string;
  type: "signup" | "recovery";
}

export default function VerifyOtpForm({ email, type }: VerifyOtpFormProps) {
  const [state, action, isPending] = useActionState(verifyOtpAction, {});
  const [resendState, resendAction, isResending] = useActionState(
    resendOtpAction,
    {},
  );

  const [otp, setOtp] = useState("");

  const heading =
    type === "recovery" ? "Reset your password" : "Verify your account";
  const desc = `We've sent an 8-digit code to ${email}. Please enter it below.`;

  const isComplete = otp.length === 8;

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

      <div className="flex flex-col items-center justify-center text-center">
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
            <KeyRound className="h-10 w-10 stroke-[1.5] transition-transform duration-500 ease-out group-hover:scale-110" />
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="border-background absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] bg-blue-500 text-white shadow-lg"
            >
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 },
          }}
          className="space-y-4"
        >
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            {heading}
          </h1>
          <p className="text-muted-foreground mx-auto max-w-[280px] text-[15px] leading-relaxed">
            {desc}
          </p>
        </motion.div>

        {/* Form Content */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 },
          }}
          className="mt-8 flex w-full justify-center"
        >
          <form action={action} className="w-full space-y-6">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="token" value={otp} />

            <div className="flex w-full justify-center">
              <InputOTP maxLength={8} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>

                <InputOTPSeparator />

                <InputOTPGroup>
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {state?.error && (
              <p className="text-destructive mt-2 text-center text-sm">
                {state.error}
              </p>
            )}

            {state?.fieldErrors?.token && (
              <p className="text-destructive mt-2 text-center text-sm">
                {state.fieldErrors.token[0]}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending || !isComplete}
              className="mt-4 h-11 w-full rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 },
          }}
          className="mt-8 flex w-full flex-col items-center gap-3"
        >
          <form action={resendAction} className="mt-2 text-xs">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="type" value={type} />
            <p className="text-muted-foreground inline">
              Didn&apos;t receive it?{" "}
            </p>
            <button
              type="submit"
              disabled={isResending}
              className="text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
            >
              {isResending ? "Resending..." : "Click to resend"}
            </button>
            {resendState?.error && (
              <p className="text-destructive mt-1 block">{resendState.error}</p>
            )}
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
