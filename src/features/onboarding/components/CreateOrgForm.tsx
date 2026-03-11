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
} from "lucide-react";
import {
  createOrganizationAction,
  type CreateOrgState,
} from "../server/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SubmitButton from "./SubmitButton";

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

      <div className="sm:bg-background/70 relative z-10 flex min-h-[460px] flex-col overflow-hidden p-6 transition-all duration-500 hover:border-white/20 sm:rounded-[2rem] sm:border sm:border-white/10 sm:p-10 sm:shadow-2xl sm:shadow-black/20 sm:backdrop-blur-2xl">
        <form
          action={formAction}
          className="flex h-full flex-1 flex-col justify-center"
        >
          {/* Hidden inputs ensure data is sent to server action even if not currently rendered in AnimatePresence */}
          <input type="hidden" name="name" value={orgName} />
          <input type="hidden" name="type" value={orgType} />

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
                  <div className="from-primary/10 to-primary/5 text-primary border-primary/20 relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl border bg-gradient-to-br shadow-inner">
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
                    <span className="from-primary bg-gradient-to-r via-indigo-400 to-purple-400 bg-clip-text text-transparent">
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
                  <Button
                    type="button"
                    size="lg"
                    className="group shadow-primary/25 hover:shadow-primary/40 h-12 w-full rounded-xl text-base text-white shadow-lg transition-all"
                    onClick={goToNextStep}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </Button>
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
                    <div className="bg-primary h-1.5 flex-1 rounded-full" />
                    <div className="bg-primary/20 h-1.5 flex-1 rounded-full" />
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
                    <Building2 className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transition-colors" />
                    <Input
                      id="name-input"
                      type="text" // Removed name="name" to rely purely on the hidden input and state
                      placeholder="e.g. Acme Design Studio"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      autoFocus
                      className="bg-background/40 focus:bg-background/80 h-12 items-center rounded-xl border-white/10 pr-4 pl-12 text-lg font-medium transition-all hover:border-white/20"
                    />
                  </div>
                  {state.fieldErrors?.name && (
                    <p className="text-destructive text-sm" role="alert">
                      {state.fieldErrors.name[0]}
                    </p>
                  )}
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="mt-auto flex flex-col space-y-3 pt-4"
                >
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 w-full rounded-xl text-base text-white"
                    onClick={goToNextStep}
                    disabled={orgName.trim().length < 2}
                  >
                    Continue
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground w-full rounded-xl"
                    onClick={() => setStep(0)}
                  >
                    Back
                  </Button>
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
                    <div className="bg-primary h-1.5 flex-1 rounded-full transition-all" />
                    <div className="bg-primary h-1.5 flex-1 rounded-full transition-all" />
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
                  <button
                    type="button"
                    onClick={() => setOrgType("freelancer")}
                    className={`group relative flex flex-col items-start justify-center space-y-3 rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      orgType === "freelancer"
                        ? "border-primary bg-primary/5 shadow-primary/10 ring-primary/30 shadow-lg ring-1"
                        : "border-border/50 bg-background/30 hover:border-border hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                    }`}
                  >
                    <div
                      className={`rounded-xl p-2 transition-colors ${orgType === "freelancer" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground group-hover:text-foreground"}`}
                    >
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold ${orgType === "freelancer" ? "text-primary" : "text-foreground"}`}
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
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrgType("agency")}
                    className={`group relative flex flex-col items-start justify-center space-y-3 rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      orgType === "agency"
                        ? "border-primary bg-primary/5 shadow-primary/10 ring-primary/30 shadow-lg ring-1"
                        : "border-border/50 bg-background/30 hover:border-border hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                    }`}
                  >
                    <div
                      className={`rounded-xl p-2 transition-colors ${orgType === "agency" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground group-hover:text-foreground"}`}
                    >
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold ${orgType === "agency" ? "text-primary" : "text-foreground"}`}
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
                  </button>
                </motion.div>

                {state.fieldErrors?.type && (
                  <motion.p
                    variants={itemVariants}
                    className="text-destructive text-sm"
                    role="alert"
                  >
                    {state.fieldErrors.type[0]}
                  </motion.p>
                )}

                <motion.div
                  variants={itemVariants}
                  className="mt-auto flex flex-col space-y-3 pt-4"
                >
                  <SubmitButton disabled={orgType === ""} />
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground w-full rounded-xl"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </motion.div>
  );
}
