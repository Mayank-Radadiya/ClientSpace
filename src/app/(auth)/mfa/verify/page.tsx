import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Verify MFA",
};

/**
 * MFA verification page for users who have enrolled but haven't completed
 * the challenge for this session (aal1 → aal2).
 * ponytail: stub — actual TOTP challenge UI goes here.
 */
export default async function MfaVerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-neutral-200 bg-white p-8 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-bold">Verify your identity</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Enter the 6-digit code from your authenticator app to continue.
        </p>
        {/* TODO: Add TOTP challenge/verify component here — Supabase MFA challenge */}
      </div>
    </main>
  );
}
