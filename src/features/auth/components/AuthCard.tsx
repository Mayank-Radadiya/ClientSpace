"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface AuthCardProps {
  children: React.ReactNode;
  formType: "login" | "sign-up";
}

const config = {
  login: {
    heading: "Welcome back",
    description: "Login to your ClientSpace account",
    footerText: "Don't have an account?",
    footerLinkText: "Sign up",
    footerHref: "/sign-up",
  },
  "sign-up": {
    heading: "Create an account",
    description: "Start automating your workflows today",
    footerText: "Already have an account?",
    footerLinkText: "Sign in",
    footerHref: "/login",
  },
};

const AuthCard = ({ children, formType }: AuthCardProps) => {
  const { heading, description, footerText, footerLinkText, footerHref } =
    config[formType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-background border-border/40 w-full overflow-hidden rounded-2xl border border-2 border-white/10 bg-transparent shadow-xl shadow-black/5 backdrop-blur-md transition-colors duration-300 hover:border-white/30"
    >
      <div className="flex flex-col p-6 sm:p-8">
        {/* Header section */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="bg-primary/5 ring-primary/10 mb-4 rounded-xl p-2.5 ring-1">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={28}
              height={28}
              className="drop-shadow-sm"
            />
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {heading}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        </div>

        {/* Form content injected from parent */}
        <div className="mb-6 w-full">{children}</div>

        {/* Footer */}
        <div className="text-muted-foreground text-center text-sm font-medium">
          {footerText}{" "}
          <Link
            href={footerHref}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            {footerLinkText}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthCard;
