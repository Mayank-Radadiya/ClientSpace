"use client";

import React from "react";
import { motion } from "framer-motion";

export function ProblemSection() {
  const comparisons = [
    {
      old: "Sending 5 emails to get one approval.",
      new: "One-click approvals inside the portal.",
    },
    {
      old: "Clients losing the Google Drive link.",
      new: "All deliverables in one branded space.",
    },
    {
      old: "Chasing unpaid PDF invoices.",
      new: "Invoices attached to the work itself.",
    },
    {
      old: "Answering 'what's the status?' again.",
      new: "Real-time visual progress bars.",
    },
  ];

  return (
    <section className="w-full py-24 md:py-32 relative z-10 bg-lp-surface border-b border-lp-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Editorial Quote */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="text-8xl text-lp-accent/30 font-serif leading-none absolute -top-8 -left-6 lg:-top-10 lg:-left-10 select-none">
              "
            </div>
            <h2 className="text-3xl md:text-[2.5rem] font-serif text-lp-text leading-[1.2] tracking-tight relative z-10">
              We were spending more time managing clients than actually designing.
            </h2>
            <p className="mt-8 text-[15px] text-lp-text-secondary font-body font-medium tracking-wide uppercase">
              The universal freelancer problem
            </p>
          </motion.div>

          {/* Right Column: The Comparison */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-8"
          >
            {comparisons.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 relative">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-lp-danger/40" />
                  <p className="text-lp-text-secondary line-through font-body text-[15px]">
                    {item.old}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-lp-accent-secondary" />
                  <p className="text-lp-text font-medium font-body text-[17px]">
                    {item.new}
                  </p>
                </div>
                {idx !== comparisons.length - 1 && (
                  <div className="w-full h-px bg-lp-border mt-6" />
                )}
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
