"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------- atoms --------------------------------- */

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function MaskLine({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.95, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Pure-CSS blueprint grid — theme-aware, zero JS (replaces old canvas). */
function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(var(--ld-hairline) 1px, transparent 1px), linear-gradient(90deg, var(--ld-hairline) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage:
          "radial-gradient(ellipse 90% 65% at 50% 0%, black 35%, transparent 78%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 90% 65% at 50% 0%, black 35%, transparent 78%)",
      }}
    />
  );
}

/* ------------------------------- dashboard -------------------------------- */

const NAV_ITEMS = [
  "Overview",
  "Invoices",
  "Approvals",
  "Files",
  "Messages",
  "Settings",
];

const KPIS = [
  { label: "Total revenue", value: "$45,231", delta: "+12.4%" },
  { label: "Awaiting approval", value: "7", delta: "-3" },
  { label: "Active clients", value: "18", delta: "+2" },
];

const PROJECTS = [
  { name: "Brand refresh", client: "Luminary Co.", pct: 78 },
  { name: "Website redesign", client: "Arc Studio", pct: 45 },
  { name: "Campaign assets", client: "Bloom Agency", pct: 92 },
  { name: "Annual report", client: "Kova Partners", pct: 31 },
];

const ACTIVITY = [
  {
    who: "OM",
    name: "Olivia Martin",
    what: "approved Invoice #2041",
    when: "2m",
  },
  {
    who: "JL",
    name: "Jackson Lee",
    what: "left a note on Brand refresh",
    when: "18m",
  },
  {
    who: "IN",
    name: "Isabella Nguyen",
    what: "paid $4,800 retainer",
    when: "1h",
  },
  { who: "WK", name: "William Kim", what: "uploaded 6 files", when: "3h" },
];

const BARS = [34, 52, 41, 66, 48, 74, 58, 82, 63, 90, 71, 96];

