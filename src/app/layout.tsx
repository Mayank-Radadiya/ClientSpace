import type { Metadata } from "next";
import { dmSans, jakarta, montserrat, geist } from "@/lib/fonts";
import "./globals.css";
import Provider from "@/provider/Provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

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
    <html
      className={`${dmSans.variable} ${jakarta.variable} ${montserrat.variable} ${geist.variable}`}
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
