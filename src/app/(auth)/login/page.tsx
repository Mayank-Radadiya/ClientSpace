import { LoginForm } from "@/features/auth/components/Login/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - ClientSpace",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return <LoginForm />;
}