function DashboardScreen() {
  return (
    <div className="border-cs-line bg-cs-bg-raised overflow-hidden rounded-xl border shadow-[0_48px_120px_-32px_rgba(0,0,0,0.55)]">
      {/* browser chrome */}
      <div className="border-cs-line bg-cs-bg/60 flex items-center gap-4 border-b px-4 py-3">
        <div className="flex gap-1.5">
          <span className="bg-cs-line-strong size-2.5 rounded-full" />
          <span className="bg-cs-line-strong size-2.5 rounded-full" />
          <span className="bg-cs-line-strong size-2.5 rounded-full" />
        </div>
        <div className="font-data border-cs-line bg-cs-bg-raised text-cs-faint mx-auto max-w-xs flex-1 truncate rounded-md border px-3 py-1 text-center text-[11px]">
          portal.acme.studio
        </div>
        <div className="w-14" />
      </div>

      <div className="grid grid-cols-[168px_1fr_220px] max-md:hidden">
        {/* sidebar */}
        <aside className="border-cs-line/60 border-r p-4">
          <p className="font-data text-cs-faint mb-4 truncate text-[11px] tracking-[0.18em] uppercase">
            Acme Inc.
          </p>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item, i) => (
              <div
                key={item}
                className={
                  i === 0
                    ? "bg-cs-accent/10 text-cs-accent rounded-md px-2 py-1.5 text-xs font-medium"
                    : "text-cs-ink-muted hover:text-cs-ink rounded-md px-2 py-1.5 text-xs transition-colors"
                }
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        {/* main */}
        <main className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-3">
            {KPIS.map((kpi) => (
              <div
                key={kpi.label}
                className="border-cs-line bg-cs-bg/50 rounded-lg border p-3"
              >
                <p className="font-data text-cs-faint text-[10px] tracking-[0.14em] uppercase">
                  {kpi.label}
                </p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-cs-ink text-lg font-semibold tracking-tight">
                    {kpi.value}
                  </span>
                  <span className="font-data text-cs-ok text-[10px]">
                    {kpi.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="font-data text-cs-faint mb-2.5 text-[10px] tracking-[0.14em] uppercase">
              Active projects
            </p>
            <div className="space-y-2.5">
              {PROJECTS.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-cs-ink truncate text-xs font-medium">
                      {p.name}{" "}
                      <span className="text-cs-faint">· {p.client}</span>
                    </p>
                    <div className="bg-cs-line mt-1 h-1 overflow-hidden rounded-full">
                      <div
                        className="bg-cs-accent h-full rounded-full"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-data text-cs-ink-muted shrink-0 text-[10px]">
                    {p.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-data text-cs-faint text-[10px] tracking-[0.14em] uppercase">
                Revenue
              </p>
              <div className="font-data border-cs-line flex items-center gap-0.5 rounded-full border p-0.5 text-[9px] uppercase">
                <span className="bg-cs-ink/[0.08] text-cs-ink rounded-full px-2 py-0.5">
                  Monthly
                </span>
                <span className="text-cs-faint px-2 py-0.5">Weekly</span>
              </div>
            </div>
            <div className="flex h-20 items-end gap-1.5">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: `linear-gradient(to top, color-mix(in srgb, var(--ld-accent) 55%, transparent), color-mix(in srgb, var(--ld-accent) 12%, transparent))`,
                  }}
                />
              ))}
            </div>
          </div>
        </main>

        {/* activity rail */}
        <aside className="border-cs-line/60 border-l p-4">
          <p className="font-data text-cs-faint mb-3 text-[10px] tracking-[0.14em] uppercase">
            Recent activity
          </p>
          <ul className="space-y-3.5">
            {ACTIVITY.map((a) => (
              <li key={a.name} className="flex gap-2.5">
                <span className="font-data bg-cs-bg-raised text-cs-ink-muted ring-cs-line mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] ring-1">
                  {a.who}
                </span>
                <div className="min-w-0">
                  <p className="text-cs-ink text-xs leading-snug">
                    {a.name} <span className="text-cs-faint">{a.what}</span>
                  </p>
                  <p className="font-data text-cs-faint mt-0.5 text-[10px]">
                    {a.when}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* compact fallback */}
      <div className="space-y-3 p-4 md:hidden">
        <div className="grid grid-cols-2 gap-3">
          {KPIS.slice(0, 2).map((kpi) => (
            <div
              key={kpi.label}
              className="border-cs-line bg-cs-bg/50 rounded-lg border p-3"
            >
              <p className="font-data text-cs-faint text-[10px] tracking-[0.14em] uppercase">
                {kpi.label}
              </p>
              <p className="text-cs-ink mt-1.5 text-lg font-semibold tracking-tight">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-2.5">
          {PROJECTS.slice(0, 3).map((p) => (
            <div key={p.name}>
              <p className="text-cs-ink truncate text-xs font-medium">
                {p.name} <span className="text-cs-faint">· {p.client}</span>
              </p>
              <div className="bg-cs-line mt-1 h-1 overflow-hidden rounded-full">
                <div
                  className="bg-cs-accent h-full rounded-full"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- hero ---------------------------------- */

const HEADLINE_LINES: Array<Array<{ t: string; accent?: boolean }>> = [
  [{ t: "The client portal" }],
  [{ t: "your studio" }],
  [{ t: "actually " }, { t: "deserves.", accent: true }],
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const rawDashY = useTransform(scrollYProgress, [0, 1], [70, -50]);
  const dashY = useSpring(rawDashY, { stiffness: 120, damping: 26, mass: 0.4 });
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const copyScale = useTransform(scrollYProgress, [0, 0.55], [1, 0.965]);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-screen flex-col overflow-hidden pt-28 md:pt-32"
    >
      <GridBackdrop />

      {/* edge fades */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[6] h-36"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--ld-bg) 88%, transparent), transparent)",
        }}
      />

      {/* ANCHOR — giant invoiced-through numeral, peeking from behind the mockup */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[30%] -right-6 z-[4] hidden select-none lg:block xl:right-8"
      >
        <span
          className="font-display block leading-none tracking-tighter"
          style={{
            fontSize: "clamp(9rem, 17vw, 16rem)",
            WebkitTextStroke: "1px var(--ld-line-strong)",
            color: "transparent",
          }}
        >
          $1.8M
        </span>
        <span className="font-data text-cs-faint mt-1 block text-right text-[11px] tracking-[0.32em] uppercase">
          Invoiced through portals · last quarter
        </span>
      </div>

      {/* copy */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-6xl px-6"
        style={reduce ? undefined : { opacity: copyOpacity, scale: copyScale }}
      >
        <FadeUp delay={0}>
          <p className="font-data text-cs-ink-muted flex items-center gap-2.5 text-[11px] tracking-[0.28em] uppercase">
            <span className="relative flex size-1.5">
              <span className="bg-cs-accent absolute inline-flex size-full animate-ping rounded-full opacity-60" />
              <span className="bg-cs-accent relative inline-flex size-1.5 rounded-full" />
            </span>
            Clientspace · Client portal for studios
          </p>
        </FadeUp>

        <h1
          className="text-cs-ink mt-7 max-w-4xl text-[clamp(2.75rem,7vw,5.75rem)] leading-[1.02] font-semibold tracking-[-0.04em]"
          aria-label="The client portal your studio actually deserves."
        >
          {HEADLINE_LINES.map((parts, li) => (
            <MaskLine key={li} delay={0.12 + li * 0.09}>
              {parts.map((p, pi) =>
                p.accent ? (
                  <em
                    key={pi}
                    className="font-display tracking-[-0.03em] italic"
                    style={{ color: "var(--ld-accent)" }}
                  >
                    {p.t}
                  </em>
                ) : (
                  <span key={pi}>{p.t}</span>
                ),
              )}
            </MaskLine>
          ))}
        </h1>

        <div className="mt-9 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <FadeUp delay={0.42} className="max-w-md">
            <p className="text-cs-ink-muted text-base leading-relaxed">
              Invoices, approvals, files and updates — one calm place your
              clients log into. Fewer follow-ups, faster payments, zero
              scattered email threads.
            </p>
          </FadeUp>

          <FadeUp delay={0.52} className="shrink-0">
            <div className="flex items-center gap-5">
              <Link
                href="#pricing"
                className="bg-cs-cta-bg text-cs-cta-text inline-flex h-11 items-center rounded-full px-7 text-sm font-medium transition-all duration-300 hover:-translate-y-px hover:opacity-90"
              >
                Start free trial
              </Link>
              <Link
                href="#how-it-works"
                className="group font-data text-cs-ink-muted hover:text-cs-ink inline-flex items-center gap-2 text-[13px] tracking-[0.14em] uppercase transition-colors"
              >
                See how it works
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </motion.div>

      {/* mockup */}
      <div className="relative z-[5] mx-auto mt-14 w-full max-w-6xl flex-1 px-6 pb-10 md:mt-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 64 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.62 }}
        >
          <motion.div
            style={
              reduce ? undefined : { y: dashY, transformPerspective: 1400 }
            }
            whileHover={reduce ? undefined : { rotateX: 2, rotateY: 0 }}
            className="[transform-style:preserve-3d]"
          >
            {/* highlight edge */}
            <div
              aria-hidden
              className="mx-auto h-px w-[92%] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, color-mix(in srgb, var(--ld-ink) 35%, transparent), transparent)",
              }}
            />
            <div className="mt-px">
              <DashboardScreen />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
