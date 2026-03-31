import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInvitationByToken } from "@/features/clients/server/queries";
import { ClientAuthForm } from "@/features/client-auth/components/ClientAuthForm";

export const metadata = {
  title: "Client Portal Access - ClientSpace",
  description: "Access your client portal invitation",
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ClientAuthPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;

  // Validate token exists in URL
  if (!token || typeof token !== "string") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-destructive/10 border-destructive/20 text-destructive w-full max-w-md rounded-xl border p-6 text-center">
          <h2 className="mb-2 text-xl font-bold">Invalid Invitation Link</h2>
          <p className="text-muted-foreground mb-4">
            The invitation link appears to be invalid or incomplete.
          </p>
          <p className="text-sm">
            Please contact the organization that invited you for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Fetch and validate invitation
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-destructive/10 border-destructive/20 text-destructive w-full max-w-md rounded-xl border p-6 text-center">
          <h2 className="mb-2 text-xl font-bold">Invitation Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This invitation link may have expired, been revoked, or already been
            accepted.
          </p>
          <p className="text-sm">
            Please contact{" "}
            <strong className="text-foreground">the organization</strong> for a
            new invitation.
          </p>
        </div>
      </div>
    );
  }

  // // Check if user is already authenticated
  // const supabase = await createClient();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // If user is already authenticated and has accepted this invite, redirect appropriately
  // Note: We let the form handle acceptance even if logged in (multi-org scenario)

  // Render client authentication form
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <ClientAuthForm invitation={invitation} token={token} />
    </main>
  );
}
