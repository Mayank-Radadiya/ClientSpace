"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-between pt-32 pb-20 px-6 lg:px-16 overflow-hidden bg-lp-bg">
      {/* Background texture (optional subtle noise or dot pattern could go here) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Left Column: Copy & CTAs (55%) */}
      <div className="relative z-10 flex flex-col items-start text-left w-full lg:w-[55%] max-w-3xl pt-10 lg:pt-0">
        
        {/* Pre-headline label */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-lp-accent text-[11px] font-bold tracking-[0.2em] uppercase mb-8"
        >
          Client Portal Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl lg:text-[5.5rem] font-serif text-lp-text leading-[1.05] tracking-tight mb-8"
        >
          Client work, <br />
          <span className="italic text-lp-text-secondary text-[1.05em] block mt-2">done right.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-lp-text-secondary max-w-[42rem] mb-12 leading-relaxed font-body"
        >
          Replace scattered email chains and PDF invoices with a single, beautiful workspace your clients will actually enjoy using.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-16 w-full"
        >
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-full text-white font-medium bg-lp-accent-secondary hover:opacity-90 transition-opacity font-body text-[15px] shadow-sm flex justify-center"
          >
            Start for free
          </Link>
          <Link
            href="#demo"
            className="group px-4 py-4 text-lp-text-secondary hover:text-lp-text transition-colors font-body text-[15px] font-medium flex items-center gap-2"
          >
            Watch demo
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex items-center gap-4 text-[13px] text-lp-text-secondary font-mono"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-lp-bg overflow-hidden grayscale opacity-80"
              >
                <img
                  src={`https://i.pravatar.cc/100?img=${i + 20}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
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
        className="w-full lg:w-[50%] mt-20 lg:mt-0 relative z-20 lg:absolute lg:right-[-5%] lg:top-[50%] lg:-translate-y-1/2"
      >
        <div className="relative w-full max-w-[800px] aspect-[4/3] rounded-2xl border border-lp-border bg-lp-surface shadow-2xl overflow-hidden flex flex-col mx-auto lg:mx-0 transform origin-center">
          
          {/* Mac window header */}
          <div className="h-12 border-b border-lp-border flex items-center px-4 gap-2 bg-lp-surface/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-lp-border" />
              <div className="w-3 h-3 rounded-full bg-lp-border" />
              <div className="w-3 h-3 rounded-full bg-lp-border" />
            </div>
            <div className="ml-4 text-xs font-mono text-lp-text-secondary">clientspace.com/acme</div>
          </div>
          
          <div className="flex-1 flex bg-lp-bg/30">
            {/* Sidebar Mock */}
            <div className="hidden sm:block w-48 border-r border-lp-border p-4 bg-lp-surface">
              <div className="w-24 h-4 bg-lp-border/50 rounded mb-8" />
              <div className="space-y-4">
                <div className="w-full h-8 bg-lp-border/30 rounded" />
                <div className="w-3/4 h-6 bg-lp-border/20 rounded" />
                <div className="w-5/6 h-6 bg-lp-border/20 rounded" />
              </div>
            </div>

            {/* Main Content Mock */}
            <div className="flex-1 p-6 lg:p-10 flex flex-col gap-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-2xl font-serif text-lp-text mb-1">Acme Brand Refresh</h3>
                  <p className="text-sm font-body text-lp-text-secondary">Due Oct 24, 2026</p>
                </div>
                <div className="text-3xl font-serif text-lp-accent italic">68%</div>
              </div>

              {/* Progress */}
              <div className="w-full h-1 bg-lp-border rounded-full overflow-hidden">
                <div className="w-[68%] h-full bg-lp-accent" />
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="p-5 rounded-xl border border-lp-border bg-lp-surface shadow-sm">
                  <div className="text-xs font-mono text-lp-text-secondary mb-2">INV-1042</div>
                  <div className="text-xl font-body text-lp-text mb-4">$4,200.00</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-lp-danger">Overdue</span>
                    <button className="px-3 py-1.5 rounded-md bg-lp-text text-lp-bg text-xs font-medium">Pay Invoice</button>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-lp-border bg-lp-surface shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-lp-text-secondary mb-2">LATEST FILE</div>
                    <div className="text-sm font-body text-lp-text">logo_concepts_v3.pdf</div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-lp-border" />
                    <span className="text-xs text-lp-text-secondary">Needs review</span>
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
