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
];

export function LogoCloud() {
  return (
    <section className="w-full py-12 md:py-20 border-b border-white/5 relative z-10 bg-[#0C0D14]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        
        <div className="shrink-0 flex items-center gap-2 text-white/50 font-body text-sm font-medium">
          <span>Trusted by teams at</span>
          <span aria-hidden="true">&rarr;</span>
        </div>

        <div className="relative flex-1 overflow-hidden w-full">
          {/* Fade Masks */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#0C0D14] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#0C0D14] to-transparent" />

          {/* Marquee Content */}
          <div className="flex w-max min-w-full animate-marquee gap-16 py-2 [--duration:30s] hover:[animation-play-state:paused]">
            {[...COMPANIES, ...COMPANIES, ...COMPANIES].map((company, idx) => (
              <div 
                key={idx} 
                className="text-xl md:text-2xl font-bold font-display text-white/20 tracking-tight uppercase"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
