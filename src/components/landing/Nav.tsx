"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react";
import { ThemeToggleButton } from "@/components/global/ThemeToggleButton";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 30);
  });

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Workflow", href: "#workflow" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  return (
    <>
      {/* Desktop Nav */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 hidden md:block"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          {/* Logo — always visible, left-aligned */}
          <Link href="/" className="group z-50 flex items-center gap-2.5">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${scrolled ? "bg-[#6C63FF]" : "bg-[#6C63FF]"} group-hover:scale-95`}>
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 16 16" fill="currentColor">
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="9" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="9" width="5" height="5" rx="1" opacity="0.4" />
              </svg>
            </div>
            <span className={`font-display text-lg font-bold tracking-tight transition-colors duration-300 ${scrolled ? "text-lp-text" : "text-lp-text"}`}>
              ClientSpace
            </span>
          </Link>

          {/* Right nav pill — inverts to dark on scroll */}
          <div className={`flex items-center gap-1 rounded-[4px] px-2 py-1.5 transition-all duration-500 ${
            scrolled
              ? "bg-lp-text shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]"
              : "bg-lp-text shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)]"
          }`}>
            {navLinks.map((link, i) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-2 text-xs font-medium tracking-wide transition-colors duration-200 ${
                  i === 0
                    ? "text-lp-bg"
                    : "text-lp-bg/60 hover:text-lp-bg"
                }`}
              >
                {i === 0 && (
                  <>
                    <span className="pointer-events-none absolute top-1/2 left-0.5 -translate-y-1/2 text-xs text-lp-bg leading-none">[</span>
                    <span className="pointer-events-none absolute top-1/2 right-0.5 -translate-y-1/2 text-xs text-lp-bg leading-none">]</span>
                  </>
                )}
                <span className="relative">{link.name}</span>
              </Link>
            ))}

            <div className="mx-1 h-4 w-px bg-lp-bg/15" />

            <ThemeToggleButton className="!border-transparent !bg-transparent !shadow-none text-lp-bg/60 hover:text-lp-bg" />

            <Link
              href="/login"
              className="px-4 py-2 text-xs font-medium text-lp-bg/60 transition-colors hover:text-lp-bg"
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="ml-1 rounded-[2px] bg-lp-bg px-5 py-2 text-xs font-semibold text-lp-text transition-opacity hover:opacity-90"
            >
              Get early access
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Mobile Nav */}
      <div className="fixed inset-x-0 top-0 z-50 md:hidden">
        <div className="container py-3">
          <div className="flex w-full items-center justify-between overflow-hidden rounded-[4px] bg-lp-text px-4 py-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#6C63FF]">
                <svg className="h-3 w-3 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="2" width="5" height="5" rx="1" />
                  <rect x="9" y="2" width="5" height="5" rx="1" />
                  <rect x="2" y="9" width="5" height="5" rx="1" />
                  <rect x="9" y="9" width="5" height="5" rx="1" opacity="0.4" />
                </svg>
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-lp-bg">
                ClientSpace
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggleButton className="!border-transparent !bg-transparent !shadow-none text-lp-bg/60 hover:text-lp-bg" />
              <Link
                href="/signup"
                className="rounded-[2px] bg-lp-bg px-4 py-1.5 text-xs font-semibold text-lp-text"
              >
                Get access
              </Link>
              <button
                className="flex h-8 w-8 items-center justify-center text-lp-bg/70 hover:text-lp-bg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute top-0 right-0 bottom-0 flex w-4/5 max-w-sm flex-col bg-lp-text px-8 pt-24 pb-10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.1, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-block w-full py-3 text-xl font-semibold text-lp-bg/60 hover:text-lp-bg transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="mt-auto flex flex-col gap-3 border-t border-lp-bg/10 pt-8"
              >
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-[3px] border border-lp-bg/20 py-3 text-center text-sm font-medium text-lp-bg/70 hover:text-lp-bg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-[3px] bg-lp-bg py-3 text-center text-sm font-bold text-lp-text"
                >
                  Get early access
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
