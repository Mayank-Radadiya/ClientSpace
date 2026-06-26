"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-lp-bg relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden px-6 pt-32 pb-20 lg:flex-row lg:px-16">
      {/* Background texture (optional subtle noise or dot pattern could go here) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* Left Column: Copy & CTAs (55%) */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-start pt-10 text-left lg:w-[55%] lg:pt-0">
        {/* Pre-headline label */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-lp-accent mb-8 text-[11px] font-bold tracking-[0.2em] uppercase"
        >
          Client Portal Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-lp-text mb-8 font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-[5.5rem]"
        >
          Client work, <br />
          <span className="text-lp-text-secondary mt-2 block text-[1.05em] italic">
            done right.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lp-text-secondary font-body mb-12 max-w-[42rem] text-lg leading-relaxed sm:text-xl"
        >
          Replace scattered email chains and PDF invoices with a single,
          beautiful workspace your clients will actually enjoy using.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center"
        >
          <Link
            href="/signup"
            className="bg-lp-accent-secondary font-body flex w-full justify-center rounded-full px-8 py-4 text-[15px] font-medium text-white shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
          >
            Start for free
          </Link>
          <Link
            href="#demo"
            className="group text-lp-text-secondary hover:text-lp-text font-body flex items-center gap-2 px-4 py-4 text-[15px] font-medium transition-colors"
          >
            Watch demo
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-lp-text-secondary flex items-center gap-4 font-mono text-[13px]"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-lp-bg h-8 w-8 overflow-hidden rounded-full border-2 opacity-80 grayscale"
              >
                <img
                  src={`https://i.pravatar.cc/100?img=${i + 20}`}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <p>Trusted by 2,400+ independent studios</p>
        </motion.div>
      </div>

      {/* Right Column: Visual (45%) */}
      <motion.div
        initial={{ opacity: 0, x: 40, rotate: 0 }}
        animate={{ opacity: 1, x: 0, rotate: -2 }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 mt-20 w-full lg:absolute lg:top-[50%] lg:right-[-5%] lg:mt-0 lg:w-[50%] lg:-translate-y-1/2"
      >
        <div className="border-lp-border bg-lp-surface relative mx-auto flex aspect-[4/3] w-full max-w-[800px] origin-center transform flex-col overflow-hidden rounded-2xl border shadow-2xl lg:mx-0">
          {/* Mac window header */}
          <div className="border-lp-border bg-lp-surface/50 flex h-12 items-center gap-2 border-b px-4">
            <div className="flex gap-1.5">
              <div className="bg-lp-border h-3 w-3 rounded-full" />
              <div className="bg-lp-border h-3 w-3 rounded-full" />
              <div className="bg-lp-border h-3 w-3 rounded-full" />
            </div>
            <div className="text-lp-text-secondary ml-4 font-mono text-xs">
              clientspace.com/acme
            </div>
          </div>

          <div className="bg-lp-bg/30 flex flex-1">
            {/* Sidebar Mock */}
            <div className="border-lp-border bg-lp-surface hidden w-48 border-r p-4 sm:block">
              <div className="bg-lp-border/50 mb-8 h-4 w-24 rounded" />
              <div className="space-y-4">
                <div className="bg-lp-border/30 h-8 w-full rounded" />
                <div className="bg-lp-border/20 h-6 w-3/4 rounded" />
                <div className="bg-lp-border/20 h-6 w-5/6 rounded" />
              </div>
            </div>

            {/* Main Content Mock */}
            <div className="flex flex-1 flex-col gap-6 p-6 lg:p-10">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h3 className="text-lp-text mb-1 font-serif text-2xl">
                    Acme Brand Refresh
                  </h3>
                  <p className="font-body text-lp-text-secondary text-sm">
                    Due Oct 24, 2026
                  </p>
                </div>
                <div className="text-lp-accent font-serif text-3xl italic">
                  68%
                </div>
              </div>

              {/* Progress */}
              <div className="bg-lp-border h-1 w-full overflow-hidden rounded-full">
                <div className="bg-lp-accent h-full w-[68%]" />
              </div>

              {/* Cards */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border-lp-border bg-lp-surface rounded-xl border p-5 shadow-sm">
                  <div className="text-lp-text-secondary mb-2 font-mono text-xs">
                    INV-1042
                  </div>
                  <div className="font-body text-lp-text mb-4 text-xl">
                    $4,200.00
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lp-danger text-[11px] font-bold tracking-wider uppercase">
                      Overdue
                    </span>
                    <button className="bg-lp-text text-lp-bg rounded-md px-3 py-1.5 text-xs font-medium">
                      Pay Invoice
                    </button>
                  </div>
                </div>

                <div className="border-lp-border bg-lp-surface flex flex-col justify-between rounded-xl border p-5 shadow-sm">
                  <div>
                    <div className="text-lp-text-secondary mb-2 font-mono text-xs">
                      LATEST FILE
                    </div>
                    <div className="font-body text-lp-text text-sm">
                      logo_concepts_v3.pdf
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="bg-lp-border h-6 w-6 rounded-full" />
                    <span className="text-lp-text-secondary text-xs">
                      Needs review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
