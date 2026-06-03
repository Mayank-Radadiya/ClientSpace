import type { Metadata } from "next";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "ClientSpace | The client portal for agencies",
  description: "Replace scattered email chains and PDF invoices with a single, beautiful client portal.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-indigo-500/30">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
