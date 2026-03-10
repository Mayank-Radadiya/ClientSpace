import { SignupForm } from "@/features/auth/components/SignUp/SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Account - ClientSpace",
  description: "Sign up for ClientSpace",
};

export default function SignupPage() {
  return <SignupForm />;
}
