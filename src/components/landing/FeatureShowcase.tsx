"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function FeatureShowcase() {
  const features = [
    {
      id: "agency-view",
      label: "Project Management",
      title: "Control the chaos behind the scenes.",
      description: "Manage timelines, assign tasks, and track internal progress without your clients seeing the messy middle. Keep your team aligned and your deadlines intact.",
      benefits: [
        "Internal kanban boards",
        "Private team discussions",
        "Time tracking and capacity planning"
      ],
      imagePosition: "right",
    },
    {
      id: "client-view",
      label: "Client Portals",
      title: "A premium experience they will love.",
      description: "Give every client a branded, white-labeled portal where they can view deliverables, leave feedback, and track project status in real-time.",
      benefits: [
        "Custom branding per client",
        "One-click file approvals",
        "Centralized feedback threads"
      ],
      imagePosition: "left",
    },
    {
      id: "invoicing",
      label: "Invoicing",
      title: "Get paid faster, with zero friction.",
      description: "Attach invoices directly to milestones. When clients approve a deliverable, they are immediately prompted to pay—securely and seamlessly via Stripe.",
      benefits: [
        "Automated payment reminders",
        "Stripe & Bank transfer integration",
        "Subscription & retainer billing"
      ],
      imagePosition: "right",
    }
  ];

  return (
    <section className="w-full py-24 md:py-32 relative z-10 bg-lp-bg" id="features">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 flex flex-col gap-32">
        
        {features.map((feature, idx) => (
          <div 
            key={feature.id} 
            className={`flex flex-col ${feature.imagePosition === "left" ? "lg:flex-row-reverse" : "lg:flex-row"} gap-12 lg:gap-24 items-center`}
          >
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:w-1/2 flex flex-col"
            >
              <span className="text-lp-accent text-[11px] font-bold tracking-[0.2em] uppercase mb-6">
                {feature.label}
              </span>
              <h3 className="text-4xl md:text-5xl font-serif text-lp-text leading-[1.1] mb-6">
                {feature.title}
              </h3>
              <p className="text-lg text-lp-text-secondary leading-relaxed font-body mb-8">
                {feature.description}
              </p>
              <ul className="flex flex-col gap-4">
                {feature.benefits.map((benefit, bIdx) => (
                  <li key={bIdx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-lp-accent-secondary" />
                    <span className="text-[15px] font-body text-lp-text font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Visual/Image Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:w-1/2 aspect-[4/3] rounded-2xl bg-lp-surface border border-lp-border shadow-xl overflow-hidden relative flex items-center justify-center p-8"
            >
              {/* Abstract structural representation instead of random images */}
              <div className="w-full h-full border border-lp-border/50 rounded-xl bg-lp-bg/50 shadow-inner flex flex-col overflow-hidden">
                <div className="h-10 border-b border-lp-border/50 flex items-center px-4 bg-lp-surface">
                   <div className="w-20 h-3 rounded bg-lp-border/50" />
                </div>
                <div className="flex-1 p-6 flex gap-4">
                   <div className="w-1/3 h-full rounded-lg bg-lp-surface border border-lp-border/50 shadow-sm flex flex-col p-4 gap-3">
                     <div className="w-1/2 h-3 rounded bg-lp-border/50" />
                     <div className="w-full h-16 rounded bg-lp-border/20 mt-2" />
                     <div className="w-full h-16 rounded bg-lp-border/20" />
                   </div>
                   <div className="w-2/3 h-full rounded-lg bg-lp-surface border border-lp-border/50 shadow-sm flex flex-col p-4 gap-3">
                     <div className="w-1/3 h-3 rounded bg-lp-border/50" />
                     <div className="w-full h-24 rounded bg-lp-accent/10 border border-lp-accent/20 mt-2" />
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        ))}

      </div>
    </section>
  );
}
