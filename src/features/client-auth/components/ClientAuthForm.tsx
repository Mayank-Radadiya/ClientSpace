"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Building2, Mail, User } from "lucide-react";
import Image from "next/image";
import type { InvitationWithDetails } from "@/features/clients/server/queries";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useActionState } from "react";
import {
  acceptInviteSignUpAction,
  acceptInviteSignInAction,
} from "@/features/clients/server/actions";
import { ClientSignUpTab } from "./ClientSignUpTab";
import { ClientSignInTab } from "./ClientSignInTab";

type ClientAuthFormProps = {
  invitation: InvitationWithDetails;
  token: string;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.1, ease: "easeOut" },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(3px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

export function ClientAuthForm({ invitation, token }: ClientAuthFormProps) {
  const [activeTab, setActiveTab] = useState<"signup" | "signin">("signup");

  const [signUpState, signUpAction] = useActionState(
    acceptInviteSignUpAction,
    {},
  );
  const [signInState, signInAction] = useActionState(
    acceptInviteSignInAction,
    {},
  );

  const currentState = activeTab === "signup" ? signUpState : signInState;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative z-10 w-full max-w-[520px]"
    >
      {/* Decorative background glow */}
      <div className="from-primary/20 absolute -inset-1 z-0 rounded-3xl bg-gradient-to-tr via-indigo-500/20 to-purple-500/20 opacity-50 blur-2xl" />

      <div className="sm:bg-background/70 relative z-10 overflow-hidden p-6 transition-all duration-500 hover:border-white/20 sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-2xl sm:shadow-black/20 sm:backdrop-blur-2xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col space-y-6"
        >
          {/* Header */}
          <div className="space-y-3 text-center">
            <motion.div
              variants={itemVariants}
              className="bg-primary/5 ring-primary/20 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-1"
            >
              <Image src="/logo.svg" alt="ClientSpace" width={24} height={24} />
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl"
            >
              You've been invited!
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-muted-foreground text-sm leading-relaxed"
            >
              <strong className="text-foreground">
                {invitation.organization.name}
              </strong>{" "}
              has invited you to access their client portal.
            </motion.p>
          </div>

          {/* Invitation Details */}
          <motion.div
            variants={itemVariants}
            className="bg-muted/30 rounded-xl border border-white/5 p-4"
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">Company:</span>
                <span className="text-foreground font-medium">
                  {invitation.client.companyName || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">Contact:</span>
                <span className="text-foreground font-medium">
                  {invitation.client.contactName || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground font-medium">
                  {invitation.email}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Error Display */}
          {currentState.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              role="alert"
              className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-xl border p-3 text-sm font-medium"
            >
              <span className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
              {currentState.error}
            </motion.div>
          )}

          {/* Tabs for Sign Up / Sign In */}
          <motion.div variants={itemVariants}>
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "signup" | "signin")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Create Account</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="mt-6">
                <form action={signUpAction}>
                  <ClientSignUpTab
                    invitation={invitation}
                    token={token}
                    fieldErrors={signUpState.fieldErrors}
                  />
                </form>
              </TabsContent>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="mt-6">
                <form action={signInAction}>
                  <ClientSignInTab
                    invitation={invitation}
                    token={token}
                    fieldErrors={signInState.fieldErrors}
                  />
                </form>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
