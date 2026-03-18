"use client";

import React from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LoaderProps {
  message?: string;
}

export const PageLoader: React.FC<LoaderProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-white shadow-sm dark:bg-zinc-900"
      >
        <Image
          src="/logo.svg"
          alt="FlowX Logo"
          width={28}
          height={28}
          className="drop-shadow-sm"
          priority
        />
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-muted-foreground flex items-center gap-2.5 text-sm font-medium"
        >
          <Loader2 className="text-primary h-4 w-4 animate-spin" />
          <span>{message}</span>
        </motion.div>
      )}
    </div>
  );
};
