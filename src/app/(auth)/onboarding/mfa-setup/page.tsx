import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Set up MFA",
};

/**
 * MFA enrollment page for admins/owners who haven't enrolled yet.
 * ponytail: this is a stub — the actual enrollment UI depends on your TOTP component.
 * The important thing is this route exists and does NOT go through the MFA enforcement gate.
 */
export default async function MfaSetupPage() {
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
        <h1 className="text-2xl font-bold">Set up two-factor authentication</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Your organization requires MFA for admin and owner roles.
          Please set up a TOTP authenticator app to continue.
        </p>
        {/* TODO: Add TOTP enrollment component here — Supabase MFA factor enrollment */}
        <p className="text-sm text-neutral-500">
          Use an authenticator app like Google Authenticator, Authy, or 1Password
          to scan the QR code that will appear here.
        </p>
      </div>
    </main>
  );
}
