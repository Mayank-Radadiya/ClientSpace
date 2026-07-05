"use client";

import React from "react";
import { motion } from "motion/react";

const COMPANIES = [
  "Acme Corp",
  "Globex",
  "Soylent Corp",
  "Initech",
  "Umbrella",
  "Stark Ind",
  "Hooli",
  "Dunder Mifflin",
];

export function LogoCloud() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full border-b border-lp-text/10 bg-lp-text py-10"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 md:flex-row md:gap-16 lg:px-12">
        <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] font-medium tracking-wider text-lp-bg/30">
          <span>Trusted by teams at</span>
        </div>

        <div className="relative w-full flex-1 overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-gradient-to-r from-lp-text to-transparent" />
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-gradient-to-l from-lp-text to-transparent" />

          <div className="animate-marquee flex w-max min-w-full gap-16 py-2 [--duration:35s] hover:[animation-play-state:paused]">
            {[...COMPANIES, ...COMPANIES, ...COMPANIES].map((company, idx) => (
              <span
                key={idx}
                className="font-display whitespace-nowrap text-base font-bold tracking-tight text-lp-bg/20 transition-colors hover:text-lp-bg/40"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
