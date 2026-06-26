"use client";

import { motion } from "motion/react";
import AuthCard from "../AuthCard";
import SignUpFormFields from "./SignUpFormFields";

export function SignupForm() {
  return (
    <div className="w-full">
      {/* Animated container for smooth entry */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="relative z-10 w-full"
      >
        {/* AuthCard switches UI copy and links for sign-up */}
        <AuthCard formType="sign-up">
          {/* Sign-up form inputs and submission logic */}
          <SignUpFormFields />
        </AuthCard>
      </motion.div>
    </div>
  );
}
