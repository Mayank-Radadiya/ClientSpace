import { getUser } from "@/lib/auth/getUser";

export const metadata = { title: "Settings — Client Portal" };

export default async function ClientSettingsPage() {
  const user = await getUser();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account preferences.
        </p>
      </header>

      <div className="rounded-lg border bg-white/50 p-6 backdrop-blur-sm dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold">Account Information</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Email
            </label>
            <p className="mt-1">{user?.email}</p>
          </div>
          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Name
            </label>
            <p className="mt-1">{user?.user_metadata?.name ?? "Not set"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white/50 p-6 backdrop-blur-sm dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Password change and security settings coming soon.
        </p>
      </div>
    </div>
  );
}
