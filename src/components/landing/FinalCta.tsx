"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SectionMeta } from "./SectionMeta";

export function FinalCta() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="cs-section border-t border-[#1a1a1a] bg-[#0B0B0C]">
      <div className="cs-container max-w-3xl text-center">
        <SectionMeta
          code="SIGNAL · CLOSING"
          sheet="1"
          total="1"
          location="TRANSMISSION · 2026.04"
        />

        <blockquote className="font-display mt-12 text-[clamp(20px,3vw,32px)] leading-[1.2] tracking-[-0.01em] text-[#F4F3EF] italic">
          &ldquo;Quiet is the product. Forty-one teams have run ClientSpace for
          ninety days. None of them have asked to go back.&rdquo;
        </blockquote>

        <div className="mt-10">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 font-mono text-[13px] text-[#7FBF8F]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="#7FBF8F"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 8l2 2 4-4"
                  stroke="#7FBF8F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              You&rsquo;re on the list.
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-md gap-3"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 border border-[#232326] bg-transparent px-4 py-3 font-mono text-[12px] text-[#F4F3EF] transition-colors outline-none placeholder:text-[#555] focus:border-[#555]"
              />
              <button
                type="submit"
                className="border border-[#232326] px-6 py-3 font-mono text-[11px] tracking-widest text-[#9A9A9E] uppercase transition-all duration-200 hover:border-[#555] hover:text-[#F4F3EF]"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
