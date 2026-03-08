"use client";

import { motion } from "framer-motion";
import AuthCard from "../AuthCard";
import LoginFormFields from "./LoginFormFields";

export function LoginForm() {
  return (
    <div className="w-full">
      {/* Animated container for smooth entry */}
      <motion.div
        initial={{ opacity: 0, y: 15 }} // Modest slide upward
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }} // Crisp entrance timing
        className="relative z-10 w-full"
      >
        {/* AuthCard switches UI copy and links for login */}
        <AuthCard formType="login">
          {/* Sign-up form inputs and submission logic */}
          <LoginFormFields />
        </AuthCard>
      </motion.div>
    </div>
  );
}
