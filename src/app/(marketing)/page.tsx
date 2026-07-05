import { Hero } from "@/components/landing/Hero";
import { GlanceSpec } from "@/components/landing/GlanceSpec";
import { AlertStats } from "@/components/landing/AlertStats";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Comparison } from "@/components/landing/Comparison";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <GlanceSpec />
      <AlertStats />
      <HowItWorks />
      <Comparison />
      <Testimonials />
      <Pricing />
    </>
  );
}
