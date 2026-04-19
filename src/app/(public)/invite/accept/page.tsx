import { redirect } from "next/navigation";
import { getInvitationByToken } from "@/features/clients/server/queries";
import { AcceptInviteForm } from "@/features/clients/components/AcceptInviteForm";

export const metadata = {
  title: "Accept Invitation",
  description: "Accept your client portal invitation",
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AcceptInvitePage({ searchParams }: PageProps) {
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

  // Render acceptance form
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <AcceptInviteForm invitation={invitation} token={token} />
    </main>
  );
}
