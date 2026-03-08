"use client";

import { Button } from "@/components/ui/button";
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
    dividerText: "or continue with email",
    footerText: "Don't have an account?",
    footerLinkText: "Sign up",
    footerHref: "/sign-up",
  },
  "sign-up": {
    heading: "Create an account",
    description: "Start automating your workflows today",
    dividerText: "or sign up with email",
    footerText: "Already have an account?",
    footerLinkText: "Sign in",
    footerHref: "/login",
  },
};

const AuthCard = ({ children, formType }: AuthCardProps) => {
  const {
    heading,
    description,
    dividerText,
    footerText,
    footerLinkText,
    footerHref,
  } = config[formType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-background border-border/40 w-full overflow-hidden rounded-2xl border shadow-xl shadow-black/5"
    >
      <div className="flex flex-col space-y-8 p-8 sm:p-10">
        {/* Header section */}
        <div className="mb-8 flex flex-col items-center space-y-2 text-center">
          <div className="bg-primary/5 ring-primary/10 mb-2 rounded-2xl p-3 ring-1">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="drop-shadow-sm"
            />
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {heading}
          </h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-border/60 h-px flex-1" />
        </div>

        {/* Form content injected from parent */}
        <div className="w-full">{children}</div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="bg-border/60 h-px flex-1" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {dividerText}
          </span>
          <div className="bg-border/60 h-px flex-1" />
        </div>

        {/* Google OAuth Button */}
        <div>
          <Button
            variant="outline"
            className="bg-background hover:bg-muted/50 border-border/80 h-11 w-full rounded-lg font-medium shadow-sm transition-colors"
          >
            <svg
              className="mr-2.5 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Continue with Google
          </Button>
        </div>

        {/* Footer */}
        <div className="text-muted-foreground pt-2 text-center text-sm font-medium">
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
