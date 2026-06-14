"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileSignature, MessageSquareHeart, CreditCard } from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      id: 1,
      title: "Onboard",
      description: "Send a branded link. Clients review the proposal, sign the contract, and pay the deposit in one seamless flow.",
      icon: <FileSignature className="w-6 h-6 text-[#818CF8]" />,
      gradient: "from-[#818CF8] to-[#6366F1]"
    },
    {
      id: 2,
      title: "Collaborate",
      description: "Share files, collect structured feedback, and get official sign-offs without losing anything in email threads.",
      icon: <MessageSquareHeart className="w-6 h-6 text-[#C084FC]" />,
      gradient: "from-[#C084FC] to-[#A855F7]"
    },
    {
      id: 3,
      title: "Get Paid",
      description: "Auto-generate beautiful invoices connected to project milestones. Clients pay via card or ACH instantly.",
      icon: <CreditCard className="w-6 h-6 text-[#34D399]" />,
      gradient: "from-[#34D399] to-[#10B981]"
    }
  ];

  return (
    <section className="w-full py-24 md:py-32 relative z-10 bg-[#0C0D14]" id="workflow">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16 md:mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6 font-body tracking-tight"
          >
            From proposal to paid in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] to-[#C084FC]">3 steps.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />

          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="relative z-10 group"
            >
              <div className="bg-[#11121B] rounded-2xl p-8 border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] group-hover:border-white/10 relative overflow-hidden h-full flex flex-col">
                
                {/* Top Gradient Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
                
                {/* Step Number Background */}
                <div className="absolute -top-6 -right-6 text-9xl font-bold text-white/[0.02] pointer-events-none font-display">
                  {step.id}
                </div>

                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-4 font-body">{step.title}</h3>
                <p className="text-white/60 leading-relaxed font-body text-sm flex-1">
                  {step.description}
                </p>

                {/* Glow on hover */}
                <div className={`absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 blur-[50px] transition-opacity duration-500 rounded-full`} />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
