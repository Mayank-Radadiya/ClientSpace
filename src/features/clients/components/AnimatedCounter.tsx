import { motion } from "motion/react";
import { CUBIC_BEZIER } from "../constants";

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number | string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: CUBIC_BEZIER }}
      className="inline-block"
    >
      {prefix}
      {value}
      {suffix}
    </motion.span>
  );
}
