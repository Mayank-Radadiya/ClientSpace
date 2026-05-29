import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

interface ClientHeaderProps {
  /** Effective brand name: org.brandName ?? org.name */
  orgName: string;
  /** Public logo URL from Supabase Storage */
  orgLogoUrl?: string;
  /** Logged-in client's display name */
  clientName: string;
}

export function ClientHeader({
  orgName,
  orgLogoUrl,
  clientName,
}: ClientHeaderProps) {
  async function handleSignOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="border-border bg-card border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        {/* Brand: logo image OR brand name as text */}
        <div className="flex items-center gap-3">
          {orgLogoUrl ? (
            /*
             * Explicit width/height prevents CLS (Cumulative Layout Shift).
             * max-height is controlled via className; width is auto so aspect ratio is preserved.
             * These props are required by next/image to compute the intrinsic size.
             */
            <Image
              src={orgLogoUrl}
              alt={orgName}
              width={120}
              height={32}
              className="h-8 w-auto max-w-[140px] object-contain"
              priority
            />
          ) : (
            <span
              className="text-foreground truncate text-xl font-medium"
              style={{ fontWeight: 500 }}
            >
              {orgName}
            </span>
          )}
        </div>

        {/* Right side: client name + sign-out */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground hidden truncate text-sm sm:block">
            {clientName}
          </span>
          <form action={handleSignOut}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="portal-accent-ring"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
