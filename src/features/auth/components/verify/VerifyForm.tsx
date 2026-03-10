"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Inbox } from "lucide-react";
import Link from "next/link";

interface VerifyFormProps {
  heading?: string;
  desc?: string;
}

function VerifyForm({ heading, desc }: VerifyFormProps) {
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

      <div className="flex flex-col items-center text-center">
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
            <Inbox className="h-10 w-10 stroke-[1.5] transition-transform duration-500 ease-out group-hover:scale-110" />
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
            {heading || "Check your email"}
          </h1>
          <p className="text-muted-foreground mx-auto max-w-[280px] text-[15px] leading-relaxed">
            {desc || "We've sent a verification link to your email address."}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 },
          }}
          className="mt-10 flex w-full flex-col items-center gap-3"
        >
          <Button
            variant="outline"
            className="group h-11 w-full rounded-xl transition-all hover:bg-white/5"
          >
            <Link
              href="/login"
              className="flex items-center justify-center gap-2"
            >
              <ArrowLeft className="text-muted-foreground h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to login</span>
            </Link>
          </Button>

          <p className="text-muted-foreground mt-4 text-xs">
            Didn&apos;t receive it?{" "}
            <button className="text-primary hover:text-primary/80 font-medium transition-colors">
              Click to resend
            </button>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default VerifyForm;
