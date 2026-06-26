"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building, Paintbrush, Globe, CreditCard, Bell, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { label: "Profile", href: "/settings/profile", icon: User },
  { label: "Business", href: "/settings/business", icon: Building },
  { label: "Branding", href: "/settings/branding", icon: Paintbrush },
  { label: "Domain", href: "/settings/domain", icon: Globe },
  { label: "Billing", href: "/settings/billing", icon: CreditCard },
  { label: "Notifications", href: "/settings/notifications", icon: Bell },
  { label: "Appearance", href: "/settings/appearance", icon: Palette },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:gap-8 md:px-8">
      {/* Mobile navigation: horizontal scrolling menu */}
      <div className="md:hidden border-b border-[var(--inv-divider)] pb-2 overflow-x-auto hide-scrollbar flex gap-1.5 shrink-0">
        {SETTINGS_NAV.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all shrink-0 border",
                isActive
                  ? "bg-[var(--inv-accent-primary)] text-white border-[var(--inv-accent-primary)] shadow-sm"
                  : "border-[var(--inv-divider)] bg-[var(--inv-surface)] text-[var(--inv-text-muted)] hover:border-[var(--inv-text-primary)] hover:text-[var(--inv-text-primary)]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Desktop side navigation */}
      <nav className="hidden w-56 shrink-0 flex-col gap-1 md:flex">
        <p className="text-[var(--inv-text-muted)] mb-4 px-3 text-[11px] font-bold tracking-widest uppercase">
          Settings
        </p>
        <div className="space-y-1">
          {SETTINGS_NAV.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all",
                  isActive
                    ? "bg-[var(--inv-accent-primary)] text-white shadow-md dark:shadow-[0_0_15px_rgba(79,127,255,0.25)]"
                    : "text-[var(--inv-text-muted)] hover:bg-[var(--inv-surface-elevated)] hover:text-[var(--inv-text-primary)]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content pane */}
      <div className="min-w-0 flex-1 bg-[var(--inv-surface)] rounded-2xl border border-[var(--inv-divider)] p-6 md:p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
