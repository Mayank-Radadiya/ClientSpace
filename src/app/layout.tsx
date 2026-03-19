import type { Metadata } from "next";

import "./globals.css";
import Provider from "@/provider/Provider";
import { TRPCProvider } from "@/lib/trpc/provider";

export const metadata: Metadata = {
  title: "ClientSpace",
  description: "Client Portal for Freelancers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground h-full min-h-screen w-full font-sans antialiased">
        <TRPCProvider>
          <Provider>{children}</Provider>
        </TRPCProvider>
      </body>
    </html>
  );
}
