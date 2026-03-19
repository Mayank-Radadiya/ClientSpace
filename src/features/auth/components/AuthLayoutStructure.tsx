/**
 * AuthLayoutStructure Component
 * ----------------------------
 * High-end professional SaaS centralized authentication layout.
 * Emphasizes absolute clarity, centered focus, and subtle depth.
 */

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggleButton } from "@/components/global/ThemeToggleButton";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayoutStructure = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* Background Elements: Dynamic Aurora Orbs and Subtle Grid */}
      <div className="bg-background absolute inset-0 z-0 overflow-hidden">
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] mask-[radial-gradient(ellipse_90%_80%_at_50%_0%,#000_70%,transparent_100%)] bg-size-[24px_24px]" />

        {/* Grid texture background */}
        <div className="bg-grid-small-black/[0.2] dark:bg-grid-small-white/[0.05] absolute inset-0 z-0"></div>

        {/* Radial mask to soften edges and focus center */}
        {/* <div className="bg-background absolute inset-0 z-0 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]"></div> */}

        {/* Ambient gradient blobs for depth */}
        <div className="absolute top-0 -left-1/4 z-0 h-[500px] w-[500px] rounded-full bg-[#e05d38]/5 blur-[120px] dark:bg-[#e05d38]/20"></div>

        <div className="absolute -right-1/4 bottom-0 z-0 h-[500px] w-[500px] rounded-full bg-[#e05d38]/50 blur-[120px] dark:bg-[#e05d38]/10"></div>

        <div className="absolute bottom-0 left-1/3 z-0 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[80px] dark:bg-blue-500/10"></div>

        {/* Animated Glow Orbs */}
        <motion.div
          initial={{ opacity: 0.5, x: 0, y: 0, scale: 1 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-primary/40 absolute -top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full blur-[100px] sm:h-[500px] sm:w-[500px]"
        />
        <motion.div
          initial={{ opacity: 0.4, x: 0, y: 0, scale: 1 }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.6, 0.4],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -right-[10%] -bottom-[10%] h-[400px] w-[400px] rounded-full bg-blue-500/30 blur-[100px] sm:h-[500px] sm:w-[500px] dark:bg-blue-500/20"
        />
        <motion.div
          initial={{ opacity: 0.3, x: 0, y: 0, scale: 1 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 30, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-purple-500/30 blur-[100px] sm:h-[400px] sm:w-[400px] dark:bg-purple-500/20"
        />
      </div>

      {/* Top Navigation Bar: Absolute Positioning */}
      <div className="absolute top-4 z-10 mx-auto flex w-full items-center justify-between px-10">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to site</span>
        </Link>
        <ThemeToggleButton />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto w-full max-w-[450px]">
        {/* Ambient Form Glow */}
        {/* <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-50">
          <div className="bg-primary/20 dark:bg-primary/30 h-[300px] w-[300px] rounded-full blur-[100px] sm:h-[400px] sm:w-[400px]" />
        </div> */}

        {/* The Auth form injected here */}
        {children}

        {/* Legal disclaimers at the bottom of the layout, below the card */}
        <p className="text-muted-foreground mx-auto mt-8 max-w-[80%] text-center text-xs leading-relaxed">
          By clicking continue, you agree to our{" "}
          <Link
            href="/terms"
            className="hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default AuthLayoutStructure;
