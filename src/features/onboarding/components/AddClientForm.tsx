"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Building2, Mail, User } from "lucide-react";
import {
  onboardClientAction,
  type OnboardClientState,
} from "../server/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const initialState: OnboardClientState = {};

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
        {pending ? "Adding client..." : "Add your first client"}
        {!pending && (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        )}
      </span>
      <div className="group-hover:animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
    </Button>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.1, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: -20,
    filter: "blur(4px)",
    transition: { duration: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

export function AddClientForm() {
  const [state, formAction] = useActionState(onboardClientAction, initialState);
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative z-10 w-full max-w-[480px]"
    >
      {/* Decorative background glow behind the form itself */}
      <div className="from-primary/20 absolute -inset-1 z-0 rounded-3xl bg-linear-to-tr via-indigo-500/20 to-purple-500/20 opacity-50 blur-2xl" />

      <div className="sm:bg-background/70 relative z-10 flex min-h-[460px] flex-col overflow-hidden p-6 transition-all duration-500 hover:border-white/20 sm:rounded-4xl sm:border sm:border-white/10 sm:p-10 sm:shadow-2xl sm:shadow-black/20 sm:backdrop-blur-2xl">
        <form
          action={formAction}
          className="flex h-full flex-1 flex-col justify-center"
        >
          {state.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              role="alert"
              className="bg-destructive/10 border-destructive/20 text-destructive mb-6 flex items-center gap-2 rounded-xl border p-3 text-sm font-medium"
            >
              <span className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
              {state.error}
            </motion.div>
          )}

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-1 flex-col space-y-6"
          >
            <div className="space-y-3 pt-2 text-center">
              <motion.div
                variants={itemVariants}
                className="ring-primary/20 bg-primary/5 mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full ring-1"
              >
                <span className="text-primary text-sm font-bold">2</span>
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                Add your first client
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground text-sm leading-relaxed"
              >
                Let's set up your first client to start organizing your work.
                You can always add more later.
              </motion.p>
            </div>

            <div className="space-y-4 pt-4">
              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="group relative">
                  <Building2 className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transition-colors" />
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Company Name (e.g. Acme Corp)"
                    required
                    className="bg-background/40 focus:bg-background/80 h-12 items-center rounded-xl border-white/10 pr-4 pl-12 font-medium transition-all hover:border-white/20"
                  />
                </div>
                {state.fieldErrors?.companyName && (
                  <p className="text-destructive px-1 text-xs" role="alert">
                    {state.fieldErrors.companyName[0]}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="group relative">
                  <User className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transition-colors" />
                  <Input
                    id="contactName"
                    name="contactName"
                    type="text"
                    placeholder="Primary Contact (e.g. Jane Doe)"
                    required
                    className="bg-background/40 focus:bg-background/80 h-12 items-center rounded-xl border-white/10 pr-4 pl-12 font-medium transition-all hover:border-white/20"
                  />
                </div>
                {state.fieldErrors?.contactName && (
                  <p className="text-destructive px-1 text-xs" role="alert">
                    {state.fieldErrors.contactName[0]}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="group relative">
                  <Mail className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Client Email (e.g. jane@acme.com)"
                    required
                    className="bg-background/40 focus:bg-background/80 h-12 items-center rounded-xl border-white/10 pr-4 pl-12 font-medium transition-all hover:border-white/20"
                  />
                </div>
                {state.fieldErrors?.email && (
                  <p className="text-destructive px-1 text-xs" role="alert">
                    {state.fieldErrors.email[0]}
                  </p>
                )}
              </motion.div>
            </div>

            <motion.div
              variants={itemVariants}
              className="mt-auto flex flex-col space-y-3 pt-6"
            >
              <SubmitButton />
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground w-full rounded-xl transition-colors"
                onClick={() => router.push("/dashboard")}
              >
                Skip for now
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
