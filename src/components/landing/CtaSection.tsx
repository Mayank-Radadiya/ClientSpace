"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="w-full py-24 md:py-32 relative z-10 bg-lp-accent" id="demo">
      <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-serif text-lp-bg mb-6 leading-[1.1]"
        >
          Elevate your client experience today.
        </motion.h2>
        
        <motion.p
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.5, delay: 0.1 }}
           className="text-lp-bg/80 text-lg md:text-xl max-w-2xl mx-auto font-body mb-12"
        >
          Join independent studios and freelancers who have upgraded their workflow and client presentation.
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.5, delay: 0.2 }}
           className="flex flex-col items-center"
        >
          <Link
            href="/signup"
            className="inline-block px-10 py-5 bg-lp-bg text-lp-text font-bold text-sm tracking-wider uppercase font-body hover:bg-lp-surface transition-colors duration-200"
          >
            Start Your Free Trial
          </Link>
          <p className="text-lp-bg/60 text-sm mt-6 font-body">14-day free trial. No credit card required.</p>
        </motion.div>

      </div>
    </section>
  );
}
