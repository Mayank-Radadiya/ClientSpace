"use client";

import type { Variants, Transition } from "motion/react";

/* ─── Shared transitions ─────────────────────────────────── */

export const ease = [0.22, 1, 0.36, 1] as const;
export const springEase: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 25,
  restDelta: 0.001,
};

/* ─── Fade up (used for scroll reveals) ──────────────────── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.07,
      ease,
    },
  }),
};

/* ─── Fade up with spring settle ─────────────────────────── */

export const fadeUpSpring: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 80, damping: 18, mass: 0.8 },
  },
};

/* ─── Stagger container ──────────────────────────────────── */

export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

/* ─── Scale + fade (hero elements) ───────────────────────── */

export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease },
  },
};

/* ─── Slide up from below (line-by-line hero text) ───────── */

export const slideUpLine: Variants = {
  hidden: { y: "105%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease },
  },
};

/* ─── Count-up spring target ─────────────────────────────── */

export const springTarget: Transition = {
  type: "spring",
  stiffness: 60,
  damping: 14,
  restDelta: 0.5,
};

/* ─── Card hover (lift + border glow) ────────────────────── */

export const cardHover = {
  rest: { y: 0, borderColor: "rgba(255,255,255,0.08)" },
  hover: {
    y: -2,
    borderColor: "rgba(226,121,61,0.4)",
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

/* ─── Nav underline draw ─────────────────────────────────── */

export const navUnderline = {
  rest: { scaleX: 0 },
  hover: { scaleX: 1, transition: { duration: 0.2, ease: "easeOut" } },
};
