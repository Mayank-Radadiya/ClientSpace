"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

import { Moon, Sun } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

type ThemeToggleButtonProps = {
  className?: string;
};

export const ThemeToggleButton = ({ className }: ThemeToggleButtonProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark" || theme === "dark";

  const onToggle = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme = isDark ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    const { left, top, width, height } =
      buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const maxDistance = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY),
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${centerX}px ${centerY}px)`,
            `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
          ],
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }, [isDark, setTheme]);

  if (!mounted) {
    return (
      <button
        className={cn(
          "bg-background/30 border-border/40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-sm backdrop-blur-md outline-none",
          className,
        )}
        type="button"
        aria-label="Switch theme"
      >
        <span className="opacity-0">
          <Sun className="h-5 w-5" />
        </span>
      </button>
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      aria-label="Switch theme"
      className={cn(
        "bg-background/30 border-border/40 hover:bg-background/80 focus-visible:ring-primary flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
      type="button"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: 25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-white"
          >
            <Sun className="h-5 w-5" />
          </motion.span>
        ) : (
          <motion.span
            key="moon-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-black"
          >
            <Moon className="h-5 w-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};
