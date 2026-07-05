"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { SectionMeta } from "./SectionMeta";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const widgetY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const headline = [
    { text: "The workspace your", color: "text-[#fafafa]" },
    { text: "clients actually", color: "text-[#555]" },
    { text: "want.", color: "text-[#fafafa]" },
  ];

  return (
    <section ref={ref} className="relative min-h-[140vh] bg-[#0a0a0a]">
      {/* Phase 1 — Text area */}
      <div className="relative z-10 flex min-h-[60vh] flex-col justify-end pb-16">
        <div className="mx-auto w-full max-w-[960px] px-6">
          <SectionMeta
            code="BULLETIN # 01"
            sheet="1"
            total="1"
            location="US-EAST-1"
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
            className="mt-16"
          >
            {/* Headline */}
            <h1 className="font-display max-w-3xl text-[clamp(48px,10vw,80px)] leading-[0.95] tracking-[-0.02em] italic">
              {headline.map((line, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.55,
                        delay: i * 0.08 + 0.2,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    },
                  }}
                  className={`block ${line.color} font-display italic`}
                >
                  {line.text}
                </motion.span>
              ))}
            </h1>

            {/* Subtext */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.55,
                    delay: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              }}
              className="mt-8 max-w-md text-[16px] leading-[1.7] text-[#a0a0a0]"
            >
              Stop emailing PDFs and chasing updates. Every client gets a
              branded portal with live project tracking, one-click approvals,
              and milestone-tied payments.
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.55,
                    delay: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              }}
              className="mt-10 flex items-center gap-4"
            >
              <Link
                href="/signup"
                className="bg-[#fafafa] px-8 py-3 text-[13px] font-medium tracking-tight text-[#0a0a0a] transition-all duration-200 hover:border hover:border-[#fafafa] hover:bg-[#0a0a0a] hover:text-[#fafafa]"
              >
                Start free trial
              </Link>
              <Link
                href="#how-it-works"
                className="text-[13px] tracking-tight text-[#a0a0a0] transition-all duration-200 hover:text-[#fafafa]"
              >
                See how it works →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Phase 2 — App mockup widget with parallax */}
      <motion.div
        style={{ y: widgetY }}
        className="relative max-h-[520px] w-full overflow-hidden"
      >
        <div className="mx-auto max-w-[960px] px-6">
          <div className="w-full border border-[#222] bg-[#111]">
            <div className="flex">
              {/* Left sidebar */}
              <div className="hidden w-48 border-r border-[#222] p-4 md:block">
                <div className="mb-8 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#fafafa]" />
                  <span className="font-sans text-[11px] text-[#fafafa]">
                    ClientSpace
                  </span>
                </div>
                <nav className="space-y-4">
                  {["Dashboard", "Projects", "Team", "Reports", "Settings"].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
                          i === 0 ? "text-[#fafafa]" : "text-[#555]"
                        }`}
                      >
                        {item}
                      </div>
                    ),
                  )}
                </nav>
              </div>

              {/* Main area */}
              <div className="flex-1 p-5">
                {/* Top bar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-[#555]">
                    <span className="text-[#a0a0a0]">acme</span>
                    <span>→</span>
                    <span className="text-[#a0a0a0]">dashboard</span>
                  </div>
                  <div className="flex gap-3">
                    {[
                      "OVERVIEW",
                      "ANALYTICS",
                      "CUSTOMERS",
                      "PRODUCTS",
                      "SETTINGS",
                    ].map((tab, i) => (
                      <span
                        key={tab}
                        className={`font-mono text-[8px] tracking-[0.12em] uppercase ${
                          i === 0
                            ? "border-b border-[#fafafa] pb-0.5 text-[#fafafa]"
                            : "text-[#555]"
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats row */}
                <div className="mb-6 grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "TOTAL REVENUE",
                      value: "$45,231",
                      change: "+3% from last month",
                    },
                    {
                      label: "SUBSCRIPTIONS",
                      value: "2,350",
                      change: "active clients",
                    },
                    { label: "RECENT SALES", value: "12", change: "this week" },
                  ].map((stat) => (
                    <div key={stat.label} className="border border-[#222] p-3">
                      <div className="mb-1 font-mono text-[8px] tracking-[0.15em] text-[#555] uppercase">
                        {stat.label}
                      </div>
                      <div className="font-sans text-[18px] font-medium text-[#fafafa]">
                        {stat.value}
                      </div>
                      <div className="mt-0.5 font-mono text-[8px] text-[#555]">
                        {stat.change}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + Right panel */}
                <div className="grid grid-cols-[1.4fr_1fr] gap-3">
                  {/* SVG sparkline chart */}
                  <div className="border border-[#222] p-4">
                    <div className="mb-3 font-mono text-[9px] tracking-[0.15em] text-[#555] uppercase">
                      REVENUE · 2025
                    </div>
                    <svg
                      viewBox="0 0 300 100"
                      className="h-24 w-full"
                      preserveAspectRatio="none"
                    >
                      <motion.path
                        d="M0,80 Q20,75 40,60 T80,40 T120,35 T160,30 T200,20 T240,15 T280,10 L300,8"
                        fill="none"
                        stroke="#fafafa"
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 1.5,
                          delay: 0.8,
                          ease: "easeOut",
                        }}
                      />
                      <motion.path
                        d="M0,80 Q20,75 40,60 T80,40 T120,35 T160,30 T200,20 T240,15 T280,10 L300,8 L300,100 L0,100 Z"
                        fill="url(#revenueGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        transition={{ duration: 0.8, delay: 1.5 }}
                      />
                      <defs>
                        <linearGradient
                          id="revenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#fafafa" />
                          <stop
                            offset="100%"
                            stopColor="#fafafa"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Mini data table */}
                  <div className="border border-[#222] p-4">
                    <div className="mb-3 font-mono text-[9px] tracking-[0.15em] text-[#555] uppercase">
                      TOP CLIENTS
                    </div>
                    {[
                      { name: "Acme Corp", amount: "$12,400" },
                      { name: "Stark Ind", amount: "$8,200" },
                      { name: "Nova Studio", amount: "$6,100" },
                      { name: "Pixel Labs", amount: "$4,800" },
                    ].map((client, i) => (
                      <div
                        key={client.name}
                        className="flex items-center justify-between border-b border-[#222] py-2 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#222]">
                            <span className="font-mono text-[7px] text-[#555]">
                              {client.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-[#a0a0a0]">
                            {client.name}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[#fafafa]">
                          {client.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parallax mask */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </motion.div>
    </section>
  );
}
