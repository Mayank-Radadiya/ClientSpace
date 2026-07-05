"use client";

import React from "react";
import { motion } from "motion/react";
import { Palette, CheckSquare, Zap, LayoutDashboard, CheckCircle2 } from "lucide-react";

export function FeatureDeepDive() {
  return (
    <section className="w-full py-24 md:py-32 relative z-10 bg-lp-text">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 flex items-start justify-between border-b border-lp-bg/10 pb-6"
        >
          <div>
            <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.15em] text-[#6C63FF]">
              § DEEP DIVE / 03
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-lp-bg md:text-5xl">
              Everything you need to look
              <br />
              <span className="text-lp-bg/40">like a $1M agency.</span>
            </h2>
          </div>
          <div className="hidden text-right font-mono text-[11px] leading-relaxed text-lp-bg/30 md:block">
            <div>4 capabilities</div>
            <div>Fully integrated</div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Custom Branding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0 }}
            className="bg-[#11121B] rounded-3xl p-8 border border-white/5 overflow-hidden relative group h-[400px] flex flex-col"
          >
            <div className="relative z-10 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:bg-white/10 transition-colors">
                <Palette className="w-5 h-5 text-white/70" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 font-body">Custom Branding</h3>
              <p className="text-white/50 text-sm font-body">Your logo, your colors, your domain. Make the portal feel like an extension of your own website.</p>
            </div>

            {/* Visual Mockup */}
            <div className="mt-auto relative w-full h-40 bg-white/[0.02] border border-white/10 rounded-t-xl overflow-hidden translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-t from-[#11121B] via-transparent to-transparent z-10" />
              <div className="p-4 flex gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
                  <span className="text-white/30 text-xs text-center leading-tight">Drop<br/>Logo</span>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex gap-2">
                     <div className="w-6 h-6 rounded-full bg-[#818CF8] shadow-[0_0_10px_rgba(129,140,248,0.5)] ring-2 ring-white/20" />
                     <div className="w-6 h-6 rounded-full bg-[#C084FC]" />
                     <div className="w-6 h-6 rounded-full bg-[#34D399]" />
                     <div className="w-6 h-6 rounded-full bg-[#F43F5E]" />
                  </div>
                  <div className="h-6 w-full rounded bg-white/5 border border-white/10 flex items-center px-3">
                    <span className="text-xs text-white/50 font-data">#818CF8</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Smart Approvals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#11121B] rounded-3xl p-8 border border-white/5 overflow-hidden relative group h-[400px] flex flex-col"
          >
            <div className="relative z-10 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:bg-white/10 transition-colors">
                <CheckSquare className="w-5 h-5 text-white/70" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 font-body">Smart Approvals</h3>
              <p className="text-white/50 text-sm font-body">Get timestamped sign-offs on files and milestones so there's never a debate about scope.</p>
            </div>

            {/* Visual Mockup */}
            <div className="mt-auto relative w-full h-40 bg-white/[0.02] border border-white/10 rounded-t-xl overflow-hidden translate-y-4 group-hover:translate-y-0 transition-transform duration-500 p-4">
              <div className="absolute inset-0 bg-gradient-to-t from-[#11121B] via-transparent to-transparent z-10" />
              <div className="bg-[#161722] rounded-lg border border-white/5 p-3 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                     <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white font-body">Approved by Client</div>
                    <div className="text-[10px] text-white/40 font-data mt-0.5">Oct 24, 2026 • 2:14 PM EDT</div>
                  </div>
                </div>
                <div className="bg-white/5 rounded p-2 text-xs text-white/60 font-body italic border-l-2 border-emerald-500">
                  "Looks perfect! Let's move to the next phase."
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Automated Follow-ups */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#11121B] rounded-3xl p-8 border border-white/5 overflow-hidden relative group h-[400px] flex flex-col"
          >
            <div className="relative z-10 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:bg-white/10 transition-colors">
                <Zap className="w-5 h-5 text-white/70" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 font-body">Automated Follow-ups</h3>
              <p className="text-white/50 text-sm font-body">Stop chasing clients. We automatically remind them about pending approvals and unpaid invoices.</p>
            </div>

            {/* Visual Mockup */}
            <div className="mt-auto relative w-full h-40 bg-white/[0.02] border border-white/10 rounded-t-xl overflow-hidden translate-y-4 group-hover:translate-y-0 transition-transform duration-500 p-4">
              <div className="absolute inset-0 bg-gradient-to-t from-[#11121B] via-transparent to-transparent z-10" />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="text-xs text-white/80 font-body">Send reminder after 3 days</div>
                  <div className="w-8 h-4 rounded-full bg-[#818CF8] relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="text-xs text-white/80 font-body">Escalate if unpaid for 7 days</div>
                  <div className="w-8 h-4 rounded-full bg-[#818CF8] relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Client Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#11121B] rounded-3xl p-8 border border-white/5 overflow-hidden relative group h-[400px] flex flex-col"
          >
            <div className="relative z-10 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:bg-white/10 transition-colors">
                <LayoutDashboard className="w-5 h-5 text-white/70" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 font-body">Client Dashboard</h3>
              <p className="text-white/50 text-sm font-body">A single, clean URL where clients can see everything going on with their project at a glance.</p>
            </div>

            {/* Visual Mockup */}
            <div className="mt-auto relative w-full h-40 bg-white/[0.02] border border-white/10 rounded-t-xl overflow-hidden translate-y-4 group-hover:translate-y-0 transition-transform duration-500 p-4">
               <div className="absolute inset-0 bg-gradient-to-t from-[#11121B] via-transparent to-transparent z-10" />
               <div className="bg-[#161722] rounded-lg border border-white/5 h-full p-3 shadow-lg flex flex-col gap-2">
                 <div className="flex justify-between items-center mb-1">
                   <div className="h-2 w-16 bg-white/20 rounded" />
                   <div className="h-4 w-4 rounded-full bg-[#818CF8]" />
                 </div>
                 <div className="grid grid-cols-2 gap-2 flex-1">
                   <div className="bg-white/5 rounded border border-white/5 p-2 flex flex-col justify-end">
                     <div className="h-1.5 w-8 bg-white/20 rounded mb-1" />
                     <div className="h-3 w-12 bg-white/40 rounded" />
                   </div>
                   <div className="bg-white/5 rounded border border-white/5 p-2 flex flex-col justify-end">
                     <div className="h-1.5 w-10 bg-white/20 rounded mb-1" />
                     <div className="h-3 w-10 bg-[#34D399]/60 rounded" />
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
