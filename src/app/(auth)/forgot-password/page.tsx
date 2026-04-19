import { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your ClientSpace account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full">
      <ForgotPasswordForm />
    </div>
  );
}
