"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

const NAV_LINKS = [
  { name: "HOME", href: "/" },
  { name: "PRODUCT", href: "#product" },
  { name: "PRICING", href: "#pricing" },
  { name: "DOCS", href: "#docs" },
  { name: "BLOG", href: "#blog" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <header className="fixed inset-x-0 top-0 z-50 hidden border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm md:block">
        <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span className="h-2 w-2 rounded-none bg-[#fafafa]" />
            <span className="font-sans text-[14px] tracking-tight text-[#fafafa]">
              ClientSpace
            </span>
          </Link>

          <nav className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="nav-link text-[10px] tracking-[0.1em] text-[#a0a0a0] uppercase transition-all duration-200 hover:text-[#fafafa]"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <Link
            href="/signup"
            className="rounded-sm border border-[#333] px-4 py-2 text-[10px] tracking-widest text-[#a0a0a0] uppercase transition-all duration-200 hover:border-[#555] hover:text-[#fafafa]"
          >
            Get Template
          </Link>
        </div>
      </header>

      {/* Mobile */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-none bg-[#fafafa]" />
            <span className="font-sans text-[14px] text-[#fafafa]">
              ClientSpace
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="rounded-sm border border-[#333] px-3 py-1.5 text-[10px] tracking-widest text-[#a0a0a0] uppercase"
            >
              Get Template
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-[#a0a0a0] transition-colors hover:text-[#fafafa]"
              aria-label="Toggle menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute top-14 right-0 bottom-0 w-4/5 max-w-sm border-l border-[#222] bg-[#111] px-8 pt-12"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="flex flex-col gap-6">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-[12px] tracking-[0.1em] text-[#a0a0a0] uppercase transition-colors hover:text-[#fafafa]"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
