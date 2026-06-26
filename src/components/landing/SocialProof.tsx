"use client";

import React from "react";
import { motion } from "motion/react";

const TESTIMONIALS = [
  {
    content: "ClientSpace completely changed how my agency looks to our clients. We went from looking like a scattered mess of emails to a premium studio.",
    author: "Sarah Jenkins",
    role: "Founder, Studio XYZ",
    featured: true,
  },
  {
    content: "My clients literally compliment the portal. I've been able to raise my rates by 30% just because the perceived value of my service is so much higher now.",
    author: "Elena Rodriguez",
    role: "Marketing Consultant",
    featured: false,
  },
  {
    content: "Integrated invoicing that ties directly to project milestones is a game changer. I get paid faster and don't have to awkwardly follow up.",
    author: "David Kim",
    role: "Web Developer",
    featured: false,
  }
];

export function SocialProof() {
  const featured = TESTIMONIALS.find(t => t.featured);
  const others = TESTIMONIALS.filter(t => !t.featured);

  return (
    <section className="w-full py-24 md:py-32 relative z-10 bg-lp-bg" id="testimonials">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 flex flex-col items-center">
        
        {/* Large Featured Pull Quote */}
        {featured && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl text-center mb-24"
          >
            <span className="text-lp-accent text-6xl font-serif leading-none opacity-50 block mb-6">"</span>
            <h2 className="text-3xl md:text-5xl font-serif text-lp-text leading-[1.2] mb-10">
              {featured.content}
            </h2>
            <div className="flex flex-col items-center gap-1">
              <span className="text-lp-text font-bold uppercase tracking-widest text-xs">{featured.author}</span>
              <span className="text-lp-text-secondary text-sm italic font-serif">{featured.role}</span>
            </div>
          </motion.div>
        )}

        {/* Secondary Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 w-full max-w-5xl border-t border-lp-border pt-16">
          {others.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              <p className="text-lp-text-secondary text-lg leading-relaxed font-body mb-6">
                "{testimonial.content}"
              </p>
              <div className="flex flex-col gap-0.5 mt-auto">
                <span className="text-lp-text font-bold uppercase tracking-wider text-[11px]">{testimonial.author}</span>
                <span className="text-lp-text-secondary text-sm italic font-serif">{testimonial.role}</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
