"use client";

import React from "react";
import { motion } from "framer-motion";

export function EditorialTicker() {
  const words = [
    "Project Management",
    "✦",
    "File Proofing",
    "✦",
    "Invoicing",
    "✦",
    "Client Portals",
    "✦",
    "Proposals",
    "✦",
    "Contracts",
    "✦",
  ];

  // Double the array for seamless looping
  const items = [...words, ...words];

  return (
    <div className="w-full overflow-hidden bg-lp-text py-4 flex whitespace-nowrap border-y border-lp-border">
      <motion.div
        animate={{ x: [0, "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        className="flex gap-8 items-center"
      >
        {items.map((word, idx) => (
          <span
            key={idx}
            className={`font-mono text-xs tracking-[0.2em] uppercase ${
              word === "✦" ? "text-lp-accent" : "text-lp-bg opacity-70"
            }`}
          >
            {word}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
