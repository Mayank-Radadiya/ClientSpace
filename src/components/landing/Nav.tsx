"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import dynamic from "next/dynamic";

const ShimmerButton = dynamic(() => import("@/components/ui/shimmer-button").then(mod => mod.ShimmerButton), { ssr: false });

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/70 backdrop-blur-md border-b border-border py-3" : "bg-transparent py-5"}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
            C
          </div>
          <span className="font-semibold text-lg tracking-tight">ClientSpace</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#workflow" className="hover:text-foreground transition-colors">Workflow</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden text-sm font-medium hover:text-foreground transition-colors md:block text-muted-foreground">
            Log in
          </Link>
          <ShimmerButton className="shadow-2xl" background="hsl(var(--primary))">
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-primary-foreground">
              Get Started
            </span>
          </ShimmerButton>
        </div>
      </div>
    </motion.header>
  );
}
