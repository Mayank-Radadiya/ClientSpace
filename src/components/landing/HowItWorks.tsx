"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { SectionMeta } from "./SectionMeta";

const STEPS = [
  {
    num: "01",
    code: "PAGE",
    title: "Role Up a New Project",
    desc: "Create a project in under 60 seconds. Add your client, set milestones, and share the invite link.",
  },
  {
    num: "02",
    code: "DETECT",
    title: "Client Joins Instantly",
    desc: "No account creation required. Your client lands on a branded dashboard with exactly what they need.",
  },
  {
    num: "03",
    code: "RESOLVE",
    title: "Collaborate in Context",
    desc: "Comments, approvals, and files — all pinned to the right place. No more searching for that one Slack thread.",
  },
  {
    num: "04",
    code: "CLOSE",
    title: "Milestone Complete, Paid",
    desc: "Mark work done. Invoice auto-sends. Payment lands in your account. Move on to the next project.",
  },
];

const LOG_LINES = [
  {
    time: "03:17:42",
    msg: "► project.create studio:acme-brand-refresh",
    highlight: false,
  },
  {
    time: "03:17:42",
    msg: "► client.invite email:hi@acme.com",
    highlight: false,
  },
  {
    time: "03:17:44",
    msg: "► client.accept project:acme-brand-refresh ✓",
    highlight: true,
  },
  {
    time: "03:17:48",
    msg: "► milestone.set 01:brand-guidelines due:2026-02-15",
    highlight: false,
  },
  {
    time: "03:17:52",
    msg: "► asset.upload wireframes-v2 (12 files)",
    highlight: false,
  },
  {
    time: "03:17:56",
    msg: "► approval.request client:hi@acme.com",
    highlight: false,
  },
  {
    time: "03:18:01",
    msg: "► approval.granted wireframes-v2 ✓",
    highlight: true,
  },
  {
    time: "03:18:05",
    msg: "► invoice.generate INV-2026-0042",
    highlight: false,
  },
];

function TypewriterLog({ stepIndex }: { stepIndex: number }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    const counts = [2, 4, 6, 8];
    const timer = setTimeout(() => setVisible(counts[stepIndex] ?? 2), 100);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  return (
    <div className="space-y-0.5 p-4 font-data text-[11px] leading-[1.8]">
      {LOG_LINES.slice(0, visible).map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className={`h-5 whitespace-nowrap ${line.highlight ? "-mx-3 bg-cs-hairline px-3 text-cs-ink" : "text-cs-faint"}`}
          style={{ lineHeight: "20px" }}
        >
          <span className="text-cs-faint/70">{line.time}</span> {line.msg}
        </motion.div>
      ))}
      {Array.from({ length: Math.max(0, 8 - visible) }).map((_, i) => (
        <div key={`fill-${i}`} className="h-5" style={{ lineHeight: "20px" }} />
      ))}
    </div>
  );
}

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="section-wrapper">
      <SectionMeta
        code="NIGHT SHIFT"
        sheet="1"
        total="1"
        location="03:17 UTC"
      />

      <h2 className="font-display mt-16 mb-16 text-[clamp(36px,5vw,64px)] leading-[1] tracking-[-0.01em] text-cs-ink italic">
        Six minutes, one page,
        <br />
        no laptop.
      </h2>

      <div className="grid gap-16 md:grid-cols-2">
        <div className="space-y-24">
          {STEPS.map((step, i) => (
            <div key={step.num}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                onViewportEnter={() => setActiveStep(i)}
                className="space-y-3"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-data text-[12px] text-cs-faint">
                    {step.num} ·
                  </span>
                  <span className="font-data text-[10px] tracking-[0.1em] text-cs-faint uppercase">
                    {step.code}
                  </span>
                </div>
                <h3 className="font-sans text-[22px] font-medium text-cs-ink">
                  {step.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-cs-ink-muted">
                  {step.desc}
                </p>
                <div className="border-b border-cs-hairline pt-4" />
              </motion.div>
            </div>
          ))}
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <div className="border border-cs-line-strong bg-cs-bg">
            <div className="flex items-center justify-between border-b border-cs-line-strong px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cs-line-strong" />
                <span className="font-data text-[9px] tracking-[0.15em] text-cs-faint uppercase">
                  meridian/log · api.payments · sev-2
                </span>
              </div>
              <span className="font-data text-[8px] tracking-[0.15em] text-cs-ink-muted uppercase">
                [LIVE]
              </span>
            </div>
            <div className="min-h-[176px]">
              <TypewriterLog stepIndex={activeStep} />
            </div>
          </div>
          <div className="mt-4 text-center font-data text-[10px] tracking-[0.15em] text-cs-faint uppercase">
            NOW SHOWING · {STEPS[activeStep]?.code ?? "PAGE"} &nbsp;&nbsp; STEP{" "}
            {activeStep + 1} / 4
          </div>
        </div>
      </div>
    </section>
  );
}
