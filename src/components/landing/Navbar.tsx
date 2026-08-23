"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";

import { ThemeToggleButton } from "@/components/global/ThemeToggleButton";

/* ─── Nav links ──────────────────────────────────────────── */
const NAV_LINKS = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "How it works", href: "#how-it-works" },
  { name: "Blog", href: "#blog" },
];

const ease = [0.22, 1, 0.36, 1] as const;

/* ─── Desktop nav link ───────────────────────────────────── */
function NavLink({ name, href }: { name: string; href: string }) {
  return (
    <Link
      href={href}
      className="group text-cs-ink-muted hover:text-cs-ink relative py-1 text-[13px] font-medium transition-colors duration-200"
    >
      {name}
      <span className="bg-cs-accent absolute bottom-0 left-0 h-px w-0 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

/* ─── Navbar ─────────────────────────────────────────────── */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ─── Desktop ─────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="fixed inset-x-0 top-0 z-50 hidden items-center justify-between md:flex"
        style={{
          pointerEvents: "none",
          background: scrolled ? "var(--ld-raised)" : "transparent",
          borderBottom: scrolled
            ? "1px solid var(--ld-line)"
            : "1px solid transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          transition:
            "background 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 transition-all duration-500 lg:px-12"
          style={{ pointerEvents: "auto" }}
        >
          {/* Logo wordmark + live status chip */}
          <Link
            href="/"
            className="group flex items-center gap-2"
            aria-label="ClientSpace home"
          >
            <motion.span
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="bg-cs-ink/[0.08] ring-cs-line-strong flex h-6 w-6 items-center justify-center rounded-md ring-1"
              style={{}}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden
                style={{ color: "var(--ld-ink)" }}
              >
                <rect
                  x="0"
                  y="0"
                  width="5.4"
                  height="5.4"
                  rx="1.2"
                  fill="currentColor"
                  fillOpacity="0.6"
                />
                <rect
                  x="6.6"
                  y="0"
                  width="5.4"
                  height="5.4"
                  rx="1.2"
                  fill="currentColor"
                  fillOpacity="0.25"
                />
                <rect
                  x="0"
                  y="6.6"
                  width="5.4"
                  height="5.4"
                  rx="1.2"
                  fill="currentColor"
                  fillOpacity="0.25"
                />
                <rect
                  x="6.6"
                  y="6.6"
                  width="5.4"
                  height="5.4"
                  rx="1.2"
                  fill="var(--ld-accent)"
                />
              </svg>
            </motion.span>
            <span className="text-cs-ink text-[15px] font-semibold tracking-[-0.02em] transition-colors duration-200">
              ClientSpace
            </span>
            {/* Live status ticker — desktop only */}
            <span className="border-cs-line bg-cs-bg-raised/60 ml-2 hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 lg:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="bg-cs-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-cs-accent relative inline-flex h-1.5 w-1.5 rounded-full" />
              </span>
              <span className="text-cs-ink-muted font-mono text-[9px] tracking-wider">
                41 studios online
              </span>
            </span>
          </Link>

          {/* Centre: pill nav cluster matching Meridian reference */}
          <nav
            className="border-cs-line bg-cs-bg-raised/50 flex items-center gap-1 rounded-full border px-1.5 py-1 backdrop-blur-sm transition-all duration-300"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-cs-ink-muted hover:bg-cs-ink/[0.06] hover:text-cs-ink rounded-full px-4 py-1.5 text-[12px] font-medium transition-all duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <Link
              href="/login"
              className="text-cs-ink-muted hover:text-cs-ink text-[13px] font-medium transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="group bg-cs-cta-bg text-cs-cta-text relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full px-5 text-[13px] font-semibold transition-all duration-300 hover:-translate-y-px hover:opacity-90"
            >
              <span className="relative z-10">Get started</span>
              <motion.span
                className="relative z-10 inline-block"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                →
              </motion.span>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ─── Mobile header ───────────────────────────────── */}
      <div className="fixed inset-x-0 top-0 z-50 md:hidden">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex h-[60px] items-center justify-between px-5 transition-all duration-300"
          style={{
            background: scrolled ? "var(--ld-raised)" : "transparent",
            backdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom: scrolled ? "1px solid var(--ld-hairline)" : "none",
          }}
        >
          <Link
            href="/"
            className="flex items-center gap-1.5"
            aria-label="ClientSpace home"
          >
            <span className="bg-cs-ink/[0.08] ring-cs-line-strong flex h-6 w-6 items-center justify-center rounded-md ring-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden
                style={{ color: "var(--ld-ink)" }}
              >
                <rect
                  x="0"
                  y="0"
                  width="5.4"
                  height="5.4"
                  rx="1.2"
                  fill="currentColor"
                  fillOpacity="0.6"
                />
                <rect
                  x="6.6"
                  y="0"
                  width="5.4"
                  height="5.4"
                  rx="1.2"
                  fill="currentColor"
                  fillOpacity="0.25"
                />
                <rect
                  x="0"
                  y="6.6"
                  width="5.4"
                  height="5.4"
                  rx="1.2"
                  fill="currentColor"
                  fillOpacity="0.25"
                />
                <rect
                  x="6.6"
                  y="6.6"
                  width="5.4"
                  height="5.4"
                  rx="1.2"
                  fill="var(--ld-accent)"
                />
              </svg>
            </span>
            <span className="text-cs-ink text-[15px] font-semibold tracking-[-0.02em]">
              ClientSpace
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <button
              onClick={() => setMobileOpen(true)}
              className="text-cs-ink-muted hover:bg-cs-ink/[0.06] flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <svg
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
                aria-hidden
              >
                <path
                  d="M0 1h18M0 7h12M0 13h18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>

      {/* ─── Mobile drawer ────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease }}
              className="fixed top-0 right-0 bottom-0 z-50 flex w-[80vw] max-w-sm flex-col md:hidden"
              style={{
                background: "var(--ld-raised)",
                borderLeft: "1px solid var(--ld-hairline)",
              }}
            >
              <div
                className="flex h-[60px] items-center justify-between px-5"
                style={{ borderBottom: "1px solid var(--ld-hairline)" }}
              >
                <span className="text-cs-ink text-[14px] font-semibold">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-cs-ink-muted hover:bg-cs-ink/[0.06] flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M1 1l12 12M13 1L1 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <nav
                className="flex flex-col gap-1 px-5 pt-6 pb-4"
                aria-label="Mobile navigation"
              >
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.07, duration: 0.3, ease }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-cs-ink-muted hover:bg-cs-ink/[0.04] hover:text-cs-ink flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium transition-colors"
                    >
                      {link.name}
                      <span className="text-cs-ink-muted/50 text-xs">→</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div
                className="mt-auto flex flex-col gap-3 p-5"
                style={{ borderTop: "1px solid var(--ld-hairline)" }}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="border-cs-line-strong text-cs-ink-muted hover:bg-cs-ink/[0.05] hover:text-cs-ink flex h-11 items-center justify-center rounded-full border text-[14px] font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="bg-cs-cta-bg text-cs-cta-text flex h-11 items-center justify-center rounded-full text-[14px] font-semibold transition-opacity hover:opacity-90"
                >
                  Get started free
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
