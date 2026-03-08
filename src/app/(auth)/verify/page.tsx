import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  const { type, email } = await searchParams;

  const heading = type === "reset" ? "Check your email" : "Verify your account";
  const desc =
    type === "reset"
      ? `We've sent a password reset link to ${email || "your email"}.`
      : `We've sent an account verification link to ${email || "your email"}. Please click the link to activate your account.`;

  return (
    <div className="relative container min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          ClientSpace
        </div>
      </div>
      <div className="flex h-screen w-full items-center justify-center lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
            <p className="text-muted-foreground text-sm">{desc}</p>
          </div>
          <div className="mt-4 flex justify-center">
            <Link href="/login" passHref>
              <Button variant="outline" className="w-full">
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
