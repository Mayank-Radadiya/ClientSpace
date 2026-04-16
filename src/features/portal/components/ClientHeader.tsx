import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

interface ClientHeaderProps {
  orgName: string;
  orgLogoUrl?: string;
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
        <div className="flex items-center gap-3">
          {orgLogoUrl ? (
            <Image
              src={orgLogoUrl}
              alt={`${orgName} logo`}
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
            />
          ) : (
            <span className="text-foreground text-xl font-semibold">
              {orgName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground hidden text-sm sm:block">
            {clientName}
          </span>
          <form action={handleSignOut}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
