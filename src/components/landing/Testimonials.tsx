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
    gradient: "from-cs-bg-raised via-cs-bg to-cs-bg",
  },
  {
    num: "02",
    name: "Marcus T.",
    role: "Founder",
    company: "Form & Function Co.",
    date: "Q1 2026",
    quote:
      "We had clients in Basecamp, Trello, and two different Slack workspaces. This is the first thing that actually replaced all of it.",
    gradient: "from-cs-accent/15 via-cs-bg to-cs-bg",
  },
  {
    num: "03",
    name: "Priya K.",
    role: "Studio Director",
    company: "Halcyon Creative",
    date: "Q1 2026",
    quote:
      "For the first time, our clients feel like they're inside a real product, not a shared folder. That alone changed how prospects see us before we've done any work.",
    gradient: "from-cs-bg-raised via-cs-bg to-cs-bg",
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
        <span className="text-cs-ink">Quieter, </span>
        <span className="text-cs-faint">
          according to the teams who&apos;ve used it
        </span>
        <br />
        <span className="text-cs-faint">for a full quarter.</span>
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
              className="scroll-snap-align-start relative w-[380px] flex-shrink-0 overflow-hidden border border-cs-line-strong"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-60`}
              />
              <div className="absolute top-4 left-4 z-10">
                <span className="font-data text-[10px] text-cs-ink">
                  ● № {t.num}
                </span>
              </div>
              <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-3/5 bg-gradient-to-t from-cs-bg via-cs-bg/80 to-transparent" />
              <div className="absolute right-0 bottom-0 left-0 z-10 p-6">
                <div className="mb-2 text-[20px] leading-none text-cs-ink-muted">
                  ❝
                </div>
                <p className="mb-4 text-[14px] leading-[1.6] text-cs-ink italic">
                  {t.quote}
                </p>
                <div className="font-data text-[10px] leading-relaxed text-cs-ink-muted">
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
                className="h-[2px] w-8 bg-[#333] transition-colors hover:bg-cs-line-strong"
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center border border-cs-line-strong font-data text-[12px] text-cs-ink-muted transition-all duration-200 hover:border-cs-faint hover:text-cs-accent-ink"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center border border-cs-line-strong font-data text-[12px] text-cs-ink-muted transition-all duration-200 hover:border-cs-faint hover:text-cs-accent-ink"
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
