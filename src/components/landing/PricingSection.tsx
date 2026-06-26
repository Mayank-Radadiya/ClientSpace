"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="w-full py-24 md:py-32 relative z-10 bg-lp-bg border-t border-lp-border" id="pricing">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
        
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-serif text-lp-text mb-6"
          >
            Honest pricing. <span className="italic text-lp-text-secondary">No hidden fees.</span>
          </motion.h2>
          <motion.p
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.5, delay: 0.1 }}
             className="text-lp-text-secondary text-lg max-w-xl mx-auto font-body mb-10"
          >
            A single straightforward plan designed for independent professionals and boutique studios.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <span className={`text-sm font-body ${!isAnnual ? 'text-lp-text font-medium' : 'text-lp-text-secondary'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-8 rounded-full bg-lp-surface border border-lp-border relative flex items-center px-1 transition-colors hover:border-lp-text/20"
            >
              <div 
                className={`w-6 h-6 rounded-full bg-lp-text transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} 
              />
            </button>
            <span className={`text-sm font-body flex items-center gap-2 ${isAnnual ? 'text-lp-text font-medium' : 'text-lp-text-secondary'}`}>
              Annually <span className="text-[10px] bg-lp-accent/10 text-lp-accent px-2 py-0.5 rounded-full border border-lp-accent/20 font-bold uppercase tracking-wider">Save 20%</span>
            </span>
          </motion.div>
        </div>

        <div className="max-w-md mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative bg-lp-surface rounded-2xl border border-lp-border p-8 md:p-12 shadow-xl flex flex-col"
          >
            <h3 className="text-2xl font-serif text-lp-text mb-2">Professional</h3>
            <p className="text-lp-text-secondary text-sm mb-8 font-body">Everything you need to run your client business.</p>
            
            <div className="mb-8 flex items-baseline gap-1 border-b border-lp-border pb-8">
              <span className="text-6xl font-bold text-lp-text tracking-tight">${isAnnual ? '29' : '39'}</span>
              <span className="text-lp-text-secondary font-body">/month</span>
            </div>

            <div className="flex flex-col gap-4 flex-1 mb-10">
              {[
                "Unlimited active projects",
                "Custom domain & white-labeling",
                "Smart approvals & sign-offs",
                "Stripe integration for zero-fee invoicing",
                "Automated email follow-ups",
                "Up to 500GB file storage",
                "Priority support channel"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-lp-accent/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-lp-accent" />
                  </div>
                  <span className="text-lp-text text-sm font-body font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-4 rounded-xl bg-lp-text text-lp-bg font-bold font-body transition-transform active:scale-[0.98] hover:bg-lp-text/90">
              Start Free Trial
            </button>
            <p className="text-center text-xs text-lp-text-secondary mt-4 font-body">14-day free trial. No credit card required.</p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
