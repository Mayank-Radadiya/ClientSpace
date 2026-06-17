"use client";

import { useActionState, useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  User,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  createOrganizationAction,
  type CreateOrgState,
} from "../server/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SubmitButton from "./SubmitButton";
import { cn } from "@/lib/utils";

const MotionButton = motion(Button);
const MotionIconButton = motion.button;

const initialState: CreateOrgState = {};

// Extracted outside to prevent recreation on every render
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

export function CreateOrganizationForm() {
  const [state, formAction] = useActionState(
    createOrganizationAction,
    initialState,
  );

  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<"freelancer" | "agency" | "">("");

  // Sync server errors with UI state
  // If the server returns an error for the name, jump back to the name step
  useEffect(() => {
    if (state.fieldErrors?.name) {
      setStep(1);
    } else if (state.fieldErrors?.type) {
      setStep(2);
    }
  }, [state]);

  const goToNextStep = () => {
    if (step === 1 && orgName.trim().length >= 2) {
      setStep(2);
    } else if (step === 0) {
      setStep(1);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent accidental form submission
      goToNextStep();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative z-10 w-full max-w-[480px]"
    >
      <div className="from-primary/20 absolute -inset-1 z-0 rounded-3xl bg-gradient-to-tr via-indigo-500/20 to-purple-500/20 opacity-50 blur-2xl" />

      <div className="relative z-10 flex min-h-[460px] flex-col overflow-hidden p-6 transition-all duration-500 sm:rounded-[2rem] border border-zinc-200/80 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:shadow-black/40 sm:p-10">
        <form
          action={formAction}
          className="flex h-full flex-1 flex-col justify-center"
        >
          {/* Hidden inputs ensure data is sent to server action even if not currently rendered in AnimatePresence */}
          <input type="hidden" name="name" value={orgName} />
          <input type="hidden" name="type" value={orgType} />

          {state.error && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              role="alert"
              className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 mb-6 flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all duration-300 ease-out"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* --- STEP 0: WELCOME --- */}
            {step === 0 && (
              <motion.div
                key="step0"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-1 flex-col items-center justify-center space-y-8 py-4 text-center"
              >
                <motion.div variants={itemVariants} className="relative">
                  <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-2xl blur-xl" />
                  <div className="from-primary/10 to-primary/5 text-primary border-primary/20 relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl border bg-linear-to-br shadow-inner">
                    <Sparkles
                      className="text-primary h-10 w-10"
                      strokeWidth={1.5}
                    />
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <motion.h1
                    variants={itemVariants}
                    className="text-foreground text-4xl font-bold tracking-tight"
                  >
                    Build your <br />
                    <span className="from-primary bg-linear-to-r via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      empire
                    </span>
                  </motion.h1>
                  <motion.p
                    variants={itemVariants}
                    className="text-muted-foreground mx-auto max-w-[280px] text-base leading-relaxed"
                  >
                    A beautiful workspace tailored for tracking clients,
                    projects, and invoices.
                  </motion.p>
                </div>

                <motion.div
                  variants={itemVariants}
                  className="mt-auto w-full pt-4"
                >
                  <MotionButton
                    type="button"
                    size="lg"
                    whileTap={{ scale: 0.98 }}
                    className="group shadow-primary/20 hover:shadow-primary/30 h-12 w-full rounded-xl text-base text-white shadow-lg transition-all duration-300 ease-out"
                    onClick={goToNextStep}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </MotionButton>
                </motion.div>
              </motion.div>
            )}

            {/* --- STEP 1: NAME --- */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-1 flex-col space-y-8"
              >
                <div className="space-y-3 pt-2">
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-2"
                  >
                    <div className="bg-primary h-1.5 flex-1 rounded-full transition-all duration-300" />
                    <div className="bg-primary/20 dark:bg-primary/10 h-1.5 flex-1 rounded-full transition-all duration-300" />
                  </motion.div>
                  <motion.h2
                    variants={itemVariants}
                    className="text-foreground mt-6 text-3xl font-bold tracking-tight"
                  >
                    Name your workspace
                  </motion.h2>
                  <motion.p
                    variants={itemVariants}
                    className="text-muted-foreground text-sm"
                  >
                    This is your team's home. You can always change it later in
                    settings.
                  </motion.p>
                </div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="group relative">
                    <Building2 className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transition-colors duration-200" />
                    <Input
                      id="name-input"
                      type="text"
                      placeholder="e.g. Acme Design Studio"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      autoFocus
                      className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:border-primary/40 h-12 items-center rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 pr-4 pl-12 text-lg font-medium transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                  {state.fieldErrors?.name && (
                    <motion.p
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-2 text-sm font-medium"
                      role="alert"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {state.fieldErrors.name[0]}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="mt-auto flex flex-col space-y-3 pt-4"
                >
                  <MotionButton
                    type="button"
                    size="lg"
                    whileTap={{ scale: 0.98 }}
                    className="h-12 w-full rounded-xl text-base text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 ease-out disabled:shadow-none"
                    onClick={goToNextStep}
                    disabled={orgName.trim().length < 2}
                  >
                    Continue
                  </MotionButton>
                  <MotionButton
                    type="button"
                    variant="ghost"
                    whileTap={{ scale: 0.98 }}
                    className="text-muted-foreground hover:text-foreground w-full rounded-xl transition-all duration-300 ease-out"
                    onClick={() => setStep(0)}
                  >
                    Back
                  </MotionButton>
                </motion.div>
              </motion.div>
            )}

            {/* --- STEP 2: TYPE & SUBMIT --- */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-1 flex-col space-y-8"
              >
                <div className="space-y-3 pt-2">
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-2"
                  >
                    <div className="bg-primary h-1.5 flex-1 rounded-full transition-all duration-300" />
                    <div className="bg-primary h-1.5 flex-1 rounded-full transition-all duration-300" />
                  </motion.div>
                  <motion.h2
                    variants={itemVariants}
                    className="text-foreground mt-6 text-3xl font-bold tracking-tight"
                  >
                    What best describes you?
                  </motion.h2>
                  <motion.p
                    variants={itemVariants}
                    className="text-muted-foreground text-sm"
                  >
                    We'll optimize your dashboard and templates based on your
                    choice.
                  </motion.p>
                </div>

                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-2 gap-4"
                >
                  <MotionIconButton
                    type="button"
                    onClick={() => setOrgType("freelancer")}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={cn(
                      "group relative flex flex-col items-start justify-center space-y-3 rounded-2xl border p-5 text-left transition-all duration-300 shadow-xs cursor-pointer select-none",
                      orgType === "freelancer"
                        ? "border-primary bg-primary/5 shadow-primary/10 ring-primary/30 ring-1"
                        : "border-zinc-200 dark:border-zinc-800/80 bg-background/30 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-xl p-2 transition-colors duration-200",
                        orgType === "freelancer" 
                          ? "bg-primary/20 text-primary" 
                          : "bg-secondary text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "font-semibold transition-colors duration-200",
                          orgType === "freelancer" ? "text-primary" : "text-foreground"
                        )}
                      >
                        Freelancer
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        Just me, flying solo.
                      </p>
                    </div>
                    {orgType === "freelancer" && (
                      <CheckCircle2 className="text-primary animate-in zoom-in absolute top-4 right-4 h-5 w-5" />
                    )}
                  </MotionIconButton>

                  <MotionIconButton
                    type="button"
                    onClick={() => setOrgType("agency")}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={cn(
                      "group relative flex flex-col items-start justify-center space-y-3 rounded-2xl border p-5 text-left transition-all duration-300 shadow-xs cursor-pointer select-none",
                      orgType === "agency"
                        ? "border-primary bg-primary/5 shadow-primary/10 ring-primary/30 ring-1"
                        : "border-zinc-200 dark:border-zinc-800/80 bg-background/30 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-xl p-2 transition-colors duration-200",
                        orgType === "agency" 
                          ? "bg-primary/20 text-primary" 
                          : "bg-secondary text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "font-semibold transition-colors duration-200",
                          orgType === "agency" ? "text-primary" : "text-foreground"
                        )}
                      >
                        Agency / Team
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        Working with a crew.
                      </p>
                    </div>
                    {orgType === "agency" && (
                      <CheckCircle2 className="text-primary animate-in zoom-in absolute top-4 right-4 h-5 w-5" />
                    )}
                  </MotionIconButton>
                </motion.div>

                {state.fieldErrors?.type && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-2 text-sm font-medium"
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {state.fieldErrors.type[0]}
                  </motion.p>
                )}

                <motion.div
                  variants={itemVariants}
                  className="mt-auto flex flex-col space-y-3 pt-4"
                >
                  <SubmitButton disabled={orgType === ""} />
                  <MotionButton
                    type="button"
                    variant="ghost"
                    whileTap={{ scale: 0.98 }}
                    className="text-muted-foreground hover:text-foreground w-full rounded-xl transition-all duration-300 ease-out"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </MotionButton>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </motion.div>
  );
}
