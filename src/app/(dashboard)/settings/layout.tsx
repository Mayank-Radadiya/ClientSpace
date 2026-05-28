// src/app/(dashboard)/settings/layout.tsx
// Minimal layout wrapper for all settings sub-pages.
// Inherits the outer DashboardLayout (auth + sidebar) automatically.

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">{children}</div>
  );
}
