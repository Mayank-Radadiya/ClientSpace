import { Metadata } from "next";
import VerifyForm from "@/features/auth/components/verify/VerifyForm";

export const metadata: Metadata = {
  title: "Verify your email - ClientSpace",
  description: "Check your email for the verification link",
};

interface VerifyPageProps {
  searchParams: {
    type?: string;
    email?: string;
  };
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const type = params?.type;
  const email = params?.email;

  const heading = type === "reset" ? "Check your email" : "Verify your account";
  const desc =
    type === "reset"
      ? `We've sent a password reset link to ${email || "your email"}.`
      : `We've sent an account verification link to ${email || "your email"}. Please click the link to activate your account.`;

  return (
    <div className="w-full">
      <VerifyForm heading={heading} desc={desc} />
    </div>
  );
}
