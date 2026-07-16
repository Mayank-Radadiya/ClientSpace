"use client";

import { motion } from "motion/react";

const STUDIOS = [
  "Nova Studio",
  "Form & Function Co.",
  "Halcyon Creative",
  "Rye & Post",
  "Field Office",
  "CMYK Collective",
  "Arc Studio",
  "Bloom Agency",
  "Kova Partners",
  "Luminary Co.",
];

export function LogoMarquee() {
  return (
    <section className="cs-section overflow-hidden border-t border-[#1a1a1a] bg-[#0B0B0C]">
      <div className="cs-container">
        <p className="mb-8 text-center font-mono text-[10px] tracking-[0.15em] text-[#555] uppercase">
          Trusted by studios shipping client work every day
        </p>

        <div className="relative overflow-hidden">
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0B0B0C] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0B0B0C] to-transparent" />

          <div className="cs-marquee cs-marquee-pause flex gap-16">
            {[...STUDIOS, ...STUDIOS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="shrink-0 font-mono text-[13px] tracking-[0.08em] text-[#555] uppercase transition-colors duration-300 hover:text-[#9A9A9E]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
