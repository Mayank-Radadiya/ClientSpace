'use client';

import { motion } from "motion/react";

export function HeroSubheadline() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
      className="relative z-10 mx-auto max-w-[560px] text-center text-[clamp(17px,2vw,20px)] font-normal leading-[1.65] text-[#A3A3A3]"
    >
      Replace scattered email chains and PDF invoices with a single, beautiful workspace. Projects, files, and invoices — all in one place your clients will actually use.
    </motion.p>
  );
}
