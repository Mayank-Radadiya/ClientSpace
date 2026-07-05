"use client";

import React from "react";
import { motion } from "motion/react";

const TESTIMONIALS = [
  {
    content:
      "ClientSpace completely changed how my agency looks to our clients. We went from looking like a scattered mess of emails to a premium studio that justifies its rates.",
    author: "Sarah Jenkins",
    role: "Founder, Studio XYZ",
    location: "Brooklyn, NY",
    frame: "01",
    avatar: "SJ",
  },
  {
    content:
      "My clients literally compliment the portal. I've been able to raise my rates by 30% because the perceived value of my service is so much higher now.",
    author: "Elena Rodriguez",
    role: "Marketing Consultant",
    location: "Austin, TX",
    frame: "02",
    avatar: "ER",
  },
  {
    content:
      "Integrated invoicing that ties to project milestones is a game changer. I get paid faster and don't have to awkwardly follow up for overdue payments.",
    author: "David Kim",
    role: "Web Developer",
    location: "Seattle, WA",
    frame: "03",
    avatar: "DK",
  },
  {
    content:
      "Our enterprise clients expect a polished experience. ClientSpace delivers that out of the box. We onboarded 14 clients in the first month with zero friction.",
    author: "Marcus Webb",
    role: "Operations Director, North Studio",
    location: "Chicago, IL",
    frame: "04",
    avatar: "MW",
  },
];

export function SocialProof() {
  return (
    <section
      className="relative w-full bg-lp-bg py-24 md:py-32"
      id="testimonials"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 flex items-start justify-between border-b border-lp-border pb-6"
        >
          <div>
            <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.15em] text-[#6C63FF]">
              § FIELD NOTES / 03
            </div>
            <h2 className="font-display text-lp-text text-3xl font-bold tracking-tight md:text-5xl">
              Trusted by studios worldwide.
            </h2>
          </div>
          <div className="text-lp-text-secondary hidden text-right font-mono text-[11px] leading-relaxed md:block">
            <div>04 accounts</div>
            <div>Verified Q2 2026</div>
          </div>
        </motion.div>

        {/* Testimonials — editorial 2-col grid */}
        <div className="bg-lp-border grid grid-cols-1 gap-px md:grid-cols-2">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group bg-lp-bg p-8 transition-colors hover:bg-lp-surface md:p-10"
            >
              {/* Frame header */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-lp-border bg-[#6C63FF]/8 font-mono text-sm font-bold text-[#6C63FF] ring-1 ring-[#6C63FF]/15 transition-all grayscale group-hover:grayscale-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-lp-text">{t.author}</div>
                    <div className="font-body text-xs text-lp-text-secondary">{t.role}</div>
                  </div>
                </div>
                <div className="text-lp-text-secondary hidden text-right font-mono text-[10px] md:block">
                  <div>Frame {t.frame}/04</div>
                  <div className="mt-0.5">{t.location}</div>
                </div>
              </div>

              {/* Quote */}
              <div className="relative">
                <span className="absolute -top-2 -left-1 select-none font-serif text-4xl leading-none text-[#6C63FF]/15">
                  &ldquo;
                </span>
                <p className="font-body relative z-10 pl-4 text-base leading-relaxed text-lp-text-secondary">
                  {t.content}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center gap-3 border-t border-lp-border pt-4">
                <span className="rounded-[2px] border border-lp-border bg-lp-bg px-2 py-0.5 font-mono text-[10px] text-lp-text-secondary">
                  {t.location}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
