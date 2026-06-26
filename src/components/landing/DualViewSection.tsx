"use client";

import React from "react";
import { motion } from "motion/react";

export function DualViewSection() {
  return (
    <section className="w-full py-24 md:py-32 relative z-10 bg-lp-surface border-y border-lp-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 text-center mb-16 md:mb-24">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-serif text-lp-text mb-6"
        >
          Two views. <span className="italic text-lp-text-secondary">One source of truth.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lp-text-secondary text-lg max-w-2xl mx-auto font-body"
        >
          Keep your messy drafts, internal feedback, and financial details on the agency side. Give your clients a clean, branded portal on their side.
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-lp-border border border-lp-border rounded-2xl overflow-hidden">
          
          {/* Left: Agency Side */}
          <div className="bg-lp-bg p-8 lg:p-12 flex flex-col items-center">
            <h3 className="text-xl font-serif text-lp-text mb-2">Agency View</h3>
            <p className="text-sm font-body text-lp-text-secondary mb-10 text-center">Your private workspace.</p>
            
            <div className="w-full max-w-sm border border-lp-border bg-lp-surface rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-lp-border pb-4">
                <div className="w-6 h-6 rounded bg-lp-text flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-lp-bg" />
                </div>
                <span className="text-sm font-medium font-body text-lp-text">Studio Board</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 border border-lp-border rounded bg-lp-bg/50">
                  <span className="text-xs font-mono text-lp-accent-secondary mb-1 block">INTERNAL</span>
                  <span className="text-sm font-body text-lp-text">Draft Proposal v2</span>
                </div>
                <div className="p-3 border border-lp-border rounded bg-lp-bg/50">
                  <span className="text-xs font-mono text-lp-accent-secondary mb-1 block">INTERNAL</span>
                  <span className="text-sm font-body text-lp-text">Cost Estimate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Client Side */}
          <div className="bg-lp-surface p-8 lg:p-12 flex flex-col items-center">
            <h3 className="text-xl font-serif text-lp-text mb-2">Client View</h3>
            <p className="text-sm font-body text-lp-text-secondary mb-10 text-center">Their branded portal.</p>
            
            <div className="w-full max-w-sm border border-lp-border bg-lp-bg rounded-xl shadow-sm p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-lp-accent/10 blur-2xl rounded-full" />
              <div className="flex items-center gap-3 border-b border-lp-border pb-4 relative z-10">
                <div className="w-6 h-6 rounded bg-lp-accent flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">A</span>
                </div>
                <span className="text-sm font-medium font-body text-lp-text">Acme Corp Portal</span>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="p-3 border border-lp-border rounded bg-lp-surface shadow-sm">
                  <span className="text-xs font-mono text-lp-text-secondary mb-1 block">FOR REVIEW</span>
                  <span className="text-sm font-body text-lp-text">Final Proposal</span>
                </div>
                {/* Notice the cost estimate is hidden from the client */}
                <div className="p-3 border border-lp-border border-dashed rounded flex justify-center items-center h-16">
                  <span className="text-xs font-body text-lp-text-secondary">Awaiting next deliverable</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
