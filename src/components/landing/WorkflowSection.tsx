"use client";

import React from "react";
import { motion } from "motion/react";

const steps = [
  {
    step: "01",
    title: "Onboard",
    description:
      "Send a branded link. Clients review the proposal, sign the contract, and pay the deposit — all in one seamless flow.",
  },
  {
    step: "02",
    title: "Collaborate",
    description:
      "Share files, collect structured frame-by-frame feedback, and get official sign-offs without losing anything in email.",
  },
  {
    step: "03",
    title: "Get Paid",
    description:
      "Auto-generate professional invoices connected to project milestones. Clients pay via card or ACH instantly.",
  },
];

export function WorkflowSection() {
  return (
    <section
      className="relative w-full bg-lp-text py-24 md:py-32"
      id="workflow"
    >
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 flex items-start justify-between border-b border-lp-bg/10 pb-6"
        >
          <div>
            <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.15em] text-[#6C63FF]">
              § WORKFLOW / 02
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-lp-bg md:text-5xl">
              From proposal to paid.
              <br />
              <span className="text-lp-bg/40">In three steps.</span>
            </h2>
          </div>
          <div className="hidden text-right font-mono text-[11px] leading-relaxed text-lp-bg/30 md:block">
            <div>Process v2.4</div>
            <div>Optimized for studios</div>
          </div>
        </motion.div>

        {/* Steps — horizontal rule-separated list */}
        <div className="grid grid-cols-1 gap-px bg-lp-bg/10 md:grid-cols-3">
          {steps.map((step, idx) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative bg-lp-text p-8 transition-colors hover:bg-lp-bg/5 md:p-10"
            >
              {/* Large background number */}
              <div className="absolute -top-4 -right-2 font-display text-[8rem] font-bold leading-none text-lp-bg/[0.02] select-none">
                {step.step}
              </div>

              <div className="mb-5 font-mono text-[11px] font-bold tracking-[0.15em] text-[#6C63FF]">
                {step.step}
              </div>
              <h3 className="font-display mb-4 text-2xl font-bold text-lp-bg">
                {step.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-lp-bg/50">
                {step.description}
              </p>

              {/* Bottom connector */}
              {idx < steps.length - 1 && (
                <div className="absolute top-1/2 -right-px hidden h-px w-px bg-lp-bg/10 md:block" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-lp-bg/10 pt-6 text-center font-mono text-[11px] text-lp-bg/30"
        >
          Setup takes less than 10 minutes · No technical knowledge required
        </motion.div>
      </div>
    </section>
  );
}
