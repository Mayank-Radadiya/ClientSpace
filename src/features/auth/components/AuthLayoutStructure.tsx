/**
 * AuthLayoutStructure Component
 * ----------------------------
 * High-end professional SaaS centralized authentication layout.
 * Emphasizes absolute clarity, centered focus, and subtle depth.
 */

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ThemeToggleButton } from "@/components/global/ThemeToggleButton";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayoutStructure = ({ children }: AuthLayoutProps) => {
  const shouldReduceMotion = useReducedMotion();

  const orbTransition1 = shouldReduceMotion
    ? ({ duration: 0 } as const)
    : ({
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut" as const,
      } as const);

  const orbTransition2 = shouldReduceMotion
    ? ({ duration: 0 } as const)
    : ({
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 2,
      } as const);

  const orbTransition3 = shouldReduceMotion
    ? ({ duration: 0 } as const)
    : ({
        duration: 22,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 5,
      } as const);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-zinc-50/60 via-zinc-50/40 to-zinc-100/40 p-4 transition-colors duration-300 dark:from-zinc-950/60 dark:via-zinc-950/40 dark:to-zinc-900/40">
      {/* Background Elements: Dynamic Aurora Orbs and Subtle Grid */}
      <div className="bg-background absolute inset-0 z-0 overflow-hidden transition-colors duration-300">
        {/* Subtle Grid with safari mask support */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:24px_24px]"
          style={{
            WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 0%, #000 60%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 90% 80% at 50% 0%, #000 60%, transparent 100%)"
          }}
        />

        {/* Grid texture background */}
        <div className="bg-grid-small-black/[0.1] dark:bg-grid-small-white/[0.02] absolute inset-0 z-0" />

        {/* Ambient gradient blobs for depth */}
        <div className="absolute top-0 -left-1/4 z-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
        <div className="absolute -right-1/4 bottom-0 z-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/5" />
        <div className="absolute bottom-0 left-1/3 z-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px] dark:bg-blue-500/5" />

        {/* Animated Glow Orbs (bypassed if reduced motion is active) */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              initial={{ opacity: 0.2, x: 0, y: 0, scale: 1 }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.2, 0.3, 0.2],
                x: [0, 40, 0],
                y: [0, -20, 0],
              }}
              transition={orbTransition1}
              className="bg-primary/30 absolute -top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full blur-[100px] sm:h-[500px] sm:w-[500px]"
            />
            <motion.div
              initial={{ opacity: 0.15, x: 0, y: 0, scale: 1 }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.15, 0.25, 0.15],
                x: [0, -40, 0],
                y: [0, 40, 0],
              }}
              transition={orbTransition2}
              className="absolute -right-[10%] -bottom-[10%] h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px] sm:h-[500px] sm:w-[500px]"
            />
            <motion.div
              initial={{ opacity: 0.12, x: 0, y: 0, scale: 1 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.12, 0.2, 0.12],
                x: [0, 20, 0],
                y: [0, 20, 0],
              }}
              transition={orbTransition3}
              className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-purple-500/20 blur-[100px] sm:h-[400px] sm:w-[400px]"
            />
          </>
        )}
      </div>

      {/* Top Navigation Bar: Absolute Positioning */}
      <div className="absolute top-4 z-10 mx-auto flex w-full items-center justify-between px-10">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 hover:-translate-x-0.5" />
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
