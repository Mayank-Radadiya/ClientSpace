import { Metadata } from "next";
import VerifyOtpForm from "@/features/auth/components/verify/VerifyOtpForm";

export const metadata: Metadata = {
  title: "Verify your email",
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

  if (!email || !type) {
    return (
      <div className="flex w-full justify-center p-8 text-center">
        <p className="text-muted-foreground">
          Invalid verification request. Missing email or type parameters.
        </p>
      </div>
    );
  }

  // Ensure type is strongly typed to the expected literal union
  const actionType = type === "recovery" ? "recovery" : "signup";

  return (
    <div className="w-full">
      <VerifyOtpForm email={email} type={actionType} />
    </div>
  );
}
