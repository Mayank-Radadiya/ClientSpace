"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section
      className="relative w-full overflow-hidden bg-lp-text py-28 md:py-40"
      id="demo"
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient violet glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6C63FF]/15 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-16">
        {/* Editorial header — left aligned like Meridian */}
        <div className="mb-12 border-b border-lp-bg/10 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-4 font-mono text-[11px] font-medium tracking-[0.2em] text-lp-bg/30"
          >
            § END OF DISPATCH
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-lp-bg md:text-6xl lg:text-7xl"
          >
            Ready to look like the{" "}
            <span className="text-lp-bg/35">studio you are.</span>
          </motion.h2>
        </div>

        {/* Bottom row — description + CTAs side by side (Meridian layout) */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="font-body max-w-md text-lg leading-relaxed text-lp-bg/50"
          >
            Join 2,400+ independent studios who have upgraded their workflow and
            client experience. Start free — no credit card needed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/signup"
              className="inline-flex items-center rounded-[3px] bg-lp-bg px-8 py-4 text-[15px] font-semibold text-lp-text shadow-lg shadow-black/20 transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Start your free trial
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center rounded-[3px] border border-lp-bg/20 px-8 py-4 text-[15px] font-medium text-lp-bg transition-all hover:bg-lp-bg/10"
            >
              View features
            </Link>
          </motion.div>
        </div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="font-body mt-10 font-mono text-xs text-lp-bg/25"
        >
          14-day free trial · No credit card required · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
