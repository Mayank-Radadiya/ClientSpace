"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";

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
      className="group relative py-1 text-[13px] font-medium text-white/40 transition-colors duration-200 hover:text-white/80"
    >
      {name}
      <span className="absolute bottom-0 left-0 h-px w-0 bg-[#bd7a4e] transition-all duration-300 group-hover:w-full" />
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
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ─── Desktop ─────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="fixed inset-x-0 top-0 z-50 hidden md:flex justify-between items-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-12 py-5 transition-all duration-500"
          style={{ pointerEvents: "auto" }}
        >
          {/* Logo wordmark */}
          <Link
            href="/"
            className="group flex items-center gap-2"
            aria-label="ClientSpace home"
          >
            {/* Logo mark */}
            <motion.span
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <rect x="0" y="0" width="5.4" height="5.4" rx="1.2" fill="rgba(255,255,255,0.6)" />
                <rect x="6.6" y="0" width="5.4" height="5.4" rx="1.2" fill="rgba(255,255,255,0.25)" />
                <rect x="0" y="6.6" width="5.4" height="5.4" rx="1.2" fill="rgba(255,255,255,0.25)" />
                <rect x="6.6" y="6.6" width="5.4" height="5.4" rx="1.2" fill="#bd7a4e" />
              </svg>
            </motion.span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white/85 group-hover:text-white transition-colors duration-200">
              ClientSpace
            </span>
          </Link>

          {/* Centre: pill nav cluster matching Meridian reference */}
          <nav
            className="flex items-center gap-1 rounded-full px-1.5 py-1"
            style={{
              background: scrolled
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: scrolled ? "blur(20px)" : "none",
              transition: "all 0.35s ease",
            }}
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-[12px] font-medium text-white/40 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/80"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-white/35 transition-colors duration-200 hover:text-white/70"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full bg-white px-5 text-[13px] font-semibold text-black transition-all duration-300 hover:bg-white/90 hover:-translate-y-px"
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
            background: scrolled ? "rgba(8,8,7,0.9)" : "transparent",
            backdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <Link href="/" className="flex items-center gap-1.5" aria-label="ClientSpace home">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <rect x="0" y="0" width="5.4" height="5.4" rx="1.2" fill="rgba(255,255,255,0.6)" />
                <rect x="6.6" y="0" width="5.4" height="5.4" rx="1.2" fill="rgba(255,255,255,0.25)" />
                <rect x="0" y="6.6" width="5.4" height="5.4" rx="1.2" fill="rgba(255,255,255,0.25)" />
                <rect x="6.6" y="6.6" width="5.4" height="5.4" rx="1.2" fill="#bd7a4e" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white/85">
              ClientSpace
            </span>
          </Link>

          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.05]"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
              <path d="M0 1h18M0 7h12M0 13h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
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
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease }}
              className="fixed right-0 top-0 bottom-0 z-50 flex w-[80vw] max-w-sm flex-col md:hidden"
              style={{
                background: "#111110",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="flex h-[60px] items-center justify-between px-5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-[14px] font-semibold text-white/70">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.05]"
                  aria-label="Close menu"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col px-5 pt-6 pb-4 gap-1" aria-label="Mobile navigation">
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
                      className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/80"
                    >
                      {link.name}
                      <span className="text-white/20 text-xs">→</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div
                className="mt-auto p-5 flex flex-col gap-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center rounded-full border border-white/10 text-[14px] font-medium text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center rounded-full bg-white text-[14px] font-semibold text-black transition-opacity hover:opacity-90"
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
