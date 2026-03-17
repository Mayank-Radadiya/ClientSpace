"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSidebar } from "./SidebarContext";
import { useEffect, useState } from "react";

interface SidebarNavProps {
  title?: string;
  children: ReactNode;
}

export const SidebarNav = ({ title, children }: SidebarNavProps) => {
  const { open, animate } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showTitle = Boolean(title && (!animate || open));

  // Configuration for staggering the entrance of child links
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence initial={false}>
        {showTitle && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <span className="text-muted-foreground flex items-center gap-2 px-3 text-[11px] font-semibold tracking-wider uppercase">
              <span className="bg-border/60 h-px w-3" />
              {title}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial={mounted ? "hidden" : "visible"}
        animate={mounted ? "visible" : "visible"}
        className="flex flex-col gap-0.5"
      >
        {children}
      </motion.div>
    </div>
  );
};
