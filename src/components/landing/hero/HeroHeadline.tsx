'use client';

import { motion, useReducedMotion } from "motion/react";
import SplitText from "@/components/SplitText";

export function HeroHeadline() {
  const shouldReduceMotion = useReducedMotion();

  // "Your clients deserve"
  // "a better experience."
  
  return (
    <h1 className="relative z-10 text-center font-bold text-[#FAFAFA] tracking-[-0.04em] leading-[1.05]"
        style={{ fontSize: "clamp(52px, 7vw, 88px)" }}>
      
      {shouldReduceMotion ? (
        <>
          Your clients deserve<br />
          a <span className="inline-block animate-[gradient-shift_4s_ease_infinite] bg-[linear-gradient(135deg,#818CF8_0%,#C084FC_50%,#6366F1_100%)] bg-[length:200%_200%] bg-clip-text text-transparent">better experience.</span>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center">
            <span className="inline-block overflow-hidden pb-2">
              <SplitText
                text="Your clients deserve"
                className="inline-block"
                tag="span"
                delay={60}
                from={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                ease="cubic-bezier(0.25, 0.1, 0.25, 1)"
                threshold={0.2}
                rootMargin="-50px"
              />
            </span>
            <div className="flex items-center justify-center flex-wrap gap-[0.25em]">
              <span className="inline-block overflow-hidden">
                <SplitText
                  text="a"
                  className="inline-block"
                  tag="span"
                  delay={60}
                  from={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  ease="cubic-bezier(0.25, 0.1, 0.25, 1)"
                  threshold={0.2}
                  rootMargin="-50px"
                />
              </span>
              <motion.span 
                initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.24 }}
                className="inline-block animate-[gradient-shift_4s_ease_infinite] bg-[linear-gradient(135deg,#818CF8_0%,#C084FC_50%,#6366F1_100%)] bg-[length:200%_200%] bg-clip-text text-transparent"
              >
                better experience.
              </motion.span>
            </div>
          </div>
        </>
      )}
    </h1>
  );
}
