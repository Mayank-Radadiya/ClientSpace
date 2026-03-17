"use client";

import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface MobileSidebarProps extends React.ComponentProps<"div"> {}

export const MobileSidebar = ({
  className,
  children,
  ...rest
}: MobileSidebarProps) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <div
        className={cn(
          "flex h-14 w-full flex-col items-center justify-between border-b border-neutral-200/50 bg-white/80 backdrop-blur-xl py-2 px-4 shadow-sm dark:border-neutral-800/50 dark:bg-neutral-950/80 md:hidden",
          className
        )}
        {...rest}
      >
        <div className="flex items-center w-full justify-between">
          {children && (
            <Link href="/" className="group flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-background via-background to-background backdrop-blur-sm overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent opacity-80"></div>
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={28}
                  height={28}
                  className="relative z-10"
                />
              </div>
              <span className="bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                Flow
                <span className="text-primary/90 font-bold text-xl ml-0.5 font-mono">
                  X
                </span>
              </span>
            </Link>
          )}
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col gap-6 border-r border-neutral-200/50 bg-white/95 backdrop-blur-xl px-4 py-6 shadow-2xl dark:border-neutral-800/50 dark:bg-neutral-950/95 md:hidden"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <motion.button
                type="button"
                onClick={() => setOpen(false)}
                className="self-end rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <X size={18} />
              </motion.button>
              {children}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
