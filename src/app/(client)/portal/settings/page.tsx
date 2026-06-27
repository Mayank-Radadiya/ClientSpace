import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsPageClient } from "./SettingsPageClient";

export const metadata = { title: "Settings" };

export default async function PortalSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <SettingsPageClient
      email={user.email ?? ""}
      name={user.user_metadata?.full_name ?? ""}
      avatarUrl={user.user_metadata?.avatar_url ?? null}
    />
  );
}
