import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "ClientSpace | The client portal for design studios",
  description:
    "Replace scattered email chains and PDF invoices with a single, beautiful client portal for your design studio.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="meridian selection:bg-lp-accent/20 flex min-h-screen flex-col antialiased">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
