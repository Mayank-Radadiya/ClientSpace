'use client';

import { motion } from "motion/react";
import ShinyText from "@/components/ShinyText";

export function HeroEyebrow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
      className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/5 px-[14px] py-[6px] max-[380px]:hidden"
    >
      <div className="h-1.5 w-1.5 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-indigo-500" />
      <span className="text-[13px] font-medium tracking-[0.01em] text-indigo-400">
        <ShinyText text="The client portal built for agencies" disabled={false} speed={4} className="text-indigo-400" />
      </span>
    </motion.div>
  );
}
