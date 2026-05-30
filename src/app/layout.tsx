import type { Metadata, Viewport } from "next";
import {
  dmSans,
  jakarta,
  montserrat,
  geist,
  syne,
  dmMono,
  barlowCondensed,
} from "@/lib/fonts";
import "./globals.css";
import Provider from "@/provider/Provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export async function generateMetadata(): Promise<Metadata> {
  // Determine plan tier from session context (defaults to starter for unauthenticated pages)
  let isStarter = true;
  try {
    const { getSessionContext } = await import("@/lib/auth/session");
    const session = await getSessionContext();
    if (session?.orgId) {
      const { createDrizzleClient } = await import("@/db/createDrizzleClient");
      const { organizations } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const db = await createDrizzleClient();
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, session.orgId),
        columns: { plan: true },
      });
      isStarter = !org?.plan || org.plan === "starter";
    }
  } catch {
    // Unauthenticated pages — default to starter behavior
  }

  const base =
    "Manage your client projects, invoices, and file approvals - all in one place.";
  const description = isStarter ? `${base} Powered by ClientSpace.` : base;

  const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://clientspace.app";
  const appUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  return {
    title: {
      template: "%s | ClientSpace",
      default: "ClientSpace - Client Portal & Project Management",
    },
    description,
    metadataBase: new URL(appUrl),
    openGraph: {
      title: "ClientSpace",
      description:
        "Client portal and project management for freelancers and agencies.",
      url: appUrl,
      siteName: "ClientSpace",
      type: "website",
      // images: [{ url: "/og-image.png", width: 1200, height: 630 }], // Phase 2
    },
    twitter: {
      card: "summary_large_image",
      title: "ClientSpace",
      description:
        "Client portal and project management for freelancers and agencies.",
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`${dmSans.variable} ${jakarta.variable} ${montserrat.variable} ${geist.variable} ${syne.variable} ${dmMono.variable} ${barlowCondensed.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground h-full min-h-screen w-full font-sans antialiased">
        <NuqsAdapter>
          <TRPCProvider>
            <Provider>{children}</Provider>
          </TRPCProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
