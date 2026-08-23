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
    <section className="cs-section overflow-hidden">
      <div className="cs-container">
        <p className="mb-8 text-center font-data text-[10px] tracking-[0.15em] text-cs-faint uppercase">
          Trusted by studios shipping client work every day
        </p>

        <div className="relative overflow-hidden">
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-cs-bg to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-cs-bg to-transparent" />

          <div className="cs-marquee cs-marquee-pause flex gap-16">
            {[...STUDIOS, ...STUDIOS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="shrink-0 font-data text-[13px] tracking-[0.08em] text-cs-faint uppercase transition-colors duration-300 hover:text-cs-ink-muted"
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
