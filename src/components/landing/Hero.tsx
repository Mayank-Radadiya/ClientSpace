"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from "motion/react";
import Link from "next/link";
import { useRef, useEffect, useCallback } from "react";

/* ─── Easing ─────────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1] as const;

/* ─── Types ──────────────────────────────────────────────── */
interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/* ─── FadeUp ─────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  AnimatedGrid — fine SVG grid with a radial spotlight that  */
/*  drifts slowly across the surface.                          */
/* ─────────────────────────────────────────────────────────── */
function AnimatedGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.35, y: 0.25 }); // normalised 0-1

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const CELL = 52;

    ctx.clearRect(0, 0, W, H);

    /* ── Grid lines ── */
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += CELL) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += CELL) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    /* ── Radial spotlight that follows mouse (dampened) ── */
    const mx = mouseRef.current.x * W;
    const my = mouseRef.current.y * H;
    const grad = ctx.createRadialGradient(
      mx,
      my,
      0,
      mx,
      my,
      Math.max(W, H) * 0.55,
    );
    grad.addColorStop(0, "rgba(180,130,80,0.07)");
    grad.addColorStop(0.4, "rgba(180,130,80,0.02)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* ── Subtle corner vignette ── */
    const vignette = ctx.createRadialGradient(
      W / 2,
      H / 2,
      H * 0.2,
      W / 2,
      H / 2,
      H * 0.9,
    );
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);

    /* Dampened mouse tracking */
    let targetX = 0.35;
    let targetY = 0.25;
    const onMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth;
      targetY = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    /* Animation loop for smooth mouse follow */
    const loop = () => {
      mouseRef.current.x += (targetX - mouseRef.current.x) * 0.035;
      mouseRef.current.y += (targetY - mouseRef.current.y) * 0.035;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden
    />
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Dashboard screenshot mock — dark-themed                    */
/* ─────────────────────────────────────────────────────────── */
function DashboardScreen() {
  const reduced = useReducedMotion();

  const PROJECTS = [
    {
      name: "Brand Refresh",
      client: "Luminary Co.",
      pct: 78,
      color: "#4ade80",
    },
    {
      name: "Website Redesign",
      client: "Arc Studio",
      pct: 45,
      color: "#fb923c",
    },
    {
      name: "Campaign Assets",
      client: "Bloom Agency",
      pct: 92,
      color: "#60a5fa",
    },
    {
      name: "Annual Report",
      client: "Kova Partners",
      pct: 31,
      color: "#a78bfa",
    },
  ];

  const RECENT = [
    { name: "Olivia Martin", action: "Approved v3", time: "2m" },
    { name: "Jackson Lee", action: "Left a comment", time: "8m" },
    { name: "Isabella Nguyen", action: "Signed contract", time: "14m" },
    { name: "William Kim", action: "Invoice paid", time: "1h" },
  ];

  return (
    <div
      className="relative w-full overflow-hidden rounded-t-2xl border border-white/[0.08]"
      style={{
        background: "linear-gradient(145deg, #141414 0%, #0d0d0d 100%)",
        boxShadow:
          "0 -1px 0 0 rgba(255,255,255,0.08), 0 40px 120px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="mx-auto flex h-5 w-44 items-center justify-center rounded-md bg-white/[0.04] px-3">
          <span className="font-mono text-[9px] text-white/20">
            app.clientspace.io · dashboard
          </span>
        </div>
        <div className="ml-2 flex gap-3">
          {["OVERVIEW", "ANALYTICS", "CLIENTS", "SETTINGS"].map((t) => (
            <span
              key={t}
              className={`text-[9px] font-medium tracking-wider ${t === "OVERVIEW" ? "text-white/60 underline decoration-white/20 underline-offset-4" : "text-white/20"}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-36 shrink-0 flex-col border-r border-white/[0.05] bg-white/[0.01] py-4 sm:flex">
          <div className="mb-3 px-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-2.5 py-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-md bg-[#bd7a4e]/80">
                <span className="text-[7px] font-bold text-white">CS</span>
              </div>
              <span className="text-[10px] font-semibold text-white/70">
                Acme Inc.
              </span>
            </div>
          </div>
          {[
            "Dashboard",
            "Projects",
            "Invoices",
            "Files",
            "Contracts",
            "Team",
            "Settings",
          ].map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium ${
                i === 0
                  ? "border-r-2 border-[#bd7a4e] bg-white/[0.05] text-white/80"
                  : "text-white/25 hover:text-white/50"
              }`}
            >
              <span className="h-1 w-1 rounded-full bg-current opacity-50" />
              {item}
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="flex-1 p-5">
          {/* KPI row */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            {[
              {
                label: "TOTAL REVENUE",
                value: "$45,231",
                delta: "+28.3% from last month",
              },
              {
                label: "SUBSCRIPTIONS",
                value: "2,350",
                delta: "+12.3% from last month",
              },
              {
                label: "ACTIVE USERS",
                value: "18,942",
                delta: "+4.6% from last month",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
              >
                <div className="mb-1 text-[8px] font-semibold tracking-widest text-white/25 uppercase">
                  {kpi.label}
                </div>
                <div className="text-[18px] leading-none font-bold tracking-tight text-white/85">
                  {kpi.value}
                </div>
                <div className="mt-1 text-[8px] text-white/30">{kpi.delta}</div>
              </div>
            ))}
          </div>

          {/* Projects + Recent activity */}
          <div className="grid grid-cols-5 gap-3">
            {/* Projects */}
            <div className="col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-white/70">
                  Active Projects
                </span>
                <span className="text-[8px] text-white/25">REVENUE · 2025</span>
              </div>
              <div className="flex flex-col gap-2">
                {PROJECTS.map((p) => (
                  <div key={p.name}>
                    <div className="mb-0.5 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-medium text-white/60">
                          {p.name}
                        </span>
                        <span className="ml-1.5 text-[8px] text-white/25">
                          {p.client}
                        </span>
                      </div>
                      <span className="text-[8px] font-semibold text-white/40">
                        {p.pct}%
                      </span>
                    </div>
                    <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: p.color, opacity: 0.7 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${p.pct}%` }}
                        transition={{ duration: 1, delay: 0.8, ease }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Revenue chart placeholder */}
              <div className="mt-3 flex h-10 items-end gap-px">
                {[22, 35, 28, 48, 38, 56, 44, 62, 52, 70, 58, 75].map(
                  (h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{ backgroundColor: "rgba(189,122,78,0.4)" }}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{
                        delay: 0.9 + i * 0.04,
                        duration: 0.5,
                        ease,
                      }}
                    />
                  ),
                )}
              </div>
            </div>

            {/* Recent activity */}
            <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-3 text-[10px] font-semibold text-white/70">
                Recent Activity
              </div>
              <div className="flex flex-col gap-2.5">
                {RECENT.map((r) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[7px] font-bold text-white/40">
                      {r.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[9px] font-medium text-white/60">
                        {r.name}
                      </div>
                      <div className="text-[8px] text-white/25">{r.action}</div>
                    </div>
                    <span className="shrink-0 text-[8px] text-white/20">
                      {r.time}ago
                    </span>
                  </div>
                ))}
              </div>

              {/* Monthly/weekly toggle */}
              <div className="mt-3 flex gap-1">
                {["MONTHLY", "WEEKLY"].map((t, i) => (
                  <span
                    key={t}
                    className={`rounded-md px-2 py-0.5 text-[7px] font-semibold ${
                      i === 0
                        ? "bg-white/[0.08] text-white/50"
                        : "text-white/20"
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex h-8 items-end gap-px">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-sm bg-[#60a5fa]/30"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 1.0 + i * 0.05, duration: 0.5, ease }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────── */
export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  /* Dashboard drifts up slowly as you scroll */
  const rawDashY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const dashY = useSpring(rawDashY, { stiffness: 60, damping: 20 });

  /* Headline fades + scales gently on scroll */
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.96]);

  const LINES = ["The client portal", "your studio", "actually deserves."];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden"
      id="hero"
      style={{ background: "var(--meridian-bg, #0a0a0a)" }}
    >
      {/* ── Animated grid background ── */}
      <AnimatedGrid />

      {/* ── Bottom fade to black (for dashboard bleed) ── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32"
        style={{
          background:
            "linear-gradient(to top, var(--meridian-bg, #0a0a0a), transparent)",
        }}
      />

      {/* ── Top fade from black (for navbar blend) ── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0.7), transparent)",
        }}
      />

      {/* ── Main content ── */}
      <motion.div
        style={reduced ? {} : { opacity: heroOpacity, scale: heroScale }}
        className="relative z-20 mx-auto max-w-7xl px-6 pt-[140px] pb-0 lg:px-12 lg:pt-[160px]"
      >
        {/* ── Eyebrow ── */}
        <FadeUp delay={0.05}>
          <div className="mb-8 inline-flex items-center gap-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#bd7a4e] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#bd7a4e]" />
            </span>
            <span className="text-[11px] font-medium tracking-[0.18em] text-white/35 uppercase">
              Built for creative agencies
            </span>
          </div>
        </FadeUp>

        {/* ── Headline ── */}
        <h1 className="text-[clamp(3rem,7vw,6rem)] leading-[1.01] font-bold tracking-[-0.04em] text-white">
          {LINES.map((line, li) => (
            <span key={li} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={reduced ? {} : { y: "105%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.12 + li * 0.13,
                  ease,
                }}
              >
                {li === 2 ? (
                  <>
                    <span
                      className="font-normal italic"
                      style={{
                        fontFamily: "var(--font-display, Georgia, serif)",
                        color: "#bd7a4e",
                      }}
                    >
                      actually
                    </span>{" "}
                    <span className="text-white/85">deserves.</span>
                  </>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* ── Subhead ── */}
        <FadeUp delay={0.58} className="mt-7">
          <p className="max-w-[46ch] text-[15px] leading-[1.75] text-white/40">
            Stop emailing PDFs and chasing approvals. Every client gets a
            branded portal with live project tracking, one-click sign-off, and
            milestone-tied invoices.
          </p>
        </FadeUp>

        {/* ── CTAs ── */}
        <FadeUp delay={0.72} className="mt-9">
          <div className="flex flex-wrap items-center gap-4">
            {/* Primary */}
            <Link
              href="/signup"
              className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full bg-white px-7 text-[13px] font-semibold text-black transition-all duration-300 hover:-translate-y-px hover:bg-white/90"
            >
              <span className="relative z-10">Start free trial</span>
              <motion.span
                className="relative z-10 inline-block"
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2 }}
              >
                →
              </motion.span>
            </Link>

            {/* Secondary */}
            <Link
              href="#how-it-works"
              className="group inline-flex h-11 items-center gap-2 text-[13px] font-medium text-white/45 transition-colors duration-200 hover:text-white/80"
            >
              <span>See how it works</span>
              <span className="inline-block text-white/25 transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </FadeUp>

        {/* ── Dashboard bleed ── */}
        <FadeUp delay={0.9} className="mt-16">
          <motion.div style={reduced ? {} : { y: dashY }} className="relative">
            {/* Perspective container */}
            <div
              style={{
                perspective: "1200px",
                perspectiveOrigin: "50% 20%",
              }}
            >
              <motion.div
                initial={reduced ? {} : { rotateX: 18, opacity: 0, y: 40 }}
                animate={{ rotateX: 8, opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 1.0, ease }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Top highlight edge */}
                <div
                  className="absolute inset-x-0 top-0 z-10 h-px"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, transparent)",
                  }}
                />
                <DashboardScreen />
              </motion.div>
            </div>

            {/* Reflection / glow beneath */}
            <div
              className="pointer-events-none absolute inset-x-0 -bottom-20 z-0 h-40 opacity-30 blur-2xl"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(189,122,78,0.15), transparent)",
              }}
            />
          </motion.div>
        </FadeUp>
      </motion.div>
    </section>
  );
}
