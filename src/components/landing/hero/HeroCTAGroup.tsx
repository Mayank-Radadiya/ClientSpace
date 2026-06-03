'use client';

import { motion } from "framer-motion";

export function HeroCTAGroup() {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
        className="flex w-full flex-col items-center justify-center gap-3 md:w-auto md:flex-row"
      >
        {/* Primary CTA: Custom Shimmer Button */}
        <motion.button
          whileHover="hover"
          className="group relative flex h-[44px] w-full items-center justify-center overflow-hidden rounded-lg bg-[#6366F1] px-6 md:w-auto"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-[#818CF8]/40 to-transparent" />
          
          <span className="relative text-[15px] font-semibold text-white">Start for free</span>
          <motion.span
            variants={{
              hover: { x: 4 }
            }}
            transition={{ duration: 0.2 }}
            className="relative ml-2 text-white"
          >
            →
          </motion.span>
        </motion.button>

        {/* Secondary CTA */}
        <motion.button
          whileHover="hover"
          initial="initial"
          variants={{
            initial: { borderColor: "#1F1F1F", color: "#A3A3A3" },
            hover: { borderColor: "#2A2A2A", color: "#FAFAFA" }
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex h-[44px] w-full items-center justify-center rounded-lg border border-[#1F1F1F] bg-transparent px-5 text-[15px] font-medium text-[#A3A3A3] md:w-auto"
        >
          See a live demo
          <span className="ml-2 text-[14px] text-muted-foreground opacity-70">▶</span>
        </motion.button>
      </motion.div>

      {/* Keyboard Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }} // 0.5 + 0.6 delay after buttons
        className="mt-4 text-[12px] text-[#525252]"
        aria-hidden="true"
      >
        Press <kbd className="font-sans font-medium">⌘K</kbd> to explore features
      </motion.p>
    </div>
  );
}
