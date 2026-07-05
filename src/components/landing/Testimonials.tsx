"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { SectionMeta } from "./SectionMeta";

const testimonials = [
  {
    num: "01",
    name: "Yasmin O.",
    role: "Design Director",
    company: "Nova Studio",
    date: "Q1 2026",
    quote:
      "No more burning a Friday afternoon exporting and emailing files. It sounds small, but it changed how we spend our week.",
    gradient: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
  },
  {
    num: "02",
    name: "Marcus T.",
    role: "Founder",
    company: "Form & Function Co.",
    date: "Q1 2026",
    quote:
      "We had clients in Basecamp, Trello, and two different Slack workspaces. This is the first thing that actually replaced all of it.",
    gradient: "from-[#2d1b00] via-[#4a2c0a] to-[#1a1a0a]",
  },
  {
    num: "03",
    name: "Priya K.",
    role: "Studio Lead",
    company: "CMYK Collective",
    date: "Q1 2026",
    quote:
      "For the first time, our clients actually use the portal. The branded dashboard makes them feel like they've upgraded agencies overnight.",
    gradient: "from-[#0a1628] via-[#1a1a2e] to-[#0f0f1a]",
  },
];

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -396 : 396,
      behavior: "smooth",
    });
  };

  return (
    <section className="section-wrapper">
      <SectionMeta
        code="3 INTERVIEWS · Q1 2026"
        sheet="1"
        total="1"
        location="PHOTOGRAPHS BY THE CUSTOMER · USED WITH PERMISSION · ISSUE 01 · SPRING 2026"
      />

      <h2 className="font-display mt-16 mb-12 text-[clamp(32px,5vw,64px)] leading-[1] tracking-[-0.01em] italic">
        <span className="text-[#fafafa]">Quieter, </span>
        <span className="text-[#555]">
          according to the teams who&apos;ve used it
        </span>
        <br />
        <span className="text-[#555]">for a full quarter.</span>
      </h2>

      <div className="relative">
        <div ref={scrollRef} className="carousel-track pb-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.num}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="scroll-snap-align-start relative h-[520px] w-[380px] flex-shrink-0 overflow-hidden border border-[#222]"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-60`}
              />
              <div className="absolute top-4 left-4 z-10">
                <span className="font-mono text-[10px] text-[#fafafa]">
                  ● № {t.num}
                </span>
              </div>
              <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-3/5 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
              <div className="absolute right-0 bottom-0 left-0 z-10 p-6">
                <div className="mb-2 text-[20px] leading-none text-[#a0a0a0]">
                  ❝
                </div>
                <p className="mb-4 text-[14px] leading-[1.6] text-[#fafafa] italic">
                  {t.quote}
                </p>
                <div className="font-mono text-[10px] leading-relaxed text-[#a0a0a0]">
                  {t.name} · {t.role} · {t.company} · FILED · {t.date} · FRAME{" "}
                  {t.num}/{testimonials.length.toString().padStart(2, "0")}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-3">
            {testimonials.map((t, i) => (
              <button
                key={t.num}
                onClick={() =>
                  scrollRef.current?.scrollTo({
                    left: i * 396,
                    behavior: "smooth",
                  })
                }
                className="h-[2px] w-8 bg-[#333] transition-colors hover:bg-[#555]"
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center border border-[#333] font-mono text-[12px] text-[#a0a0a0] transition-all duration-200 hover:border-[#555] hover:text-[#fafafa]"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center border border-[#333] font-mono text-[12px] text-[#a0a0a0] transition-all duration-200 hover:border-[#555] hover:text-[#fafafa]"
              aria-label="Next"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
