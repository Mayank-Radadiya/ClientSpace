"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SectionMeta } from "./SectionMeta";

const FEATURES = [
  {
    id: "dashboards",
    label: "Project Dashboards",
    description:
      "Every client gets a branded dashboard showing exactly what matters — project status, upcoming milestones, pending approvals, and outstanding invoices. No training required.",
    mockup: (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between border-b border-cs-line pb-2">
          <span className="font-data text-[9px] tracking-widest text-cs-ink-muted uppercase">
            Active Projects
          </span>
          <span className="font-data text-[8px] text-cs-faint">Q2 2026</span>
        </div>
        {[
          {
            name: "Luminary Rebrand",
            status: "On Track",
            pct: 78,
            color: "var(--ld-ok)",
          },
          {
            name: "Acme Corp · Portal Launch",
            status: "Review",
            pct: 45,
            color: "var(--ld-accent)",
          },
          {
            name: "Studio X · Q3 Campaign",
            status: "On Track",
            pct: 92,
            color: "var(--ld-ok)",
          },
        ].map((p) => (
          <div key={p.name}>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-data text-[10px] text-cs-ink">
                {p.name}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.5 font-data text-[7px] tracking-wider ${
                  p.status === "On Track"
                    ? "bg-cs-ok/15 text-cs-ok"
                    : "bg-cs-accent/15 text-cs-accent"
                }`}
              >
                ● {p.status}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-cs-line">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${p.pct}%`,
                  backgroundColor: p.color,
                  opacity: 0.6,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "payments",
    label: "Milestone Payments",
    description:
      "Set milestones, mark work complete, and invoices send automatically. Clients pay from their dashboard — no chasing, no PDF exports.",
    mockup: (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between border-b border-cs-line pb-2">
          <span className="font-data text-[9px] tracking-widest text-cs-ink-muted uppercase">
            Recent Transactions
          </span>
          <span className="font-data text-[8px] text-cs-faint">
            INV-2026-0042
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg border border-cs-line bg-cs-bg-raised p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-data text-[10px] text-cs-ink">
              Brand Refresh — Phase 2
            </span>
            <span className="rounded-full bg-cs-ok/15 px-2 py-0.5 font-data text-[8px] text-cs-ok">
              Marked Complete
            </span>
          </div>
          <div className="mb-2 font-data text-[18px] font-medium text-cs-ink">
            $4,200.00
          </div>
          <div className="flex items-center gap-2 font-data text-[9px] text-cs-faint">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cs-ok" />
            Invoice sent · Paid
          </div>
        </motion.div>
        <div className="rounded-lg border border-cs-line bg-cs-bg-raised p-3 opacity-60">
          <span className="font-data text-[10px] text-cs-faint">
            Website Redesign — Wireframes
          </span>
          <div className="mt-1 font-data text-[14px] text-cs-faint">
            $6,800.00
          </div>
          <span className="font-data text-[8px] text-cs-faint">
            Pending start
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "approvals",
    label: "One-Click Approvals",
    description:
      "Clients review work and approve with one click. Full version history, so you always know what was signed off and when.",
    mockup: (
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2 rounded-lg border border-cs-line bg-cs-bg-raised p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cs-accent/15">
            <span className="font-data text-[8px] text-cs-accent">OK</span>
          </div>
          <div className="flex-1">
            <div className="font-data text-[10px] text-cs-ink">
              Approved · Brand Guidelines v3
            </div>
            <div className="font-data text-[8px] text-cs-faint">
              Olivia M. · 2m ago
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7.5l3 3 7-7"
              stroke="var(--ld-ok)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-cs-line bg-cs-bg-raised p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cs-accent/15">
            <span className="font-data text-[8px] text-cs-accent">OK</span>
          </div>
          <div className="flex-1">
            <div className="font-data text-[10px] text-cs-ink">
              Approved · Wireframes v2
            </div>
            <div className="font-data text-[8px] text-cs-faint">
              Jackson L. · 1h ago
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7.5l3 3 7-7"
              stroke="var(--ld-ok)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-cs-line bg-cs-bg-raised p-3 opacity-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cs-line-strong">
            <span className="font-data text-[8px] text-cs-ink-muted">..</span>
          </div>
          <div className="flex-1">
            <div className="font-data text-[10px] text-cs-faint">
              Awaiting · Q3 Campaign Moodboard
            </div>
            <div className="font-data text-[8px] text-cs-faint">
              Sent to client
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "delivery",
    label: "Asset Delivery",
    description:
      "Full-resolution files, branded delivery pages, and download tracking. No more WeTransfer links that expire at the worst moment.",
    mockup: (
      <div className="flex flex-col gap-2 p-4">
        <div className="rounded-lg border border-cs-line bg-cs-bg-raised p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-data text-[10px] text-cs-ink">
              Brand Assets — Final.zip
            </span>
            <span className="font-data text-[8px] text-cs-faint">2.4 GB</span>
          </div>
          <div className="flex gap-1">
            {["PNG", "SVG", "PDF", "AI"].map((fmt) => (
              <span
                key={fmt}
                className="rounded border border-cs-line px-1.5 py-0.5 font-data text-[7px] text-cs-faint"
              >
                {fmt}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 font-data text-[8px] text-cs-faint">
            <span className="cs-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-cs-accent" />
            Downloaded 12 times
          </div>
        </div>
        <div className="rounded-lg border border-cs-line bg-cs-bg-raised p-3 opacity-60">
          <span className="font-data text-[10px] text-cs-faint">
            Website Assets — v2.zip
          </span>
          <div className="mt-1 flex gap-1">
            {["PNG", "WEBP"].map((fmt) => (
              <span
                key={fmt}
                className="rounded border border-cs-line px-1.5 py-0.5 font-data text-[7px] text-cs-faint"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "messaging",
    label: "Contextual Messaging",
    description:
      "Comments pinned to specific files, versions, and milestones. Every message lives where the work is — not buried in a Slack thread.",
    mockup: (
      <div className="flex flex-col gap-2 p-4">
        <div className="rounded-lg border border-cs-line bg-cs-bg-raised p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-data text-[9px] text-cs-accent">
              hi@acme.com
            </span>
            <span className="font-data text-[7px] text-cs-faint">12:34 PM</span>
          </div>
          <p className="font-data text-[10px] text-cs-ink">
            The typography on page 8 needs adjusting — the heading hierarchy
            feels off.
          </p>
          <span className="mt-1 inline-block font-data text-[8px] text-cs-faint">
            Re: Brand Guidelines v3 · Page 8
          </span>
        </div>
        <div className="rounded-lg border border-cs-line bg-cs-bg-raised p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-data text-[9px] text-cs-accent">
              studio@luminary.co
            </span>
            <span className="font-data text-[7px] text-cs-faint">12:46 PM</span>
          </div>
          <p className="font-data text-[10px] text-cs-ink">
            Updated the heading sizes. Ready for re-review whenever you are.
          </p>
          <span className="mt-1 inline-block font-data text-[8px] text-cs-faint">
            Attached: brand-guidelines-v4.pdf
          </span>
        </div>
      </div>
    ),
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState(FEATURES[0]!.id);
  const current = FEATURES.find((f) => f.id === active) ?? FEATURES[0]!;

  return (
    <section
      id="features"
      className="cs-section overflow-hidden"
    >
      <div className="cs-container">
        <SectionMeta
          code="FEATURES · MODULE V"
          sheet="1"
          total="1"
          location="SHIPPED · 2026.04"
        />

        <div className="mt-12 grid items-start gap-12 md:grid-cols-2 md:gap-16">
          {/* Tab list */}
          <div>
            <h2 className="font-display mb-8 text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.01em] text-cs-ink italic">
              ClientSpace, <span className="text-cs-faint">at a glance.</span>
            </h2>

            <div className="flex flex-col gap-1">
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActive(f.id)}
                  className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                    active === f.id
                      ? "border-l-2 border-cs-accent bg-cs-bg-raised"
                      : "border-l-2 border-transparent hover:bg-cs-bg-raised/50"
                  }`}
                >
                  <span
                    className={`shrink-0 font-data text-[9px] tracking-widest transition-colors duration-200 ${
                      active === f.id ? "text-cs-accent" : "text-cs-faint"
                    }`}
                  >
                    {f.label.toUpperCase().slice(0, 3)}
                  </span>
                  <div className="flex-1">
                    <span
                      className={`block font-data text-[12px] transition-colors duration-200 ${
                        active === f.id
                          ? "text-cs-ink"
                          : "text-cs-faint group-hover:text-cs-ink-muted"
                      }`}
                    >
                      {f.label}
                    </span>
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`transition-all duration-200 ${
                      active === f.id
                        ? "translate-x-0.5 text-cs-accent"
                        : "text-cs-line-strong"
                    }`}
                  >
                    <path
                      d="M2 6h8M6 2l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>

            {/* Description */}
            <p className="mt-8 text-[14px] leading-[1.7] text-cs-ink-muted md:text-[15px]">
              {current.description}
            </p>
          </div>

          {/* Mockup panel */}
          <div className="relative">
            <div className="sticky top-24 overflow-hidden rounded-xl border border-cs-line bg-cs-bg shadow-2xl">
              {/* Chrome bar */}
              <div className="flex items-center gap-1.5 border-b border-cs-line bg-cs-bg-raised px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-cs-line-strong" />
                <span className="h-2 w-2 rounded-full bg-cs-line-strong" />
                <span className="h-2 w-2 rounded-full bg-cs-line-strong" />
                <span className="ml-4 font-data text-[7px] tracking-wider text-cs-faint uppercase">
                  app.clientspace.io ·{" "}
                  {current.label.toLowerCase().replace(/\s+/g, "-")}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-[300px]"
                >
                  {current.mockup}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
